import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { determineArchetype, type QuizAnswers } from "@/lib/archetypes";
import { determineProgram } from "@/pages/FatherAthleteQuiz";
import { ChevronRight } from "lucide-react";

export default function ArchetypeReveal() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const answers: QuizAnswers = {
    training_experience: params.get("training_experience") || "",
    body_composition: params.get("body_composition") || "",
    goal: params.get("goal") || "",
    equipment: params.get("equipment") || "",
    conditioning: params.get("conditioning") || "",
  };

  const firstName = params.get("name") || "Dad";
  const program = params.get("program") || determineProgram(answers);
  const archetype = determineArchetype(answers);

  const handleCTA = () => {
    const resultParams = new URLSearchParams({
      program,
      name: firstName,
      ...answers,
    });
    navigate(`/father-athlete-results?${resultParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col items-center px-6 py-16 max-w-lg mx-auto">

        {/* 1. Archetype Reveal */}
        <section className="text-center mb-10 w-full">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4">
            Your Father Athlete Type
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4">
            You're{" "}
            <span className="gold-text">{archetype.name}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto">
            {archetype.identity}
          </p>
        </section>

        {/* 2. Mirror Section */}
        <section className="card-dark rounded-2xl p-6 md:p-8 mb-8 w-full">
          <p className="text-base md:text-lg leading-relaxed text-foreground/90">
            {archetype.mirror}
          </p>
        </section>

        {/* 3. Strength + Shadow */}
        <section className="w-full grid gap-4 mb-10">
          <div className="card-dark rounded-2xl p-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-2">
              Your Strength
            </p>
            <p className="text-base text-foreground leading-relaxed">
              {archetype.strength}
            </p>
          </div>
          <div className="card-dark rounded-2xl p-6">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Your Edge to Develop
            </p>
            <p className="text-base text-foreground/80 leading-relaxed">
              {archetype.edge}
            </p>
          </div>
        </section>

        {/* 4. Program Bridge */}
        <section className="text-center mb-8 w-full">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {archetype.programBridge}
          </p>
        </section>

        {/* 5. Program Preview */}
        <section className="w-full mb-10">
          <ul className="space-y-4">
            {archetype.programPreview.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 card-dark rounded-xl p-4"
              >
                <span className="mt-0.5 w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 text-primary-foreground" />
                </span>
                <span className="text-base text-foreground leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. CTA */}
        <section className="w-full">
          <Button
            onClick={handleCTA}
            className="w-full text-lg py-7 font-bold rounded-xl gold-gradient text-primary-foreground"
          >
            {archetype.ctaLabel}
          </Button>
        </section>
      </div>
    </div>
  );
}
