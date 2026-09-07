export type CameraFacing = "environment" | "user";

export type OpenCameraStreamOptions = {
  /** Prefer rear (`environment`) for ID photos; falls back to front when needed. */
  facing?: CameraFacing;
  width?: number;
  height?: number;
};

/** Open a camera stream, trying rear then front (or the reverse when requested). */
export async function openCameraStream(
  opts: OpenCameraStreamOptions = {},
): Promise<{ stream: MediaStream; facing: CameraFacing }> {
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

  throw lastError instanceof Error ? lastError : new Error("Camera unavailable");
}

export function stopCameraStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}
