import { validateTrainingContent } from "../src/lib/training/validateTrainingContent";

const report = validateTrainingContent();

for (const warning of report.warnings) console.warn(`WARNING:\n${warning}`);
for (const error of report.errors) console.error(`ERROR:\n${error}`);

console.log(
  JSON.stringify(
    {
      ok: report.ok,
      workouts: report.workoutCount,
      exercises: report.exerciseCount,
      prescriptions: report.prescriptionCount,
      preBirthDays: report.journeyDayCount,
      postBirthDays: report.postBirthDayCount,
    },
    null,
    2,
  ),
);

if (!report.ok) process.exitCode = 1;
