/**
 * LoadingSpinner Component
 *
 * Animated loading indicator for async operations.
 * Multiple styles available: dots, arc, pulse.
 */

import { Widget, WidgetOptions } from "../core/widget";
import { DisplayBuffer } from "../../core/display-buffer";
import { RGB } from "../../types/index";

export type SpinnerStyle = "dots" | "arc" | "pulse" | "bars";

export interface LoadingSpinnerOptions extends WidgetOptions {
  style?: SpinnerStyle;
  color?: RGB;
  size?: number;
  speed?: number; // Animation speed multiplier
  text?: string; // Optional text below spinner
}

export class LoadingSpinner extends Widget {
  private style: SpinnerStyle;
  private color: RGB;
  private size: number;
  private speed: number;
  private text?: string;
  private frame = 0;
  private animationTime = 0;

  constructor(options: LoadingSpinnerOptions) {
    super(options);
    this.style = options.style ?? "arc";
    this.color = options.color ?? [100, 180, 255];
    this.size = options.size ?? 32;
    this.speed = options.speed ?? 1.0;
    this.text = options.text;
  }

  /**
   * Update animation frame
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime * this.speed;

    // Update frame based on style
    switch (this.style) {
      case "dots":
        this.frame = Math.floor(this.animationTime * 4) % 3;
        break;
      case "arc":
        this.frame = Math.floor(this.animationTime * 8) % 12;
        break;
      case "pulse":
        this.frame = Math.floor(this.animationTime * 6) % 20;
        break;
      case "bars":
        this.frame = Math.floor(this.animationTime * 6) % 4;
        break;
    }
  }

  protected renderSelf(matrix: DisplayBuffer): void {
    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;

    switch (this.style) {
      case "dots":
        this.renderDots(matrix, cx, cy);
        break;
      case "arc":
        this.renderArc(matrix, cx, cy);
        break;
      case "pulse":
        this.renderPulse(matrix, cx, cy);
        break;
      case "bars":
        this.renderBars(matrix, cx, cy);
        break;
    }

    // Render text if provided
    if (this.text) {
      const textWidth = this.text.length * 6;
      const textX = cx - textWidth / 2;
      const textY = this.y + this.size + 8;
      matrix.text(this.text, textX, textY, this.color);
    }
  }

  /**
   * Animated dots: "Loading."  "Loading.."  "Loading..."
   */
  private renderDots(matrix: DisplayBuffer, cx: number, cy: number): void {
    const dotCount = this.frame + 1;
    const spacing = 8;
    const startX = cx - ((dotCount - 1) * spacing) / 2;

    for (let i = 0; i < dotCount; i++) {
      const x = startX + i * spacing;
      matrix.circle(x, cy, 2, this.color, true);
    }
  }

  /**
   * Rotating arc (classic spinner)
   */
  private renderArc(matrix: DisplayBuffer, cx: number, cy: number): void {
    const radius = this.size / 2 - 2;
    const angleStep = 30; // degrees
    const arcLength = 270; // degrees

    const startAngle = (this.frame * angleStep) % 360;
    const endAngle = (startAngle + arcLength) % 360;

    // Draw arc as series of dots
    for (let angle = 0; angle <= arcLength; angle += 10) {
      const currentAngle = (startAngle + angle) * (Math.PI / 180);
      const x = cx + Math.cos(currentAngle) * radius;
      const y = cy + Math.sin(currentAngle) * radius;

      // Fade effect: brighter at the head
      const brightness = 1 - angle / arcLength;
      const fadedColor: RGB = [
        Math.floor(this.color[0] * (0.3 + brightness * 0.7)),
        Math.floor(this.color[1] * (0.3 + brightness * 0.7)),
        Math.floor(this.color[2] * (0.3 + brightness * 0.7)),
      ];

      matrix.setPixel(Math.floor(x), Math.floor(y), fadedColor);
    }
  }

  /**
   * Pulsing circle
   */
  private renderPulse(matrix: DisplayBuffer, cx: number, cy: number): void {
    const maxRadius = this.size / 2 - 2;
    const minRadius = 4;

    // Sine wave for smooth pulse
    const t = this.frame / 20;
    const pulse = Math.sin(t * Math.PI * 2);
    const radius = minRadius + (maxRadius - minRadius) * ((pulse + 1) / 2);

    // Fade alpha with size
    const alpha = (pulse + 1) / 2;
    const fadedColor: RGB = [
      Math.floor(this.color[0] * alpha),
      Math.floor(this.color[1] * alpha),
      Math.floor(this.color[2] * alpha),
    ];

    matrix.circle(cx, cy, Math.floor(radius), fadedColor, false);
  }

  /**
   * Animated bars (like old progress indicators)
   */
  private renderBars(matrix: DisplayBuffer, cx: number, cy: number): void {
    const barWidth = 4;
    const barSpacing = 6;
    const barCount = 5;
    const maxHeight = this.size / 2;

    const startX = cx - ((barCount - 1) * barSpacing) / 2;

    for (let i = 0; i < barCount; i++) {
      // Offset animation for wave effect
      const offset = (this.frame + i) % barCount;
      const height = maxHeight * (0.3 + 0.7 * (offset / (barCount - 1)));

      const x = Math.floor(startX + i * barSpacing);
      const barY = Math.floor(cy + maxHeight / 2 - height / 2);

      // Clamp to display bounds
      if (
        x >= 0 &&
        x + barWidth <= matrix.getWidth() &&
        barY >= 0 &&
        barY + height <= matrix.getHeight()
      ) {
        matrix.rect(x, barY, barWidth, Math.floor(height), this.color, true);
      }
    }
  }

  /**
   * Set loading text
   */
  setText(text: string): void {
    this.text = text;
  }

  /**
   * Change spinner style
   */
  setStyle(style: SpinnerStyle): void {
    this.style = style;
    this.frame = 0;
    this.animationTime = 0;
  }

  /**
   * Change spinner color
   */
  setColor(color: RGB): void {
    this.color = color;
  }
}
