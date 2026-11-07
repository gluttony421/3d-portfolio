import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PortfolioProject } from "@/data/projects";
import { normalizeYouTubeUrl } from "@/data/youtube";

export const runtime = "nodejs";

const MAX_COVER_SIZE = 15 * 1024 * 1024;
const MAX_MODEL_SIZE = 100 * 1024 * 1024;
const MAX_GALLERY_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_GALLERY_TOTAL_SIZE = 60 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 12;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

function detectImageExtension(buffer: Buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "png";
  }

  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
    return "jpg";
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  if (
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))
  ) {
    return "avif";
  }

  return undefined;
}

function resolveProjectAsset(assetPath: string) {
  if (!assetPath.startsWith("/projects/")) {
    return undefined;
  }

  const projectsRoot = path.resolve(process.cwd(), "public", "projects");
  const assetFile = path.resolve(
    process.cwd(),
    "public",
    assetPath.slice(1).replaceAll("/", path.sep),
  );

  if (!assetFile.startsWith(`${projectsRoot}${path.sep}`)) {
    return undefined;
  }

  return assetFile;
}

function getProjectAssetPaths(project: PortfolioProject) {
  return [
    project.cover,
    project.wireframe,
    project.model,
    ...(project.gallery ?? []),
  ].filter(
    (assetPath): assetPath is string => Boolean(assetPath),
  );
}

function getUploadedFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

