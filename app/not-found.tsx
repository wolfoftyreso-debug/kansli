import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main" className="border-b border-line">
      <div className="doc py-24 site:py-32">
        <span className="eyebrow text-teal">404</span>
        <h1 className="mt-5 mb-5 text-[40px] font-semibold tracking-[-0.03em]">
          That page is not here.
        </h1>
        <p className="mb-8 text-lg leading-[1.6] text-muted">
          The address may have moved. The work has not.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Landvex
        </Link>
      </div>
    </main>
  );
}
