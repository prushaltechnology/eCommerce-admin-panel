import { message } from "antd";
import { useEffect, useRef, useState } from "react";
import { getAllStocks } from "../api/products";
import useProducts from "./useProducts";

// ── Stock status thresholds ──────────────────────────────────────────────────
// Must match the backend's CRITICAL_STOCK_THRESHOLD / LOW_STOCK_THRESHOLD
// exactly, or the "Status" tag and the "Low/Critical" summary cards will
// disagree with each other.
const CRITICAL_STOCK_THRESHOLD = 5; // qty < 5  (and > 0) → critical
const LOW_STOCK_THRESHOLD = 20; // qty < 20 (and >= critical) → low

// Frontend filter values → backend `stockStatus` argument values
const STOCK_STATUS_MAP = {
  low: "low",
  critical: "critical",
  out: "out_of_stock",
};

/**
 * Manages stock list data: fetching, pagination, search, and stats.
 * Separates all data concerns from the Stock UI.
 */
const useStockManager = () => {
  const { fetchProducts } = useProducts();

  // ── Stock list ──────────────────────────────────────────────────────────────
  const [stockItems, setStockItems] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [stockStats, setStockStats] = useState({
    total: 0,
    low: 0,
    critical: 0,
    outOfStock: 0,
  });

  // ── Product list (for the "Manage Stock" select dropdown) ───────────────────
  const [productList, setProductList] = useState([]);
  const [productListLoading, setProductListLoading] = useState(false);
  const [productSearchText, setProductSearchText] = useState("");
  const [productsNextCursor, setProductsNextCursor] = useState(null);
  const [productsHasMore, setProductsHasMore] = useState(false);

  const searchTimeoutRef = useRef(null);

  // ── Stock helpers ───────────────────────────────────────────────────────────
  const getStockQuantity = (product) =>
    (product?.storefrontStock || 0) + (product?.systemStock || 0);

  const getStockStatus = (product) => {
    const storefront = product?.storefrontStock || 0;
    const system = product?.systemStock || 0;

    // Out of stock only when BOTH channels are empty
    if (storefront === 0 && system === 0) {
      return { status: "out_of_stock", color: "red", text: "Out of Stock" };
    }

    // Critical if EITHER channel (that actually has stock) is under
    // the critical threshold — matches the backend's per-row check,
    // not a combined total.
    const isCritical =
      (storefront > 0 && storefront < CRITICAL_STOCK_THRESHOLD) ||
      (system > 0 && system < CRITICAL_STOCK_THRESHOLD);
    if (isCritical) {
      return { status: "critical", color: "orange", text: "Critical" };
    }

    // Low if EITHER channel is under the low threshold — same reasoning.
    const isLow =
      storefront < LOW_STOCK_THRESHOLD || system < LOW_STOCK_THRESHOLD;
    if (isLow) {
      return { status: "low", color: "gold", text: "Low Stock" };
    }

    return { status: "normal", color: "green", text: "Normal" };
  };

  const getStockPercentage = (product) => {
    const stock = getStockQuantity(product);
    const maxStock = Math.max(100, stock * 1.2);
    return Math.min(100, Math.round((stock / maxStock) * 100));
  };

  const getStorefrontStock = (product) => product?.storefrontStock || 0;

  const getSystemStock = (product) => product?.systemStock || 0;

  const getReservedQuantity = (product) =>
    (product?.storefrontReserved || 0) + (product?.systemReserved || 0);

  // Per-channel availability — never combine these. Combining hides a
  // channel that's individually running low behind a healthy number from
  // the other channel, which contradicts getStockStatus's per-row check
  // (see the threshold comment at the top of this file) and produces rows
  // where Status says "Critical" while a combined Available number still
  // looks comfortable.
  const getStorefrontAvailable = (product) =>
    (product?.storefrontStock || 0) - (product?.storefrontReserved || 0);

  const getSystemAvailable = (product) =>
    (product?.systemStock || 0) - (product?.systemReserved || 0);

  // ── Fetch stocks ────────────────────────────────────────────────────────────
  // `filter` is passed explicitly (rather than always reading state) so the
  // debounced search effect and the filter-change effect can both call this
  // with the value that triggered them, avoiding a stale-closure filter.
  const loadStocks = async (
    query = "",
    cursor = null,
    isNewSearch = false,
    filter = stockFilter,
  ) => {
    try {
      isNewSearch ? setStocksLoading(true) : setFetchingMore(true);

      const backendStatus =
        filter && filter !== "all" ? STOCK_STATUS_MAP[filter] : null;

      const res = await getAllStocks(
        query || null,
        10,
        cursor,
        null,
        backendStatus,
      );

      if (res.success) {
        const groupedProducts = {};

        (res.allStocks || []).forEach((stock) => {
          const productId = stock.product?.id;
          if (!productId) return;

          if (!groupedProducts[productId]) {
            groupedProducts[productId] = {
              id: productId,
              name: stock.product?.name || "Unknown Product",
              price: stock.product?.price,
              images: stock.product?.images || [],
              unit: stock.product?.unit || "",

              storefrontStock: 0,
              storefrontReserved: 0,

              systemStock: 0,
              systemReserved: 0,

              // Track which inventory types this particular page
              // actually contained data for, so a later merge
              // (see below) doesn't overwrite a value we didn't
              // actually receive on this page with a stale 0.
              hasStorefront: false,
              hasSystem: false,
            };
          }

          if (stock.inventoryType === "storefront") {
            groupedProducts[productId].storefrontStock = Number(
              stock.quantity || 0,
            );

            groupedProducts[productId].storefrontReserved = Number(
              stock.reservedQuantity || 0,
            );

            groupedProducts[productId].hasStorefront = true;
          }

          if (stock.inventoryType === "system") {
            groupedProducts[productId].systemStock = Number(
              stock.quantity || 0,
            );

            groupedProducts[productId].systemReserved = Number(
              stock.reservedQuantity || 0,
            );

            groupedProducts[productId].hasSystem = true;
          }
        });

        const mapped = Object.values(groupedProducts);

        if (isNewSearch) {
          setStockItems(mapped);
        } else {
          // The backend paginates raw stock rows (10 per page), and each
          // product has two rows (storefront + system). That means a
          // product's two rows can land on different pages. The old
          // logic filtered out anything whose id already existed, which
          // silently dropped whichever inventory type arrived on the
          // later page. Merge instead of dropping.
          setStockItems((prev) => {
            const merged = [...prev];
            const indexById = new Map(
              merged.map((item, idx) => [item.id, idx]),
            );

            mapped.forEach((item) => {
              const idx = indexById.get(item.id);

              if (idx === undefined) {
                merged.push(item);
                indexById.set(item.id, merged.length - 1);
                return;
              }

              const existing = merged[idx];
              merged[idx] = {
                ...existing,
                storefrontStock: item.hasStorefront
                  ? item.storefrontStock
                  : existing.storefrontStock,
                storefrontReserved: item.hasStorefront
                  ? item.storefrontReserved
                  : existing.storefrontReserved,
                systemStock: item.hasSystem
                  ? item.systemStock
                  : existing.systemStock,
                systemReserved: item.hasSystem
                  ? item.systemReserved
                  : existing.systemReserved,
                hasStorefront: existing.hasStorefront || item.hasStorefront,
                hasSystem: existing.hasSystem || item.hasSystem,
              };
            });

            return merged;
          });
        }

        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setStockStats({
          total: res.totalProducts ?? 0,
          low: res.lowStock ?? 0,
          critical: res.criticalStock ?? 0,
          outOfStock: res.outOfStock ?? 0,
        });
      } else {
        message.error(res.message || "Failed to load stock data");
      }
    } catch {
      message.error("An error occurred while fetching stock data.");
    } finally {
      setStocksLoading(false);
      setFetchingMore(false);
    }
  };

  // ── Fetch products for modal dropdown ───────────────────────────────────────
  const loadProducts = async (search = "", append = false) => {
    try {
      setProductListLoading(true);
      const after = append ? productsNextCursor : null;
      const res = await fetchProducts(10, after, search);

      if (res) {
        const transformed = (res.products || []).map((p) => ({
          id: p.id,
          name: p.name,
          storefrontStock: p.storefrontStock || 0,

          systemStock: p.systemStock || 0,
        }));

        setProductList((prev) =>
          append ? [...prev, ...transformed] : transformed,
        );
        setProductsNextCursor(res.nextCursor);
        setProductsHasMore(res.hasMore);
      }
    } catch (error) {
      //console.error(error);
    } finally {
      setProductListLoading(false);
    }
  };

  const handleProductSearch = (value) => {
    setProductSearchText(value);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(
      () => loadProducts(value, false),
      400,
    );
  };

  const handleProductPopupScroll = (event) => {
    const { scrollTop, offsetHeight, scrollHeight } = event.target;
    if (
      scrollTop + offsetHeight >= scrollHeight - 20 &&
      productsHasMore &&
      !productListLoading
    ) {
      loadProducts(productSearchText, true);
    }
  };

  // ── Filter change handler ───────────────────────────────────────────────────
  // Filtering now happens server-side (see loadStocks), so changing the
  // filter re-fetches from page 1 instead of re-slicing whatever's in memory.
  const handleFilterChange = (value) => {
    setStockFilter(value);
    loadStocks(searchText, null, true, value);
  };

  // Keeps a ref in sync with the current stockFilter — read by the debounced
  // search effect below instead of a closed-over `stockFilter` value. The
  // effect only re-creates its closure when `searchText` changes (see its
  // dependency array), so without this ref it can silently reuse a stale
  // filter value if `stockFilter` changes in between two searchText updates —
  // e.g. the sidebar's stock alerts navigating to /stock?filter=out right
  // after mount get reverted back to 'all' ~300ms later by this effect
  // firing with its stale mount-time closure.
  const stockFilterRef = useRef(stockFilter);
  useEffect(() => {
    stockFilterRef.current = stockFilter;
  }, [stockFilter]);

  // filteredStocks is kept only as a thin passthrough now that the backend
  // does the actual filtering — no client-side re-filtering, so it can't
  // drift from the thresholds above or hide rows on a later page.
  const filteredStocks = stockItems;

  // ── Effects ─────────────────────────────────────────────────────────────────
  // Debounced search → reload stocks (reads the CURRENT filter via ref,
  // not a stale closure over [searchText]-only deps). This is the ONLY
  // debounced-search effect in this file — a duplicate older version of
  // this effect (reading `stockFilter` directly instead of via ref) was
  // previously left in alongside this one, causing two competing API
  // calls on every searchText change. Do not re-add a second copy.
  useEffect(() => {
    const timer = setTimeout(
      () => loadStocks(searchText, null, true, stockFilterRef.current),
      300,
    );
    return () => clearTimeout(timer);
  }, [searchText]);

  // Initial product list load
  useEffect(() => {
    loadProducts();
  }, []);

  return {
    // Stock list
    stockItems,
    filteredStocks,
    stocksLoading,
    fetchingMore,
    nextCursor,
    hasMore,
    stockStats,
    searchText,
    setSearchText,
    stockFilter,
    setStockFilter: handleFilterChange,
    loadStocks,

    // Product dropdown
    productList,
    productListLoading,
    handleProductSearch,
    handleProductPopupScroll,

    // Helpers
    getStockQuantity,
    getStorefrontStock,
    getSystemStock,

    getStockStatus,
    getStockPercentage,

    getReservedQuantity,
    getStorefrontAvailable,
    getSystemAvailable,
  };
};

export default useStockManager;
