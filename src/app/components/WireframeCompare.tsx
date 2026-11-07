"use client";

import Image from "next/image";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import type { Locale } from "@/data/i18n";

type WireframeCompareProps = {
  renderSrc: string;
  wireframeSrc: string;
  title: string;
  locale: Locale;
  onOpenFullscreen?: () => void;
};

export default function WireframeCompare({
  renderSrc,
  wireframeSrc,
  title,
  locale,
  onOpenFullscreen,
}: WireframeCompareProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function updateFromClientX(clientX: number) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;
    const nextPercent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, nextPercent)));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFromClientX(event.clientX);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    updateFromClientX(event.clientX);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }

  const renderLabel = locale === "ru" ? "РЕНДЕР" : "RENDER";
  const wireframeLabel = locale === "ru" ? "СЕТКА" : "WIREFRAME";
  const fullscreenLabel = locale === "ru" ? "НА ВЕСЬ ЭКРАН" : "FULLSCREEN";

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      tabIndex={0}
      aria-label={
        locale === "ru"
          ? "Ползунок сравнения рендера и сетки"
          : "Render and wireframe comparison slider"
      }
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setPosition((prev) => Math.max(0, prev - 5));
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setPosition((prev) => Math.min(100, prev + 5));
        }
      }}
      className="relative h-full w-full cursor-ew-resize select-none overflow-hidden bg-[#090909] touch-none focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
    >
      {/* Base layer: Wireframe (right side revealed) */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={wireframeSrc}
          alt={`${title} — ${wireframeLabel}`}
          fill
          sizes="100vw"
          className="object-contain px-4 py-16 sm:px-10 sm:py-20 lg:px-16"
          priority
        />
      </div>

      {/* Clipped top layer: Final Render (left side) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={renderSrc}
          alt={`${title} — ${renderLabel}`}
          fill
          sizes="100vw"
          className="object-contain px-4 py-16 sm:px-10 sm:py-20 lg:px-16"
          priority
        />
      </div>

      {/* Divider line & handle */}
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/85 shadow-[0_0_12px_rgba(0,0,0,0.6)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-[#efeee9] font-mono text-xs text-black shadow-lg">
          ↔
        </div>
      </div>

      {/* Corner badges */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-white uppercase backdrop-blur-sm sm:bottom-6 sm:left-6">
        {renderLabel}
      </div>
      <div className="pointer-events-none absolute right-4 bottom-4 z-10 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-white uppercase backdrop-blur-sm sm:right-6 sm:bottom-6">
        {wireframeLabel}
      </div>

      {onOpenFullscreen && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onOpenFullscreen();
          }}
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/25 bg-black/80 px-3.5 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white uppercase backdrop-blur-sm transition-colors hover:bg-white hover:text-black sm:bottom-6"
        >
          {fullscreenLabel} ↗
        </button>
      )}
    </div>
  );
}
