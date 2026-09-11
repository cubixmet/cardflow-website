import { useCallback, useEffect, useMemo, useRef } from "react";
import { UserRound } from "lucide-react";

import { drawCroppedPhoto, type TransformOptions } from "@/lib/image";
import { DEFAULT_CURVE, NEUTRAL_ADJUSTMENTS } from "@/lib/photo-adjustments";
import {
  frameBorderRadiusPx,
  framePreviewBoxStyle,
  imageShapeSvgPoints,
  type PhotoFrame,
} from "@/lib/photo-frame";
import { cn } from "@/lib/utils";

const GUIDE_DASH = "7 5";

type LiveCropOptions = Pick<
  TransformOptions,
  | "rotation"
  | "flipH"
  | "zoom"
  | "offsetX"
  | "offsetY"
  | "brightness"
  | "contrast"
  | "sharpness"
  | "colorBalanceR"
  | "colorBalanceG"
  | "colorBalanceB"
  | "colorBalanceK"
  | "curve"
>;

function FrameShapeGuide({
  frame,
  width,
  height,
}: {
  frame: PhotoFrame;
  width: number;
  height: number;
}) {
  const shape = frame.imageShape ?? "rectangle";
  const points = imageShapeSvgPoints(shape, width, height, frame.sides);
  const borderRadius = frameBorderRadiusPx(frame, width);
  const stroke = {
    fill: "none" as const,
    stroke: "rgba(255,255,255,0.95)",
    strokeWidth: 2.5,
    strokeDasharray: GUIDE_DASH,
  };

  return (
    <svg
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 z-[3]"
      aria-hidden
    >
      {points ? (
        <polygon points={points} {...stroke} />
      ) : shape === "circle" ? (
        <circle
          cx={width / 2}
          cy={height / 2}
          r={Math.min(width, height) / 2 - 1.25}
          {...stroke}
        />
      ) : (
        <rect
          x={1.25}
          y={1.25}
          width={width - 2.5}
          height={height - 2.5}
          rx={borderRadius}
          ry={borderRadius}
          {...stroke}
        />
      )}
    </svg>
  );
}

type Props = {
  frame: PhotoFrame;
  previewWidth: number;
  previewHeight: number;
  borderRadius: string;
  cameraActive: boolean;
  source: string | null;
  canvasReady: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  zoom: number;
  offsetX: number;
  offsetY: number;
  /** Live camera paint uses the same crop/adjust options as capture/save. */
  cropOptions?: LiveCropOptions;
  onZoomChange: (zoom: number) => void;
  onOffsetChange: (x: number, y: number) => void;
};

