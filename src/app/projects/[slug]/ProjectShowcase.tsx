"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, ViewTransition } from "react";
import {
  alternateLocale,
  copy,
  homePath,
  projectPath,
  type Locale,
} from "@/data/i18n";
import type { PortfolioProject } from "@/data/projects";
import { getYouTubeEmbedUrl } from "@/data/youtube";
import ImageLightbox, { type LightboxSlide } from "../../components/ImageLightbox";
import ModelViewer from "../../components/ModelViewer";
import WireframeCompare from "../../components/WireframeCompare";

type ProjectShowcaseProps = {
  project: PortfolioProject;
  nextProject: PortfolioProject;
  projectNumber: number;
  projectCount: number;
  locale: Locale;
};

const formatProjectNumber = (value: number) => String(value).padStart(2, "0");

const routeTransition = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

export default function ProjectShowcase({
  project,
  nextProject,
  projectNumber,
  projectCount,
  locale,
}: ProjectShowcaseProps) {
  const [view, setView] = useState<"render" | "wireframe" | "3d" | "video">("render");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hasWireframe = Boolean(project.wireframe);
  const hasModel = Boolean(project.model);
  const videoEmbedUrl = getYouTubeEmbedUrl(project.video);
  const hasVideo = Boolean(videoEmbedUrl);
  const activeModel = view === "3d" ? project.model : undefined;
  const isInteractive = Boolean(activeModel);
  const isWireframe = view === "wireframe" && hasWireframe;
  const isVideo = view === "video" && hasVideo;
  const text = copy[locale].project;
  const otherLocale = alternateLocale(locale);
  const localizedHomePath = homePath(locale);
  const usesCompactTitle = project.title
    .split(/\s+/)
    .some((word) => word.length > 18);

  const lightboxSlides: LightboxSlide[] = [
    {
      src: project.cover,
      alt:
        locale === "ru"
          ? `Рендер ${project.title}`
          : `${project.title} render`,
    },
    ...(project.wireframe
      ? [
          {
            src: project.wireframe,
            alt:
              locale === "ru"
                ? `Сетка ${project.title}`
                : `${project.title} wireframe`,
          },
        ]
      : []),
    ...(project.gallery ?? []).map((image, index) => ({
      src: image,
      alt:
        locale === "ru"
          ? `${project.title}, рендер проекта ${index + 1}`
          : `${project.title}, project render ${index + 1}`,
    })),
  ];

  const galleryOffset = 1 + (project.wireframe ? 1 : 0);

  return (
    <ViewTransition
      enter={routeTransition}
      exit={routeTransition}
      default="none"
    >
    <main className="min-h-screen bg-[#efeee9] text-[#050505]">
      <header
        className="sticky top-0 z-50 flex h-14 md:h-[4.375rem] items-center justify-between border-b border-black/20 bg-[#efeee9]/95 px-4 backdrop-blur-md sm:px-6 lg:px-10"
        style={{ viewTransitionName: "site-header" }}
      >
        <Link
          href={localizedHomePath}
          transitionTypes={["nav-back"]}
          className="text-[1.35rem] sm:text-[1.75rem] md:text-[2rem] leading-none font-black tracking-[-0.04em] transition-opacity hover:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          PORTFOLIO.
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.14em] sm:tracking-[0.16em] uppercase">
          <span className="hidden text-black/45 sm:inline">
            {formatProjectNumber(projectNumber)} / {formatProjectNumber(projectCount)}
          </span>
          <Link
            href={projectPath(otherLocale, project.slug)}
            transitionTypes={["nav-back"]}
            hrefLang={otherLocale}
            lang={otherLocale}
            aria-label={
              locale === "en"
                ? "Открыть русскую версию"
                : "Open the English version"
            }
            className="border-b border-transparent py-1 transition-colors hover:border-black focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {otherLocale.toUpperCase()}
          </Link>
          <Link
            href={`${localizedHomePath}#work`}
            transitionTypes={["nav-back"]}
            className="border-b border-transparent py-1 transition-colors hover:border-black focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {text.close}
          </Link>
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-1 border-b border-black/20 lg:min-h-[calc(40.32svh-2.8rem)] lg:grid-cols-12">
        <div className="flex flex-col justify-between px-4 py-4 sm:px-6 sm:py-[1.4rem] lg:col-span-9 lg:border-r lg:border-black/20 lg:px-10 lg:py-[1.68rem]">
          <p className="hero-reveal font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.16em] sm:tracking-[0.18em] text-black/50 uppercase sm:text-xs">
            {project.category} / {project.year}
          </p>

          <h1
            className={`hero-reveal hero-reveal-delay my-4 sm:my-[2.24rem] max-w-full break-words leading-[0.9] sm:leading-[0.84] font-[950] tracking-[-0.04em] sm:tracking-[-0.08em] uppercase lg:my-[2.8rem] ${
              usesCompactTitle
                ? "hyphens-auto text-[clamp(1.75rem,7.5vw,3rem)] lg:text-[clamp(3.25rem,4.55vw,6rem)]"
                : "text-[clamp(1.85rem,7.5vw,3.25rem)] lg:text-[clamp(3.25rem,4.55vw,6rem)]"
            }`}
          >
            {project.title}
          </h1>
        </div>

        <aside className="flex min-h-0 flex-col justify-between border-t border-black/20 px-4 py-3 sm:px-6 lg:col-span-3 lg:border-t-0 lg:px-8 lg:py-[1.4rem]">
          <span className="font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.16em] sm:tracking-[0.18em] text-black/45 uppercase sm:text-xs">
            {text.index}
          </span>
          <div className="mt-2 flex items-baseline justify-between sm:mt-4 lg:mt-0 lg:block">
            <span className="text-4xl sm:text-6xl leading-none font-medium tracking-[-0.06em] lg:text-7xl">
              {formatProjectNumber(projectNumber)}
            </span>
            <p className="max-w-32 text-right text-[11px] sm:text-xs leading-relaxed text-black/55 lg:mt-5 lg:text-left">
              {text.summary}
            </p>
          </div>
        </aside>
      </section>

      <section id="project-view" className="relative border-b border-black/20 bg-[#090909] text-white">
        <div className="absolute top-4 right-4 left-4 z-20 flex items-center justify-between gap-4 sm:top-6 sm:right-6 sm:left-6">
          <span className="hidden font-mono text-[10px] font-normal tracking-[0.18em] text-white/55 uppercase sm:block">
            {text.view}
          </span>

          <div
            className="ml-auto flex max-w-full overflow-x-auto rounded-full bg-[#efeee9] p-1 font-mono text-[9px] font-normal tracking-[0.1em] text-black uppercase shadow-xl sm:text-xs sm:tracking-[0.12em]"
            role="tablist"
            aria-label={text.view}
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "render"}
              onClick={() => setView("render")}
              className={`whitespace-nowrap rounded-full px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 ${
                view === "render" ? "bg-black text-white" : "hover:bg-black/8"
              }`}
            >
              {text.render}
            </button>

            {hasWireframe && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "wireframe"}
                onClick={() => setView("wireframe")}
                className={`whitespace-nowrap rounded-full px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 ${
                  view === "wireframe" ? "bg-black text-white" : "hover:bg-black/8"
                }`}
              >
                {text.wireframe}
              </button>
            )}

            {hasModel && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "3d"}
                onClick={() => setView("3d")}
                className={`whitespace-nowrap rounded-full px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 ${
                  view === "3d" ? "bg-black text-white" : "hover:bg-black/8"
                }`}
              >
                {text.interactive}
              </button>
            )}

            {hasVideo && (
              <button
                type="button"
                role="tab"
                aria-selected={view === "video"}
                onClick={() => setView("video")}
                className={`whitespace-nowrap rounded-full px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 ${
                  view === "video" ? "bg-black text-white" : "hover:bg-black/8"
                }`}
              >
                {text.video}
              </button>
            )}
          </div>
        </div>

        <div className="relative h-[62svh] min-h-[380px] w-full overflow-hidden sm:h-[72svh] sm:min-h-[500px] lg:h-[88svh]">
          {isVideo && videoEmbedUrl ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black pt-16 sm:px-8 sm:py-20 lg:px-14">
              <iframe
                className="aspect-video w-full max-w-[1600px] border-0"
                src={videoEmbedUrl}
                title={
                  locale === "ru"
                    ? `Видео проекта ${project.title}`
                    : `${project.title} project video`
                }
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : isWireframe && project.wireframe ? (
            <WireframeCompare
              renderSrc={project.cover}
              wireframeSrc={project.wireframe}
              title={project.title}
              locale={locale}
              onOpenFullscreen={() => setLightboxIndex(1)}
            />
          ) : activeModel ? (
            <ModelViewer
              src={activeModel}
              alt={
                locale === "ru"
                  ? `Интерактивная 3D-модель ${project.title}`
                  : `Interactive 3D model of ${project.title}`
              }
              poster={project.cover}
              locale={locale}
              className="h-full min-h-full"
            />
          ) : (
            <ViewTransition
              name={`project-cover-${project.slug}`}
              share="project-morph"
              default="none"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="absolute inset-0 cursor-zoom-in"
                aria-label={`${text.openFullscreen}: ${project.title}`}
              >
                <Image
                  src={project.cover}
                  alt={
                    locale === "ru"
                      ? `Рендер ${project.title}`
                      : `${project.title} render`
                  }
                  fill
                  preload
                  sizes="100vw"
                  className="hero-media object-contain px-4 py-16 sm:px-10 sm:py-20 lg:px-16"
                />
              </button>
            </ViewTransition>
          )}
        </div>

        <div className="flex min-h-12 items-center border-t border-white/15 px-4 font-mono text-[10px] font-normal tracking-[0.14em] text-white/55 uppercase sm:px-6 sm:text-xs lg:px-10">
          <span>
            {isVideo
              ? text.videoHint
              : isWireframe
                ? text.wireframeHint
                : isInteractive
                  ? text.interactionHint
                  : text.finalRender}
          </span>
        </div>
      </section>

      <section className="border-b border-black/20 bg-[#efeee9] px-4 py-5 text-black sm:px-6 sm:py-9 lg:px-10">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [text.polygons, project.specs?.polygons],
            [text.vertices, project.specs?.vertices],
            [text.textures, project.specs?.textures],
            [text.materials, project.specs?.materials],
            [text.uvMaps, project.specs?.uvMaps],
            [text.workflow, project.specs?.workflow],
            [text.software, project.software.join(" / ")],
            [text.renderer, project.specs?.renderer],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-t border-black/20 py-3 sm:py-5 sm:px-5"
            >
              <dt className="font-mono text-[8px] sm:text-[9px] tracking-[0.12em] text-black/50 uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-sm sm:text-base font-semibold tracking-[-0.02em] break-words">
                {value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {project.gallery && project.gallery.length > 0 && (
        <section className="border-b border-black/20" aria-labelledby="project-gallery-title">
          <div className="flex min-h-16 sm:min-h-24 items-end justify-between border-b border-black/20 px-4 py-4 sm:py-6 sm:px-6 lg:px-10">
            <h2
              id="project-gallery-title"
              className="font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.18em] uppercase sm:text-xs"
            >
              {text.gallery}
            </h2>
            <span className="font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.16em] text-black/45 sm:text-xs">
              {formatProjectNumber(project.gallery.length)} {text.images}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setLightboxIndex(galleryOffset + index)}
                  className="relative aspect-square min-w-0 cursor-zoom-in overflow-hidden bg-[#d8d7d1]"
                  aria-label={`${text.openFullscreen}: ${project.title}, ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={
                      locale === "ru"
                        ? `${project.title}, рендер проекта ${index + 1}`
                        : `${project.title}, project render ${index + 1}`
                    }
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-[4%] transition-transform duration-500 hover:scale-[1.02]"
                  />
                </button>
              ))}
          </div>
        </section>
      )}

      <Link
        href={projectPath(locale, nextProject.slug)}
        transitionTypes={["nav-forward"]}
        className="group grid min-h-0 overflow-hidden bg-[#d8d7d2] focus-visible:outline-2 focus-visible:outline-offset-[-4px] lg:min-h-[70svh] lg:grid-cols-2"
        aria-label={`${text.next}: ${nextProject.title}`}
      >
        <div className="flex min-h-0 flex-col justify-between border-b border-black/20 px-4 py-6 sm:px-6 sm:py-10 lg:min-h-0 lg:border-r lg:border-b-0 lg:px-10 lg:py-12">
          <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.18em] uppercase sm:text-xs">
            <span>{text.next}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
          </div>
          <div className="mt-8 sm:mt-20">
            <p className="mb-2 sm:mb-5 text-[11px] sm:text-xs text-black/50">{nextProject.category}</p>
            <h2 className="max-w-[14ch] text-[clamp(1.75rem,7vw,3.5rem)] leading-[0.9] sm:leading-[0.84] font-[950] tracking-[-0.04em] sm:tracking-[-0.08em] uppercase lg:text-[clamp(2.75rem,4.55vw,5.5rem)]">
              {nextProject.title}
            </h2>
          </div>
        </div>

        <div className="relative min-h-[35svh] sm:min-h-[55svh] overflow-hidden bg-[#111]">
          <ViewTransition
            name={`project-cover-${nextProject.slug}`}
            share="project-morph"
            default="none"
          >
            <Image
              src={nextProject.cover}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain p-6 sm:p-12 transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />
          </ViewTransition>
        </div>
      </Link>

      <footer className="flex min-h-28 items-end justify-between border-t border-black/20 px-4 py-7 font-mono text-[10px] font-normal tracking-[0.15em] uppercase sm:px-6 sm:text-xs lg:px-10">
        <span>{text.portfolio}</span>
        <Link
          href={`${localizedHomePath}#work`}
          transitionTypes={["nav-back"]}
          className="border-b border-black pb-1"
        >
          {text.all}
        </Link>
      </footer>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxSlides}
          initialIndex={lightboxIndex}
          closeLabel={text.closeFullscreen}
          prevLabel={text.previousImage}
          nextLabel={text.nextImage}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
    </ViewTransition>
  );
}
