/**
 * Audio API
 *
 * Simple API for playing sounds in apps, similar to the display API.
 * Wraps the audio driver to provide a clean interface.
 */

import { AudioDriver } from "./audio-driver";

export class Audio {
  private driver: AudioDriver;

  constructor(driver: AudioDriver) {
    this.driver = driver;
  }

  /**
   * Play a simple beep
   */
  beep(
    frequency: number = 440,
    duration: number = 100,
    volume: number = 0.5
  ): void {
    this.driver.beep(frequency, duration, volume);
  }

  /**
   * Play a named sound effect
   */
  play(soundName: string): void {
    this.driver.playSound(soundName);
  }

  /**
   * Stop all sounds
   */
  stop(): void {
    this.driver.stopAll();
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.driver.setVolume(volume);
  }

  /**
   * Get master volume
   */
  getVolume(): number {
    return this.driver.getVolume();
  }

  /**
   * Check if audio is available
   */
  isAvailable(): boolean {
    return this.driver.isAvailable();
  }
}

// Named sound effects available to all apps
export const Sounds = {
  // UI
  SELECT: "select",
  ERROR: "error",

  // Game events
  COIN: "coin",
  JUMP: "jump",
  HIT: "hit",
  DIE: "die",
  POWERUP: "powerup",

  // Breakout/Pong
  BRICK: "brick",
  BOUNCE: "bounce",
} as const;
