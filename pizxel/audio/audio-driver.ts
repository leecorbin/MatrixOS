/**
 * Audio Driver Interface
 *
 * Virtual audio driver system following the same pattern as DisplayDriver.
 * Allows different audio backends (Web Audio API, hardware GPIO, etc.)
 */

export interface AudioDriver {
  /**
   * Initialize the audio system
   */
  initialize(): Promise<void>;

  /**
   * Play a simple tone/beep
   * @param frequency Frequency in Hz (e.g., 440 for A4)
   * @param duration Duration in milliseconds
   * @param volume Volume from 0.0 to 1.0
   */
  beep(frequency: number, duration: number, volume?: number): void;

  /**
   * Play a sound effect from a predefined set
   * @param name Name of the sound effect (e.g., 'coin', 'jump', 'hit')
   */
  playSound(name: string): void;

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void;

  /**
   * Set master volume
   * @param volume Volume from 0.0 to 1.0
   */
  setVolume(volume: number): void;

  /**
   * Get current master volume
   */
  getVolume(): number;

  /**
   * Check if audio is available/initialized
   */
  isAvailable(): boolean;

  /**
   * Clean up resources
   */
  shutdown(): void;
}

/**
 * Sound effect definition
 */
export interface SoundEffect {
  name: string;
  type: "beep" | "sweep" | "noise" | "melody";
  params: BeepParams | SweepParams | NoiseParams | MelodyParams;
}

export interface BeepParams {
  frequency: number;
  duration: number;
  volume?: number;
}

export interface SweepParams {
  startFreq: number;
  endFreq: number;
  duration: number;
  volume?: number;
}

export interface NoiseParams {
  duration: number;
  volume?: number;
  type?: "white" | "pink" | "brown";
}

export interface MelodyParams {
  notes: Array<{ frequency: number; duration: number }>;
  volume?: number;
}
