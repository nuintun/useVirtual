/**
 * @module raf
 */

/**
 * @function requestDeferFrame
 * @param frames
 * @param callback
 * @param onHandleChange
 */
export function requestDeferFrame(
  frames: number,
  callback: FrameRequestCallback,
  onHandleChange?: (handle: number) => void
): void {
  const handle = requestAnimationFrame(time => {
    if (frames > 0) {
      requestDeferFrame(frames - 1, callback, onHandleChange);
    } else {
      callback(time);
    }
  });

  onHandleChange?.(handle);
}

/**
 * @function abortAnimationFrame
 * @param handle
 */
export function abortAnimationFrame(handle: number | null | undefined): void {
  if (handle != null) {
    cancelAnimationFrame(handle);
  }
}
