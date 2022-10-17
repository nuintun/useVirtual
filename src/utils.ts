/**
 * @module utils
 */

import { Item, Measure, Options, Viewport } from './types';

/**
 * @function isFunction
 * @description 是否为函数
 * @param value 需要验证的值
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * @function getMeasure
 * @param index 索引
 * @param measures 已缓存测量数组
 * @param size 列表项目尺寸
 */
export function getMeasure(index: number, measures: Measure[], size: number): Measure {
  const start = measures[index - 1]?.end ?? 0;

  return { index, size, start, end: start + size };
}

/**
 * @function getItemSize
 * @param index 索引
 * @param size 列表项目尺寸
 * @param viewport 视窗尺寸
 */
export function getItemSize(index: number, size: Options['size'], viewport: Viewport): number {
  return isFunction(size) ? size(index, viewport) : size;
}

/**
 * @function getInitialItems
 * @param size 列表项目尺寸
 * @param initial 初始化加载列表项数目
 */
export function getInitialItems(size: Options['size'], initial: Options['initial'] = 0): Item[] {
  const items: Item[] = [];
  const measure = () => null;
  const viewport: Viewport = { width: 0, height: 0 };
  const [start, end] = Array.isArray(initial) ? initial : [0, initial - 1];

  for (let index = start; index <= end; index++)
    items.push({
      index,
      measure,
      start: 0,
      viewport,
      size: getItemSize(index, size, viewport)
    });

  return items;
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

  return start > 0 ? start - 1 : 0;
}

/**
 * @function getVisibleRange
 * @param size 视窗尺寸
 * @param offset 视窗滚动偏移
 * @param measures 缓存的尺寸数组
 */
export function getVisibleRange(size: number, offset: number, measures: Measure[]): [start: number, end: number] {
  const offsetEnd = offset + size;
  const lastIndex = measures.length - 1;
  const start = binarySearch(0, lastIndex, offset, index => measures[index].start);
  const end = binarySearch(start, lastIndex, offsetEnd, index => measures[index].end);

  return [start, end];
}
