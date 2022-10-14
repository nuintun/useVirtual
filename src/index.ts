import { useMemo, useRef, useState } from 'react';

import useIsMounted from '../useIsMounted';
import useStableCallback from '../useStableCallback';
import { getInitialItems, getItemSize, getMeasure, getVisibleRange } from './utils';
import { Item, KeysMap, Measure, Methods, Options, State, Viewport } from './types';

export default function useVirtual(
  length: number,
  {
    size,
    frame,
    onLoad,
    initial,
    viewport,
    infinite,
    stickies,
    onResize,
    onScroll,
    scrolling,
    scrollspy,
    horizontal,
    isItemLoaded,
    overscan = 10
  }: Options
): [items: Item[], methods: Methods] {
  const prevVStopRef = useRef(-1);
  const isMounted = useIsMounted();
  const prevItemIdxRef = useRef(-1);
  const scrollOffsetRef = useRef(0);
  const userScrollRef = useRef(true);
  const hasDynamicRef = useRef(false);
  const isScrollingRef = useRef(true);
  const scrollToRafRef = useRef<number>();
  const isScrollToItemRef = useRef(false);
  const measuresRef = useRef<Measure[]>([]);
  const viewportRectRef = useRef<Viewport>({ width: 0, height: 0 });

  const [state, setState] = useState<State>(() => {
    return {
      innerSize: 0,
      innerOffset: 0,
      items: getInitialItems(size, initial)
    };
  });

  const [sizeKey, offsetKey, scrollKey] = useMemo<KeysMap>(() => {
    if (horizontal) {
      return ['width', 'marginLeft', 'scrollLeft'];
    }

    return ['height', 'marginTop', 'scrollTop'];
  }, [horizontal]);

  const calcMeasures = useStableCallback((start: number = 0, skipCache = false) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    measuresRef.current = [];

    for (let index = start; index < length; index++) {
      let itemSize: number;

      if (skipCache) {
        itemSize = getItemSize(index, size, viewport);
      } else {
        itemSize = measures[index]?.size ?? getItemSize(index, size, viewport);
      }

      measuresRef.current.push(getMeasure(index, measures, itemSize));
    }
  });

  const calcVisibility = useStableCallback((offset: number) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;
    const { current: hasDynamic } = hasDynamicRef;
    const [vStart, vEnd] = getVisibleRange(viewport[sizeKey], offset, measures, hasDynamic);

    const lastIndex = measures.length - 1;
    const oStart = Math.max(vStart - overscan, 0);
    const oEnd = Math.min(vEnd + overscan, lastIndex);

    const measure = measures[oEnd];
    const innerOffset = measures[oStart].start;
    const innerSize = measure.end - innerOffset;

    return { vStart, vEnd, oStart, oEnd, innerSize, innerOffset };
  });

  return [
    state.items,
    {
      scrollTo() {},
      scrollToItem() {}
    }
  ];
}
