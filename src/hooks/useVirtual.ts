/**
 * @module useVirtual
 */

import {
  abortAnimationFrame,
  getDuration,
  getMeasure,
  getScrolling,
  getScrollSize,
  getScrollToItemOptions,
  getScrollToOptions,
  getSize,
  getVirtualRange,
  isFunction,
  isNumber,
  now
} from '../utils';
import { usePrevious } from './usePrevious';
import { useIsMounted } from './useIsMounted';
import { useLatestRef } from './useLatestRef';
import { useMeasureItem } from './useMeasureItem';
import { useMappingKeys } from './useMappingKeys';
import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from './useResizeObserver';
import { useStableCallback } from './useStableCallback';
import { Item, Measure, Methods, OnScroll, Options, ScrollTo, ScrollToItem, State, Viewport } from '../types';

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
  const remeasureIndexRef = useRef(-1);
  const scrollRafRef = useRef<number>();
  const refreshRafRef = useRef<number>();
  const anchorIndexRef = useRef<number>(-1);
  const measuresRef = useRef<Measure[]>([]);
  const onResizeRef = useLatestRef(onResize);
  const onScrollRef = useLatestRef(onScroll);
  const [observe, unobserve] = useResizeObserver();
  const viewportRectRef = useRef<Viewport>({ width: 0, height: 0 });
  const [state, setState] = useState<State>({ items: [], frame: [0, 0] });
  const [sizeKey, offsetKey, scrollKey, boxSizeKey, scrollToKey] = useMappingKeys(horizontal);

  const measure = useStableCallback((start: number) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    let index = Math.min(start, measures.length);

    const nextMeasures = measures.slice(0, index);

    for (; index < length; index++) {
      nextMeasures.push(getMeasure(index, getSize(index, size, measures, viewport), nextMeasures));
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
    if (viewport) {
      return Math.min(offset, getScrollSize(measuresRef.current));
    }

    return offsetRef.current;
  });

  const scrollTo = useStableCallback<ScrollTo>((value, callback) => {
    if (isMounted()) {
      const onComplete = () => {
        if (isFunction(callback)) {
          callback();
        }
      };

      const { offset, smooth } = getScrollToOptions(value);

      if (isNumber(offset) && offset >= 0) {
        const nextOffset = getOffset(offset);
        const { current: prevOffset } = offsetRef;

        if (nextOffset !== prevOffset) {
          remeasure();

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
            abortAnimationFrame(refreshRafRef.current);

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
          remeasure();

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
            remeasure();

            const { current: measures } = measuresRef;

            if (index < measures.length) {
              const measure = measures[index];

              if (measure.start !== start || measure.end !== end) {
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
    if (isMounted()) {
      remeasure();

      const items: Item[] = [];
      const nextOffset = getOffset(offset);
      const { current: measures } = measuresRef;
      const { current: viewport } = viewportRectRef;
      const [start, end] = getVirtualRange(viewport[sizeKey], nextOffset, measures, anchorIndexRef.current);

      anchorIndexRef.current = start;

      const maxIndex = measures.length - 1;
      const overStart = Math.max(start - overscan, 0);
      const overEnd = Math.min(end + overscan, maxIndex);

      for (let index = overStart; index <= overEnd; index++) {
        const { start, size, end } = measures[index];

        items.push({
          end,
          size,
          index,
          start,
          viewport,
          measure: measureItem(index, ({ borderBoxSize: [borderBoxSize] }) => {
            const { current: measures } = measuresRef;

            if (index < measures.length) {
              const { size } = measures[index];
              const nextSize = borderBoxSize[boxSizeKey];

              if (nextSize !== size) {
                abortAnimationFrame(refreshRafRef.current);

                const { current: remeasureIndex } = remeasureIndexRef;

                measures[index] = getMeasure(index, nextSize, measures);

                if (remeasureIndex < 0) {
                  remeasureIndexRef.current = index;
                } else {
                  remeasureIndexRef.current = Math.min(index, remeasureIndex);
                }

                refreshRafRef.current = requestAnimationFrame(() => {
                  update(offsetRef.current);
                });
              }
            }
          })
        });
      }

      setState({ items, frame: [measures[overStart].start, measures[maxIndex].end] });

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
    if (frame) {
      const { style } = frame;

      style.boxSizing = 'border-box';
    }
  }, [frame]);

  useEffect(() => {
    if (frame) {
      const { style } = frame;

      style[sizeKey] = `${frameSize}px`;
    }
  }, [frame, sizeKey, frameSize]);

  useEffect(() => {
    if (frame) {
      const { style } = frame;

      style[offsetKey] = `${frameOffset}px`;
    }
  }, [frame, offsetKey, frameOffset]);

  useEffect(() => {
    if (viewport) {
      const onScrollChange = () => {
        if (viewport && isMounted()) {
          const offset = viewport[scrollKey];

          abortAnimationFrame(refreshRafRef.current);

          update(offset, onScrollRef.current);

          offsetRef.current = offset;
        }
      };

      observe(viewport, ({ borderBoxSize: [borderBoxSize] }) => {
        const viewport: Viewport = {
          width: borderBoxSize.inlineSize,
          height: borderBoxSize.blockSize
        };
        const { current: prevViewport } = viewportRectRef;

        if (viewport[sizeKey] !== prevViewport[sizeKey]) {
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
        unobserve(viewport);

        viewport.removeEventListener('scroll', onScrollChange);
      };
    }
  }, [viewport, sizeKey, scrollKey]);

  const isSizeChanged = size.toString() !== usePrevious(size)?.toString();

  useEffect(() => {
    const { current: measures } = measuresRef;
    const { length: measuresLength } = measures;

    if (isSizeChanged) {
      measure(0);
      update(offsetRef.current);
    } else if (measuresLength !== length) {
      measure(Math.min(length, measuresLength));
      update(offsetRef.current);
    }
  }, [length, isSizeChanged]);

  return [state.items, { scrollTo, scrollToItem }];
}
