/**
 * Base Device Driver Classes
 *
 * Abstract base classes for display and input drivers.
 * All drivers must extend these classes.
 */

import {
  DisplayDriver as IDisplayDriver,
  InputDriver as IInputDriver,
  RGB,
  InputEvent,
} from "../../types";

/**
 * Abstract base class for all display drivers
 */
export abstract class DisplayDriver implements IDisplayDriver {
  abstract readonly priority: number;
  abstract readonly name: string;

  protected width: number;
  protected height: number;
  protected buffer: RGB[][];

  constructor(width: number = 256, height: number = 192) {
    this.width = width;
    this.height = height;

    // Initialize display buffer
    this.buffer = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => [0, 0, 0] as RGB)
    );
  }

  // Abstract methods that drivers must implement
  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract isAvailable(): Promise<boolean>;
  abstract show(): void;

  // Concrete methods with default implementations

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setPixel(x: number, y: number, color: RGB): void {
    // Bounds checking
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }

    this.buffer[y][x] = color;
  }

  getPixel(x: number, y: number): RGB {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return [0, 0, 0];
    }
    return this.buffer[y][x];
  }

  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.buffer[y][x] = [0, 0, 0];
      }
    }
  }

  fill(color: RGB = [0, 0, 0]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.buffer[y][x] = color;
      }
    }
  }

  /**
   * Get the entire display buffer (for rendering to external surface)
   */
  getBuffer(): RGB[][] {
    return this.buffer;
  }
}

/**
 * Abstract base class for all input drivers
 */
export abstract class InputDriver implements IInputDriver {
  abstract readonly priority: number;
  abstract readonly name: string;

  protected eventCallback: ((event: InputEvent) => void) | null = null;

  // Abstract methods that drivers must implement
  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract isAvailable(): Promise<boolean>;

  /**
   * Register callback for input events
   */
  onEvent(callback: (event: InputEvent) => void): void {
    this.eventCallback = callback;
  }

  /**
   * Emit an input event to the registered callback
   */
  protected emitEvent(event: InputEvent): void {
    if (this.eventCallback) {
      this.eventCallback(event);
    }
  }
}
