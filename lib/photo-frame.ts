/** Photo / dynamic-image slot geometry from a card design document (mm). */

export type PhotoImageShape =
  | "rectangle"
  | "circle"
  | "triangle"
  | "polygon"
  | "star";

export interface PhotoFrame {
  widthMm: number;
  heightMm: number;
  /** Corner radius in mm from the design; 0 = square corners. */
  radiusMm: number;
  /** width / height */
  aspect: number;
  /** Template mask shape (defaults to rectangle). */
  imageShape?: PhotoImageShape;
  /** Polygon side count when imageShape is polygon. */
  sides?: number;
}

/** Studio engine default for dynamic-image / photo when radius was never persisted. */
const DEFAULT_PHOTO_RADIUS_MM = 3;

const DEFAULT_FRAME: PhotoFrame = {
  widthMm: 22,
  heightMm: 22,
  radiusMm: DEFAULT_PHOTO_RADIUS_MM,
  aspect: 1,
  imageShape: "rectangle",
};

const SHAPE_SET = new Set<string>([
  "rectangle",
  "circle",
  "triangle",
  "polygon",
  "star",
]);

function isPhotoLayer(layer: Record<string, unknown>): boolean {
  const kind = String(layer.__fe_kind || "");
  const type = String(layer.type || "");
  if (kind === "dynamic-image" || kind === "photo") return true;
  if (type === "photo") return true;
  if (type === "image" && layer.binding) return true;
  return false;
}

function clampRadius(radiusMm: number, widthMm: number, heightMm: number) {
  return Math.max(0, Math.min(radiusMm, Math.min(widthMm, heightMm) / 2));
}

function parseImageShape(raw: unknown): PhotoImageShape {
  const value = String(raw || "rectangle")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (value === "hexagon" || value === "hex") return "polygon";
  if (value === "round" || value === "oval") return "circle";
  return SHAPE_SET.has(value) ? (value as PhotoImageShape) : "rectangle";
}

function frameFromLayer(layer: Record<string, unknown>): PhotoFrame {
  const frame = (layer.frame || {}) as Record<string, unknown>;
  const widthMm = Math.max(Number(frame.w_mm ?? frame.w) || DEFAULT_FRAME.widthMm, 1);
  const heightMm = Math.max(Number(frame.h_mm ?? frame.h) || DEFAULT_FRAME.heightMm, 1);
  const rawRadius =
    layer.corner_radius_mm != null
      ? Number(layer.corner_radius_mm)
      : layer.cornerRadiusMm != null
        ? Number(layer.cornerRadiusMm)
        : layer.radius != null
          ? Number(layer.radius)
          : DEFAULT_PHOTO_RADIUS_MM;
  const rawShape = layer.image_shape ?? layer.imageShape ?? layer.shape;
  let imageShape = parseImageShape(rawShape);
  const sidesRaw =
    layer.sides != null
      ? Number(layer.sides)
      : layer.polygon_sides != null
        ? Number(layer.polygon_sides)
        : undefined;
  if (imageShape === "rectangle" && Number.isFinite(sidesRaw) && (sidesRaw as number) >= 3) {
    imageShape = "polygon";
  }
  const sides =
    imageShape === "polygon"
      ? Number.isFinite(sidesRaw)
        ? sidesRaw
        : 6
      : Number.isFinite(sidesRaw)
        ? sidesRaw
        : undefined;
  return {
    widthMm,
    heightMm,
    radiusMm: imageShape === "rectangle" ? clampRadius(rawRadius, widthMm, heightMm) : 0,
    aspect: widthMm / heightMm,
    imageShape,
    sides,
  };
}

function layerFieldKey(layer: Record<string, unknown>): string | null {
  const binding = layer.binding;
  if (!binding || typeof binding !== "object") return null;
  const key = (binding as { field_key?: unknown }).field_key;
  if (key == null || key === "") return null;
  return String(key);
}

