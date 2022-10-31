/**
 * @module events
 */

export const enum Events {
  onResize = 1 << 0,
  onScroll = 1 << 1,
  onReachEnd = 1 << 2
}

/**
 * @function useEvent
 * @param events
 * @param type
 */
export function useEvent(events: number, type: Events): boolean {
  return (events & type) === type;
}
