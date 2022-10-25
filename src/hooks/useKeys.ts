/**
 * @module useKeys
 */

import { useMemo } from 'react';

export type Keys = [
  sizeKey: SizeKey,
  offsetKey: OffsetKey,
  boxSizeKey: BoxSizeKey,
  scrollToKey: ScrollToKey,
  scrollOffsetKey: ScrollOffsetKey
];

export type SizeKey = 'width' | 'height';

export type ScrollToKey = 'left' | 'top';

export type BoxSizeKey = 'inlineSize' | 'blockSize';

export type OffsetKey = 'paddingLeft' | 'paddingTop';

export type ScrollOffsetKey = 'scrollLeft' | 'scrollTop';

/**
 * @function useKeys
 * @description [hook] 获取属性名称
 * @param horizontal 是否为水平模式
 */
export function useKeys(horizontal?: boolean): Keys {
  return useMemo<Keys>(() => {
    if (horizontal) {
      return ['width', 'paddingLeft', 'inlineSize', 'left', 'scrollLeft'];
    }

    return ['height', 'paddingTop', 'blockSize', 'top', 'scrollTop'];
  }, [horizontal]);
}
