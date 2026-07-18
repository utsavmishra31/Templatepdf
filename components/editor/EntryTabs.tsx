import {
  getDropdownOptions,
  hasDropdownOptions,
  humanizePlaceholder,
  isAutomaticDatePlaceholder,
  type PlaceholderEntry,
  type TabType,
} from "@/lib/template";
import type { FormValues, StatusType } from "@/types/editor";

type EntryTabsProps = {
  displayedPlaceholders: PlaceholderEntry[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  bulkInput: string;
  onBulkInputChange: (value: string) => void;
  onApplyBulk: () => void;
  onClearBulk: () => void;
  bulkResult: string;
  bulkResultType: StatusType;
  formValues: FormValues;
  onFieldChange: (token: string, value: string) => void;
  isBusy: boolean;
};

export function EntryTabs({
  displayedPlaceholders,
  activeTab,
  onTabChange,
  bulkInput,
  onBulkInputChange,
  onApplyBulk,
  onClearBulk,
  bulkResult,
  bulkResultType,
  formValues,
  onFieldChange,
  isBusy,
}: EntryTabsProps) {
  if (!displayedPlaceholders.length) {
    return null;
  }

  return (
    <div className="mt-5" id="entryTabs">
      <div className="inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Entry mode">
        <button
          type="button"
          className={`min-h-[38px] rounded-md px-4 text-sm font-semibold transition ${
            activeTab === "bulk" ? "bg-teal-700 text-white" : "text-slate-500 hover:bg-white"
          }`}
          onClick={() => onTabChange("bulk")}
          role="tab"
          aria-selected={activeTab === "bulk"}
          disabled={isBusy}
        >
          Bulk Paste
        </button>
        <button
          type="button"
          className={`min-h-[38px] rounded-md px-4 text-sm font-semibold transition ${
            activeTab === "fields" ? "bg-teal-700 text-white" : "text-slate-500 hover:bg-white"
          }`}
          onClick={() => onTabChange("fields")}
          role="tab"
          aria-selected={activeTab === "fields"}
          disabled={isBusy}
        >
          Empty Fields
        </button>
      </div>

      {activeTab === "bulk" && (
        <section className="mt-4" id="bulkPanel" role="tabpanel">
          <label className="grid gap-2" htmlFor="bulkInput">
            <span className="text-xs font-bold uppercase text-slate-500">Paste placeholders and values</span>
            <textarea
              id="bulkInput"
              value={bulkInput}
              onChange={(event) => onBulkInputChange(event.target.value)}
              disabled={isBusy}
              className="min-h-[260px] w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none ring-teal-500 transition focus:ring-2 disabled:cursor-progress disabled:opacity-60"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800"
              onClick={onApplyBulk}
              disabled={isBusy}
            >
              Autofill Fields
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
              onClick={onClearBulk}
              disabled={isBusy}
            >
              Clear Box
            </button>
          </div>
          <p
            className={`mt-3 min-h-[22px] font-bold ${
              bulkResultType === "error" ? "text-red-700" : bulkResultType === "success" ? "text-teal-800" : "text-slate-500"
            }`}
          >
            {bulkResult}
          </p>
        </section>
      )}

      {activeTab === "fields" && (
        <section className="mt-4" id="fieldsPanel" role="tabpanel">
          <form className="mt-4 grid grid-cols-2 gap-3 max-md:grid-cols-1" id="fieldForm" onSubmit={(event) => event.preventDefault()}>
            {displayedPlaceholders.map(({ token }) => (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" key={token}>
                <label className="grid gap-2 p-3">
                  <span className="text-xs font-bold uppercase text-slate-500">{humanizePlaceholder(token)}</span>
                  <span className="inline-flex max-w-full w-fit rounded-full bg-teal-100 px-2 py-1 text-xs font-bold text-teal-800">{token}</span>
                  {hasDropdownOptions(token) && (
                    <select
                      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none ring-teal-500 transition focus:ring-2 disabled:cursor-progress disabled:opacity-60"
                      value={getDropdownOptions(token).includes(formValues[token] ?? "") ? formValues[token] ?? "" : ""}
                      onChange={(event) => onFieldChange(token, event.target.value)}
                      disabled={isBusy}
                    >
                      <option value="">Blank / type manually below</option>
                      {getDropdownOptions(token).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  )}
                  <textarea
                    data-placeholder={token}
                    value={formValues[token] ?? ""}
                    onChange={(event) => onFieldChange(token, event.target.value)}
                    placeholder={hasDropdownOptions(token) ? "Type custom value or choose from dropdown" : ""}
                    readOnly={isAutomaticDatePlaceholder(token)}
                    title={isAutomaticDatePlaceholder(token) ? "Filled automatically with today's date" : ""}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isBusy}
                    className="min-h-[74px] w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 text-slate-900 outline-none ring-teal-500 transition focus:ring-2 disabled:cursor-progress disabled:opacity-60"
                  />
                </label>
              </div>
            ))}
          </form>
        </section>
      )}
    </div>
  );
}
