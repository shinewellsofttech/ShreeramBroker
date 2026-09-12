import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Excel-like column resizing with localStorage persistence.
 *
 * @param {string} storageKey - Unique localStorage key for this table (e.g. 'contractRegister_columnWidths')
 * @param {Object} defaultWidths - Object mapping column keys to default pixel widths
 * @returns {{ columnWidths, handleResizeMouseDown, resetColumnWidths }}
 *
 * Usage in JSX (inside each <th>):
 *   <th style={{ ..., width: `${columnWidths.MyCol}px`, position: 'relative', overflow: 'hidden' }}>
 *     Header Text
 *     <div className="col-resize-handle"
 *       onMouseDown={e => handleResizeMouseDown(e, 'MyCol')}
 *       onTouchStart={e => handleResizeMouseDown(e, 'MyCol')} />
 *   </th>
 */
export default function useColumnResize(storageKey, defaultWidths) {
  const getInitial = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('useColumnResize: failed to read localStorage', e);
    }
    return { ...defaultWidths };
  };

  const [columnWidths, setColumnWidths] = useState(getInitial);
  const resizingCol = useRef(null);
  const activeRef = useRef(false);
  const rafId = useRef(null);
  const pendingWidth = useRef(null);
  const hasMovedRef = useRef(false);
  const justResizedRef = useRef(false);

  const handleResizeMouseDown = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();

    // Get clientX from mouse or touch event
    let clientX;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    if (clientX === undefined) return;

    resizingCol.current = {
      key: colKey,
      startX: clientX,
      startWidth: columnWidths[colKey] || defaultWidths[colKey] || 80,
    };
    activeRef.current = true;
    hasMovedRef.current = false;
    justResizedRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    // Prevent text selection on mobile
    document.body.style.webkitUserSelect = 'none';
  }, [columnWidths, defaultWidths]);

  useEffect(() => {
    const onMove = (e) => {
      if (!activeRef.current || !resizingCol.current) return;

      // Prevent page scrolling on mobile while resizing
      if (e.cancelable) {
        e.preventDefault();
      }

      // Get clientX from mouse or touch event
      let clientX;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if (e.clientX !== undefined) {
        clientX = e.clientX;
      } else {
        return; // No valid coordinate
      }

      const diff = clientX - resizingCol.current.startX;
      if (Math.abs(diff) > 1) {
        hasMovedRef.current = true;
      }

      const newWidth = Math.max(1, resizingCol.current.startWidth + diff);
      const colKey = resizingCol.current.key;
      // Throttle updates using requestAnimationFrame to prevent rapid re-renders (mobile crash fix)
      pendingWidth.current = { key: colKey, width: newWidth };
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          if (pendingWidth.current) {
            const { key, width } = pendingWidth.current;
            setColumnWidths(prev => ({
              ...prev,
              [key]: width,
            }));
            pendingWidth.current = null;
          }
          rafId.current = null;
        });
      }
    };

    const onUp = (e) => {
      if (!activeRef.current) return;
      activeRef.current = false;
      resizingCol.current = null;
      pendingWidth.current = null;
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      // Suppress any accidental click/sort trigger following drag release
      if (hasMovedRef.current) {
        const suppressClick = (clickEv) => {
          clickEv.stopPropagation();
          clickEv.preventDefault();
          window.removeEventListener('click', suppressClick, true);
        };
        window.addEventListener('click', suppressClick, true);
        setTimeout(() => {
          window.removeEventListener('click', suppressClick, true);
        }, 300);
      }

      setTimeout(() => {
        justResizedRef.current = false;
        hasMovedRef.current = false;
      }, 300);

      setColumnWidths(prev => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(prev));
        } catch (e) {
          console.warn('useColumnResize: failed to save localStorage', e);
        }
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
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [storageKey]);

  const resetColumnWidths = useCallback(() => {
    setColumnWidths({ ...defaultWidths });
    try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
  }, [defaultWidths, storageKey]);

  const isResizing = useCallback(() => activeRef.current || justResizedRef.current, []);

  return { columnWidths, handleResizeMouseDown, resetColumnWidths, isResizing, justResizedRef };
}
