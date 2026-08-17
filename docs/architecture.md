# V1 架构说明

## 多租户边界

1. JWT 策略每次请求重新读取用户及商家状态，不仅信任 Token 内字段。
2. `TenantGuard` 区分平台接口和商户接口。平台接口只允许 `SUPER_ADMIN`，商户接口要求身份存在 `merchantId`。
3. `TenantPrismaService` 是商户数据唯一入口；其门店、员工查询、修改和软删除均自动追加服务端身份中的 `merchantId`。
4. 员工绑定门店前通过同一租户数据层验证门店，阻止跨商家外键注入。
5. 控制器 DTO 不接收 `merchantId`，前端不能选择或覆盖当前商户。

新增租户模型时，必须先扩展 `TenantPrismaService` 并增加“使用另一商家资源 ID”测试，禁止业务 Service 直接调用未限定租户的 Prisma 模型。

## 认证和授权

- access token 默认 15 分钟；refresh token 默认 7 天。
- refresh token 只在客户端出现一次，服务端保存 SHA-256 摘要；刷新时旧 Token 立即撤销并轮换。
- 密码使用 Argon2id 默认安全参数保存。
- `JwtAuthGuard`、`TenantGuard`、`RolesGuard`、`PermissionsGuard` 均为全局守卫。
- `OWNER` 拥有商家全部权限；其他岗位从角色权限关联表读取权限。

## 安全基线

- DTO 白名单、类型转换和未知字段拒绝全局开启。
- Helmet 安全响应头、精确 CORS 源、基础限流已启用。
- API 使用 Authorization Bearer，不使用 Cookie，因此不依赖 CSRF Token；若以后改用 Cookie，必须同时加入 SameSite 和 CSRF Token。
- Prisma 参数化查询防 SQL 注入；Vue 默认文本插值转义防常见 XSS，禁止引入不可信 `v-html`。
- 所有错误使用统一 JSON 结构，不返回密码摘要、Token 摘要或堆栈。
