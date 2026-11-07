"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, ViewTransition } from "react";
import type { PortfolioProject } from "@/data/projects";
import { projectPath, type Locale } from "@/data/i18n";

type SortOption = "default" | "az" | "za";

type ProjectGalleryProps = {
  projects: PortfolioProject[];
  featuredSlug?: string;
  locale: Locale;
};

export default function ProjectGallery({
  projects,
  featuredSlug,
  locale,
}: ProjectGalleryProps) {
  const isRu = locale === "ru";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSoftware, setSelectedSoftware] = useState("all");
  const [selectedRenderer, setSelectedRenderer] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("default");

  // Extract unique filter options from the projects list
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [projects]);

  const softwareList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      p.software?.forEach((s) => set.add(s.trim()));
    });
    return Array.from(set).filter(Boolean);
  }, [projects]);

  const renderers = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      const r = p.specs?.renderer?.trim();
      if (r) set.add(r);
    });
    return Array.from(set);
  }, [projects]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedSoftware !== "all" ||
    selectedRenderer !== "all" ||
    sortOption !== "default";

  function resetFilters() {
    setSearch("");
    setSelectedCategory("all");
    setSelectedSoftware("all");
    setSelectedRenderer("all");
    setSortOption("default");
  }

  // Filter and sort the projects
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      // Search by title or category
      if (query) {
        const titleMatch = project.title.toLowerCase().includes(query);
        const catMatch = project.category?.toLowerCase().includes(query);
        const softMatch = project.software?.some((s) =>
          s.toLowerCase().includes(query),
        );
        if (!titleMatch && !catMatch && !softMatch) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && project.category !== selectedCategory) {
        return false;
      }

      // Software filter
      if (
        selectedSoftware !== "all" &&
        !project.software?.some(
          (s) => s.toLowerCase() === selectedSoftware.toLowerCase(),
        )
      ) {
        return false;
      }

      // Renderer filter
      if (
        selectedRenderer !== "all" &&
        project.specs?.renderer?.toLowerCase() !== selectedRenderer.toLowerCase()
      ) {
        return false;
      }

      return true;
    });

    if (sortOption === "az") {
      filtered.sort((a, b) => a.title.localeCompare(b.title, locale));
    } else if (sortOption === "za") {
      filtered.sort((a, b) => b.title.localeCompare(a.title, locale));
    }

    return filtered;
  }, [
    projects,
    search,
    selectedCategory,
    selectedSoftware,
    selectedRenderer,
    sortOption,
    locale,
  ]);

  return (
    <div>
      {/* Filter and Search Toolbar */}
      <div className="border-b border-black px-4 py-4 md:px-7">
        {/* Top bar: Search input & Alphabetical sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isRu ? "Поиск по названию, категории или софту..." : "Search by title, category, or software..."
              }
              className="w-full rounded-full border border-black bg-transparent py-2.5 pr-8 pl-10 font-mono text-[10px] tracking-[0.1em] uppercase text-black placeholder:text-black/40 outline-none transition-colors focus:bg-white"
            />
            <span
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-black/50"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-black/60 hover:text-black"
                title={isRu ? "Очистить" : "Clear"}
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort by Alphabet */}
            <div className="flex items-center gap-1 rounded-full border border-black p-0.5 font-mono text-[9px] tracking-[0.1em] uppercase">
              <span className="px-2 text-black/50">
                {isRu ? "Алфавит:" : "Sort:"}
              </span>
              <button
                type="button"
                onClick={() => setSortOption("default")}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  sortOption === "default"
                    ? "bg-black text-white"
                    : "hover:bg-black/10"
                }`}
              >
                {isRu ? "Порядок" : "Default"}
              </button>
              <button
                type="button"
                onClick={() => setSortOption("az")}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  sortOption === "az"
                    ? "bg-black text-white"
                    : "hover:bg-black/10"
                }`}
              >
                {isRu ? "А—Я" : "A—Z"}
              </button>
              <button
                type="button"
                onClick={() => setSortOption("za")}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  sortOption === "za"
                    ? "bg-black text-white"
                    : "hover:bg-black/10"
                }`}
              >
                {isRu ? "Я—А" : "Z—A"}
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-dashed border-black px-3 py-1.5 font-mono text-[9px] tracking-[0.1em] text-black uppercase transition-colors hover:bg-black hover:text-white"
              >
                {isRu ? "Сбросить ×" : "Reset ×"}
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns row: Category, Software & Renderer */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="filter-category"
              className="font-mono text-[9px] tracking-[0.12em] text-black/55 uppercase"
            >
              {isRu ? "Категория:" : "Category:"}
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-full border border-black bg-transparent px-3 py-1 font-mono text-[9px] tracking-[0.1em] uppercase text-black outline-none transition-colors hover:bg-white focus:bg-white cursor-pointer"
            >
              <option value="all">{isRu ? "Все категории" : "All categories"}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Software Filter */}
          {softwareList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="filter-software"
                className="font-mono text-[9px] tracking-[0.12em] text-black/55 uppercase"
              >
                {isRu ? "Программа:" : "Software:"}
              </label>
              <select
                id="filter-software"
                value={selectedSoftware}
                onChange={(e) => setSelectedSoftware(e.target.value)}
                className="rounded-full border border-black bg-transparent px-3 py-1 font-mono text-[9px] tracking-[0.1em] uppercase text-black outline-none transition-colors hover:bg-white focus:bg-white cursor-pointer"
              >
                <option value="all">{isRu ? "Все программы" : "All software"}</option>
                {softwareList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Renderer Filter */}
          {renderers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="filter-renderer"
                className="font-mono text-[9px] tracking-[0.12em] text-black/55 uppercase"
              >
                {isRu ? "Рендер:" : "Renderer:"}
              </label>
              <select
                id="filter-renderer"
                value={selectedRenderer}
                onChange={(e) => setSelectedRenderer(e.target.value)}
                className="rounded-full border border-black bg-transparent px-3 py-1 font-mono text-[9px] tracking-[0.1em] uppercase text-black outline-none transition-colors hover:bg-white focus:bg-white cursor-pointer"
              >
                <option value="all">{isRu ? "Все рендеры" : "All renderers"}</option>
                {renderers.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto font-mono text-[9px] tracking-[0.14em] text-black/50 uppercase">
            {isRu ? "Найдено:" : "Count:"} {String(filteredProjects.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </div>
        </div>

        {/* Categories Pills row - visible always */}
        {categories.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1 pb-0.5">
            <span className="font-mono text-[9px] tracking-[0.12em] text-black/45 uppercase mr-1 shrink-0">
              {isRu ? "Категории:" : "Categories:"}
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 rounded-full border border-black px-3 py-1 font-mono text-[9px] tracking-[0.12em] uppercase transition-colors ${
                selectedCategory === "all"
                  ? "bg-black text-white"
                  : "bg-transparent text-black hover:bg-black/10"
              }`}
            >
              {isRu ? "Все" : "All"}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border border-black px-3 py-1 font-mono text-[9px] tracking-[0.12em] uppercase transition-colors ${
                  selectedCategory === category
                    ? "bg-black text-white"
                    : "bg-transparent text-black hover:bg-black/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 border-b border-black p-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
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
                    {project.slug === featuredSlug ? (
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
                            title={isRu ? "Интерактивная 3D-модель" : "Interactive 3D model"}
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
                            title={isRu ? "Есть видео" : "Has video"}
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-2.5 w-2.5"
                              fill="currentColor"
                            >
                              <path d="M6 4v16l14-8L6 4Z" />
                            </svg>
                            {isRu ? "Видео" : "Video"}
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
                      {project.category} · {project.software[0]}
                      {project.specs?.renderer ? ` · ${project.specs.renderer}` : ""}
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-b border-black py-16 px-4 text-center">
          <p className="text-xl font-bold uppercase tracking-tight">
            {isRu ? "Ничего не найдено" : "No projects found"}
          </p>
          <p className="mt-2 font-mono text-xs text-black/55 uppercase tracking-wider">
            {isRu
              ? "Попробуйте изменить параметры поиска или сбросить фильтры"
              : "Try adjusting your search criteria or resetting filters"}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 rounded-full bg-black px-6 py-2.5 font-mono text-[10px] tracking-[0.12em] text-white uppercase transition-colors hover:bg-black/75"
          >
            {isRu ? "Сбросить все фильтры" : "Reset all filters"}
          </button>
        </div>
      )}
    </div>
  );
}
