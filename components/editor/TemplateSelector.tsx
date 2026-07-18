import { templateOptions, type PlaceholderEntry, type TemplateKey } from "@/lib/template";

type TemplateSelectorProps = {
  selectedKey: TemplateKey | "";
  displayedPlaceholders: PlaceholderEntry[];
  selectedTemplateLabel: string;
  isBusy: boolean;
  onTemplateChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

export function TemplateSelector({
  selectedKey,
  displayedPlaceholders,
  selectedTemplateLabel,
  isBusy,
  onTemplateChange,
}: TemplateSelectorProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">Spanish Translation Templates</p>
          <h1 className="font-[var(--font-newsreader)] text-[clamp(2.1rem,4vw,4rem)] font-semibold leading-[0.95] text-slate-900">
            Manual Template Filler
          </h1>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">
          Frontend only
        </span>
      </div>

      <div className="mt-7 flex items-stretch gap-4 rounded-lg border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 max-md:flex-col max-md:items-start">
        <label className="grid min-w-[min(360px,100%)] gap-2 max-md:w-full" htmlFor="templateSelect">
          <span className="text-xs font-bold uppercase text-slate-500">Template</span>
          <select
            id="templateSelect"
            value={selectedKey}
            onChange={onTemplateChange}
            disabled={isBusy}
            autoComplete="off"
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none ring-teal-500 transition focus:ring-2 disabled:cursor-progress disabled:opacity-60"
          >
            <option value="">Choose template</option>
            {Object.entries(templateOptions).map(([key, template]) => (
              <option key={key} value={key}>
                {template.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex min-h-12 flex-1 items-center border-l-4 border-amber-600 bg-amber-50 px-4 text-sm text-slate-600 max-md:w-full max-md:border-l-0 max-md:border-t-4">
          {!selectedKey && "Select a template to load its placeholders."}
          {selectedKey && `${selectedTemplateLabel} - ${displayedPlaceholders.length} placeholders loaded.`}
        </div>
      </div>
    </>
  );
}
