const { request } = require('../../utils/api');

Page({
  data: { loading: true, saving: false, merchantCode: '', merchantName: '', stores: [], storeIndex: 0, customerName: '', customerPhone: '', packageName: '', notes: '' },
  onLoad(options) { this.setData({ merchantCode: options.merchantCode || '' }); this.loadMerchant(); },
  async loadMerchant() { try { const data = await request(`/client/merchants/${this.data.merchantCode}`); this.setData({ merchantName: data.name, stores: data.stores, loading: false }); } catch (error) { this.fail(error); } },
  input(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  chooseStore(event) { this.setData({ storeIndex: Number(event.detail.value) }); },
  async submit() {
    const store = this.data.stores[this.data.storeIndex];
    if (!this.data.customerName || !this.data.customerPhone || !store) return wx.showToast({ title: '请完整填写姓名、手机号和门店', icon: 'none' });
    this.setData({ saving: true });
    try {
      const order = await request('/client/orders', { method: 'POST', data: { merchantCode: this.data.merchantCode, storeId: store.id, customerName: this.data.customerName, customerPhone: this.data.customerPhone, packageName: this.data.packageName || undefined, notes: this.data.notes || undefined } });
      wx.redirectTo({ url: `/pages/order/order?token=${encodeURIComponent(order.accessToken)}` });
    } catch (error) { this.fail(error); } finally { this.setData({ saving: false }); }
  },
  fail(error) { wx.showToast({ title: error.message || '请求失败', icon: 'none' }); this.setData({ loading: false }); },
});
