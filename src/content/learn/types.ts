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

/** Short Roadmap-linked format: Situation → Know This → Your Job → Bottom Line. */
export interface QuickLesson {
  situation: string;
  knowThis: { title: string; body: string }[];
  /** Professional-support / emergency guidance for health & safety topics. */
  safety?: string[];
  yourJob: string;
  bottomLine: string;
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
  /** Content review state. "draft" lessons are hidden from users. */
  reviewStatus?: "draft" | "published" | "needs_review";
  /** Long-form lesson body (legacy format). */
  sections?: LessonSection;
  /** Short format — preferred for new lessons. */
  quick?: QuickLesson;
}

export interface Category {
  slug: string;
  emoji: string;
  title: string;
  tagline: string;
  /** HSL tuple used for the tile tint. */
  tint: string;
}
