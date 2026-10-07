"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, updateProfile } from "@/app/actions/account";
import { Field, FormMessage, cx, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function ProfileForm({ name, position }: { name: string; position: string }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="grid gap-5 rounded-xl border border-line bg-surface p-5 md:p-6">
      <h2 className="text-base font-semibold tracking-tight">Shaxsiy ma‘lumotlar</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Ism familiya" htmlFor="p-name">
          <input id="p-name" name="name" required defaultValue={name} className={cx(inputClass, "h-10")} />
        </Field>
        <Field label="Lavozim" htmlFor="p-position">
          <input id="p-position" name="position" defaultValue={position} className={cx(inputClass, "h-10")} />
        </Field>
      </div>
      <FormMessage error={state?.error} success={state?.ok ? "Ma‘lumotlar saqlandi." : undefined} />
      <SubmitButton className="justify-self-start">Saqlash</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-5 rounded-xl border border-line bg-surface p-5 md:p-6">
      <h2 className="text-base font-semibold tracking-tight">Parolni almashtirish</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Joriy parol" htmlFor="current">
          <input
            id="current"
            name="current"
            type="password"
            required
            autoComplete="current-password"
            className={cx(inputClass, "h-10")}
          />
        </Field>
        <Field label="Yangi parol" htmlFor="next" hint="Kamida 6 belgi">
          <input
            id="next"
            name="next"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={cx(inputClass, "h-10")}
          />
        </Field>
      </div>
      <FormMessage error={state?.error} success={state?.ok ? "Parol yangilandi." : undefined} />
      <SubmitButton className="justify-self-start">Parolni yangilash</SubmitButton>
    </form>
  );
}
