/**
 * @module useVirtual
 */

import {
  abortAnimationFrame,
  getBoundingRect,
  getDuration,
  getScrolling,
  getScrollSize,
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
import { useMeasureItem } from './useMeasureItem';
import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from './useResizeObserver';
import { useStableCallback } from './useStableCallback';
import { Item, Measure, Methods, OnScroll, Options, Rect, ScrollTo, ScrollToItem, State } from '../types';

const enum Align {
  end = 'end',
  auto = 'auto',
  start = 'start',
  center = 'center'
}

export function useVirtual(
  length: number,
  { size, frame, onLoad, onResize, onScroll, viewport, scrolling, horizontal, overscan = 10 }: Options
): [items: Item[], methods: Methods] {
  const offsetRef = useRef(0);
  const isMounted = useIsMounted();
  const measureItem = useMeasureItem();
  const scrollRafRef = useRef<number>();
  const anchorIndexRef = useRef<number>(0);
  const measuresRef = useRef<Measure[]>([]);
  const onResizeRef = useLatestRef(onResize);
  const onScrollRef = useLatestRef(onScroll);
  const [observe, unobserve] = useResizeObserver();
  const viewportRectRef = useRef<Rect>({ width: 0, height: 0 });
  const [sizeKey, offsetKey, scrollToKey, scrollOffsetKey] = useKeys(horizontal);
  const [state, setState] = useState<State>(() => ({ items: [], frame: [0, 0], visible: [-1, -1] }));

  const remeasure = useStableCallback((start: number): void => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    for (let index = start; index < length; index++) {
      setMeasure(measures, index, getSize(index, size, measures, viewport));
    }
  });

  const getScrollOffset = useStableCallback((offset: number) => {
    if (viewport) {
      return Math.min(offset, getScrollSize(measuresRef.current));
    }

    return offsetRef.current;
  });

  const scrollTo = useStableCallback<ScrollTo>((value, callback) => {
    if (isMounted()) {
      const onComplete = () => {
        if (isFunction(callback)) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              callback();
            });
          });
        }
      };

      const { offset, smooth } = getScrollToOptions(value);

      if (isNumber(offset) && offset >= 0) {
        const { current: prevOffset } = offsetRef;
        const nextOffset = getScrollOffset(offset);

        if (nextOffset !== prevOffset) {
          const scrollTo = (offset: number): void => {
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

            abortAnimationFrame(scrollRafRef.current);

            const scroll = () => {
              if (viewport && isMounted()) {
                const time = Math.min((now() - start) / duration, 1);

                scrollTo(config.easing(time) * distance + prevOffset);

                if (time < 1) {
                  scrollRafRef.current = requestAnimationFrame(scroll);
                } else {
                  onComplete();
                }
              }
            };

            scrollRafRef.current = requestAnimationFrame(scroll);
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

  const update = useStableCallback((offset: number, onScroll?: OnScroll) => {
    if (length > 0 && isMounted()) {
      const items: Item[] = [];
      const { current: measures } = measuresRef;
      const nextOffset = getScrollOffset(offset);
      const { current: viewport } = viewportRectRef;
      const [start, end] = getVirtualRange(viewport[sizeKey], nextOffset, measures, anchorIndexRef.current);

      anchorIndexRef.current = start;

      const maxIndex = measures.length - 1;
      const overStart = Math.max(start - overscan, 0);
      const overEnd = Math.min(end + overscan, maxIndex);

      for (let index = overStart; index <= overEnd; index++) {
        const measure = measures[index];

        items.push({
          index,
          viewport,
          end: measure.end,
          size: measure.size,
          start: measure.start,
          visible: index >= start && index <= end,
          measure: measureItem(index, entry => {
            const { current: measures } = measuresRef;

            if (index < measures.length) {
              const { size } = measures[index];
              const nextSize = getBoundingRect(entry)[sizeKey];

              if (nextSize !== size) {
                setMeasure(measures, index, nextSize);

                remeasure(index);

                update(offsetRef.current);
              }
            }
          })
        });
      }

      setState(prevState => {
        const nextState: State = {
          items,
          visible: [start, end],
          frame: [measures[overStart].start, measures[maxIndex].end]
        };

        return isEqualState(nextState, prevState) ? prevState : nextState;
      });

      if (isFunction(onScroll)) {
        onScroll({
          offset: nextOffset,
          visible: [start, end],
          overscan: [overStart, overEnd],
          forward: nextOffset > offsetRef.current
        });
      }

      if (overEnd >= maxIndex && isFunction(onLoad)) {
        onLoad({
          offset: nextOffset,
          visible: [start, end],
          overscan: [overStart, overEnd]
        });
      }
    }
  });

  const [frameOffset, frameSize] = state.frame;

  useEffect(() => {
    setStyles(frame, [
      ['margin', '0', 'important'],
      ['box-sizing', 'border-box', 'important']
    ]);
  }, [frame]);

  useEffect(() => {
    if (horizontal) {
      removeStyles(frame, ['height', 'padding-top']);
    } else {
      removeStyles(frame, ['width', 'padding-left']);
    }
  }, [frame, horizontal]);

  useEffect(() => {
    setStyles(frame, [[sizeKey, `${frameSize}px`, 'important']]);
  }, [frame, sizeKey, frameSize]);

  useEffect(() => {
    setStyles(frame, [[offsetKey, `${frameOffset}px`, 'important']]);
  }, [frame, offsetKey, frameOffset]);

  useEffect(() => {
    if (viewport) {
      const onScrollChange = () => {
        if (viewport && isMounted()) {
          const offset = viewport[scrollOffsetKey];

          offsetRef.current = offset;

          update(offset, onScrollRef.current);
        }
      };

      observe(viewport, entry => {
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

      setStyles(viewport, [['padding', '0', 'important']]);

      viewport.addEventListener('scroll', onScrollChange, { passive: true });

      return () => {
        unobserve(viewport);

        viewport.removeEventListener('scroll', onScrollChange);
      };
    }
  }, [viewport, sizeKey, scrollOffsetKey]);

  const isSizeChanged = size.toString() !== usePrevious(size)?.toString();

  useEffect(() => {
    if (isSizeChanged) {
      remeasure(0);
    } else {
      const { current: measures } = measuresRef;
      const { length: prevLength } = measures;

      if (prevLength > length) {
        measures.length = length;
      } else if (prevLength < length) {
        remeasure(prevLength);
      }
    }

    const maxIndex = Math.max(0, length - 1);
    const { current: anchor } = anchorIndexRef;

    anchorIndexRef.current = Math.min(maxIndex, anchor);

    update(offsetRef.current);
  }, [length, isSizeChanged]);

  return [state.items, { scrollTo, scrollToItem }];
}
