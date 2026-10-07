"use client";

import { useOptimistic, useState, useTransition } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { updateTaskStatus } from "@/app/actions/projects";
import type { TaskStatus } from "@/lib/data";
import { STATUS_LABEL } from "@/lib/format";
import { cx } from "./ui";

const OPTIONS: TaskStatus[] = ["todo", "in_progress", "done"];

export function TaskStatusControl({ taskId, status }: { taskId: number; status: TaskStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: TaskStatus) {
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      const result = await updateTaskStatus(taskId, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <label className="relative inline-flex items-center">
        <span className="sr-only">Topshiriq holati</span>
        <select
          value={optimistic}
          onChange={(e) => change(e.target.value as TaskStatus)}
          disabled={pending}
          className={cx(
            "h-8 cursor-pointer appearance-none rounded-lg border pl-2.5 pr-7 text-xs font-medium transition-colors duration-200",
            "focus:outline-none focus-visible:ring-3 focus-visible:ring-accent/25 disabled:cursor-wait",
            optimistic === "done" && "border-transparent bg-accent-soft text-accent-soft-ink",
            optimistic === "in_progress" && "border-accent/40 bg-surface text-accent-soft-ink",
            optimistic === "todo" && "border-line-strong bg-surface text-muted",
          )}
        >
          {OPTIONS.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </select>
        <CaretDownIcon size={12} weight="bold" className="pointer-events-none absolute right-2.5 text-faint" />
      </label>
      {error ? <span className="text-[11px] text-danger">{error}</span> : null}
    </div>
  );
}
