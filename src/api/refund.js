// Refund API Functions
import {
  GRAPHQL_QUERIES,
  graphqlRequest,
} from "./graphql";

// Get refund history
export const getRefundHistory = async (
  after = null,
  first = 1000,
) => {
  try {
    const variables = {
      first,
      ...(after ? { after } : {}),
    };

    const data = await graphqlRequest(
      GRAPHQL_QUERIES.GET_REFUND_HISTORY,
      variables,
    );

    const result = data?.refundHistory;

    if (!result) {
      return {
        success: false,
        message: "Failed to fetch refund history",
        refunds: [],
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        nextCursor: null,
        hasMore: false,
      };
    }

    return {
      success: true,
      refunds: result.refunds || [],
      total: result.total ?? 0,
      pending: result.pending ?? 0,
      approved: result.approved ?? 0,
      rejected: result.rejected ?? 0,
      nextCursor: result.nextCursor || null,
      hasMore: result.hasMore ?? false,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.message ||
        "Failed to fetch refund history",
      refunds: [],
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      nextCursor: null,
      hasMore: false,
    };
  }
};

// Approve refund
// Approve refund
export const approveRefund = async (
  orderId,
  refundAmount,
  adminNote = "",
) => {
  try {
    // Ensure exactly 2 decimal places, avoids floating point drift (e.g. 45.7699999)
    const normalizedAmount = Number(parseFloat(refundAmount || 0).toFixed(2));

    if (isNaN(normalizedAmount) || normalizedAmount < 0) {
      return {
        success: false,
        message: "Invalid refund amount",
      };
    }

    const data = await graphqlRequest(
      GRAPHQL_QUERIES.APPROVE_REFUND,
      {
        orderId: parseInt(orderId, 10),
        refundAmount: normalizedAmount,
        adminNote: adminNote || null,
      },
    );

    const result = data?.approveRefund;

    if (!result) {
      return {
        success: false,
        message: "Failed to approve refund",
      };
    }

    return {
      success: result.success ?? false,
      message:
        result.message ||
        (result.success
          ? "Refund approved successfully"
          : "Failed to approve refund"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.message ||
        "Failed to approve refund",
    };
  }
};

// Reject refund
export const rejectRefund = async (
  orderId,
  rejectionReason,
) => {
  try {
    const data = await graphqlRequest(
      GRAPHQL_QUERIES.REJECT_REFUND,
      {
        orderId: parseInt(orderId, 10),
        rejectionReason,
      },
    );

    const result = data?.rejectRefund;

    if (!result) {
      return {
        success: false,
        message: "Failed to reject refund",
      };
    }

    return {
      success: result.success ?? false,
      message:
        result.message ||
        (result.success
          ? "Refund rejected successfully"
          : "Failed to reject refund"),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.message ||
        "Failed to reject refund",
    };
  }
};