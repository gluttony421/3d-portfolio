"use client";

import type { DragEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PortfolioProject } from "@/data/projects";
import type { SiteSettings } from "@/data/site-settings";
import EditProjectForm from "./EditProjectForm";
import GalleryFileInput from "./GalleryFileInput";
import SiteSettingsForm from "./SiteSettingsForm";

type AdminDashboardProps = {
  initialProjects: PortfolioProject[];
  initialSiteSettings: SiteSettings;
};

type RequestState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type DeleteMessage = {
  kind: "success" | "error";
  message: string;
};

const fieldClassName =
  "mt-2 w-full border-0 border-b border-black bg-transparent px-0 py-3 font-sans text-base font-normal normal-case tracking-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-b-2";

const labelClassName =
  "block font-mono text-[10px] font-normal tracking-[0.14em] uppercase";

const fileBoxClassName =
  "block border border-black p-4 font-mono text-[10px] font-normal tracking-[0.14em] uppercase";

const fileInputClassName =
  "mt-4 block w-full font-sans text-xs font-normal normal-case tracking-normal file:mr-4 file:rounded-full file:border file:border-black file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-[10px] file:font-normal file:tracking-[0.12em] file:uppercase";

const helperTextClassName =
  "mt-2 block font-sans text-xs font-normal normal-case tracking-normal text-black/55";

type SpecTemplate = {
  label: string;
  values: Record<string, string>;
};