function iteratePhotoLayers(
  document: Record<string, unknown> | null | undefined,
  visit: (layer: Record<string, unknown>) => void,
) {
  if (!document) return;
  const sides = (document.sides || {}) as Record<string, { layers?: unknown[] }>;
  const order = ["front", "back", ...Object.keys(sides)];
  const seen = new Set<string>();
  for (const side of order) {
    if (seen.has(side)) continue;
    seen.add(side);
    for (const raw of sides[side]?.layers || []) {
      if (!raw || typeof raw !== "object") continue;
      const layer = raw as Record<string, unknown>;
      if (!isPhotoLayer(layer)) continue;
      visit(layer);
    }
  }
}

/**
 * Read the primary photo / dynamic-image frame from a design document.
 * Prefers a layer that has a non-rectangle mask (hexagon/circle/etc.).
 */
export function extractPhotoFrame(document: Record<string, unknown> | null | undefined): PhotoFrame {
  let first: PhotoFrame | null = null;
  let shaped: PhotoFrame | null = null;
  iteratePhotoLayers(document, (layer) => {
    const frame = frameFromLayer(layer);
    if (!first) first = frame;
    if (!shaped && frame.imageShape && frame.imageShape !== "rectangle") {
      shaped = frame;
    }
  });
  return { ...(shaped ?? first ?? DEFAULT_FRAME) };
}

/** Map template image field keys → frame geometry (aspect, radius, shape). */
export function extractImageFramesByFieldKey(
  document: Record<string, unknown> | null | undefined,
): Record<string, PhotoFrame> {
  const out: Record<string, PhotoFrame> = {};
  let primary: PhotoFrame | null = null;
  iteratePhotoLayers(document, (layer) => {
    const frame = frameFromLayer(layer);
    if (!primary) primary = frame;
    const key = layerFieldKey(layer);
    if (key && !out[key]) out[key] = frame;
  });
  if (primary) {
    out.__primary__ = primary;
    if (!out.photo) out.photo = primary;
  }
  return out;
}

export function resolveImageFrame(
  frames: Record<string, PhotoFrame> | null | undefined,
  fieldKey: string,
  role: "photo" | "image" = "image",
): PhotoFrame {
  if (frames?.[fieldKey]) return frames[fieldKey];
  if (role === "photo") {
    return frames?.photo || frames?.__photo__ || frames?.__primary__ || { ...DEFAULT_FRAME };
  }
  return frames?.[fieldKey] || frames?.__primary__ || { ...DEFAULT_FRAME };
}

export function photoFrameFromApi(
  raw: {
    width_mm?: number;
    height_mm?: number;
    radius_mm?: number;
    aspect?: number;
    image_shape?: string;
    sides?: number;
  } | null | undefined,
): PhotoFrame | null {
  if (!raw) return null;
  const widthMm = Math.max(Number(raw.width_mm) || 22, 1);
  const heightMm = Math.max(Number(raw.height_mm) || 22, 1);
  let imageShape = parseImageShape(raw.image_shape);
  const sidesRaw = raw.sides != null ? Number(raw.sides) : undefined;
  if (imageShape === "rectangle" && Number.isFinite(sidesRaw) && (sidesRaw as number) >= 3) {
    imageShape = "polygon";
  }
  const radiusMm = clampRadius(
    raw.radius_mm != null ? Number(raw.radius_mm) : DEFAULT_PHOTO_RADIUS_MM,
    widthMm,
    heightMm,
  );
  return {
    widthMm,
    heightMm,
    radiusMm: imageShape === "rectangle" ? radiusMm : 0,
    aspect: Number(raw.aspect) || widthMm / heightMm,
    imageShape,
    sides:
      imageShape === "polygon"
        ? Number.isFinite(sidesRaw)
          ? sidesRaw
          : 6
        : Number.isFinite(sidesRaw)
          ? sidesRaw
          : undefined,
  };
}

