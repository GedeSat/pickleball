-- CreateTable
CREATE TABLE `banner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tag` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleHighlight` VARCHAR(191) NOT NULL DEFAULT '',
    `desc` TEXT NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `bgGradient` VARCHAR(191) NOT NULL DEFAULT 'from-primary via-brand to-brand',
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;