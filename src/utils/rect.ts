/**
 * @module rect
 */

import { Rect } from './interface';

// 垂直模式映射表
const VERTICAL_MODE: Record<string, boolean> = {
  tb: true,
  'tb-rl': true,
  'vertical-rl': true,
  'vertical-lr': true
};

/**
 * @function getBoundingRect
 * @function 标准化元素尺寸
 * @param entry ResizeObserver 回调值
 * @param contentBox  是否使用 contentBox 模式
 */
export function getBoundingRect(entry: ResizeObserverEntry, contentBox?: boolean): Rect {
  const vertical = VERTICAL_MODE[getComputedStyle(entry.target).writingMode];
  const [{ blockSize, inlineSize }] = contentBox ? entry.contentBoxSize : entry.borderBoxSize;
  const viewport = vertical ? { width: blockSize, height: inlineSize } : { width: inlineSize, height: blockSize };

  return __DEV__ ? Object.freeze(viewport) : viewport;
}
