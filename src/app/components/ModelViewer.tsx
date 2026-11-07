"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/data/i18n";

type ModelViewerProps = {
  src: string;
  alt: string;
  poster?: string;
  className?: string;
  locale?: Locale;
};

type LightingPreset = "studio" | "contrast" | "soft";
type BackgroundPreset = "dark" | "gray" | "light";

type ThreeColorLike = {
  setHex?: (hex: number) => void;
};

type ThreeMaterialLike = {
  clone?: () => ThreeMaterialLike;
  color?: ThreeColorLike;
  emissive?: ThreeColorLike;
  map?: unknown;
  normalMap?: unknown;
  roughnessMap?: unknown;
  metalnessMap?: unknown;
  aoMap?: unknown;
  emissiveMap?: unknown;
  alphaMap?: unknown;
  bumpMap?: unknown;
  displacementMap?: unknown;
  specularMap?: unknown;
  envMap?: unknown;
  roughness?: number;
  metalness?: number;
  wireframe?: boolean;
  transparent?: boolean;
  opacity?: number;
  alphaTest?: number;
  vertexColors?: boolean;
  flatShading?: boolean;
  depthTest?: boolean;
  depthWrite?: boolean;
  polygonOffset?: boolean;
  polygonOffsetFactor?: number;
  polygonOffsetUnits?: number;
  needsUpdate?: boolean;
};

type ThreeObjectLike = {
  isMesh?: boolean;
  isSkinnedMesh?: boolean;
  parent?: ThreeObjectLike | null;
  geometry?: unknown;
  material?: ThreeMaterialLike | ThreeMaterialLike[];
  skeleton?: unknown;
  bindMatrix?: unknown;
  bind?: (skeleton: unknown, bindMatrix: unknown) => void;
  visible?: boolean;
  renderOrder?: number;
  frustumCulled?: boolean;
  userData?: Record<string, unknown>;
  add?: (child: ThreeObjectLike) => void;
  traverse?: (callback: (object: ThreeObjectLike) => void) => void;
  constructor: new (
    geometry: unknown,
    material: ThreeMaterialLike | ThreeMaterialLike[],
  ) => ThreeObjectLike;
};

type ModelSceneLike = ThreeObjectLike & {
  target?: ThreeObjectLike;
  models?: ThreeObjectLike[];
  shadow?: ThreeObjectLike | null;
  bakedShadows?: Set<unknown>;
  queueRender?: () => void;
};

const LIGHTING_CONFIG: Record<
  LightingPreset,
  {
    exposure: string;
    shadowIntensity: string;
    shadowSoftness: string;
    environmentImage: string;
    labelEn: string;
    labelRu: string;
  }
> = {
  studio: {
    exposure: "1",
    shadowIntensity: "0",
    shadowSoftness: "0.85",
    environmentImage: "neutral",
    labelEn: "STUDIO",
    labelRu: "СТУДИЯ",
  },
  contrast: {
    exposure: "1.25",
    shadowIntensity: "0",
    shadowSoftness: "0.35",
    environmentImage: "legacy",
    labelEn: "CONTRAST",
    labelRu: "КОНТРАСТ",
  },
  soft: {
    exposure: "0.88",
    shadowIntensity: "0",
    shadowSoftness: "1",
    environmentImage: "neutral",
    labelEn: "SOFT",
    labelRu: "МЯГКИЙ",
  },
};

const BACKGROUND_CONFIG: Record<
  BackgroundPreset,
  {
    bgClass: string;
    labelEn: string;
    labelRu: string;
  }
> = {
  dark: {
    bgClass: "bg-[#161616]",
    labelEn: "DARK",
    labelRu: "ТЁМНЫЙ",
  },
  gray: {
    bgClass: "bg-[#575757]",
    labelEn: "GRAY",
    labelRu: "СЕРЫЙ",
  },
  light: {
    bgClass: "bg-[#efeee9]",
    labelEn: "LIGHT",
    labelRu: "СВЕТЛЫЙ",
  },
};

const LIGHTING_ORDER: LightingPreset[] = ["studio", "contrast", "soft"];
const BACKGROUND_ORDER: BackgroundPreset[] = ["dark", "gray", "light"];

function getModelViewerScene(element: HTMLElement | null): ModelSceneLike | null {
  if (!element) return null;
  const symbols = Object.getOwnPropertySymbols(element);
  const sceneSymbol = symbols.find((sym) => sym.description === "scene");
  if (!sceneSymbol) return null;
  return (
    ((element as unknown as Record<symbol, unknown>)[sceneSymbol] as
      | ModelSceneLike
      | undefined) ?? null
  );
}

