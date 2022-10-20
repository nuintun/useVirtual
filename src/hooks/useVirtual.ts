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
  isNumber,
  now
} from '../utils';
import { usePrevious } from './usePrevious';
import { useIsMounted } from './useIsMounted';
import { useStableCallback } from './useStableCallback';
import { useResizeObserver } from './useResizeObserver';
import { Align, Item, MappingKeys, Measure, Methods, Options, ScrollTo, ScrollToItem, Viewport } from '../types';

export function useVirtual(
  length: number,
  { size, frame, onLoad, infinite, onResize, onScroll, stickies, viewport, scrolling, horizontal, overscan = 10 }: Options
): [items: Item[], methods: Methods] {
  const offsetRef = useRef(0);
  const rafRef = useRef<number>();
  const isMounted = useIsMounted();
  const prevSize = usePrevious(size);
  const anchorRef = useRef<Measure>();
  const remeasureIndexRef = useRef(-1);
  const measuresRef = useRef<Measure[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [observe, unobserve] = useResizeObserver();
  const isSizeChanged = size.toString() !== prevSize?.toString();
  const viewportRectRef = useRef<Viewport>({ width: 0, height: 0 });

  const [sizeKey, offsetKey, scrollKey, scrollToKey, scrollSizeKey] = useMemo<MappingKeys>(() => {
    if (horizontal) {
      return ['width', 'marginLeft', 'scrollLeft', 'left', 'scrollWidth'];
    }

    return ['height', 'marginTop', 'scrollTop', 'top', 'scrollHeight'];
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

  const scrollTo = useStableCallback<ScrollTo>((value, callback) => {
    if (viewport && isMounted()) {
      const { offset, smooth } = getScrollToOptions(value);

      if (isNumber(offset)) {
        remeasure();

        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
        }

        const { current: prevOffset } = offsetRef;
        const nextOffset = Math.min(offset, viewport[scrollSizeKey]);

        if (nextOffset !== prevOffset) {
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
            const duration = getDuration(config.duration, Math.abs(distance));

            const scroll = () => {
              if (viewport && isMounted()) {
                const time = Math.min((now() - start) / duration, 1);

                scrollTo(config.easing(time) * distance + prevOffset);

                if (time < 1) {
                  rafRef.current = requestAnimationFrame(scroll);
                } else {
                  callback?.();
                }
              }
            };

            rafRef.current = requestAnimationFrame(scroll);
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
      remeasure();

      const { index, smooth, align } = getScrollToItemOptions(value);

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
  });

  const setVirtualItems = useStableCallback((offset: number) => {
    remeasure();

    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    const [start, end] = getVirtualRange(viewport[sizeKey], offset, measures, anchorRef.current);

    const overscanStart = Math.max(start - overscan, 0);
    const overscanEnd = Math.min(end + overscan, measures.length - 1);

    if (frame) {
      const { style } = frame;
      const { end } = measures[overscanEnd];
      const { start } = measures[overscanStart];

      style[offsetKey] = `${start}px`;
      style[sizeKey] = `${end - start}px`;
    }

    setItems([]);
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

          setVirtualItems(offset);

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
