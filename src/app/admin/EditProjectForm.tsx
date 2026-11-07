"use client";

import type { DragEvent, FormEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import type { PortfolioProject } from "@/data/projects";
import GalleryFileInput from "./GalleryFileInput";

type EditProjectFormProps = {
  project: PortfolioProject;
  onCancel: () => void;
  onUpdated: (project: PortfolioProject) => void;
};

type RequestState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const fieldClassName =
  "mt-2 w-full border-0 border-b border-black bg-transparent px-0 py-3 font-sans text-base font-normal normal-case tracking-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-b-2";

const labelClassName =
  "block font-mono text-[10px] font-normal tracking-[0.14em] uppercase";

const fileBoxClassName =
  "block border border-black p-4 font-mono text-[10px] font-normal tracking-[0.14em] uppercase";

const fileInputClassName =
  "mt-4 block w-full font-sans text-xs font-normal normal-case tracking-normal file:mr-4 file:rounded-full file:border file:border-black file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-[10px] file:font-normal file:tracking-[0.12em] file:uppercase";

export default function EditProjectForm({
  project,
  onCancel,
  onUpdated,
}: EditProjectFormProps) {
  const [requestState, setRequestState] = useState<RequestState>({
    kind: "idle",
  });
  const [galleryOrder, setGalleryOrder] = useState(() => project.gallery ?? []);
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);
  const [draggedGalleryImage, setDraggedGalleryImage] = useState<string | null>(
    null,
  );
  const [deletingAssetKey, setDeletingAssetKey] = useState<string | null>(null);

  async function handleDeleteAsset(
    assetType: "model" | "wireframe" | "gallery",
    assetPath?: string,
  ) {
    const key = assetPath ?? assetType;
    setDeletingAssetKey(key);
    setRequestState({ kind: "idle" });

    try {
      const response = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: project.slug,
          assetType,
          assetPath,
        }),
      });
      const result = (await response.json()) as {
        project?: PortfolioProject;
        error?: string;
      };

      if (!response.ok || !result.project) {
        throw new Error(result.error ?? "Не удалось удалить файл.");
      }

      setGalleryOrder(result.project.gallery ?? []);
      onUpdated(result.project);
      setRequestState({
        kind: "success",
        message:
          assetType === "model"
            ? "3D-модель удалена."
            : assetType === "wireframe"
              ? "Рендер сетки удалён."
              : "Изображение удалено из галереи.",
      });
    } catch (error) {
      setRequestState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Не удалось удалить файл.",
      });
    } finally {
      setDeletingAssetKey(null);
    }
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= galleryOrder.length) {
      return;
    }

    setGalleryOrder((currentOrder) => {
      const nextOrder = [...currentOrder];
      [nextOrder[index], nextOrder[targetIndex]] = [
        nextOrder[targetIndex],
        nextOrder[index],
      ];
      return nextOrder;
    });
    setRequestState({ kind: "idle" });
  }

  function moveGalleryImageTo(sourceImage: string, targetImage: string) {
    if (sourceImage === targetImage) {
      return;
    }

    setGalleryOrder((currentOrder) => {
      const nextOrder = [...currentOrder];
      const sourceIndex = nextOrder.indexOf(sourceImage);
      const targetIndex = nextOrder.indexOf(targetImage);
      if (sourceIndex === -1 || targetIndex === -1) {
        return currentOrder;
      }

      const [movedImage] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, movedImage);
      return nextOrder;
    });
    setRequestState({ kind: "idle" });
  }

  function handleGalleryDrop(
    event: DragEvent<HTMLDivElement>,
    targetImage: string,
  ) {
    event.preventDefault();
    if (draggedGalleryImage) {
      moveGalleryImageTo(draggedGalleryImage, targetImage);
    }
    setDraggedGalleryImage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestState({ kind: "submitting" });
    const form = event.currentTarget;

    try {
      const response = await fetch("/api/admin/projects", {
        method: "PATCH",
        body: new FormData(form),
      });
      const result = (await response.json()) as {
        project?: PortfolioProject;
        error?: string;
      };

      if (!response.ok || !result.project) {
        throw new Error(result.error ?? "Не удалось обновить проект.");
      }

      setGalleryOrder(result.project.gallery ?? []);
      setGalleryUploadKey((currentKey) => currentKey + 1);
      onUpdated(result.project);
      form
        .querySelectorAll<HTMLInputElement>('input[name="removeGallery"]')
        .forEach((input) => {
          input.checked = false;
        });
      setRequestState({
        kind: "success",
        message: `Изменения в «${result.project.title}» сохранены.`,
      });
    } catch (error) {
      setRequestState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Не удалось обновить проект.",
      });
    }
  }

  return (
    <section id="edit-project" className="scroll-mt-4 border-t border-black">
      <div className="grid border-b border-black lg:grid-cols-[0.7fr_1.3fr]">
        <div className="bg-black p-5 text-white md:p-8">
          <p className="mb-8 font-mono text-[10px] font-normal tracking-[0.16em] text-white/55 uppercase">
            EDIT PROJECT / {project.slug}
          </p>
          <h2 className="text-[clamp(2.8rem,6vw,6rem)] leading-[0.84] font-[950] tracking-[-0.08em] uppercase">
            {project.title}
          </h2>
          <p className="mt-12 max-w-sm text-sm leading-relaxed text-white/60">
            Оставьте поля файлов пустыми, чтобы сохранить текущую обложку,
            галерею и GLB без изменений.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-x-8 gap-y-7 bg-[#efeee9] p-5 md:grid-cols-2 md:p-8"
        >
          <label className={labelClassName}>
            НАЗВАНИЕ / ENGLISH
            <input
              className={fieldClassName}
              name="title"
              defaultValue={project.title}
              required
            />
          </label>

          <label className={labelClassName}>
            НАЗВАНИЕ / РУССКИЙ
            <input
              className={fieldClassName}
              name="titleRu"
              defaultValue={project.translations?.ru?.title ?? project.title}
              required
            />
          </label>

          <label className={labelClassName}>
            SLUG / НЕ ИЗМЕНЯЕТСЯ
            <input
              className={`${fieldClassName} cursor-not-allowed text-black/45`}
              name="slug"
              value={project.slug}
              readOnly
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
              defaultValue={project.year}
              required
            />
          </label>

          <label className={labelClassName}>
            КАТЕГОРИЯ / ENGLISH
            <input
              className={fieldClassName}
              name="category"
              defaultValue={project.category}
              required
            />
          </label>

          <label className={labelClassName}>
            КАТЕГОРИЯ / РУССКИЙ
            <input
              className={fieldClassName}
              name="categoryRu"
              defaultValue={
                project.translations?.ru?.category ?? project.category
              }
              required
            />
          </label>

          <label className={labelClassName}>
            ПРОГРАММЫ
            <input
              className={fieldClassName}
              name="software"
              defaultValue={project.software.join(", ")}
              required
            />
            <span className="mt-2 block font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              Разделяйте названия запятыми.
            </span>
          </label>

          <div className="border-y border-black py-4 font-mono text-[10px] font-normal tracking-[0.14em] uppercase md:col-span-2">
            ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ / ОБЯЗАТЕЛЬНО
          </div>

          <label className={labelClassName}>
            ПОЛИГОНЫ
            <input className={fieldClassName} name="polygons" defaultValue={project.specs?.polygons ?? ""} placeholder="24,580 Tris" required />
          </label>

          <label className={labelClassName}>
            ВЕРШИНЫ
            <input className={fieldClassName} name="vertices" defaultValue={project.specs?.vertices ?? ""} placeholder="13,420" required />
          </label>

          <label className={labelClassName}>
            ТЕКСТУРЫ
            <input className={fieldClassName} name="textures" defaultValue={project.specs?.textures ?? ""} placeholder="4K PBR" required />
          </label>

          <label className={labelClassName}>
            МАТЕРИАЛЫ
            <input className={fieldClassName} name="materials" defaultValue={project.specs?.materials ?? ""} placeholder="3" required />
          </label>

          <label className={labelClassName}>
            UV-РАЗВЁРТКИ
            <input className={fieldClassName} name="uvMaps" defaultValue={project.specs?.uvMaps ?? ""} placeholder="1" required />
          </label>

          <label className={labelClassName}>
            РЕНДЕР-ДВИЖОК
            <input className={fieldClassName} name="renderer" defaultValue={project.specs?.renderer ?? ""} placeholder="Cycles" required />
          </label>

          <div className="border border-black p-4">
            <label className="block font-mono text-[10px] font-normal tracking-[0.14em] uppercase">
              ЗАМЕНИТЬ ОБЛОЖКУ / НЕОБЯЗАТЕЛЬНО
              <input
                className={fileInputClassName}
                name="cover"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
              />
            </label>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden border border-black bg-[#d8d7d2]">
                <Image
                  src={project.cover}
                  alt={project.title}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
              <span className="break-all font-sans text-xs font-normal normal-case tracking-normal text-black/55">
                Сейчас: {project.cover}
              </span>
            </div>
          </div>

          <div className="border border-black p-4">
            <label className="block font-mono text-[10px] font-normal tracking-[0.14em] uppercase">
              ДОБАВИТЬ ИЛИ ЗАМЕНИТЬ GLB / НЕОБЯЗАТЕЛЬНО
              <input
                className={fileInputClassName}
                name="model"
                type="file"
                accept=".glb,model/gltf-binary"
              />
            </label>
            <span className="mt-3 block break-all font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              Сейчас: {project.model ?? "модель не подключена"}
            </span>
            {project.model && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleDeleteAsset("model")}
                  disabled={deletingAssetKey === "model"}
                  className="rounded-full border border-red-700 px-3.5 py-1.5 font-mono text-[10px] font-normal tracking-[0.12em] text-red-700 uppercase transition-colors hover:bg-red-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
                >
                  {deletingAssetKey === "model"
                    ? "УДАЛЯЕМ…"
                    : "УДАЛИТЬ 3D-МОДЕЛЬ"}
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[10px] font-normal tracking-[0.12em] text-red-700 uppercase">
                  <input
                    type="checkbox"
                    name="removeModel"
                    value="true"
                    className="size-4 accent-red-600"
                  />
                  УДАЛИТЬ ПРИ СОХРАНЕНИИ
                </label>
              </div>
            )}
          </div>

          <div className="border border-black p-4 md:col-span-2">
            <label className="block font-mono text-[10px] font-normal tracking-[0.14em] uppercase">
              РЕНДЕР СЕТКИ (WIREFRAME) / НЕОБЯЗАТЕЛЬНО
              <input
                className={fileInputClassName}
                name="wireframe"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {project.wireframe && (
                <div className="relative size-14 shrink-0 overflow-hidden border border-black bg-[#d8d7d2]">
                  <Image
                    src={project.wireframe}
                    alt={`${project.title} wireframe`}
                    fill
                    sizes="56px"
                    className="object-contain p-1"
                  />
                </div>
              )}
              <span className="break-all font-sans text-xs font-normal normal-case tracking-normal text-black/55">
                Сейчас: {project.wireframe ?? "рендер сетки не подключён"}
              </span>
            </div>
            {project.wireframe && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleDeleteAsset("wireframe")}
                  disabled={deletingAssetKey === "wireframe"}
                  className="rounded-full border border-red-700 px-3.5 py-1.5 font-mono text-[10px] font-normal tracking-[0.12em] text-red-700 uppercase transition-colors hover:bg-red-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
                >
                  {deletingAssetKey === "wireframe"
                    ? "УДАЛЯЕМ…"
                    : "УДАЛИТЬ РЕНДЕР СЕТКИ"}
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[10px] font-normal tracking-[0.12em] text-red-700 uppercase">
                  <input
                    type="checkbox"
                    name="removeWireframe"
                    value="true"
                    className="size-4 accent-red-600"
                  />
                  УДАЛИТЬ ПРИ СОХРАНЕНИИ
                </label>
              </div>
            )}
          </div>

          <label className={`${fileBoxClassName} md:col-span-2`}>
            ВИДЕО YOUTUBE / НЕОБЯЗАТЕЛЬНО
            <input
              className={fieldClassName}
              name="video"
              type="url"
              defaultValue={project.video ?? ""}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <span className="mt-3 block font-sans text-xs font-normal normal-case tracking-normal text-black/55">
              Вставьте ссылку для добавления или замены. Оставьте поле пустым,
              чтобы убрать видео со страницы проекта.
            </span>
          </label>

          {galleryOrder.length > 0 && (
            <fieldset className="border border-black p-4 md:col-span-2">
              <legend className="px-2 font-mono text-[10px] font-normal tracking-[0.14em] uppercase">
                ТЕКУЩИЕ РЕНДЕРЫ / ПОРЯДОК И УДАЛЕНИЕ
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryOrder.map((image, index) => (
                  <div
                    key={image}
                    draggable
                    onDragStart={() => setDraggedGalleryImage(image)}
                    onDragEnd={() => setDraggedGalleryImage(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleGalleryDrop(event, image)}
                    className={`border border-black bg-[#d8d7d2] transition-opacity ${
                      draggedGalleryImage === image ? "opacity-45" : "cursor-grab"
                    }`}
                  >
                    <input type="hidden" name="galleryOrder" value={image} />
                    <div className="relative aspect-[4/3] overflow-hidden border-b border-black">
                      <Image
                        src={image}
                        alt={`${project.title}, render ${index + 1}`}
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 90vw"
                        className="object-contain p-2"
                      />
                      <span className="absolute top-2 left-2 rounded-full bg-black px-2.5 py-1 font-mono text-[10px] font-normal text-white">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 p-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset("gallery", image)}
                          disabled={deletingAssetKey === image}
                          className="rounded-full border border-red-700 px-2.5 py-1 font-mono text-[10px] font-normal tracking-[0.1em] text-red-700 uppercase transition-colors hover:bg-red-700 hover:text-white disabled:cursor-wait disabled:opacity-50"
                        >
                          {deletingAssetKey === image ? "…" : "УДАЛИТЬ"}
                        </button>
                        <label
                          className="flex cursor-pointer items-center gap-1.5 font-mono text-[9px] font-normal tracking-[0.08em] text-black/55 uppercase"
                          title="Отметить для пакетного удаления при сохранении"
                        >
                          <input
                            type="checkbox"
                            name="removeGallery"
                            value={image}
                            className="size-3.5 accent-red-600"
                          />
                          ВЫБРАТЬ
                        </label>
                      </div>

                      <div className="flex gap-1" aria-label={`Порядок рендера ${index + 1}`}>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(index, -1)}
                          disabled={index === 0}
                          className="flex size-8 items-center justify-center rounded-full border border-black font-mono text-xs transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/25 disabled:hover:bg-transparent"
                          aria-label={`Переместить рендер ${index + 1} выше`}
                          title="Переместить выше"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(index, 1)}
                          disabled={index === galleryOrder.length - 1}
                          className="flex size-8 items-center justify-center rounded-full border border-black font-mono text-xs transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/25 disabled:hover:bg-transparent"
                          aria-label={`Переместить рендер ${index + 1} ниже`}
                          title="Переместить ниже"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-black/50">
                Перетащите карточки или используйте стрелки. Нажмите «Сохранить изменения», чтобы применить порядок на странице проекта.
              </p>
            </fieldset>
          )}

          <GalleryFileInput
            key={galleryUploadKey}
            title="ДОБАВИТЬ РЕНДЕРЫ / НЕОБЯЗАТЕЛЬНО"
            description="Новые файлы добавятся после уже существующих. Максимум 12 изображений в проекте."
          />

          <div className="flex flex-col items-start gap-4 md:col-span-2 md:flex-row md:items-center">
            <button
              type="submit"
              disabled={requestState.kind === "submitting"}
              className="rounded-full bg-black px-7 py-4 font-mono text-[10px] font-normal tracking-[0.12em] text-white uppercase transition-colors hover:bg-black/75 disabled:cursor-wait disabled:opacity-40"
            >
              {requestState.kind === "submitting"
                ? "СОХРАНЯЕМ…"
                : "СОХРАНИТЬ ИЗМЕНЕНИЯ"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-black px-7 py-4 font-mono text-[10px] font-normal tracking-[0.12em] uppercase transition-colors hover:bg-black hover:text-white"
            >
              ОТМЕНА
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
      </div>
    </section>
  );
}
