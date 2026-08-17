# 旅拍管家 V1

面向旅拍、摄影工作室、婚纱摄影和写真馆的多租户 SaaS。当前包含平台商家、认证权限、门店、员工、客户订单、服务认领、换人、增值服务确认、外部选片确认和 CloudBase 文件元数据。

生产目标架构为 CloudBase 静态网站托管 + 微信云托管/CloudBase 云托管 NestJS 容器 + CloudBase MySQL + CloudBase 云存储。部署步骤见 [CloudBase 生产部署](docs/cloudbase-deployment.md)。

## 环境要求

- Node.js 20 或更高（已在 Node.js 24 验证）
- npm 10 或更高
- Docker Desktop（用于 MySQL 8.4）

## 目录

```text
旅拍管家/
├── backend/                 NestJS + Prisma API
│   ├── prisma/              Schema、迁移、Seed
│   ├── src/                 业务模块
│   └── test/                多租户自动化测试
├── admin-web/               Vue 3 管理后台
├── miniprogram/              微信小程序客户前端
├── docs/                    架构与后续数据库设计
├── docker-compose.yml       MySQL 开发环境
└── .env.example             Docker 与公共环境变量模板
```

## 首次启动

以下命令在项目根目录执行。

1. 安装依赖：

   ```bash
   npm install
   ```

2. 创建环境文件：

   ```powershell
   Copy-Item .env.example .env
   Copy-Item backend/.env.example backend/.env
   Copy-Item admin-web/.env.example admin-web/.env
   ```

   修改 `.env` 与 `backend/.env` 中的数据库密码，确保两处一致；将两个 JWT 密钥替换为不同的、至少 32 位的随机字符串。生产环境必须通过密钥管理服务注入，不要提交 `.env`。

3. 启动 MySQL：

   ```bash
   docker compose up -d mysql
   docker compose ps
   ```

4. 生成客户端、执行迁移和 Seed：

   ```bash
   npm run prisma:generate -w backend
   npm run migration -w backend
   npm run seed -w backend
   ```

5. 分别启动后端和管理后台：

   ```bash
   npm run dev -w backend
   npm run dev -w admin-web
   ```

   API 地址为 `http://localhost:3000/api`，管理后台为 `http://localhost:5173`。

## 本地测试账号

| 身份 | 账号 | 密码来源 |
| --- | --- | --- |
| 平台超级管理员 | `admin` | `backend/.env` 的 `SEED_ADMIN_PASSWORD` |
| 草原印象旅拍老板 | `owner` | `backend/.env` 的 `SEED_OWNER_PASSWORD` |

Seed 还会创建“大召店”和摄影师、化妆师、修图师测试数据。Seed 密码仅来自环境变量，不在代码中硬编码。生产环境不应自动运行 Seed。

## 质量检查

```bash
npm run build
npm run lint
npm run test
```

多租户测试验证 A 商家的身份访问 B 商家的门店或员工 ID 时，查询、修改和删除始终附加 A 的 `merchant_id`，结果为不可见或零行更新。

## 主要 API

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `GET|POST /api/merchants`、`GET|PATCH /api/merchants/:id`（仅平台管理员）
- `GET|POST /api/stores`、`GET|PATCH|DELETE /api/stores/:id`
- `GET|POST /api/employees`、`GET|PATCH|DELETE /api/employees/:id`
- `GET|POST /api/orders` 及服务认领、换人和增值服务接口
- `POST /api/files/upload`、`GET /api/files/:id/download-url`
- `GET /api/health`、`GET /api/health/live`

员工列表支持 `keyword`、`role`、`storeId`、`status`、`page` 和 `pageSize` 查询参数。

## 常用维护命令

```bash
# 查看迁移状态
npx prisma migrate status --schema backend/prisma/schema.prisma

# 本地开发新迁移（命名示例）
npm run migration:dev -w backend -- --name add_feature

# 停止数据库（数据卷保留）
docker compose down
```

架构边界详见 [docs/architecture.md](docs/architecture.md)，第二阶段表设计见 [docs/database-design.md](docs/database-design.md)。
