/**
 * @module rect
 */

import { Rect } from './interface';

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
