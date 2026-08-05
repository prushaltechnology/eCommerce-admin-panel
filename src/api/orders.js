// Orders API Functions
import { GRAPHQL_QUERIES, graphqlRequest } from "./graphql";

// Get all customers for manual order
export const getCustomers = async (search = null, after = null, first = 10) => {
  try {
    const variables = {
      first,
      ...(search ? { search } : {}),
      ...(after ? { after } : {}),
    };
    const data = await graphqlRequest(GRAPHQL_QUERIES.GET_CUSTOMERS, variables);
    return {
      success: true,
      customers: data.customers?.customers || [],
      nextCursor: data.customers?.nextCursor || null,
      hasMore: data.customers?.hasMore || false,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to fetch customers",
    };
  }
};

// Get all products for manual order
export const getProductsForOrder = async () => {
  try {
    const data = await graphqlRequest(GRAPHQL_QUERIES.GET_PRODUCTS_SIMPLE, {
      first: 5,
    });
    return {
      success: true,
      products: data.products?.products || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to fetch products",
    };
  }
};

export const createAdminOrder = async (
  customerId,
  shippingAddress,
  items,
  orderType,
  paymentMethod,
  purchaseType,
  notes,
  isAdvanceBooking,
  advanceDeliveryDatetime,
  deliveryCharge = 0,
) => {
  const response = await graphqlRequest(GRAPHQL_QUERIES.CREATE_ADMIN_ORDER, {
    customerId: customerId,

    shippingAddress,

    items,

    orderType,

    paymentMethod,
    purchaseType,
    notes,

    isAdvanceBooking,

    advanceDeliveryDatetime,

    deliveryCharge,
  });

  return {
    success: true,
    order: response.createAdminOrder.order,
  };
};

export const calculateDeliveryCharge = async (address, phone) => {
  try {
    const data = await graphqlRequest(
      GRAPHQL_QUERIES.CALCULATE_DELIVERY_CHARGE,
      {
        address,
        phone,
      },
    );
    const result = data?.calculateDeliveryCharge;
    return {
      success: result?.success ?? false,
      deliveryCharge: result?.deliveryCharge ?? 0,
      message: result?.message || "",
    };
  } catch (error) {
    return {
      success: false,
      deliveryCharge: 0,
      message: error.message || "Failed to calculate delivery charge",
    };
  }
};

export const getAllOrders = async (
  orderFrom = null,
  query = null,
  orderType = null,
  after = null,
  first = 10,
  date = null,
) => {
  try {
    const variables = {
      first,
      ...(after ? { after } : {}),
      ...(orderFrom ? { orderFrom } : {}),
      ...(query ? { query } : {}),
      ...(orderType ? { orderType } : {}),
      ...(date ? { date } : {}),
    };

    const data = await graphqlRequest(
      GRAPHQL_QUERIES.GET_ALL_ORDERS,
      variables,
    );

    return {
      success: true,
      orders: data.allOrders?.orders || [],
      totalOrders: data.allOrders?.totalOrders ?? 0,
      pendingOrders: data.allOrders?.pendingOrders ?? 0,
      dispatchedOrders: data.allOrders?.dispatchedOrders ?? 0,
      deliveredOrders: data.allOrders?.deliveredOrders ?? 0,
      cancelledOrders: data.allOrders?.cancelledOrders ?? 0,
      revenue: data.allOrders?.revenue ?? 0,
      nextCursor: data.allOrders?.nextCursor || null,
      hasMore: data.allOrders?.hasMore || false,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to fetch orders",
    };
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, note = "") => {
  try {
    const data = await graphqlRequest(GRAPHQL_QUERIES.UPDATE_ORDER_STATUS, {
      orderId: parseInt(orderId, 10),
      status,
      note,
    });

    if (data && data.updateOrderStatus) {
      if (data.updateOrderStatus.success === false) {
        return {
          success: false,
          message: "Failed to update order status",
        };
      }
      return {
        success: true,
        order: data.updateOrderStatus.order,
      };
    }

    return {
      success: false,
      message: "Failed to update order status",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to update order status",
    };
  }
};

export const cancelCustomerOrder = async (
  orderId,
  cancellationReason,
  cancellationNote = ""
) => {
  try {
    const data = await graphqlRequest(
      GRAPHQL_QUERIES.CANCEL_CUSTOMER_ORDER,
      {
        orderId: parseInt(orderId, 10),
        cancellationReason,
        cancellationNote,
      }
    );

    const result = data?.cancelCustomerOrder;

    if (!result) {
      return {
        success: false,
        message: "Failed to cancel order",
      };
    }

    return {
      success: result.success ?? false,
      message:
        result.message ||
        (result.success
          ? "Order cancelled successfully"
          : "Failed to cancel order"),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to cancel order",
    };
  }
};

export const addShippingAddress = async (customerId, values) => {
  try {
    const mutation = `
      mutation AddShippingAddress(
        $customerId: ID!,
        $addressLine: String!,
        $city: String!,
        $state: String!,
        $pincode: String!,
        $landmark: String
      ) {

        addShippingAddress(
          customerId: $customerId
          addressLine: $addressLine
          city: $city
          state: $state
          pincode: $pincode
          landmark: $landmark
        ) {

          address {
            id
            addressLine
            city
            state
            pincode
            isDefault
            landmark
          }
        }
      }
    `;

    const variables = {
      customerId: customerId,
      addressLine: values.addressLine,
      city: values.city,
      state: values.state,
      pincode: values.pincode,
      landmark: values.landmark || "",
    };

    const data = await graphqlRequest(mutation, variables);

    if (data?.addShippingAddress?.address) {
      return {
        success: true,
        address: data.addShippingAddress.address,
      };
    }

    return {
      success: false,
      message: "Failed to add address",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to add address",
    };
  }
};

// Fetch order tracking data
export const getOrderTracking = async (orderId) => {
  try {
    const query = `
      query GetOrderTracking($orderId: Int!) {
        orderTracking(orderId: $orderId) {
          status
          notes
          updatedAt
          date
          time
        }
      }
    `;
    const data = await graphqlRequest(query, { orderId: Number(orderId) });
    return { success: true, tracking: data.orderTracking || [] };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to fetch tracking",
    };
  }
};
