import { graphqlRequest } from './graphql'; // same import your cms.js uses

// ───────────────── TRANSACTIONS ─────────────────

export const getTransactions = async ({ first = 10, after = null, query = null } = {}) => {
    try {
        const data = await graphqlRequest(
            `
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
            refundAmount
            order {
              orderNumber
              customerName
              customerPhone
            }
          }
        }
      }
    `,
            { first, after, query }
        );

        const result = data?.allPaymentTransactions;

        return {
            success: true,
            transactions: result?.transactions || [],
            nextCursor: result?.nextCursor || null,
            hasMore: result?.hasMore || false,
            total: result?.total || 0,
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            transactions: [],
            nextCursor: null,
            hasMore: false,
            total: 0,
        };
    }
};