export function PhotoPreviewFrame({
  frame,
  previewWidth,
  previewHeight,
  borderRadius,
  cameraActive,
  source,
  canvasReady,
  videoRef,
  previewCanvasRef,
  zoom,
  offsetX,
  offsetY,
  cropOptions,
  onZoomChange,
  onOffsetChange,
}: Props) {
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomRef = useRef(zoom);
  const offsetXRef = useRef(offsetX);
  const offsetYRef = useRef(offsetY);
  const cropOptionsRef = useRef<LiveCropOptions | undefined>(cropOptions);
  zoomRef.current = zoom;
  offsetXRef.current = offsetX;
  offsetYRef.current = offsetY;
  cropOptionsRef.current = cropOptions;

  const boxStyle = useMemo(
    () => framePreviewBoxStyle(frame, Math.max(previewWidth, previewHeight)),
    [frame, previewWidth, previewHeight],
  );

  const interactive = cameraActive || Boolean(source);
  const canPan = interactive && zoom > 1.01;

  // Live camera preview painted with the same crop math as capture/save.
  useEffect(() => {
    if (!cameraActive) return;
    let raf = 0;
    let cancelled = false;

    const paint = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = liveCanvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        const dpr = window.devicePixelRatio || 1;
        const displayW = previewWidth;
        const displayH = previewHeight;
        if (canvas.width !== Math.round(displayW * dpr) || canvas.height !== Math.round(displayH * dpr)) {
          canvas.width = Math.max(1, Math.round(displayW * dpr));
          canvas.height = Math.max(1, Math.round(displayH * dpr));
          canvas.style.width = `${displayW}px`;
          canvas.style.height = `${displayH}px`;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const opts = cropOptionsRef.current;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(canvas.width / displayW, canvas.height / displayH);
          drawCroppedPhoto(
            ctx,
            video,
            {
              rotation: opts?.rotation ?? 0,
              flipH: Boolean(opts?.flipH),
              zoom: zoomRef.current,
              offsetX: offsetXRef.current,
              offsetY: offsetYRef.current,
              brightness: opts?.brightness ?? NEUTRAL_ADJUSTMENTS.brightness,
              contrast: opts?.contrast ?? NEUTRAL_ADJUSTMENTS.contrast,
              sharpness: opts?.sharpness ?? NEUTRAL_ADJUSTMENTS.sharpness,
              colorBalanceR: opts?.colorBalanceR ?? NEUTRAL_ADJUSTMENTS.colorBalanceR,
              colorBalanceG: opts?.colorBalanceG ?? NEUTRAL_ADJUSTMENTS.colorBalanceG,
              colorBalanceB: opts?.colorBalanceB ?? NEUTRAL_ADJUSTMENTS.colorBalanceB,
              colorBalanceK: opts?.colorBalanceK ?? NEUTRAL_ADJUSTMENTS.colorBalanceK,
              curve: opts?.curve ?? DEFAULT_CURVE,
            },
            displayW,
            displayH,
          );
        }
      }
      raf = window.requestAnimationFrame(paint);
    };

    raf = window.requestAnimationFrame(paint);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [cameraActive, previewWidth, previewHeight, videoRef]);

  const clampOffset = useCallback((x: number, y: number) => {
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (!canPan && !cameraActive) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offsetX,
      oy: offsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    if (zoom <= 1.01) return;
    const dx = (event.clientX - dragRef.current.x) / previewWidth;
    const dy = (event.clientY - dragRef.current.y) / previewHeight;
    const next = clampOffset(dragRef.current.ox + dx * 2, dragRef.current.oy - dy * 2);
    onOffsetChange(next.x, next.y);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!interactive) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    const next = Math.max(1, Math.min(2.5, zoom + delta));
    onZoomChange(next);
    if (next <= 1.01) onOffsetChange(0, 0);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { distance, zoom };
    }
  };

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const scale = distance / pinchRef.current.distance;
    const next = Math.max(1, Math.min(2.5, pinchRef.current.zoom * scale));
    onZoomChange(next);
    if (next <= 1.01) onOffsetChange(0, 0);
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  return (
    <div
      className={cn(
        "relative touch-none",
        interactive && (canPan ? "cursor-grab active:cursor-grabbing" : "cursor-default"),
      )}
      style={{ width: previewWidth, height: previewHeight }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="absolute inset-0 grid place-items-center overflow-hidden bg-secondary ring-1 ring-border/60"
        style={{
          borderRadius: boxStyle.borderRadius || borderRadius,
          clipPath: boxStyle.clipPath,
          WebkitClipPath: boxStyle.WebkitClipPath,
        }}
      >
        {/* Hidden video keeps the MediaStream decoding; canvas is the true WYSIWYG preview. */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="pointer-events-none absolute h-px w-px opacity-0"
          aria-hidden
        />
        {cameraActive ? (
          <canvas
            ref={liveCanvasRef}
            className="relative z-[1] block size-full"
            style={{
              borderRadius: boxStyle.borderRadius || borderRadius,
              clipPath: boxStyle.clipPath,
              WebkitClipPath: boxStyle.WebkitClipPath,
            }}
            aria-label="Camera preview"
          />
        ) : source ? (
          <>
            <img
              src={source}
              alt=""
              className={cn(
                "absolute inset-0 size-full object-cover transition-opacity",
                canvasReady ? "opacity-0" : "opacity-100",
              )}
              style={{
                borderRadius: boxStyle.borderRadius || borderRadius,
                clipPath: boxStyle.clipPath,
                WebkitClipPath: boxStyle.WebkitClipPath,
              }}
            />
            <canvas
              ref={previewCanvasRef}
              className="relative z-[1] block size-full"
              style={{
                borderRadius: boxStyle.borderRadius || borderRadius,
                clipPath: boxStyle.clipPath,
                WebkitClipPath: boxStyle.WebkitClipPath,
              }}
              aria-label="Photo crop preview"
            />
          </>
        ) : (
          <div
            className="grid size-full place-items-center bg-secondary text-muted-foreground"
            style={{
              borderRadius: boxStyle.borderRadius || borderRadius,
              clipPath: boxStyle.clipPath,
              WebkitClipPath: boxStyle.WebkitClipPath,
            }}
          >
            <UserRound className="size-16 opacity-45" strokeWidth={1.25} />
          </div>
        )}
      </div>
      <FrameShapeGuide frame={frame} width={previewWidth} height={previewHeight} />
    </div>
  );
}
