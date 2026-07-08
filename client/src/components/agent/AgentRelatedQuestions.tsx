import React from "react";

import { useLanguage } from "@/contexts/LanguageContext";

export function AgentRelatedQuestions({
  questions,
  disabled,
  onPrompt,
}: {
  questions: string[];
  disabled: boolean;
  onPrompt: (message: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase text-slate-500">
        {t("agent.related.title")}
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.slice(0, 3).map(question => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onPrompt(question)}
            className="rounded-md border border-slate-700 bg-white/[0.025] px-2.5 py-1.5 text-left text-xs leading-5 text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 disabled:opacity-60"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
