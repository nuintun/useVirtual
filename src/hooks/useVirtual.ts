/**
 * @module useVirtual
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getDuration,
  getMeasure,
  getScrolling,
  getScrollToItemOptions,
  getScrollToOptions,
  getVirtualRange,
  isFunction,
  isNumber,
  now
} from '../utils';
import { usePrevious } from './usePrevious';
import { useIsMounted } from './useIsMounted';
import { useStableCallback } from './useStableCallback';
import { useResizeObserver } from './useResizeObserver';
import { Align, Item, MappingKeys, Measure, Methods, OnScroll, Options, ScrollTo, ScrollToItem, Viewport } from '../types';

export function useVirtual(
  length: number,
  { size, frame, onLoad, infinite, onResize, onScroll, stickies = [], viewport, scrolling, horizontal, overscan = 10 }: Options
): [items: Item[], methods: Methods] {
  const offsetRef = useRef(0);
  const isMounted = useIsMounted();
  const anchorRef = useRef<Measure>();
  const remeasureIndexRef = useRef(-1);
  const scrollRafRef = useRef<number>();
  const refreshRafRef = useRef<number>();
  const measuresRef = useRef<Measure[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [observe, unobserve] = useResizeObserver();
  const viewportRectRef = useRef<Viewport>({ width: 0, height: 0 });
  const isSizeChanged = size.toString() !== usePrevious(size)?.toString();

  const [sizeKey, offsetKey, scrollKey, boxSizeKey, scrollToKey, scrollSizeKey] = useMemo<MappingKeys>(() => {
    if (horizontal) {
      return ['width', 'marginLeft', 'scrollLeft', 'inlineSize', 'left', 'scrollWidth'];
    }

    return ['height', 'marginTop', 'scrollTop', 'blockSize', 'top', 'scrollHeight'];
  }, [horizontal]);

  const measure = useStableCallback((start: number) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    let index = Math.min(start, measures.length);

    const nextMeasures = measures.slice(0, index);

    for (; index < length; index++) {
      nextMeasures.push(getMeasure(index, measures, size, viewport));
    }

    measuresRef.current = nextMeasures;
  });

  const remeasure = useStableCallback(() => {
    const { current: remeasureIndex } = remeasureIndexRef;

    if (remeasureIndex >= 0) {
      measure(remeasureIndex);

      remeasureIndexRef.current = -1;
    }
  });

  const getOffset = useStableCallback((offset: number) => {
    return Math.min(offset, viewport![scrollSizeKey]);
  });

  const scrollTo = useStableCallback<ScrollTo>((value, callback) => {
    if (viewport && isMounted()) {
      const { offset, smooth } = getScrollToOptions(value);

      if (isNumber(offset)) {
        const nextOffset = getOffset(offset);
        const { current: prevOffset } = offsetRef;

        if (nextOffset !== prevOffset) {
          remeasure();

          const scrollTo = (offset: number): void => {
            viewport.scrollTo({
              behavior: 'auto',
              [scrollToKey]: offset
            });
          };

          if (smooth) {
            const start = now();
            const config = getScrolling(scrolling);
            const distance = nextOffset - prevOffset;
            const { current: scrollRaf } = scrollRafRef;
            const duration = getDuration(config.duration, Math.abs(distance));

            if (scrollRaf != null) {
              cancelAnimationFrame(scrollRaf);
            }

            const scroll = () => {
              if (viewport && isMounted()) {
                const time = Math.min((now() - start) / duration, 1);

                scrollTo(config.easing(time) * distance + prevOffset);

                if (time < 1) {
                  scrollRafRef.current = requestAnimationFrame(scroll);
                } else {
                  callback?.();
                }
              }
            };

            scrollRafRef.current = requestAnimationFrame(scroll);
          } else {
            scrollTo(nextOffset);

            callback?.();
          }
        }
      }
    }
  });

  const scrollToItem = useStableCallback<ScrollToItem>((value, callback) => {
    if (viewport && isMounted()) {
      const { index, smooth, align } = getScrollToItemOptions(value);

      if (isNumber(index)) {
        const { current: measures } = measuresRef;

        if (index < measures.length - 1) {
          remeasure();

          console.log(index, smooth, align);

          switch (align) {
            case Align.start:
              break;
            case Align.center:
              break;
            case Align.end:
              break;
            default:
              break;
          }

          callback?.();
        }
      }
    }
  });

  const setVirtualItems = useStableCallback((offset: number, onScroll?: OnScroll) => {
    remeasure();

    const nextOffset = getOffset(offset);
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    const [start, end] = getVirtualRange(viewport[sizeKey], nextOffset, measures, anchorRef.current);

    const maxIndex = measures.length - 1;
    const overscanStart = Math.max(start - overscan, 0);
    const overscanEnd = Math.min(end + overscan, maxIndex);

    if (frame) {
      const { style } = frame;
      const { end } = measures[overscanEnd];
      const { start } = measures[overscanStart];

      style[offsetKey] = `${start}px`;
      style[sizeKey] = `${end - start}px`;
    }

    const items: Item[] = [];

    for (let index = start; index <= end; index++) {
      const measure = measures[index];

      let prevElement: Element | null = null;

      items.push({
        index,
        viewport,
        size: measure.size,
        start: measure.start,
        sticky: stickies.includes(index),
        measure(element: Element | null): void {
          if (element) {
            if (element !== prevElement) {
              if (prevElement) {
                unobserve(prevElement);
              }

              observe(element, ({ borderBoxSize: [borderBoxSize] }) => {
                const size = borderBoxSize[boxSizeKey];

                if (size !== measure.size) {
                  const { current: refreshRaf } = refreshRafRef;

                  if (refreshRaf != null) {
                    cancelAnimationFrame(refreshRaf);
                  }

                  measures[index] = getMeasure(index, measures, size, viewport);

                  remeasureIndexRef.current = Math.min(index, remeasureIndexRef.current);

                  refreshRafRef.current = requestAnimationFrame(() => {
                    remeasure();

                    setVirtualItems(offset);
                  });
                }
              });
            }
          } else if (prevElement) {
            unobserve(prevElement);
          }

          prevElement = element;
        }
      });
    }

    setItems(items);

    if (isFunction(onScroll)) {
      onScroll({
        offset: nextOffset,
        visible: [start, end],
        overscan: [overscanStart, overscanEnd],
        forward: nextOffset > offsetRef.current
      });
    }

    if (infinite && overscanEnd >= maxIndex) {
      if (isFunction(onLoad)) {
        onLoad({
          offset: nextOffset,
          visible: [start, end],
          overscan: [overscanStart, overscanEnd]
        });
      }
    }
  });

  useEffect(() => {
    const { current: measures } = measuresRef;
    const { length: measuresLength } = measures;

    if (isSizeChanged) {
      measure(0);
    } else if (measuresLength !== length) {
      measure(Math.min(length, measuresLength));
    }
  }, [length, isSizeChanged]);

  useEffect(() => {
    if (viewport) {
      const onScroll = () => {
        if (viewport && isMounted()) {
          const offset = viewport[scrollKey];

          setVirtualItems(offset, onScroll);

          offsetRef.current = offset;
        }
      };

      observe(viewport, onScroll);

      viewport.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        unobserve(viewport);

        viewport.removeEventListener('scroll', onScroll);
      };
    }
  }, [viewport, sizeKey, offsetKey, scrollKey]);

  return [items, { scrollTo, scrollToItem }];
}
