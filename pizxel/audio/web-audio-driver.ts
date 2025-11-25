/**
 * Web Audio Driver
 *
 * Audio driver implementation using Web Audio API for browser-based audio.
 * Supports beeps, sweeps, noise, and simple melodies.
 */

import {
  AudioDriver,
  SoundEffect,
  BeepParams,
  SweepParams,
  NoiseParams,
  MelodyParams,
} from "./audio-driver";

export class WebAudioDriver implements AudioDriver {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private sounds: Map<string, SoundEffect> = new Map();
  private activeSources: Set<AudioScheduledSourceNode> = new Set();

  async initialize(): Promise<void> {
    if (typeof window === "undefined" || !window.AudioContext) {
      console.warn("[WebAudioDriver] Web Audio API not available");
      return;
    }

    // Create audio context (will be suspended until user interaction)
    this.context = new AudioContext();

    // Create master gain node
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.context.destination);

    // Register default sound effects
    this.registerDefaultSounds();

    console.log("[WebAudioDriver] Initialized");
  }

  private registerDefaultSounds(): void {
    // Game sounds
    this.sounds.set("coin", {
      name: "coin",
      type: "sweep",
      params: {
        startFreq: 400,
        endFreq: 800,
        duration: 100,
        volume: 0.3,
      },
    });

    this.sounds.set("jump", {
      name: "jump",
      type: "sweep",
      params: {
        startFreq: 200,
        endFreq: 600,
        duration: 150,
        volume: 0.3,
      },
    });

    this.sounds.set("hit", {
      name: "hit",
      type: "noise",
      params: {
        duration: 100,
        volume: 0.3,
        type: "white",
      },
    });

    this.sounds.set("die", {
      name: "die",
      type: "sweep",
      params: {
        startFreq: 400,
        endFreq: 100,
        duration: 500,
        volume: 0.4,
      },
    });

    this.sounds.set("powerup", {
      name: "powerup",
      type: "melody",
      params: {
        notes: [
          { frequency: 261.63, duration: 80 }, // C
          { frequency: 329.63, duration: 80 }, // E
          { frequency: 392.0, duration: 80 }, // G
          { frequency: 523.25, duration: 150 }, // C (octave up)
        ],
        volume: 0.3,
      },
    });

    this.sounds.set("select", {
      name: "select",
      type: "beep",
      params: {
        frequency: 800,
        duration: 50,
        volume: 0.2,
      },
    });

    this.sounds.set("error", {
      name: "error",
      type: "beep",
      params: {
        frequency: 200,
        duration: 200,
        volume: 0.3,
      },
    });

    this.sounds.set("brick", {
      name: "brick",
      type: "beep",
      params: {
        frequency: 600,
        duration: 50,
        volume: 0.2,
      },
    });

    this.sounds.set("bounce", {
      name: "bounce",
      type: "beep",
      params: {
        frequency: 400,
        duration: 50,
        volume: 0.2,
      },
    });
  }

  beep(frequency: number, duration: number, volume: number = 0.5): void {
    if (!this.context || !this.masterGain) return;

    // Resume context if suspended (due to autoplay policy)
    if (this.context.state === "suspended") {
      this.context.resume();
    }

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = "square"; // Retro square wave!
    oscillator.frequency.value = frequency;

    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    const now = this.context.currentTime;
    oscillator.start(now);
    oscillator.stop(now + duration / 1000);

    this.activeSources.add(oscillator);
    oscillator.onended = () => {
      this.activeSources.delete(oscillator);
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  playSound(name: string): void {
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`[WebAudioDriver] Sound "${name}" not found`);
      return;
    }

    switch (sound.type) {
      case "beep":
        this.playBeep(sound.params as BeepParams);
        break;
      case "sweep":
        this.playSweep(sound.params as SweepParams);
        break;
      case "noise":
        this.playNoise(sound.params as NoiseParams);
        break;
      case "melody":
        this.playMelody(sound.params as MelodyParams);
        break;
    }
  }

  private playBeep(params: BeepParams): void {
    this.beep(params.frequency, params.duration, params.volume);
  }

  private playSweep(params: SweepParams): void {
    if (!this.context || !this.masterGain) return;

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = params.startFreq;

    gainNode.gain.value = params.volume || 0.5;

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    const now = this.context.currentTime;
    const duration = params.duration / 1000;

    // Exponential frequency sweep
    oscillator.frequency.exponentialRampToValueAtTime(
      params.endFreq,
      now + duration
    );

    oscillator.start(now);
    oscillator.stop(now + duration);

    this.activeSources.add(oscillator);
    oscillator.onended = () => {
      this.activeSources.delete(oscillator);
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  private playNoise(params: NoiseParams): void {
    if (!this.context || !this.masterGain) return;

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    // Create noise buffer
    const bufferSize = this.context.sampleRate * (params.duration / 1000);
    const buffer = this.context.createBuffer(
      1,
      bufferSize,
      this.context.sampleRate
    );
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    gainNode.gain.value = params.volume || 0.5;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    const now = this.context.currentTime;
    source.start(now);

    this.activeSources.add(source);
    source.onended = () => {
      this.activeSources.delete(source);
      source.disconnect();
      gainNode.disconnect();
    };
  }

  private playMelody(params: MelodyParams): void {
    let offset = 0;
    for (const note of params.notes) {
      setTimeout(() => {
        this.beep(note.frequency, note.duration, params.volume);
      }, offset);
      offset += note.duration;
    }
  }

  stopAll(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    }
    this.activeSources.clear();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  isAvailable(): boolean {
    return this.context !== null;
  }

  shutdown(): void {
    this.stopAll();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }

  /**
   * Register a custom sound effect
   */
  registerSound(sound: SoundEffect): void {
    this.sounds.set(sound.name, sound);
  }
}
