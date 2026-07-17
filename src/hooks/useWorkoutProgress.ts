import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkoutVersionKey } from "@/lib/training/types";

export interface WorkoutSetProgress {
  memberId: string;
  programId: string;
  programDay: number;
  workoutId: string;
  workoutVersion: WorkoutVersionKey;
  exerciseId: string;
  setNumber: number;
  completed: boolean;
  repsCompleted: number | null;
  load: number | null;
  rpe: number | null;
  notes: string;
  skipped: boolean;
  substitutionId: string | null;
  completedAt: string | null;
}

interface ProgressScope {
  memberId: string;
  programId: string;
  programDay: number;
  workoutId: string;
  workoutVersion: WorkoutVersionKey;
}

const setKey = (exerciseId: string, setNumber: number) => `${exerciseId}:${setNumber}`;
const storageKey = (scope: ProgressScope) =>
  [
    "m2f.workout-progress.v1",
    scope.memberId,
    scope.programId,
    scope.programDay,
    scope.workoutId,
    scope.workoutVersion,
  ].join(":");

function readProgress(scope: ProgressScope): Record<string, WorkoutSetProgress> {
  const raw = localStorage.getItem(storageKey(scope));
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object"
      ? (value as Record<string, WorkoutSetProgress>)
      : {};
  } catch {
    return {};
  }
}

export function useWorkoutProgress(scope: ProgressScope) {
  const stableScope = useMemo(
    () => ({
      memberId: scope.memberId,
      programId: scope.programId,
      programDay: scope.programDay,
      workoutId: scope.workoutId,
      workoutVersion: scope.workoutVersion,
    }),
    [scope.memberId, scope.programDay, scope.programId, scope.workoutId, scope.workoutVersion],
  );
  const key = storageKey(stableScope);
  const [progress, setProgress] = useState<Record<string, WorkoutSetProgress>>(() =>
    readProgress(stableScope),
  );

  useEffect(() => {
    setProgress(readProgress(stableScope));
  }, [key, stableScope]);

  const updateSet = useCallback(
    (
      exerciseId: string,
      setNumber: number,
      patch: Partial<Omit<WorkoutSetProgress, keyof ProgressScope | "exerciseId" | "setNumber">>,
    ) => {
      setProgress((current) => {
        const id = setKey(exerciseId, setNumber);
        const previous = current[id];
        const nextRecord: WorkoutSetProgress = {
          ...stableScope,
          exerciseId,
          setNumber,
          completed: false,
          repsCompleted: null,
          load: null,
          rpe: null,
          notes: "",
          skipped: false,
          substitutionId: null,
          completedAt: null,
          ...previous,
          ...patch,
        };
        if (patch.completed === true && !nextRecord.completedAt) {
          nextRecord.completedAt = new Date().toISOString();
        }
        if (patch.completed === false) nextRecord.completedAt = null;
        const next = { ...current, [id]: nextRecord };
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key, stableScope],
  );

  const getSet = useCallback(
    (exerciseId: string, setNumber: number) => progress[setKey(exerciseId, setNumber)],
    [progress],
  );

  const completedSetCount = useMemo(
    () => Object.values(progress).filter((set) => set.completed || set.skipped).length,
    [progress],
  );

  return { progress, getSet, updateSet, completedSetCount };
}
