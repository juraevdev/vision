import type { Metadata } from "next";
import { requireCeo } from "@/lib/auth";
import { listMembers } from "@/lib/data";
import { ProjectForm } from "@/components/project-form";

export const metadata: Metadata = { title: "Yangi loyiha" };

export default async function NewProjectPage() {
  await requireCeo();
  const members = (await listMembers()).map(({ id, name }) => ({ id, name }));

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <header className="animate-rise grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Yangi loyiha</h1>
        <p className="text-sm text-muted">Maqsadni belgilang va ishni jamoa a‘zolariga taqsimlang.</p>
      </header>
      <ProjectForm members={members} />
    </div>
  );
}
