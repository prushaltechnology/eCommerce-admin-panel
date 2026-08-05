import { message } from 'antd';
import { useCallback, useState } from 'react';
import { getCustomOrders, updateCustomOrderStatus } from '../api/customOrders';

export default function useCustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastQuery, setLastQuery] = useState(null);
  const [lastDate, setLastDate] = useState(null);
  const [ordersStats, setOrdersStats] = useState({
    total: 0,
    pending: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  const fetchOrders = useCallback(async (query = null, date = null) => {
    setLoading(true);
    try {
      const res = await getCustomOrders(query, null, 10, date);
      if (res.success) {
        setOrders(res.orders || []);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setLastQuery(query);
        setLastDate(date);
        setOrdersStats({
          total: res.totalOrders ?? 0,
          pending: res.pendingOrders ?? 0,
          dispatched: res.dispatchedOrders ?? 0,
          delivered: res.deliveredOrders ?? 0,
          cancelled: res.cancelledOrders ?? 0,
          totalRevenue: res.revenue ?? 0,
        });
      } else {
        throw new Error(res.message || 'Failed to load custom orders');
      }
    } catch (err) {
      message.error(err.message || 'Failed to load custom orders');
      setOrders([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMoreOrders = useCallback(async () => {
    if (!hasMore || !nextCursor) return;
    setFetchingMore(true);
    try {
      const res = await getCustomOrders(lastQuery, nextCursor, 10, lastDate);
      if (res.success) {
        setOrders(prev => [...prev, ...(res.orders || [])]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } else {
        throw new Error(res.message || 'Failed to load more custom orders');
      }
    } catch (err) {
      message.error(err.message || 'Failed to load more custom orders');
    } finally {
      setFetchingMore(false);
    }
  }, [hasMore, lastQuery, lastDate, nextCursor]);

  const updateOrder = useCallback(async (orderId, status, note = '') => {
    setLoading(true);
    try {
      const res = await updateCustomOrderStatus(orderId, status, note);
      if (!res.success) throw new Error(res.message || 'Failed to update custom order');
      return res;
    } catch (err) {
      message.error(err.message || 'Failed to update custom order');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    loading,
    fetchingMore,
    fetchOrders,
    fetchMoreOrders,
    nextCursor,
    hasMore,
    ordersStats,
    updateOrder,
  };
}