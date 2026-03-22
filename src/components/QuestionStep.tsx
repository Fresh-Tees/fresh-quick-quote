"use client";

type Option = { value: string; label: string; tooltip?: string };
type LeftOption = { value: string; label: string; tooltip?: string };
type Question = {
  id: string;
  question: string;
  type: string;
  options?: Option[];
  bodyText?: string;
  leftColumn?: { answerId: string; options: LeftOption[] };
  rightColumn?: { answerId: string; options: Option[] };
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
  leftValue,
  onLeftAnswer,
}: {
  question: Question;
  value: string;
  onAnswer: (v: string) => void;
  onNext: (lastAnswerValue?: string) => void;
  onBack?: () => void;
  leftValue?: string;
  onLeftAnswer?: (v: string) => void;
}) {
  const isProjectTell = question.type === "project_tell";
  const isGate = question.type === "gate";
  const isMulti = question.type === "multi";
  const selected = isMulti ? selectedSet(value) : new Set(value ? [value] : []);
  const canNextMulti = isMulti && selected.size >= 1;

  const handleMultiToggle = (optValue: string) => {
    const next = new Set(selected);
    if (next.has(optValue)) next.delete(optValue);
    else next.add(optValue);
    onAnswer(Array.from(next).join(","));
  };

  return (
    <div>
      <h2 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-4">
        {question.question}
      </h2>

      {(isProjectTell || isGate) && question.bodyText && (
        <p className="font-body text-off-black/80 text-base mb-6">{question.bodyText}</p>
      )}

      {isGate ? (
        <div className="space-y-3">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onAnswer(opt.value)}
              className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 font-body text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                value === opt.value
                  ? "border-accent bg-accent/5 text-off-black"
                  : "border-off-white bg-white hover:bg-off-white/80 text-off-black"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : isProjectTell && question.leftColumn && question.rightColumn ? (
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-stretch gap-4 md:gap-6">
          <div className="flex flex-col gap-3 flex-1 min-w-0 md:min-w-[140px] order-1">
            <p className="md:hidden font-body text-xs font-medium text-off-black/60 uppercase tracking-wide">
              Merch level
            </p>
            {question.leftColumn.options.map((opt) => (
              <div key={opt.value} className="relative group">
                {opt.tooltip && (
                  <div
                    className="absolute bottom-full left-0 right-0 mb-1 px-3 py-2 rounded-lg bg-off-black text-white font-body text-sm opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-150"
                    role="tooltip"
                  >
                    {opt.tooltip}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onLeftAnswer?.(opt.value);
                    if (value) {
                      setTimeout(() => onNext(), 250);
                    }
                  }}
                  className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 font-body text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                    leftValue === opt.value
                      ? "border-accent bg-accent/5 text-off-black"
                      : "border-off-white bg-white hover:bg-off-white/80 text-off-black"
                  }`}
                >
                  {opt.label}
                </button>
              </div>
            ))}
          </div>
          <div className="order-2 w-full flex justify-center py-3 my-1 border-y border-off-black/10 md:border-y-0 md:w-auto md:shrink-0 md:flex md:items-center md:justify-center md:px-3 md:py-0">
            <span className="font-body text-off-black/80 text-base font-medium">For a</span>
          </div>
          <div className="flex flex-col gap-3 flex-1 min-w-0 md:min-w-[140px] order-3">
            <p className="md:hidden font-body text-xs font-medium text-off-black/60 uppercase tracking-wide">
              Project type
            </p>
            {question.rightColumn.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onAnswer(opt.value);
                  if (leftValue) {
                    setTimeout(() => onNext(opt.value), 250);
                  }
                }}
                className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 font-body text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  value === opt.value
                    ? "border-accent bg-accent/5 text-off-black"
                    : "border-off-white bg-white hover:bg-off-white/80 text-off-black"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : isMulti ? (
        <div className="space-y-3">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleMultiToggle(opt.value)}
              className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 font-body text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                selected.has(opt.value)
                  ? "border-accent bg-accent/5 text-off-black"
                  : "border-off-white bg-white hover:bg-off-white/80 text-off-black"
              }`}
            >
              {opt.label}
              {selected.has(opt.value) ? " ✓" : ""}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(question.options ?? []).map((opt) => {
            const buttonEl = (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onAnswer(opt.value);
                  if (question.type === "single" || question.type === "quantity") {
                    setTimeout(() => onNext(opt.value), 200);
                  }
                }}
                className={`w-full text-left px-5 min-h-[44px] py-3.5 rounded-lg border-2 font-body text-base focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                  value === opt.value
                    ? "border-accent bg-accent/5 text-off-black"
                    : "border-off-white bg-white hover:bg-off-white/80 text-off-black"
                }`}
              >
                {opt.label}
              </button>
            );
            if (opt.tooltip) {
              return (
                <div key={opt.value} className="relative group">
                  <div
                    className="absolute bottom-full left-0 right-0 mb-1 px-3 py-2 rounded-lg bg-off-black text-white font-body text-sm opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-150"
                    role="tooltip"
                  >
                    {opt.tooltip}
                  </div>
                  {buttonEl}
                </div>
              );
            }
            return buttonEl;
          })}
        </div>
      )}

      <div className="mt-10 flex gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-5 py-3 font-body text-off-black/80 hover:text-off-black focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-lg"
          >
            Back
          </button>
        )}
        {question.type === "multi" && (
          <button
            type="button"
            onClick={() => onNext()}
            disabled={!canNextMulti}
            className="min-h-[44px] px-6 py-3 bg-off-black text-white font-body font-medium rounded-lg hover:bg-off-black/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
