"use client";

type Option = { value: string; label: string };
type Question = {
  id: string;
  question: string;
  type: string;
  options: Option[];
};

function selectedSet(value: string): Set<string> {
  if (!value || typeof value !== "string") return new Set();
  return new Set(value.split(",").map((s) => s.trim()).filter(Boolean));
}

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
  const isMulti = question.type === "multi";
  const selected = isMulti ? selectedSet(value) : new Set(value ? [value] : []);
  const canNext = isMulti ? selected.size >= 1 : value !== undefined && value !== "";

  const handleMultiToggle = (optValue: string) => {
    const next = new Set(selected);
    if (next.has(optValue)) next.delete(optValue);
    else next.add(optValue);
    onAnswer(Array.from(next).join(","));
  };

  return (
    <div>
      <h2 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-8">
        {question.question}
      </h2>

      {isMulti ? (
        <div className="space-y-3">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleMultiToggle(opt.value)}
              className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 font-body text-base focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 ${
                selected.has(opt.value)
                  ? "border-burnt-orange bg-burnt-orange/5 text-off-black"
                  : "border-off-white bg-white hover:border-off-black/30 hover:bg-off-white/80 text-off-black"
              }`}
            >
              {opt.label}
              {selected.has(opt.value) ? " ✓" : ""}
            </button>
          ))}
        </div>
      ) : (
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
      )}

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
        {(question.type === "quantity" || question.type === "multi") && (
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
