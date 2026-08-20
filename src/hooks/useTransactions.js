import { useCallback, useRef, useState } from "react";
import { getTransactions } from "../api/transactions"; // adjust path to match your project
import { PAGE_SIZE } from "../utils/TransactionUtils";



export default function useTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearchState] = useState("");

    const debounceRef = useRef(null);
    const searchRef = useRef("");  // always holds latest search for loadMore

    // ── Initial / reset fetch ─────────────────────────────────────────────────
    const fetchInitial = useCallback(async (query) => {
        setLoading(true);
        const res = await getTransactions({ first: PAGE_SIZE, after: null, query: query || null });
        if (res.success) {
            setTransactions(res.transactions);
            setCursor(res.nextCursor);
            setHasMore(res.hasMore);
            setTotal(res.total);
        }
        setLoading(false);
    }, []);

    // Run on mount
    const mounted = useRef(false);
    if (!mounted.current) {
        mounted.current = true;
        fetchInitial("");
    }

    // ── Debounced search ──────────────────────────────────────────────────────
    const setSearch = useCallback((val) => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchRef.current = val;
            setSearchState(val);
            fetchInitial(val);
        }, 400);
    }, [fetchInitial]);

    // ── Load next page ────────────────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || loading) return;
        setLoadingMore(true);
        const res = await getTransactions({
            first: PAGE_SIZE,
            after: cursor,
            query: searchRef.current || null,
        });
        if (res.success) {
            setTransactions((prev) => [...prev, ...res.transactions]);
            setCursor(res.nextCursor);
            setHasMore(res.hasMore);
            setTotal(res.total);
        }
        setLoadingMore(false);
    }, [hasMore, loadingMore, loading, cursor]);

    // ── Manual reload ─────────────────────────────────────────────────────────
    const reload = useCallback(() => {
        fetchInitial(searchRef.current);
    }, [fetchInitial]);

    return {
        transactions,
        total,
        loading,
        loadingMore,
        hasMore,
        search,
        setSearch,
        loadMore,
        reload,
    };
}