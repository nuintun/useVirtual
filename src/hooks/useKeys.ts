/**
 * @module useKeys
 */

import { useMemo } from 'react';

export type SizeKey = 'width' | 'height';

export type ScrollToKey = 'left' | 'top';

export type OffsetKey = 'padding-left' | 'padding-top';

export type ScrollOffsetKey = 'scrollLeft' | 'scrollTop';

export type Keys = [sizeKey: SizeKey, offsetKey: OffsetKey, scrollToKey: ScrollToKey, scrollOffsetKey: ScrollOffsetKey];

/**
 * @function useKeys
 * @description [hook] 获取属性名称
 * @param horizontal 是否为水平模式
 */
export function useKeys(horizontal?: boolean): Keys {
  return useMemo<Keys>(() => {
    if (horizontal) {
      return ['width', 'padding-left', 'left', 'scrollLeft'];
    }

    return ['height', 'padding-top', 'top', 'scrollTop'];
  }, [horizontal]);
}
