# Production migrations

当前迁移必须按目录顺序保留并部署：

1. `202608170001_init`：商家、门店、用户、员工、权限、刷新令牌和操作日志。
2. `20260817082009_service_workflow`：客户、订单、服务认领、换人和增值服务。
3. `20260817090514_external_selection_confirmation`：外部选片确认状态。
4. `20260817102406_cloudbase_file_assets`：CloudBase 文件元数据。

生产执行：

```bash
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

规则：

- 不修改、重命名或合并已经部署的 migration。
- Schema 变更只能新增 migration。
- migration 在切换应用流量前由单一发布任务执行。
- 生产 migration 前必须完成可恢复的 MySQL 备份。
- 生产环境不自动执行 Seed。
