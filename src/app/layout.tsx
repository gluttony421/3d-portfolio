import type { Metadata } from "next";
import { siteUrl } from "@/data/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "3D Artist Portfolio",
    template: "%s | 3D Artist Portfolio",
  },
  description:
    "A varied 3D artist portfolio featuring vehicles, objects, machines and interactive models.",
  applicationName: "3D Artist Portfolio",
  category: "portfolio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
