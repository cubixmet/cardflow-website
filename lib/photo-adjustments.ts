/** Shared photo adjustment defaults and pixel/LUT helpers (dashboard parity). */

export type CurvePoint = { x: number; y: number };

export const DEFAULT_CURVE: CurvePoint[] = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0.5 },
  { x: 1, y: 1 },
];

export type PhotoAdjustmentState = {
  brightness: number;
  contrast: number;
  sharpness: number;
  colorBalanceR: number;
  colorBalanceG: number;
  colorBalanceB: number;
  /** Black (K) plate −1 … +1; darkens/lightens all channels equally */
  colorBalanceK: number;
  curve: CurvePoint[];
};

export const NEUTRAL_ADJUSTMENTS: PhotoAdjustmentState = {
  brightness: 1,
  contrast: 1,
  sharpness: 0,
  colorBalanceR: 0,
  colorBalanceG: 0,
  colorBalanceB: 0,
  colorBalanceK: 0,
  curve: DEFAULT_CURVE,
};

export function formatSliderValue(value: number, decimals = 2): string {
  return Number(value.toFixed(decimals)).toString();
}

export function formatPercentNeutral(value: number, neutral: number): string {
  const delta = Math.round((value - neutral) * 100);
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function buildCurveLut(points: CurvePoint[]): Uint8Array {
  const sorted = [...points]
    .map((p) => ({ x: clamp01(p.x), y: clamp01(p.y) }))
    .sort((a, b) => a.x - b.x);
  if (sorted.length < 2) {
    sorted.unshift({ x: 0, y: 0 });
    sorted.push({ x: 1, y: 1 });
  }
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    let j = 0;
    while (j < sorted.length - 2 && t > sorted[j + 1].x) j += 1;
    const p0 = sorted[Math.max(0, j - 1)];
    const p1 = sorted[j];
    const p2 = sorted[Math.min(sorted.length - 1, j + 1)];
    const p3 = sorted[Math.min(sorted.length - 1, j + 2)];
    const span = Math.max(p2.x - p1.x, 1e-6);
    const u = (t - p1.x) / span;
    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u * u +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u * u * u);
    lut[i] = Math.max(0, Math.min(255, Math.round(clamp01(y) * 255)));
  }
  return lut;
}

export function applyAdjustmentsToImageData(data: Uint8ClampedArray, adjustments: PhotoAdjustmentState) {
  const { brightness, contrast, colorBalanceR, colorBalanceG, colorBalanceB, colorBalanceK, curve } =
    adjustments;
  const lut = buildCurveLut(curve);
  const channelScale = 42;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * brightness;
    g = g * brightness;
    b = b * brightness;

    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    r += colorBalanceR * channelScale;
    g += colorBalanceG * channelScale;
    b += colorBalanceB * channelScale;

    r -= colorBalanceK * channelScale;
    g -= colorBalanceK * channelScale;
    b -= colorBalanceK * channelScale;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const mapped = lut[Math.max(0, Math.min(255, Math.round(lum)))];
    const scale = lum > 0.5 ? mapped / lum : mapped / Math.max(lum, 1);
    r *= scale;
    g *= scale;
    b *= scale;

    data[i] = Math.max(0, Math.min(255, Math.round(r)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }
}

export function applySharpenToImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
) {
  if (amount <= 0.01) return;
  const src = new Uint8ClampedArray(data);
  const a = amount * 0.65;
  const center = 1 + 4 * a;
  const w4 = width * 4;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        const v =
          src[i + c] * center -
          src[i - 4 + c] * a -
          src[i + 4 + c] * a -
          src[i - w4 + c] * a -
          src[i + w4 + c] * a;
        data[i + c] = Math.max(0, Math.min(255, v));
      }
    }
  }
}
