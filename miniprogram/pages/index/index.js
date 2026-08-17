const { request } = require('../../utils/api');
const { decorateOrder } = require('../../utils/order');

Page({
  data: { merchantCode: '', recentOrders: [], loading: true },
  onLoad() { this.setData({ merchantCode: wx.getStorageSync('merchantCode') || '' }); },
  onShow() { this.loadOrders(); },
  async loadOrders() {
    try {
      const orders = await request('/client/orders');
      this.setData({ recentOrders: orders.slice(0, 2).map(decorateOrder), loading: false });
    } catch (error) { this.setData({ loading: false }); }
  },
  onCodeInput(event) { this.setData({ merchantCode: event.detail.value.trim().toUpperCase() }); },
  openCreate() {
    if (!this.data.merchantCode) return wx.showToast({ title: '请输入商家码', icon: 'none' });
    wx.setStorageSync('merchantCode', this.data.merchantCode);
    wx.navigateTo({ url: `/pages/create/create?merchantCode=${encodeURIComponent(this.data.merchantCode)}` });
  },
  openOrder(event) { wx.navigateTo({ url: `/pages/order/order?token=${encodeURIComponent(event.currentTarget.dataset.token)}` }); },
  openOrders() { wx.switchTab({ url: '/pages/orders/orders' }); },
  scan() {
    wx.scanCode({ success: ({ path, result }) => {
      const value = path || result || '';
      const match = value.match(/[?&]?(?:merchantCode|scene)=([^&]+)/i);
      const code = match ? decodeURIComponent(match[1]).trim().toUpperCase() : value.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,50}$/.test(code)) return wx.showToast({ title: '门店二维码格式不正确', icon: 'none' });
      wx.setStorageSync('merchantCode', code);
      wx.navigateTo({ url: `/pages/create/create?merchantCode=${encodeURIComponent(code)}` });
    } });
  },
});
