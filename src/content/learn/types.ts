export interface LessonSection {
  overview: string;
  whyItMatters: string;
  steps: string[];
  visualExamples?: { title: string; body: string }[];
  commonMistakes: string[];
  safetyTips?: string[];
  actionChecklist: string[];
  keyTakeaways: string[];
}

export interface Lesson {
  slug: string;
  categorySlug: string;
  title: string;
  summary: string;
  minutes: number;
  /** Pregnancy week range this lesson is most relevant for (inclusive). */
  weekRange: [number, number];
  keywords?: string[];
  related?: string[];
  /** Post-birth phases this lesson applies to (survival|foundation|rhythm|growth). */
  postBirthPhases?: string[];
  sections: LessonSection;
}

export interface Category {
  slug: string;
  emoji: string;
  title: string;
  tagline: string;
  /** HSL tuple used for the tile tint. */
  tint: string;
}
