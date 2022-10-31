/**
 * @module size
 */

import { isFunction } from './typeof';
import { Size, Measure, Rect } from './interface';

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
