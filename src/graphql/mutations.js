import { gql } from '@apollo/client';

// Product Mutations
export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      price
      category {
        id
        name
      }
      stock
      status
      imageUrl
      createdAt
    }
  }
 
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      price
      category {
        id
        name
      }
      stock
      status
      imageUrl
      updatedAt
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export const UPDATE_PRODUCT_STOCK = gql`
  mutation UpdateProductStock($id: ID!, $stock: Int!) {
    updateProductStock(id: $id, stock: $stock) {
      id
      stock
      status
      updatedAt
    }
  }
`;

// Category Mutations
export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      description
      icon
      status
      createdAt
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      description
      icon
      status
      updatedAt
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

// Order Mutations
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      customerId
      orderNumber
      status
      total
      currency
      customer {
        id
        name
        email
      }
      items {
        id
        product {
          id
          name
        }
        quantity
        price
        total
      }
      createdAt
    }
  }
`;

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) {
    updateOrder(id: $id, input: $input) {
      id
      status
      total
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      updatedAt
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: ID!, $reason: String) {
    cancelOrder(id: $id, reason: $reason) {
      id
      status
      cancellationReason
      updatedAt
    }
  }
`;

export const REFUND_ORDER = gql`
  mutation RefundOrder($id: ID!, $amount: Float, $reason: String) {
    refundOrder(id: $id, amount: $amount, reason: $reason) {
      id
      refundStatus
      refundAmount
      updatedAt
    }
  }
`;

// Customer Mutations
export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      email
      phone
      status
      createdAt
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      email
      phone
      status
      updatedAt
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

export const ADD_CUSTOMER_ADDRESS = gql`
  mutation AddCustomerAddress($customerId: ID!, $input: CreateAddressInput!) {
    addCustomerAddress(customerId: $customerId, input: $input) {
      id
      street
      city
      state
      zipCode
      country
      isDefault
    }
  }
`;

export const UPDATE_CUSTOMER_ADDRESS = gql`
  mutation UpdateCustomerAddress($customerId: ID!, $addressId: ID!, $input: UpdateAddressInput!) {
    updateCustomerAddress(customerId: $customerId, addressId: $addressId, input: $input) {
      id
      street
      city
      state
      zipCode
      country
      isDefault
    }
  }
`;

export const DELETE_CUSTOMER_ADDRESS = gql`
  mutation DeleteCustomerAddress($customerId: ID!, $addressId: ID!) {
    deleteCustomerAddress(customerId: $customerId, addressId: $addressId)
  }
`;

// Inventory Mutations
export const CREATE_INVENTORY_ITEM = gql`
  mutation CreateInventoryItem($input: CreateInventoryItemInput!) {
    createInventoryItem(input: $input) {
      id
      product {
        id
        name
        sku
      }
      currentStock
      minStock
      maxStock
      reorderPoint
      status
      createdAt
    }
  }
`;

export const UPDATE_INVENTORY_ITEM = gql`
  mutation UpdateInventoryItem($id: ID!, $input: UpdateInventoryItemInput!) {
    updateInventoryItem(id: $id, input: $input) {
      id
      currentStock
      minStock
      maxStock
      reorderPoint
      status
      updatedAt
    }
  }
`;

export const DELETE_INVENTORY_ITEM = gql`
  mutation DeleteInventoryItem($id: ID!) {
    deleteInventoryItem(id: $id)
  }
`;

export const ADJUST_STOCK = gql`
  mutation AdjustStock($productId: ID!, $quantity: Int!, $reason: String!) {
    adjustStock(productId: $productId, quantity: $quantity, reason: $reason) {
      id
      currentStock
      status
      lastUpdated
    }
  }
`;

export const CREATE_PURCHASE_ORDER = gql`
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(input: $input) {
      id
      orderNumber
      status
      supplier {
        id
        name
      }
      items {
        id
        product {
          id
          name
          sku
        }
        quantity
        unitPrice
        total
      }
      total
      expectedDeliveryDate
      createdAt
    }
  }
`;

// Auth Mutations
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        name
        email
        role
        permissions
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($uid: String!, $token: String!, $newPassword: String!) {
    resetPassword(uid: $uid, token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;


// Employee Mutations
export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($email: String!, $password: String!, $firstName: String!, $lastName: String!, $phone: String!, $employeeRoleName: String!) {
    adminCreateEmployee(email: $email, password: $password, firstName: $firstName, lastName: $lastName, phone: $phone, employeeRoleName: $employeeRoleName) {
      employee {
        id
        employeeId
        roleName
        isActive
        user {
          id
          email
          firstName
          lastName
          phone
        }
      }
    }
  }
`;


export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($employeeId: ID!) {
    deleteEmployee(employeeId: $employeeId)
  }
`;
