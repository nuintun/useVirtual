/**
 * @module useLayoutEffect
 */

import { isBrowser } from '../utils';
import { useEffect, useLayoutEffect as useLayoutEffectImpl } from 'react';

/**
 * @function useLayoutEffect
 * @description [hook] 使用同构 useLayoutEffect，防止 SSR 模式报错
 */
export const useLayoutEffect = isBrowser ? useLayoutEffectImpl : useEffect;
