"use client";

import { useActionState, useEffect, useRef } from "react";
import { addMember } from "@/app/actions/team";
import { Field, FormMessage, cx, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AddMemberForm() {
  const [state, action] = useActionState(addMember, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold tracking-tight">A‘zo qo‘shish</h2>
        <p className="text-xs leading-relaxed text-muted">
          Akkaunt yaratiladi. Login va parolni a‘zoga o‘zingiz yetkazasiz.
        </p>
      </div>
      <Field label="Ism familiya" htmlFor="m-name">
        <input id="m-name" name="name" required className={cx(inputClass, "h-10")} />
      </Field>
      <Field label="Lavozim" htmlFor="m-position" hint="Masalan: Dizayner, Backend dasturchi">
        <input id="m-position" name="position" className={cx(inputClass, "h-10")} />
      </Field>
      <Field label="Email" htmlFor="m-email">
        <input id="m-email" name="email" type="email" required className={cx(inputClass, "h-10")} />
      </Field>
      <Field label="Boshlang‘ich parol" htmlFor="m-password" hint="Kamida 6 belgi">
        <input
          id="m-password"
          name="password"
          type="text"
          required
          minLength={6}
          autoComplete="off"
          className={cx(inputClass, "h-10 font-mono")}
        />
      </Field>
      <FormMessage error={state?.error} success={state?.ok ? "A‘zo qo‘shildi." : undefined} />
      <SubmitButton pendingText="Qo‘shilmoqda…">A‘zo qo‘shish</SubmitButton>
    </form>
  );
}
