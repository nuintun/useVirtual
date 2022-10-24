/**
 * @module useMappingKeys
 */

import { useMemo } from 'react';

export type MappingKeys = [
  sizeKey: SizeKey,
  offsetKey: OffsetKey,
  scrollKey: ScrollKey,
  boxSizeKey: BoxSizeKey,
  scrollToKey: ScrollToKey
];

export type SizeKey = 'width' | 'height';

export type ScrollToKey = 'left' | 'top';

export type ScrollKey = 'scrollLeft' | 'scrollTop';

export type BoxSizeKey = 'inlineSize' | 'blockSize';

export type OffsetKey = 'paddingLeft' | 'paddingTop';

/**
 * @function useStableCallback
 * @description [hook] 获取属性名称
 * @param horizontal 是否为水平模式
 */
export function useMappingKeys(horizontal?: boolean): MappingKeys {
  return useMemo<MappingKeys>(() => {
    if (horizontal) {
      return ['width', 'paddingLeft', 'scrollLeft', 'inlineSize', 'left'];
    }

    return ['height', 'paddingTop', 'scrollTop', 'blockSize', 'top'];
  }, [horizontal]);
}
