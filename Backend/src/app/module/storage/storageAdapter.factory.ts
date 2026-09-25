import status from "http-status";
import { AccountStatus, StorageProvider } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { IStorageAdapter } from "../../interfaces/storageAdapter.interface"
import { prisma } from "../../lib/prisma"
import { GoogleDriveAdapter } from "./adapters/googleDrive.adapter";

export class StorageAdapterFactory {
  /**
   * Retrieves storage adapter for connected account
   * @param userId - Authenticated user ID for ownership check
   * @param accountId - Connected account ID in DB
   */
  static async getAdapter(userId: string, accountId: string): Promise<IStorageAdapter> {
    const account = await prisma.connectedAccount.findUnique({
      where: {
        id: accountId,
      },
    });

    if (!account || account.status !== AccountStatus.CONNECTED) {
      throw new AppError(status.NOT_FOUND, "Connected storage account not found or is disconnected");
    }
    if (userId && account.userId !== userId) {
      throw new AppError(status.FORBIDDEN, "Access denied. You do not own this storage account");
    }

    switch (account.provider) {
      case StorageProvider.GOOGLE_DRIVE:
        return new GoogleDriveAdapter(account.id);

      default:
        throw new AppError(status.NOT_IMPLEMENTED, `Storage provider '${account.provider}' is not supported yet`);
    }

  }
}