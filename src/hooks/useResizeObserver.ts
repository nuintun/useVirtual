/**
 * @module useResizeObserver
 */

import { Rect } from '../types';
import { useCallback, useEffect, useMemo } from 'react';

export interface Unobserve {
  (target: Element): void;
}

export interface ResizeObserverCallback {
  (entry: ResizeObserverEntry): void;
}

export interface Observe {
  (target: Element, callback: ResizeObserverCallback, options?: ResizeObserverOptions): void;
}

/**
 * @function useResizeObserver
 * @description [hook] 监听元素尺寸变化
 */
export function useResizeObserver(): [observe: Observe, unobserve: Unobserve] {
  const callbacks = useMemo(() => {
    return new Map<Element, ResizeObserverCallback>();
  }, []);

  const observer = useMemo(() => {
    return new ResizeObserver(entries => {
      for (const entry of entries) {
        const { target } = entry;
        const callback = callbacks.get(target);

        if (callback) {
          callback(entry);
        }
      }
    });
  }, []);

  const observe = useCallback<Observe>((target, callback, options) => {
    callbacks.set(target, callback);

    observer.observe(target, options);
  }, []);

  const unobserve = useCallback((target: Element) => {
    callbacks.delete(target);

    observer.unobserve(target);
  }, []);

  useEffect(() => {
    return () => {
      observer.disconnect();

      callbacks.clear();
    };
  }, []);

  return [observe, unobserve];
}

/**
 * @function getBoundingRect
 * @param entry
 * @param borderBox
 */
export function getBoundingRect(entry: ResizeObserverEntry, borderBox?: boolean): Rect {
  const mapping: Record<string, boolean> = {
    tb: true,
    'tb-rl': true,
    'vertical-rl': true,
    'vertical-lr': true
  };
  const { writingMode } = getComputedStyle(entry.target);
  const [{ blockSize, inlineSize }] = borderBox ? entry.borderBoxSize : entry.contentBoxSize;

  return mapping[writingMode] ? { width: blockSize, height: inlineSize } : { width: inlineSize, height: blockSize };
}
