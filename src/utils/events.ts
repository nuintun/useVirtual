/**
 * @module events
 */

// 事件标识
export const enum Events {
  None = 0,
  Resize = 1 << 0,
  Scroll = 1 << 1,
  ReachEnd = 1 << 2
}

/**
 * @function hasEvent
 * @function 检测事件混合标识中是否包含指定事件
 * @param events 事件混合标识
 * @param type 当前事件标识
 */
export function hasEvent(events: number, type: Events): boolean {
  return (events & type) === type;
}
