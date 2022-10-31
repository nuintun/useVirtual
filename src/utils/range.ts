/**
 * @module search
 */

import { Measure, VirtualRange } from './interface';

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
