/**
 * @module useResizeObserver
 */

import { useCallback, useEffect, useMemo } from 'react';

export interface Unobserve {
  (target: Element): void;
}

export interface ObserverCallback {
  (entry: ResizeObserverEntry, observer: ResizeObserver): void;
}

export interface Observe {
  (target: Element, callback: ObserverCallback, options?: ResizeObserverOptions): void;
}

/**
 * @function useResizeObserver
 * @description [hook] 监听元素尺寸变化
 */
export function useResizeObserver(): [observe: Observe, unobserve: Unobserve] {
  const callbacks = useMemo(() => {
    return new Map<Element, ObserverCallback>();
  }, []);

  const observer = useMemo(() => {
    return new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        const { target } = entry;
        const callback = callbacks.get(target);

        if (callback) {
          callback(entry, observer);
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
