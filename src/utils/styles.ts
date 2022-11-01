/**
 * @module styles
 */

/**
 * @function setStyles
 * @description 设置元素样式
 * @param element 目标元素
 * @param styles 样式列表
 */
export function setStyles(
  element: HTMLElement | null,
  styles: [property: string, value: string | null, priority?: string][]
): void {
  if (element) {
    const { style } = element;

    for (const [property, value, priority] of styles) {
      style.setProperty(property, value, priority);
    }
  }
}

/**
 * @function removeStyles
 * @description 移除元素样式
 * @param element 目标元素
 * @param styles 样式列表
 */
export function removeStyles(element: HTMLElement | null, styles: string[]): void {
  if (element) {
    const { style } = element;

    for (const property of styles) {
      style.removeProperty(property);
    }
  }
}
