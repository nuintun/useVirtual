/**
 * @module index
 */

import { now } from './utils/now';
import { Align } from './utils/align';
import { getSize } from './utils/size';
import { useKeys } from './hooks/useKeys';
import { isEqualState } from './utils/equal';
import { setMeasure } from './utils/measure';
import { getBoundingRect } from './utils/rect';
import { getInitialState } from './utils/state';
import { getVirtualRange } from './utils/range';
import { getScrollOffset } from './utils/offset';
import { Events, useEvent } from './utils/events';
import { abortAnimationFrame } from './utils/raf';
import { usePrevious } from './hooks/usePrevious';
import { useIsMounted } from './hooks/useIsMounted';
import { removeStyles, setStyles } from './utils/styles';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useStableCallback } from './hooks/useStableCallback';
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getDuration, getScrolling, getScrollToItemOptions, getScrollToOptions } from './utils/scroll';
import { Item, Measure, Methods, Options, Rect, ScrollTo, ScrollToItem, State } from './utils/interface';

// Export typescript types
export type { Item, Options, ScrollToItemOptions, ScrollToOptions } from './utils/interface';

/**
 * @function useVirtual
 * @param count
 * @param options
 */
export default function useVirtual<T extends HTMLElement, U extends HTMLElement>(
  count: number,
  { size, onLoad, onResize, onScroll, scrolling, horizontal, overscan = 10 }: Options
): [items: Item[], viewportRef: RefObject<T>, frameRef: RefObject<U>, methods: Methods] {
  if (__DEV__) {
    if (count !== count >>> 0) {
      throw new RangeError('virtual count must be an integer not less than 0');
    }

    if (overscan !== overscan >>> 0) {
      throw new RangeError('options.overscan must be an integer not less than 0');
    }
  }

  const frameRef = useRef<U>(null);
  const isMounted = useIsMounted();
  const scrollOffsetRef = useRef(0);
  const prevSize = usePrevious(size);
  const scrollingRef = useRef(false);
  const observe = useResizeObserver();
  const viewportRef = useRef<T>(null);
  const remeasureIndexRef = useRef(-1);
  const scrollRafRef = useRef<number>();
  const scrollToRafRef = useRef<number>();
  const anchorIndexRef = useRef<number>(0);
  const measuresRef = useRef<Measure[]>([]);
  const [state, setState] = useState<State>(getInitialState);
  const viewportRectRef = useRef<Rect>({ width: 0, height: 0 });
  const [sizeKey, offsetKey, scrollToKey, scrollOffsetKey] = useKeys(horizontal);

  const stateUpdate = useCallback((state: State): void => {
    setState(prevState => {
      return isEqualState(state, prevState) ? prevState : state;
    });
  }, []);

  const scrollToOffset = useStableCallback((offset: number): void => {
    viewportRef.current?.scrollTo({
      behavior: 'auto',
      [scrollToKey]: offset
    });
  });

  const remeasure = useStableCallback((): void => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;
    const { current: remeasureIndex } = remeasureIndexRef;

    if (remeasureIndex >= 0) {
      for (let index = remeasureIndex; index < count; index++) {
        setMeasure(measures, index, getSize(index, size, measures, viewport));
      }

      remeasureIndexRef.current = -1;
    }
  });

  const update = useStableCallback((scrollOffset: number, events: number): void => {
    if (isMounted()) {
      remeasure();

      const { current: measures } = measuresRef;
      const { current: viewport } = viewportRectRef;

      const viewportSize = viewport[sizeKey];
      const offset = getScrollOffset(viewportSize, scrollOffset, measures);
      const range = getVirtualRange(viewportSize, scrollOffset, measures, anchorIndexRef.current);

      if (range) {
        const items: Item[] = [];
        const [start, end] = range;
        const maxIndex = measures.length - 1;
        const startIndex = Math.max(start - overscan, 0);
        const endIndex = Math.min(end + overscan, maxIndex);

        anchorIndexRef.current = start;

        for (let index = startIndex; index <= endIndex; index++) {
          const measure = measures[index];

          items.push({
            index,
            viewport,
            end: measure.end,
            size: measure.size,
            start: measure.start,
            observe: element => {
              setStyles(element, [['margin', '0']]);

              return observe(
                element,
                entry => {
                  const { current: frame } = frameRef;
                  const { current: measures } = measuresRef;

                  if (frame && index < measures.length) {
                    const { start, size } = measures[index];
                    const nextSize = getBoundingRect(entry)[sizeKey];

                    if (nextSize !== size && frame.contains(entry.target)) {
                      setMeasure(measures, index, nextSize);

                      const { current: scrollOffset } = scrollOffsetRef;
                      const { current: remeasureIndex } = remeasureIndexRef;

                      if (remeasureIndex < 0) {
                        remeasureIndexRef.current = index;
                      } else {
                        remeasureIndexRef.current = Math.min(index, remeasureIndex);
                      }

                      // To prevent dynamic size from jumping during backward scrolling
                      if (index <= anchorIndexRef.current && start < scrollOffset) {
                        scrollToOffset(scrollOffset + nextSize - size);
                      } else if (!scrollingRef.current) {
                        update(scrollOffset, Events.onLoad);
                      }
                    }
                  }
                },
                { box: 'border-box' }
              );
            }
          });
        }

        stateUpdate({
          items,
          frame: [measures[startIndex].start, measures[maxIndex].end]
        });

        if (useEvent(events, Events.onResize)) {
          onResize?.(viewport);
        }

        if (useEvent(events, Events.onScroll)) {
          onScroll?.({
            offset,
            visible: [start, end],
            overscan: [startIndex, endIndex],
            delta: offset - scrollOffsetRef.current
          });
        }

        if (endIndex >= maxIndex && useEvent(events, Events.onLoad)) {
          onLoad?.({
            offset,
            visible: [start, end],
            overscan: [startIndex, endIndex]
          });
        }
      } else {
        stateUpdate({
          items: [],
          frame: [0, -1]
        });

        if (useEvent(events, Events.onResize)) {
          onResize?.(viewport);
        }

        if (viewportSize > 0 && useEvent(events, Events.onLoad)) {
          onLoad?.({
            offset,
            visible: [-1, -1],
            overscan: [-1, -1]
          });
        }
      }
    }
  });

  const scrollTo = useStableCallback<ScrollTo>((value, callback) => {
    if (isMounted()) {
      remeasure();

      const config = getScrollToOptions(value);
      const { current: scrollOffset } = scrollOffsetRef;
      const viewportSize = viewportRectRef.current[sizeKey];
      const offset = getScrollOffset(viewportSize, config.offset, measuresRef.current);

      const onComplete = () => {
        if (callback) {
          // Delay 4 frames for painting completion
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  if (isMounted()) {
                    callback();
                  }
                });
              });
            });
          });
        }
      };

      if (offset !== scrollOffset) {
        if (config.smooth) {
          const start = now();
          const config = getScrolling(scrolling);
          const distance = offset - scrollOffset;
          const duration = getDuration(config.duration, Math.abs(distance));

          abortAnimationFrame(scrollToRafRef.current);

          const scroll = (): void => {
            if (isMounted()) {
              const time = Math.min((now() - start) / duration, 1);

              scrollToOffset(config.easing(time) * distance + scrollOffset);

              if (time < 1) {
                scrollToRafRef.current = requestAnimationFrame(scroll);
              } else {
                onComplete();
              }
            }
          };

          scrollToRafRef.current = requestAnimationFrame(scroll);
        } else {
          scrollToOffset(offset);

          onComplete();
        }
      } else {
        onComplete();
      }
    }
  });

  const scrollToItem = useStableCallback<ScrollToItem>((value, callback) => {
    if (isMounted()) {
      const { index, align, smooth } = getScrollToItemOptions(value);

      const getOffset = (index: number): number => {
        remeasure();

        const { current: measures } = measuresRef;
        const maxIndex = measures.length - 1;

        if (maxIndex >= 0) {
          index = Math.max(0, Math.min(index, maxIndex));

          const { start, size, end } = measures[index];
          const viewport = viewportRectRef.current[sizeKey];

          let { current: offset } = scrollOffsetRef;

          switch (align) {
            case Align.start:
              offset = start;
              break;
            case Align.center:
              offset = start + size / 2 - viewport / 2;
              break;
            case Align.end:
              offset = end - viewport;
              break;
            default:
              if (end <= offset) {
                offset = start;
              } else if (start >= offset + viewport) {
                offset = end - viewport;
              }
              break;
          }

          return Math.max(0, getScrollOffset(viewport, offset, measures));
        }

        return -1;
      };

      const offset = getOffset(index);

      if (offset >= 0) {
        scrollTo({ offset, smooth }, () => {
          const nextOffset = getOffset(index);

          if (nextOffset >= 0 && nextOffset !== offset) {
            scrollToItem({ index, align, smooth }, callback);
          } else if (callback) {
            callback();
          }
        });
      }
    }
  });

  useLayoutEffect(() => {
    setStyles(frameRef.current, [
      ['margin', '0'],
      ['box-sizing', 'border-box']
    ]);

    setStyles(viewportRef.current, [['padding', '0']]);
  }, []);

  useLayoutEffect(() => {
    const paddingTop = 'padding-top';
    const paddingLeft = 'padding-left';
    const paddingRight = 'padding-right';
    const paddingBottom = 'padding-bottom';

    const { current: frame } = frameRef;

    if (horizontal) {
      setStyles(frame, [[paddingRight, '0']]);
      removeStyles(frame, ['height', paddingTop, paddingBottom]);
    } else {
      setStyles(frame, [[paddingBottom, '0']]);
      removeStyles(frame, ['width', paddingLeft, paddingRight]);
    }
  }, [horizontal]);

  const [frameOffset, frameSize] = state.frame;

  useLayoutEffect(() => {
    const { current: frame } = frameRef;

    if (frameSize < 0) {
      removeStyles(frame, [sizeKey]);
    } else {
      setStyles(frameRef.current, [[sizeKey, `${frameSize}px`]]);
    }
  }, [sizeKey, frameSize]);

  useLayoutEffect(() => {
    setStyles(frameRef.current, [[offsetKey, `${frameOffset}px`]]);
  }, [offsetKey, frameOffset]);

  useEffect(() => {
    const { current: viewport } = viewportRef;

    if (viewport) {
      const onScrollChange = () => {
        if (viewport && isMounted()) {
          abortAnimationFrame(scrollRafRef.current);

          scrollingRef.current = true;

          const scrollOffset = viewport[scrollOffsetKey];

          update(scrollOffset, Events.onScroll | Events.onLoad);

          scrollOffsetRef.current = scrollOffset;

          // Delay 2 frames for painting completion
          scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = requestAnimationFrame(() => {
              scrollingRef.current = false;

              update(scrollOffsetRef.current, 0);
            });
          });
        }
      };

      const unobserve = observe(viewport, entry => {
        const viewport = getBoundingRect(entry, true);

        if (viewport[sizeKey] !== viewportRectRef.current[sizeKey]) {
          viewportRectRef.current = viewport;

          update(scrollOffsetRef.current, Events.onResize);
        }
      });

      viewport.addEventListener('scroll', onScrollChange, { passive: true });

      return () => {
        unobserve();

        viewport.removeEventListener('scroll', onScrollChange);
      };
    }
  }, [sizeKey, scrollOffsetKey]);

  useEffect(() => {
    if (size !== prevSize) {
      remeasureIndexRef.current = 0;
      measuresRef.current.length = 0;
    } else {
      const { current: measures } = measuresRef;
      const { length } = measures;

      if (length > count) {
        measures.length = count;
      } else if (length < count) {
        remeasureIndexRef.current = length;
      }
    }

    const maxIndex = Math.max(0, count - 1);
    const { current: anchor } = anchorIndexRef;

    anchorIndexRef.current = Math.min(maxIndex, anchor);
  }, [count, size]);

  useEffect(() => {
    update(scrollOffsetRef.current, Events.onLoad);
  }, [count, size, horizontal]);

  return [state.items, viewportRef, frameRef, { scrollTo, scrollToItem }];
}
