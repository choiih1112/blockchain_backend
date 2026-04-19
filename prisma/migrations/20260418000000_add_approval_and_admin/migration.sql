-- Add ADMIN to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- CreateEnum ApprovalStatus
DO $$ BEGIN
    CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns to Organization
ALTER TABLE "Organization"
    ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;

-- Drop old verified column if exists
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "verified";

-- Add columns to DonationSession
ALTER TABLE "DonationSession"
    ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS "planFileUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;

-- Update foreign key cascades for Organization
ALTER TABLE "Organization" DROP CONSTRAINT IF EXISTS "Organization_userId_fkey";
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update foreign key cascades for DonationSession
ALTER TABLE "DonationSession" DROP CONSTRAINT IF EXISTS "DonationSession_organizationId_fkey";
ALTER TABLE "DonationSession" ADD CONSTRAINT "DonationSession_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update foreign key cascades for DonationRecord
ALTER TABLE "DonationRecord" DROP CONSTRAINT IF EXISTS "DonationRecord_sessionId_fkey";
ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "DonationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint on DonationRecord.txHash if not exists
DO $$ BEGIN
    ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_txHash_key" UNIQUE ("txHash");
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;