const SPEC_TEMPLATES: SpecTemplate[] = [
  {
    label: "Blender · Cycles · 4K PBR",
    values: {
      software: "Blender, Substance 3D Painter",
      textures: "4K PBR",
      materials: "1",
      uvMaps: "1",
      renderer: "Cycles",
    },
  },
  {
    label: "Blender · Eevee · 2K PBR",
    values: {
      software: "Blender",
      textures: "2K PBR",
      materials: "1",
      uvMaps: "1",
      renderer: "Eevee",
    },
  },
  {
    label: "Hard Surface · Subdivision",
    values: {
      software: "Blender",
      textures: "Procedural",
      materials: "3",
      uvMaps: "1",
      renderer: "Cycles",
    },
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminDashboard({
  initialProjects,
  initialSiteSettings,
}: AdminDashboardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [editingProject, setEditingProject] =
    useState<PortfolioProject | null>(null);
  const [confirmingDeleteSlug, setConfirmingDeleteSlug] = useState<string | null>(
    null,
  );
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<DeleteMessage | null>(null);
  const [reorderingSlug, setReorderingSlug] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<DeleteMessage | null>(null);
  const [requestState, setRequestState] = useState<RequestState>({
    kind: "idle",
  });
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState({ kind: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        project?: PortfolioProject;
        error?: string;
      };

      if (!response.ok || !result.project) {
        throw new Error(result.error ?? "Не удалось сохранить проект.");
      }

      setProjects((currentProjects) => [
        ...currentProjects,
        result.project as PortfolioProject,
      ]);
      form.reset();
      setTitle("");
      setSlug("");
      setSlugWasEdited(false);
      setGalleryUploadKey((currentKey) => currentKey + 1);
      setTemplateMessage(null);
      setRequestState({
        kind: "success",
        message: `Проект «${result.project.title}» добавлен.`,
      });
    } catch (error) {
      setRequestState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Не удалось сохранить проект.",
      });
    }
  }

  function startEditing(project: PortfolioProject) {
    setEditingProject(project);
    window.setTimeout(() => {
      document
        .getElementById("edit-project")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleProjectUpdated(updatedProject: PortfolioProject) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.slug === updatedProject.slug ? updatedProject : project,
      ),
    );
    setEditingProject(updatedProject);
  }

  async function handleDelete(project: PortfolioProject) {
    setDeletingSlug(project.slug);
    setDeleteMessage(null);

    try {
      const response = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: project.slug }),
      });
      const result = (await response.json()) as {
        deletedSlug?: string;
        warning?: string;
        error?: string;
      };

      if (!response.ok || result.deletedSlug !== project.slug) {
        throw new Error(result.error ?? "Не удалось удалить проект.");
      }

      setProjects((currentProjects) =>
        currentProjects.filter((item) => item.slug !== project.slug),
      );
      if (editingProject?.slug === project.slug) {
        setEditingProject(null);
      }
      setConfirmingDeleteSlug(null);
      setDeleteMessage({
        kind: "success",
        message: result.warning
          ? `Проект удалён. ${result.warning}`
          : `Проект «${project.title}» удалён вместе с его файлами.`,
      });
    } catch (error) {
      setDeleteMessage({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Не удалось удалить проект.",
      });
    } finally {
      setDeletingSlug(null);
    }
  }

  async function saveProjectOrder(
    nextProjects: PortfolioProject[],
    movedSlug: string,
  ) {
    const previousProjects = projects;
    setProjects(nextProjects);
    setReorderingSlug(movedSlug);
    setOrderMessage(null);

    try {
      const response = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: nextProjects.map((project) => project.slug),
        }),
      });
      const result = (await response.json()) as {
        projects?: PortfolioProject[];
        error?: string;
      };

      if (!response.ok || !result.projects) {
        throw new Error(result.error ?? "Не удалось изменить порядок проектов.");
      }

      setProjects(result.projects);
      setOrderMessage({ kind: "success", message: "Порядок проектов сохранён." });
    } catch (error) {
      setProjects(previousProjects);
      setOrderMessage({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось изменить порядок проектов.",
      });
    } finally {
      setReorderingSlug(null);
    }
  }

  async function moveProject(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projects.length) {
      return;
    }

    const nextProjects = [...projects];
    [nextProjects[index], nextProjects[targetIndex]] = [
      nextProjects[targetIndex],
      nextProjects[index],
    ];
    await saveProjectOrder(nextProjects, projects[index].slug);
  }

  function handleProjectDrop(event: DragEvent<HTMLLIElement>, targetIndex: number) {
    event.preventDefault();
    const sourceSlug = draggedSlug;
    setDraggedSlug(null);
    setDragOverIndex(null);

    if (!sourceSlug || reorderingSlug !== null) return;
    const sourceIndex = projects.findIndex((project) => project.slug === sourceSlug);
    if (sourceIndex === -1 || sourceIndex === targetIndex) return;

    const nextProjects = [...projects];
    const [movedProject] = nextProjects.splice(sourceIndex, 1);
    nextProjects.splice(targetIndex, 0, movedProject);
    void saveProjectOrder(nextProjects, movedProject.slug);
  }

  function setFormFields(values: Record<string, string>) {
    const form = formRef.current;
    if (!form) return;

    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.value = value;
      }
    }
  }

  function applySpecTemplate(template: SpecTemplate) {
    setFormFields(template.values);
    setTemplateMessage(`Шаблон «${template.label}» применён. Осталось указать полигоны и вершины.`);
  }

  function duplicateProject(project: PortfolioProject) {
    const existingSlugs = new Set(projects.map((item) => item.slug));
    let copySlug = `${project.slug}-copy`;
    let counter = 2;
    while (existingSlugs.has(copySlug)) {
      copySlug = `${project.slug}-copy-${counter}`;
      counter += 1;
    }

    setTitle(`${project.title} Copy`);
    setSlug(copySlug);
    setSlugWasEdited(true);
    setFormFields({
      titleRu: `${project.translations?.ru?.title ?? project.title} (копия)`,
      category: project.category,
      categoryRu: project.translations?.ru?.category ?? project.category,
      software: project.software.join(", "),
      year: String(project.year),
      polygons: project.specs?.polygons ?? "",
      vertices: project.specs?.vertices ?? "",
      textures: project.specs?.textures ?? "",
      materials: project.specs?.materials ?? "",
      uvMaps: project.specs?.uvMaps ?? "",
      renderer: project.specs?.renderer ?? "",
    });
    setRequestState({ kind: "idle" });
    setTemplateMessage(
      `Поля скопированы из «${project.title}». Загрузите обложку и при необходимости поправьте название.`,
    );

    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <main className="min-h-screen bg-[#efeee9] text-black">
      <header className="sticky top-0 z-50 flex h-[4.375rem] items-center justify-between border-b border-black bg-[#efeee9]/95 px-4 backdrop-blur-sm md:px-7">
        <Link
          href="/"
          className="text-[1.75rem] leading-none font-black tracking-[-0.04em] uppercase md:text-[2rem]"
        >
          PORTFOLIO.
        </Link>
        <span className="rounded-full bg-black px-3 py-1.5 font-mono text-[10px] font-normal tracking-[0.16em] text-white uppercase">
          LOCAL ADMIN
        </span>
      </header>

      <section className="grid border-b border-black lg:grid-cols-2">
        <div className="border-b border-black p-5 md:p-8 lg:border-r lg:border-b-0">
          <p className="mb-8 font-mono text-[10px] font-normal tracking-[0.16em] text-black/55 uppercase">
            PROJECT MANAGER / {String(projects.length).padStart(2, "0")}
          </p>
          <h1 className="max-w-2xl text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.82] font-[950] tracking-[-0.08em] uppercase">
            Добавить новую работу
          </h1>
        </div>

        <div className="flex min-h-72 flex-col justify-between bg-black p-5 text-white md:p-8">
          <p className="max-w-md text-2xl leading-[1.06] tracking-[-0.035em] md:text-3xl">
            Обложка, дополнительные рендеры и GLB сохраняются локально, ссылку
            YouTube можно смотреть прямо на сайте, а карточка сразу появляется
            в английской и русской галереях.
          </p>
          <p className="mt-12 font-mono text-[10px] font-normal tracking-[0.16em] text-white/55 uppercase">
            РАБОТАЕТ ТОЛЬКО ЧЕРЕЗ NPM RUN DEV / НЕ ПУБЛИКОВАТЬ БЕЗ АВТОРИЗАЦИИ
          </p>
        </div>
      </section>

      <SiteSettingsForm initialSettings={initialSiteSettings} />

      <section className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid gap-x-8 gap-y-7 border-b border-black p-5 md:grid-cols-2 md:p-8 lg:border-r lg:border-b-0"
        >
          <label className={labelClassName}>
            НАЗВАНИЕ / ENGLISH
            <input
              className={fieldClassName}
              name="title"
              value={title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setTitle(nextTitle);
                if (!slugWasEdited) {
                  setSlug(slugify(nextTitle));
                }
              }}
              placeholder="For example, MITU 01F"
              required
            />
          </label>

          <label className={labelClassName}>
            НАЗВАНИЕ / РУССКИЙ
            <input
              className={fieldClassName}
              name="titleRu"
              placeholder="Например, MITU 01F"
              required
            />
          </label>

          <label className={labelClassName}>
            SLUG / АДРЕС
            <input
              className={fieldClassName}
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value.toLowerCase());
                setSlugWasEdited(true);
              }}
              placeholder="mitu-01f"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Только латинские строчные буквы, цифры и дефисы"
              required
            />
          </label>

          <label className={labelClassName}>
            ГОД
            <input
              className={fieldClassName}
              name="year"
              type="number"
              min="2000"
              max="2100"
              defaultValue={new Date().getFullYear()}
              required
            />
          </label>

          <label className={labelClassName}>
            КАТЕГОРИЯ / ENGLISH
            <input
              className={fieldClassName}
              name="category"
              placeholder="Hard Surface"
              required
            />
          </label>

          <label className={labelClassName}>
            КАТЕГОРИЯ / РУССКИЙ
            <input
              className={fieldClassName}
              name="categoryRu"
              placeholder="Твёрдотельное моделирование"
              required
            />
          </label>

          <label className={labelClassName}>
            ПРОГРАММЫ
            <input
              className={fieldClassName}
              name="software"
              defaultValue="Blender"
              placeholder="Blender, Substance Painter"
              required
            />
            <span className={helperTextClassName}>
              Разделяйте названия запятыми.
            </span>
          </label>

          <div className="border-y border-black py-4 font-mono text-[10px] font-normal tracking-[0.14em] uppercase md:col-span-2">
            ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ / ОБЯЗАТЕЛЬНО
          </div>

          <div className="md:col-span-2">
            <p className={labelClassName}>ШАБЛОНЫ / АВТОЗАПОЛНЕНИЕ</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SPEC_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => applySpecTemplate(template)}
                  className="rounded-full border border-black px-3.5 py-2 font-mono text-[10px] font-normal tracking-[0.12em] uppercase transition-colors hover:bg-black hover:text-white"
                >
                  {template.label}
                </button>
              ))}
              {projects.length > 0 && (
                <button
                  type="button"
                  onClick={() => duplicateProject(projects[projects.length - 1])}
                  className="rounded-full border border-dashed border-black px-3.5 py-2 font-mono text-[10px] font-normal tracking-[0.12em] uppercase transition-colors hover:bg-black hover:text-white"
                  title="Скопировать все поля из последнего добавленного проекта"
                >
                  КАК В ПОСЛЕДНЕМ ПРОЕКТЕ
                </button>
              )}
            </div>
            {templateMessage && (
              <p className="mt-3 text-sm text-green-800" role="status">
                {templateMessage}
              </p>
            )}
          </div>

          <label className={labelClassName}>
            ПОЛИГОНЫ
            <input className={fieldClassName} name="polygons" placeholder="24,580 Tris" required />
          </label>

          <label className={labelClassName}>
            ВЕРШИНЫ
            <input className={fieldClassName} name="vertices" placeholder="13,420" required />
          </label>

          <label className={labelClassName}>
            ТЕКСТУРЫ
            <input className={fieldClassName} name="textures" placeholder="4K PBR" required />
          </label>

          <label className={labelClassName}>
            МАТЕРИАЛЫ
            <input className={fieldClassName} name="materials" placeholder="3" required />
          </label>

          <label className={labelClassName}>
            UV-РАЗВЁРТКИ
            <input className={fieldClassName} name="uvMaps" placeholder="1" required />
          </label>

          <label className={labelClassName}>
            РЕНДЕР-ДВИЖОК
            <input className={fieldClassName} name="renderer" defaultValue="Cycles" required />
          </label>

          <label className={fileBoxClassName}>
            ОБЛОЖКА / ОБЯЗАТЕЛЬНО
            <input
              className={fileInputClassName}
              name="cover"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              required
            />
            <span className="mt-3 block font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              PNG, JPG, WEBP или AVIF, до 15 МБ.
            </span>
          </label>

          <label className={fileBoxClassName}>
            3D-МОДЕЛЬ / НЕОБЯЗАТЕЛЬНО
            <input
              className={fileInputClassName}
              name="model"
              type="file"
              accept=".glb,model/gltf-binary"
            />
            <span className="mt-3 block font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              Только GLB, до 100 МБ.
            </span>
          </label>

          <label className={`${fileBoxClassName} md:col-span-2`}>
            РЕНДЕР СЕТКИ (WIREFRAME) / НЕОБЯЗАТЕЛЬНО
            <input
              className={fileInputClassName}
              name="wireframe"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
            />
            <span className="mt-3 block font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              Загрузите рендер сетки в том же ракурсе, что и обложка, чтобы включить интерактивный слайдер сравнения «Рендер ↔ Сетка».
            </span>
          </label>

          <label className={`${fileBoxClassName} md:col-span-2`}>
            ВИДЕО YOUTUBE / НЕОБЯЗАТЕЛЬНО
            <input
              className={fieldClassName}
              name="video"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <span className="mt-3 block font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              Поддерживаются ссылки youtube.com, youtu.be, Shorts и Live. Видео
              появится отдельной вкладкой на странице проекта.
            </span>
          </label>

          <GalleryFileInput
            key={galleryUploadKey}
            title="ДОПОЛНИТЕЛЬНЫЕ РЕНДЕРЫ / НЕОБЯЗАТЕЛЬНО"
            description="До 12 изображений. Каждый файл — до 15 МБ, все новые файлы — до 60 МБ."
          />

          <div className="flex flex-col items-start gap-4 md:col-span-2 md:flex-row md:items-center">
            <button
              type="submit"
              disabled={requestState.kind === "submitting"}
              className="rounded-full bg-black px-7 py-4 font-mono text-[10px] font-normal tracking-[0.12em] text-white uppercase transition-colors hover:bg-black/75 disabled:cursor-wait disabled:opacity-40"
            >
              {requestState.kind === "submitting"
                ? "СОХРАНЯЕМ…"
                : "ДОБАВИТЬ ПРОЕКТ"}
            </button>

            {requestState.kind === "success" && (
              <p className="text-sm text-green-800" role="status">
                {requestState.message}
              </p>
            )}
            {requestState.kind === "error" && (
              <p className="text-sm text-red-700" role="alert">
                {requestState.message}
              </p>
            )}
          </div>
        </form>

        <aside className="p-5 md:p-8">
          <div className="flex items-end justify-between border-b border-black pb-4">
            <h2 className="text-2xl leading-[0.94] font-[950] tracking-[-0.05em] uppercase">
              Текущие проекты
            </h2>
            <span className="font-mono text-xs">{String(projects.length).padStart(2, "0")}</span>
          </div>

          {deleteMessage && (
            <p
              className={`border-b border-black/25 py-4 text-sm ${
                deleteMessage.kind === "success" ? "text-green-800" : "text-red-700"
              }`}
              role={deleteMessage.kind === "success" ? "status" : "alert"}
            >
              {deleteMessage.message}
            </p>
          )}

          {orderMessage && (
            <p
              className={`border-b border-black/25 py-4 text-sm ${
                orderMessage.kind === "success" ? "text-green-800" : "text-red-700"
              }`}
              role={orderMessage.kind === "success" ? "status" : "alert"}
            >
              {orderMessage.message}
            </p>
          )}

          <p className="mt-3 font-sans text-xs font-normal normal-case tracking-normal text-black/55">
            Перетаскивайте проекты мышью за карточку или используйте стрелки — порядок
            сразу сохраняется и применяется на главной.
          </p>

          <ol>
            {projects.map((project, index) => (
              <li
                key={project.slug}
                draggable={reorderingSlug === null}
                onDragStart={(event) => {
                  setDraggedSlug(project.slug);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", project.slug);
                }}
                onDragEnd={() => {
                  setDraggedSlug(null);
                  setDragOverIndex(null);
                }}
                onDragOver={(event) => {
                  if (!draggedSlug) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dragOverIndex !== index) setDragOverIndex(index);
                }}
                onDrop={(event) => handleProjectDrop(event, index)}
                className={`grid grid-cols-[1.25rem_3.5rem_1fr_auto] items-start gap-3 border-b py-4 transition-[opacity,background-color,border-color] ${
                  draggedSlug === project.slug
                    ? "opacity-40"
                    : reorderingSlug === null
                      ? "cursor-grab active:cursor-grabbing"
                      : ""
                } ${
                  dragOverIndex === index && draggedSlug && draggedSlug !== project.slug
                    ? "border-black bg-black/[0.06]"
                    : "border-black/25"
                }`}
              >
                <span
                  className="flex flex-col items-center gap-1 pt-1 font-mono text-[10px] tracking-[0.09em] text-black/50 select-none"
                  aria-hidden="true"
                >
                  <span className="text-sm leading-none text-black/40">⠿</span>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative size-14 overflow-hidden border border-black/20 bg-[#d8d7d1]">
                  <Image
                    src={project.cover}
                    alt=""
                    fill
                    sizes="56px"
                    draggable={false}
                    className="pointer-events-none object-contain p-0.5"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-base leading-[0.96] font-[950] tracking-[-0.04em] uppercase">
                    {project.title}
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.09em] text-black/55 uppercase sm:text-[10px]">
                    {project.category} / {project.gallery?.length ?? 0} renders
                  </p>
                  <div className="mt-1.5 flex gap-1">
                    {project.model && (
                      <span className="rounded-full bg-black px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em] text-white uppercase">
                        3D
                      </span>
                    )}
                    {project.video && (
                      <span className="rounded-full border border-black px-1.5 py-0.5 font-mono text-[8px] tracking-[0.12em] uppercase">
                        Видео
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1" aria-label="Изменить порядок проекта">
                    <button
                      type="button"
                      onClick={() => moveProject(index, -1)}
                      disabled={index === 0 || reorderingSlug !== null}
                      className="flex size-7 items-center justify-center rounded-full border border-black font-mono text-xs transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/25 disabled:hover:bg-transparent"
                      aria-label={`Поднять ${project.title} выше`}
                      title="Поднять выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProject(index, 1)}
                      disabled={
                        index === projects.length - 1 || reorderingSlug !== null
                      }
                      className="flex size-7 items-center justify-center rounded-full border border-black font-mono text-xs transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/25 disabled:hover:bg-transparent"
                      aria-label={`Опустить ${project.title} ниже`}
                      title="Опустить ниже"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditing(project)}
                    className={
                      editingProject?.slug === project.slug
                        ? "rounded-full bg-black px-3 py-1.5 font-mono text-[10px] font-normal tracking-[0.12em] text-white uppercase"
                        : "font-mono text-[10px] font-normal tracking-[0.12em] uppercase underline underline-offset-4"
                    }
                  >
                    EDIT
                  </button>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-mono text-[10px] font-normal tracking-[0.12em] uppercase underline underline-offset-4"
                  >
                    OPEN ↗
                  </Link>
                  <button
                    type="button"
                    onClick={() => duplicateProject(project)}
                    className="font-mono text-[10px] font-normal tracking-[0.12em] uppercase underline underline-offset-4"
                    title="Заполнить форму нового проекта данными этого проекта"
                  >
                    ДУБЛИРОВАТЬ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDeleteSlug(project.slug);
                      setDeleteMessage(null);
                    }}
                    className="font-mono text-[10px] font-normal tracking-[0.12em] text-red-700 uppercase underline underline-offset-4"
                  >
                    DELETE
                  </button>
                </div>

                {confirmingDeleteSlug === project.slug && (
                  <div className="col-span-4 mt-2 border border-red-700 bg-red-50 p-4">
                    <p className="text-sm font-medium">
                      Удалить «{project.title}» навсегда?
                    </p>
                    <p className="mt-1 text-xs text-black/60">
                      Запись, папка проекта, обложка и GLB будут удалены. Это
                      действие нельзя отменить.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        disabled={deletingSlug === project.slug}
                        className="rounded-full bg-red-700 px-4 py-2 font-mono text-[10px] font-normal tracking-[0.12em] text-white uppercase disabled:cursor-wait disabled:opacity-50"
                      >
                        {deletingSlug === project.slug
                          ? "УДАЛЯЕМ…"
                          : "ДА, УДАЛИТЬ"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteSlug(null)}
                        disabled={deletingSlug === project.slug}
                        className="rounded-full border border-black px-4 py-2 font-mono text-[10px] font-normal tracking-[0.12em] uppercase"
                      >
                        ОТМЕНА
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {editingProject && (
        <EditProjectForm
          key={editingProject.slug}
          project={editingProject}
          onCancel={() => setEditingProject(null)}
          onUpdated={handleProjectUpdated}
        />
      )}
    </main>
  );
}
