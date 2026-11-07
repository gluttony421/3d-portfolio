import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizeProject } from "@/data/i18n";
import { getProject, projects } from "@/data/projects";
import ProjectShowcase from "../../../projects/[slug]/ProjectShowcase";

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
    return { title: "Проект не найден" };
  }

  const localizedProject = localizeProject(project, "ru");

  return {
    title: { absolute: `${localizedProject.title} | Портфолио 3D-художника` },
    description: localizedProject.description,
    alternates: {
      canonical: `/ru/projects/${project.slug}`,
      languages: {
        en: `/projects/${project.slug}`,
        ru: `/ru/projects/${project.slug}`,
      },
    },
    openGraph: {
      title: localizedProject.title,
      description: localizedProject.description,
      type: "website",
      url: `/ru/projects/${project.slug}`,
      locale: "ru_RU",
      images: [{ url: project.cover, alt: localizedProject.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedProject.title,
      description: localizedProject.description,
      images: [project.cover],
    },
  };
}

export default async function RussianProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const projectIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(projectIndex + 1) % projects.length];

  return (
    <ProjectShowcase
      project={localizeProject(project, "ru")}
      nextProject={localizeProject(nextProject, "ru")}
      projectNumber={projectIndex + 1}
      projectCount={projects.length}
      locale="ru"
    />
  );
}
