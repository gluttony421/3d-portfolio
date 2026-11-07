import type { Metadata } from "next";
import { projects } from "@/data/projects";
import PortfolioHome from "./components/PortfolioHome";

const featuredProject = projects[0];

export const metadata: Metadata = {
  title: { absolute: "3D Artist Portfolio" },
  description:
    "A varied 3D artist portfolio featuring vehicles, objects, machines and interactive models.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ru: "/ru",
    },
  },
  openGraph: {
    title: "3D Artist Portfolio",
    description:
      "A varied 3D artist portfolio featuring vehicles, objects, machines and interactive models.",
    type: "website",
    locale: "en_US",
    url: "/",
    images: [{ url: featuredProject.cover, alt: featuredProject.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3D Artist Portfolio",
    description:
      "A varied 3D artist portfolio featuring vehicles, objects, machines and interactive models.",
    images: [featuredProject.cover],
  },
};

export default function Home() {
  return <PortfolioHome locale="en" />;
}
