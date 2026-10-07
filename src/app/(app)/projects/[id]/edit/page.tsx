import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCeo } from "@/lib/auth";
import { getProject } from "@/lib/data";
import { ProjectForm } from "@/components/project-form";

export const metadata: Metadata = { title: "Loyihani tahrirlash" };

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  await requireCeo();
  const project = await getProject(Number((await params).id));
  if (!project) notFound();

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <header className="animate-rise grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Loyihani tahrirlash</h1>
        <p className="text-sm text-muted">{project.title}</p>
      </header>
      <ProjectForm members={[]} project={project} />
    </div>
  );
}
