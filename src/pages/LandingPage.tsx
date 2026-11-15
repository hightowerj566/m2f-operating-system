import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Cross,
  Dumbbell,
  HandHeart,
  HeartHandshake,
  LineChart,
  Map,
  MessageCircle,
  Salad,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import heroImage from "@/assets/father-ready-hero.jpg";
import { MEMBERSHIP } from "@/lib/subscriptionTiers";

const features = [
  {
    icon: Dumbbell,
    title: "Training that meets real life",
    text: "Guided workouts, exercise videos, and time-budget options for the days when fatherhood changes your plans.",
  },
  {
    icon: Salad,
    title: "Nutrition without guesswork",
    text: "Personal macro targets, food check-ins, and practical adjustments built around your body and your goal.",
  },
  {
    icon: Map,
    title: "A roadmap built around your due date",
    text: "Know what to do before the baby arrives, through the newborn stage, and into your first year as a father.",
  },
  {
    icon: Target,
    title: "One clear mission each day",
    text: "Simple actions for your body, your partner, and your baby—so you always know what matters today.",
  },
  {
    icon: MessageCircle,
    title: "Lessons and conversations that prepare you",
    text: "Quick lessons, partner conversation guides, and practical checklists without the textbook or the fluff.",
  },
  {
    icon: LineChart,
    title: "Progress you can actually see",
    text: "Track workouts, body weight, habits, and readiness as you build consistency before and after birth.",
  },
];

const pillars = [
  {
    number: "01",
    icon: Cross,
    title: "Faith",
    text: "Build the convictions and character your family can count on when life gets hard.",
  },
  {
    number: "02",
    icon: Users,
    title: "Family",
    text: "Show up prepared, present, and ready to lead—not just physically, but emotionally.",
  },
  {
    number: "03",
    icon: Dumbbell,
    title: "Fitness",
    text: "Build the strength, energy, and discipline to carry the responsibility in front of you.",
  },
  {
    number: "04",
    icon: HandHeart,
    title: "Service",
    text: "Put your strength to work for your partner, your children, and the people around you.",
  },
];

const membershipFeatures = [
  "Full guided training programs and exercise videos",
  "Personalized nutrition and macro targets",
  "Pregnancy-to-first-year fatherhood roadmap",
  "Daily missions, quick lessons, and partner talk guides",
  "Workout, habit, body-weight, and readiness tracking",
];

