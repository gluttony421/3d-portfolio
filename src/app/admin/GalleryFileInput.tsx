"use client";

import Image from "next/image";
import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

type GalleryFileInputProps = {
  title: string;
  description: string;
  name?: string;
  maxFiles?: number;
};

type PreviewItem = {
  id: string;
  file: File;
  url: string;
};

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function GalleryFileInput({
  title,
  description,
  name = "gallery",
  maxFiles = 12,
}: GalleryFileInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function syncInputFiles(nextItems: PreviewItem[]) {
    if (inputRef.current) {
      const transfer = new DataTransfer();
      nextItems.forEach((item) => transfer.items.add(item.file));
      inputRef.current.files = transfer.files;
    }
    setItems(nextItems);
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    const acceptedFiles = selectedFiles.slice(0, maxFiles);
    const nextItems = acceptedFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
      file,
      url: URL.createObjectURL(file),
    }));

    previewUrlsRef.current = nextItems.map((item) => item.url);
    syncInputFiles(nextItems);
    setSelectionMessage(
      selectedFiles.length > maxFiles
        ? `Можно выбрать не больше ${maxFiles} файлов. Лишние изображения не добавлены.`
        : null,
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    [nextItems[index], nextItems[targetIndex]] = [
      nextItems[targetIndex],
      nextItems[index],
    ];
    syncInputFiles(nextItems);
  }

  function moveItemTo(sourceId: string, targetId: string) {
    if (sourceId === targetId) {
      return;
    }

    const nextItems = [...items];
    const sourceIndex = nextItems.findIndex((item) => item.id === sourceId);
    const targetIndex = nextItems.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const [movedItem] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, movedItem);
    syncInputFiles(nextItems);
  }

  function removeItem(id: string) {
    const item = items.find((preview) => preview.id === id);
    if (item) {
      URL.revokeObjectURL(item.url);
      previewUrlsRef.current = previewUrlsRef.current.filter(
        (url) => url !== item.url,
      );
    }
    syncInputFiles(items.filter((preview) => preview.id !== id));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    if (draggedId) {
      moveItemTo(draggedId, targetId);
    }
    setDraggedId(null);
  }

  return (
    <div className="border border-black p-4 md:col-span-2">
      <label
        htmlFor={inputId}
        className="block font-mono text-[10px] font-normal tracking-[0.14em] uppercase"
      >
        {title}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className="mt-4 block w-full font-sans text-xs font-normal normal-case tracking-normal file:mr-4 file:rounded-full file:border file:border-black file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-[10px] file:font-normal file:tracking-[0.12em] file:uppercase"
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple
        onChange={handleFilesSelected}
      />
      <p className="mt-3 text-xs leading-relaxed text-black/55">{description}</p>

      {selectionMessage && (
        <p className="mt-3 text-xs text-red-700" role="alert">
          {selectionMessage}
        </p>
      )}

      {items.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-4 font-mono text-[10px] font-normal tracking-[0.14em] uppercase">
            <span>ПРЕДПРОСМОТР</span>
            <span className="text-black/45">{items.length} / {maxFiles}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragEnd={() => setDraggedId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, item.id)}
                className={`border border-black bg-[#d8d7d2] transition-opacity ${
                  draggedId === item.id ? "opacity-45" : "cursor-grab"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b border-black">
                  <Image
                    src={item.url}
                    alt={`Предпросмотр ${item.file.name}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 90vw"
                    className="object-contain p-2"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-black px-2.5 py-1 font-mono text-[10px] font-normal text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="p-2">
                  <p className="truncate text-xs font-medium" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-black/45">
                    {formatFileSize(item.file.size)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="font-mono text-[10px] font-normal tracking-[0.12em] text-red-700 uppercase underline underline-offset-4"
                    >
                      УБРАТЬ
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="flex size-8 items-center justify-center rounded-full border border-black font-mono text-xs hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/25 disabled:hover:bg-transparent"
                        aria-label={`Переместить ${item.file.name} выше`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        className="flex size-8 items-center justify-center rounded-full border border-black font-mono text-xs hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-black/25 disabled:hover:bg-transparent"
                        aria-label={`Переместить ${item.file.name} ниже`}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-black/55">
            Перетащите карточки или используйте стрелки. В таком порядке файлы добавятся в проект.
          </p>
        </div>
      )}
    </div>
  );
}
