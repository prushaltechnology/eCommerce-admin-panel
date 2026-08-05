import { getAllOrders, updateOrderStatus } from './orders';

export const getCustomOrders = async (query = null, after = null, first = 10, date = null) => {
  return await getAllOrders(null, query, 'custom', after, first, date);
};

export const updateCustomOrderStatus = async (orderId, status, note = '') => {
  return await updateOrderStatus(orderId, status, note);
};