async function deleteProjectAssets(
  project: PortfolioProject,
  remainingProjects: PortfolioProject[],
) {
  const projectsRoot = path.resolve(process.cwd(), "public", "projects");
  const projectDirectory = path.resolve(projectsRoot, project.slug);

  if (path.dirname(projectDirectory) !== projectsRoot) {
    throw new Error("Unsafe project directory");
  }

  const directoryUrlPrefix = `/projects/${project.slug}/`;
  const projectUsesDirectory = getProjectAssetPaths(project).some((assetPath) =>
    assetPath?.startsWith(directoryUrlPrefix),
  );
  const directoryIsShared = remainingProjects.some((item) =>
    getProjectAssetPaths(item).some((assetPath) =>
      assetPath?.startsWith(directoryUrlPrefix),
    ),
  );

  if (projectUsesDirectory && !directoryIsShared) {
    await rm(projectDirectory, { recursive: true, force: true });
  }

  const assetPaths = getProjectAssetPaths(project);

  for (const assetPath of assetPaths) {
    if (assetPath.startsWith(directoryUrlPrefix) && !directoryIsShared) {
      continue;
    }

    const isShared = remainingProjects.some((item) =>
      getProjectAssetPaths(item).includes(assetPath),
    );
    const assetFile = resolveProjectAsset(assetPath);

    if (!isShared && assetFile) {
      await rm(assetFile, { force: true });
    }
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development" || !isLocalRequest(request)) {
    return errorResponse("Панель доступна только в локальном режиме разработки.", 403);
  }

  try {
    const formData = await request.formData();
    const title = getText(formData, "title");
    const titleRu = getText(formData, "titleRu");
    const slug = getText(formData, "slug").toLowerCase();
    const category = getText(formData, "category");
    const categoryRu = getText(formData, "categoryRu");
    const software = getText(formData, "software")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const year = Number(getText(formData, "year"));
    const specs = {
      polygons: getText(formData, "polygons"),
      vertices: getText(formData, "vertices"),
      textures: getText(formData, "textures"),
      materials: getText(formData, "materials"),
      uvMaps: getText(formData, "uvMaps"),
      renderer: getText(formData, "renderer"),
    };
    const description =
      getText(formData, "description") ||
      `${title} — ${category} (${software.join(", ")}, ${year}).`;
    const descriptionRu =
      getText(formData, "descriptionRu") ||
      `${titleRu} — ${categoryRu} (${software.join(", ")}, ${year}).`;
    const cover = formData.get("cover");
    const wireframe = formData.get("wireframe");
    const model = formData.get("model");
    const video = getText(formData, "video");
    const normalizedVideo = normalizeYouTubeUrl(video);
    const galleryFiles = getUploadedFiles(formData, "gallery");

    if (video && !normalizedVideo) {
      return errorResponse("Укажите корректную ссылку на видео YouTube.", 400);
    }

    if (
      !title ||
      !titleRu ||
      !category ||
      !categoryRu ||
      software.length === 0 ||
      Object.values(specs).some((value) => !value)
    ) {
      return errorResponse("Заполните обязательные поля на английском и русском.", 400);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return errorResponse("Slug может содержать только строчные латинские буквы, цифры и дефисы.", 400);
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return errorResponse("Укажите корректный год от 2000 до 2100.", 400);
    }

    if (!(cover instanceof File) || cover.size === 0) {
      return errorResponse("Добавьте изображение обложки.", 400);
    }

    if (cover.size > MAX_COVER_SIZE) {
      return errorResponse("Размер обложки не должен превышать 15 МБ.", 400);
    }

    const hasWireframe = wireframe instanceof File && wireframe.size > 0;
    if (hasWireframe && wireframe.size > MAX_COVER_SIZE) {
      return errorResponse("Размер рендера сетки не должен превышать 15 МБ.", 400);
    }

    if (galleryFiles.length > MAX_GALLERY_IMAGES) {
      return errorResponse(`В галерее может быть не больше ${MAX_GALLERY_IMAGES} изображений.`, 400);
    }

    if (galleryFiles.some((file) => file.size > MAX_GALLERY_IMAGE_SIZE)) {
      return errorResponse("Каждое изображение галереи должно быть не больше 15 МБ.", 400);
    }

    const galleryTotalSize = galleryFiles.reduce((total, file) => total + file.size, 0);
    if (galleryTotalSize > MAX_GALLERY_TOTAL_SIZE) {
      return errorResponse("Общий размер изображений галереи не должен превышать 60 МБ.", 400);
    }

    const coverBuffer = Buffer.from(await cover.arrayBuffer());
    const coverExtension = detectImageExtension(coverBuffer);
    if (!coverExtension) {
      return errorResponse("Обложка должна быть в формате PNG, JPG, WEBP или AVIF.", 400);
    }

    let wireframeBuffer: Buffer | undefined;
    let wireframeExtension: string | undefined;
    if (hasWireframe) {
      wireframeBuffer = Buffer.from(await wireframe.arrayBuffer());
      wireframeExtension = detectImageExtension(wireframeBuffer);
      if (!wireframeExtension) {
        return errorResponse("Рендер сетки должен быть в формате PNG, JPG, WEBP или AVIF.", 400);
      }
    }

    const hasModel = model instanceof File && model.size > 0;
    if (hasModel && model.size > MAX_MODEL_SIZE) {
      return errorResponse("Размер GLB не должен превышать 100 МБ.", 400);
    }

    const projectsFile = path.join(process.cwd(), "src", "data", "projects.json");
    const projects = JSON.parse(
      await readFile(projectsFile, "utf8"),
    ) as PortfolioProject[];

    if (projects.some((project) => project.slug === slug)) {
      return errorResponse("Проект с таким slug уже существует.", 409);
    }

    const projectDirectory = path.join(process.cwd(), "public", "projects", slug);
    let modelBuffer: Buffer | undefined;
    const galleryBuffers: Array<{ buffer: Buffer; extension: string }> = [];

    if (hasModel) {
      modelBuffer = Buffer.from(await model.arrayBuffer());
      if (modelBuffer.subarray(0, 4).toString("ascii") !== "glTF") {
        return errorResponse("Выбранный файл не похож на корректный GLB.", 400);
      }
    }

    for (const file of galleryFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = detectImageExtension(buffer);
      if (!extension) {
        return errorResponse("Галерея поддерживает только PNG, JPG, WEBP или AVIF.", 400);
      }
      galleryBuffers.push({ buffer, extension });
    }

    await mkdir(projectDirectory, { recursive: false });

    const coverFilename = `cover.${coverExtension}`;
    await writeFile(path.join(projectDirectory, coverFilename), coverBuffer, {
      flag: "wx",
    });

    let wireframeFilename: string | undefined;
    if (wireframeBuffer && wireframeExtension) {
      wireframeFilename = `wireframe.${wireframeExtension}`;
      await writeFile(path.join(projectDirectory, wireframeFilename), wireframeBuffer, {
        flag: "wx",
      });
    }

    if (modelBuffer) {
      await writeFile(path.join(projectDirectory, "model.glb"), modelBuffer, {
        flag: "wx",
      });
    }

    const galleryPaths: string[] = [];
    for (const [index, image] of galleryBuffers.entries()) {
      const galleryFilename = `gallery-${String(index + 1).padStart(2, "0")}.${image.extension}`;
      await writeFile(path.join(projectDirectory, galleryFilename), image.buffer, {
        flag: "wx",
      });
      galleryPaths.push(`/projects/${slug}/${galleryFilename}`);
    }

    const project: PortfolioProject = {
      slug,
      title,
      category,
      cover: `/projects/${slug}/${coverFilename}`,
      ...(wireframeFilename ? { wireframe: `/projects/${slug}/${wireframeFilename}` } : {}),
      ...(modelBuffer ? { model: `/projects/${slug}/model.glb` } : {}),
      ...(normalizedVideo ? { video: normalizedVideo } : {}),
      ...(galleryPaths.length > 0 ? { gallery: galleryPaths } : {}),
      description,
      translations: {
        ru: {
          title: titleRu,
          category: categoryRu,
          description: descriptionRu,
        },
      },
      software,
      year,
      size: "small",
      specs,
    };

    await writeFile(
      projectsFile,
      `${JSON.stringify([...projects, project], null, 2)}\n`,
      "utf8",
    );

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST"
    ) {
      return errorResponse("Папка проекта с таким slug уже существует.", 409);
    }

    console.error("Failed to create portfolio project", error);
    return errorResponse("Не удалось сохранить проект. Проверьте терминал разработки.", 500);
  }
}

