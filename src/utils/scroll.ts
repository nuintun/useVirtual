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
  return Math.min(Math.max(distance * 0.075, 100), 500);
}

/**
 * @function getScrolling
 * @param scrolling
 */
export function getScrolling(scrolling?: Scrolling): Required<Scrolling> {
  const { easing, duration } = scrolling || {};

  return {
    easing: easing || easeInOutSine,
    duration: duration || easingDuration
  };
}

/**
 * @function getDuration
 * @param duration
 * @param distance
 */
export function getDuration(duration: Duration, distance: number): number {
  return isFunction(duration) ? duration(Math.abs(distance)) : duration;
}

/**
 * @function getScrollToOptions
 * @param value
 */
export function getScrollToOptions(value: number | ScrollToOptions): ScrollToOptions {
  return isNumber(value) ? { offset: value } : value;
}

/**
 * @function getScrollToItemOptions
 * @param value
 */
export function getScrollToItemOptions(value: number | ScrollToItemOptions): ScrollToItemOptions {
  return isNumber(value) ? { index: value } : value;
}
