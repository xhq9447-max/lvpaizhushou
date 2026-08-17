ALTER TABLE `customers`
  ADD UNIQUE INDEX `customers_merchant_id_wechat_openid_key`(`merchant_id`, `wechat_openid`),
  ADD INDEX `customers_wechat_openid_idx`(`wechat_openid`);

ALTER TABLE `file_assets`
  MODIFY `uploader_id` VARCHAR(191) NULL,
  ADD COLUMN `customer_openid` VARCHAR(191) NULL,
  ADD INDEX `file_assets_customer_openid_created_at_idx`(`customer_openid`, `created_at`);
