/**
 * @module state
 */

import { State } from './interface';

/**
 * @function getInitialState
 * @description 获取初始化状态数据
 */
export function getInitialState(): State {
  return { items: [], frame: [0, -1] };
}
