import { Readable } from "stream";

export interface QuotaInfo {
  totalBytes: bigint | null;
  usedBytes: bigint | null;
  availableBytes: bigint | null;
}

export interface CloudFileMetaData {
  providerFileId: string;
  name: string;
  mimeType: string;
  size?: bigint;
  isFolder: boolean;
  parentProviderFolderId: string | null;
  webViewLink?: string | null;
  thumbnailLink?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UploadFileInput {
  name: string;
  mimeType: string;
  stream?: Readable;
  size?: bigint;
  parentProviderFolderId?: string;
}

export interface IStorageAdapter {
  syncQuota(): Promise<QuotaInfo>;
  listFiles(parentFolderId?: string): Promise<CloudFileMetaData[]>;
  uploadFile(input: UploadFileInput): Promise<CloudFileMetaData>;
  downloadFile(providerFileId: string): Promise<Readable>;
  deleteFile(providerFileId: string): Promise<void>;
  createFolder(name: string, parentProviderFolderId?: string): Promise<CloudFileMetaData>;
}