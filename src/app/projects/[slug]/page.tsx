import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizeProject } from "@/data/i18n";
import { getProject, projects } from "@/data/projects";
import ProjectShowcase from "./ProjectShowcase";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: { absolute: `${project.title} | 3D Artist Portfolio` },
    description: project.description,
    alternates: {
      canonical: `/projects/${project.slug}`,
      languages: {
        en: `/projects/${project.slug}`,
        ru: `/ru/projects/${project.slug}`,
      },
    },
    openGraph: {
      title: project.title,
      description: project.description,
      type: "website",
      url: `/projects/${project.slug}`,
      images: [{ url: project.cover, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: [project.cover],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length];

  return (
    <ProjectShowcase
      project={localizeProject(project, "en")}
      nextProject={localizeProject(nextProject, "en")}
      projectNumber={projectIndex + 1}
      projectCount={projects.length}
      locale="en"
    />
  );
}
