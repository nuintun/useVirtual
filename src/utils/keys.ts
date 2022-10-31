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

export const Keys: [vertical: Vertical, horizontal: Horizontal] = [
  {
    size: 'height',
    scrollTo: 'top',
    offset: 'padding-top',
    scrollOffset: 'scrollTop'
  },
  {
    size: 'width',
    scrollTo: 'left',
    offset: 'padding-left',
    scrollOffset: 'scrollLeft'
  }
];
