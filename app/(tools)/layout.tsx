import Link from "next/link";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-[min(1180px,calc(100%-32px))] items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
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
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-sm font-semibold text-slate-400">PDF &amp; Doc Tools</span>
        </div>
      </header>
      <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-8">
        {children}
      </main>
    </div>
  );
}