/**
 * Prefer live document mask shape (hexagon/circle/…) over API size payload.
 * Older APIs omitted `image_shape`, and `photo_frame` alone would force a rounded rectangle.
 */
export function resolvePhotoFrame(
  apiFrame:
    | {
        width_mm?: number;
        height_mm?: number;
        radius_mm?: number;
        aspect?: number;
        image_shape?: string;
        sides?: number;
      }
    | null
    | undefined,
  document: Record<string, unknown> | null | undefined,
): PhotoFrame {
  const fromApi = photoFrameFromApi(apiFrame);
  const fromDoc = document ? extractPhotoFrame(document) : null;

  if (fromApi && fromDoc) {
    const docShape = fromDoc.imageShape ?? "rectangle";
    const apiShape = fromApi.imageShape ?? "rectangle";
    const imageShape = docShape !== "rectangle" ? docShape : apiShape;
    const sides =
      imageShape === "polygon"
        ? (fromDoc.sides ?? fromApi.sides ?? 6)
        : (fromDoc.sides ?? fromApi.sides);
    return {
      widthMm: fromApi.widthMm,
      heightMm: fromApi.heightMm,
      aspect: fromApi.aspect || fromDoc.aspect,
      radiusMm: imageShape === "rectangle" ? fromApi.radiusMm : 0,
      imageShape,
      sides,
    };
  }

  if (fromDoc) {
    if (fromDoc.imageShape && fromDoc.imageShape !== "rectangle") {
      return { ...fromDoc, radiusMm: 0 };
    }
    return fromDoc;
  }

  if (fromApi) {
    if (fromApi.imageShape && fromApi.imageShape !== "rectangle") {
      return { ...fromApi, radiusMm: 0 };
    }
    return fromApi;
  }

  return { ...DEFAULT_FRAME };
}

/** Merge size from `base` with a non-rectangle mask discovered in a design document. */
export function ensurePhotoFrameShape(
  base: PhotoFrame | null | undefined,
  document?: Record<string, unknown> | null,
): PhotoFrame {
  const frame = base ? { ...base } : { ...DEFAULT_FRAME };
  const shape = frame.imageShape ?? "rectangle";
  if (shape !== "rectangle") {
    return {
      ...frame,
      radiusMm: 0,
      sides: shape === "polygon" ? frame.sides ?? 6 : frame.sides,
    };
  }
  if (!document) return frame;
  const fromDoc = extractPhotoFrame(document);
  if (fromDoc.imageShape && fromDoc.imageShape !== "rectangle") {
    return {
      ...frame,
      widthMm: frame.widthMm || fromDoc.widthMm,
      heightMm: frame.heightMm || fromDoc.heightMm,
      aspect: frame.aspect || fromDoc.aspect,
      imageShape: fromDoc.imageShape,
      sides: fromDoc.imageShape === "polygon" ? fromDoc.sides ?? 6 : fromDoc.sides,
      radiusMm: 0,
    };
  }
  return frame;
}

/** CSS border-radius for a preview box of the given pixel size. */
export function frameBorderRadiusCss(frame: PhotoFrame, previewWidthPx: number): string {
  if ((frame.imageShape ?? "rectangle") === "circle") return "50%";
  if (frame.imageShape && frame.imageShape !== "rectangle") return "0px";
  if (frame.radiusMm <= 0 || frame.widthMm <= 0) return "0px";
  const px = (frame.radiusMm / frame.widthMm) * previewWidthPx;
  return `${px.toFixed(2)}px`;
}

/** Numeric border-radius for SVG rect guides (pixels). */
export function frameBorderRadiusPx(frame: PhotoFrame, previewWidthPx: number): number {
  if ((frame.imageShape ?? "rectangle") === "circle") {
    return Math.max(previewWidthPx, 1) / 2;
  }
  if (frame.imageShape && frame.imageShape !== "rectangle") return 0;
  if (frame.radiusMm <= 0 || frame.widthMm <= 0) return 0;
  return (frame.radiusMm / frame.widthMm) * previewWidthPx;
}

