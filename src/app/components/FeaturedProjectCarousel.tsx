"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { projectPath, type Locale } from "@/data/i18n";
import type { PortfolioProject } from "@/data/projects";

type FeaturedProjectCarouselProps = {
  projects: PortfolioProject[];
  locale: Locale;
  linkLabel: string;
};

export default function FeaturedProjectCarousel({
  projects,
  locale,
  linkLabel,
}: FeaturedProjectCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (projects.length < 2) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % projects.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [projects.length]);

  if (projects.length === 0) return null;

  const activeProject = projects[activeIndex] ?? projects[0];

  return (
    <div className="hero-media group relative min-h-[46.4svh] overflow-hidden bg-black lg:min-h-0">
      <Link
        href={projectPath(locale, activeProject.slug)}
        transitionTypes={["nav-forward"]}
        className="absolute inset-0"
        aria-label={`${linkLabel}: ${activeProject.title}`}
      >
        {projects.map((project, index) => (
          <Image
            key={project.slug}
            src={project.cover}
            alt={index === activeIndex ? project.title : ""}
            fill
            preload={index === 0}
            sizes="(max-width: 1024px) 100vw, 42vw"
            className={`scale-[1.1] object-contain transition-[opacity,transform] duration-1000 ease-out group-hover:scale-[1.14] ${
              index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />
        ))}

        <div
          className="absolute bottom-5 left-5 max-w-[calc(100%-7rem)] bg-black px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-white uppercase"
          aria-live="polite"
        >
          {activeProject.title} ↗
        </div>
      </Link>

      {projects.length > 1 && (
        <div
          className="absolute right-5 bottom-5 z-10 flex gap-1.5"
          aria-label={locale === "ru" ? "Выбор проекта" : "Choose project"}
        >
          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                index === activeIndex ? "w-7 bg-white" : "w-1.5 bg-white/45 hover:bg-white/75"
              }`}
              aria-label={project.title}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
