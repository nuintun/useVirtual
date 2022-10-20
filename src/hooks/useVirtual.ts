/**
 * @module useVirtual
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Align,
  Item,
  MappingKeys,
  Measure,
  Methods,
  ObserverCallback,
  Options,
  ScrollTo,
  ScrollToItem,
  State,
  Viewport
} from '../types';
import { usePrevious } from './usePrevious';
import { useIsMounted } from './useIsMounted';
import { useStableCallback } from './useStableCallback';
import {
  getDuration,
  getMeasure,
  getScrolling,
  getScrollToItemOptions,
  getScrollToOptions,
  getVisibleRange,
  isNumber,
  now
} from '../utils';

export function useVirtual(
  length: number,
  { size, frame, onLoad, viewport, infinite, stickies, onResize, onScroll, horizontal, overscan = 10, scrolling }: Options
): [items: Item[], methods: Methods] {
  const offsetRef = useRef(0);
  const rafRef = useRef<number>();
  const isMounted = useIsMounted();
  const prevSize = usePrevious(size);
  const anchorRef = useRef<Measure>();
  const remeasureIndexRef = useRef(-1);
  const measuresRef = useRef<Measure[]>([]);
  const isSizeChanged = size.toString() !== prevSize?.toString();
  const viewportRectRef = useRef<Viewport>({ width: 0, height: 0 });
  const observerCallbacks = useMemo(() => new Map<Element, ObserverCallback>(), []);

  const [state, setState] = useState<State>(() => {
    return { items: [], frame: { size: 0, offset: 0 } };
  });

  const observer = useMemo(() => {
    return new ResizeObserver((entries, observer) => {
      for (const entry of entries) {
        const { target } = entry;
        const callback = observerCallbacks.get(target);

        if (callback) {
          callback(entry, observer);
        }
      }
    });
  }, []);

  const [sizeKey, offsetKey, scrollKey, scrollToKey] = useMemo<MappingKeys>(() => {
    if (horizontal) {
      return ['width', 'marginLeft', 'scrollLeft', 'left'];
    }

    return ['height', 'marginTop', 'scrollTop', 'top'];
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
        const nextOffset = Math.min(offset, viewport[scrollKey]);

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
    }
  });

  const onVisibleChange = useStableCallback((offset: number) => {
    const { current: prevOffset } = offsetRef;

    if (offset !== prevOffset) {
      const { current: measures } = measuresRef;
      const { current: viewport } = viewportRectRef;

      remeasure();

      const [vStart, vEnd] = getVisibleRange(viewport[sizeKey], offset, measures, anchorRef.current);

      const oStart = Math.max(vStart - overscan, 0);
      const oEnd = Math.min(vEnd + overscan, measures.length - 1);

      const measure = measures[oEnd];
      const frameOffset = measures[oStart].start;
      const frameSize = measure.end - frameOffset;
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
    if (frame) {
      observerCallbacks.set(frame, entry => {
        console.log(entry);
      });

      observer.observe(frame);
    }

    return () => {
      if (frame) {
        observer.unobserve(frame);
        observerCallbacks.delete(frame);
      }
    };
  }, [frame]);

  useEffect(() => {
    const onScroll = () => {
      if (viewport && isMounted()) {
        offsetRef.current = viewport[scrollKey];
      }
    };

    if (viewport) {
      observerCallbacks.set(viewport, entry => {
        console.log(entry);
      });

      observer.observe(viewport);
      viewport.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      if (viewport) {
        observer.unobserve(viewport);
        observerCallbacks.delete(viewport);
        viewport.removeEventListener('scroll', onScroll);
      }
    };
  }, [viewport, sizeKey, offsetKey, scrollKey]);

  useEffect(() => {
    return () => {
      observer.disconnect();
    };
  }, []);

  return [state.items, { scrollTo, scrollToItem }];
}