function polygonClipPath(sides: number) {
  const count = Math.max(3, sides);
  const points = Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const x = 50 + 50 * Math.cos(angle);
    const y = 50 + 50 * Math.sin(angle);
    return `${x}% ${y}%`;
  });
  return `polygon(${points.join(", ")})`;
}

function starClipPath() {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * index) / 5 - Math.PI / 2;
    const radius = index % 2 === 0 ? 50 : 20;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return `${x}% ${y}%`;
  });
  return `polygon(${points.join(", ")})`;
}

function starPolygonPointsPx(width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  return Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * index) / 5 - Math.PI / 2;
    const radius = index % 2 === 0 ? 0.5 : 0.2;
    const x = cx + width * radius * Math.cos(angle);
    const y = cy + height * radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");
}

/** SVG polygon points for non-rectangular photo masks (pixel coordinates). */
export function imageShapeSvgPoints(
  shape: PhotoImageShape | undefined,
  width: number,
  height: number,
  sides?: number,
): string | null {
  switch (shape ?? "rectangle") {
    case "triangle":
      return `${width / 2},0 ${width},${height} 0,${height}`;
    case "polygon": {
      const count = Math.max(3, sides ?? 6);
      const cx = width / 2;
      const cy = height / 2;
      return Array.from({ length: count }, (_, index) => {
        const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
        const x = cx + (width / 2) * Math.cos(angle);
        const y = cy + (height / 2) * Math.sin(angle);
        return `${x},${y}`;
      }).join(" ");
    }
    case "star":
      return starPolygonPointsPx(width, height);
    default:
      return null;
  }
}

/** Pixel size for the uploader / thumbnail — longer side capped, aspect preserved. */
export function photoPreviewSize(
  frame: PhotoFrame,
  maxSide = 280,
): { width: number; height: number } {
  const aspect = Math.max(frame.aspect || 1, 0.2);
  if (aspect >= 1) {
    return { width: maxSide, height: Math.max(1, Math.round(maxSide / aspect)) };
  }
  return { width: Math.max(1, Math.round(maxSide * aspect)), height: maxSide };
}

/** Inline styles so list thumbnails match the card template frame. */
export function framePreviewBoxStyle(
  frame: PhotoFrame,
  maxSidePx = 152,
): {
  width: number;
  height: number;
  borderRadius: string;
  clipPath?: string;
  WebkitClipPath?: string;
  overflow: "hidden";
} {
  const { width, height } = photoPreviewSize(frame, maxSidePx);
  const shape = frame.imageShape ?? "rectangle";
  const radiusCss = frameBorderRadiusCss(frame, width);
  const base = {
    width,
    height,
    overflow: "hidden" as const,
    borderRadius: radiusCss,
  };
  if (shape === "circle") {
    const clip = "circle(50% at 50% 50%)";
    return { ...base, borderRadius: "50%", clipPath: clip, WebkitClipPath: clip };
  }
  if (shape === "triangle") {
    const clip = "polygon(50% 0%, 100% 100%, 0% 100%)";
    return { ...base, borderRadius: "0px", clipPath: clip, WebkitClipPath: clip };
  }
  if (shape === "polygon") {
    const clip = polygonClipPath(frame.sides ?? 6);
    return { ...base, borderRadius: "0px", clipPath: clip, WebkitClipPath: clip };
  }
  if (shape === "star") {
    const clip = starClipPath();
    return { ...base, borderRadius: "0px", clipPath: clip, WebkitClipPath: clip };
  }
  // Rounded rectangle: use inset round so clipping is reliable on <canvas>/<video>.
  if (radiusCss !== "0px") {
    const clip = `inset(0 round ${radiusCss})`;
    return { ...base, clipPath: clip, WebkitClipPath: clip };
  }
  return base;
}
