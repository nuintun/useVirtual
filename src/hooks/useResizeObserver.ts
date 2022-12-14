/**
 * @module useResizeObserver
 */

import { useCallback, useEffect, useMemo } from 'react';

export interface Unobserve {
  (): void;
}

export interface ResizeObserverCallback {
  (entry: ResizeObserverEntry): void;
}

export interface Observe {
  (target: Element, callback: ResizeObserverCallback, options?: ResizeObserverOptions): Unobserve;
}

/**
 * @function useResizeObserver
 * @description [hook] 监听元素尺寸变化
 */
export function useResizeObserver(): Observe {
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

    return () => {
      callbacks.delete(target);

      observer.unobserve(target);
    };
  }, []);

  useEffect(() => {
    return () => {
      observer.disconnect();

      callbacks.clear();
    };
  }, []);

  return observe;
}
