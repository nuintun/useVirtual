/**
 * @module now
 */

/**
 * @function now
 * @description 获取高精度当前时间
 */
export const now = window.performance ? () => window.performance.now() : () => Date.now();
