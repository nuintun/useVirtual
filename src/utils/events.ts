/**
 * @module events
 */

// 时间标识
export const enum Events {
  onResize = 1 << 0,
  onScroll = 1 << 1,
  onReachEnd = 1 << 2
}

/**
 * @function useEvent
 * @function 检测事件混合标识中是否包含指定事件
 * @param events 事件混合标识
 * @param type 当前事件标识
 */
export function useEvent(events: number, type: Events): boolean {
  return (events & type) === type;
}
