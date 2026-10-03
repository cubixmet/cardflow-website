import { cn } from "@/lib/utils";

export type PhotoEditorPanel = "zoom" | "crop" | "basic" | "color" | "advanced";

const TABS: { id: PhotoEditorPanel; label: string }[] = [
  { id: "zoom", label: "Zoom" },
  { id: "crop", label: "Crop" },
  { id: "basic", label: "Basic" },
  { id: "color", label: "Color Balance" },
  { id: "advanced", label: "Advanced" },
];

export function PhotoEditorTabs({
  value,
  onChange,
}: {
  value: PhotoEditorPanel;
  onChange: (panel: PhotoEditorPanel) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Photo enhancement sections"
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
