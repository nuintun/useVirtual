/**
 * @module utils
 */

import { IndexRange, ItemSize, Measure, Viewport } from './types';

export function easing(time: number): number {
  return 1 - Math.pow(1 - time, 4);
}

export function duration(distance: number): number {
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
 * @function getItemSize
 * @param index 索引
 * @param size 列表项目尺寸
 * @param viewport 视窗尺寸
 */
export function getItemSize(index: number, size: ItemSize, viewport: Viewport): number {
  return isFunction(size) ? size(index, viewport) : size;
}

/**
 * @function getMeasure
 * @param index 索引
 * @param measures 已缓存测量数组
 * @param size 列表项目尺寸
 * @param viewport 视窗尺寸
 */
export function getMeasure(index: number, measures: Measure[], size: ItemSize, viewport: Viewport): Measure {
  const start = measures[index - 1]?.end ?? 0;
  const itemSize = measures[index]?.size ?? getItemSize(index, size, viewport);

  return { index, start, size: itemSize, end: start + itemSize };
}

/**
 * @function binarySearch
 * @description 二分法查找算法
 * @param start 开始索引
 * @param end 结束索引
 * @param target 检测目标
 * @param getTarget 根据索引获取对比目标
 */
export function binarySearch(start: number, end: number, target: number, getTarget: (index: number) => number): number {
  while (start <= end) {
    const middle = ((start + end) / 2) | 0;
    const compareTarget = getTarget(middle);

    if (target < compareTarget) {
      end = middle - 1;
    } else if (target > compareTarget) {
      start = middle + 1;
    } else {
      return middle;
    }
  }

  return Math.max(0, start - 1);
}

/**
 * @function getVisibleRange
 * @param size 视窗尺寸
 * @param offset 视窗滚动偏移
 * @param measures 缓存的尺寸数组
 * @param anchor 锚点尺寸数据
 */
export function getVisibleRange(size: number, offset: number, measures: Measure[], anchor?: Measure): IndexRange {
  let start: number;

  const maxIndex = measures.length - 1;

  if (anchor) {
    const { index: anchorIndex, start: anchorStart } = anchor;

    if (anchorStart > offset) {
      start = binarySearch(0, anchorIndex, offset, index => measures[index].start);
    } else if (anchorStart < offset) {
      start = binarySearch(anchorIndex, maxIndex, offset, index => measures[index].start);
    } else {
      start = anchorIndex;
    }
  } else {
    start = binarySearch(0, maxIndex, offset, index => measures[index].start);
  }

  const end = binarySearch(start, maxIndex, offset + size, index => measures[index].end);

  return [start, end];
}
