export interface ICreateFileMetadata {
  name: string;
  size: number | bigint;
  mimeType: string;
  extension?: string | null;
  userId: string;
  folderId?: string | null;
  connectedAccountId: string;
  providerFileId: string;
  webContentLink?: string | null;
  webViewLink?: string | null;
  thumbnailLink?: string | null;
}

export interface IUpdateFileMetadata {
  name?: string;
  isFavorite?: boolean;
  isTrash?: boolean;
}

export interface IFileQueryFilters {
  folderId?: string;
  connectedAccountId?: string;
  mimeType?: string;
  isFavorite?: boolean;
  isTrash?: boolean;
  search?: string;
}
