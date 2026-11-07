import type { Metadata } from "next";
import { localizeProject } from "@/data/i18n";
import { projects } from "@/data/projects";
import PortfolioHome from "../components/PortfolioHome";

const featuredProject = projects[0];
const localizedFeaturedProject = localizeProject(featuredProject, "ru");

export const metadata: Metadata = {
  title: { absolute: "Портфолио 3D-художника" },
  description:
    "Разноплановое портфолио 3D-художника: транспорт, предметы, машины и интерактивные модели.",
  alternates: {
    canonical: "/ru",
    languages: {
      en: "/",
      ru: "/ru",
    },
  },
  openGraph: {
    title: "Портфолио 3D-художника",
    description:
      "Разноплановое портфолио 3D-художника: транспорт, предметы, машины и интерактивные модели.",
    type: "website",
    locale: "ru_RU",
    url: "/ru",
    images: [
      { url: featuredProject.cover, alt: localizedFeaturedProject.title },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Портфолио 3D-художника",
    description:
      "Разноплановое портфолио 3D-художника: транспорт, предметы, машины и интерактивные модели.",
    images: [featuredProject.cover],
  },
};

export default function RussianHome() {
  return <PortfolioHome locale="ru" />;
}
