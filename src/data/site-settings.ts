import settingsData from "./site-settings.json";

export type AboutSettings = {
  label: string;
  title: string;
  focusLabel: string;
  focus: string[];
  toolsLabel: string;
  tools: string[];
  contactLabel: string;
  contact: string[];
};

export type SiteSettings = Record<"en" | "ru", { about: AboutSettings }>;

export const siteSettings = settingsData as SiteSettings;
