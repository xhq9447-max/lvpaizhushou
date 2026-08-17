const { getEnvironment } = require('../config/env');

function request(path, options = {}) {
  const config = getEnvironment();
  const method = options.method || 'GET';
  const header = { 'content-type': 'application/json', 'x-request-id': createRequestId(), ...(options.header || {}) };
  const token = wx.getStorageSync('accessToken');
  if (token) header.Authorization = `Bearer ${token}`;

  if (config.transport === 'cloudContainer') {
    if (!config.cloudEnv || !config.serviceName) return Promise.reject(new Error('请配置微信云托管环境和服务名'));
    return wx.cloud.callContainer({
      config: { env: config.cloudEnv }, path: `/api${path}`, method, data: options.data, header: { ...header, 'X-WX-SERVICE': config.serviceName },
    }).then(normalizeResponse);
  }
  if (!config.apiBaseUrl) return Promise.reject(new Error('请配置开发环境 API 地址'));
  return new Promise((resolve, reject) => wx.request({
    url: `${config.apiBaseUrl.replace(/\/$/, '')}/api${path}`, method, data: options.data, header,
    success: (response) => { try { resolve(normalizeResponse(response)); } catch (error) { reject(error); } }, fail: reject,
  }));
}

function normalizeResponse(response) {
  if (response.statusCode >= 200 && response.statusCode < 300) return response.data;
  const message = response.data && response.data.error && response.data.error.message;
  throw new Error(Array.isArray(message) ? message.join('；') : message || '请求失败');
}

function createRequestId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

module.exports = { request };
