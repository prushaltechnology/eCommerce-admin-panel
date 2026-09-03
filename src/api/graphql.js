// GraphQL Client Configuration

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_URI;

// GraphQL request function
export const graphqlRequest = async (query, variables = {}) => {
  try {
    const queryString =
      typeof query === "object" && query.kind === "Document"
        ? query.loc?.source?.body || query.definitions?.[0]?.loc?.source?.body
        : query;

    // ───────────────── CHECK FILE ─────────────────
    const hasFile = Object.values(variables).some(
      (value) => value instanceof File,
    );
    let response;
    // ───────────────── FILE UPLOAD REQUEST ─────────────────
    if (hasFile) {
      const formData = new FormData();
      const operations = {
        query: queryString,
        variables: { ...variables },
      };
      const map = {};
      let fileIndex = 0;
      Object.keys(variables).forEach((key) => {
        if (variables[key] instanceof File) {
          map[fileIndex] = [`variables.${key}`];
          operations.variables[key] = null;
          fileIndex++;
        }
      });

      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      fileIndex = 0;
      Object.keys(variables).forEach((key) => {
        if (variables[key] instanceof File) {
          formData.append(fileIndex, variables[key]);
          fileIndex++;
        }
      });

      response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          ...(localStorage.getItem("authToken") && {
            Authorization: `JWT ${localStorage.getItem("authToken")}`,
          }),
        },
        body: formData,
      });
    } else {
      // ───────────────── NORMAL REQUEST ─────────────────
      response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          ...(localStorage.getItem("authToken") && {
            Authorization: `JWT ${localStorage.getItem("authToken")}`,
          }),
        },
        body: JSON.stringify({
          query: queryString,
          variables,
        }),
      });
    }

    const result = await response.json();
    // ───────────────── HANDLE ERRORS ─────────────────
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message;
      // console.error(
      //   'GraphQL Error:',
      //   errorMessage
      // );
      throw new Error(errorMessage);
    }
    return result.data;
  } catch (error) {
    // console.error(
    //   'GraphQL Error:',
    //   error
    // );
    throw error;
  }
};

// Authentication helper functions
export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
};

