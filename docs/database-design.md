# 数据库设计（V1 与后续预留）

V1 实际迁移包含 `merchants`、`stores`、`users`、`employees`、`roles`、`permissions`、`role_permissions`、`refresh_tokens`、`operation_logs`。除平台权限字典等平台级数据外，租户数据均包含 `merchant_id`，并建立组合索引。

## 第二阶段预留表

第二阶段再迁移以下表，避免 V1 引入尚未确认的业务细节：

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| customers | id, merchant_id, name, phone, source | 客户档案 |
| orders | id, merchant_id, store_id, customer_id, order_no, status, total_amount | 金额使用 Decimal |
| order_progress | id, merchant_id, order_id, status, operator_id, occurred_at | 流程轨迹 |
| payments | id, merchant_id, order_id, amount, method, paid_at | 收款记录 |
| expenses | id, merchant_id, store_id, amount, category | 支出 |
| commissions | id, merchant_id, employee_id, order_id, amount | 提成 |
| after_sales | id, merchant_id, order_id, type, status | 售后 |
| qr_bindings | id, merchant_id, order_id, user_id, token_hash, expires_at | 扫码绑定，保存摘要 |
| packages | id, merchant_id, name, price, content | 商家套餐商品 |

订单状态：`CREATED`、`BOOKED`、`MAKEUP`、`SHOOTING`、`PHOTO_SELECTION`、`RETOUCHING`、`WAIT_CONFIRM`、`DELIVERED`、`COMPLETED`、`CANCELLED`。

所有第二阶段租户表必须建立 `merchant_id` 索引；按 ID 访问时必须通过租户数据访问层组合 `id + merchant_id`，禁止使用客户端提交的商户 ID。
