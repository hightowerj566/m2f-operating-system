// M2F OS · Flagship journey day resolver.
// Given a member's due date (± baby's arrival date + any active coach program)
// and the current local calendar day, return which flagship program day they
// belong on right now — or the correct pre-program / birth-window /
// post-birth / needs-due-date state.

import { differenceInCalendarDays, startOfDay, addDays, format } from "date-fns";
import {
  FLAGSHIP_POST_BIRTH_STAGES,
  PRE_BIRTH_JOURNEY_LENGTH_DAYS,
  getFlagshipDay,
  getFlagshipPostBirthDay,
  stageForProgramDay,
  type FlagshipDay,
  type FlagshipPostBirthDay,
} from "@/lib/training/flagshipJourney";

export interface JourneyResolveInputs {
  dueDate?: string | Date | null;
  babyArrivedAt?: string | Date | null;
  /** Present only when a non-flagship coach program is active. */
  coachAssignment?: {
    programId: string;
    programName: string;
    currentDay: number;
    totalDays: number;
  } | null;
  now?: Date;
}

export type FlagshipJourneyDayResult =
  | {
      status: "active";
      programDay: number;
      daysUntilDueDate: number;
      stageId: string;
      stageDay: number;
      programWeek: number;
      pregnancyWeek: number;
      dayContentId: string;
      scheduledDate: string;
      day: FlagshipDay;
    }
  | {
      status: "pre-program";
      programDay: 1;
      daysUntilProgramStart: number;
      scheduledStartDate: string;
    }
  | {
      status: "post-due-date";
      daysPastDueDate: number;
      awaitingBirthConfirmation: true;
    }
  | {
      status: "post-birth";
      postpartumDay: number;
      stageId: string;
      dayContentId: string;
      day: FlagshipPostBirthDay | null;
    }
  | {
      status: "coach-override";
      coachProgramDay: number;
      coachProgramName: string;
      /** The flagship day preserved in the background, when derivable. */
      flagshipProgramDay: number | null;
    }
  | { status: "needs-due-date" };

function toDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  return typeof d === "string" ? new Date(d) : d;
}

/** Timezone-safe calendar-day diff (positive = target is after ref). */
function calendarDaysBetween(target: Date, ref: Date): number {
  return differenceInCalendarDays(startOfDay(target), startOfDay(ref));
}

export function getFlagshipJourneyDay(
  input: JourneyResolveInputs,
): FlagshipJourneyDayResult {
  const now = input.now ?? new Date();

  // Coach-assigned custom program takes priority — but only when it is not the
  // flagship itself. We preserve the flagship day when derivable so the coach
  // can hand the member back later at the correct spot.
  const coach = input.coachAssignment;
  const dueDate = toDate(input.dueDate);
  const birth = toDate(input.babyArrivedAt);

  if (coach && coach.programName !== "M2F Guided Journey") {
    let flagshipDay: number | null = null;
    if (dueDate) {
      const daysUntil = calendarDaysBetween(dueDate, now);
      const raw = PRE_BIRTH_JOURNEY_LENGTH_DAYS - daysUntil + 1;
      flagshipDay = Math.min(
        PRE_BIRTH_JOURNEY_LENGTH_DAYS,
        Math.max(1, raw),
      );
    }
    return {
      status: "coach-override",
      coachProgramDay: coach.currentDay,
      coachProgramName: coach.programName,
      flagshipProgramDay: flagshipDay,
    };
  }

  // Post-birth wins over pregnancy math when birth is confirmed.
  if (birth) {
    const postpartumDay = calendarDaysBetween(now, birth) + 1;
    if (postpartumDay >= 1) {
      const day = getFlagshipPostBirthDay(postpartumDay);
      const stage =
        FLAGSHIP_POST_BIRTH_STAGES.find(
          (s) =>
            postpartumDay >= s.postpartumDayStart &&
            (s.postpartumDayEnd == null || postpartumDay <= s.postpartumDayEnd),
        ) ?? FLAGSHIP_POST_BIRTH_STAGES[FLAGSHIP_POST_BIRTH_STAGES.length - 1];
      return {
        status: "post-birth",
        postpartumDay,
        stageId: stage.id,
        dayContentId: day
          ? `post-birth-day-${postpartumDay}`
          : `post-birth-day-${postpartumDay}`,
        day,
      };
    }
  }

  if (!dueDate) return { status: "needs-due-date" };

  const daysUntilDueDate = calendarDaysBetween(dueDate, now);
  const raw = PRE_BIRTH_JOURNEY_LENGTH_DAYS - daysUntilDueDate + 1;

  // Joined more than 252 days before due date → pre-program onboarding.
  if (raw < 1) {
    const daysUntilProgramStart = 1 - raw;
    const scheduledStart = addDays(startOfDay(now), daysUntilProgramStart);
    return {
      status: "pre-program",
      programDay: 1,
      daysUntilProgramStart,
      scheduledStartDate: format(scheduledStart, "yyyy-MM-dd"),
    };
  }

  // Past the due date and no birth confirmed → birth-window.
  if (raw > PRE_BIRTH_JOURNEY_LENGTH_DAYS) {
    return {
      status: "post-due-date",
      daysPastDueDate: raw - PRE_BIRTH_JOURNEY_LENGTH_DAYS,
      awaitingBirthConfirmation: true,
    };
  }

  const programDay = raw;
  const day = getFlagshipDay(programDay);
  const stage = stageForProgramDay(programDay);
  return {
    status: "active",
    programDay,
    daysUntilDueDate,
    stageId: stage?.id ?? day?.stageId ?? "prebirth-foundation",
    stageDay: day?.stageDay ?? 1,
    programWeek: day?.weekNumber ?? Math.ceil(programDay / 7),
    pregnancyWeek: day?.pregnancyWeek ?? 4,
    dayContentId: `flagship-day-${programDay}`,
    scheduledDate: format(startOfDay(now), "yyyy-MM-dd"),
    day: day!,
  };
}
