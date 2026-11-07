"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { AboutSettings, SiteSettings } from "@/data/site-settings";

type SaveState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const fieldClassName =
  "mt-2 w-full border-0 border-b border-black bg-transparent px-0 py-3 font-sans text-base font-normal normal-case tracking-normal text-black outline-none transition-colors placeholder:text-black/35 focus:border-b-2";

const labelClassName =
  "block font-mono text-[10px] font-normal tracking-[0.14em] uppercase";

const helperTextClassName =
  "mt-2 block font-sans text-xs font-normal normal-case tracking-normal text-black/55";

function LanguageFields({
  language,
  suffix,
  settings,
}: {
  language: string;
  suffix: "En" | "Ru";
  settings: AboutSettings;
}) {
  return (
    <div className="grid content-start gap-7 p-5 md:p-8">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <h3 className="text-2xl leading-[0.94] font-[950] tracking-[-0.05em] uppercase">{language}</h3>
        <span className="font-mono text-[10px] font-normal tracking-[0.16em] uppercase">{suffix.toUpperCase()}</span>
      </div>

      <label className={labelClassName}>
        ПОДПИСЬ РАЗДЕЛА
        <input className={fieldClassName} name={`label${suffix}`} defaultValue={settings.label} required />
      </label>

      <label className={labelClassName}>
        ОСНОВНОЙ ТЕКСТ
        <textarea
          className={`${fieldClassName} min-h-36 resize-y leading-snug`}
          name={`title${suffix}`}
          defaultValue={settings.title}
          required
        />
      </label>

      <div className="grid gap-7 sm:grid-cols-[0.7fr_1.3fr]">
        <label className={labelClassName}>
          ЗАГОЛОВОК КОЛОНКИ 1
          <input className={fieldClassName} name={`focusLabel${suffix}`} defaultValue={settings.focusLabel} required />
        </label>
        <label className={labelClassName}>
          СОДЕРЖИМОЕ КОЛОНКИ 1
          <textarea
            className={`${fieldClassName} min-h-28 resize-y leading-relaxed`}
            name={`focus${suffix}`}
            defaultValue={settings.focus.join("\n")}
            required
          />
          <span className={helperTextClassName}>Один пункт на строку</span>
        </label>
      </div>

      <div className="grid gap-7 sm:grid-cols-[0.7fr_1.3fr]">
        <label className={labelClassName}>
          ЗАГОЛОВОК КОЛОНКИ 2
          <input className={fieldClassName} name={`toolsLabel${suffix}`} defaultValue={settings.toolsLabel} required />
        </label>
        <label className={labelClassName}>
          СОДЕРЖИМОЕ КОЛОНКИ 2
          <textarea
            className={`${fieldClassName} min-h-28 resize-y leading-relaxed`}
            name={`tools${suffix}`}
            defaultValue={settings.tools.join("\n")}
            required
          />
          <span className={helperTextClassName}>Один пункт на строку</span>
        </label>
      </div>

      <div className="grid gap-7 sm:grid-cols-[0.7fr_1.3fr]">
        <label className={labelClassName}>
          ЗАГОЛОВОК КОЛОНКИ 3
          <input className={fieldClassName} name={`contactLabel${suffix}`} defaultValue={settings.contactLabel} required />
        </label>
        <label className={labelClassName}>
          СОДЕРЖИМОЕ КОЛОНКИ 3
          <textarea
            className={`${fieldClassName} min-h-28 resize-y leading-relaxed`}
            name={`contact${suffix}`}
            defaultValue={settings.contact.join("\n")}
            required
          />
          <span className={helperTextClassName}>Один пункт на строку</span>
        </label>
      </div>
    </div>
  );
}

export default function SiteSettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSettings;
}) {
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState({ kind: "submitting" });

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Не удалось сохранить информацию.");
      }

      setSaveState({
        kind: "success",
        message: "Информация сохранена. Изменения уже доступны на сайте.",
      });
    } catch (error) {
      setSaveState({
        kind: "error",
        message: error instanceof Error ? error.message : "Не удалось сохранить информацию.",
      });
    }
  }

  return (
    <section id="about-settings" className="border-b border-black">
      <div className="grid border-b border-black lg:grid-cols-[0.7fr_1.3fr]">
        <div className="border-b border-black bg-black p-5 text-white md:p-8 lg:border-r lg:border-b-0">
          <p className="mb-8 font-mono text-[10px] font-normal tracking-[0.16em] text-white/55 uppercase">SITE CONTENT / ABOUT</p>
          <h2 className="text-[clamp(2.8rem,6vw,6.5rem)] leading-[0.84] font-[950] tracking-[-0.08em] uppercase">
            Обо мне
          </h2>
        </div>
        <div className="flex items-end p-5 md:p-8">
          <p className="max-w-2xl text-xl leading-[1.06] tracking-[-0.035em] md:text-3xl">
            Отдельный редактор информации о вас. Заполните обе языковые версии и сохраните — блок на главной странице обновится автоматически.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-black">
          <LanguageFields language="English" suffix="En" settings={initialSettings.en.about} />
          <LanguageFields language="Русский" suffix="Ru" settings={initialSettings.ru.about} />
        </div>

        <div className="flex flex-col gap-4 border-t border-black p-5 md:flex-row md:items-center md:justify-between md:p-8">
          <button
            className="w-fit rounded-full bg-black px-6 py-3 font-mono text-[10px] font-normal tracking-[0.12em] text-white uppercase transition-colors hover:bg-black/75 disabled:cursor-wait disabled:opacity-50"
            type="submit"
            disabled={saveState.kind === "submitting"}
          >
            {saveState.kind === "submitting" ? "СОХРАНЯЮ..." : "СОХРАНИТЬ ИНФОРМАЦИЮ"}
          </button>

          {saveState.kind === "success" || saveState.kind === "error" ? (
            <p
              className={`text-sm ${saveState.kind === "error" ? "text-red-700" : "text-emerald-800"}`}
              role="status"
            >
              {saveState.message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
