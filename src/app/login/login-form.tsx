"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Field, FormMessage, inputClass, cx } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-8 grid gap-5">
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className={cx(inputClass, "h-11")}
        />
      </Field>
      <Field label="Parol" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cx(inputClass, "h-11")}
        />
      </Field>
      <FormMessage error={state?.error} />
      <SubmitButton pendingText="Tekshirilmoqda…" className="h-11 w-full">
        Kirish
      </SubmitButton>
    </form>
  );
}
