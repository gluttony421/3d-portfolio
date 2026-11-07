import type { Metadata } from "next";
import ModelViewer from "../components/ModelViewer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "3D Model Viewer",
  robots: { index: false, follow: false },
};

export default function ViewerPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f3] p-6 md:p-12">
      <Link href="/" className="text-sm text-black">
        ← BACK TO PORTFOLIO
      </Link>

      <div className="mt-12 mb-8">
        <p className="text-xs tracking-[0.25em] text-neutral-500">
          INTERACTIVE 3D MODEL
        </p>

        <h1 className="mt-4 text-4xl font-semibold text-black">
          Metal Master MLF-3015R
        </h1>
      </div>

      <ModelViewer
        src="/projects/metal-master-mlf-3015r/model.glb"
        alt="Metal Master MLF-3015R"
      />

      <p className="mt-5 text-sm text-neutral-500">
        Drag to rotate · Scroll to zoom
      </p>
    </main>
  );
}
