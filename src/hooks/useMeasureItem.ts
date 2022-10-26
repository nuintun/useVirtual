/**
 * @module useMeasureItem
 */

import { useCallback, useEffect, useMemo } from 'react';
import { ResizeObserverCallback, useResizeObserver } from './useResizeObserver';

export interface MeasureItem {
  (index: number, callback: ResizeObserverCallback): (element: HTMLElement | null) => void;
}

/**
 * @function useMeasureItem
 * @description [hook] 获取序列表项尺寸测量函数
 */
export function useMeasureItem(): MeasureItem {
  const elements = useMemo(() => {
    return new Map<number, HTMLElement>();
  }, []);
  const [observe, unobserve] = useResizeObserver();

  useEffect(() => {
    return () => {
      elements.clear();
    };
  }, []);

  return useCallback<MeasureItem>((index, callback) => {
    return element => {
      const prevElement = elements.get(index);

      if (element) {
        if (element !== prevElement) {
          if (prevElement) {
            unobserve(prevElement);
          }

          element.style.margin = '0px';

          observe(element, callback);

          elements.set(index, element);
        }
      } else {
        if (prevElement) {
          unobserve(prevElement);
        }

        elements.delete(index);
      }
    };
  }, []);
}