function isDescendantOf(node: ThreeObjectLike, ancestor: ThreeObjectLike | null | undefined): boolean {
  if (!ancestor) return false;
  let current: ThreeObjectLike | null | undefined = node;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

function createClayMaterial(base: ThreeMaterialLike): ThreeMaterialLike {
  const mat = base.clone ? base.clone() : { ...base };
  mat.color?.setHex?.(0xefefef);
  mat.emissive?.setHex?.(0x000000);
  mat.map = null;
  mat.normalMap = null;
  mat.roughnessMap = null;
  mat.metalnessMap = null;
  mat.aoMap = null;
  mat.emissiveMap = null;
  mat.alphaMap = null;
  mat.bumpMap = null;
  mat.displacementMap = null;
  mat.specularMap = null;
  mat.roughness = 0.82;
  mat.metalness = 0.04;
  mat.wireframe = false;
  mat.transparent = false;
  mat.opacity = 1;
  mat.alphaTest = 0;
  mat.vertexColors = false;
  mat.flatShading = false;
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  mat.needsUpdate = true;
  return mat;
}

function createWireOverlayMaterial(base: ThreeMaterialLike): ThreeMaterialLike {
  const mat = base.clone ? base.clone() : { ...base };
  mat.color?.setHex?.(0x333333);
  mat.emissive?.setHex?.(0x1a1a1a);
  mat.map = null;
  mat.normalMap = null;
  mat.roughnessMap = null;
  mat.metalnessMap = null;
  mat.aoMap = null;
  mat.emissiveMap = null;
  mat.alphaMap = null;
  mat.bumpMap = null;
  mat.displacementMap = null;
  mat.specularMap = null;
  mat.roughness = 1;
  mat.metalness = 0;
  mat.wireframe = true;
  mat.transparent = true;
  mat.opacity = 0.72;
  mat.alphaTest = 0;
  mat.vertexColors = false;
  mat.depthTest = true;
  mat.depthWrite = false;
  mat.polygonOffset = false;
  mat.needsUpdate = true;
  return mat;
}

export default function ModelViewer({
  src,
  alt,
  poster,
  className = "h-[65vh] min-h-[400px]",
  locale = "en",
}: ModelViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [lighting, setLighting] = useState<LightingPreset>("studio");
  const [background, setBackground] = useState<BackgroundPreset>("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  const applyWireframeToScene = useCallback((enabled: boolean) => {
    const scene = getModelViewerScene(viewerRef.current);
    if (!scene) return;

    if (scene.shadow) {
      scene.shadow.visible = false;
      scene.shadow.traverse?.((node) => {
        node.visible = false;
      });
    }
    if (scene.bakedShadows) {
      for (const shadowNode of scene.bakedShadows) {
        if (shadowNode && typeof shadowNode === "object" && "visible" in shadowNode) {
          (shadowNode as ThreeObjectLike).visible = false;
        }
      }
    }

    const roots =
      Array.isArray(scene.models) && scene.models.length > 0
        ? scene.models
        : [scene.target ?? scene];
    const meshes: ThreeObjectLike[] = [];

    for (const root of roots) {
      root.traverse?.((node) => {
        if (!node.isMesh || !node.material) return;
        if (node.userData?.__isWireframeOverlay || node.userData?.noHit) return;
        if (scene.bakedShadows?.has(node)) return;
        if (isDescendantOf(node, scene.shadow)) return;
        meshes.push(node);
      });
    }

    for (const mesh of meshes) {
      if (!mesh.userData) {
        mesh.userData = {};
      }

      if (!mesh.userData.__originalMaterial) {
        mesh.userData.__originalMaterial = mesh.material;
      }

      const originalMaterial = mesh.userData.__originalMaterial as
        | ThreeMaterialLike
        | ThreeMaterialLike[];

      if (enabled) {
        if (!mesh.userData.__clayMaterial) {
          mesh.userData.__clayMaterial = Array.isArray(originalMaterial)
            ? originalMaterial.map(createClayMaterial)
            : createClayMaterial(originalMaterial);
        }

        mesh.material = mesh.userData.__clayMaterial as
          | ThreeMaterialLike
          | ThreeMaterialLike[];

        let overlayMesh = mesh.userData.__wireframeOverlayMesh as
          | ThreeObjectLike
          | undefined;

        const wireMaterial = Array.isArray(originalMaterial)
          ? originalMaterial.map(createWireOverlayMaterial)
          : createWireOverlayMaterial(originalMaterial);

        if (!overlayMesh && mesh.geometry && typeof mesh.constructor === "function") {
          overlayMesh = new mesh.constructor(mesh.geometry, wireMaterial);
          overlayMesh.userData = { __isWireframeOverlay: true, noHit: true };
          overlayMesh.renderOrder = 1;
          overlayMesh.frustumCulled = false;

          if (mesh.isSkinnedMesh && mesh.skeleton && overlayMesh.bind) {
            overlayMesh.bind(mesh.skeleton, mesh.bindMatrix);
          }

          mesh.add?.(overlayMesh);
          mesh.userData.__wireframeOverlayMesh = overlayMesh;
        } else if (overlayMesh) {
          overlayMesh.material = wireMaterial;
        }

        if (overlayMesh) {
          overlayMesh.visible = true;
        }
      } else {
        mesh.material = originalMaterial;
        const overlayMesh = mesh.userData.__wireframeOverlayMesh as
          | ThreeObjectLike
          | undefined;
        if (overlayMesh) {
          overlayMesh.visible = false;
        }
      }
    }

    scene.queueRender?.();
  }, []);

  useEffect(() => {
    let active = true;

    import("@google/model-viewer").then(() => {
      if (active) setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const element = viewerRef.current;
    if (!element) return;

    const handleModelLoad = () => {
      applyWireframeToScene(wireframe);
    };

    element.addEventListener("load", handleModelLoad);
    applyWireframeToScene(wireframe);

    return () => {
      element.removeEventListener("load", handleModelLoad);
    };
  }, [applyWireframeToScene, loaded, resetCounter, wireframe]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function cycleLighting() {
    setLighting((current) => {
      const nextIndex = (LIGHTING_ORDER.indexOf(current) + 1) % LIGHTING_ORDER.length;
      return LIGHTING_ORDER[nextIndex];
    });
  }

  function cycleBackground() {
    setBackground((current) => {
      const nextIndex =
        (BACKGROUND_ORDER.indexOf(current) + 1) % BACKGROUND_ORDER.length;
      return BACKGROUND_ORDER[nextIndex];
    });
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }

  const lightingPreset = LIGHTING_CONFIG[lighting];
  const backgroundPreset = BACKGROUND_CONFIG[background];
  const isRu = locale === "ru";

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-colors duration-300 ${className} ${backgroundPreset.bgClass} ${
        isFullscreen ? "fixed inset-0 z-[100] !h-screen !w-screen" : ""
      }`}
    >
      {loaded ? (
        <model-viewer
          key={`mv-nofloor-${resetCounter}`}
          ref={(node: HTMLElement | null) => {
            viewerRef.current = node;
          }}
          src={src}
          alt={alt}
          poster={poster}
          camera-controls
          auto-rotate={autoRotate ? true : undefined}
          shadow-intensity="0"
          shadow-softness={lightingPreset.shadowSoftness}
          exposure={lightingPreset.exposure}
          environment-image={lightingPreset.environmentImage}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div
          className="flex h-full items-center justify-center font-mono text-[10px] tracking-[0.16em] text-white/55 uppercase"
          aria-live="polite"
        >
          {isRu ? "Загрузка 3D-модели..." : "Loading interactive model..."}
        </div>
      )}

      {/* 3D Controls toolbar */}
      <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-20 flex flex-col gap-2 sm:right-6 sm:bottom-6 sm:left-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-black/15 bg-[#efeee9]/95 p-1 font-mono text-[9px] tracking-[0.08em] text-black uppercase shadow-lg backdrop-blur-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5 sm:text-[10px] sm:tracking-[0.12em]">
          <button
            type="button"
            onClick={() => setWireframe((prev) => !prev)}
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 transition-colors sm:px-3 sm:py-1.5 ${
              wireframe ? "bg-black text-white" : "hover:bg-black/10"
            }`}
            aria-pressed={wireframe}
          >
            {isRu ? "СЕТКА" : "WIREFRAME"}: {wireframe ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 transition-colors sm:px-3 sm:py-1.5 ${
              autoRotate ? "bg-black text-white" : "hover:bg-black/10"
            }`}
            aria-pressed={autoRotate}
          >
            {isRu ? "ВРАЩЕНИЕ" : "TURNTABLE"}: {autoRotate ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={cycleLighting}
            className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 transition-colors hover:bg-black/10 sm:px-3 sm:py-1.5"
          >
            {isRu ? "СВЕТ" : "LIGHT"}:{" "}
            {isRu ? lightingPreset.labelRu : lightingPreset.labelEn}
          </button>

          <button
            type="button"
            onClick={cycleBackground}
            className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 transition-colors hover:bg-black/10 sm:px-3 sm:py-1.5"
          >
            {isRu ? "ФОН" : "BG"}:{" "}
            {isRu ? backgroundPreset.labelRu : backgroundPreset.labelEn}
          </button>

          <button
            type="button"
            onClick={() => setResetCounter((count) => count + 1)}
            className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 transition-colors hover:bg-black/10 sm:px-3 sm:py-1.5"
          >
            {isRu ? "СБРОС" : "RESET"}
          </button>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="pointer-events-auto shrink-0 self-end rounded-full border border-black/15 bg-[#efeee9]/95 px-3 py-1.5 font-mono text-[9px] tracking-[0.1em] text-black uppercase shadow-lg backdrop-blur-sm transition-colors hover:bg-black hover:text-white sm:self-auto sm:px-3.5 sm:py-2 sm:text-[10px]"
        >
          {isFullscreen
            ? isRu
              ? "ВЫЙТИ ×"
              : "EXIT ×"
            : isRu
              ? "НА ВЕСЬ ЭКРАН ↗"
              : "FULLSCREEN ↗"}
        </button>
      </div>
    </div>
  );
}
