/**
 * @module types
 */

export type Easing = (time: number) => number;

export type VirtualRange = [start: number, end: number];

export type Duration = number | ((distance: number) => number);

export type Size = number | ((index: number, viewport: Viewport) => number);

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
  readonly items: Item[];
  readonly visible: VirtualRange;
  readonly frame: [start: number, end: number];
}

export interface LoadEvent {
  readonly offset: number;
  readonly visible: VirtualRange;
  readonly overscan: VirtualRange;
}

export interface onLoad {
  (event: LoadEvent): void;
}

export interface ScrollEvent {
  readonly offset: number;
  readonly forward: boolean;
  readonly visible: VirtualRange;
  readonly overscan: VirtualRange;
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

export interface ScrollToItemOptions {
  index: number;
  smooth?: boolean;
  align?: 'auto' | 'start' | 'center' | 'end';
}

export interface ScrollToItem {
  (index: number, callback?: () => void): void;
  (options: ScrollToItemOptions, callback?: () => void): void;
}

export interface Methods {
  scrollTo: ScrollTo;
  scrollToItem: ScrollToItem;
}
