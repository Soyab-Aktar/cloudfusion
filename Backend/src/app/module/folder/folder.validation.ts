import { z } from "zod";

const createFolderZodSchema = z.object({
  name: z.string({ message: "Folder name is required" }).min(1, "Folder name cannot be empty"),
  parentId: z.string().uuid("Invalid Parent Folder ID format").optional(),
  connectedAccountId: z.string().uuid("Invalid Connected Account ID format").optional(),
});

const renameFolderZodSchema = z.object({
  name: z.string({ message: "New folder name is required" }).min(1, "Folder name cannot be empty"),
});

export const FolderValidation = {
  createFolderZodSchema,
  renameFolderZodSchema,
};
