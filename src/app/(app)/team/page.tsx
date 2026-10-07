import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { TrashIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireCeo } from "@/lib/auth";
import { listMembers } from "@/lib/data";
import { removeMember } from "@/app/actions/team";
import { ConfirmForm } from "@/components/confirm-form";
import { Avatar, EmptyState, ProgressBar } from "@/components/ui";
import { AddMemberForm } from "./add-member-form";

export const metadata: Metadata = { title: "Jamoa" };

export default async function TeamPage() {
  await requireCeo();
  const members = await listMembers();

  return (
    <div className="grid gap-8">
      <header className="animate-rise grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Jamoa</h1>
        <p className="text-sm text-muted">
          Jamoa a‘zolari tizimga kirib, loyihalarni va o‘z topshiriqlarini ko‘radi.
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid gap-3">
          {members.length === 0 ? (
            <EmptyState
              icon={<UsersThreeIcon size={22} />}
              title="Jamoada hali hech kim yo‘q"
              text="O‘ng tomondagi forma orqali birinchi jamoa a‘zosini qo‘shing."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {members.map((m, i) => {
                const total = m.open_tasks + m.done_tasks;
                const pct = total ? Math.round((m.done_tasks / total) * 100) : 0;
                return (
                  <li
                    key={m.id}
                    style={{ "--i": i } as CSSProperties}
                    className="animate-rise grid gap-4 rounded-xl border border-line bg-surface p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={m.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted">{m.position || "Jamoa a‘zosi"}</p>
                        <p className="mt-1 truncate font-mono text-xs text-faint">{m.email}</p>
                      </div>
                      <ConfirmForm
                        action={removeMember}
                        fields={{ id: m.id }}
                        message={`${m.name} jamoadan o‘chirilsinmi? Uning topshiriqlari ijrochisiz qoladi.`}
                      >
                        <button
                          type="submit"
                          aria-label={`${m.name}ni o‘chirish`}
                          className="rounded-lg p-2 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </ConfirmForm>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex justify-between text-xs text-muted">
                        <span>
                          {m.open_tasks} ta ochiq, {m.done_tasks} ta bajarilgan
                        </span>
                        <span className="font-mono tabular-nums">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <aside className="lg:sticky lg:top-24">
          <AddMemberForm />
        </aside>
      </div>
    </div>
  );
}
