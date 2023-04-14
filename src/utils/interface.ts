/**
 * @module interface
 */

import { Align } from './align';
import { RefObject } from 'react';

export type Easing = (time: number) => number;

export type Duration = number | ((distance: number) => number);

export type VirtualRange = readonly [start: number, end: number];

export type Size = number | ((index: number, viewport: Rect) => number);

export interface Rect {
  readonly width: number;
  readonly height: number;
}

export interface Measure {
  readonly end: number;
  readonly size: number;
  readonly start: number;
}

export interface Unobserve {
  (): void;
}

export interface Observe {
  (element: HTMLElement): Unobserve;
}

export interface Item {
  readonly end: number;
  readonly size: number;
  readonly index: number;
  readonly start: number;
  readonly observe: Observe;
}

export interface Scrolling {
  readonly easing?: Easing;
  readonly duration?: Duration;
}

export interface ResizeEvent {
  readonly width: number;
  readonly height: number;
  readonly items: VirtualRange;
  readonly visible: VirtualRange;
}

export interface OnResize {
  (event: ResizeEvent): void;
}

export interface ScrollEvent {
  readonly delta: number;
  readonly offset: number;
  readonly items: VirtualRange;
  readonly visible: VirtualRange;
}

export interface OnScroll {
  (event: ScrollEvent): void;
}

export interface ReachEndEvent {
  readonly index: number;
  readonly offset: number;
  readonly items: VirtualRange;
  readonly visible: VirtualRange;
}

export interface onReachEnd {
  (event: ReachEndEvent): void;
}

export interface Options {
  readonly size: Size;
  readonly count: number;
  readonly overscan?: number;
  readonly onResize?: OnResize;
  readonly onScroll?: OnScroll;
  readonly scrollbar?: boolean;
  readonly horizontal?: boolean;
  readonly scrolling?: Scrolling;
  readonly onReachEnd?: onReachEnd;
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
  readonly align?: `${Align}`;
}

export interface ScrollToItem {
  (index: number, callback?: () => void): void;
  (options: ScrollToItemOptions, callback?: () => void): void;
}

export interface Api {
  readonly scrollTo: ScrollTo;
  readonly scrollToItem: ScrollToItem;
}

export interface State {
  readonly items: readonly Item[];
  readonly frame: readonly [offset: number, size: number];
}

export type Virtual<T extends HTMLElement, U extends HTMLElement> = readonly [
  items: readonly Item[],
  viewportRef: RefObject<T>,
  frameRef: RefObject<U>,
  api: Api
];
