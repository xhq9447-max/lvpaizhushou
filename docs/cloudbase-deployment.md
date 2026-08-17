# CloudBase / 微信云托管生产部署

## 最终架构

```text
CloudBase 静态网站托管（admin-web/dist）
                    │ /api
                    ▼
微信云托管 / CloudBase 云托管（NestJS Docker 容器）
          ├── CloudBase MySQL（Prisma 直连）
          └── CloudBase 云存储（文件正文）

微信小程序 ── wx.cloud.callContainer ──► 同一 NestJS API
```

业务代码继续使用 NestJS、Prisma、MySQL、JWT 和现有多租户权限。CloudBase 文档型数据库不在本项目部署范围内。

## 一、准备云资源

1. 创建正式 CloudBase 环境，并记录环境 ID。
2. 开通 CloudBase MySQL，创建：
   - 独立的迁移账号：仅在发布阶段使用，拥有建表、改表和索引权限；
   - 独立的运行账号：容器运行时使用，仅拥有应用库日常读写权限。
3. 开通云存储，正式环境建议配置为私有读；文件访问由 API 生成短期 URL。
4. 创建云托管服务，容器监听端口设置为 `3000`，Dockerfile 路径设置为项目根目录的 `Dockerfile`。
5. 日志采集路径留空，采集容器标准输出和标准错误。

## 二、生产环境变量

以 `backend/.env.production.example` 为清单，在云托管控制台注入环境变量。禁止把真实值写入 Dockerfile、Git 或小程序。

必需项：

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDBASE_ENV_ID`

CloudBase 云托管内优先使用平台运行时身份访问云存储，不配置长期 `SecretId` 和 `SecretKey`。只有本地联调时才通过本地环境变量临时提供密钥。

MySQL 密码必须进行 URL 编码。例如密码中的 `!` 应编码为 `%21`。建议连接串配置有限连接池，避免容器扩容后耗尽数据库连接：

```text
mysql://APP_USER:URL_ENCODED_PASSWORD@PRIVATE_HOST:3306/travel_photo_saas?connection_limit=10&pool_timeout=20&connect_timeout=10
```

## 三、初始化生产数据库

所有 migration 均保留原始顺序，禁止修改已经应用的 migration SQL。

发布应用前，使用迁移账号在一次性发布任务或受控终端执行：

```bash
export DATABASE_URL='mysql://MIGRATION_USER:URL_ENCODED_PASSWORD@PRIVATE_HOST:3306/travel_photo_saas'
npm ci
npm run migrate:prod
```

等价的直接命令：

```bash
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

迁移必须只运行一次并成功结束后再切换生产流量。不要在每个自动扩容实例启动时自动执行 migration。

生产环境默认不运行 Seed。平台管理员和首个商家账号应通过受控初始化流程创建。

## 四、部署 NestJS 容器

Dockerfile 使用两个阶段：构建阶段编译 NestJS 并生成 Prisma Client；运行阶段只安装生产依赖、迁移 CLI、Prisma Client、Schema 和 migrations。

本地具备 Docker 时可验证：

```bash
docker build -t travel-photo-api:release .
docker run --rm -p 3000:3000 --env-file backend/.env.production travel-photo-api:release
```

健康检查：

- 存活检查：`GET /api/health/live`
- 就绪检查：`GET /api/health`，同时验证 MySQL 连接

云托管健康检查建议配置为 `/api/health`。发布后先保持新版本低流量，确认健康、登录、订单查询和文件上传后再切至 100%。

## 五、部署 Vue 管理后台

生产构建：

```bash
Copy-Item admin-web/.env.production.example admin-web/.env.production
npm ci
npm run build -w admin-web
```

将 `admin-web/dist` 上传至 CloudBase 静态网站托管，并配置：

1. SPA 路由回退到 `index.html`；
2. `/api/*` 路由到 NestJS 云托管服务，并透传完整路径；
3. 前端域名加入后端 `CORS_ORIGIN`；
4. 正式环境绑定已备案自定义域名并启用 HTTPS。

`admin-web/.env.production.example` 使用相对地址 `/api`，因此前端和 API 共用域名时无需在构建产物写入具体后端域名。

## 六、云存储

上传接口：

```text
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <access-token>

file=<binary>
category=PHOTO|DOCUMENT|OTHER
relatedType=<optional>
relatedId=<optional>
```

容器使用内存接收单个文件并立即上传 CloudBase，不写本地服务器目录。默认上限 20MB，可通过 `MAX_UPLOAD_MB` 调整。

数据库仅记录 CloudBase `fileID`、初始访问 URL、云端路径、原文件名、MIME、大小、分类和关联元数据。私有文件应在使用时调用：

```text
GET /api/files/:id/download-url
```

获取一小时有效的临时 URL。不要长期依赖数据库中的初始临时 URL。

## 七、微信小程序

小程序代码位于 `miniprogram`，复用现有 NestJS REST API，不包含数据库直连和后端业务逻辑。

1. 复制 `project.config.example.json` 为 `project.config.json` 并填写 AppID；
2. 在 `config/env.js` 配置体验版、正式版环境 ID和云托管服务名；
3. 正式版使用 `wx.cloud.callContainer`；
4. SecretId、SecretKey、MySQL 密码、JWT 密钥不得进入小程序代码；
5. 发布前在微信公众平台完成隐私政策、用户信息用途和网络服务配置。

## 八、发布检查清单

- [ ] 生产 MySQL 已完成手动备份
- [ ] `npx prisma migrate deploy` 成功
- [ ] `/api/health` 返回数据库就绪
- [ ] 两个 JWT 密钥不同且不少于 32 个随机字符
- [ ] 运行账号不是 MySQL 管理员
- [ ] CORS 只包含正式前端域名
- [ ] CloudBase 云存储为私有读
- [ ] 文件上传和临时下载 URL 验证通过
- [ ] 容器日志中无密码、Token、请求正文
- [ ] 管理后台 SPA 刷新路由正常
- [ ] 小程序体验版完整走通建单与确认流程
- [ ] 新旧容器版本具备快速流量回切能力

数据库备份与恢复演练详见 `docs/database-backup.md`。
