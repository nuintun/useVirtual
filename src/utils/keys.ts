/**
 * @module keys
 */

export interface Horizontal {
  readonly size: 'width';
  readonly scrollTo: 'left';
  readonly offset: 'padding-left';
  readonly scrollOffset: 'scrollLeft';
}

export interface Vertical {
  readonly size: 'height';
  readonly scrollTo: 'top';
  readonly offset: 'padding-top';
  readonly scrollOffset: 'scrollTop';
}

export const VERTICAL_KEYS: Vertical = {
  size: 'height',
  scrollTo: 'top',
  offset: 'padding-top',
  scrollOffset: 'scrollTop'
};

export const HORIZONTAL_KEYS: Horizontal = {
  size: 'width',
  scrollTo: 'left',
  offset: 'padding-left',
  scrollOffset: 'scrollLeft'
};
