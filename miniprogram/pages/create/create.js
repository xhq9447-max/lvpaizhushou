const { request } = require('../../utils/api');

Page({
  data: {
    loading: true, saving: false, merchantCode: '', merchantName: '', stores: [], storeIndex: 0,
    customerName: '', customerPhone: '', packageName: '', appointmentDate: '', appointmentTime: '', notes: '',
  },
  onLoad(options) { this.setData({ merchantCode: (options.merchantCode || '').toUpperCase() }); this.load(); },
  async load() {
    try {
      const [merchant, profile] = await Promise.all([
        request(`/client/merchants/${this.data.merchantCode}`),
        request('/client/me').catch(() => ({ name: '', phone: '' })),
      ]);
      this.setData({ merchantName: merchant.name, stores: merchant.stores, customerName: profile.name, customerPhone: profile.phone, loading: false });
    } catch (error) { this.fail(error); }
  },
  input(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  chooseStore(event) { this.setData({ storeIndex: Number(event.detail.value) }); },
  chooseDate(event) { this.setData({ appointmentDate: event.detail.value }); },
  chooseTime(event) { this.setData({ appointmentTime: event.detail.value }); },
  async submit() {
    const store = this.data.stores[this.data.storeIndex];
    const phone = this.data.customerPhone.trim();
    if (!this.data.customerName.trim() || !/^1\d{10}$/.test(phone) || !store) return wx.showToast({ title: '请填写姓名、11位手机号和门店', icon: 'none' });
    this.setData({ saving: true });
    try {
      const appointmentAt = this.data.appointmentDate ? `${this.data.appointmentDate}T${this.data.appointmentTime || '09:00'}:00+08:00` : undefined;
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
