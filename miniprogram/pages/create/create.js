const { request } = require('../../utils/api');

Page({
  data: {
    loading: true, saving: false, authorizing: false, loadError: '', merchantCode: '', merchantName: '',
    stores: [], storeIndex: 0, selectedStore: null, requestedStoreId: '', customerName: '', customerPhone: '', contactInitial: '微', contactAuthorized: false,
    packageName: '', appointmentDate: '', appointmentTime: '', notes: '', minDate: '',
  },
  onLoad(options) {
    const merchantCode = decodeURIComponent(options.merchantCode || options.scene || wx.getStorageSync('merchantCode') || '').trim().toUpperCase();
    this.setData({ merchantCode, requestedStoreId: options.storeId || '', minDate: formatDate(new Date()) });
    if (!merchantCode) return this.setData({ loading: false, loadError: '二维码缺少门店信息，请重新扫码' });
    wx.setStorageSync('merchantCode', merchantCode);
    this.load();
  },
  async load() {
    this.setData({ loading: true, loadError: '' });
    try {
      const [merchant, profile] = await Promise.all([
        request(`/client/merchants/${this.data.merchantCode}`),
        request('/client/me').catch(() => ({ name: '', phone: '' })),
      ]);
      const storeIndex = Math.max(0, merchant.stores.findIndex((store) => store.id === this.data.requestedStoreId));
      const selectedStore = merchant.stores[storeIndex] || null;
      if (!selectedStore) throw new Error('该二维码暂未配置可用门店');
      this.setData({
        merchantName: merchant.name,
        stores: merchant.stores,
        storeIndex,
        selectedStore,
        customerName: profile.name || '',
        customerPhone: profile.phone || '',
        contactInitial: (profile.name || '微').slice(0, 1),
        contactAuthorized: Boolean(profile.phone),
        loading: false,
      });
    } catch (error) {
      this.setData({ loading: false, loadError: error.message || '门店信息加载失败' });
    }
  },
  retry() { this.load(); },
  async authorizeContact(event) {
    const phoneCode = event.detail && event.detail.code;
    if (!phoneCode) return wx.showToast({ title: '需要允许使用微信手机号', icon: 'none' });
    this.setData({ authorizing: true });
    try {
      let nickname = '';
      try {
        const user = await wx.getUserProfile({ desc: '用于创建旅拍服务订单' });
        nickname = user.userInfo && user.userInfo.nickName ? user.userInfo.nickName : '';
      } catch (_) {}
      const contact = await request('/client/contact', { method: 'POST', data: { phoneCode, nickname } });
      this.setData({ customerName: contact.name || '微信用户', customerPhone: contact.phone, contactInitial: (contact.name || '微').slice(0, 1), contactAuthorized: true });
      wx.showToast({ title: '联系人已授权', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: error.message || '微信授权失败', icon: 'none' });
    } finally {
      this.setData({ authorizing: false });
    }
  },
  onPackageInput(event) { this.setData({ packageName: event.detail.value }); },
  onNotesInput(event) { this.setData({ notes: event.detail.value }); },
  chooseDate(event) { this.setData({ appointmentDate: event.detail.value }); },
  async submit() {
    const store = this.data.selectedStore;
    const phone = this.data.customerPhone.trim();
    if (!this.data.contactAuthorized || !this.data.customerName.trim() || !/^1\d{10}$/.test(phone)) return wx.showToast({ title: '请先授权微信联系人', icon: 'none' });
    if (!store) return wx.showToast({ title: '二维码门店信息无效，请重新扫码', icon: 'none' });
    if (!this.data.appointmentDate) return wx.showToast({ title: '请选择预约日期', icon: 'none' });
    this.setData({ saving: true });
    try {
      const appointmentAt = `${this.data.appointmentDate}T09:00:00+08:00`;
      const order = await request('/client/orders', { method: 'POST', data: {
        merchantCode: this.data.merchantCode,
        storeId: store.id,
        customerName: this.data.customerName.trim(),
        customerPhone: phone,
        packageName: this.data.packageName.trim() || undefined,
        appointmentAt,
        notes: this.data.notes.trim() || undefined,
      } });
      wx.showToast({ title: '订单已提交', icon: 'success' });
      setTimeout(() => wx.redirectTo({ url: `/pages/order/order?token=${encodeURIComponent(order.accessToken)}` }), 500);
    } catch (error) { this.fail(error); } finally { this.setData({ saving: false }); }
  },
  fail(error) { wx.showToast({ title: error.message || '请求失败', icon: 'none' }); this.setData({ loading: false }); },
});

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
