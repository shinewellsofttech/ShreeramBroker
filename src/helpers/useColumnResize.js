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

  const handleResizeMouseDown = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    resizingCol.current = {
      key: colKey,
      startX: clientX,
      startWidth: columnWidths[colKey] || defaultWidths[colKey] || 80,
    };
    activeRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths, defaultWidths]);

  useEffect(() => {
    const onMove = (e) => {
      if (!activeRef.current || !resizingCol.current) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const diff = clientX - resizingCol.current.startX;
      const newWidth = Math.max(30, resizingCol.current.startWidth + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizingCol.current.key]: newWidth,
      }));
    };

    const onUp = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      resizingCol.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
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
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [storageKey]);

  const resetColumnWidths = useCallback(() => {
    setColumnWidths({ ...defaultWidths });
    try { localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
  }, [defaultWidths, storageKey]);

  return { columnWidths, handleResizeMouseDown, resetColumnWidths };
}
