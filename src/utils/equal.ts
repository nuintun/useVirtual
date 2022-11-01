/**
 * @module equal
 */

import { Item, State } from './interface';

/**
 * @function isEqual
 * @description 对比两个对象中指定属性
 * @param next 新对象
 * @param prev 旧对象
 * @param keys 属性数组
 */
export function isEqual<T>(next: T, prev: T, keys: (keyof T)[]): boolean {
  for (const key of keys) {
    if (next[key] !== prev[key]) {
      return false;
    }
  }

  return true;
}

/**
 * @function isEqualItem
 * @function 对比两个虚列表项是否相等
 * @param next 新列表项
 * @param prev 旧列表项
 */
export function isEqualItem(next: Item, prev: Item): boolean {
  if (!isEqual(next, prev, ['index', 'start', 'size', 'end'])) {
    return false;
  }

  if (!isEqual(next.viewport, prev.viewport, ['width', 'height'])) {
    return false;
  }

  return true;
}

/**
 * @function isEqualState
 * @description 对比两个状态是否相等
 * @param next 新状态
 * @param prev 旧状态
 */
export function isEqualState(next: State, prev: State): boolean {
  if (!isEqual(prev.frame, next.frame, [0, 1])) {
    return false;
  }

  const { items: nextItems } = next;
  const { items: prevItems } = prev;
  const { length } = nextItems;

  if (length !== prevItems.length) {
    return false;
  }

  for (let index = length - 1; index >= 0; index--) {
    if (!isEqualItem(nextItems[index], prevItems[index])) {
      return false;
    }
  }

  return true;
}
