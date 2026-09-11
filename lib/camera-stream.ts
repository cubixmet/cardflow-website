export type CameraFacing = "environment" | "user";

export type OpenCameraStreamOptions = {
  /** Prefer rear (`environment`) for ID photos; falls back to front when needed. */
  facing?: CameraFacing;
  width?: number;
  height?: number;
};

export function cameraErrorMessage(error: unknown): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Camera needs HTTPS (or localhost). Open this page over a secure link.";
  }
  if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
    return "This browser does not support camera access.";
  }
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission was blocked. Allow camera for this site in browser settings, then try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera was found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Camera is in use by another app. Close it and try again.";
  }
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "Could not match the requested camera. Try again or use Gallery instead.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not access camera. Check browser permissions.";
}

/** Open a camera stream, trying rear then front (or the reverse when requested). */
export async function openCameraStream(
  opts: OpenCameraStreamOptions = {},
): Promise<{ stream: MediaStream; facing: CameraFacing }> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error(cameraErrorMessage(null));
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(cameraErrorMessage(null));
  }

  const ideal = opts.facing ?? "environment";
  const attempts: CameraFacing[] =
    ideal === "environment" ? ["environment", "user"] : ["user", "environment"];
  const width = opts.width ?? 1280;
  const height = opts.height ?? 960;

  let lastError: unknown;
  for (const facing of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: width },
          height: { ideal: height },
        },
      });
      return { stream, facing };
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    return { stream, facing: ideal };
  } catch (error) {
    lastError = error;
  }

  throw new Error(cameraErrorMessage(lastError));
}

export function stopCameraStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}
