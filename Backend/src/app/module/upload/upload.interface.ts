import { Readable } from "stream";

export type UploadPolicy = "manual" | "auto";
export interface IUploadFileInput {
  userId: string;
  fileName: string;
  mimeType: string;
  size: number;
  stream: Readable;
  folderId?: string;
  parentProviderFolderId?: string;
  policy: UploadPolicy;
  targetAccountId?: string;
}