-- AlterTable
ALTER TABLE `tournament` ADD COLUMN `refereeCode` VARCHAR(191) NULL;
ALTER TABLE `tournament` ADD COLUMN `isCodeActive` BOOLEAN NOT NULL DEFAULT true;