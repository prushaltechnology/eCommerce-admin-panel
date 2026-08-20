import { gql } from '@apollo/client';

// Product Queries
export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilter, $pagination: PaginationInput) {
    products(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          name
          shortDescription
          deliveryRuleDays
          description
          price
          category {
            id
            name
          }
          
          status
          imageUrl
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      shortDescription
      deliveryRuleDays
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
      updatedAt
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $pagination: PaginationInput) {
    searchProducts(query: $query, pagination: $pagination) {
      edges {
        node {
          id
          name
          description
          price
          category {
            name
          }
          stock
          status
          imageUrl
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

// Category Queries
export const GET_CATEGORIES = gql`
  query GetCategories(
    $first: Int!
    $after: String
    $query: String
  ) {
    allCategories(
      first: $first
      after: $after
      query: $query
    ) {
      categories {
        id
        name
        description
        image
        isActive
        createdAt

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
`;

// Auth Queries
export const ME = gql`
  query Me {
    me {
      id
      name
      email
      role
      permissions
    }
  }
`;

// Order Queries
export const GET_SYSTEM_ORDERS = gql`
  query GetSystemOrders {
    allOrders(orderFrom: "admin_panel") {
      id
      orderNumber
      status
      totalAmount
      finalAmount
      createdAt
      customer {
        id
        firstName
        lastName
        email
        phone
      }
      shippingAddress
      items {
        quantity
        subtotal
        product {
          name
          unit
          measureValue
          images {
            image
          }
        }
      }
    }
  }
`;

export const GET_USER_ORDERS = gql`
  query GetUserOrders {
    allOrders(orderFrom: "storefront") {
      id
      orderNumber
      status
      totalAmount
      finalAmount
      createdAt
      customer {
        id
        firstName
        lastName
        email
        phone
      }
      shippingAddress
      items {
        quantity
        subtotal
        product {
          name
          unit
          measureValue
          images {
            image
          }
        }
      }
    }
  }
`;

// Employee Queries
export const GET_EMPLOYEES = gql`
  query GetEmployees($first: Int!, $after: String, $search: String) {
    employees(first: $first, after: $after, search: $search) {
      employees {
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
      nextCursor
      hasMore
    }
  }
`;

// Transaction Queries
export const GET_TRANSACTIONS = gql`
  query GetTransactions($first: Int!, $after: String, $query: String) {
    allPaymentTransactions(first: $first, after: $after, query: $query) {
      total
      hasMore
      nextCursor
      transactions {
        id
        status
        amount
        paymentMethod
        razorpayOrderId
        razorpayPaymentId
        createdAt
        order {
          orderNumber
          customerName
          customerPhone
        }
      }
    }
  }
`;
