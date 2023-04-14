/**
 * @module state
 */

import { Item, State } from './interface';

/**
 * @function getInitialState
 * @description 获取初始化状态数据
 */
export function getInitialState(): State {
  const items: Item[] = [];

  return { items: __DEV__ ? Object.freeze(items) : items, list: [0, -1] };
}
