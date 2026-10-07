"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { BellIcon, BellRingingIcon, XIcon } from "@phosphor-icons/react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/account";
import type { Notification } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { NotificationIcon } from "./notification-icon";
import { cx } from "./ui";

const POLL_MS = 15_000;

type Permission = NotificationPermission | "unsupported";

function subscribePermission(onChange: () => void) {
  window.addEventListener("focus", onChange);
  return () => window.removeEventListener("focus", onChange);
}

function readPermission(): Permission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

const noopSubscribe = () => () => {};

export function NotificationBell({ unread, items }: { unread: number; items: Notification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [, startTransition] = useTransition();
  const lastId = useRef(items.reduce((max, n) => Math.max(max, n.id), 0));
  const panelRef = useRef<HTMLDivElement>(null);
  const permission = useSyncExternalStore(subscribePermission, readPermission, () => "unsupported");
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [, forceRender] = useState(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { items: Notification[] };
        const fresh = data.items.filter((n) => n.id > lastId.current).reverse();
        if (fresh.length === 0) return;
        lastId.current = Math.max(...fresh.map((n) => n.id));
        setToasts((list) => [...list, ...fresh].slice(-3));
        for (const n of fresh) {
          window.setTimeout(() => dismiss(n.id), 7000);
          if (readPermission() === "granted" && document.visibilityState === "hidden") {
            const native = new Notification(n.title, { body: n.body, tag: `vision-${n.id}` });
            native.onclick = () => {
              window.focus();
              if (n.link) router.push(n.link);
            };
          }
        }
        router.refresh();
      } catch {
        // network hiccup, next tick retries
      }
    }

    const timer = window.setInterval(poll, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, dismiss]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openItem(n: Notification) {
    setOpen(false);
    dismiss(n.id);
    startTransition(async () => {
      if (!n.read_at) await markNotificationRead(n.id);
      if (n.link) router.push(n.link);
    });
  }

  async function enableBrowserNotifications() {
    await Notification.requestPermission();
    forceRender((x) => x + 1);
  }

  return (
    <>
      <div ref={panelRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Bildirishnomalar, ${unread} ta o‘qilmagan`}
          aria-expanded={open}
          className={cx(
            "relative inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors duration-200",
            "hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
            open && "bg-sunken text-ink",
          )}
        >
          {unread > 0 ? <BellRingingIcon size={20} weight="fill" /> : <BellIcon size={20} />}
          {unread > 0 ? (
            <span className="absolute right-1 top-1 min-w-4 rounded-full bg-accent px-1 text-center font-mono text-[10px] leading-4 text-accent-ink">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="animate-rise absolute right-0 top-12 z-30 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <p className="text-sm font-medium">Bildirishnomalar</p>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={() => startTransition(() => markAllNotificationsRead())}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Hammasini o‘qildi qilish
                </button>
              ) : null}
            </div>

            {permission === "default" ? (
              <button
                type="button"
                onClick={enableBrowserNotifications}
                className="flex w-full items-center gap-2 border-b border-line bg-accent-soft px-4 py-2.5 text-left text-xs text-accent-soft-ink"
              >
                <BellRingingIcon size={14} weight="bold" />
                Brauzer bildirishnomalarini yoqish
              </button>
            ) : null}

            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">Hozircha bildirishnoma yo‘q.</p>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto py-1">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-sunken"
                    >
                      <NotificationIcon type={n.type} unread={!n.read_at} />
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className={cx("text-[13px] leading-snug", n.read_at ? "text-muted" : "font-medium text-ink")}>
                          {n.title}
                        </span>
                        {n.body ? <span className="truncate text-xs text-faint">{n.body}</span> : null}
                        <span className="text-[11px] text-faint" suppressHydrationWarning>
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-xs font-medium text-muted hover:bg-sunken hover:text-ink"
            >
              Barchasini ko‘rish
            </Link>
          </div>
        ) : null}
      </div>

      {mounted
        ? createPortal(<Toasts toasts={toasts} onOpen={openItem} onDismiss={dismiss} />, document.body)
        : null}
    </>
  );
}

function Toasts({
  toasts,
  onOpen,
  onDismiss,
}: {
  toasts: Notification[];
  onOpen: (n: Notification) => void;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 z-40 grid w-[min(360px,calc(100vw-2rem))] gap-2 md:bottom-6 md:right-6"
    >
      {toasts.map((n) => (
        <div
          key={n.id}
          className="animate-rise pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3 shadow-card"
        >
          <button type="button" onClick={() => onOpen(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
            <NotificationIcon type={n.type} unread />
            <span className="grid min-w-0 gap-0.5">
              <span className="text-[13px] font-medium leading-snug">{n.title}</span>
              {n.body ? <span className="truncate text-xs text-muted">{n.body}</span> : null}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            aria-label="Yopish"
            className="rounded-md p-1 text-faint hover:bg-sunken hover:text-ink"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
