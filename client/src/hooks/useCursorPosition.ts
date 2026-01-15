import { useCallback, useEffect, useLayoutEffect, RefObject, useRef } from 'react';

/**
 * Production-ready cursor positioning hook for typing tests
 * 
 * Key features:
 * - Synchronous position updates using useLayoutEffect
 * - No caching (modern browsers handle getBoundingClientRect efficiently)
 * - Uses data-char-index attribute for reliable element lookup
 * - Handles RTL languages (Arabic, Hebrew)
 * - Responsive to resize, orientation changes, and font loading
 * - Smooth animation with GPU-accelerated transforms
 */

interface CursorCharGroup {
  chars: Array<{ char: string; globalIndex: number }>;
  isSpace: boolean;
}

interface UseCursorPositionOptions {
  /** Ref to the container element holding the text */
  containerRef: RefObject<HTMLDivElement>;
  /** Ref to the caret/cursor element */
  caretRef: RefObject<HTMLDivElement>;
  /** Current cursor position (number of typed characters) */
  cursorIndex: number;
  /** Word-grouped characters to match DOM wrapping behavior */
  wordGroups: CursorCharGroup[];
  /** Whether the language/layout is RTL */
  isRTL: boolean;
  /** Whether the test is finished */
  isFinished: boolean;
  /** Whether to use smooth transitions */
  smoothCaret?: boolean;
  /** Whether user prefers reduced motion */
  prefersReducedMotion?: boolean;
  /** Optional callback to observe computed caret position (content coordinates) */
  onPositionChange?: (pos: { left: number; top: number; height: number }) => void;
}

/**
 * Hook that manages cursor position for typing tests
 * Updates cursor position synchronously after DOM changes
 */
