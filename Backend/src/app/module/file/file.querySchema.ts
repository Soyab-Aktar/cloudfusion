import { z } from "zod";

export const fileQuerySchema = z.object({

  search: z.string().trim().min(1).optional(),

  // pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // sorting
  sortBy: z
    .enum(["name", "size", "extension", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // CloudFusion-specific filters
  provider: z
    .enum(["GOOGLE_DRIVE", "AWS_S3", "DROPBOX", "ONEDRIVE"])
    .optional(),
  mimeType: z.string().optional(),
  extension: z.string().optional(),
  folderId: z.string().optional(), // filter files inside a specific folder (undefined = all files)
  isTrash: z.coerce.boolean().optional(),
  isFavorite: z.coerce.boolean().optional(),
  connectedAccountId: z.string().optional(),

  // size range
  minSize: z.coerce.number().int().nonnegative().optional(),
  maxSize: z.coerce.number().int().nonnegative().optional(),

  // date range
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
});

export type FileQueryParams = z.infer<typeof fileQuerySchema>;
