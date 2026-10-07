"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markNotificationRead } from "@/app/actions/account";

export function NotificationLink({
  id,
  href,
  unread,
  className,
  children,
}: {
  id: number;
  href: string | null;
  unread: boolean;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() =>
        startTransition(async () => {
          if (unread) await markNotificationRead(id);
          if (href) router.push(href);
        })
      }
    >
      {children}
    </button>
  );
}
