"use client";

import Link from "next/link";
import { useState } from "react";
import { getFlowConfig, getEducationGaps } from "@/lib/flow";
import type { Answers } from "@/lib/flow";
import { QuoteForm } from "./QuoteForm";

type EducationTopic = {
  title: string;
  body: string;
  links: { label: string; url: string }[];
};

export function EducationOutcome({ answers }: { answers: Answers }) {
  const config = getFlowConfig();
  const content = config.educationContent as { title: string; body: string };
  const topics = config.educationTopics as Record<string, EducationTopic> | undefined;
  const gaps = getEducationGaps(answers);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-xl md:max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      <section>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-off-black mb-2">
          {content?.title ?? "Almost there"}
        </h1>
        <p className="font-body text-off-black/80 text-base whitespace-pre-line">
          {content?.body ?? "To give you an accurate quote and make the most of a call, it helps to have print-ready artwork and an idea of placements and sizes. Check out our guides, then come back when you're ready—or leave your details and we'll send a checklist and follow up."}
        </p>
      </section>

      {topics && gaps.length > 0 && (
        <div className="space-y-8">
          {gaps.map((gapId) => {
            const topic = topics[gapId];
            if (!topic) return null;
            return (
              <section key={gapId} className="border border-off-white rounded-lg p-5 bg-off-white/30">
                <h2 className="font-display font-bold text-lg text-off-black mb-2">
                  {topic.title}
                </h2>
                <p className="font-body text-off-black/80 text-sm mb-4">
                  {topic.body}
                </p>
                <div className="flex flex-wrap gap-3">
                  {topic.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-accent text-white font-body text-sm font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!showForm ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center min-h-[44px] w-full md:w-auto px-8 py-4 bg-off-black text-white font-body font-medium rounded-lg hover:bg-off-black/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Leave my details for a checklist
          </button>
          <p className="font-body text-sm text-off-black/60">
            We'll send you a quick checklist and follow up when the time's right.
          </p>
        </div>
      ) : (
        <QuoteForm answers={answers} context="education" />
      )}

      <div className="pt-4 border-t border-off-black/10 mt-6 flex justify-center">
        <Link
          href="/"
          className="font-body text-sm text-off-black/70 hover:text-off-black hover:underline"
        >
          Restart and go back to the start
        </Link>
      </div>
    </div>
  );
}
