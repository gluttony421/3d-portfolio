"use client";

import Image from "next/image";
import type { TouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type LightboxSlide = {
  src: string;
  alt: string;
};

type ImageLightboxProps = {
  images: LightboxSlide[];
  initialIndex?: number;
  closeLabel: string;
  prevLabel?: string;
  nextLabel?: string;
  onClose: () => void;
};

export default function ImageLightbox({
  images,
  initialIndex = 0,
  closeLabel,
  prevLabel = "Previous image",
  nextLabel = "Next image",
  onClose,
}: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)),
  );
  const touchStartX = useRef<number | null>(null);

  const hasMultiple = images.length > 1;
  const currentSlide = images[activeIndex] ?? images[0];

  const showPrevious = useCallback(() => {
    if (images.length < 2) return;
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }, [images.length]);

  const showNext = useCallback(() => {
    if (images.length < 2) return;
    setActiveIndex((current) => (current + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, showNext, showPrevious]);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        showPrevious();
      } else {
        showNext();
      }
    }
  }

  if (!currentSlide) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={currentSlide.alt}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div
        className="z-20 flex items-center justify-between"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="rounded-full border border-white/25 bg-black/75 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] text-white uppercase">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(images.length).padStart(2, "0")}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-full border border-white/60 bg-black font-mono text-lg text-white transition-colors hover:bg-white hover:text-black"
          aria-label={closeLabel}
        >
          ×
        </button>
      </div>

      {/* Main slide area */}
      <div
        className="relative my-2 flex-1 w-full"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          key={currentSlide.src}
          src={currentSlide.src}
          alt={currentSlide.alt}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label={prevLabel}
              className="absolute top-1/2 left-1 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/80 font-mono text-base text-white transition-colors hover:bg-white hover:text-black sm:left-3"
            >
              ←
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label={nextLabel}
              className="absolute top-1/2 right-1 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/80 font-mono text-base text-white transition-colors hover:bg-white hover:text-black sm:right-3"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div
          className="z-20 mx-auto flex max-w-full gap-2 overflow-x-auto py-1"
          onClick={(event) => event.stopPropagation()}
        >
          {images.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={item.alt}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`relative size-14 shrink-0 overflow-hidden border transition-opacity sm:size-16 ${
                index === activeIndex
                  ? "border-white opacity-100"
                  : "border-white/25 opacity-45 hover:opacity-80"
              }`}
            >
              <Image
                src={item.src}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
