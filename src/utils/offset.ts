/**
 * @module offset
 */

import { Measure } from './interface';

/**
 * @function getScrollOffset
 * @param viewport
 * @param offset
 * @param measures
 */
export function getScrollOffset(viewport: number, offset: number, measures: Measure[]): number {
  const scrollSize = measures[measures.length - 1]?.end;

  return Math.min(offset, scrollSize ? scrollSize - viewport : 0);
}
