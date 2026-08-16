import Link from "next/link";
import AnimeScene from "@/components/AnimeScene";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <AnimeScene />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
        <div className="flex min-h-14 w-full flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-0 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-slate-100 transition hover:border-white/30 hover:bg-white/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <div className="hidden h-4 w-px bg-white/15 sm:block" />
          <span className="text-sm font-semibold text-white/60">PDF &amp; Doc Tools</span>
        </div>
      </header>
      <main className="relative z-10 w-full px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
