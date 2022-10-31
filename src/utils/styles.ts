/**
 * @module styles
 */

/**
 * @function setStyles
 * @param element
 * @param styles
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
 * @param element
 * @param styles
 */
export function removeStyles(element: HTMLElement | null, styles: string[]): void {
  if (element) {
    const { style } = element;

    for (const property of styles) {
      style.removeProperty(property);
    }
  }
}
