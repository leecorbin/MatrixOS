/**
 * Sprite - Game Object with Position, Velocity, and Rendering
 *
 * Base class for game entities (player, enemies, projectiles, etc.)
 * Provides position, velocity, collision detection, and rendering.
 */

import { DisplayBuffer } from "../core/display-buffer";
import { RGB } from "../types";

export interface SpriteOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: RGB;
  vx?: number; // Velocity X
  vy?: number; // Velocity Y
  ax?: number; // Acceleration X
  ay?: number; // Acceleration Y
}

export class Sprite {
  // Position
  x: number;
  y: number;
  width: number;
  height: number;

  // Velocity
  vx: number = 0;
  vy: number = 0;

  // Acceleration
  ax: number = 0;
  ay: number = 0;

  // Rendering
  color: RGB;
  visible: boolean = true;

  // State
  active: boolean = true;
  tags: Set<string> = new Set();

  constructor(options: SpriteOptions) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.color = options.color || [255, 255, 255];
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.ax = options.ax || 0;
    this.ay = options.ay || 0;
  }

  /**
   * Update sprite physics
   */
  update(deltaTime: number): void {
    // Apply acceleration to velocity
    this.vx += this.ax * deltaTime;
    this.vy += this.ay * deltaTime;

    // Apply velocity to position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  /**
   * Render sprite as a filled rectangle
   */
  render(buffer: DisplayBuffer): void {
    if (!this.visible) return;
    buffer.rect(
      Math.floor(this.x),
      Math.floor(this.y),
      this.width,
      this.height,
      this.color,
      true
    );
  }

  /**
   * Get bounding box for collision detection
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Get center point
   */
  getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  /**
   * Check if point is inside sprite
   */
  containsPoint(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  /**
   * Add a tag for grouping/identification
   */
  addTag(tag: string): void {
    this.tags.add(tag);
  }

  /**
   * Check if sprite has a tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): void {
    this.tags.delete(tag);
  }
}
