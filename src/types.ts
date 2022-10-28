/**
 * @module types
 */

export type Easing = (time: number) => number;

export type VirtualRange = [start: number, end: number];

export type Duration = number | ((distance: number) => number);

export type Size = number | ((index: number, viewport: Rect) => number);

export interface Rect {
  readonly width: number;
  readonly height: number;
}

export interface Measure {
  readonly end: number;
  readonly size: number;
  readonly index: number;
  readonly start: number;
}

export interface Item {
  readonly end: number;
  readonly size: number;
  readonly index: number;
  readonly start: number;
  readonly viewport: Rect;
  readonly visible: boolean;
  readonly scrolling: boolean;
  readonly measure: (element: HTMLElement | null) => void;
}

export interface State {
  readonly items: Item[];
  readonly visible: VirtualRange;
  readonly frame: [offset: number, size: number];
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
  readonly delta: number;
  readonly offset: number;
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
  readonly easing?: Easing;
  readonly duration?: Duration;
}

export interface Options {
  readonly size: Size;
  readonly onLoad?: onLoad;
  readonly overscan?: number;
  readonly onResize?: OnResize;
  readonly onScroll?: OnScroll;
  readonly horizontal?: boolean;
  readonly scrolling?: Scrolling;
}

export interface ScrollToOptions {
  readonly offset: number;
  readonly smooth?: boolean;
}

export interface ScrollTo {
  (offset: number, callback?: () => void): void;
  (options: ScrollToOptions, callback?: () => void): void;
}

export interface ScrollToItemOptions {
  readonly index: number;
  readonly smooth?: boolean;
  readonly align?: 'auto' | 'start' | 'center' | 'end';
}

export interface ScrollToItem {
  (index: number, callback?: () => void): void;
  (options: ScrollToItemOptions, callback?: () => void): void;
}

export interface Methods {
  readonly scrollTo: ScrollTo;
  readonly scrollToItem: ScrollToItem;
}
