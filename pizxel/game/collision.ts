/**
 * Collision Detection
 *
 * Various collision detection algorithms for game entities.
 */

import { Sprite } from "./sprite";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Check if two rectangles overlap (AABB collision)
 */
export function rectRect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if two sprites collide
 */
export function spriteSprite(a: Sprite, b: Sprite): boolean {
  return rectRect(a.getBounds(), b.getBounds());
}

/**
 * Check if point is inside rectangle
 */
export function pointRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

/**
 * Check if two circles overlap
 */
export function circleCircle(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < a.radius + b.radius;
}

/**
 * Check if circle overlaps with rectangle
 */
export function circleRect(circle: Circle, rect: Rect): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared < circle.radius * circle.radius;
}

/**
 * Get all sprites from a list that collide with target sprite
 */
export function getCollisions(target: Sprite, sprites: Sprite[]): Sprite[] {
  const collisions: Sprite[] = [];
  for (const sprite of sprites) {
    if (sprite === target) continue;
    if (!sprite.active) continue;
    if (spriteSprite(target, sprite)) {
      collisions.push(sprite);
    }
  }
  return collisions;
}

/**
 * Get all sprites from a list that have a specific tag and collide with target
 */
export function getCollisionsByTag(
  target: Sprite,
  sprites: Sprite[],
  tag: string
): Sprite[] {
  const collisions: Sprite[] = [];
  for (const sprite of sprites) {
    if (sprite === target) continue;
    if (!sprite.active) continue;
    if (!sprite.hasTag(tag)) continue;
    if (spriteSprite(target, sprite)) {
      collisions.push(sprite);
    }
  }
  return collisions;
}

/**
 * Check if sprite is outside bounds
 */
export function isOutOfBounds(
  sprite: Sprite,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    sprite.x + sprite.width < bounds.x ||
    sprite.x > bounds.x + bounds.width ||
    sprite.y + sprite.height < bounds.y ||
    sprite.y > bounds.y + bounds.height
  );
}

/**
 * Clamp sprite position to bounds
 */
export function clampToBounds(
  sprite: Sprite,
  bounds: { x: number; y: number; width: number; height: number }
): void {
  sprite.x = Math.max(
    bounds.x,
    Math.min(sprite.x, bounds.x + bounds.width - sprite.width)
  );
  sprite.y = Math.max(
    bounds.y,
    Math.min(sprite.y, bounds.y + bounds.height - sprite.height)
  );
}
