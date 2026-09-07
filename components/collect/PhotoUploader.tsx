"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  FlipHorizontal,
  Image as ImageIcon,
  RotateCw,
  Sparkles,
  SunMedium,
  SwitchCamera,
  Trash2,
  Undo2,
  X,
  ZoomIn,
} from "lucide-react";

import { PhotoCurveEditor } from "@/components/collect/photo-editor/photo-curve-editor";
import { PhotoEditorSection } from "@/components/collect/photo-editor/photo-editor-section";
import {
  PhotoEditorTabs,
  type PhotoEditorPanel,
} from "@/components/collect/photo-editor/photo-editor-tabs";
import { PhotoPreviewFrame } from "@/components/collect/photo-editor/photo-preview-frame";
import { PhotoSliderControl } from "@/components/collect/photo-editor/photo-slider-control";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { validateFileSize } from "@/lib/file-upload";
import {
  openCameraStream,
  stopCameraStream,
  type CameraFacing,
} from "@/lib/camera-stream";
import { approximateSize, captureVideoCoverFrame, paintCropPreview, readFileAsDataUrl, transformImage } from "@/lib/image";
import {
  DEFAULT_CURVE,
  formatPercentNeutral,
  NEUTRAL_ADJUSTMENTS,
  type CurvePoint,
} from "@/lib/photo-adjustments";
import {
  extractPhotoFrame,
  frameBorderRadiusCss,
  photoPreviewSize,
  type PhotoFrame,
} from "@/lib/photo-frame";

interface PhotoUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhoto: string | null;
  personName: string;
  fieldLabel?: string;
  onSave: (dataUrl: string) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  frame?: PhotoFrame | null;
  designDocument?: Record<string, unknown> | null;
}

