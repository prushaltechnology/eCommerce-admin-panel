import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Infinite scroll for an antd <Table scroll={{ y }}> (or any scrollable box).
 *
 *   const containerRef = useRef(null);
 *   useInfiniteScroll({ containerRef, hasMore, loading, itemCount, onLoadMore });
 *   <div ref={containerRef}><Table scroll={{ y: ... }} ... /></div>
 *
 * Fixes the problems the hand-written scroll listeners had:
 *  - Only ONE request per page. A ref blocks new loads from the moment a load
 *    starts (React state like `fetchingMore` updates too late, so a burst of
 *    wheel events used to fire the same page several times -> duplicate rows).
 *  - Loads more by itself when the rows don't fill the table yet (tall screens,
 *    small pages), because then there is no scrollbar and no scroll event.
 *  - Always calls the latest onLoadMore (no stale cursor / filters).
 *
 * onLoadMore should return a promise (async function); the next page is allowed
 * once it settles and the new rows have rendered. `loading` should be true while
 * any list request is running (first page or next page).
 */
const MAX_EMPTY_AUTO_LOADS = 2;

export default function useInfiniteScroll({
  containerRef,
  hasMore,
  loading,
  itemCount,
  onLoadMore,
  threshold = 80,
}) {
  const latest = useRef({ hasMore, loading, onLoadMore, itemCount });
  const inFlight = useRef(false);
  // Automatic (non-scroll) loads in a row that added no rows. Auto-loading
  // stops after MAX_EMPTY_AUTO_LOADS so a failing request can't loop forever;
  // scrolling still retries.
  const emptyAutoLoads = useRef(0);

  useLayoutEffect(() => {
    latest.current = { hasMore, loading, onLoadMore, itemCount };
  });

  const getScrollBody = useCallback(() => {
    const container = containerRef.current;
    if (!container) return null;
    return container.querySelector('.ant-table-body') || container;
  }, [containerRef]);

  const load = useCallback((auto = false) => {
    const { hasMore: more, loading: busy, onLoadMore: loadMore, itemCount: startCount } = latest.current;
    if (!more || busy || inFlight.current || !loadMore) return false;

    inFlight.current = true;
    let result;
    try {
      result = loadMore();
    } catch (error) {
      inFlight.current = false;
      throw error;
    }

    const release = () => {
      // Wait a frame so React has rendered the new rows (and the new cursor)
      // before another page can be requested.
      requestAnimationFrame(() => {
        inFlight.current = false;
        if (latest.current.itemCount !== startCount) emptyAutoLoads.current = 0;
        else if (auto) emptyAutoLoads.current += 1;
      });
    };

    if (result && typeof result.finally === 'function') {
      result.finally(release);
    } else {
      // Not a promise: release when `loading` / itemCount change (effect below),
      // with a safety net so the list can never get stuck.
      setTimeout(release, 4000);
    }
    return true;
  }, []);

  const check = useCallback(
    ({ fromScroll }) => {
      const body = getScrollBody();
      if (!body || !body.isConnected) return;

      const distanceFromBottom = body.scrollHeight - body.scrollTop - body.clientHeight;
      if (distanceFromBottom > threshold) return;

      const notScrollable = body.scrollHeight <= body.clientHeight + 1;
      if (!fromScroll && notScrollable) {
        if (emptyAutoLoads.current >= MAX_EMPTY_AUTO_LOADS) return;
        load(true);
        return;
      }
      load();
    },
    [getScrollBody, threshold, load],
  );

  // Scroll listener. Re-attached when the table re-renders its body.
  useEffect(() => {
    const body = getScrollBody();
    if (!body) return undefined;

    const onScroll = () => check({ fromScroll: true });
    body.addEventListener('scroll', onScroll, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => check({ fromScroll: false }));
      resizeObserver.observe(body);
    }

    return () => {
      body.removeEventListener('scroll', onScroll);
      resizeObserver?.disconnect();
    };
  }, [getScrollBody, check, loading, itemCount]);

  // When `loading` clears or new rows arrive, release non-promise loads and
  // fill the table if the rows still don't reach the bottom.
  useEffect(() => {
    if (loading) return undefined;
    const frame = requestAnimationFrame(() => {
      inFlight.current = false;
      check({ fromScroll: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, itemCount, hasMore, check]);
}
