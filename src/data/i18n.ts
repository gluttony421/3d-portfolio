import type { PortfolioProject } from "./projects";

export type Locale = "en" | "ru";

export const copy = {
  en: {
    nav: { work: "Work", about: "About", contact: "Contact" },
    hero: {
      eyebrow: "Independent 3D artist / Digital modeling",
      headline: ["A digital", "archive of", "objects,", "materials", "and form."],
      headlineLabel: "A digital archive of objects, materials and form.",
      selected: "Selected works",
      viewWork: "View the work",
    },
    intro:
      "This portfolio brings together vehicles, props, machines and other 3D studies, created through research, modeling, texturing and presentation.",
    work: { library: "Library / A—Z", title: "Selected works", projects: "projects" },
    footer: {
      portfolio: "© Portfolio",
      role: "3D artist / Modeling and visualization",
      top: "Back to top ↑",
    },
    project: {
      close: "Close ↗",
      index: "Project index",
      summary: "3D modeling, texturing and digital presentation.",
      view: "Project view",
      render: "Render",
      wireframe: "Wireframe",
      interactive: "Interactive 3D",
      video: "Video",
      interactionHint: "Drag to rotate / Scroll to zoom",
      wireframeHint: "Drag slider to compare render and wireframe",
      videoHint: "YouTube video",
      finalRender: "Final render",
      about: "About the project",
      category: "Category",
      software: "Software",
      year: "Year",
      specifications: "Technical specifications",
      polygons: "Polygons",
      vertices: "Vertices",
      textures: "Textures",
      materials: "Materials",
      uvMaps: "UV maps",
      workflow: "Workflow",
      renderer: "Render",
      openFullscreen: "Open fullscreen",
      closeFullscreen: "Close fullscreen",
      previousImage: "Previous image",
      nextImage: "Next image",
      gallery: "Project gallery",
      images: "images",
      next: "Next project",
      all: "All projects ↗",
      portfolio: "3D Artist Portfolio",
    },
  },
  ru: {
    nav: { work: "Работы", about: "Обо мне", contact: "Контакты" },
    hero: {
      eyebrow: "Независимый 3D-художник / Цифровое моделирование",
      headline: ["Цифровой", "архив", "объектов,", "материалов", "и форм."],
      headlineLabel: "Цифровой архив объектов, материалов и форм.",
      selected: "Избранные работы",
      viewWork: "Смотреть работы",
    },
    intro:
      "Это портфолио объединяет транспорт, предметы, машины и другие 3D-работы, созданные через исследование, моделирование, текстурирование и презентацию.",
    work: { library: "Архив / А—Я", title: "Избранные работы", projects: "проектов" },
    footer: {
      portfolio: "© Портфолио",
      role: "3D-художник / Моделирование и визуализация",
      top: "Наверх ↑",
    },
    project: {
      close: "Закрыть ↗",
      index: "Номер проекта",
      summary: "3D-моделирование, текстурирование и цифровая презентация.",
      view: "Просмотр проекта",
      render: "Рендер",
      wireframe: "Сетка",
      interactive: "Интерактивная 3D",
      video: "Видео",
      interactionHint: "Вращение мышью / Масштаб колёсиком",
      wireframeHint: "Двигайте ползунок для сравнения рендера и сетки",
      videoHint: "Видео YouTube",
      finalRender: "Финальный рендер",
      about: "О проекте",
      category: "Категория",
      software: "Программы",
      year: "Год",
      specifications: "Технические характеристики",
      polygons: "Полигоны",
      vertices: "Вершины",
      textures: "Текстуры",
      materials: "Материалы",
      uvMaps: "UV-развёртки",
      workflow: "Процесс",
      renderer: "Рендер",
      openFullscreen: "Открыть на весь экран",
      closeFullscreen: "Закрыть полноэкранный просмотр",
      previousImage: "Предыдущее изображение",
      nextImage: "Следующее изображение",
      gallery: "Галерея проекта",
      images: "изображений",
      next: "Следующий проект",
      all: "Все проекты ↗",
      portfolio: "Портфолио 3D-художника",
    },
  },
} as const;

export function localizeProject(
  project: PortfolioProject,
  locale: Locale,
): PortfolioProject {
  if (locale === "en") {
    return project;
  }

  const translation = project.translations?.ru;
  return translation ? { ...project, ...translation } : project;
}

export function homePath(locale: Locale) {
  return locale === "ru" ? "/ru" : "/";
}

export function projectPath(locale: Locale, slug: string) {
  return locale === "ru" ? `/ru/projects/${slug}` : `/projects/${slug}`;
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "en" ? "ru" : "en";
}
