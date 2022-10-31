/**
 * @module equal
 */

import { Item, State } from './interface';

/**
 * @function isEqual
 * @param next
 * @param prev
 * @param keys
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
 * @param next
 * @param prev
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
 * @param next
 * @param prev
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
