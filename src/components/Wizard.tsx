"use client";

import { useEffect, useState } from "react";
import { getFlowConfig, isSmallOrder, isBulkOrder } from "@/lib/flow";
import type { Answers } from "@/lib/flow";
import { getGatewaySessionId, track } from "@/lib/ga4";
import { QuestionStep } from "./QuestionStep";
import { SmallOrderOutcome } from "./SmallOrderOutcome";
import { EducationOutcome } from "./EducationOutcome";
import { QualifiedOutcome } from "./QualifiedOutcome";
import { PlacementGuidancePage } from "./PlacementGuidancePage";

const STUDIO_FRESH_URL = "https://freshtees.com.au/pages/studio-fresh";

type Screen = "wizard" | "small" | "education" | "qualified" | "placement_guidance";

function redirectToStudioFresh() {
  if (typeof window !== "undefined") {
    window.top!.location.href = STUDIO_FRESH_URL;
  }
}

function scrollWizardToTop() {
  // Keep the embedded app aligned to top on each step change.
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Same-origin parents can be scrolled directly.
  try {
    window.top?.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    // Cross-origin iframes (e.g. Shopify): ask parent to scroll itself.
    window.parent?.postMessage({ type: "freshtees:scroll-top" }, "*");
  }
}

export function Wizard() {
  const config = getFlowConfig();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [screen, setScreen] = useState<Screen>("wizard");
  const [outcomeAnswers, setOutcomeAnswers] = useState<Answers>({});

  const questions = config.questions;
  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const sessionId = getGatewaySessionId();

  useEffect(() => {
    if (screen !== "wizard") return;
    if (!currentQuestion) return;
    track("wizard_step_viewed", {
      session_id: sessionId,
      question_id: currentQuestion.id,
      step_index: step,
    });
  }, [screen, step, currentQuestion?.id, sessionId]);

  useEffect(() => {
    if (screen !== "wizard") return;
    scrollWizardToTop();
  }, [step, screen]);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const finishWizard = (finalAnswers: Answers) => {
    setOutcomeAnswers(finalAnswers);
    setAnswers(finalAnswers);
    if (isBulkOrder(finalAnswers)) {
      track("wizard_completed", { session_id: sessionId, outcome: "qualified" });
      setScreen("qualified");
    } else {
      track("wizard_completed", { session_id: sessionId, outcome: "redirected" });
      redirectToStudioFresh();
    }
  };

  const goNext = (lastAnswerValue?: string) => {
    const merged = lastAnswerValue && currentQuestion
      ? { ...answers, [currentQuestion.id]: lastAnswerValue }
      : answers;

    if (currentQuestion?.id === "quantity" && isSmallOrder({ ...merged, quantity: merged.quantity || "" })) {
      redirectToStudioFresh();
      return;
    }

    if (currentQuestion?.id === "placements") {
      const withPlacements = { ...merged, placements: "yes" };
      setAnswers(withPlacements);
      if (lastAnswerValue === "no") {
        finishWizard(withPlacements);
        return;
      }
      setOutcomeAnswers(withPlacements);
      setScreen("placement_guidance");
      return;
    }

    if (step === questions.length - 1) {
      const final = lastAnswerValue && currentQuestion
        ? { ...answers, [currentQuestion.id]: lastAnswerValue }
        : answers;
      finishWizard(final);
      return;
    }

    setAnswers((prev) => (lastAnswerValue && currentQuestion ? { ...prev, [currentQuestion.id]: lastAnswerValue } : prev));
    setStep((s) => Math.min(s + 1, questions.length - 1));
  };

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  if (screen === "small") {
    redirectToStudioFresh();
    return <SmallOrderOutcome />;
  }
  if (screen === "education") {
    return <EducationOutcome answers={outcomeAnswers} />;
  }
  if (screen === "qualified") {
    return <QualifiedOutcome answers={outcomeAnswers} />;
  }
  if (screen === "placement_guidance") {
    return (
      <PlacementGuidancePage
        onReady={() => finishWizard({ ...outcomeAnswers, placements: "yes" })}
      />
    );
  }

  return (
    <div className="w-full max-w-none lg:max-w-5xl xl:max-w-6xl mx-auto">
      <div className="md:grid md:grid-cols-[minmax(11rem,13rem)_minmax(0,1fr)] md:gap-8 lg:gap-12 md:items-start">
        <div className="mb-6 md:mb-0 md:sticky md:top-6 flex flex-col gap-2">
          <p className="text-sm font-body font-medium text-off-black/80">
            Step {step + 1} of {questions.length}
          </p>
          <div className="h-1.5 bg-off-white rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="min-w-0">
          <QuestionStep
            question={currentQuestion!}
            value={answers[currentQuestion?.id ?? ""]}
            onAnswer={
              currentQuestion?.type === "gate"
                ? (value) => {
                    setAnswer("intent", value);
                    if (value === "personal") {
                      redirectToStudioFresh();
                    } else {
                      goNext();
                    }
                  }
                : (value) => setAnswer(currentQuestion!.id, value)
            }
            onNext={goNext}
            onBack={step > 0 ? goBack : undefined}
            leftValue={currentQuestion?.type === "project_tell" ? answers.merch_tier : undefined}
            onLeftAnswer={currentQuestion?.type === "project_tell" ? (v) => setAnswer("merch_tier", v) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
