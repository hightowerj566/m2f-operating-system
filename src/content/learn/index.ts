import type { Category, Lesson } from "./types";
import { pregnancyLessons } from "./pregnancy";
import { hospitalLessons } from "./hospital";
import { newbornLessons } from "./newborn";
import { partnerLessons } from "./partner";
import { homeLessons } from "./home";
import { financeLessons } from "./finance";
import { identityLessons } from "./identity";

export const LEARN_CATEGORIES: Category[] = [
  {
    slug: "pregnancy",
    emoji: "👶",
    title: "Pregnancy & Baby Development",
    tagline: "Understand every week of the pregnancy.",
    tint: "220 60% 55%",
  },
  {
    slug: "hospital",
    emoji: "🏥",
    title: "Hospital Preparation",
    tagline: "Walk in ready. Walk out with your family.",
    tint: "180 55% 45%",
  },
  {
    slug: "newborn",
    emoji: "👨‍🍼",
    title: "Newborn Care",
    tagline: "Confident hands from day one.",
    tint: "30 80% 55%",
  },
  {
    slug: "partner",
    emoji: "❤️",
    title: "Supporting Your Partner",
    tagline: "Be the partner she needed all along.",
    tint: "350 70% 55%",
  },
  {
    slug: "home",
    emoji: "🏠",
    title: "Preparing Your Home",
    tagline: "A house that works for a newborn.",
    tint: "160 45% 45%",
  },
  {
    slug: "finance",
    emoji: "💰",
    title: "Financial Preparation",
    tagline: "The money conversations most guys avoid.",
    tint: "45 85% 55%",
  },
  {
    slug: "identity",
    emoji: "🧠",
    title: "Becoming the Father You Want to Be",
    tagline: "The inner work that changes everything.",
    tint: "270 55% 60%",
  },
];

export const ALL_LESSONS: Lesson[] = [
  ...pregnancyLessons,
  ...hospitalLessons,
  ...newbornLessons,
  ...partnerLessons,
  ...homeLessons,
  ...financeLessons,
  ...identityLessons,
];

export function lessonsByCategory(slug: string): Lesson[] {
  return ALL_LESSONS.filter((l) => l.categorySlug === slug);
}

export function findLesson(slug: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}

export function findCategory(slug: string): Category | undefined {
  return LEARN_CATEGORIES.find((c) => c.slug === slug);
}

export function recommendedForWeek(week: number | null, limit = 5): Lesson[] {
  if (week == null) {
    return ALL_LESSONS.filter((l) => l.weekRange[0] <= 12).slice(0, limit);
  }
  const inRange = ALL_LESSONS.filter((l) => week >= l.weekRange[0] && week <= l.weekRange[1]);
  // Prefer lessons whose window is tighter around this week.
  return inRange
    .slice()
    .sort((a, b) => (a.weekRange[1] - a.weekRange[0]) - (b.weekRange[1] - b.weekRange[0]))
    .slice(0, limit);
}

export function searchLessons(query: string): Lesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_LESSONS.filter((l) => {
    const hay = [l.title, l.summary, ...(l.keywords ?? [])].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export type { Lesson, Category } from "./types";
