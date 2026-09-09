export const MAX_UPLOAD_SIZE_MB =
  Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB ?? 5000) || 5000;

export const MAX_UPLOAD_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export type FileSizeValidation =
  | { ok: true; maxMB: number; maxBytes: number }
  | { ok: false; maxMB: number; maxBytes: number; message: string };

export function validateFileSize(
  file: Pick<File, "size"> | null | undefined,
  maxMB: number = MAX_UPLOAD_SIZE_MB,
): FileSizeValidation {
  const maxBytes = maxMB * 1024 * 1024;
  if (!file) {
    return { ok: false, maxMB, maxBytes, message: "Please choose a file." };
  }
  if (file.size > maxBytes) {
    return {
      ok: false,
      maxMB,
      maxBytes,
      message: `This file is too large. Maximum allowed size is ${maxMB} MB.`,
    };
  }
  return { ok: true, maxMB, maxBytes };
}
