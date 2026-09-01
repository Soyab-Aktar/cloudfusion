import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma"

const getUserConnectedAccounts = async (userId: string) => {
  const data = await prisma.connectedAccount.findMany({
    where: {
      userId: userId
    },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      totalBytes: true,
      usedBytes: true,
      availableBytes: true,
      lastSyncedAt: true,
      createdAt: true,
      updatedAt: true,
    }
  });
  return data;
}

const disconnectAccount = async (userId: string, accountId: string) => {
  const account = await prisma.connectedAccount.findFirst({
    where: {
      id: accountId,
      userId: userId,
    },
  });
  if (!account) {
    throw new AppError(status.NOT_FOUND, "Connected Account not found");
  }
  const deleteAccount = await prisma.connectedAccount.delete({
    where: {
      id: accountId,
    },
  });
  return deleteAccount;
};

export const ConnectedAccountService = {
  getUserConnectedAccounts,
  disconnectAccount,
};