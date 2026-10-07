"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { addTask } from "@/app/actions/projects";
import type { Person } from "@/lib/data";
import { SubmitButton } from "./submit-button";
import { Field, FormMessage, buttonClass, cx, inputClass } from "./ui";

export function AddTaskForm({ projectId, members }: { projectId: number; members: Person[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addTask, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "sm")}>
        <PlusIcon size={14} weight="bold" />
        Topshiriq qo‘shish
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="animate-rise grid gap-4 rounded-xl border border-line bg-surface p-5"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <Field label="Topshiriq" htmlFor="task-title">
        <input id="task-title" name="title" required autoFocus className={cx(inputClass, "h-10")} />
      </Field>
      <Field label="Izoh" htmlFor="task-description" hint="Ixtiyoriy">
        <textarea id="task-description" name="description" rows={2} className={cx(inputClass, "resize-y py-2")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ijrochi" htmlFor="task-assignee">
          <select id="task-assignee" name="assignee_id" defaultValue="" className={cx(inputClass, "h-10")}>
            <option value="">Ijrochisiz</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Muddat" htmlFor="task-deadline">
          <input id="task-deadline" name="deadline" type="date" className={cx(inputClass, "h-10")} />
        </Field>
      </div>
      <FormMessage error={state?.error} success={state?.ok ? "Topshiriq qo‘shildi, ijrochiga xabar yuborildi." : undefined} />
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Qo‘shilmoqda…">
          Qo‘shish
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")}>
          Yopish
        </button>
      </div>
    </form>
  );
}
