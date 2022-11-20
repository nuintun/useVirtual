/**
 * @module measure
 */

import { Measure } from './interface';

/**
 * @function setMeasure
 * @param measures 已缓存测量数组
 * @param index 索引
 * @param size 列表项目尺寸
 */
export function setMeasure(measures: Measure[], index: number, size: number): void {
  const start = measures[index - 1]?.end || 0;

  measures[index] = { start, size, end: start + size };
}
