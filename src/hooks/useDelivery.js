import { message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { graphqlRequest } from '../api/graphql';

// Only fetch what the Delivery page needs — no items, no customer details beyond name
const DELIVERY_QUERY = `
  query GetDeliveryOrders($first: Int!, $after: String, $query: String) {
    allOrders(first: $first, after: $after, query: $query, orderFrom: "STOREFRONT") {
      orders {
        id
        orderNumber
        status
        finalAmount
        createdAt
        customer {
          id
          firstName
          lastName
        }
        borzoOrder {
          borzoOrderId
          status
          statusDescription
          deliveryFee
          trackingUrl
          deliveryStatus
          pickup { address name phone }
          drop   { address name phone }
          courier {
            courierId
            name
            phone
            photoUrl
            latitude
            longitude
          }
        }
      }
      nextCursor
      hasMore
    }
  }
`;

const PAGE_SIZE = 15;

export const useDelivery = () => {
    const [allRows, setAllRows] = useState([]);   // only orders WITH borzoOrder
    const [loading, setLoading] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [searchText, setSearchText] = useState('');

    const initialFetchDone = useRef(false);
    const skipSearchEffect = useRef(true);

    // ── fetch ─────────────────────────────────────────────────────────────────
    const loadDeliveries = useCallback(async (cursor = null, isNew = false) => {
        isNew ? setLoading(true) : setFetchingMore(true);
        try {
            const vars = { first: PAGE_SIZE };
            if (cursor) vars.after = cursor;
            if (searchText) vars.query = searchText;

            const data = await graphqlRequest(DELIVERY_QUERY, vars);
            const raw = data?.allOrders?.orders || [];

            // Client-side filter: only keep rows that have a borzoOrder
            const withBorzo = raw.filter((o) => o.borzoOrder !== null);

            setAllRows((prev) => {
                if (isNew) return withBorzo;
                const existingIds = new Set(prev.map((r) => r.id));
                return [...prev, ...withBorzo.filter((r) => !existingIds.has(r.id))];
            });
            setNextCursor(data?.allOrders?.nextCursor ?? null);
            setHasMore(data?.allOrders?.hasMore ?? false);
        } catch (err) {
            message.error('Failed to load deliveries: ' + err.message);
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    }, [searchText]);

    // initial load
    useEffect(() => {
        if (initialFetchDone.current) return;
        initialFetchDone.current = true;
        loadDeliveries(null, true);
    }, [loadDeliveries]);

    // debounced search
    useEffect(() => {
        if (skipSearchEffect.current) { skipSearchEffect.current = false; return; }
        const t = setTimeout(() => loadDeliveries(null, true), 400);
        return () => clearTimeout(t);
    }, [searchText, loadDeliveries]);

    const skeletonRows = useMemo(
        () => Array.from({ length: 8 }, (_, i) => ({ id: `skel-${i}`, isSkeleton: true })),
        []
    );

    return {
        rows: allRows,
        loading,
        fetchingMore,
        nextCursor,
        hasMore,
        searchText,
        setSearchText,
        skeletonRows,
        loadDeliveries,
    };
};