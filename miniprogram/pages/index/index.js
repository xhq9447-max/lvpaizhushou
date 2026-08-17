Page({
  data: { merchantCode: '' },
  onCodeInput(event) { this.setData({ merchantCode: event.detail.value.trim().toUpperCase() }); },
  openCreate() {
    if (!this.data.merchantCode) return wx.showToast({ title: '请输入商家码', icon: 'none' });
    wx.navigateTo({ url: `/pages/create/create?merchantCode=${encodeURIComponent(this.data.merchantCode)}` });
  },
  scan() {
    wx.scanCode({ success: ({ path, result }) => {
      const value = path || result || '';
      const match = value.match(/merchantCode=([^&]+)/);
      if (!match) return wx.showToast({ title: '二维码格式不正确', icon: 'none' });
      wx.navigateTo({ url: `/pages/create/create?merchantCode=${encodeURIComponent(decodeURIComponent(match[1]))}` });
    } });
  },
});
