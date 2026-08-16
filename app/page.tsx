import Link from "next/link";
import AnimeScene from "@/components/AnimeScene";

const tools = [
  {
    href: "/template-editor",
    title: "Word Template Editor",
    description: "Fill in placeholders and download your document as Word or PDF.",
    badge: "Word & PDF",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: "/pdf-delete",
    title: "Delete PDF Pages",
    description: "Upload a PDF, select pages to remove, and download the result.",
    badge: "PDF",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/>
        <path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
  },
  {
    href: "/word-delete",
    title: "Delete Word Pages",
    description: "Upload a DOCX, preview exact pages, select and delete them.",
    badge: "Word",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    href: "/word-to-pdf",
    title: "Word to PDF",
    description: "Convert a DOCX file to a high-fidelity PDF using LibreOffice.",
    badge: "Word → PDF",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/>
        <path d="M12 5l7 7-7 7"/>
      </svg>
    ),
  },
  {
    href: "/ppt-to-pdf",
    title: "PPT to PDF",
    description: "Convert a PPT or PPTX presentation into a PDF file.",
    badge: "PPT → PDF",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/>
        <path d="M12 5l7 7-7 7"/>
        <circle cx="8" cy="8" r="2"/>
      </svg>
    ),
  },
  {
    href: "/pdf-to-word",
    title: "PDF to Word",
    description: "Convert a PDF document into an editable DOCX file.",
    badge: "PDF → Word",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"/>
        <path d="M12 19l-7-7 7-7"/>
      </svg>
    ),
  },
  {
    href: "/pdf-to-ppt",
    title: "PDF to PPT",
    description: "Convert a PDF document into an editable PowerPoint presentation.",
    badge: "PDF → PPT",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-100",
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16"/>
        <path d="M14 5l7 7-7 7"/>
        <rect x="3" y="4" width="7" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/pdf-to-excel",
    title: "PDF to Excel",
    description: "Extract tables from a PDF into an editable Excel spreadsheet. One sheet per page.",
    badge: "PDF → Excel",
    badgeColor: "bg-green-50 text-green-700 border-green-100",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
        <path d="M9 3v18"/>
        <path d="M15 3v18"/>
      </svg>
    ),
  },
  {
    href: "/merge-pdf",
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one. Drag to reorder before merging.",
    badge: "Merge",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-100",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6H3v12h5"/>
        <path d="M16 6h5v12h-5"/>
        <path d="M12 3v18"/>
        <path d="M8 12H3"/>
        <path d="M16 12h5"/>
      </svg>
    ),
  },
  {
    href: "/compress-pdf",
    title: "Compress PDF",
    description: "Reduce PDF file size with Extreme, Recommended, or Less compression.",
    badge: "Compress",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-100",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 14 10 14 10 20"/>
        <polyline points="20 10 14 10 14 4"/>
        <line x1="10" y1="14" x2="3" y2="21"/>
        <line x1="21" y1="3" x2="14" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate individual pages or all pages clockwise / counter-clockwise.",
    badge: "Rotate",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-100",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6"/>
        <path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>
      </svg>
    ),
  },
  {
    href: "/crop-pdf",
    title: "Crop PDF",
    description: "Crop each page with per-page controls, then download the updated PDF.",
    badge: "Crop",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M8 8h8v8H8z"/>
        <path d="M3 12h3"/>
        <path d="M18 12h3"/>
      </svg>
    ),
  },
  {
    href: "/split-pdf",
    title: "Split PDF",
    description: "Split one PDF into multiple files by defining custom page ranges.",
    badge: "Split",
    badgeColor: "bg-lime-50 text-lime-700 border-lime-100",
    iconBg: "bg-lime-50",
    iconColor: "text-lime-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5"/>
        <path d="M8 3H3v5"/>
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
        <path d="M21 3l-7.828 7.828"/>
      </svg>
    ),
  },
  {
    href: "/jpg-to-pdf",
    title: "Images to PDF",
    description: "Convert JPG or PNG images into a single PDF. Each image becomes one page. Drag to reorder.",
    badge: "Images → PDF",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-100",
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    href: "/image-convert",
    title: "Convert Image Type",
    description: "Convert images between PNG, JPG, JPEG, WEBP, and AVIF formats.",
    badge: "Image Convert",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
        <path d="M14 7h6"/>
        <path d="M17 4l3 3-3 3"/>
      </svg>
    ),
  },
  {
    href: "/image-resize",
    title: "Image Resize",
    description: "Resize images using ratio, exact pixel dimensions, or percentage scaling.",
    badge: "Resize",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <path d="M9 9h6v6H9z"/>
        <path d="M3 12h3"/>
        <path d="M18 12h3"/>
      </svg>
    ),
  },
  {
    href: "/scan-to-pdf",
    title: "Scan Photo to PDF",
    description: "Use mobile front/back camera or laptop webcam to capture photos and create a scanned PDF.",
    badge: "Scanner",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-100",
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    href: "/rearrange-pdf",
    title: "Rearrange PDF Pages",
    description: "Drag and drop pages to reorder them, then download the new PDF.",
    badge: "Rearrange",
    badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    iconBg: "bg-fuchsia-50",
    iconColor: "text-fuchsia-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l4-4 4 4"/>
        <path d="M7 5v14"/>
        <path d="M21 15l-4 4-4-4"/>
        <path d="M17 19V5"/>
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen">
      <AnimeScene />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero */}
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] pb-6 pt-14 max-md:pt-10">
          <div className="inline-block max-w-xl rounded-3xl border border-white/15 bg-slate-950/45 px-6 py-5 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300/90">
              PDF &amp; Doc Tools
            </p>
            <h1 className="font-[var(--font-newsreader)] text-4xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] max-md:text-3xl">
              What would you like to do?
            </h1>
            <p className="mt-2 max-w-xl text-slate-200/90">
              All tools run locally in your browser or via a secure server-side process. No files are stored.
            </p>
          </div>
        </div>

        {/* Tool grid */}
        <div className="mx-auto w-[min(1180px,calc(100%-32px))] pb-14 pt-4">
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/60 p-6 shadow-[0_10px_38px_rgba(0,0,0,0.4)] transition duration-300 hover:-translate-y-1.5 hover:border-amber-200/40 hover:bg-slate-950/70 hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
            >
              {/* Glass edge highlight + hover glow */}
              <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              <span className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Icon */}
              <div className={`relative mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ring-1 ring-white/40 ${tool.iconBg} ${tool.iconColor}`}>
                {tool.icon}
              </div>

              {/* Text */}
              <h2 className="relative text-base font-bold text-white">
                {tool.title}
              </h2>
              <p className="relative mt-1 flex-1 text-sm leading-relaxed text-slate-300">
                {tool.description}
              </p>

              {/* Footer */}
              <div className="relative mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${tool.badgeColor}`}>
                  {tool.badge}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white"
                >
                  <path d="M5 12h14"/>
                  <path d="M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
