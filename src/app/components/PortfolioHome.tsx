import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { projects } from "@/data/projects";
import { siteSettings } from "@/data/site-settings";
import FeaturedProjectCarousel from "./FeaturedProjectCarousel";
import ContactLinks from "./ContactLinks";
import {
  alternateLocale,
  copy,
  homePath,
  localizeProject,
  projectPath,
  type Locale,
} from "@/data/i18n";

const routeTransition = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

export default function PortfolioHome({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const about = siteSettings[locale].about;
  const localizedProjects = projects.map((project) =>
    localizeProject(project, locale),
  );
  const featuredProject = localizedProjects[0];
  const otherLocale = alternateLocale(locale);

  return (
    <ViewTransition enter={routeTransition} exit={routeTransition} default="none">
      <main
        id="top"
        className="min-h-screen overflow-hidden bg-[#efeee9] text-black"
      >
        <header
          className="sticky top-0 z-50 flex h-14 md:h-[4.375rem] items-center justify-between border-b border-black bg-[#efeee9]/95 px-4 backdrop-blur-sm md:px-7"
          style={{ viewTransitionName: "site-header" }}
        >
          <Link
            href={homePath(locale)}
            className="text-[1.35rem] sm:text-[1.75rem] md:text-[2rem] leading-none font-black tracking-[-0.04em] uppercase"
          >
            Portfolio.
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-8">
            <nav
              className="flex items-center gap-2.5 font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.14em] sm:tracking-[0.16em] text-black uppercase sm:gap-4 md:gap-8"
              aria-label={locale === "ru" ? "Основная навигация" : "Primary navigation"}
            >
              <a className="transition-opacity hover:opacity-45" href="#work">
                {text.nav.work}
              </a>
              <a className="transition-opacity hover:opacity-45" href="#about">
                {text.nav.about}
              </a>
              <a className="hidden transition-opacity hover:opacity-45 sm:inline" href="#contact">
                {text.nav.contact}
              </a>
            </nav>
            <Link
              href={homePath(otherLocale)}
              className="rounded-full border border-black px-2 py-1 sm:px-2.5 sm:py-1.5 font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.14em] sm:tracking-[0.16em] text-black uppercase transition-colors hover:bg-black hover:text-white"
              hrefLang={otherLocale}
              aria-label={locale === "en" ? "Открыть русскую версию" : "Open English version"}
            >
              {otherLocale.toUpperCase()}
            </Link>
          </div>
        </header>

        <section className="grid min-h-0 border-b border-black lg:grid-cols-[58.5%_41.5%] lg:min-h-[calc(80svh-3.5rem)]">
          <div className="flex flex-col justify-between border-b border-black px-4 py-5 sm:py-7 md:px-7 md:py-9 lg:border-r lg:border-b-0">
            <div>
              <p className="hero-reveal mb-5 sm:mb-8 font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.14em] sm:tracking-[0.16em] text-black/55 uppercase">
                {text.hero.eyebrow}
              </p>

              <h1
                className="hero-reveal hero-reveal-delay text-[clamp(2.15rem,10.5vw,4.5rem)] leading-[0.88] font-[950] tracking-[-0.04em] sm:leading-[0.76] sm:tracking-[-0.08em] uppercase lg:text-[clamp(4.8rem,6.1vw,7.5rem)]"
                aria-label={text.hero.headlineLabel}
              >
                {text.hero.headline.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
            </div>

            <div className="hero-reveal hero-reveal-delay-2 mt-8 sm:mt-12">
              <p className="mb-3 sm:mb-5 text-xs sm:text-sm font-bold tracking-[-0.02em] uppercase">
                {text.hero.selected}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#work"
                  className="rounded-full bg-black px-4 py-2.5 sm:px-5 sm:py-3 font-mono text-[9px] sm:text-[10px] font-normal tracking-[0.1em] text-white uppercase transition-colors hover:bg-black/70"
                >
                  {text.hero.viewWork}
                </a>
              </div>
            </div>
          </div>

          <FeaturedProjectCarousel
            projects={localizedProjects}
            locale={locale}
            linkLabel={text.hero.viewWork}
          />
        </section>

        <section className="border-b border-black px-4 py-5 sm:py-[2.45rem] md:px-7 md:py-[3.5rem]">
          <p className="max-w-[1300px] text-[clamp(1.35rem,4.5vw,2.5rem)] leading-[1.12] sm:leading-[1.02] tracking-[-0.03em] sm:tracking-[-0.045em] lg:text-[clamp(2rem,2.6vw,3.5rem)]">
            {text.intro}
          </p>
        </section>

        <section id="work" className="scroll-mt-14 sm:scroll-mt-[4.375rem]">
          <div className="px-4 pt-5 pb-0 sm:pt-7 md:px-7 md:pt-10">
            <h2 className="text-[clamp(2rem,7.5vw,3.8rem)] leading-[0.9] sm:leading-[0.84] font-[950] tracking-[-0.04em] sm:tracking-[-0.08em] uppercase lg:text-[clamp(2.8rem,4.55vw,5.5rem)]">
              {text.work.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-black p-3 sm:grid-cols-2 lg:grid-cols-3">
            {localizedProjects.map((project) => {
              const projectImage = (
                <Image
                  src={project.cover}
                  alt={project.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain p-[4%] transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                />
              );

              return (
                <article
                  key={project.slug}
                  className="portfolio-card group min-w-0"
                >
                  <Link
                    href={projectPath(locale, project.slug)}
                    transitionTypes={["nav-forward"]}
                    className="block"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#d8d7d1]">
                      {project.slug === featuredProject?.slug ? (
                        projectImage
                      ) : (
                        <ViewTransition
                          name={`project-cover-${project.slug}`}
                          share="project-morph"
                          default="none"
                        >
                          {projectImage}
                        </ViewTransition>
                      )}

                      {(project.model || project.video) && (
                        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex gap-1.5">
                          {project.model && (
                            <span
                              className="flex items-center gap-1 rounded-full bg-black px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-white uppercase"
                              title={locale === "ru" ? "Интерактивная 3D-модель" : "Interactive 3D model"}
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              >
                                <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
                                <path d="M3 7l9 5 9-5M12 12v10" />
                              </svg>
                              3D
                            </span>
                          )}
                          {project.video && (
                            <span
                              className="flex items-center gap-1 rounded-full border border-black bg-[#efeee9] px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-black uppercase"
                              title={locale === "ru" ? "Есть видео" : "Has video"}
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-2.5 w-2.5"
                                fill="currentColor"
                              >
                                <path d="M6 4v16l14-8L6 4Z" />
                              </svg>
                              {locale === "ru" ? "Видео" : "Video"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 pb-4">
                      <h3 className="text-[clamp(1.15rem,1.55vw,1.75rem)] leading-[0.94] font-[950] tracking-[-0.05em] uppercase">
                        {project.title}
                      </h3>
                      <p className="mt-1 font-mono text-[9px] tracking-[0.09em] text-black/55 uppercase sm:text-[10px]">
                        {project.category} · {project.software[0]} · {project.year}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="about"
          className="scroll-mt-[4.375rem] grid border-b border-black bg-black text-white lg:grid-cols-[0.34fr_0.66fr]"
        >
          <div className="border-b border-white/25 p-4 md:p-7 lg:border-r lg:border-b-0">
            <p className="font-mono text-[10px] font-normal tracking-[0.16em] text-white/55 uppercase">
              {about.label}
            </p>
          </div>
          <div className="p-4 py-8 sm:py-14 md:p-7 md:py-20">
            <h2 className="max-w-[1300px] text-[clamp(1.5rem,5.5vw,2.5rem)] leading-[1.08] sm:leading-[1.02] tracking-[-0.03em] sm:tracking-[-0.045em] lg:text-[clamp(2.25rem,2.6vw,3.5rem)]">
              {about.title}
            </h2>
            <div className="mt-8 sm:mt-14 grid gap-6 sm:gap-8 border-t border-white/25 pt-6 text-sm md:grid-cols-3">
              <div>
                <p className="mb-2 font-mono text-[9px] font-normal tracking-[0.14em] text-white/45 uppercase">
                  {about.focusLabel}
                </p>
                <p>{about.focus.map((item) => <span key={item} className="block">{item}</span>)}</p>
              </div>
              <div>
                <p className="mb-2 font-mono text-[9px] font-normal tracking-[0.14em] text-white/45 uppercase">
                  {about.toolsLabel}
                </p>
                <p>{about.tools.map((item) => <span key={item} className="block">{item}</span>)}</p>
              </div>
              <div id="contact">
                <p className="mb-2 font-mono text-[9px] font-normal tracking-[0.14em] text-white/45 uppercase">
                  {about.contactLabel}
                </p>
                <ContactLinks items={about.contact} locale={locale} />
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 px-4 py-6 font-mono text-[10px] font-normal tracking-[0.1em] uppercase md:flex-row md:items-center md:justify-between md:px-7">
          <span>{text.footer.portfolio}</span>
          <span>{text.footer.role}</span>
          <a className="underline underline-offset-4" href="#top">
            {text.footer.top}
          </a>
        </footer>
      </main>
    </ViewTransition>
  );
}
