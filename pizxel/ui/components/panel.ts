/**
 * Panel Component
 *
 * Container with optional border.
 */

import { Container, ContainerOptions } from "../core/container";
import { DisplayBuffer } from "../../core/display-buffer";
import { RGB } from "../../types/index";

export interface PanelOptions extends ContainerOptions {
  border?: boolean;
  borderColor?: RGB;
  borderWidth?: number;
}

export class Panel extends Container {
  border: boolean;
  borderColor: RGB;
  borderWidth: number;

  constructor(options: PanelOptions = {}) {
    super(options);
    this.border = options.border ?? true;
    this.borderColor = options.borderColor ?? [0, 255, 255]; // Cyan
    this.borderWidth = options.borderWidth ?? 1;
  }

  protected renderSelf(matrix: DisplayBuffer): void {
    // Background
    super.renderSelf(matrix);

    // Border
    if (this.border) {
      const pos = this.getAbsolutePosition();

      for (let i = 0; i < this.borderWidth; i++) {
        matrix.rect(
          pos.x + i,
          pos.y + i,
          this.width - i * 2,
          this.height - i * 2,
          this.borderColor,
          false
        );
      }
    }
  }

  // Override render to clip children to panel bounds
  render(matrix: DisplayBuffer): void {
    this.renderSelf(matrix);

    const pos = this.getAbsolutePosition();
    const innerX = pos.x + this.borderWidth;
    const innerY = pos.y + this.borderWidth;
    const innerWidth = this.width - this.borderWidth * 2;
    const innerHeight = this.height - this.borderWidth * 2;

    // Render children but check if they're within panel bounds
    for (const child of this.children) {
      const childPos = child.getAbsolutePosition();

      // Simple bounds check - only render if child intersects with panel
      if (
        childPos.x < innerX + innerWidth &&
        childPos.x + child.width > innerX &&
        childPos.y < innerY + innerHeight &&
        childPos.y + child.height > innerY
      ) {
        child.render(matrix);
      }
    }
  }
}
