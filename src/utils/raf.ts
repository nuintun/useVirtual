/**
 * @module raf
 */

/**
 * @function requestDeferAnimationFrame
 * @description 延迟指定帧数后回调函数
 * @param frames 延迟帧数
 * @param callback 回调函数
 * @param onHandleChange 帧句柄
 */
export function requestDeferAnimationFrame(
  frames: number,
  callback: FrameRequestCallback,
  onHandleChange?: (handle: number) => void
): void {
  const handle = requestAnimationFrame(time => {
    if (--frames > 0) {
      requestDeferAnimationFrame(frames, callback, onHandleChange);
    } else {
      callback(time);
    }
  });

  onHandleChange?.(handle);
}

/**
 * @function abortAnimationFrame
 * @description 取消帧回调
 * @param handle 帧句柄
 */
export function abortAnimationFrame(handle: number | null | undefined): void {
  if (handle != null) {
    cancelAnimationFrame(handle);
  }
}
