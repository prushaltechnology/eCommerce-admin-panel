import { getAllOrders, updateOrderStatus } from './orders';

export const getBulkOrders = async (query = null, after = null, first = 10, date = null) => {
  return await getAllOrders(null, query, 'bulk', after, first, date);
};

export const updateBulkOrderStatus = async (orderId, status, note = '') => {
  return await updateOrderStatus(orderId, status, note);
};