# CloudBase MySQL 备份策略

## 目标

- 建议生产初期目标：RPO 不超过 24 小时，RTO 不超过 4 小时；业务量增大后再收紧。
- 数据库备份和云存储文件是两套独立保护对象，数据库备份不包含照片正文。

## 自动备份

1. 在 CloudBase MySQL 控制台开启每日自动备份。
2. 建议保留不少于 30 天，并根据套餐和合规要求调整。
3. 如果控制台提供日志备份或时间点恢复能力，应同时开启。
4. 备份时间安排在业务低峰，监控备份任务失败告警。

## 发布前备份

每次生产 migration 前：

1. 创建手动备份并等待状态成功；
2. 记录备份 ID、当前应用版本和最后一个 Prisma migration 名称；
3. 执行 `npx prisma migrate deploy`；
4. 完成健康检查和核心流程抽查后再切换全部流量。

Prisma migration 采用向前修复策略。已经应用的 migration 不回写、不删除；需要修正时创建新的 migration。

## 异地逻辑备份

建议每周使用只读备份账号执行一次逻辑导出，并加密存放到与生产数据库不同的存储位置。导出文件不得提交 Git，也不得放在 Web 可访问目录。

示意命令：

```bash
mysqldump --single-transaction --routines --triggers --set-gtid-purged=OFF \
  -h PRIVATE_HOST -u BACKUP_USER -p travel_photo_saas > travel_photo_YYYYMMDD.sql
```

密码应通过安全交互或临时凭据提供，不写在命令历史、脚本和 CI 日志中。

## 云存储保护

1. 正式桶使用私有读；
2. 根据 CloudBase 控制台能力启用版本保护、回收站或生命周期策略；
3. 定期导出 `file_assets` 文件清单并与云存储对象清单核对；
4. 删除文件采用延迟删除，先标记、后清理；
5. 高清成片按商家合同与隐私政策设置保留期限。

## 恢复演练

至少每季度执行一次：

1. 将最近备份恢复到隔离的测试实例；
2. 运行 `npx prisma migrate status`；
3. 检查商家、订单、员工、增值服务和文件元数据数量；
4. 使用测试账号完成登录、订单读取和临时文件 URL 获取；
5. 记录恢复耗时、缺失项和改进措施。

未经过恢复演练的备份不能视为可靠备份。
