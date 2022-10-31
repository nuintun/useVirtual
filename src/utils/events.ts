/**
 * @module events
 */

export const enum Events {
  onLoad = 1 << 0,
  onResize = 1 << 1,
  onScroll = 1 << 2
}

/**
 * @function useEvent
 * @param events
 * @param type
 */
export function useEvent(events: number, type: Events): boolean {
  return (events & type) === type;
}
