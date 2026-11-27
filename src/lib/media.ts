/** Poster images uploaded to the private "previews" bucket are stored as "previews:<path>". */
export const PREVIEW_PREFIX = "previews:";
export const previewPath = (poster: string | null) =>
  poster?.startsWith(PREVIEW_PREFIX) ? poster.slice(PREVIEW_PREFIX.length) : null;
export const fileExt = (f: File) => (f.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
