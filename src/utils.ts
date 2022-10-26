/**
 * @module utils
 */

import { Duration, Measure, Rect, Scrolling, ScrollToItemOptions, ScrollToOptions, Size, VirtualRange } from './types';

/**
 * @function easingImpl
 * @description 缓动动画
 * @param time 当前动画时间，0-1 之间
 */
export function easingImpl(time: number): number {
  return 1 - Math.pow(1 - time, 4);
}

/**
 * @function durationImpl
 * @description 动画持续时间
 * @param distance 动画移动距离
 */
export function durationImpl(distance: number): number {
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
 * @function abortAnimationFrame
 * @param handle
 */
export function abortAnimationFrame(handle: number | null | undefined): void {
  if (handle != null) {
    cancelAnimationFrame(handle);
  }
}

/**
 * @function getScrollSize
 * @param measures
 */
export function getScrollSize(measures: Measure[]): number {
  return measures[measures.length - 1]?.end ?? 0;
}

/**
 * @function getScrolling
 * @param scrolling
 */
export function getScrolling(scrolling?: Scrolling): Required<Scrolling> {
  if (scrolling) {
    const { easing = easingImpl, duration = durationImpl } = scrolling;

    return { easing, duration };
  }

  return { easing: easingImpl, duration: durationImpl };
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
 * @function getMeasure
 * @param index 索引
 * @param size 列表项目尺寸
 * @param measures 已缓存测量数组
 */
export function getMeasure(index: number, size: number, measures: Measure[]): Measure {
  const start = measures[index - 1]?.end ?? 0;

  return { index, start, size, end: start + size };
}

/**
 * @function getSize
 * @param index 索引
 * @param size 列表项目尺寸
 * @param measures 已缓存测量数组
 * @param viewport 视窗尺寸
 */
export function getSize(index: number, size: Size, measures: Measure[], viewport: Rect): number {
  const measure = measures[index];

  return measure ? measure.size : isFunction(size) ? size(index, viewport) : size;
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
export function getVirtualRange(viewport: number, offset: number, measures: Measure[], anchor: number): VirtualRange {
  if (viewport > 0) {
    const offsetEnd = offset + viewport;
    const maxIndex = measures.length - 1;
    const { start: anchorOffset } = measures[anchor];

    let start: number = anchor;

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

  return [0, 0];
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
