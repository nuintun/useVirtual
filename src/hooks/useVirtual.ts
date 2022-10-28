/**
 * @module useVirtual
 */

import {
  abortAnimationFrame,
  getBoundingRect,
  getDuration,
  getScrolling,
  getScrollOffset,
  getScrollToItemOptions,
  getScrollToOptions,
  getSize,
  getVirtualRange,
  isEqualState,
  isFunction,
  isNumber,
  now,
  removeStyles,
  setMeasure,
  setStyles
} from '../utils';
import { useKeys } from './useKeys';
import { usePrevious } from './usePrevious';
import { useIsMounted } from './useIsMounted';
import { useLatestRef } from './useLatestRef';
import { useLayoutEffect } from './useLayoutEffect';
import { useResizeObserver } from './useResizeObserver';
import { useStableCallback } from './useStableCallback';
import { RefObject, useEffect, useRef, useState } from 'react';
import { Item, Measure, Methods, OnScroll, Options, Rect, ScrollTo, ScrollToItem, State } from '../types';

const enum Align {
  end = 'end',
  auto = 'auto',
  start = 'start',
  center = 'center'
}

export function useVirtual<T extends HTMLElement, U extends HTMLElement>(
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

  const offsetRef = useRef(0);
  const frameRef = useRef<U>(null);
  const isMounted = useIsMounted();
  const prevSize = usePrevious(size);
  const scrollingRef = useRef(false);
  const observe = useResizeObserver();
  const viewportRef = useRef<T>(null);
  const remeasureIndexRef = useRef(-1);
  const scrollRafRef = useRef<number>();
  const scrollToRafRef = useRef<number>();
  const anchorIndexRef = useRef<number>(0);
  const remeasureRafRef = useRef<number>();
  const measuresRef = useRef<Measure[]>([]);
  const onResizeRef = useLatestRef(onResize);
  const onScrollRef = useLatestRef(onScroll);
  const viewportRectRef = useRef<Rect>({ width: 0, height: 0 });
  const [sizeKey, offsetKey, scrollToKey, scrollOffsetKey] = useKeys(horizontal);
  const [state, setState] = useState<State>(() => ({ items: [], frame: [0, 0], visible: [-1, -1] }));

  const update = useStableCallback((offset: number, onScroll?: OnScroll) => {
    if (isMounted()) {
      const { current: measures } = measuresRef;
      const { current: viewport } = viewportRectRef;
      const { current: remeasureIndex } = remeasureIndexRef;

      if (remeasureIndex >= 0) {
        for (let index = remeasureIndex; index < count; index++) {
          setMeasure(measures, index, getSize(index, size, measures, viewport));
        }

        remeasureIndexRef.current = -1;
      }

      const items: Item[] = [];
      const { length } = measures;
      const viewportSize = viewport[sizeKey];
      const nextOffset = getScrollOffset(offset, measures);
      const range = getVirtualRange(viewportSize, nextOffset, measures, anchorIndexRef.current);

      if (range) {
        const [start, end] = range;
        const maxIndex = length - 1;
        const overStart = Math.max(start - overscan, 0);
        const overEnd = Math.min(end + overscan, maxIndex);

        anchorIndexRef.current = start;

        for (let index = overStart; index <= overEnd; index++) {
          const measure = measures[index];

          items.push({
            index,
            viewport,
            end: measure.end,
            size: measure.size,
            start: measure.start,
            scrolling: scrollingRef.current,
            visible: index >= start && index <= end,
            observe: element => {
              setStyles(element, [['margin', '0']]);

              return observe(element, entry => {
                const { current: measures } = measuresRef;

                if (index < measures.length) {
                  const { size } = measures[index];
                  const nextSize = getBoundingRect(entry)[sizeKey];

                  if (nextSize !== size) {
                    abortAnimationFrame(remeasureRafRef.current);

                    setMeasure(measures, index, nextSize);

                    const { current: remeasureIndex } = remeasureIndexRef;

                    if (remeasureIndex < 0) {
                      remeasureIndexRef.current = index;
                    } else {
                      remeasureIndexRef.current = Math.min(index, remeasureIndex);
                    }

                    remeasureRafRef.current = requestAnimationFrame(() => {
                      if (!scrollingRef.current) {
                        update(offsetRef.current);
                      }
                    });
                  }
                }
              });
            }
          });
        }

        const nextState: State = {
          items,
          visible: [start, end],
          frame: [measures[overStart].start, measures[maxIndex].end]
        };

        setState(prevState => {
          return isEqualState(nextState, prevState) ? prevState : nextState;
        });

        if (isFunction(onScroll)) {
          onScroll({
            offset: nextOffset,
            visible: [start, end],
            overscan: [overStart, overEnd],
            delta: nextOffset - offsetRef.current
          });
        }

        if (overEnd >= maxIndex && isFunction(onLoad)) {
          onLoad({
            offset: nextOffset,
            visible: [start, end],
            overscan: [overStart, overEnd]
          });
        }
      } else {
        setState({
          items,
          visible: [-1, -1],
          frame: [0, viewportSize]
        });

        if (length <= 0 && isFunction(onLoad)) {
          onLoad({
            visible: [-1, -1],
            overscan: [-1, -1],
            offset: nextOffset
          });
        }
      }
    }
  });

  const scrollTo = useStableCallback<ScrollTo>((value, callback) => {
    if (isMounted()) {
      const { offset, smooth } = getScrollToOptions(value);

      const onComplete = () => {
        if (isFunction(callback)) {
          requestAnimationFrame(() => {
            if (smooth) {
              callback();
            } else {
              requestAnimationFrame(() => {
                callback();
              });
            }
          });
        }
      };

      if (isNumber(offset) && offset >= 0) {
        const { current: prevOffset } = offsetRef;
        const nextOffset = getScrollOffset(offset, measuresRef.current);

        if (nextOffset !== prevOffset) {
          const scrollTo = (offset: number): void => {
            const { current: viewport } = viewportRef;

            if (viewport) {
              viewport.scrollTo({
                behavior: 'auto',
                [scrollToKey]: offset
              });
            }
          };

          if (smooth) {
            const start = now();
            const config = getScrolling(scrolling);
            const distance = nextOffset - prevOffset;
            const duration = getDuration(config.duration, Math.abs(distance));

            abortAnimationFrame(scrollToRafRef.current);

            const scroll = () => {
              if (isMounted()) {
                const time = Math.min((now() - start) / duration, 1);

                scrollTo(config.easing(time) * distance + prevOffset);

                if (time < 1) {
                  scrollToRafRef.current = requestAnimationFrame(scroll);
                } else {
                  onComplete();
                }
              }
            };

            scrollToRafRef.current = requestAnimationFrame(scroll);
          } else {
            scrollTo(nextOffset);

            onComplete();
          }
        } else {
          onComplete();
        }
      }
    }
  });

  const scrollToItem = useStableCallback<ScrollToItem>((value, callback) => {
    if (isMounted()) {
      const { index, smooth, align } = getScrollToItemOptions(value);

      if (isNumber(index) && index >= 0) {
        const { current: measures } = measuresRef;

        if (index < measures.length) {
          let { current: offset } = offsetRef;

          const { start, size, end } = measures[index];
          const viewport = viewportRectRef.current[sizeKey];

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

          scrollTo({ offset, smooth }, () => {
            const { current: measures } = measuresRef;

            if (index < measures.length) {
              const { visible } = state;
              const measure = measures[index];

              if (index < visible[0] || index > visible[1] || measure.start !== start || measure.end !== end) {
                scrollToItem({ index, smooth, align }, callback);
              } else if (isFunction(callback)) {
                callback();
              }
            }
          });
        }
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
    setStyles(frameRef.current, [[sizeKey, `${frameSize}px`]]);
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

          const offset = viewport[scrollOffsetKey];

          update(offset, onScrollRef.current);

          offsetRef.current = offset;

          scrollingRef.current = true;

          scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = requestAnimationFrame(() => {
              scrollingRef.current = false;

              update(offset);
            });
          });
        }
      };

      const unobserve = observe(viewport, entry => {
        const viewport = getBoundingRect(entry, true);

        if (viewport[sizeKey] !== viewportRectRef.current[sizeKey]) {
          viewportRectRef.current = viewport;

          update(offsetRef.current);

          const { current: onResize } = onResizeRef;

          if (isFunction(onResize)) {
            onResize(viewport);
          }
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

    update(offsetRef.current);
  }, [count, size]);

  return [state.items, viewportRef, frameRef, { scrollTo, scrollToItem }];
}
