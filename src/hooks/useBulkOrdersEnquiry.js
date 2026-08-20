import { message } from "antd";
import { useCallback, useState } from "react";
import {
  getAllBulkOrderEnquiries,
  updateBulkOrderEnquiry,
} from "../api/bulkOrdersEnquiry";

export default function useBulkOrderEnquiry() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // Fetch Bulk Order Enquiries
  // ──────────────────────────────────────────────────────────────
  const fetchEnquiries = useCallback(
    async (query = null, cursor = null, append = false) => {
      try {
        if (cursor) {
          setFetchingMore(true);
        } else {
          setLoading(true);
        }

        const result = await getAllBulkOrderEnquiries(query, 10, cursor);

        if (result.success) {
          setEnquiries((prev) =>
            append ? [...prev, ...result.enquiries] : result.enquiries,
          );

          setNextCursor(result.nextCursor);
          setHasMore(result.hasMore);
        } else {
          message.error(result.message || "Failed to fetch enquiries");
        }
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [],
  );

  // ──────────────────────────────────────────────────────────────
  // Update Bulk Order Status
  // ──────────────────────────────────────────────────────────────
  const changeBulkOrderStatus = useCallback(
    async (bulkOrderId, status, bulkOrderDetails = "", adminMessage = "") => {
      setUpdateLoading(true);

      try {
        const res = await updateBulkOrderEnquiry(
          bulkOrderId,
          status,
          bulkOrderDetails,
          adminMessage,
        );

        if (res.success) {
          // Update local state
          setEnquiries((prev) =>
            prev.map((enquiry) =>
              Number(enquiry.id) === Number(bulkOrderId)
                ? {
                    ...enquiry,
                    status,
                    bulkOrderDetails,
                    adminMessage,
                  }
                : enquiry,
            ),
          );

          message.success("Bulk order updated successfully");
        } else {
          message.error(res.message || "Failed to update bulk order");
        }

        return res;
      } catch (err) {
        message.error("Failed to update bulk order: " + err.message);

        return {
          success: false,
          message: err.message,
        };
      } finally {
        setUpdateLoading(false);
      }
    },
    [],
  );

  return {
    enquiries,
    loading,
    updateLoading,
    fetchingMore,
    nextCursor,
    hasMore,
    fetchEnquiries,
    changeBulkOrderStatus,
  };
}
