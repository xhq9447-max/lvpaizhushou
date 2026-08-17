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

function uploadOrderFile(order, file) {
  const extension = (file.name || file.tempFilePath).match(/\.[a-zA-Z0-9]{1,10}$/);
  const cloudPath = `client-uploads/${order.id}/${Date.now()}-${Math.random().toString(16).slice(2)}${extension ? extension[0].toLowerCase() : ''}`;
  const resolvedMimeType = file.mimeType || mimeType(file.name || file.tempFilePath);
  return wx.cloud.uploadFile({ cloudPath, filePath: file.tempFilePath }).then((uploaded) => request(`/client/orders/${order.accessToken}/files`, {
    method: 'POST',
    data: {
      fileId: uploaded.fileID,
      cloudPath,
      originalName: file.name || `旅拍照片${extension ? extension[0] : ''}`,
      mimeType: resolvedMimeType,
      size: file.size,
      category: resolvedMimeType.startsWith('image/') ? 'PHOTO' : 'DOCUMENT',
    },
  }));
}

function mimeType(name) {
  const extension = (name.split('.').pop() || '').toLowerCase();
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', pdf: 'application/pdf' })[extension] || 'application/octet-stream';
}

module.exports = { request, uploadOrderFile };
