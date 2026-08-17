# 微信小程序前端

本目录只负责客户扫码建单、订单进度、增值服务确认和外部选片确认，复用现有 NestJS REST API。

## 配置

1. 复制 `project.config.example.json` 为 `project.config.json`，填入小程序 AppID。
2. 在 `config/env.js` 分别填写体验版与正式版的 CloudBase 环境 ID、云托管服务名。
3. 开发版可填写 HTTPS API 地址，或在开发者工具中执行 `wx.setStorageSync('apiBaseUrl', 'https://your-domain')`。
4. 正式版推荐 `cloudContainer`，请求由 `wx.cloud.callContainer` 发往现有 NestJS `/api` 路由。

环境 ID、服务名和域名不是密钥；腾讯云 SecretId、SecretKey、数据库密码及 JWT 密钥不得放入小程序代码。
