import { drive_v3, google } from "googleapis";
import { CloudFileMetaData, IStorageAdapter, QuotaInfo, UploadFileInput } from "../../../interfaces/storageAdapter.interface";
import { GoogleService } from "../../connectedAccount/google.service";
import { prisma } from "../../../lib/prisma";
import AppError from "../../../errorHelpers/AppError";
import status from "http-status";
import { Readable } from "stream";

export class GoogleDriveAdapter implements IStorageAdapter {
  private accountId: string;
  constructor(accountId: string) {
    this.accountId = accountId;
  }
  // Helper to get authenticated Google Drive client instance
  private async getDriveClient() {
    const authClient = await GoogleService.getAuthedGoogleClient(this.accountId);
    return google.drive({
      version: 'v3',
      auth: authClient
    })
  }

  // Helper to format Google Drive API file object to CloudFileMetaData
  private formatFileMetadata(file: drive_v3.Schema$File): CloudFileMetaData {
    const GOOGLE_FOLDER_MIMETYPE = "application/vnd.google-apps.folder";
    return {
      providerFileId: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size ? BigInt(file.size) : undefined,
      isFolder: file.mimeType === GOOGLE_FOLDER_MIMETYPE,
      parentProviderFolderId: file.parents?.[0] ?? null,
      webViewLink: file.webViewLink ?? null,
      thumbnailLink: file.thumbnailLink ?? null,
      createdAt: file.createdTime ? new Date(file.createdTime) : undefined,
      updatedAt: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
    };
  }

  // Sync Storage Quota from Google Drive
  async syncQuota(): Promise<QuotaInfo> {
    const updatedAccount = await GoogleService.syncGoogleQuota(this.accountId);
    return {
      totalBytes: updatedAccount.totalBytes,
      usedBytes: updatedAccount.usedBytes,
      availableBytes: updatedAccount.availableBytes
    }
  }

  // List Files & Folders inside a parent folder (or root if omitted)
  async listFiles(parentFolderId?: string): Promise<CloudFileMetaData[]> {
    const drive = await this.getDriveClient();
    const parentQuery = parentFolderId ? `'${parentFolderId}' in parents` : "'root' in parents";
    const query = `${parentQuery} and trashed = false`;

    const response = await drive.files.list({
      q: query,
      fields:
        "files(id, name, mimeType, size, parents, webViewLink, thumbnailLink, createdTime, modifiedTime)",
      pageSize: 100,
    });
    const files = response.data.files ?? [];
    return files.map((file) => this.formatFileMetadata(file));
  }

  // Upload File Stream to Google Drive
  async uploadFile(input: UploadFileInput): Promise<CloudFileMetaData> {
    if (!input.stream) {
      throw new AppError(status.BAD_REQUEST, "File stream is required for upload");
    }
    const drive = await this.getDriveClient();
    const response = await drive.files.create({
      requestBody: {
        name: input.name,
        mimeType: input.mimeType,
        parents: input.parentProviderFolderId
          ? [input.parentProviderFolderId]
          : undefined,
      },
      media: {
        mimeType: input.mimeType,
        body: input.stream,
      },
      fields:
        "id, name, mimeType, size, parents, webViewLink, thumbnailLink, createdTime, modifiedTime",
    });
    return this.formatFileMetadata(response.data);
  }

  // Download File Stream from Google Drive
  async downloadFile(providerFileId: string): Promise<Readable> {
    const drive = await this.getDriveClient();
    const response = await drive.files.get(
      { fileId: providerFileId, alt: "media" },
      { responseType: "stream" }
    );
    return response.data as Readable;
  }

  // Delete File/Folder from Google Drive
  async deleteFile(providerFileId: string): Promise<void> {
    const drive = await this.getDriveClient();
    await drive.files.delete({ fileId: providerFileId });
  }

  // Create Folder in Google Drive
  async createFolder(
    name: string,
    parentProviderFolderId?: string
  ): Promise<CloudFileMetaData> {
    const drive = await this.getDriveClient();
    const response = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentProviderFolderId ? [parentProviderFolderId] : undefined,
      },
      fields:
        "id, name, mimeType, size, parents, webViewLink, thumbnailLink, createdTime, modifiedTime",
    });
    return this.formatFileMetadata(response.data);
  }
}