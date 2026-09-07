/** Canvas helpers for photo capture: crop, rotate, zoom, adjust and compression. */

import type { PhotoAdjustmentState } from "@/lib/photo-adjustments";
import {
  applyAdjustmentsToImageData,
  applySharpenToImageData,
  DEFAULT_CURVE,
  NEUTRAL_ADJUSTMENTS,
} from "@/lib/photo-adjustments";

export interface TransformOptions {
  rotation: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  flipH?: boolean;
  width?: number;
  aspect?: number;
  brightness?: number;
  contrast?: number;
  sharpness?: number;
  colorBalanceR?: number;
  colorBalanceG?: number;
  colorBalanceB?: number;
  colorBalanceK?: number;
  curve?: PhotoAdjustmentState["curve"];
  quality?: number;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read this image"));
    image.src = src;
  });
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return loadImageElement(src);
  }
  try {
    const response = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error("fetch failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await loadImageElement(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return loadImageElement(src);
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read this file"));
    reader.readAsDataURL(file);
  });
}

function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  if (amount <= 0.01) return;
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    applySharpenToImageData(imageData.data, width, height, amount);
    ctx.putImageData(imageData, 0, 0);
  } catch {
    /* tainted canvas */
  }
}

function applyPixelAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: Pick<
    TransformOptions,
    | "brightness"
    | "contrast"
    | "sharpness"
    | "colorBalanceR"
    | "colorBalanceG"
    | "colorBalanceB"
    | "colorBalanceK"
    | "curve"
  >,
) {
  const adjustments: PhotoAdjustmentState = {
    brightness: options.brightness ?? 1,
    contrast: options.contrast ?? 1,
    sharpness: options.sharpness ?? 0,
    colorBalanceR: options.colorBalanceR ?? 0,
    colorBalanceG: options.colorBalanceG ?? 0,
    colorBalanceB: options.colorBalanceB ?? 0,
    colorBalanceK: options.colorBalanceK ?? 0,
    curve: options.curve ?? NEUTRAL_ADJUSTMENTS.curve,
  };
  const needsAdjust =
    Math.abs(adjustments.brightness - 1) > 0.01 ||
    Math.abs(adjustments.contrast - 1) > 0.01 ||
    Math.abs(adjustments.colorBalanceR) > 0.01 ||
    Math.abs(adjustments.colorBalanceG) > 0.01 ||
    Math.abs(adjustments.colorBalanceB) > 0.01 ||
    Math.abs(adjustments.colorBalanceK) > 0.01 ||
    adjustments.curve.length !== DEFAULT_CURVE.length ||
    adjustments.curve.some((p, i) => {
      const d = DEFAULT_CURVE[i];
      return !d || Math.abs(p.x - d.x) > 0.001 || Math.abs(p.y - d.y) > 0.001;
    });
  if (needsAdjust) {
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      applyAdjustmentsToImageData(imageData.data, adjustments);
      ctx.putImageData(imageData, 0, 0);
    } catch {
      /* tainted canvas */
    }
  }
  applySharpen(ctx, width, height, adjustments.sharpness);
}

export function drawCroppedPhoto(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  options: Pick<
    TransformOptions,
    | "rotation"
    | "zoom"
    | "offsetX"
    | "offsetY"
    | "flipH"
    | "brightness"
    | "contrast"
    | "sharpness"
    | "colorBalanceR"
    | "colorBalanceG"
    | "colorBalanceB"
    | "colorBalanceK"
    | "curve"
  >,
  outW: number,
  outH: number,
) {
  const imgW =
    "naturalWidth" in image && (image as HTMLImageElement).naturalWidth
      ? (image as HTMLImageElement).naturalWidth
      : image.width;
  const imgH =
    "naturalHeight" in image && (image as HTMLImageElement).naturalHeight
      ? (image as HTMLImageElement).naturalHeight
      : image.height;

  const zoom = Math.max(options.zoom || 1, 1);
  const rotation = ((options.rotation % 360) + 360) % 360;
  const flipH = Boolean(options.flipH);
  const swapped = rotation === 90 || rotation === 270;
  const baseW = swapped ? imgH : imgW;
  const baseH = swapped ? imgW : imgH;

  const cover = Math.max(outW / baseW, outH / baseH) * zoom;
  const drawW = imgW * cover;
  const drawH = imgH * cover;

  const orientedW = swapped ? drawH : drawW;
  const orientedH = swapped ? drawW : drawH;
  const overflowX = Math.max(0, (orientedW - outW) / 2);
  const overflowY = Math.max(0, (orientedH - outH) / 2);

  const panX = (options.offsetX || 0) * overflowX;
  const panY = -(options.offsetY || 0) * overflowY;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.beginPath();
  ctx.rect(0, 0, outW, outH);
  ctx.clip();

  ctx.translate(outW / 2 + panX, outH / 2 + panY);
  if (flipH) ctx.scale(-1, 1);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  applyPixelAdjustments(ctx, outW, outH, options);
}

function outputSize(options: TransformOptions): { outW: number; outH: number } {
  const aspect = Math.max(options.aspect ?? 1, 0.2);
  const maxSide = options.width ?? 640;
  if (aspect >= 1) {
    return { outW: maxSide, outH: Math.max(1, Math.round(maxSide / aspect)) };
  }
  return { outW: Math.max(1, Math.round(maxSide * aspect)), outH: maxSide };
}

export async function transformImage(src: string, options: TransformOptions): Promise<string> {
  const image = await loadImage(src);
  const { outW, outH } = outputSize(options);
  const quality = options.quality ?? 0.72;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  drawCroppedPhoto(ctx, image, options, outW, outH);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function paintCropPreview(
  canvas: HTMLCanvasElement,
  src: string,
  options: TransformOptions,
  displayW: number,
  displayH: number,
): Promise<void> {
  const image = await loadImage(src);
  if (!canvas.isConnected) return;
  canvas.width = Math.max(1, Math.round(displayW * (window.devicePixelRatio || 1)));
  canvas.height = Math.max(1, Math.round(displayH * (window.devicePixelRatio || 1)));
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(canvas.width / displayW, canvas.height / displayH);
  drawCroppedPhoto(ctx, image, options, displayW, displayH);
}

/**
 * Crop a live video frame the same way CSS `object-cover` would inside a box
 * with the given aspect ratio (width / height). Matches the camera preview so
 * the captured still does not appear zoomed out after capture.
 */
export function captureVideoCoverFrame(
  video: HTMLVideoElement,
  frameAspect: number,
  quality = 0.92,
): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !Number.isFinite(frameAspect) || frameAspect <= 0) return null;

  const videoAspect = vw / vh;
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (videoAspect > frameAspect) {
    sw = Math.round(vh * frameAspect);
    sx = Math.round((vw - sw) / 2);
  } else if (videoAspect < frameAspect) {
    sh = Math.round(vw / frameAspect);
    sy = Math.round((vh - sh) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}

export function approximateSize(dataUrl: string): string {
  const bytes = Math.round((dataUrl.length * 3) / 4);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
