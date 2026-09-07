import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { formatSliderValue } from "@/lib/photo-adjustments";

function stepValue(
  value: number,
  delta: number,
  min: number,
  max: number,
  step: number,
) {
  const next = Math.round((value + delta) / step) * step;
  return Math.max(min, Math.min(max, Number(next.toFixed(6))));
}

export function PhotoSliderControl({
  label,
  icon,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: {
  label: string;
  icon?: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const display = formatValue ? formatValue(value) : formatSliderValue(value);
  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </p>
        <span className="tabular-nums text-xs font-semibold text-foreground">{display}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(stepValue(value, -step, min, max, step))}
        >
          <Minus />
        </Button>
        <Slider
          className="min-h-10 flex-1"
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([next]) => onChange(next)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(stepValue(value, step, min, max, step))}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
