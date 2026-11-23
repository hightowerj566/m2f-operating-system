// Demo roadmap checks are device-local and completely separate from the real
// user_milestones rows. Entering or exiting Demo Mode must never delete real
// roadmap progress.

type DemoCompletions = Record<string, string>;

const storageKey = (userId: string) => `m2f-demo-roadmap:${userId}`;

export function readDemoRoadmap(userId: string): DemoCompletions {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

export function setDemoMilestone(userId: string, milestoneId: string, complete: boolean) {
  const completions = readDemoRoadmap(userId);
  if (complete) completions[milestoneId] = new Date().toISOString();
  else delete completions[milestoneId];
  localStorage.setItem(storageKey(userId), JSON.stringify(completions));
}

export function clearDemoRoadmap(userId: string) {
  localStorage.removeItem(storageKey(userId));
}
