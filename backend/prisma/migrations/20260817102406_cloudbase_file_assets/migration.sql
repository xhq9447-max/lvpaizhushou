-- CreateTable
CREATE TABLE `file_assets` (
    `id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NOT NULL,
    `uploader_id` VARCHAR(191) NOT NULL,
    `file_id` VARCHAR(512) NOT NULL,
    `url` TEXT NULL,
    `cloud_path` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `category` ENUM('PHOTO', 'DOCUMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_assets_file_id_key`(`file_id`),
    INDEX `file_assets_merchant_id_category_created_at_idx`(`merchant_id`, `category`, `created_at`),
    INDEX `file_assets_uploader_id_created_at_idx`(`uploader_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_assets` ADD CONSTRAINT `file_assets_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_assets` ADD CONSTRAINT `file_assets_uploader_id_fkey` FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