const journey = [
  {
    step: "Before baby",
    title: "Build your foundation",
    text: "Get stronger, prepare your home, support your partner, and tackle what you do not know yet.",
  },
  {
    step: "The newborn stage",
    title: "Survive together",
    text: "Shorten the plan when sleep disappears. Keep the habits that hold you and your family together.",
  },
  {
    step: "The first year",
    title: "Become the father athlete",
    text: "Rebuild momentum with training, nutrition, and standards that fit your new normal.",
  },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(true);
  const price = annual ? MEMBERSHIP.annual.per_month : MEMBERSHIP.monthly.per_month;

  return (
    <div className="min-h-screen overflow-hidden bg-background font-marketing text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 sm:gap-3" aria-label="Man to Father home">
            <img src="/favicon.png" alt="" className="h-12 w-12 shrink-0 object-contain" />
            <div className="whitespace-nowrap">
              <span className="block font-display text-lg font-bold uppercase leading-none tracking-[0.16em] sm:text-xl">Man to Father</span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.24em] text-primary sm:text-[9px] sm:tracking-[0.28em]">Strength for what matters</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Main navigation">
            <a href="#system" className="transition-colors hover:text-foreground">The system</a>
            <a href="#pillars" className="transition-colors hover:text-foreground">Four pillars</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Membership</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/auth" className="hidden px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block">
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-5 sm:text-sm"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-border">
          <div aria-hidden="true" className="pointer-events-none absolute -left-12 top-24 select-none font-display text-[16rem] font-black leading-none text-secondary/40">M</div>
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">
                <ShieldCheck className="h-4 w-4" /> For expecting & new dads
              </div>
              <h1 className="max-w-3xl font-display text-6xl font-bold uppercase leading-[0.88] tracking-tight sm:text-7xl lg:text-[6.5rem]">
                Become the father your family can <span className="text-primary">lean on.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Training, nutrition, and a week-by-week fatherhood roadmap—built around your due date and the beautiful chaos that comes after.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/father-athlete-quiz"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-base font-extrabold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Get my Readiness Score <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-border bg-card px-7 text-base font-bold text-foreground transition-colors hover:border-primary/60 hover:bg-secondary"
                >
                  Start 7-day free trial <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Free 2-minute assessment</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No account required</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div aria-hidden="true" className="absolute -inset-3 rounded-[2rem] border border-primary/20" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card">
                <img
                  src={heroImage}
                  alt="A father resting after a home workout beside his sleeping newborn"
                  width={1200}
                  height={1200}
                  className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/5] lg:aspect-[4/5]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent px-6 pb-6 pt-24 sm:px-8 sm:pb-8">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-primary">Your due date becomes the plan</p>
                  <div className="mt-3 flex items-center justify-between gap-2 font-display text-lg font-bold uppercase tracking-wide sm:text-xl">
                    <span>Prepare</span><ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                    <span>Provide</span><ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                    <span>Lead</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="system" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 border-b border-border pb-12 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">The M2F system</p>
                <h2 className="mt-4 max-w-xl font-display text-5xl font-bold uppercase leading-[0.95] sm:text-6xl">
                  Fatherhood changes everything. <span className="text-primary">Your plan should know that.</span>
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground lg:justify-self-end">
                Most apps give you workouts. Others give you a pregnancy checklist. M2F connects both, because your body and your family do not live in separate worlds.
              </p>
            </div>

            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <article key={feature.title} className="group border-b border-border py-8 md:px-7 md:py-10 lg:border-r lg:[&:nth-child(3n)]:border-r-0">
                  <div className="flex items-center justify-between">
                    <feature.icon className="h-7 w-7 text-primary" strokeWidth={1.7} />
                    <span className="font-display text-sm font-bold tracking-[0.18em] text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-3xl font-bold uppercase leading-none">{feature.title}</h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">One continuous journey</p>
                <h2 className="mt-3 font-display text-5xl font-bold uppercase sm:text-6xl">From positive test to first birthday.</h2>
              </div>
              <Sparkles className="hidden h-10 w-10 text-primary sm:block" strokeWidth={1.4} />
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
              {journey.map((phase, index) => (
                <article key={phase.step} className="bg-card p-7 sm:p-9">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">{index + 1}</span>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">{phase.step}</p>
                  </div>
                  <h3 className="mt-6 font-display text-3xl font-bold uppercase">{phase.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{phase.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pillars" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">What we stand on</p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] sm:text-6xl">Four pillars. <span className="text-primary">One standard.</span></h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">This is not about becoming a perfect man. It is about becoming a dependable one.</p>
            </div>
            <div className="mt-12 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <article key={pillar.title} className="border-b border-r border-border p-7 sm:p-8">
                  <div className="flex items-start justify-between">
                    <pillar.icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
                    <span className="font-display text-4xl font-bold text-secondary">{pillar.number}</span>
                  </div>
                  <h3 className="mt-10 font-display text-4xl font-bold uppercase">{pillar.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-primary/30 bg-card">
            <div aria-hidden="true" className="absolute -right-8 -top-20 select-none font-display text-[18rem] font-black leading-none text-secondary/50">70</div>
            <div className="relative grid gap-10 p-7 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center lg:p-16">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.24em] text-primary"><BookOpen className="h-4 w-4" /> Start with the truth</div>
                <h2 className="mt-5 font-display text-5xl font-bold uppercase leading-[0.92] sm:text-6xl">How ready are you—<span className="text-primary">actually?</span></h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Answer 17 honest questions across seven areas of fatherhood. Get your score out of 70, find your weakest area, and know where to start.
                </p>
              </div>
              <div className="relative lg:min-w-64">
                <Link
                  to="/father-athlete-quiz"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 text-base font-extrabold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Take the free assessment <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">2 minutes. Instant breakdown.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 border-y border-border bg-card px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">One membership. The whole system.</p>
              <h2 className="mt-4 font-display text-5xl font-bold uppercase sm:text-6xl">Invest in the man your family needs.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">Try everything free for {MEMBERSHIP.trial_days} days. Cancel anytime during your trial and you will not be charged.</p>
            </div>

            <div className="mx-auto mt-8 flex w-fit rounded-xl border border-border bg-background p-1" aria-label="Billing frequency">
              <button
                type="button"
                aria-pressed={annual}
                onClick={() => setAnnual(true)}
                className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Annual <span className="ml-1 text-xs">Save 17%</span>
              </button>
              <button
                type="button"
                aria-pressed={!annual}
                onClick={() => setAnnual(false)}
                className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-colors ${!annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
            </div>

            <div className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-[1.75rem] border-2 border-primary bg-background md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col justify-center border-b border-border p-8 md:border-b-0 md:border-r sm:p-10">
                <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-primary"><HeartHandshake className="h-5 w-5" /> M2F Membership</div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-7xl font-bold leading-none">${price.toFixed(2)}</span>
                  <span className="pb-1 text-sm font-semibold text-muted-foreground">/ month</span>
                </div>
                <p className="mt-3 text-sm font-bold text-primary">{annual ? "Billed annually" : "Billed monthly"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{MEMBERSHIP.trial_days}-day free trial included.</p>
                <Link
                  to="/auth?mode=signup"
                  className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-extrabold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start my free trial <ArrowRight className="h-5 w-5" />
                </Link>
                <p className="mt-3 text-center text-xs text-muted-foreground">You will not be charged for {MEMBERSHIP.trial_days} days.</p>
              </div>
              <div className="p-8 sm:p-10">
                <p className="font-display text-2xl font-bold uppercase">Everything you need to show up ready.</p>
                <ul className="mt-7 space-y-5">
                  {membershipFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10"><Check className="h-3.5 w-3.5 text-primary" /></span>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Human 1:1 coaching is separate and available by invitation.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-primary">Before you start</p>
              <h2 className="mt-3 font-display text-5xl font-bold uppercase">Good questions. Straight answers.</h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              <details className="group py-5">
                <summary className="cursor-pointer list-none font-display text-2xl font-bold uppercase">Is this just another workout app?</summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">No. Training and nutrition are part of it, but M2F also prepares you for pregnancy, birth, the newborn stage, and your first year as a dad.</p>
              </details>
              <details className="group py-5">
                <summary className="cursor-pointer list-none font-display text-2xl font-bold uppercase">When should I start?</summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">Start wherever you are. The roadmap uses your due date or your baby’s arrival date to meet you in the right phase.</p>
              </details>
              <details className="group py-5">
                <summary className="cursor-pointer list-none font-display text-2xl font-bold uppercase">Do I need a full gym?</summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">Your training setup is part of your profile, and available programs can be matched to the equipment and time you have.</p>
              </details>
              <details className="group py-5">
                <summary className="cursor-pointer list-none font-display text-2xl font-bold uppercase">Can I cancel during the trial?</summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">Yes. You can manage or cancel your membership in the app. Cancel during the {MEMBERSHIP.trial_days}-day trial and you will not be charged.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-5xl border-t border-primary/40 pt-16 text-center">
            <img src="/favicon.png" alt="Man to Father" className="mx-auto h-24 w-24 object-contain" loading="lazy" />
            <h2 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.95] sm:text-7xl">Your family does not need a perfect dad.<br /><span className="text-primary">They need a prepared one.</span></h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/father-athlete-quiz" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-7 font-extrabold text-primary-foreground transition-colors hover:bg-primary/90">
                Get my Readiness Score <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/auth?mode=signup" className="inline-flex min-h-14 items-center justify-center rounded-lg border border-border bg-card px-7 font-bold transition-colors hover:border-primary/60">
                Start {MEMBERSHIP.trial_days} days free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="" className="h-10 w-10 object-contain" loading="lazy" />
            <div><p className="font-display text-lg font-bold uppercase tracking-[0.14em]">Man to Father</p><p className="text-xs text-muted-foreground">Faith. Family. Fitness. Service.</p></div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
            <Link to="/father-athlete-quiz" className="hover:text-foreground">Readiness Score</Link>
            <a href="#pricing" className="hover:text-foreground">Membership</a>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Man to Father</p>
        </div>
      </footer>
    </div>
  );
}
