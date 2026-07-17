import { loadTrainingContent } from "@/lib/training/loadTrainingContent";

const FLAGSHIP_NAMES = new Set([
  "M2F Guided Journey",
  "M2F Flagship Guided Journey",
]);

export function isFlagshipProgram(programId?: string | null, programName?: string | null): boolean {
  const content = loadTrainingContent();
  return programId === content.programId || Boolean(programName && FLAGSHIP_NAMES.has(programName));
}
