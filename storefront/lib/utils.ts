export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: '待處理/待付款',
    PAID: '已付款',
    SHIPPED: '已出貨',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };
  return labels[status] || status;
};
