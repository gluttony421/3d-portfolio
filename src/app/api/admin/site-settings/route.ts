import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { AboutSettings, SiteSettings } from "@/data/site-settings";

export const runtime = "nodejs";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getLines(formData: FormData, key: string) {
  return getText(formData, key)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

function readAbout(formData: FormData, suffix: "En" | "Ru"): AboutSettings {
  return {
    label: getText(formData, `label${suffix}`),
    title: getText(formData, `title${suffix}`),
    focusLabel: getText(formData, `focusLabel${suffix}`),
    focus: getLines(formData, `focus${suffix}`),
    toolsLabel: getText(formData, `toolsLabel${suffix}`),
    tools: getLines(formData, `tools${suffix}`),
    contactLabel: getText(formData, `contactLabel${suffix}`),
    contact: getLines(formData, `contact${suffix}`),
  };
}

function isComplete(about: AboutSettings) {
  return (
    about.label.length > 0 &&
    about.title.length > 0 &&
    about.focusLabel.length > 0 &&
    about.focus.length > 0 &&
    about.toolsLabel.length > 0 &&
    about.tools.length > 0 &&
    about.contactLabel.length > 0 &&
    about.contact.length > 0
  );
}

export async function PATCH(request: Request) {
  if (process.env.NODE_ENV !== "development" || !isLocalRequest(request)) {
    return errorResponse("Панель доступна только в локальном режиме разработки.", 403);
  }

  try {
    const formData = await request.formData();
    const settings: SiteSettings = {
      en: { about: readAbout(formData, "En") },
      ru: { about: readAbout(formData, "Ru") },
    };

    if (!isComplete(settings.en.about) || !isComplete(settings.ru.about)) {
      return errorResponse(
        "Заполните все поля блока «Обо мне» на английском и русском.",
        400,
      );
    }

    const settingsFile = path.join(process.cwd(), "src", "data", "site-settings.json");
    await writeFile(settingsFile, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

    return Response.json({ settings });
  } catch (error) {
    console.error("Failed to update site settings", error);
    return errorResponse("Не удалось сохранить информацию «Обо мне».", 500);
  }
}