export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// GraphQL query templates
export const GRAPHQL_QUERIES = {
  // Authentication
  LOGIN: `
    mutation Login($email: String!, $password: String!) {
      tokenAuth(email: $email, password: $password) {
        token
        role
        employeeId
        roleName
        permissions {
          module
          access
          subModule
        }
        employeeId
        roleName
        permissions {
          module
          access
          subModule
        }
        user {
          id
          email
          role
          firstName
          lastName
          phone
          firstName
          lastName
          phone
        }
        
        
      }
    }
  `,

  GET_CATEGORIES: `
  query GetAllCategories($first: Int!, $after: String, $query: String) {
    allCategories(
      first: $first
      after: $after
      query: $query
    ) {
      categories {
        id
        name
        description
        isActive
        parent {
          id
          name
        }
      }

      nextCursor
      hasMore
      totalCategories
      activeCategories
      inactiveCategories
    }
  }
`,

  GET_ALL_PRODUCTS: `
    query GetAllProducts($first: Int!, $after: String, $search: String, $categoryId: Int, $isActive: Boolean) {
      products(first: $first, after: $after, search: $search, categoryId: $categoryId, isActive: $isActive) {
        products {
          id
          name
          description
          keywords
          shortDescription
          deliveryRuleDays
          price
          discountPrice
          bulkOrderPrice
          unit
          sku
          measureValue
          weight
          isActive
          isFeatured
          isWishlisted
          isAddedcart
          storefrontReservedQuantity
          systemReservedQuantity
          storefrontStock {
            quantity
            availableQuantity
          }
          systemStock {
            quantity
            availableQuantity
          }
          images {
            id
            image
            sortOrder
          }
          category {
            id
            name
          }
        }
        nextCursor
        hasMore
      }
    }
  `,

  CREATE_PRODUCT: `
  mutation CreateProduct(
    $categoryId: Int!,
    $name: String!,
    $keywords: [String!]
    $shortDescription: String,
    $description: String,
    $sku: String!,
    $price: Float!,
    $discountPrice: Float,
    $bulkOrderPrice: Float,
    $deliveryRuleDays: Int,
    $isActive: Boolean,
    $unit: String!,
    $measureValue: Decimal!,
    $weight: Decimal!,
    $isFeatured: Boolean,
    $storefrontQuantity: Int!,
    $systemQuantity: Int!,
    $storefrontReservedQuantity: Int!,
    $systemReservedQuantity: Int!
  ) {

    createProduct(
      categoryId: $categoryId
      name: $name
      keywords: $keywords
      shortDescription: $shortDescription
      description: $description
      sku: $sku
      price: $price
      discountPrice: $discountPrice
      bulkOrderPrice: $bulkOrderPrice
      deliveryRuleDays: $deliveryRuleDays
      isActive: $isActive
      unit: $unit
      measureValue: $measureValue
      weight: $weight
      isFeatured: $isFeatured
      storefrontQuantity: $storefrontQuantity
      systemQuantity: $systemQuantity
      storefrontReservedQuantity: $storefrontReservedQuantity
      systemReservedQuantity: $systemReservedQuantity
    ) {

      product {
        id
        name
        keywords
        shortDescription
        description
        deliveryRuleDays
        unit
        measureValue
        weight
        isFeatured

        stock {
          quantity
          reservedQuantity
        }
      }
    }
  }
`,

  UPDATE_PRODUCT: `
    mutation UpdateProduct($id: Int!, $name: String, $keywords: [String!], $shortDescription: String, $description: String, $sku: String, $price: Float, $discountPrice: Float,$bulkOrderPrice:Float, $deliveryRuleDays: Int, $isActive: Boolean, $isFeatured: Boolean, $unit: String, $measureValue: Decimal, $categoryId: Int, $storefrontQuantity: Int, $systemQuantity: Int, $storefrontReservedQuantity: Int, $systemReservedQuantity: Int, $weight: Decimal) {
      updateProduct(id: $id, name: $name, keywords: $keywords, shortDescription: $shortDescription, description: $description, sku: $sku, price: $price, discountPrice: $discountPrice, bulkOrderPrice:$bulkOrderPrice, deliveryRuleDays: $deliveryRuleDays, isActive: $isActive, isFeatured: $isFeatured, unit: $unit, measureValue: $measureValue, categoryId: $categoryId, storefrontQuantity: $storefrontQuantity, systemQuantity: $systemQuantity, storefrontReservedQuantity: $storefrontReservedQuantity, systemReservedQuantity: $systemReservedQuantity, weight: $weight) {
        product {
          id
          name
          keywords
          shortDescription
          description
          deliveryRuleDays
          sku
          price
          discountPrice
          bulkOrderPrice
          isActive
          isFeatured
          unit
          measureValue
          weight
          category {
            id
          }
        }
      }
    }
  `,

  DELETE_PRODUCT: `
    mutation DeleteProduct($id: Int!) {
      deleteProduct(id: $id) {
        success
      }
    }
 `,

  ADD_PRODUCT_IMAGE: `
    mutation AddProductImage($productId: Int!, $image: String!, $sortOrder: Int) {
      addProductImage(productId: $productId, image: $image, sortOrder: $sortOrder) {
        product {
          id
          name
          images {
            id
            image
            sortOrder
          }
        }
      }
    }
  `,

  DELETE_PRODUCT_IMAGE: `
    mutation DeleteProductImage($imageId: Int!) {
      deleteProductImage(imageId: $imageId) {
        success
      }
    }
  `,

  GET_STOCK: `
    query GetStock($productId: Int!, $inventoryType: String!) {
      stock(productId: $productId, inventoryType: $inventoryType) {
        quantity
        reservedQuantity
        availableQuantity
      }
    }
  `,

  GET_PRODUCT_BY_ID: `
  query GetProductById($id: Int!) {
    product(id: $id) {
      id
      name
      description
      shortDescription
      deliveryRuleDays
      sku
      price
      discountPrice
      isActive
      unit
      measureValue
      weight
      isFeatured
      storefrontReservedQuantity
      systemReservedQuantity
      storefrontStock {
        quantity
        availableQuantity
      }
      systemStock {
        quantity
        availableQuantity
      }
      category {
        id
        name
      }
      images {
        id
        image
        sortOrder
      }
    }
  }
`,
  //   UPDATE_STOCK: `
  // mutation UpdateStock($productId: Int!, $quantity: Int!) {
  //   updateStock(productId: $productId, quantity: $quantity) {
  //     stock {
  //       id
  //       quantity
  //       reservedQuantity
  //     }
  //   }
  // }
  // `,
  UPDATE_STOCK: `
mutation UpdateStock(
  $productId: Int!,
  $inventoryType: String!,
  $quantity: Int!
) {
  updateStock(
    productId: $productId
    inventoryType: $inventoryType
    quantity: $quantity
  ) {
    stock {
      id
      inventoryType
      quantity
      reservedQuantity
    }
  }
}
`,

  GET_ALL_STOCKS: `
query GetAllStocks(
  $query: String,
  $first: Int!,
  $after: String,
  $inventoryType: String,
  $stockStatus: String
) {
  allStocks(
    query: $query,
    first: $first,
    after: $after,
    inventoryType: $inventoryType,
    stockStatus: $stockStatus
  ) {

    stocks {
      id
      inventoryType
      quantity
      reservedQuantity

      product {
        id
        name
        price
        unit

        images {
          id
          image
        }
      }
    }

    totalProducts
    lowStock
    criticalStock
    outOfStock
    nextCursor
    hasMore
  }
}
`,

  GET_BULK_ORDERS: `
    query GetBulkOrders($query: String) {
      allBulkOrderEnquiries(query: $query) {
        id
        status
        bulkOrderDetails
        createdAt
        items {
          id
          quantity
          product {
            id
            name
            images {
              image
            }
          }
        }
      }
    }
  `,

  CREATE_BULK_ORDER_ENQUIRY: `
    mutation CreateBulkOrderEnquiry($bulkOrderDetails: String!, $items: [BulkOrderItemInput!]!) {
      createBulkOrderEnquiry(bulkOrderDetails: $bulkOrderDetails, items: $items) {
        bulkOrder {
          id
          status
          bulkOrderDetails
          items {
            id
            quantity
            product {
              id
              name
            }
          }
        }
      }
    }
  `,

  UPDATE_BULK_ORDER_ENQUIRY: `
    mutation UpdateBulkOrderEnquiry($bulkOrderId: Int!, $status: String!, $bulkOrderDetails: String!) {
      updateBulkOrderEnquiry(bulkOrderId: $bulkOrderId, status: $status, bulkOrderDetails: $bulkOrderDetails) {
        bulkOrder {
          id
          status
          bulkOrderDetails
          items {
            id
            quantity
            product {
              id
              name
            }
          }
        }
      }
    }
  `,

  GET_DASHBOARD: `
    query AdminDashboard {
      dashboardStats {
        totalOrdersToday
        totalOrdersMonth
        totalRevenue
        totalProducts
        totalCustomers
        pendingOrders
        lowStockProducts
      }
      salesTrend {
        month
        sales
        orders
      }
      topProducts {
        id
        name
        totalSold
        storefrontStock {
      inventoryType
      quantity
      reservedQuantity
      availableQuantity
      isOutOfStock
    }

    systemStock {
      inventoryType
      quantity
      reservedQuantity
      availableQuantity
      isOutOfStock
    }
        price
      }
      recentProducts {
        id
        name
        storefrontStock {
      inventoryType
      quantity
      reservedQuantity
      availableQuantity
      isOutOfStock
    }

    systemStock {
      inventoryType
      quantity
      reservedQuantity
      availableQuantity
      isOutOfStock
    }
        price
      }
      recentOrders {
        id
        orderNumber
        customerName
        orderType
        status
        createdAt

        items {
          id
          quantity
          product {
            id
            name
            images {
              image
            }
          }
        }
      }
    }
  `,

  CREATE_ADMIN_ORDER: `
  mutation CreateAdminOrder(
    $customerId: Int,
    $shippingAddress: String,
    $orderType: String!,
    $paymentMethod: String,
    $purchaseType: String!,
    $notes: String,
    $isAdvanceBooking: Boolean!,
    $advanceDeliveryDatetime: DateTime,
    $items: [OrderItemInput!]!,
    $deliveryCharge: Float
  ) {
    createAdminOrder(
      customerId: $customerId,
      shippingAddress: $shippingAddress,
      orderType: $orderType,
      paymentMethod: $paymentMethod,
      purchaseType: $purchaseType,
      notes: $notes,
      isAdvanceBooking: $isAdvanceBooking,
      advanceDeliveryDatetime: $advanceDeliveryDatetime,
      items: $items,
      deliveryCharge: $deliveryCharge
    ) {
      order {
        id
        orderNumber
        orderType
        finalAmount
        customerName
        isAdvanceBooking
        advanceDeliveryDatetime
        items {
          product { name }
          quantity
          subtotal
        }
        status
        createdAt
      }
    }
  }
`,

  UPDATE_ORDER_STATUS: `
  mutation UpdateOrderStatus(
    $orderId: Int!
    $status: String!
    $note: String
  ) {
    updateOrderStatus(
      orderId: $orderId
      status: $status
      note: $note
    ) {
      success
      order {
        id
        status
      }
    }
  }
`,

  CANCEL_CUSTOMER_ORDER: `
  mutation CancelCustomerOrder(
    $orderId: Int!
    $cancellationReason: String!
    $cancellationNote: String
  ) {
    cancelCustomerOrder(
      orderId: $orderId
      cancellationReason: $cancellationReason
      cancellationNote: $cancellationNote
    ) {
      success
      message
    }
  }
`,

  GET_ALL_ORDERS: `
  query GetAllOrders(
    $first: Int!
    $after: String
    $orderFrom: String
    $query: String
    $orderType: String
    $date: Date
  ) {
    allOrders(
      first: $first
      after: $after
      orderFrom: $orderFrom
      query: $query
      orderType: $orderType
      date: $date
    ) {
      orders {
        id
        orderNumber
        orderType
        purchaseType
        status
        totalAmount
        approximateWeight
        finalAmount
        createdAt
        isAdvanceBooking
        advanceDeliveryDatetime

        customer {
          id
          firstName
          lastName
          email
          phone
        }
        notes
        shippingAddress

        borzoOrder {
          borzoOrderId
          orderName
          status
          statusDescription
          paymentAmount
          deliveryFee
          trackingUrl
          deliveryStatus

          pickup {
            address
            name
            phone
          }

          drop {
            address
            name
            phone
          }

          courier {
            courierId
            name
            phone
            photoUrl
            latitude
            longitude
          }
        }

        items {
          quantity
          subtotal

          product {
            id
            name
            unit
            measureValue
            price
            discountPrice

            images {
              image
            }
          }
        }
      }

      totalOrders
      pendingOrders
      dispatchedOrders
      deliveredOrders
      cancelledOrders
      revenue
      nextCursor
      hasMore
    }
  }
`,

  ADMIN_CREATE_CUSTOMER: `
  mutation AdminCreateCustomer(
    $email: String!,
    $password: String!,
    $firstName: String!,
    $lastName: String!,
    $phone: String!,
    $city: String!,
    $state: String!,
    $pincode: String!,
    $landmark: String
  ) {

    adminCreateCustomer(
      email: $email,
      password: $password,
      firstName: $firstName,
      lastName: $lastName,
      phone: $phone,

      city: $city,
      state: $state,
      pincode: $pincode,
      landmark: $landmark
    ) {

      customer {
        id
        customerId
      }
    }
  }
`,

  GET_CUSTOMERS: `
    query GetCustomers($search: String, $after: String, $first: Int = 10) {
      customers(first: $first, after: $after, search: $search) {
        customers {
          customerId
          id
          user {
          id
          id
            firstName
            lastName
            email
            phone
          }
          addresses {
            id
            name
            name
            addressLine
            city
            state
            pincode
            isDefault
            latitude
            longitude
          }
        }
        nextCursor
        hasMore
      }
    }
  `,

  GET_PRODUCTS_SIMPLE: `
    query GetProductsSimple($first: Int = 100) {
      products(first: $first) {
        products {
          id
          name
          sku
          price
          isActive
          storefrontReservedQuantity
    systemReservedQuantity

    storefrontStock {
      quantity
      reservedQuantity
      availableQuantity
    }

    systemStock {
      quantity
      reservedQuantity
      availableQuantity
    }
          stock {
            quantity
            reservedQuantity
            availableQuantity
            isOutOfStock
          }
          category {
            name
          }
        }
        nextCursor
        hasMore
      }
    }
  `,

  CALCULATE_DELIVERY_CHARGE: `
  mutation CalculateDeliveryCharge(
    $address: String!
    $phone: String!
    $productSubtotal: Float!
    $deliveryMode: String!
    $parcelWeight: Float
    $latitude: Float
    $longitude: Float
  ) {
    calculateDeliveryCharge(
      address: $address
      phone: $phone
      productSubtotal: $productSubtotal
      deliveryMode: $deliveryMode
      parcelWeight: $parcelWeight
      latitude: $latitude
      longitude: $longitude
    ) {
      success
      deliveryCharge
      customerDeliveryCharge
      deliveryDiscount
      eligibleForDiscount
      serviceable
      message
    }
  }
`,
  GET_REFUND_HISTORY: `
  query GetRefundHistory(
    $first: Int!
    $after: String
  ) {
    refundHistory(
      first: $first
      after: $after
    ) {
      total
      pending
      approved
      rejected

      refunds {
        id
        orderNumber
        customerName
        customerPhone
        finalAmount
        status
        paymentStatus
        refundStatus
        refundAmount
        cancellationReason
        cancellationNote
        cancelledAt
        refundProcessedAt
        refundAdminNote

        refundProcessedBy {
          firstName
        }
      }

      nextCursor
      hasMore
    }
  }
`,

  REJECT_REFUND: `
  mutation RejectRefund(
    $orderId: Int!
    $rejectionReason: String!
  ) {
    rejectRefund(
      orderId: $orderId
      rejectionReason: $rejectionReason
    ) {
      success
      message
    }
  }
`,

  APPROVE_REFUND: `
  mutation ApproveRefund(
    $orderId: Int!
    $refundAmount: Float!
    $adminNote: String
  ) {
    approveRefund(
      orderId: $orderId
      refundAmount: $refundAmount
      adminNote: $adminNote
    ) {
      success
      message
    }
  }
`,
  SEND_PAYMENT_REMINDER: `
  mutation SendPaymentReminder($orderId: Int!) {
    sendPaymentReminder(orderId: $orderId) {
      success
      message
    }
  }
`,
};

export default graphqlRequest;
