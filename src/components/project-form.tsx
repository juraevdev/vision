"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { createProject, updateProject } from "@/app/actions/projects";
import type { Person, ProjectSummary } from "@/lib/data";
import { SubmitButton } from "./submit-button";
import { Field, FormMessage, buttonClass, cx, inputClass } from "./ui";

type Row = { key: number };

const KIND_OPTIONS = [
  { value: "new", title: "Yangi loyiha", text: "Hali boshlanmagan, endi ishga tushiriladi" },
  { value: "ongoing", title: "Joriy loyiha", text: "Allaqachon davom etayotgan loyiha" },
] as const;

export function ProjectForm({ members, project }: { members: Person[]; project?: ProjectSummary }) {
  const editing = Boolean(project);
  const [state, action] = useActionState(editing ? updateProject : createProject, undefined);
  const [rows, setRows] = useState<Row[]>(() => [{ key: 0 }, { key: 1 }]);
  const [nextKey, setNextKey] = useState(2);

  function addRow() {
    setRows((r) => [...r, { key: nextKey }]);
    setNextKey((k) => k + 1);
  }

  return (
    <form action={action} className="grid gap-8">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}

      <section className="grid gap-6 rounded-xl border border-line bg-surface p-5 md:p-7">
        <Field label="Loyiha nomi" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            defaultValue={project?.title}
            placeholder="Masalan: Mobil ilovaning ikkinchi versiyasi"
            className={cx(inputClass, "h-10")}
          />
        </Field>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[13px] font-medium">Loyiha turi</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {KIND_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-strong p-3.5 transition-colors duration-200 hover:border-faint has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
              >
                <input
                  type="radio"
                  name="kind"
                  value={opt.value}
                  required
                  defaultChecked={(project?.kind ?? "new") === opt.value}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">{opt.title}</span>
                  <span className="text-xs text-muted">{opt.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Loyiha maqsadi"
          htmlFor="goal"
          hint="Loyiha nimaga erishishi kerakligini aniq va o‘lchanadigan qilib yozing."
        >
          <textarea
            id="goal"
            name="goal"
            required
            rows={4}
            defaultValue={project?.goal}
            placeholder="Masalan: Dekabr oxirigacha ilovani 10 000 faol foydalanuvchiga yetkazish"
            className={cx(inputClass, "resize-y py-2.5 leading-relaxed")}
          />
        </Field>

        <Field label="Qo‘shimcha tavsif" htmlFor="description" hint="Ixtiyoriy">
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={project?.description}
            className={cx(inputClass, "resize-y py-2.5 leading-relaxed")}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Boshlanish sanasi" htmlFor="start_date">
            <input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={project?.start_date ?? ""}
              className={cx(inputClass, "h-10")}
            />
          </Field>
          <Field label="Yakunlash muddati" htmlFor="deadline">
            <input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={project?.deadline ?? ""}
              className={cx(inputClass, "h-10")}
            />
          </Field>
        </div>
      </section>

      {!editing ? (
        <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 md:p-7">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold tracking-tight">Topshiriqlarni taqsimlash</h2>
            <p className="text-sm text-muted">
              Har bir topshiriq uchun ijrochi tanlang. Ijrochilarga darhol bildirishnoma boradi.
            </p>
          </div>

          {members.length === 0 ? (
            <p className="rounded-lg bg-sunken px-4 py-3 text-sm text-muted">
              Jamoada hali a‘zo yo‘q.{" "}
              <Link href="/team" className="font-medium text-accent hover:underline">
                A‘zo qo‘shing
              </Link>
              , keyin topshiriqlarni biriktira olasiz. Topshiriqlarni hozir ijrochisiz ham qo‘shish mumkin.
            </p>
          ) : null}

          <div className="hidden grid-cols-[minmax(0,1fr)_200px_160px_40px] gap-3 px-1 text-xs font-medium text-muted md:grid">
            <span>Topshiriq</span>
            <span>Ijrochi</span>
            <span>Muddat</span>
            <span />
          </div>

          <ul className="grid gap-3">
            {rows.map((row, i) => (
              <li
                key={row.key}
                className="animate-rise grid gap-2 rounded-lg border border-line p-3 md:grid-cols-[minmax(0,1fr)_200px_160px_40px] md:gap-3 md:border-0 md:p-0"
              >
                <input
                  name="task_title"
                  aria-label={`Topshiriq ${i + 1} nomi`}
                  placeholder={`Topshiriq ${i + 1}`}
                  className={cx(inputClass, "h-10")}
                />
                <select name="task_assignee" aria-label="Ijrochi" defaultValue="" className={cx(inputClass, "h-10")}>
                  <option value="">Ijrochisiz</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input name="task_deadline" type="date" aria-label="Muddat" className={cx(inputClass, "h-10")} />
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                  aria-label="Topshiriqni olib tashlash"
                  className="inline-flex h-10 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={addRow} className={cx(buttonClass("secondary", "sm"), "justify-self-start")}>
            <PlusIcon size={14} weight="bold" />
            Topshiriq qo‘shish
          </button>
        </section>
      ) : null}

      <div className="grid gap-4">
        <FormMessage error={state?.error} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText="Saqlanmoqda…">
            {editing ? "O‘zgarishlarni saqlash" : "Loyihani yaratish"}
          </SubmitButton>
          <Link href={project ? `/projects/${project.id}` : "/"} className={buttonClass("ghost")}>
            Bekor qilish
          </Link>
          {!editing ? (
            <p className="text-xs text-faint">Saqlangach, barcha jamoa a‘zolariga xabar yuboriladi.</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