export function PhotoUploader({
  open,
  onOpenChange,
  currentPhoto,
  personName,
  fieldLabel = "Photo",
  onSave,
  onRemove,
  frame: frameProp,
  designDocument,
}: PhotoUploaderProps) {
  const { showToast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [brightness, setBrightness] = useState(NEUTRAL_ADJUSTMENTS.brightness);
  const [contrast, setContrast] = useState(NEUTRAL_ADJUSTMENTS.contrast);
  const [sharpness, setSharpness] = useState(NEUTRAL_ADJUSTMENTS.sharpness);
  const [colorBalanceR, setColorBalanceR] = useState(NEUTRAL_ADJUSTMENTS.colorBalanceR);
  const [colorBalanceG, setColorBalanceG] = useState(NEUTRAL_ADJUSTMENTS.colorBalanceG);
  const [colorBalanceB, setColorBalanceB] = useState(NEUTRAL_ADJUSTMENTS.colorBalanceB);
  const [colorBalanceK, setColorBalanceK] = useState(NEUTRAL_ADJUSTMENTS.colorBalanceK);
  const [colorMode, setColorMode] = useState<"rgb" | "cmyk">("rgb");
  const [curve, setCurve] = useState<CurvePoint[]>(() => DEFAULT_CURVE.map((p) => ({ ...p })));
  const [busy, setBusy] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [activePanel, setActivePanel] = useState<PhotoEditorPanel>("zoom");

  const frame = useMemo(
    () => frameProp ?? extractPhotoFrame(designDocument),
    [frameProp, designDocument],
  );

  const { width: previewWidth, height: previewHeight } = useMemo(
    () => photoPreviewSize(frame, 220),
    [frame],
  );
  const borderRadius = frameBorderRadiusCss(frame, previewWidth);

  const cropOptions = useMemo(
    () => ({
      rotation,
      flipH,
      zoom,
      offsetX,
      offsetY,
      brightness,
      contrast,
      sharpness,
      colorBalanceR,
      colorBalanceG,
      colorBalanceB,
      colorBalanceK,
      curve,
      aspect: frame.aspect,
    }),
    [
      rotation,
      flipH,
      zoom,
      offsetX,
      offsetY,
      brightness,
      contrast,
      sharpness,
      colorBalanceR,
      colorBalanceG,
      colorBalanceB,
      colorBalanceK,
      curve,
      frame.aspect,
    ],
  );

  const stopCamera = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const resetView = () => {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const resetAdjustments = () => {
    setBrightness(NEUTRAL_ADJUSTMENTS.brightness);
    setContrast(NEUTRAL_ADJUSTMENTS.contrast);
    setSharpness(NEUTRAL_ADJUSTMENTS.sharpness);
  };

  const resetColorBalance = () => {
    setColorBalanceR(NEUTRAL_ADJUSTMENTS.colorBalanceR);
    setColorBalanceG(NEUTRAL_ADJUSTMENTS.colorBalanceG);
    setColorBalanceB(NEUTRAL_ADJUSTMENTS.colorBalanceB);
    setColorBalanceK(NEUTRAL_ADJUSTMENTS.colorBalanceK);
  };

  const resetCurve = () => setCurve(DEFAULT_CURVE.map((p) => ({ ...p })));

  const reset = () => {
    setSource(null);
    setRotation(0);
    setFlipH(false);
    resetView();
    resetAdjustments();
    resetColorBalance();
    resetCurve();
    setColorMode("rgb");
    setActivePanel("zoom");
    setCameraFacing("environment");
    stopCamera();
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!open) return;
    if (cameraActive || !currentPhoto) return;
    setSource((prev) => prev ?? currentPhoto);
  }, [open, currentPhoto, cameraActive]);

  useEffect(() => {
    if (!open || !source || cameraActive) {
      setCanvasReady(false);
      return;
    }
    let cancelled = false;
    setCanvasReady(false);
    const paint = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas || cancelled) return false;
      void paintCropPreview(canvas, source, cropOptions, previewWidth, previewHeight)
        .then(() => {
          if (!cancelled) setCanvasReady(true);
        })
        .catch(() => {
          if (!cancelled) setCanvasReady(false);
        });
      return true;
    };
    if (paint()) return () => { cancelled = true; };
    const id = window.requestAnimationFrame(() => paint());
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [open, source, cameraActive, cropOptions, previewWidth, previewHeight]);

  useEffect(() => {
    if (!cameraActive) return;
    let cancelled = false;
    void (async () => {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
      try {
        const { stream, facing } = await openCameraStream({ facing: cameraFacing });
        if (cancelled) {
          stopCameraStream(stream);
          return;
        }
        streamRef.current = stream;
        setCameraFacing(facing);
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play();
          }
        });
      } catch {
        if (!cancelled) {
          setCameraActive(false);
          showToast("Could not access camera. Check browser permissions.", "error");
        }
      }
    })();
    return () => {
      cancelled = true;
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    };
  }, [cameraActive, cameraFacing, showToast]);

  const openCamera = () => {
    setCameraFacing("environment");
    setCameraActive(true);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const dataUrl = captureVideoCoverFrame(video, frame.aspect, 0.92);
    if (!dataUrl) {
      showToast("Could not capture photo. Camera is still starting — try again.", "error");
      return;
    }
    setSource(dataUrl);
    setFlipH(false);
    setRotation(0);
    resetView();
    resetAdjustments();
    resetCurve();
    stopCamera();
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose a photo file", "error");
      return;
    }
    const check = validateFileSize(file);
    if (!check.ok) {
      showToast(check.message, "error");
      return;
    }
    setSource(await readFileAsDataUrl(file));
    setFlipH(false);
    setRotation(0);
    resetView();
    resetAdjustments();
    resetCurve();
  };

  const save = async () => {
    if (!source) return;
    setBusy(true);
    try {
      const output = await transformImage(source, {
        ...cropOptions,
        width: 640,
        quality: 0.85,
      });
      await onSave(output);
      showToast(`Photo saved (${approximateSize(output)})`, "success");
      reset();
      onOpenChange(false);
    } catch {
      showToast("Could not process that photo", "error");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close photo editor"
            className="fixed inset-0 z-[200] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-uploader-title"
            className="fixed inset-x-0 bottom-0 z-[201] mx-auto flex h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-[min(100vw-2rem,32rem)] sm:-translate-x-1/2"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 px-4 pt-5 pb-3">
              <div>
                <h2 id="photo-uploader-title" className="text-lg font-bold">
                  {fieldLabel}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{personName}</p>
                {frame.widthMm > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Frame {frame.widthMm.toFixed(1)}×{frame.heightMm.toFixed(1)} mm
                    {frame.radiusMm > 0 ? ` · radius ${frame.radiusMm.toFixed(1)} mm` : ""}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-border/60 px-4 py-3">
                <div className="mx-auto grid max-w-full place-items-center">
                  <PhotoPreviewFrame
                    previewWidth={previewWidth}
                    previewHeight={previewHeight}
                    borderRadius={borderRadius}
                    cameraActive={cameraActive}
                    source={source}
                    canvasReady={canvasReady}
                    videoRef={videoRef}
                    previewCanvasRef={previewCanvasRef}
                    zoom={zoom}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    onZoomChange={setZoom}
                    onOffsetChange={(x, y) => {
                      setOffsetX(x);
                      setOffsetY(y);
                    }}
                  />
                  {source ? (
                    <p className="mt-2 max-w-sm text-center text-xs text-muted-foreground">
                      Pinch or scroll to zoom. Drag inside the frame to crop/reposition.
                    </p>
                  ) : (
                    !cameraActive && (
                      <p className="mt-2 max-w-sm text-center text-xs text-muted-foreground">
                        {currentPhoto
                          ? "Choose Camera or Gallery to replace the current photo."
                          : "Choose Camera or Gallery to add a photo."}
                      </p>
                    )
                  )}
                </div>
              </div>

              {source && !cameraActive ? (
                <div className="shrink-0 border-b border-border/60 px-4 py-3">
                  <PhotoEditorTabs value={activePanel} onChange={setActivePanel} />
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                {cameraActive ? (
                  <div className="flex gap-2">
                    <Button type="button" size="lg" className="flex-1" onClick={captureFrame}>
                      <Camera className="size-4" /> Capture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="shrink-0 px-3"
                      aria-label="Switch camera"
                      title={cameraFacing === "environment" ? "Use front camera" : "Use back camera"}
                      onClick={() =>
                        setCameraFacing((value) => (value === "environment" ? "user" : "environment"))
                      }
                    >
                      <SwitchCamera className="size-5" />
                    </Button>
                  </div>
                ) : null}

                {!cameraActive ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" onClick={openCamera}>
                      <Camera className="size-4" /> Camera
                    </Button>
                    <Button type="button" variant="outline" onClick={() => galleryRef.current?.click()}>
                      <ImageIcon className="size-4" /> Gallery
                    </Button>
                  </div>
                ) : null}

                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => void pick(event.target.files?.[0])}
                />

                {source ? (
                  <div className="mt-4 space-y-4">
                    {activePanel === "zoom" ? (
                      <PhotoEditorSection
                        title="Zoom"
                        action={
                          <Button type="button" variant="ghost" size="sm" onClick={() => setZoom(1)}>
                            <Undo2 className="size-3.5" /> Reset
                          </Button>
                        }
                      >
                        <PhotoSliderControl
                          label="Zoom"
                          icon={<ZoomIn className="size-4" />}
                          value={zoom}
                          min={1}
                          max={2.5}
                          step={0.05}
                          formatValue={(v) => `${Math.round((v - 1) * 100)}%`}
                          onChange={setZoom}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRotation((value) => (value + 90) % 360)}
                          >
                            <RotateCw className="size-4" /> Rotate
                          </Button>
                          <Button
                            type="button"
                            variant={flipH ? "primary" : "outline"}
                            onClick={() => setFlipH((value) => !value)}
                          >
                            <FlipHorizontal className="size-4" /> {flipH ? "Flipped" : "Flip"}
                          </Button>
                        </div>
                      </PhotoEditorSection>
                    ) : null}

                    {activePanel === "crop" ? (
                      <PhotoEditorSection
                        title="Crop"
                        action={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOffsetX(0);
                              setOffsetY(0);
                            }}
                          >
                            <Undo2 className="size-3.5" /> Reset
                          </Button>
                        }
                      >
                        <PhotoSliderControl
                          label="Horizontal"
                          value={offsetX}
                          min={-1}
                          max={1}
                          step={0.02}
                          formatValue={(v) => formatPercentNeutral(v, 0)}
                          onChange={setOffsetX}
                        />
                        <PhotoSliderControl
                          label="Vertical"
                          value={offsetY}
                          min={-1}
                          max={1}
                          step={0.02}
                          formatValue={(v) => formatPercentNeutral(v, 0)}
                          onChange={setOffsetY}
                        />
                      </PhotoEditorSection>
                    ) : null}

                    {activePanel === "basic" ? (
                      <PhotoEditorSection
                        title="Basic Adjustments"
                        action={
                          <Button type="button" variant="ghost" size="sm" onClick={resetAdjustments}>
                            <Undo2 className="size-3.5" /> Reset
                          </Button>
                        }
                      >
                        <PhotoSliderControl
                          label="Sharpness"
                          icon={<Sparkles className="size-4" />}
                          value={sharpness}
                          min={0}
                          max={1}
                          step={0.05}
                          formatValue={(v) => `${Math.round(v * 100)}%`}
                          onChange={setSharpness}
                        />
                        <PhotoSliderControl
                          label="Brightness"
                          icon={<SunMedium className="size-4" />}
                          value={brightness}
                          min={0.5}
                          max={1.5}
                          step={0.02}
                          formatValue={(v) => formatPercentNeutral(v, 1)}
                          onChange={setBrightness}
                        />
                        <PhotoSliderControl
                          label="Contrast"
                          value={contrast}
                          min={0.5}
                          max={1.5}
                          step={0.02}
                          formatValue={(v) => formatPercentNeutral(v, 1)}
                          onChange={setContrast}
                        />
                      </PhotoEditorSection>
                    ) : null}

                    {activePanel === "color" ? (
                      <PhotoEditorSection
                        title="Color Balance"
                        action={
                          <Button type="button" variant="ghost" size="sm" onClick={resetColorBalance}>
                            <Undo2 className="size-3.5" /> Reset
                          </Button>
                        }
                      >
                        <div className="flex gap-2" role="tablist" aria-label="Color balance mode">
                          {(
                            [
                              { id: "rgb" as const, label: "RGB" },
                              { id: "cmyk" as const, label: "CMYK" },
                            ] as const
                          ).map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              role="tab"
                              aria-selected={colorMode === mode.id}
                              onClick={() => setColorMode(mode.id)}
                              className={
                                colorMode === mode.id
                                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                                  : "rounded-full bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                              }
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                        {colorMode === "rgb" ? (
                          <>
                            <PhotoSliderControl
                              label="Red"
                              icon={<span className="size-2.5 rounded-full bg-red-500" />}
                              value={colorBalanceR}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={setColorBalanceR}
                            />
                            <PhotoSliderControl
                              label="Green"
                              icon={<span className="size-2.5 rounded-full bg-green-500" />}
                              value={colorBalanceG}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={setColorBalanceG}
                            />
                            <PhotoSliderControl
                              label="Blue"
                              icon={<span className="size-2.5 rounded-full bg-blue-500" />}
                              value={colorBalanceB}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={setColorBalanceB}
                            />
                          </>
                        ) : (
                          <>
                            <PhotoSliderControl
                              label="Cyan"
                              icon={<span className="size-2.5 rounded-full bg-cyan-400" />}
                              value={-colorBalanceR}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={(v) => setColorBalanceR(-v)}
                            />
                            <PhotoSliderControl
                              label="Magenta"
                              icon={<span className="size-2.5 rounded-full bg-fuchsia-500" />}
                              value={-colorBalanceG}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={(v) => setColorBalanceG(-v)}
                            />
                            <PhotoSliderControl
                              label="Yellow"
                              icon={<span className="size-2.5 rounded-full bg-yellow-400" />}
                              value={-colorBalanceB}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={(v) => setColorBalanceB(-v)}
                            />
                            <PhotoSliderControl
                              label="Black"
                              icon={
                                <span className="size-2.5 rounded-full bg-neutral-900 ring-1 ring-neutral-400" />
                              }
                              value={colorBalanceK}
                              min={-1}
                              max={1}
                              step={0.02}
                              formatValue={(v) => formatPercentNeutral(v, 0)}
                              onChange={setColorBalanceK}
                            />
                          </>
                        )}
                      </PhotoEditorSection>
                    ) : null}

                    {activePanel === "advanced" ? (
                      <PhotoEditorSection
                        title="Advanced Adjustments"
                        action={
                          <Button type="button" variant="ghost" size="sm" onClick={resetCurve}>
                            <Undo2 className="size-3.5" /> Reset
                          </Button>
                        }
                      >
                        <PhotoCurveEditor points={curve} onChange={setCurve} />
                      </PhotoEditorSection>
                    ) : null}
                  </div>
                ) : null}

                {currentPhoto && onRemove && !source ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-4 w-full text-destructive"
                    onClick={() => void onRemove()}
                  >
                    <Trash2 className="size-4" /> Remove photo
                  </Button>
                ) : null}
              </div>

              {source ? (
                <div className="shrink-0 border-t border-border/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full"
                    disabled={!source || busy}
                    isLoading={busy}
                    onClick={() => void save()}
                  >
                    Save photo
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
