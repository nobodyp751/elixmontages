import { z } from "zod";

export const portfolioCodeSchema = z.string().min(8).max(64).regex(/[A-Za-z]/).regex(/[0-9]/);
export const DOWNLOAD_LINK_SECONDS = 60;
export const downloadInputSchema = z.object({ videoId: z.string().uuid(), code: z.string().min(1).max(64) });
export const setCodeInputSchema = z.object({ videoId: z.string().uuid(), code: portfolioCodeSchema.nullable() });