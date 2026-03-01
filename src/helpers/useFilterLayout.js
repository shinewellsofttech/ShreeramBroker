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

  // Persist to localStorage
  const persist = useCallback((newLayout) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    } catch (e) {
      console.warn('useFilterLayout: failed to save localStorage', e);
    }
  }, [storageKey]);

  // ─── Drag and Drop ─────────────────────────────────────
  const handleDragStart = useCallback((e, filterId) => {
    dragItem.current = filterId;
    e.dataTransfer.effectAllowed = 'move';
    // Add a small delay for visual feedback
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

      // Remove dragged item and insert at drop position
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
    // Remove dragging class from all filter items
    document.querySelectorAll('.filter-item.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  }, []);

  // ─── Touch Drag and Drop ───────────────────────────────
  const touchDragItem = useRef(null);
  const touchClone = useRef(null);
  const touchStartPos = useRef(null);
  const filterBarRef = useRef(null);

  const handleTouchDragStart = useCallback((e, filterId) => {
    // Only start drag on long press (handled by CSS touch-action) or direct touch on drag handle
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

    // Find which filter item we're over
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elemBelow) {
      const filterItem = elemBelow.closest('.filter-item');
      if (filterItem && filterItem.dataset.filterId && filterItem.dataset.filterId !== touchDragItem.current) {
        // Swap
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

  useEffect(() => {
    const onMove = (e) => {
      if (!resizeActive.current || !resizingFilter.current) return;

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
    };

    const onUp = () => {
      if (!resizeActive.current) return;
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
    };

    document.addEventListener('mousemove', onMove);
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
  };
}
