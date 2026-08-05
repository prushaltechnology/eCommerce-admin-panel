import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP link to your GraphQL endpoint
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URI || 'https://192.168.1.40:8000/graphql/',
  // Add logging for debugging
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth link to add authentication headers
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('authToken');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );

    // Handle authentication errors
    if (graphQLErrors.some(error => error.message === 'Authentication required')) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  }

  if (networkError) {
    //console.error(`[Network error]: ${networkError}`);

    // Handle network errors (e.g., server is down)
    if (networkError.statusCode === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  }
});

// Combine links
const link = from([errorLink, authLink, httpLink]);

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Cache pagination for products
        products: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        // Cache pagination for orders
        orders: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
        // Cache pagination for customers
        customers: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
    Product: {
      keyFields: ['id'],
    },
    Order: {
      keyFields: ['id'],
    },
    Customer: {
      keyFields: ['id'],
    },
    Category: {
      keyFields: ['id'],
    },
  },
});

// Create Apollo Client
const client = new ApolloClient({
  link,
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
