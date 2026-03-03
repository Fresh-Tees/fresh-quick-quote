"use client";

type Option = { value: string; label: string };
type Question = {
  id: string;
  question: string;
  type: string;
  options: Option[];
};

export function QuestionStep({
  question,
  value,
  onAnswer,
  onNext,
  onBack,
}: {
  question: Question;
  value: string;
  onAnswer: (v: string) => void;
  onNext: (lastAnswerValue?: string) => void;
  onBack?: () => void;
}) {
  const canNext = value !== undefined && value !== "";

  return (
    <div>
      <h2 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-8">
        {question.question}
      </h2>

      <div className="space-y-3">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onAnswer(opt.value);
              if (question.type === "single") {
                setTimeout(() => onNext(opt.value), 200);
              }
            }}
            className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 transition-all font-body text-base focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 ${
              value === opt.value
                ? "border-burnt-orange bg-burnt-orange/5 text-off-black"
                : "border-off-white bg-white hover:border-burnt-orange/50 hover:bg-burnt-orange/5 text-off-black"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-10 flex gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-5 py-3 font-body text-off-black/80 hover:text-off-black focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 rounded-lg"
          >
            Back
          </button>
        )}
        {question.type === "quantity" && (
          <button
            type="button"
            onClick={() => onNext()}
            disabled={!canNext}
            className="min-h-[44px] px-6 py-3 bg-off-black text-white font-body font-medium rounded-lg hover:bg-off-black/90 focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
