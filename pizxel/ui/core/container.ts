/**
 * Container Widget
 *
 * Base class for widgets that contain other widgets.
 */

import { Widget, WidgetOptions } from "./widget";
import { DisplayBuffer } from "../../core/display-buffer";
import { RGB } from "../../types/index";

export interface ContainerOptions extends WidgetOptions {
  bgColor?: RGB;
  children?: Widget[];
}

export class Container extends Widget {
  bgColor: RGB;

  constructor(options: ContainerOptions = {}) {
    super(options);
    this.bgColor = options.bgColor ?? [0, 0, 0];

    if (options.children) {
      for (const child of options.children) {
        this.addChild(child);
      }
    }
  }

  protected renderSelf(matrix: DisplayBuffer): void {
    // Fill background if specified
    if (this.bgColor) {
      const pos = this.getAbsolutePosition();
      matrix.rect(pos.x, pos.y, this.width, this.height, this.bgColor, true);
    }
  }

  /**
   * Override render to add clipping for children
   */
  render(matrix: DisplayBuffer): void {
    if (!this.visible) {
      return;
    }

    // Render self
    this.renderSelf(matrix);

    // Push clip region for children
    const pos = this.getAbsolutePosition();
    matrix.pushClipRegion(pos.x, pos.y, this.width, this.height);

    // Render children (they will be clipped)
    for (const child of this.children) {
      child.render(matrix);
    }

    // Restore clip region
    matrix.popClipRegion();
  }
}
