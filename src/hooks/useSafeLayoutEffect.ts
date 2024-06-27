/**
 * @module useSafeLayoutEffect
 */

import { useEffect, useLayoutEffect } from 'react';

// 是否支持 DOM 操作
const canUseDOM =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

/**
 * @function useSafeLayoutEffect
 * @description [hook] 安全的 useLayoutEffect，防止 SSR 模式报错
 */
export const useSafeLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;
