-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `wechat_openid` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `customers_merchant_id_name_idx`(`merchant_id`, `name`),
    UNIQUE INDEX `customers_merchant_id_phone_key`(`merchant_id`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NOT NULL,
    `store_id` VARCHAR(191) NOT NULL,
    `customer_id` VARCHAR(191) NOT NULL,
    `order_no` VARCHAR(191) NOT NULL,
    `access_token` VARCHAR(64) NOT NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'WAITING_MAKEUP', 'MAKEUP_IN_PROGRESS', 'WAITING_PHOTOGRAPHY', 'PHOTOGRAPHY_IN_PROGRESS', 'WAITING_SELECTION', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `package_name` VARCHAR(191) NULL,
    `appointment_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `confirmed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_no_key`(`order_no`),
    UNIQUE INDEX `orders_access_token_key`(`access_token`),
    INDEX `orders_merchant_id_status_idx`(`merchant_id`, `status`),
    INDEX `orders_merchant_id_store_id_appointment_at_idx`(`merchant_id`, `store_id`, `appointment_at`),
    INDEX `orders_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_records` (
    `id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `stage` ENUM('MAKEUP', 'PHOTOGRAPHY') NOT NULL,
    `status` ENUM('CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'REPLACED') NOT NULL DEFAULT 'CLAIMED',
    `is_current` BOOLEAN NOT NULL DEFAULT true,
    `claimed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `replaced_at` DATETIME(3) NULL,
    `replacement_reason` VARCHAR(191) NULL,
    `previous_record_id` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_records_merchant_id_order_id_stage_idx`(`merchant_id`, `order_id`, `stage`),
    INDEX `service_records_merchant_id_employee_id_status_idx`(`merchant_id`, `employee_id`, `status`),
    INDEX `service_records_order_id_stage_is_current_idx`(`order_id`, `stage`, `is_current`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `value_added_services` (
    `id` VARCHAR(191) NOT NULL,
    `merchant_id` VARCHAR(191) NOT NULL,
    `order_id` VARCHAR(191) NOT NULL,
    `service_record_id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(191) NOT NULL,
    `stage` ENUM('MAKEUP', 'PHOTOGRAPHY') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_amount` DECIMAL(10, 2) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'DISPUTED', 'VOIDED') NOT NULL DEFAULT 'PENDING',
    `description` TEXT NULL,
    `customer_note` TEXT NULL,
    `confirmed_at` DATETIME(3) NULL,
    `disputed_at` DATETIME(3) NULL,
    `voided_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `value_added_services_merchant_id_order_id_status_idx`(`merchant_id`, `order_id`, `status`),
    INDEX `value_added_services_employee_id_status_idx`(`employee_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_records` ADD CONSTRAINT `service_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_records` ADD CONSTRAINT `service_records_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `value_added_services` ADD CONSTRAINT `value_added_services_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `value_added_services` ADD CONSTRAINT `value_added_services_service_record_id_fkey` FOREIGN KEY (`service_record_id`) REFERENCES `service_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `value_added_services` ADD CONSTRAINT `value_added_services_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
