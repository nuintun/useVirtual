/**
 * @module useIsoLayoutEffect
 */

import { useEffect, useLayoutEffect } from 'react';

// 是否为浏览器环境
const isBrowser = typeof window !== 'undefined' && window.document;

/**
 * @function useIsoLayoutEffect
 * @description [hook] 使用同构 useLayoutEffect，防止 SSR 模式报错
 */
export const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
