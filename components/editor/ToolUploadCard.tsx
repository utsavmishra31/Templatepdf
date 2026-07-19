import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  accept: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  isBusy: boolean;
  status: string;
  statusType: StatusType;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ToolUploadCard({
  accept,
  label,
  hint,
  icon,
  isBusy,
  status,
  statusType,
  multiple,
  onChange,
}: Props) {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
      <div className="w-full max-w-lg animate-step-in">
        {/* Drop zone */}
        <label
          className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed bg-white px-10 py-16 text-center transition
            ${isBusy
              ? "cursor-progress border-slate-200 opacity-60"
              : "border-slate-300 hover:border-teal-500 hover:bg-teal-50/30"
            }`}
        >
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={onChange}
            disabled={isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />

          {/* Icon */}
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 transition group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-600 ${isBusy ? "" : ""}`}>
            {isBusy ? (
              <svg
                className="animate-spin text-teal-600"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              icon
            )}
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-extrabold text-slate-800">{label}</p>
            <p className="mt-1 text-sm text-slate-400">
              {isBusy ? "Processing…" : "Click to browse or drop a file here"}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-400">{hint}</p>
          </div>

          {/* Browse button */}
          {!isBusy && (
            <div className="inline-flex min-h-10 items-center rounded-lg border border-teal-700 bg-white px-5 text-sm font-extrabold text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
              Browse Files
            </div>
          )}
        </label>

        {/* Status */}
        {status && (
          <p
            className={`mt-4 text-center text-sm font-bold ${
              statusType === "error"
                ? "text-red-700"
                : statusType === "success"
                  ? "text-teal-700"
                  : "text-slate-500"
            }`}
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
