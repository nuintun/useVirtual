/**
 * @module scroll
 */

import { isFunction, isNumber } from './typeof';
import { Duration, Scrolling, ScrollToItemOptions, ScrollToOptions } from './interface';

/**
 * @function easeInOutSine
 * @description easeInOutSine
 * @param time 当前动画时间，0-1 之间
 */
export function easeInOutSine(time: number): number {
  return (1 - Math.cos(Math.PI * time)) / 2;
}

/**
 * @function easingDuration
 * @description 缓动动画持续时间
 * @param distance 缓动动画移动总距离
 */
export function easingDuration(distance: number): number {
  return Math.min(500, Math.max(100, distance * 0.075));
}

/**
 * @function getScrollingOptions
 * @description 获取滚动参数配置
 * @param scrolling 原始滚动配置
 */
export function getScrollingOptions(scrolling?: Scrolling): Required<Scrolling> {
  const { easing, duration } = scrolling || {};

  return {
    easing: easing || easeInOutSine,
    duration: duration || easingDuration
  };
}

/**
 * @function getDuration
 * @function 获取滚动时长
 * @param duration 原始滚动时长参数
 * @param distance 滚动距离
 */
export function getDuration(duration: Duration, distance: number): number {
  return isFunction(duration) ? duration(Math.abs(distance)) : duration;
}

/**
 * @function getScrollToOptions
 * @description 获取 scrollTo 方法参数
 * @param value 原始参数
 */
export function getScrollToOptions(value: number | ScrollToOptions): ScrollToOptions {
  return isNumber(value) ? { offset: value } : value;
}

/**
 * @function getScrollToItemOptions
 * @description 获取 scrollToItem 方法参数
 * @param value 原始参数
 */
export function getScrollToItemOptions(value: number | ScrollToItemOptions): ScrollToItemOptions {
  return isNumber(value) ? { index: value } : value;
}