export function useCursorPosition({
  containerRef,
  caretRef,
  cursorIndex,
  wordGroups,
  isRTL,
  isFinished,
  smoothCaret = true,
  prefersReducedMotion = false,
  onPositionChange,
}: UseCursorPositionOptions): void {
  const rafIdRef = useRef<number | null>(null);
  const lastCursorUpdateRef = useRef<number>(0);
  const pendingCursorIndexRef = useRef<number>(0);
  const burstDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFastKeysRef = useRef<number>(0);

  const layoutRef = useRef<{
    columns: number;
    totalChars: number;
    positions: Array<{ line: number; col: number }>;
    ready: boolean;
  }>({
    columns: 1,
    totalChars: 0,
    positions: [],
    ready: false,
  });

  const metricsRef = useRef<{
    charWidth: number;
    lineHeight: number;
    paddingLeft: number;
    paddingTop: number;
    paddingRight: number;
    containerWidth: number;
    columns: number;
    ready: boolean;
  }>({
    charWidth: 0,
    lineHeight: 0,
    paddingLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    containerWidth: 0,
    columns: 1,
    ready: false,
  });

  const measureMetrics = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const style = getComputedStyle(container);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;

    const fontSize = parseFloat(style.fontSize) || 16;
    const parsedLineHeight = parseFloat(style.lineHeight);
    const lineHeight = (isFinite(parsedLineHeight) && parsedLineHeight > 0)
      ? parsedLineHeight
      : Math.round(fontSize * 1.35);

    let charWidth = 0;
    try {
      const meas = document.createElement('span');
      meas.textContent = 'MMMMMMMMMM';
      meas.style.position = 'absolute';
      meas.style.visibility = 'hidden';
      meas.style.whiteSpace = 'pre';
      meas.style.pointerEvents = 'none';
      meas.style.fontFamily = style.fontFamily;
      meas.style.fontSize = style.fontSize;
      meas.style.fontWeight = style.fontWeight;
      meas.style.letterSpacing = style.letterSpacing;
      meas.style.fontStyle = style.fontStyle;
      meas.style.fontVariantLigatures = (style as any).fontVariantLigatures || '';
      container.appendChild(meas);
      const rect = meas.getBoundingClientRect();
      container.removeChild(meas);
      charWidth = rect.width / 10;
    } catch {
      charWidth = Math.max(1, Math.round(fontSize * 0.6));
    }

    if (!isFinite(charWidth) || charWidth <= 0) {
      charWidth = Math.max(1, Math.round(fontSize * 0.6));
    }

    const containerWidth = container.clientWidth;
    const contentWidth = Math.max(1, containerWidth - paddingLeft - paddingRight);
    const columns = Math.max(1, Math.floor(contentWidth / charWidth));

    metricsRef.current = {
      charWidth,
      lineHeight,
      paddingLeft,
      paddingTop,
      paddingRight,
      containerWidth,
      columns,
      ready: true,
    };
  }, [containerRef]);

  const buildLayout = useCallback(() => {
    const metrics = metricsRef.current;
    const columns = Math.max(1, metrics.columns);

    let totalChars = 0;
    for (const group of wordGroups) {
      const last = group.chars[group.chars.length - 1];
      if (last) totalChars = Math.max(totalChars, last.globalIndex + 1);
    }
    
    // CRITICAL FIX: Skip redundant layout rebuilds if content hasn't changed
    // This prevents 2x+ calls per keystroke that were causing severe lag
    const currentLayout = layoutRef.current;
    if (currentLayout.ready && 
        currentLayout.totalChars === totalChars && 
        currentLayout.columns === columns) {
      return; // Layout unchanged, skip expensive position calculations
    }

    const positions: Array<{ line: number; col: number }> = new Array(totalChars + 1);

    let line = 0;
    let col = 0;

    for (const group of wordGroups) {
      const wordLen = group.chars.length;

      if (!group.isSpace && col > 0 && col + wordLen > columns) {
        line += 1;
        col = 0;
      }

      if (!group.isSpace && wordLen > columns) {
        for (const ch of group.chars) {
          const idx = ch.globalIndex;
          positions[idx] = { line, col };
          col += 1;
          if (col >= columns) {
            line += 1;
            col = 0;
          }
        }
        continue;
      }

      if (group.isSpace) {
        for (const ch of group.chars) {
          const idx = ch.globalIndex;
          positions[idx] = { line, col };
          if (ch.char === '\n') {
            line += 1;
            col = 0;
            continue;
          }
          col += 1;
          if (col >= columns) {
            line += 1;
            col = 0;
          }
        }
      } else {
        for (const ch of group.chars) {
          const idx = ch.globalIndex;
          positions[idx] = { line, col };
          col += 1;
        }
      }
    }

    positions[totalChars] = { line, col };
    layoutRef.current = { columns, totalChars, positions, ready: true };
  }, [wordGroups]);

  /**
   * Core position update function
   * Calculates and applies cursor position directly to DOM
   */
  const updatePosition = useCallback(() => {
    const container = containerRef.current;
    const caret = caretRef.current;
    
    if (!container || !caret || isFinished) return;

    // Prefer DOM-accurate positioning using the rendered grapheme spans.
    // This is critical for complex scripts (e.g., Devanagari/Marathi) where fixed-width math drifts.
    try {
      const caretWidth = (() => {
        const w = parseFloat(getComputedStyle(caret).width);
        return Number.isFinite(w) && w > 0 ? w : 2;
      })();

      const getTotalChars = () => {
        let total = 0;
        for (const group of wordGroups) {
          const last = group.chars[group.chars.length - 1];
          if (last) total = Math.max(total, last.globalIndex + 1);
        }
        return total;
      };

      const totalChars = getTotalChars();
      const clampedIndex = Math.max(0, Math.min(cursorIndex, totalChars));
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = (container as any).scrollLeft || 0;
      const scrollTop = container.scrollTop || 0;

      const querySpan = (idx: number): HTMLElement | null => {
        return container.querySelector(`[data-char-index="${idx}"]`) as HTMLElement | null;
      };

      const applyFromRect = (rect: DOMRect | { left: number; top: number; width: number; height: number; right: number; bottom: number }) => {
        const leftPx = isRTL
          ? (rect.right - containerRect.left + scrollLeft - caretWidth)
          : (rect.left - containerRect.left + scrollLeft);
        const topPx = rect.top - containerRect.top + scrollTop;
        const heightPx = rect.height;

        const rLeft = Math.max(0, Math.round(leftPx));
        const rTop = Math.max(0, Math.round(topPx));
        const rHeight = Math.max(2, Math.round(heightPx || 0));

        caret.style.transform = `translate3d(${rLeft}px, ${rTop}px, 0)`;
        caret.style.height = `${rHeight}px`;
        onPositionChange?.({ left: rLeft, top: rTop, height: rHeight });

        if (prefersReducedMotion || !smoothCaret) {
          caret.classList.add('no-transition');
        } else {
          caret.classList.remove('no-transition');
        }
      };

      // Normal case: caret before the next grapheme
      if (clampedIndex < totalChars) {
        const span = querySpan(clampedIndex);
        if (span) {
          applyFromRect(span.getBoundingClientRect());
          return;
        }
      }

      // End-of-text: caret after the last grapheme (handles wraps/ligatures)
      if (clampedIndex === totalChars && totalChars > 0) {
        const lastSpan = querySpan(totalChars - 1);
        if (lastSpan) {
          try {
            const range = document.createRange();
            range.setStartAfter(lastSpan);
            range.setEndAfter(lastSpan);
            const rects = range.getClientRects();
            if (rects && rects.length > 0) {
              applyFromRect(rects[rects.length - 1]);
              return;
            }
          } catch {
            // fall through to simple last-span edge positioning
          }

          const lastRect = lastSpan.getBoundingClientRect();
          const syntheticRect = {
            left: isRTL ? lastRect.left : lastRect.right,
            right: isRTL ? lastRect.left : lastRect.right,
            top: lastRect.top,
            bottom: lastRect.bottom,
            width: 0,
            height: lastRect.height,
          };
          applyFromRect(syntheticRect as any);
          return;
        }
      }
    } catch {
      // Ignore DOM measurement errors and fall back to math positioning.
    }

    const metrics = metricsRef.current;
    const layout = layoutRef.current;
    if (!metrics.ready || !layout.ready) return;

    const clampedIndex = Math.max(0, Math.min(cursorIndex, layout.totalChars));
    const pos = layout.positions[clampedIndex] || layout.positions[layout.totalChars] || { line: 0, col: 0 };
    const line = pos.line;
    const col = pos.col;
    const height = metrics.lineHeight;

    let left = metrics.paddingLeft + col * metrics.charWidth;
    const top = metrics.paddingTop + line * metrics.lineHeight;

    if (isRTL) {
      left = metrics.containerWidth - metrics.paddingRight - col * metrics.charWidth - 2;
    }

    const rLeft = Math.max(0, Math.round(left));
    const rTop = Math.max(0, Math.round(top));
    const rHeight = Math.max(2, Math.round(height));

    // Apply position directly to DOM (GPU-accelerated)
    caret.style.transform = `translate3d(${rLeft}px, ${rTop}px, 0)`;
    caret.style.height = `${rHeight}px`;

    onPositionChange?.({ left: rLeft, top: rTop, height: rHeight });

    // Toggle transition based on typing activity
    if (prefersReducedMotion || !smoothCaret) {
      caret.classList.add('no-transition');
    } else {
      caret.classList.remove('no-transition');
    }
  }, [containerRef, caretRef, cursorIndex, isRTL, isFinished, smoothCaret, prefersReducedMotion, onPositionChange]);

  // Coalesced scheduling to avoid redundant layout work in a single frame
  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  /**
   * Update cursor position on cursorIndex change
   * Ultra-robust for 250+ WPM (< 50ms between keystrokes):
   * - Uses debounced updates during burst typing to prevent all DOM operations
   * - Falls back to RAF coalescing for fast typing (150-250 WPM)
   * - Uses synchronous updates for normal speeds for precise positioning
   */
  useLayoutEffect(() => {
    const now = performance.now();
    const timeSinceLastUpdate = now - lastCursorUpdateRef.current;
    
    // Detect ultra-fast typing (250+ WPM = < 50ms between keys)
    const isUltraFast = timeSinceLastUpdate < 50;
    const isFast = timeSinceLastUpdate < 80;
    
    // Track consecutive fast keystrokes
    if (isFast) {
      consecutiveFastKeysRef.current++;
    } else {
      consecutiveFastKeysRef.current = 0;
    }
    
    // For ultra-fast burst typing (250+ WPM for 10+ consecutive keys):
    // Use RAF coalescing instead of skipping updates entirely
    // The previous 100ms debounce was too aggressive and caused caret to freeze
    if (isUltraFast && consecutiveFastKeysRef.current >= 10) {
      pendingCursorIndexRef.current = cursorIndex;
      // Use RAF coalescing instead of debounce - this is fast enough
      // and ensures caret position stays current for scroll calculations
      scheduleUpdate();
      return;
    }
    
    // For fast typing (150-250 WPM), use RAF coalescing
    if (isFast) {
      pendingCursorIndexRef.current = cursorIndex;
      scheduleUpdate();
    } else {
      // For normal typing speed, update synchronously for precise caret positioning
      lastCursorUpdateRef.current = now;
      updatePosition();
    }
  }, [updatePosition, cursorIndex, scheduleUpdate]);

  /**
   * Initialize metrics and layout on mount or when layout dependencies change
   * CRITICAL FIX: Also schedule position update when layout changes (text extends)
   * This ensures caretPosRef is fresh for scroll calculations after text extends
   */
  useLayoutEffect(() => {
    measureMetrics();
    buildLayout();
    // Schedule a position update to refresh caretPosRef after layout changes
    scheduleUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureMetrics, buildLayout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      measureMetrics();
      buildLayout();
      scheduleUpdate();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, measureMetrics, buildLayout, scheduleUpdate]);

  /**
   * Handle window resize and orientation changes
   */
  useEffect(() => {
    const handleResize = () => {
      measureMetrics();
      buildLayout();
      scheduleUpdate();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [measureMetrics, buildLayout, scheduleUpdate]);

  /**
   * Handle visibility change (tab switching, screen wake)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [scheduleUpdate]);

  /**
   * Handle font loading - positions may change after fonts load
   */
  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        measureMetrics();
        buildLayout();
        scheduleUpdate();
      });
    }
  }, [measureMetrics, buildLayout, scheduleUpdate]);

  // Layout is already built in the previous useLayoutEffect when buildLayout changes
  // Only schedule an update when wordGroups change (buildLayout dependency)
  useLayoutEffect(() => {
    scheduleUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildLayout]);

  // Cleanup any pending rAF and debounce timers on unmount
  useEffect(() => () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (burstDebounceRef.current !== null) {
      clearTimeout(burstDebounceRef.current);
      burstDebounceRef.current = null;
    }
  }, []);
}

export default useCursorPosition;

