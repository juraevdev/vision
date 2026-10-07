"use client";

import type { ReactNode } from "react";

export function ConfirmForm({
  action,
  message,
  fields,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  fields: Record<string, string | number>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
    </form>
  );
}
