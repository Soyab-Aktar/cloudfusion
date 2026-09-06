import { z } from "zod";

const createFileMetadataZodSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().nonnegative("File size must be non-negative"),
  mimeType: z.string().min(1, "MIME type is required"),
  extension: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
  connectedAccountId: z.string().uuid("Invalid connected account ID"),
  providerFileId: z.string().min(1, "Provider file ID is required"),
  webContentLink: z.string().url().optional().nullable(),
  webViewLink: z.string().url().optional().nullable(),
  thumbnailLink: z.string().url().optional().nullable(),
});

const updateFileMetadataZodSchema = z.object({
  name: z.string().min(1, "File name cannot be empty").optional(),
  isFavorite: z.boolean().optional(),
  isTrash: z.boolean().optional(),
});

export const FileValidation = {
  createFileMetadataZodSchema,
  updateFileMetadataZodSchema,
};
