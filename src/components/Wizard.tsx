"use client";

import { useState } from "react";
import { getFlowConfig, isSmallOrder, isBulkOrder, isBulkQualified } from "@/lib/flow";
import type { Answers } from "@/lib/flow";
import { QuestionStep } from "./QuestionStep";
import { SmallOrderOutcome } from "./SmallOrderOutcome";
import { EducationOutcome } from "./EducationOutcome";
import { QualifiedOutcome } from "./QualifiedOutcome";

type Screen = "wizard" | "small" | "education" | "qualified";

export function Wizard() {
  const config = getFlowConfig();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [screen, setScreen] = useState<Screen>("wizard");
  const [outcomeAnswers, setOutcomeAnswers] = useState<Answers>({});

  const questions = config.questions;
  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const goNext = (lastAnswerValue?: string) => {
    const merged = lastAnswerValue && currentQuestion
      ? { ...answers, [currentQuestion.id]: lastAnswerValue }
      : answers;

    if (step === 1 && currentQuestion?.id === "quantity") {
      if (isSmallOrder({ ...merged, quantity: merged.quantity || "" })) {
        setScreen("small");
        return;
      }
    }

    if (step === questions.length - 1) {
      const final = lastAnswerValue && currentQuestion
        ? { ...answers, [currentQuestion.id]: lastAnswerValue }
        : answers;
      setOutcomeAnswers(final);
      if (isBulkOrder(final)) {
        if (isBulkQualified(final)) {
          setScreen("qualified");
        } else {
          setScreen("education");
        }
      } else {
        setScreen("small");
      }
      setAnswers(final);
      return;
    }

    setAnswers((prev) => (lastAnswerValue && currentQuestion ? { ...prev, [currentQuestion.id]: lastAnswerValue } : prev));
    setStep((s) => Math.min(s + 1, questions.length - 1));
  };

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  if (screen === "small") {
    return <SmallOrderOutcome />;
  }
  if (screen === "education") {
    return <EducationOutcome answers={outcomeAnswers} />;
  }
  if (screen === "qualified") {
    return <QualifiedOutcome answers={outcomeAnswers} />;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10 flex flex-col gap-2">
        <p className="text-sm font-body font-medium text-off-black/80">
          Step {step + 1} of {questions.length}
        </p>
        <div className="h-1.5 bg-off-white rounded-full overflow-hidden">
          <div
            className="h-full bg-burnt-orange transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionStep
        question={currentQuestion!}
        value={answers[currentQuestion?.id ?? ""]}
        onAnswer={(value) => setAnswer(currentQuestion!.id, value)}
        onNext={goNext}
        onBack={step > 0 ? goBack : undefined}
      />
    </div>
  );
}
