/**
 * @module useVirtual
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import { usePrevious } from './usePrevious';
import { useIsMounted } from './useIsMounted';
import { useStableCallback } from './useStableCallback';
import { getInitialItems, getMeasure, getVisibleRange } from '../utils';
import { Item, KeysMap, Measure, Methods, Options, State, Viewport } from '../types';

export function useVirtual(
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
  const prevSize = usePrevious(size);
  const prevItemIndexRef = useRef(-1);
  const isScrollingRef = useRef(true);
  const remeasureIndexRef = useRef(-1);
  const isScrollToItemRef = useRef(false);
  const scrollToRafRef = useRef<number>();
  const measuresRef = useRef<Measure[]>([]);
  const isSizeChanged = size.toString() !== prevSize?.toString();
  const viewportRectRef = useRef<Viewport>({ width: 0, height: 0 });

  const [state, setState] = useState<State>(() => {
    return {
      frame: { size: 0, offset: 0 },
      items: getInitialItems(size, initial)
    };
  });

  const [sizeKey, offsetKey, scrollKey] = useMemo<KeysMap>(() => {
    if (horizontal) {
      return ['width', 'marginLeft', 'scrollLeft'];
    }

    return ['height', 'marginTop', 'scrollTop'];
  }, [horizontal]);

  const refreshMeasures = useStableCallback((start: number) => {
    const { current: measures } = measuresRef;
    const { current: viewport } = viewportRectRef;

    let index = Math.min(start, measures.length);

    const nextMeasures = measures.slice(0, index);

    for (; index < length; index++) {
      nextMeasures.push(getMeasure(index, measures, size, viewport));
    }

    measuresRef.current = nextMeasures;
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

    const oStart = Math.max(vStart - overscan, 0);
    const oEnd = Math.min(vEnd + overscan, measures.length - 1);

    const measure = measures[oEnd];
    const frameOffset = measures[oStart].start;
    const frameSize = measure.end - frameOffset;

    return { vStart, vEnd, oStart, oEnd, frameSize, frameOffset };
  });

  useEffect(() => {
    const { current: measures } = measuresRef;
    const { length: measuresLength } = measures;

    if (isSizeChanged) {
      refreshMeasures(0);
    } else if (measuresLength !== length) {
      refreshMeasures(Math.min(length, measuresLength));
    }
  }, [length, isSizeChanged]);

  return [
    state.items,
    {
      scrollTo() {},
      scrollToItem() {}
    }
  ];
}
