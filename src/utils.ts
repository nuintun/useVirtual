import { NodesRef } from '@tarojs/taro';
import { Item, Measure, Options, Viewport } from './types';
import { queryNodeRef } from '/utils/dom';
import { isFunction } from '/utils/utils';
import { TaroElement } from '@tarojs/runtime';

/**
 * @function getBoundingClientRect
 * @param element
 * @param callback
 */
export function getBoundingClientRect(element: TaroElement, callback: NodesRef.BoundingClientRectCallback): void {
  const nodeRef = queryNodeRef(element);

  nodeRef.boundingClientRect(callback).exec();
}

/**
 * @function binarySearch
 * @description 二分法查找算法
 * @param low 低位索引
 * @param high 高位索引
 * @param input 检测值
 * @param getValue 根据索引获取值的方法
 */
function binarySearch(low: number, high: number, input: number, getValue: (index: number) => number): number {
  while (low <= high) {
    const middle = ((low + high) / 2) | 0;

    const value = getValue(middle);

    if (input < value) {
      high = middle - 1;
    } else if (input > value) {
      low = middle + 1;
    } else {
      return middle;
    }
  }

  return low > 0 ? low - 1 : 0;
}

/**
 * @function getVisibleRange
 * @param szie 视窗尺寸
 * @param offset 视窗滚动偏移
 * @param measures 缓存的尺寸数组
 * @param hasDynamic 是否有动态尺寸的列表项
 */
export function getVisibleRange(
  szie: number,
  offset: number,
  measures: Measure[],
  hasDynamic: boolean
): [start: number, end: number] {
  const bottom = offset + szie;
  const lastIndex = measures.length - 1;

  let start = 0;

  if (hasDynamic) {
    while (start < lastIndex) {
      const measure = measures[start];

      if (measure.start + measure.size < offset) {
        start++;
      }
    }
  } else {
    start = binarySearch(0, lastIndex, offset, index => measures[index].start);
  }

  let end = start;

  while (end < lastIndex) {
    const measure = measures[end];

    if (measure.start + measure.size < bottom) {
      end++;
    }
  }

  end = end === lastIndex ? end : end - 1;

  return [start, end];
}

/**
 * @function getMeasure
 * @param index 索引
 * @param measures 已缓存测量数组
 * @param size 列表项目尺寸
 */
export function getMeasure(index: number, measures: Measure[], size: number): Measure {
  const start = measures[index - 1]?.end ?? 0;

  return { index, start, end: start + size, size };
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
