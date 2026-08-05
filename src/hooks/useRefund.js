import { message } from "antd";
import { useCallback, useState } from "react";
import { approveRefund, getRefundHistory, rejectRefund } from "../api/refund";

const PAGE_SIZE = 15; // match TransactionUtils.PAGE_SIZE if you want them consistent

export default function useRefund() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const [approvingRefundId, setApprovingRefundId] = useState(null);
  const [rejectingRefundId, setRejectingRefundId] = useState(null);

  const [refundNextCursor, setRefundNextCursor] = useState(null);
  const [refundHasMore, setRefundHasMore] = useState(false);

  const [refundStats, setRefundStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Fetch refund history (first page)
  const fetchRefunds = useCallback(async (first = PAGE_SIZE) => {
    setLoading(true);

    try {
      const res = await getRefundHistory(null, first);

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch refund history");
      }

      setRefunds(res.refunds || []);
      setRefundNextCursor(res.nextCursor);
      setRefundHasMore(res.hasMore);

      setRefundStats({
        total: res.total ?? 0,
        pending: res.pending ?? 0,
        approved: res.approved ?? 0,
        rejected: res.rejected ?? 0,
      });

      return res;
    } catch (err) {
      message.error(err.message || "Failed to load refund history");

      setRefunds([]);
      setRefundNextCursor(null);
      setRefundHasMore(false);

      setRefundStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      });

      return {
        success: false,
        message: err.message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch next page of refunds — this is what the ScrollSentinel calls
  const fetchMoreRefunds = useCallback(async () => {
    if (fetchingMore || loading || !refundHasMore || !refundNextCursor) {
      return;
    }

    setFetchingMore(true);

    try {
      const res = await getRefundHistory(refundNextCursor, PAGE_SIZE);

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch more refunds");
      }

      setRefunds((prev) => {
        const existingIds = new Set(prev.map((refund) => String(refund.id)));

        const newRefunds = (res.refunds || []).filter(
          (refund) => !existingIds.has(String(refund.id)),
        );

        return [...prev, ...newRefunds];
      });

      setRefundNextCursor(res.nextCursor);
      setRefundHasMore(res.hasMore);

      return res;
    } catch (err) {
      message.error(err.message || "Failed to load more refunds");

      return {
        success: false,
        message: err.message,
      };
    } finally {
      setFetchingMore(false);
    }
  }, [fetchingMore, loading, refundHasMore, refundNextCursor]);

  // Approve refund
  const handleApproveRefund = useCallback(
    async (orderId, refundAmount, adminNote = "") => {
      setApprovingRefundId(orderId);

      try {
        const res = await approveRefund(orderId, refundAmount, adminNote);

        if (!res.success) {
          message.error(res.message || "Failed to approve refund");
          return res;
        }

        setRefunds((prev) =>
          prev.map((refund) =>
            String(refund.id) === String(orderId)
              ? {
                  ...refund,
                  refundStatus: "APPROVED",
                  refundAmount: String(refundAmount),
                  paymentStatus: "REFUNDED",
                  refundAdminNote: adminNote,
                }
              : refund,
          ),
        );

        setRefundStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          approved: prev.approved + 1,
        }));

        message.success(res.message || "Refund approved successfully");
        return res;
      } catch (err) {
        message.error("Failed to approve refund: " + err.message);
        return { success: false, message: err.message };
      } finally {
        setApprovingRefundId(null);
      }
    },
    [],
  );

  // Reject refund
  const handleRejectRefund = useCallback(async (orderId, rejectionReason) => {
    setRejectingRefundId(orderId);

    try {
      const res = await rejectRefund(orderId, rejectionReason);

      if (!res.success) {
        message.error(res.message || "Failed to reject refund");
        return res;
      }

      setRefunds((prev) =>
        prev.map((refund) =>
          String(refund.id) === String(orderId)
            ? {
                ...refund,
                refundStatus: "REJECTED",
                cancellationReason: rejectionReason,
              }
            : refund,
        ),
      );

      setRefundStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }));

      message.success(res.message || "Refund rejected successfully");
      return res;
    } catch (err) {
      message.error("Failed to reject refund: " + err.message);
      return { success: false, message: err.message };
    } finally {
      setRejectingRefundId(null);
    }
  }, []);

  return {
    refunds,
    loading,
    fetchingMore,
    approvingRefundId,
    rejectingRefundId,
    refundStats,
    refundNextCursor,
    refundHasMore,
    fetchRefunds,
    fetchMoreRefunds,
    approveRefund: handleApproveRefund,
    rejectRefund: handleRejectRefund,
  };
}