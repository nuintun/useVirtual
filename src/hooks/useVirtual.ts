/**
 * @module useVirtual
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import useIsMounted from './useIsMounted';
import useStableCallback from './useStableCallback';
import { getInitialItems, getItemSize, getMeasure, getVisibleRange } from '../utils';
import { Item, KeysMap, Measure, Methods, Options, State, Viewport } from '../types';

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
  const isMounted = useIsMounted();
  const scrollOffsetRef = useRef(0);
  const prevEndIndexRef = useRef(-1);
  const userScrollRef = useRef(true);
  const prevItemIndexRef = useRef(-1);
  const isScrollingRef = useRef(true);
  const remeasureIndexRef = useRef(-1);
  const isScrollToItemRef = useRef(false);
  const scrollToRafRef = useRef<number>();
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

  const refreshMeasures = useStableCallback((start: number = 0) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    measuresRef.current = [];

    for (let index = start; index < length; index++) {
      const itemSize = measures[index]?.size ?? getItemSize(index, size, viewport);

      measuresRef.current.push(getMeasure(index, measures, itemSize));
    }
  });

  const calcVisibility = useStableCallback((offset: number) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;
    const { current: remeasureIndex } = remeasureIndexRef;

    if (remeasureIndex >= 0) {
      refreshMeasures(remeasureIndex);

      remeasureIndexRef.current = -1;
    }

    const [vStart, vEnd] = getVisibleRange(viewport[sizeKey], offset, measures);

    const lastIndex = measures.length - 1;
    const oStart = Math.max(vStart - overscan, 0);
    const oEnd = Math.min(vEnd + overscan, lastIndex);

    const measure = measures[oEnd];
    const innerOffset = measures[oStart].start;
    const innerSize = measure.end - innerOffset;

    return { vStart, vEnd, oStart, oEnd, innerSize, innerOffset };
  });

  useEffect(() => {
    refreshMeasures();
  }, []);

  return [
    state.items,
    {
      scrollTo() {},
      scrollToItem() {}
    }
  ];
}
