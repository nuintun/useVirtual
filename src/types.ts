/**
 * @module types
 */

export type SizeKey = 'width' | 'height';

export type ScrollToKey = 'left' | 'top';

export type Easing = (time: number) => number;

export type ScrollKey = 'scrollLeft' | 'scrollTop';

export type OffsetKey = 'marginLeft' | 'marginTop';

export type BoxSizeKey = 'inlineSize' | 'blockSize';

export type IndexRange = [start: number, end: number];

export type ScrollSizeKey = 'scrollWidth' | 'scrollHeight';

export type Duration = number | ((distance: number) => number);

export type Size = number | ((index: number, viewport: Viewport) => number);

export type MappingKeys = [
  sizeKey: SizeKey,
  offsetKey: OffsetKey,
  scrollKey: ScrollKey,
  boxSizeKey: BoxSizeKey,
  scrollToKey: ScrollToKey,
  scrollSizeKey: ScrollSizeKey
];

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
  readonly end: number;
  readonly size: number;
  readonly index: number;
  readonly start: number;
  readonly viewport: Viewport;
  readonly measure: (element: HTMLElement | null) => void;
}

export interface State {
  items: Item[];
  frame: [start: number, end: number];
}

export interface LoadEvent {
  readonly offset: number;
  readonly visible: IndexRange;
  readonly overscan: IndexRange;
}

export interface onLoad {
  (event: LoadEvent): void;
}

export interface ScrollEvent {
  readonly offset: number;
  readonly forward: boolean;
  readonly visible: IndexRange;
  readonly overscan: IndexRange;
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
  easing?: Easing;
  duration?: Duration;
}

export interface Options {
  size: Size;
  onLoad?: onLoad;
  overscan?: number;
  onResize?: OnResize;
  onScroll?: OnScroll;
  horizontal?: boolean;
  scrolling?: Scrolling;
  frame: HTMLElement | null;
  viewport: HTMLElement | null;
}

export interface ScrollToOptions {
  offset: number;
  smooth?: boolean;
}

export interface ScrollTo {
  (offset: number, callback?: () => void): void;
  (options: ScrollToOptions, callback?: () => void): void;
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
  (index: number, callback?: () => void): void;
  (options: ScrollToItemOptions, callback?: () => void): void;
}

export interface Methods {
  scrollTo: ScrollTo;
  scrollToItem: ScrollToItem;
}
