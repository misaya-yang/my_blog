import React from "react";
import { ArrowRight, BookOpen } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";

import { getVisibleAgentFollowUpTasks } from "./agentFollowUpTasks";

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
  const visibleQuestions = getVisibleAgentFollowUpTasks(questions);
  if (visibleQuestions.length === 0) return null;

  return (
    <div className="agent-related-tasks mt-4">
      <div className="agent-related-title mb-2 flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-500">
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        {t("agent.related.title")}
      </div>
      <div className="agent-related-list grid gap-1.5">
        {visibleQuestions.map(question => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onPrompt(question)}
            className="agent-related-button inline-flex min-w-0 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs leading-5 text-slate-300 disabled:opacity-60"
          >
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {question}
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
