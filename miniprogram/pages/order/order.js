const { request } = require('../../utils/api');
const labels = { PENDING_CONFIRMATION:'等待门店确认',WAITING_MAKEUP:'等待化妆师认领',MAKEUP_IN_PROGRESS:'化妆进行中',WAITING_PHOTOGRAPHY:'等待摄影师认领',PHOTOGRAPHY_IN_PROGRESS:'摄影进行中',WAITING_SELECTION:'请确认已在外部软件完成选片',WAITING_RETOUCH:'等待后期修片',COMPLETED:'照片已交付',CANCELLED:'订单已取消' };

Page({
  data: { loading: true, token: '', order: null, statusLabel: '' },
  onLoad(options) { this.setData({ token: options.token || '' }); this.load(); },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },
  async load() { try { const order = await request(`/client/orders/${this.data.token}`); this.setData({ order, statusLabel: labels[order.status] || order.status, loading: false }); } catch (error) { this.fail(error); } },
  async confirmAddon(event) { const id = event.currentTarget.dataset.id; try { await request(`/client/orders/${this.data.token}/value-added/${id}/confirm`, { method:'POST' }); await this.load(); } catch (error) { this.fail(error); } },
  async disputeAddon(event) { const id = event.currentTarget.dataset.id; const modal = await wx.showModal({ title:'提交异议', editable:true, placeholderText:'请输入异议原因' }); if (!modal.confirm || !modal.content) return; try { await request(`/client/orders/${this.data.token}/value-added/${id}/dispute`, { method:'POST', data:{ reason:modal.content } }); await this.load(); } catch (error) { this.fail(error); } },
  async confirmSelection() { const modal = await wx.showModal({ title:'确认选片完成', content:'请确认您已在门店指定的软件中完成选片。' }); if (!modal.confirm) return; try { await request(`/client/orders/${this.data.token}/selection-confirm`, { method:'POST' }); await this.load(); } catch (error) { this.fail(error); } },
  fail(error) { wx.showToast({ title:error.message || '请求失败', icon:'none' }); },
});
