const { request, uploadOrderFile } = require('../../utils/api');
const { decorateOrder } = require('../../utils/order');

Page({
  data: { loading: true, uploading: false, token: '', order: null, files: [] },
  onLoad(options) { this.setData({ token: options.token || '' }); this.load(); },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },
  async load() {
    try {
      const rawOrder = await request(`/client/orders/${this.data.token}`);
      const files = await request(`/client/orders/${this.data.token}/files`);
      const order = decorateOrder(rawOrder);
      order.serviceRecords = order.serviceRecords.filter((item) => item.isCurrent).map((item) => ({
        ...item,
        stageLabel: item.stage === 'MAKEUP' ? '化妆师' : '摄影师',
        serviceStatus: ({ CLAIMED: '已安排', IN_PROGRESS: '服务中', COMPLETED: '已完成', REPLACED: '已更换' })[item.status] || item.status,
      }));
      this.setData({ order, files, loading: false });
    } catch (error) { this.fail(error); }
  },
  async confirmAddon(event) {
    const modal = await wx.showModal({ title: '确认增值服务', content: '确认后门店将按此项目提供服务。' });
    if (!modal.confirm) return;
    try { await request(`/client/orders/${this.data.token}/value-added/${event.currentTarget.dataset.id}/confirm`, { method: 'POST' }); await this.load(); } catch (error) { this.fail(error); }
  },
  async disputeAddon(event) {
    const modal = await wx.showModal({ title: '提交异议', editable: true, placeholderText: '请输入异议原因' });
    if (!modal.confirm || !modal.content.trim()) return;
    try { await request(`/client/orders/${this.data.token}/value-added/${event.currentTarget.dataset.id}/dispute`, { method: 'POST', data: { reason: modal.content.trim() } }); await this.load(); } catch (error) { this.fail(error); }
  },
  async confirmSelection() {
    const modal = await wx.showModal({ title: '确认选片完成', content: '请确认您已按门店指引完成选片。' });
    if (!modal.confirm) return;
    try { await request(`/client/orders/${this.data.token}/selection-confirm`, { method: 'POST' }); await this.load(); } catch (error) { this.fail(error); }
  },
  choosePhotos() {
    wx.chooseMedia({ count: 9, mediaType: ['image'], sourceType: ['album', 'camera'], success: ({ tempFiles }) => this.uploadFiles(tempFiles.map((file, index) => ({ ...file, name: `旅拍照片-${Date.now()}-${index + 1}.jpg`, mimeType: 'image/jpeg' }))) });
  },
  chooseDocument() {
    wx.chooseMessageFile({ count: 5, type: 'file', extension: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'], success: ({ tempFiles }) => this.uploadFiles(tempFiles) });
  },
  async uploadFiles(files) {
    if (!files.length || this.data.uploading) return;
    this.setData({ uploading: true });
    wx.showLoading({ title: `上传 0/${files.length}`, mask: true });
    try {
      for (let index = 0; index < files.length; index += 1) {
        wx.showLoading({ title: `上传 ${index + 1}/${files.length}`, mask: true });
        await uploadOrderFile(this.data.order, files[index]);
      }
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
      await this.load();
    } catch (error) { wx.hideLoading(); this.fail(error); } finally { this.setData({ uploading: false }); }
  },
  previewFile(event) {
    const file = this.data.files[event.currentTarget.dataset.index];
    if (file.mimeType.startsWith('image/')) {
      const urls = this.data.files.filter((item) => item.mimeType.startsWith('image/')).map((item) => item.url);
      return wx.previewImage({ current: file.url, urls });
    }
    wx.showLoading({ title: '正在打开' });
    wx.cloud.downloadFile({ fileID: file.fileId, success: ({ tempFilePath }) => wx.openDocument({ filePath: tempFilePath, showMenu: true }), complete: () => wx.hideLoading() });
  },
  callStore() {
    const phone = this.data.order.store.contactPhone || this.data.order.merchant.contactPhone;
    if (!phone) return wx.showToast({ title: '门店暂未设置联系电话', icon: 'none' });
    wx.makePhoneCall({ phoneNumber: phone });
  },
  fail(error) { wx.showToast({ title: error.message || '请求失败', icon: 'none' }); this.setData({ loading: false }); },
});
