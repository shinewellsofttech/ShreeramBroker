import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for resizable, reorderable filter layout with localStorage persistence.
 *
 * @param {string} storageKey - Unique localStorage key (e.g. 'ledgerReport_topFilters')
 * @param {Array} defaultFilters - Array of { id: string, defaultWidth: number }
 * @returns {{ filterOrder, filterWidths, gap, setGap, handleDragStart, handleDragOver, handleDrop, handleDragEnd, handleFilterResizeMouseDown, resetLayout }}
 */
export default function useFilterLayout(storageKey, defaultFilters) {
  const defaultOrder = defaultFilters.map(f => f.id);
  const defaultWidths = {};
  defaultFilters.forEach(f => { defaultWidths[f.id] = f.defaultWidth; });
  const DEFAULT_GAP = 8;

  const getInitial = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          order: parsed.order && Array.isArray(parsed.order) ? parsed.order : [...defaultOrder],
          widths: parsed.widths ? { ...defaultWidths, ...parsed.widths } : { ...defaultWidths },
          gap: typeof parsed.gap === 'number' ? parsed.gap : DEFAULT_GAP,
        };
      }
    } catch (e) {
      console.warn('useFilterLayout: failed to read localStorage', e);
    }
    return {
      order: [...defaultOrder],
      widths: { ...defaultWidths },
      gap: DEFAULT_GAP,
    };
  };

  const [layout, setLayout] = useState(getInitial);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const resizingFilter = useRef(null);
  const resizeActive = useRef(false);
  const rafId = useRef(null);
  const pendingWidth = useRef(null);

  // ─── Hold-to-Move State and Refs ───────────────────────
  const [activeReorderId, setActiveReorderId] = useState(null);
  const activeReorderIdRef = useRef(null);
  useEffect(() => {
    activeReorderIdRef.current = activeReorderId;
  }, [activeReorderId]);

  const holdTimer = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const hasHeld = useRef(false);

  // Persist to localStorage
  const persist = useCallback((newLayout) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    } catch (e) {
      console.warn('useFilterLayout: failed to save localStorage', e);
    }
  }, [storageKey]);

  // ─── Start Hold Detection ──────────────────────────────
  const handleFilterStart = useCallback((e, filterId, isTouch) => {
    // If user interacts with a resize handle, ignore it
    if (e.target.closest('.filter-resize-handle')) {
      return;
    }

    // Only handle left mouse click or touch
    if (!isTouch && e.button !== 0) return;

    const point = isTouch ? e.touches[0] : e;
    if (!point) return;

    startPos.current = { x: point.clientX, y: point.clientY };
    hasHeld.current = false;
    setActiveReorderId(null);

    if (holdTimer.current) clearTimeout(holdTimer.current);

    holdTimer.current = setTimeout(() => {
      hasHeld.current = true;
      setActiveReorderId(filterId);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch (err) {
          // ignore vibration issues
        }
      }
    }, 2000); // 2 seconds hold
  }, []);

  // ─── Drag and Drop (HTML5 fallback) ────────────────────
  const handleDragStart = useCallback((e, filterId) => {
    dragItem.current = filterId;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = e.target.closest('.filter-item');
      if (el) el.classList.add('dragging');
    }, 0);
  }, []);

  const handleDragOver = useCallback((e, filterId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverItem.current = filterId;
  }, []);

  const handleDrop = useCallback((e, filterId) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current === filterId) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    setLayout(prev => {
      const newOrder = [...prev.order];
      const dragIdx = newOrder.indexOf(dragItem.current);
      const dropIdx = newOrder.indexOf(filterId);

      if (dragIdx === -1 || dropIdx === -1) return prev;

      newOrder.splice(dragIdx, 1);
      newOrder.splice(dropIdx, 0, dragItem.current);

      const newLayout = { ...prev, order: newOrder };
      persist(newLayout);
      return newLayout;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  }, [persist]);

  const handleDragEnd = useCallback((e) => {
    dragItem.current = null;
    dragOverItem.current = null;
    document.querySelectorAll('.filter-item.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }, []);

  // ─── Touch Drag and Drop (fallback/legacy) ─────────────
  const touchDragItem = useRef(null);
  const touchStartPos = useRef(null);

  const handleTouchDragStart = useCallback((e, filterId) => {
    const touch = e.touches[0];
    touchDragItem.current = filterId;
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    const el = e.target.closest('.filter-item');
    if (el) {
      el.classList.add('dragging');
    }
  }, []);

  const handleTouchDragMove = useCallback((e) => {
    if (!touchDragItem.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    if (e.cancelable) e.preventDefault();

    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elemBelow) {
      const filterItem = elemBelow.closest('.filter-item');
      if (filterItem && filterItem.dataset.filterId && filterItem.dataset.filterId !== touchDragItem.current) {
        const targetId = filterItem.dataset.filterId;
        setLayout(prev => {
          const newOrder = [...prev.order];
          const dragIdx = newOrder.indexOf(touchDragItem.current);
          const dropIdx = newOrder.indexOf(targetId);
          if (dragIdx === -1 || dropIdx === -1) return prev;
          newOrder.splice(dragIdx, 1);
          newOrder.splice(dropIdx, 0, touchDragItem.current);
          const newLayout = { ...prev, order: newOrder };
          persist(newLayout);
          return newLayout;
        });
      }
    }
  }, [persist]);

  const handleTouchDragEnd = useCallback(() => {
    touchDragItem.current = null;
    touchStartPos.current = null;
    document.querySelectorAll('.filter-item.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }, []);

  // ─── Resize ────────────────────────────────────────────
  const handleFilterResizeMouseDown = useCallback((e, filterId) => {
    e.preventDefault();
    e.stopPropagation();

    let clientX;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    if (clientX === undefined) return;

    resizingFilter.current = {
      id: filterId,
      startX: clientX,
      startWidth: layout.widths[filterId] || defaultWidths[filterId] || 100,
    };
    resizeActive.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }, [layout.widths, defaultWidths]);

  // ─── Global Mouse/Touch Event Effect ───────────────────
  useEffect(() => {
    const onMove = (e) => {
      // 1. Handle Resize Active Mode
      if (resizeActive.current && resizingFilter.current) {
        if (e.cancelable) e.preventDefault();

        let clientX;
        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
        } else if (e.clientX !== undefined) {
          clientX = e.clientX;
        } else {
          return;
        }

        const diff = clientX - resizingFilter.current.startX;
        const newWidth = Math.max(40, resizingFilter.current.startWidth + diff);
        const filterId = resizingFilter.current.id;

        pendingWidth.current = { id: filterId, width: newWidth };
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            if (pendingWidth.current) {
              const { id, width } = pendingWidth.current;
              setLayout(prev => ({
                ...prev,
                widths: { ...prev.widths, [id]: width },
              }));
              pendingWidth.current = null;
            }
            rafId.current = null;
          });
        }
        return;
      }

      // 2. Handle Reordering Hold and Move Mode
      const isTouch = e.type.startsWith('touch');
      const point = isTouch ? e.touches[0] : e;
      if (!point) return;

      // If user moved too much (e.g. scrolled or drifted) before 2 seconds are up, cancel the timer
      if (holdTimer.current && !hasHeld.current) {
        const dx = point.clientX - startPos.current.x;
        const dy = point.clientY - startPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 8) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
      }

      const currentReorderId = activeReorderIdRef.current;
      if (currentReorderId) {
        if (e.cancelable) e.preventDefault(); // Stop mobile scrolling during reorder drag

        const elemBelow = document.elementFromPoint(point.clientX, point.clientY);
        if (elemBelow) {
          const filterItem = elemBelow.closest('[data-filter-id]');
          if (filterItem && filterItem.dataset.filterId) {
            const targetId = filterItem.dataset.filterId;
            if (targetId !== currentReorderId) {
              setLayout(prev => {
                const newOrder = [...prev.order];
                const dragIdx = newOrder.indexOf(currentReorderId);
                const dropIdx = newOrder.indexOf(targetId);
                if (dragIdx === -1 || dropIdx === -1) return prev;

                newOrder.splice(dragIdx, 1);
                newOrder.splice(dropIdx, 0, currentReorderId);
                const newLayout = { ...prev, order: newOrder };
                persist(newLayout);
                return newLayout;
              });
            }
          }
        }
      }
    };

    const onUp = () => {
      // 1. End Resize
      if (resizeActive.current) {
        resizeActive.current = false;
        resizingFilter.current = null;
        pendingWidth.current = null;
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';

        setLayout(prev => {
          persist(prev);
          return prev;
        });
      }

      // 2. End Hold Timer
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      // End Active Reorder (delay slightly so click event capture can intercept accidental taps/modals)
      setTimeout(() => {
        hasHeld.current = false;
        setActiveReorderId(null);
      }, 50);
    };

    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('touchcancel', onUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [persist]);

  // ─── Gap Control ───────────────────────────────────────
  const setGap = useCallback((newGap) => {
    const g = Math.max(0, Math.min(30, newGap));
    setLayout(prev => {
      const newLayout = { ...prev, gap: g };
      persist(newLayout);
      return newLayout;
    });
  }, [persist]);

  // ─── Reset ─────────────────────────────────────────────
  const resetLayout = useCallback(() => {
    const fresh = {
      order: [...defaultOrder],
      widths: { ...defaultWidths },
      gap: DEFAULT_GAP,
    };
    setLayout(fresh);
    try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
  }, [defaultOrder, defaultWidths, storageKey]);

  return {
    filterOrder: layout.order,
    filterWidths: layout.widths,
    gap: layout.gap,
    setGap,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchDragStart,
    handleTouchDragMove,
    handleTouchDragEnd,
    handleFilterResizeMouseDown,
    resetLayout,
    handleFilterStart,
    activeReorderId,
  };
}
