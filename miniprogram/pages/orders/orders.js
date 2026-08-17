const { request } = require('../../utils/api');
const { decorateOrder } = require('../../utils/order');

Page({
  data: { loading: true, orders: [], filtered: [], active: 'ALL', filters: [{ key: 'ALL', label: '全部' }, { key: 'ACTIVE', label: '进行中' }, { key: 'COMPLETED', label: '已完成' }] },
  onShow() { this.load(); },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },
  async load() {
    try {
      const orders = (await request('/client/orders')).map(decorateOrder);
      this.setData({ orders, loading: false });
      this.filter(this.data.active);
    } catch (error) { wx.showToast({ title: error.message || '加载失败', icon: 'none' }); this.setData({ loading: false }); }
  },
  changeFilter(event) { this.filter(event.currentTarget.dataset.key); },
  filter(active) {
    const filtered = this.data.orders.filter((order) => active === 'ALL' || (active === 'COMPLETED' ? order.status === 'COMPLETED' : !['COMPLETED', 'CANCELLED'].includes(order.status)));
    this.setData({ active, filtered });
  },
  openOrder(event) { wx.navigateTo({ url: `/pages/order/order?token=${encodeURIComponent(event.currentTarget.dataset.token)}` }); },
  goHome() { wx.switchTab({ url: '/pages/index/index' }); },
});
