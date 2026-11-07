import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { absoluteUrl } from "@/data/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const homePages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          en: absoluteUrl("/"),
          ru: absoluteUrl("/ru"),
        },
      },
    },
    {
      url: absoluteUrl("/ru"),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          en: absoluteUrl("/"),
          ru: absoluteUrl("/ru"),
        },
      },
    },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.flatMap((project) => {
    const englishPath = `/projects/${project.slug}`;
    const russianPath = `/ru/projects/${project.slug}`;
    const alternates = {
      languages: {
        en: absoluteUrl(englishPath),
        ru: absoluteUrl(russianPath),
      },
    };

    return [
      {
        url: absoluteUrl(englishPath),
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates,
        images: [absoluteUrl(project.cover)],
      },
      {
        url: absoluteUrl(russianPath),
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates,
        images: [absoluteUrl(project.cover)],
      },
    ];
  });

  return [...homePages, ...projectPages];
}
