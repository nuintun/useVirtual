/**
 * @module utils
 */

import {
  Duration,
  Item,
  Measure,
  Rect,
  Scrolling,
  ScrollToItemOptions,
  ScrollToOptions,
  Size,
  State,
  VirtualRange
} from './types';

/**
 * @function easeInOutSine
 * @description easeInOutSine
 * @param time 当前动画时间，0-1 之间
 */
export function easeInOutSine(time: number): number {
  return (1 - Math.cos(Math.PI * time)) / 2;
}

/**
 * @function easingDuration
 * @description 缓动动画持续时间
 * @param distance 缓动动画移动总距离
 */
export function easingDuration(distance: number): number {
  return Math.min(Math.max(distance * 0.075, 100), 500);
}

/**
 * @function isFunction
 * @description 是否为函数
 * @param value 需要验证的值
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * @function isNumber
 * @description 是否为数字
 * @param value 需要验证的值
 */
export function isNumber(value: unknown): value is number {
  return Object.prototype.toString.call(value) === '[object Number]';
}

/**
 * @type {isBrowser}
 * @description 是否为浏览器环境
 */
export const isBrowser = typeof window !== 'undefined' && window.document;

/**
 * @function isEqual
 * @param next
 * @param prev
 * @param keys
 */
export function isEqual<T>(next: T, prev: T, keys: (keyof T)[]): boolean {
  for (const key of keys) {
    if (next[key] !== prev[key]) {
      return false;
    }
  }

  return true;
}

/**
 * @function isEqualItem
 * @param next
 * @param prev
 */
export function isEqualItem(next: Item, prev: Item): boolean {
  if (!isEqual(next, prev, ['index', 'start', 'size', 'end'])) {
    return false;
  }

  if (!isEqual(next.viewport, prev.viewport, ['width', 'height'])) {
    return false;
  }

  return true;
}

/**
 * @function isEqualState
 * @param next
 * @param prev
 */
export function isEqualState(next: State, prev: State): boolean {
  if (!isEqual(prev.frame, next.frame, [0, 1])) {
    return false;
  }

  const { items: nextItems } = next;
  const { items: prevItems } = prev;
  const { length } = nextItems;

  if (length !== prevItems.length) {
    return false;
  }

  for (let index = length - 1; index >= 0; index--) {
    if (!isEqualItem(nextItems[index], prevItems[index])) {
      return false;
    }
  }

  return true;
}

/**
 * @function setStyles
 * @param element
 * @param styles
 */
export function setStyles(
  element: HTMLElement | null,
  styles: [property: string, value: string | null, priority?: string][]
): void {
  if (element) {
    const { style } = element;

    for (const [property, value, priority] of styles) {
      style.setProperty(property, value, priority);
    }
  }
}

/**
 * @function removeStyles
 * @param element
 * @param styles
 */
export function removeStyles(element: HTMLElement | null, styles: string[]): void {
  if (element) {
    const { style } = element;

    for (const property of styles) {
      style.removeProperty(property);
    }
  }
}

/**
 * @function abortAnimationFrame
 * @param handle
 */
export function abortAnimationFrame(handle: number | null | undefined): void {
  if (handle != null) {
    cancelAnimationFrame(handle);
  }
}

/**
 * @function setMeasure
 * @param measures 已缓存测量数组
 * @param index 索引
 * @param size 列表项目尺寸
 */
export function setMeasure(measures: Measure[], index: number, size: number): void {
  const start = measures[index - 1]?.end || 0;

  measures[index] = { index, start, size, end: start + size };
}

/**
 * @function getInitialState
 * @description 获取初始化状态数据
 */
export function getInitialState(): State {
  return { items: [], frame: [0, 0] };
}

/**
 * @function getScrolling
 * @param scrolling
 */
export function getScrolling(scrolling?: Scrolling): Required<Scrolling> {
  const { easing, duration } = scrolling || {};

  return {
    easing: easing || easeInOutSine,
    duration: duration || easingDuration
  };
}

