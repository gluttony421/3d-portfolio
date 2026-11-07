"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/data/i18n";

type ContactKind = "email" | "telegram" | "artstation" | "phone" | "link";

type ParsedContact =
  | { type: "text"; value: string }
  | {
      type: "contact";
      kind: ContactKind;
      label: string;
      display: string;
      href: string;
      copyValue: string;
    };

const KIND_LABEL: Record<ContactKind, { en: string; ru: string }> = {
  email: { en: "Email", ru: "Почта" },
  telegram: { en: "Telegram", ru: "Telegram" },
  artstation: { en: "ArtStation", ru: "ArtStation" },
  phone: { en: "Phone", ru: "Телефон" },
  link: { en: "Link", ru: "Ссылка" },
};

const EMAIL_RE = /^(?:mailto:)?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})$/i;
const PHONE_RE = /^(?:tel:)?(\+?[\d\s()-]{7,})$/;
const HANDLE_RE = /^@([A-Za-z0-9_]{3,32})$/;

function stripPrefix(raw: string) {
  // Allows lines like "Telegram: @nick" or "Email — me@mail.com"
  const match = raw.match(/^([A-Za-zА-Яа-яЁё ]{2,20})\s*[:—–-]\s*(.+)$/);
  return match ? { prefix: match[1].trim().toLowerCase(), value: match[2].trim() } : { prefix: "", value: raw };
}

function parseContact(raw: string): ParsedContact {
  const line = raw.trim();
  const { prefix, value } = stripPrefix(line);

  const email = value.match(EMAIL_RE);
  if (email) {
    return {
      type: "contact",
      kind: "email",
      label: "email",
      display: email[1],
      href: `mailto:${email[1]}`,
      copyValue: email[1],
    };
  }

  const handle = value.match(HANDLE_RE);
  if (handle) {
    const isArtstation = prefix.includes("artstation");
    const nick = handle[1];
    return isArtstation
      ? {
          type: "contact",
          kind: "artstation",
          label: "artstation",
          display: `@${nick}`,
          href: `https://www.artstation.com/${nick}`,
          copyValue: `@${nick}`,
        }
      : {
          type: "contact",
          kind: "telegram",
          label: "telegram",
          display: `@${nick}`,
          href: `https://t.me/${nick}`,
          copyValue: `@${nick}`,
        };
  }

  const urlCandidate = /^(https?:\/\/|www\.|t\.me\/|telegram\.me\/|[a-z0-9-]+\.artstation\.com|artstation\.com\/)/i.test(value)
    ? value
    : null;
  if (urlCandidate) {
    const href = /^https?:\/\//i.test(urlCandidate) ? urlCandidate : `https://${urlCandidate}`;
    try {
      const url = new URL(href);
      const host = url.hostname.replace(/^www\./, "");
      const path = url.pathname.replace(/\/+$/, "").replace(/^\//, "");

      if (host === "t.me" || host === "telegram.me") {
        const nick = path.split("/")[0];
        return {
          type: "contact",
          kind: "telegram",
          label: "telegram",
          display: nick ? `@${nick}` : host,
          href,
          copyValue: nick ? `@${nick}` : href,
        };
      }

      if (host.endsWith("artstation.com")) {
        const sub = host.split(".")[0];
        const nick = host === "artstation.com" ? path.split("/")[0] : sub;
        return {
          type: "contact",
          kind: "artstation",
          label: "artstation",
          display: nick ? `@${nick}` : host,
          href,
          copyValue: href,
        };
      }

      return {
        type: "contact",
        kind: "link",
        label: "link",
        display: `${host}${path ? `/${path}` : ""}`,
        href,
        copyValue: href,
      };
    } catch {
      // fall through to text
    }
  }

  const phone = value.match(PHONE_RE);
  if (phone && /\d{7,}/.test(phone[1].replace(/\D/g, ""))) {
    const digits = phone[1].replace(/[^\d+]/g, "");
    return {
      type: "contact",
      kind: "phone",
      label: "phone",
      display: phone[1].trim(),
      href: `tel:${digits}`,
      copyValue: phone[1].trim(),
    };
  }

  return { type: "text", value: line };
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

export default function ContactLinks({
  items,
  locale,
}: {
  items: string[];
  locale: Locale;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRu = locale === "ru";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy(value: string, index: number) {
    const ok = await copyToClipboard(value);
    setToast(
      ok
        ? `${isRu ? "Скопировано" : "Copied"}: ${value}`
        : isRu
          ? "Не удалось скопировать"
          : "Copy failed",
    );
    setCopiedIndex(ok ? index : null);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast(null);
      setCopiedIndex(null);
    }, 1800);
  }

  const parsed = items.map(parseContact);

  return (
    <>
      <ul className="space-y-1.5">
        {parsed.map((item, index) => {
          if (item.type === "text") {
            return (
              <li key={`${item.value}-${index}`} className="block">
                {item.value}
              </li>
            );
          }

          const isExternal = item.href.startsWith("http");
          const copied = copiedIndex === index;

          return (
            <li
              key={`${item.href}-${index}`}
              className="group/contact flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2"
            >
              <span className="w-16 sm:w-[4.75rem] shrink-0 font-mono text-[9px] tracking-[0.14em] text-white/45 uppercase">
                {isRu ? KIND_LABEL[item.kind].ru : KIND_LABEL[item.kind].en}
              </span>
              <a
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="min-w-0 max-w-[calc(100%-5rem)] sm:max-w-none truncate underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
              >
                {item.display}
              </a>
              <button
                type="button"
                onClick={() => handleCopy(item.copyValue, index)}
                className={`ml-auto sm:ml-0 shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] sm:text-[9px] tracking-[0.12em] uppercase transition-colors ${
                  copied
                    ? "border-white bg-white text-black"
                    : "border-white/30 text-white/70 hover:border-white hover:text-white"
                }`}
                aria-label={`${isRu ? "Скопировать" : "Copy"} ${item.copyValue}`}
              >
                {copied ? "✓" : isRu ? "Копировать" : "Copy"}
              </button>
            </li>
          );
        })}
      </ul>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-white px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-black uppercase shadow-xl transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast}
      </div>
    </>
  );
}
