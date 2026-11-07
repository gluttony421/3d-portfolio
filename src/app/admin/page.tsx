import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { siteSettings } from "@/data/site-settings";
import AdminDashboard from "./AdminDashboard";

export const metadata: Metadata = {
  title: "Local project manager | Portfolio",
  description: "Local-only project manager for the 3D portfolio.",
};

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <AdminDashboard
      initialProjects={projects}
      initialSiteSettings={siteSettings}
    />
  );
}
