import { message } from "antd";
import { useCallback, useState } from "react";
import {
  createAdminOrder,
  getAllOrders,
  getCustomers,
  updateOrderStatus,
  cancelCustomerOrder,
} from "../api/orders";
import { getAllProducts } from "../api/products";

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [ordersNextCursor, setOrdersNextCursor] = useState(null);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersQuery, setOrdersQuery] = useState(null);
  const [ordersFrom, setOrdersFrom] = useState(null);
  const [ordersStartDate, setOrdersStartDate] = useState(null);
  const [ordersEndDate, setOrdersEndDate] = useState(null);
  const [ordersStats, setOrdersStats] = useState({
    total: 0,
    pending: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersNextCursor, setCustomersNextCursor] = useState(null);
  const [customersHasMore, setCustomersHasMore] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [ordersDate, setOrdersDate] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchOrders = useCallback(
  async (orderFrom = null, query = null, date = null) => {
    setLoading(true);
    try {
      const res = await getAllOrders(
        orderFrom,
        query,
        null,
        null,
        10,
        date,
      );
      if (res.success) {
        setOrders(res.orders || []);
        setOrdersNextCursor(res.nextCursor);
        setOrdersHasMore(res.hasMore);
        setOrdersQuery(query);
        setOrdersFrom(orderFrom);
        setOrdersDate(date);
        setOrdersStats({
          total: res.totalOrders ?? 0,
          pending: res.pendingOrders ?? 0,
          dispatched: res.dispatchedOrders ?? 0,
          delivered: res.deliveredOrders ?? 0,
          cancelled: res.cancelledOrders ?? 0,
          totalRevenue: res.revenue ?? 0,
        });
      } else throw new Error(res.message || "Failed to fetch orders");
    } catch (err) {
      message.error(err.message || "Failed to load orders");
      setOrders([]);
      setOrdersNextCursor(null);
      setOrdersHasMore(false);
    } finally {
      setLoading(false);
    }
  },
  [],
);

const fetchMoreOrders = useCallback(async () => {
  if (!ordersHasMore || !ordersNextCursor) return;
  setFetchingMore(true);
  try {
    const res = await getAllOrders(
      ordersFrom,
      ordersQuery,
      null,
      ordersNextCursor,
      10,
      ordersDate,
    );
    if (res.success) {
      setOrders((prev) => {
        const existingIds = new Set(prev.map((order) => order.id));
        const newOrders = (res.orders || []).filter(
          (order) => !existingIds.has(order.id),
        );
        return [...prev, ...newOrders];
      });
      setOrdersNextCursor(res.nextCursor);
      setOrdersHasMore(res.hasMore);
    } else {
      throw new Error(res.message || "Failed to fetch more orders");
    }
  } catch (err) {
    message.error(err.message || "Failed to load more orders");
  } finally {
    setFetchingMore(false);
  }
}, [ordersFrom, ordersHasMore, ordersNextCursor, ordersQuery, ordersDate]);

  const fetchCustomers = useCallback(
    async (search = "", append = false) => {
      const normalizedSearch = (search || "").trim();
      const after = append ? customersNextCursor : null;
      setCustomersLoading(true);

      try {
        const res = await getCustomers(normalizedSearch || null, after);
        if (!res.success)
          throw new Error(res.message || "Failed to fetch customers");
        const transformed = (res.customers || []).map((c) => ({
          id: c.id,
          name:
            `${c.user?.firstName || ""} ${c.user?.lastName || ""}`.trim() ||
            `Customer ${c.id}`,
          email: c.user?.email || "N/A",
          phone: c.user?.phone || "N/A",
          addresses: c.addresses || [],
        }));
        setCustomers((prev) =>
          append ? [...prev, ...transformed] : transformed,
        );
        setCustomersNextCursor(res.nextCursor);
        setCustomersHasMore(res.hasMore);
        setCustomerSearch(normalizedSearch);
        return transformed;
      } catch (err) {
        message.error("Failed to fetch customers: " + err.message);
        if (!append) setCustomers([]);
        return [];
      } finally {
        setCustomersLoading(false);
      }
    },
    [customersNextCursor],
  );

  const upsertCustomer = useCallback((customer) => {
    if (!customer || !customer.id) return;
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      const transformed = {
        id: customer.id,
        name:
          customer.name ||
          `${customer.user?.firstName || ""} ${customer.user?.lastName || ""}`.trim() ||
          `Customer ${customer.id}`,
        email: customer.email || customer.user?.email || "N/A",
        phone: customer.phone || customer.user?.phone || "N/A",
        addresses: customer.addresses || [],
      };
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...transformed };
        return next;
      }
      return [transformed, ...prev];
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await getAllProducts(50, null);
      if (!res.success)
        throw new Error(res.message || "Failed to fetch products");
      const transformed = (res.products || []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price || 0,
        discountPrice: p.discountPrice || 0,
        bulkOrderPrice: p.bulkOrderPrice || 0,
        stock: p.stock || {},
        status: p.isActive ? "active" : "inactive",
        isActive: p.isActive,
        category: p.category || null,
        sku: p.sku || `PRD-${p.id}`,
        images: p.images || [],
        unit: p.unit,
        measureValue: p.measureValue,
      }));
      setProducts(transformed);
      return transformed;
    } catch (err) {
      message.error("Failed to fetch products: " + err.message);
      setProducts([]);
      return [];
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const createOrder = useCallback(
    async ({
      customerId = null,
      shippingAddress = null,
      orderType = "normal",
      paymentMethod = "cash",
      purchaseType,
      notes,
      isAdvanceBooking = false,
      advanceDeliveryDatetime = null,
      items = [],
      deliveryCharge = 0,
    }) => {
      try {
        const res = await createAdminOrder(
          customerId,
          shippingAddress,
          items,
          orderType,
          paymentMethod,
          purchaseType,
          notes,
          isAdvanceBooking,
          advanceDeliveryDatetime,
          deliveryCharge,
        );

        if (res.success) {
          fetchOrders();
        } else {
          message.error(res.message || "Failed to create order");
        }
        return res;
      } catch (err) {
        message.error("Failed to create order: " + err.message);
        return { success: false, message: err.message };
      }
    },
    [fetchOrders],
  );

  const changeOrderStatus = useCallback(async (orderId, status, note = "") => {
    try {
      const res = await updateOrderStatus(orderId, status, note);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
        );
        message.success("Order status updated");
      } else {
        message.error(res.message || "Failed to update order status");
      }
      return res;
    } catch (err) {
      message.error("Failed to update order status: " + err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const cancelOrder = useCallback(
    async (
      orderId,
      cancellationReason = "Cancelled by admin",
      cancellationNote = "",
    ) => {
      try {
        const res = await cancelCustomerOrder(
          orderId,
          cancellationReason,
          cancellationNote,
        );

        if (res.success) {
          setOrders((prev) =>
            prev.map((order) =>
              String(order.id) === String(orderId)
                ? {
                    ...order,
                    status: "cancelled",
                  }
                : order,
            ),
          );

          setOrdersStats((prev) => ({
            ...prev,
            cancelled: prev.cancelled + 1,
          }));

          message.success(res.message || "Order cancelled successfully");
        } else {
          message.error(res.message || "Failed to cancel order");
        }

        return res;
      } catch (err) {
        message.error("Failed to cancel order: " + err.message);

        return {
          success: false,
          message: err.message,
        };
      }
    },
    [],
  );

  return {
    orders,
    loading,
    fetchingMore,
    fetchOrders,
    fetchMoreOrders,
    ordersNextCursor,
    ordersHasMore,
    ordersStats,

    customers,
    customersLoading,
    customersHasMore,
    fetchCustomers,

    products,
    productsLoading,
    fetchProducts,

    createOrder,
    changeOrderStatus,
    cancelOrder,
    upsertCustomer,
  };
}
