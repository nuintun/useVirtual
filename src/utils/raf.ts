/**
 * @module raf
 */

/**
 * @function abortAnimationFrame
 * @param handle
 */
export function abortAnimationFrame(handle: number | null | undefined): void {
  if (handle != null) {
    cancelAnimationFrame(handle);
  }
}
