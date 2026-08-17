const statusLabels = {
  PENDING_CONFIRMATION: '等待门店确认',
  WAITING_MAKEUP: '等待化妆',
  MAKEUP_IN_PROGRESS: '化妆进行中',
  WAITING_PHOTOGRAPHY: '等待拍摄',
  PHOTOGRAPHY_IN_PROGRESS: '拍摄进行中',
  WAITING_SELECTION: '等待选片确认',
  WAITING_RETOUCH: '后期修片中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const progressSteps = [
  ['PENDING_CONFIRMATION', '门店确认'],
  ['WAITING_MAKEUP', '化妆准备'],
  ['MAKEUP_IN_PROGRESS', '化妆服务'],
  ['WAITING_PHOTOGRAPHY', '拍摄准备'],
  ['PHOTOGRAPHY_IN_PROGRESS', '拍摄服务'],
  ['WAITING_SELECTION', '客户选片'],
  ['WAITING_RETOUCH', '后期修片'],
  ['COMPLETED', '交付完成'],
];

function decorateOrder(order) {
  const current = progressSteps.findIndex(([status]) => status === order.status);
  return {
    ...order,
    statusLabel: statusLabels[order.status] || order.status,
    createdDate: formatDate(order.createdAt),
    appointmentText: order.appointmentAt ? formatDateTime(order.appointmentAt) : '待门店确认',
    progress: progressSteps.map(([status, label], index) => ({ status, label, done: current >= index, current: current === index })),
  };
}

function formatDate(value) { return value ? String(value).slice(0, 10) : ''; }
function formatDateTime(value) { return value ? String(value).replace('T', ' ').slice(0, 16) : ''; }

module.exports = { statusLabels, decorateOrder, formatDate, formatDateTime };
