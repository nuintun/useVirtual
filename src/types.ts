/**
 * @module types
 */

export interface Measure {
  end: number;
  size: number;
  index: number;
  start: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface Item {
  readonly size: number;
  readonly index: number;
  readonly start: number;
  readonly sticky?: true;
  readonly scrolling?: true;
  readonly viewport: Viewport;
  readonly measure: (element: Element | null) => void;
}

export interface Frame {
  size: number;
  offset: number;
}

export interface State {
  frame: Frame;
  items: Item[];
}

export interface LoadEvent {
  readonly endIndex: number;
  readonly loadIndex: number;
  readonly startIndex: number;
  readonly userScroll: boolean;
  readonly scrollOffset: number;
}

export interface onLoad {
  (event: LoadEvent): void;
}

export interface ScrollEvent {
  readonly userScroll: boolean;
  readonly scrollOffset: number;
  readonly scrollForward: boolean;
  readonly visibleEndIndex: number;
  readonly overscanEndIndex: number;
  readonly visibleStartIndex: number;
  readonly overscanStartIndex: number;
}

export interface OnScroll {
  (event: ScrollEvent): void;
}

export interface ResizeEvent {
  readonly width: number;
  readonly height: number;
}

export interface OnResize {
  (event: ResizeEvent): void;
}

export interface Scrolling {
  easing?: (time: number) => number;
  duration?: number | ((distance: number) => number);
}

export interface Options {
  onLoad?: onLoad;
  overscan?: number;
  infinite?: boolean;
  stickies?: number[];
  onScroll?: OnScroll;
  onResize?: OnResize;
  horizontal?: boolean;
  scrolling?: Scrolling;
  frame: Element | null;
  viewport: Element | null;
  initial?: number | [number, number];
  isItemLoaded?: (index: number) => boolean;
  scrollspy?: boolean | ((speed: number) => boolean);
  size: number | ((index: number, viewport: Viewport) => number);
}

export interface ScrollToOptions {
  offset: number;
  smooth?: boolean;
}

export interface ScrollTo {
  (value: number | ScrollToOptions, callback?: () => void): void;
}

export enum Align {
  end = 'end',
  auto = 'auto',
  start = 'start',
  center = 'center'
}

export interface ScrollToItemOptions {
  index: number;
  align?: Align;
  smooth?: boolean;
}

export interface ScrollToItem {
  (index: number | ScrollToItemOptions, callback?: () => void): void;
}

export interface Methods {
  scrollTo: ScrollTo;
  scrollToItem: ScrollToItem;
}

export type SizeKey = 'width' | 'height';

export type OffsetKey = 'marginLeft' | 'marginTop';

export type ScrollKey = 'scrollLeft' | 'scrollTop';

export type KeysMap = [sizeKey: SizeKey, offsetKey: OffsetKey, scrollKey: ScrollKey];
