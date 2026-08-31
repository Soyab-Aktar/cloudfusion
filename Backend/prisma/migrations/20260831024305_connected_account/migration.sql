-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('GOOGLE_DRIVE', 'AWS_S3', 'DROPBOX', 'ONEDRIVE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR');

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "issuer" TEXT;

-- CreateTable
CREATE TABLE "providerConfigs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" "StorageProvider" NOT NULL,
    "clientIdEncrypted" TEXT NOT NULL,
    "clientSecretEncrypted" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopea" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providerConfigs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectedAccounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerConfigId" TEXT,
    "provider" "StorageProvider" NOT NULL DEFAULT 'GOOGLE_DRIVE',
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastError" TEXT,
    "totalBytes" BIGINT,
    "usedBytes" BIGINT DEFAULT 0,
    "availableBytes" BIGINT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connectedAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connectedAccounts_userId_provider_providerAccountId_key" ON "connectedAccounts"("userId", "provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "connectedAccounts" ADD CONSTRAINT "connectedAccounts_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "providerConfigs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectedAccounts" ADD CONSTRAINT "connectedAccounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
