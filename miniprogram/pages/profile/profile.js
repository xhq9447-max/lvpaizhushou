const { request } = require('../../utils/api');

Page({
  data: { loading: true, profile: { name: '', phone: '', orderCount: 0 } },
  onShow() { this.load(); },
  async load() {
    try { const profile = await request('/client/me'); this.setData({ profile: { ...profile, avatar: profile.name ? profile.name.slice(0, 1) : '旅' }, loading: false }); }
    catch (error) { this.setData({ loading: false }); }
  },
  openOrders() { wx.switchTab({ url: '/pages/orders/orders' }); },
  contact() { wx.showModal({ title: '使用帮助', content: '订单问题请进入订单详情联系对应门店；系统问题可向门店工作人员反馈。', showCancel: false }); },
  privacy() { wx.showModal({ title: '隐私说明', content: '姓名、手机号、微信身份及上传文件仅用于旅拍订单履约和客户服务。', showCancel: false }); },
});
