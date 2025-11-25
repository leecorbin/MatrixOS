/**
 * Scroll Container Widget
 *
 * Container that allows scrolling content larger than the visible area.
 * Supports arrow key navigation and displays a scrollbar.
 */

import { Container, ContainerOptions } from "./container";
import { DisplayBuffer } from "../../core/display-buffer";
import { InputEvent } from "../../types";

export interface ScrollContainerOptions extends ContainerOptions {
  scrollSpeed?: number;
  showScrollbar?: boolean;
  scrollbarWidth?: number;
}

export class ScrollContainer extends Container {
  private scrollY: number = 0;
  private scrollSpeed: number;
  private showScrollbar: boolean;
  private scrollbarWidth: number;
  private contentHeight: number = 0;

  constructor(options: ScrollContainerOptions = {}) {
    super(options);
    this.scrollSpeed = options.scrollSpeed ?? 10;
    this.showScrollbar = options.showScrollbar ?? true;
    this.scrollbarWidth = options.scrollbarWidth ?? 3;
  }

  /**
   * Calculate total content height
   */
  private calculateContentHeight(): number {
    let maxY = 0;
    for (const child of this.children) {
      const childBottom = child.y + child.height;
      if (childBottom > maxY) {
        maxY = childBottom;
      }
    }
    return maxY;
  }

  /**
   * Get maximum scroll position
   */
  private getMaxScroll(): number {
    this.contentHeight = this.calculateContentHeight();
    return Math.max(0, this.contentHeight - this.height);
  }

  /**
   * Scroll by a delta amount
   */
  scroll(delta: number): void {
    const maxScroll = this.getMaxScroll();
    this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + delta));
  }

  /**
   * Scroll to a specific position
   */
  scrollTo(y: number): void {
    const maxScroll = this.getMaxScroll();
    this.scrollY = Math.max(0, Math.min(maxScroll, y));
  }

  /**
   * Get current scroll position
   */
  getScrollY(): number {
    return this.scrollY;
  }

  /**
   * Reset scroll to top
   */
  resetScroll(): void {
    this.scrollY = 0;
  }

  /**
   * Override render to apply scroll offset
   */
  render(matrix: DisplayBuffer): void {
    if (!this.visible) {
      return;
    }

    // Render self (background)
    this.renderSelf(matrix);

    // Push clip region for children
    const pos = this.getAbsolutePosition();
    matrix.pushClipRegion(pos.x, pos.y, this.width, this.height);

    // Save scroll state and apply offset to children
    matrix.pushTransform(0, -this.scrollY);

    // Render children (they will be clipped and scrolled)
    for (const child of this.children) {
      child.render(matrix);
    }

    // Restore scroll state
    matrix.popTransform();

    // Restore clip region
    matrix.popClipRegion();

    // Draw scrollbar if content is scrollable
    if (this.showScrollbar && this.contentHeight > this.height) {
      this.renderScrollbar(matrix);
    }
  }

  /**
   * Render scrollbar
   */
  private renderScrollbar(matrix: DisplayBuffer): void {
    const pos = this.getAbsolutePosition();
    const maxScroll = this.getMaxScroll();

    if (maxScroll <= 0) {
      return;
    }

    // Calculate scrollbar dimensions
    const scrollbarX = pos.x + this.width - this.scrollbarWidth;
    const scrollbarHeight = this.height;
    const thumbHeight = Math.max(
      10,
      Math.floor((this.height / this.contentHeight) * scrollbarHeight)
    );
    const thumbY =
      pos.y +
      Math.floor((this.scrollY / maxScroll) * (scrollbarHeight - thumbHeight));

    // Draw scrollbar track (dark)
    matrix.rect(
      scrollbarX,
      pos.y,
      this.scrollbarWidth,
      scrollbarHeight,
      [40, 40, 40],
      true
    );

    // Draw scrollbar thumb (light)
    matrix.rect(
      scrollbarX,
      thumbY,
      this.scrollbarWidth,
      thumbHeight,
      [150, 150, 150],
      true
    );
  }

  /**
   * Handle scroll input
   */
  handleScroll(event: InputEvent): boolean {
    if (event.key === "ArrowUp" || event.key === "k") {
      this.scroll(-this.scrollSpeed);
      return true;
    } else if (event.key === "ArrowDown" || event.key === "j") {
      this.scroll(this.scrollSpeed);
      return true;
    } else if (event.key === "PageUp") {
      this.scroll(-this.height);
      return true;
    } else if (event.key === "PageDown") {
      this.scroll(this.height);
      return true;
    } else if (event.key === "Home") {
      this.scrollTo(0);
      return true;
    } else if (event.key === "End") {
      this.scrollTo(this.getMaxScroll());
      return true;
    }
    return false;
  }
}