export async function PATCH(request: Request) {
  if (process.env.NODE_ENV !== "development" || !isLocalRequest(request)) {
    return errorResponse("Панель доступна только в локальном режиме разработки.", 403);
  }

  try {
    const formData = await request.formData();
    const slug = getText(formData, "slug").toLowerCase();
    const title = getText(formData, "title");
    const titleRu = getText(formData, "titleRu");
    const category = getText(formData, "category");
    const categoryRu = getText(formData, "categoryRu");
    const software = getText(formData, "software")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const year = Number(getText(formData, "year"));
    const specs = {
      polygons: getText(formData, "polygons"),
      vertices: getText(formData, "vertices"),
      textures: getText(formData, "textures"),
      materials: getText(formData, "materials"),
      uvMaps: getText(formData, "uvMaps"),
      renderer: getText(formData, "renderer"),
    };
    const description =
      getText(formData, "description") ||
      `${title} — ${category} (${software.join(", ")}, ${year}).`;
    const descriptionRu =
      getText(formData, "descriptionRu") ||
      `${titleRu} — ${categoryRu} (${software.join(", ")}, ${year}).`;
    const cover = formData.get("cover");
    const wireframe = formData.get("wireframe");
    const removeWireframe = formData.get("removeWireframe") === "true";
    const model = formData.get("model");
    const removeModel = formData.get("removeModel") === "true";
    const video = getText(formData, "video");
    const normalizedVideo = normalizeYouTubeUrl(video);
    const galleryFiles = getUploadedFiles(formData, "gallery");
    const removeGalleryPaths = formData
      .getAll("removeGallery")
      .filter((value): value is string => typeof value === "string");
    const requestedGalleryOrder = formData
      .getAll("galleryOrder")
      .filter((value): value is string => typeof value === "string");

    if (video && !normalizedVideo) {
      return errorResponse("Укажите корректную ссылку на видео YouTube.", 400);
    }

    if (
      !title ||
      !titleRu ||
      !category ||
      !categoryRu ||
      software.length === 0 ||
      Object.values(specs).some((value) => !value)
    ) {
      return errorResponse("Заполните обязательные поля на английском и русском.", 400);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return errorResponse("Некорректный slug проекта.", 400);
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return errorResponse("Укажите корректный год от 2000 до 2100.", 400);
    }

    const hasCover = cover instanceof File && cover.size > 0;
    const hasWireframe = wireframe instanceof File && wireframe.size > 0;
    const hasModel = model instanceof File && model.size > 0;

    if (hasCover && cover.size > MAX_COVER_SIZE) {
      return errorResponse("Размер обложки не должен превышать 15 МБ.", 400);
    }

    if (hasWireframe && wireframe.size > MAX_COVER_SIZE) {
      return errorResponse("Размер рендера сетки не должен превышать 15 МБ.", 400);
    }

    if (hasModel && model.size > MAX_MODEL_SIZE) {
      return errorResponse("Размер GLB не должен превышать 100 МБ.", 400);
    }

    if (galleryFiles.some((file) => file.size > MAX_GALLERY_IMAGE_SIZE)) {
      return errorResponse("Каждое изображение галереи должно быть не больше 15 МБ.", 400);
    }

    const galleryTotalSize = galleryFiles.reduce((total, file) => total + file.size, 0);
    if (galleryTotalSize > MAX_GALLERY_TOTAL_SIZE) {
      return errorResponse("Общий размер новых изображений не должен превышать 60 МБ.", 400);
    }

    let coverBuffer: Buffer | undefined;
    let coverExtension: string | undefined;
    if (hasCover) {
      coverBuffer = Buffer.from(await cover.arrayBuffer());
      coverExtension = detectImageExtension(coverBuffer);
      if (!coverExtension) {
        return errorResponse("Обложка должна быть в формате PNG, JPG, WEBP или AVIF.", 400);
      }
    }

    let wireframeBuffer: Buffer | undefined;
    let wireframeExtension: string | undefined;
    if (hasWireframe) {
      wireframeBuffer = Buffer.from(await wireframe.arrayBuffer());
      wireframeExtension = detectImageExtension(wireframeBuffer);
      if (!wireframeExtension) {
        return errorResponse("Рендер сетки должен быть в формате PNG, JPG, WEBP или AVIF.", 400);
      }
    }

    let modelBuffer: Buffer | undefined;
    if (hasModel) {
      modelBuffer = Buffer.from(await model.arrayBuffer());
      if (modelBuffer.subarray(0, 4).toString("ascii") !== "glTF") {
        return errorResponse("Выбранный файл не похож на корректный GLB.", 400);
      }
    }

    const galleryBuffers: Array<{ buffer: Buffer; extension: string }> = [];
    for (const file of galleryFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = detectImageExtension(buffer);
      if (!extension) {
        return errorResponse("Галерея поддерживает только PNG, JPG, WEBP или AVIF.", 400);
      }
      galleryBuffers.push({ buffer, extension });
    }

    const projectsFile = path.join(process.cwd(), "src", "data", "projects.json");
    const projects = JSON.parse(
      await readFile(projectsFile, "utf8"),
    ) as PortfolioProject[];
    const projectIndex = projects.findIndex((project) => project.slug === slug);

    if (projectIndex === -1) {
      return errorResponse("Проект не найден.", 404);
    }

    const currentProject = projects[projectIndex];
    const currentGallery = currentProject.gallery ?? [];
    if (removeGalleryPaths.some((assetPath) => !currentGallery.includes(assetPath))) {
      return errorResponse("Передан неизвестный файл галереи.", 400);
    }

    const galleryOrder =
      requestedGalleryOrder.length > 0 ? requestedGalleryOrder : currentGallery;
    if (
      galleryOrder.length !== currentGallery.length ||
      new Set(galleryOrder).size !== currentGallery.length ||
      galleryOrder.some((assetPath) => !currentGallery.includes(assetPath))
    ) {
      return errorResponse(
        "Порядок галереи должен содержать каждое текущее изображение ровно один раз.",
        400,
      );
    }

    const remainingGallery = galleryOrder.filter(
      (assetPath) => !removeGalleryPaths.includes(assetPath),
    );
    if (remainingGallery.length + galleryBuffers.length > MAX_GALLERY_IMAGES) {
      return errorResponse(`В галерее может быть не больше ${MAX_GALLERY_IMAGES} изображений.`, 400);
    }

    let coverPath = currentProject.cover;
    let wireframePath = removeWireframe ? undefined : currentProject.wireframe;
    let modelPath = removeModel ? undefined : currentProject.model;
    const galleryPaths = [...remainingGallery];
    const removedAssetPaths = [...removeGalleryPaths];

    if (removeWireframe && currentProject.wireframe) {
      removedAssetPaths.push(currentProject.wireframe);
    }
    if (removeModel && currentProject.model) {
      removedAssetPaths.push(currentProject.model);
    }

    if (coverBuffer || wireframeBuffer || modelBuffer || galleryBuffers.length > 0) {
      const projectDirectory = path.join(process.cwd(), "public", "projects", slug);
      await mkdir(projectDirectory, { recursive: true });

      if (coverBuffer && coverExtension) {
        const coverFilename = `cover.${coverExtension}`;
        await writeFile(path.join(projectDirectory, coverFilename), coverBuffer);
        if (currentProject.cover !== `/projects/${slug}/${coverFilename}`) {
          removedAssetPaths.push(currentProject.cover);
        }
        coverPath = `/projects/${slug}/${coverFilename}`;
      }

      if (wireframeBuffer && wireframeExtension) {
        const wireframeFilename = `wireframe.${wireframeExtension}`;
        await writeFile(path.join(projectDirectory, wireframeFilename), wireframeBuffer);
        if (
          currentProject.wireframe &&
          currentProject.wireframe !== `/projects/${slug}/${wireframeFilename}`
        ) {
          removedAssetPaths.push(currentProject.wireframe);
        }
        wireframePath = `/projects/${slug}/${wireframeFilename}`;
      }

      if (modelBuffer) {
        await writeFile(path.join(projectDirectory, "model.glb"), modelBuffer);
        if (
          currentProject.model &&
          currentProject.model !== `/projects/${slug}/model.glb`
        ) {
          removedAssetPaths.push(currentProject.model);
        }
        modelPath = `/projects/${slug}/model.glb`;
      }

      const uploadId = Date.now();
      for (const [index, image] of galleryBuffers.entries()) {
        const galleryFilename = `gallery-${uploadId}-${index + 1}.${image.extension}`;
        await writeFile(path.join(projectDirectory, galleryFilename), image.buffer, {
          flag: "wx",
        });
        galleryPaths.push(`/projects/${slug}/${galleryFilename}`);
      }
    }

    const updatedProject: PortfolioProject = {
      ...currentProject,
      title,
      category,
      cover: coverPath,
      wireframe: wireframePath,
      model: modelPath,
      video: normalizedVideo,
      gallery: galleryPaths,
      description,
      translations: {
        ru: {
          title: titleRu,
          category: categoryRu,
          description: descriptionRu,
        },
      },
      software,
      year,
      size: currentProject.size ?? "small",
      specs,
    };

    projects[projectIndex] = updatedProject;
    await writeFile(
      projectsFile,
      `${JSON.stringify(projects, null, 2)}\n`,
      "utf8",
    );

    for (const assetPath of removedAssetPaths) {
      const isStillUsed = projects.some((item) =>
        getProjectAssetPaths(item).includes(assetPath),
      );
      const assetFile = resolveProjectAsset(assetPath);
      if (!isStillUsed && assetFile) {
        await rm(assetFile, { force: true });
      }
    }

    return Response.json({ project: updatedProject });
  } catch (error) {
    console.error("Failed to update portfolio project", error);
    return errorResponse("Не удалось обновить проект. Проверьте терминал разработки.", 500);
  }
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV !== "development" || !isLocalRequest(request)) {
    return errorResponse("Панель доступна только в локальном режиме разработки.", 403);
  }

  try {
    const body = (await request.json()) as {
      slug?: unknown;
      assetType?: unknown;
      assetPath?: unknown;
    };
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const assetType = typeof body.assetType === "string" ? body.assetType : "";
    const assetPath = typeof body.assetPath === "string" ? body.assetPath : "";

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return errorResponse("Некорректный slug проекта.", 400);
    }

    const projectsFile = path.join(process.cwd(), "src", "data", "projects.json");
    const projects = JSON.parse(
      await readFile(projectsFile, "utf8"),
    ) as PortfolioProject[];
    const projectIndex = projects.findIndex((item) => item.slug === slug);

    if (projectIndex === -1) {
      return errorResponse("Проект не найден.", 404);
    }

    const project = projects[projectIndex];

    if (assetType === "model" || assetType === "wireframe" || assetType === "gallery") {
      let deletedFile: string | undefined;
      let updatedProject: PortfolioProject;

      if (assetType === "model") {
        deletedFile = project.model;
        updatedProject = { ...project, model: undefined };
      } else if (assetType === "wireframe") {
        deletedFile = project.wireframe;
        updatedProject = { ...project, wireframe: undefined };
      } else {
        if (!assetPath || !(project.gallery ?? []).includes(assetPath)) {
          return errorResponse("Изображение галереи не найдено в проекте.", 404);
        }
        deletedFile = assetPath;
        updatedProject = {
          ...project,
          gallery: (project.gallery ?? []).filter((item) => item !== assetPath),
        };
      }

      projects[projectIndex] = updatedProject;
      await writeFile(
        projectsFile,
        `${JSON.stringify(projects, null, 2)}\n`,
        "utf8",
      );

      if (deletedFile) {
        const isStillUsed = projects.some((item) =>
          getProjectAssetPaths(item).includes(deletedFile),
        );
        const resolvedFile = resolveProjectAsset(deletedFile);
        if (!isStillUsed && resolvedFile) {
          await rm(resolvedFile, { force: true });
        }
      }

      return Response.json({ project: updatedProject });
    }

    const remainingProjects = projects.filter((item) => item.slug !== slug);
    await writeFile(
      projectsFile,
      `${JSON.stringify(remainingProjects, null, 2)}\n`,
      "utf8",
    );

    let warning: string | undefined;
    try {
      await deleteProjectAssets(project, remainingProjects);
    } catch (error) {
      console.error("Project metadata was deleted, but asset cleanup failed", error);
      warning = "Некоторые файлы не удалось удалить; проверьте папку public/projects.";
    }

    return Response.json({ deletedSlug: slug, ...(warning ? { warning } : {}) });
  } catch (error) {
    console.error("Failed to delete portfolio project", error);
    return errorResponse("Не удалось удалить проект. Проверьте терминал разработки.", 500);
  }
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV !== "development" || !isLocalRequest(request)) {
    return errorResponse("Панель доступна только в локальном режиме разработки.", 403);
  }

  try {
    const body = (await request.json()) as { order?: unknown };
    if (
      !Array.isArray(body.order) ||
      body.order.some((slug) => typeof slug !== "string")
    ) {
      return errorResponse("Передан некорректный порядок проектов.", 400);
    }

    const order = body.order as string[];
    const projectsFile = path.join(process.cwd(), "src", "data", "projects.json");
    const projects = JSON.parse(
      await readFile(projectsFile, "utf8"),
    ) as PortfolioProject[];
    const projectBySlug = new Map(
      projects.map((project) => [project.slug, project]),
    );
    const uniqueOrder = new Set(order);

    if (
      order.length !== projects.length ||
      uniqueOrder.size !== projects.length ||
      order.some((slug) => !projectBySlug.has(slug))
    ) {
      return errorResponse(
        "Порядок должен содержать каждый существующий проект ровно один раз.",
        400,
      );
    }

    const reorderedProjects = order.map((slug) => projectBySlug.get(slug)!);
    await writeFile(
      projectsFile,
      `${JSON.stringify(reorderedProjects, null, 2)}\n`,
      "utf8",
    );

    return Response.json({ projects: reorderedProjects });
  } catch (error) {
    console.error("Failed to reorder portfolio projects", error);
    return errorResponse("Не удалось изменить порядок. Проверьте терминал разработки.", 500);
  }
}