/**
 * @function getScrollOffset
 * @param viewport
 * @param offset
 * @param measures
 */
export function getScrollOffset(viewport: number, offset: number, measures: Measure[]): number {
  const scrollSize = measures[measures.length - 1]?.end;

  return Math.min(offset, scrollSize ? scrollSize - viewport : 0) | 0;
}

/**
 * @function getDuration
 * @param duration
 * @param distance
 */
export function getDuration(duration: Duration, distance: number): number {
  return isFunction(duration) ? duration(Math.abs(distance)) : duration;
}

/**
 * @function now
 * @description 获取高精度当前时间
 */
export const now = window.performance ? () => window.performance.now() : () => Date.now();

/**
 * @function getScrollToOptions
 * @param value
 */
export function getScrollToOptions(value: number | ScrollToOptions): ScrollToOptions {
  return isNumber(value) ? { offset: value } : value;
}

/**
 * @function getScrollToItemOptions
 * @param value
 */
export function getScrollToItemOptions(value: number | ScrollToItemOptions): ScrollToItemOptions {
  return isNumber(value) ? { index: value } : value;
}

/**
 * @function getSize
 * @param index 索引
 * @param size 列表项目尺寸
 * @param measures 已缓存测量数组
 * @param viewport 视窗尺寸
 */
export function getSize(index: number, size: Size, measures: Measure[], viewport: Rect): number {
  const isFunctionSize = isFunction(size);
  const measure: Measure | undefined = measures[index];
  const nextSize = measure?.size || (isFunctionSize ? size(index, viewport) : size);

  if (__DEV__) {
    if (nextSize === 0) {
      if (isFunctionSize) {
        throw new RangeError('options.size return value must be greater than 0');
      } else {
        throw new RangeError('options.size must be greater than 0');
      }
    }
  }

  return nextSize;
}

/**
 * @function binarySearch
 * @description 二分法查找第一个可见元素索引
 * @param measures 已缓存测量数组
 * @param offset 视窗滚动偏移
 * @param start 开始索引
 * @param end 结束索引
 */
export function binarySearch(measures: Measure[], offset: number, start: number, end: number): number {
  while (start < end) {
    const middle = ((start + end) / 2) | 0;
    const measure = measures[middle];

    if (measure.end <= offset) {
      start = middle + 1;
    } else if (measure.start > offset) {
      end = middle - 1;
    } else {
      return middle;
    }
  }

  return start;
}

/**
 * @function getVirtualRange
 * @param size 视窗尺寸
 * @param offset 视窗滚动偏移
 * @param measures 已缓存测量数组
 * @param anchor 锚点索引
 */
export function getVirtualRange(viewport: number, offset: number, measures: Measure[], anchor: number): void | VirtualRange {
  const { length } = measures;

  if (viewport > 0 && length > 0) {
    const maxIndex = length - 1;
    const offsetEnd = offset + viewport;
    const { start: anchorOffset } = measures[anchor];

    let start = anchor;

    if (anchorOffset > offset) {
      start = binarySearch(measures, offset, 0, anchor);
    } else if (anchorOffset < offset) {
      start = binarySearch(measures, offset, anchor, maxIndex);
    }

    let end = start;

    while (end < maxIndex) {
      const measure = measures[end];

      if (measure.start < offsetEnd && measure.end >= offsetEnd) {
        return [start, end];
      } else {
        end++;
      }
    }

    return [start, end];
  }
}

/**
 * @function getBoundingRect
 * @param entry
 * @param borderBox
 */
export function getBoundingRect(entry: ResizeObserverEntry, contentBox?: boolean): Rect {
  const mapping: Record<string, boolean> = {
    tb: true,
    'tb-rl': true,
    'vertical-rl': true,
    'vertical-lr': true
  };
  const { writingMode } = getComputedStyle(entry.target);
  const [{ blockSize, inlineSize }] = contentBox ? entry.contentBoxSize : entry.borderBoxSize;

  return mapping[writingMode] ? { width: blockSize, height: inlineSize } : { width: inlineSize, height: blockSize };
}
