"use client";

import { useEffect } from "react";
import type { Locale } from "@/data/i18n";

export default function DocumentLanguage({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;

    return () => {
      document.documentElement.lang = "en";
    };
  }, [locale]);

  return null;
}
