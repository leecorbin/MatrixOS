/**
 * Audio Module
 *
 * High-level audio API and re-exports from audio drivers.
 * Drivers are now in /drivers/audio/ for consistency with display/input drivers.
 */

// High-level Audio API
export * from "./audio";

// Re-export from drivers for backward compatibility
export {
  AudioOutputDriver,
  SoundEffect,
  BeepParams,
  SweepParams,
  NoiseParams,
  MelodyParams,
} from "../drivers/audio/audio-output-driver";

export { CanvasAudioOutputDriver } from "../drivers/audio/canvas-audio-output-driver";
export { WebAudioOutputDriver } from "../drivers/audio/web-audio-output-driver";

// Also export input drivers
export {
  AudioInputDriver,
  SpectrumData,
  AudioLevels,
  WaveformData,
  AudioClassification,
  AudioAnalysis,
  AudioInputEvent,
  AudioInputEventCallback,
} from "../drivers/audio/audio-input-driver";

export { CanvasAudioInputDriver } from "../drivers/audio/canvas-audio-input-driver";

// Backward compatibility aliases
export { AudioOutputDriver as AudioDriver } from "../drivers/audio/audio-output-driver";
export { CanvasAudioOutputDriver as CanvasAudioDriver } from "../drivers/audio/canvas-audio-output-driver";
export { WebAudioOutputDriver as WebAudioDriver } from "../drivers/audio/web-audio-output-driver";
