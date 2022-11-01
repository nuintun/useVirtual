/**
 * @module offset
 */

import { Measure } from './interface';

/**
 * @function getScrollOffset
 * @description 标准化滚动偏移
 * @param viewport 视窗大小
 * @param offset 视窗滚动偏移
 * @param measures 已缓存测量数组
 */
export function getScrollOffset(viewport: number, offset: number, measures: Measure[]): number {
  const scrollSize = measures[measures.length - 1]?.end;

  return Math.min(offset, scrollSize ? scrollSize - viewport : 0);
}
