/**
 * Audio Input Driver Interface
 *
 * Virtual audio input driver for microphone capture and analysis.
 * Allows different backends (Web Audio API, ALSA, PortAudio, etc.)
 */

// Use generic Float32Array to avoid ArrayBuffer vs ArrayBufferLike issues
type AudioFloat32Array = Float32Array<ArrayBufferLike>;

/**
 * Spectrum data from FFT analysis
 */
export interface SpectrumData {
  /** Raw frequency bin values (typically 32-128 bands) */
  bands: AudioFloat32Array;
  /** Number of frequency bands */
  bandCount: number;
  /** Frequency range per band in Hz */
  frequencyResolution: number;
  /** Timestamp of this sample */
  timestamp: number;
}

/**
 * Audio level information
 */
export interface AudioLevels {
  /** RMS (root mean square) level 0.0 - 1.0 */
  rms: number;
  /** Peak level 0.0 - 1.0 */
  peak: number;
  /** Level in decibels (-100 to 0) */
  db: number;
  /** Whether audio is considered "silent" */
  isSilent: boolean;
}

/**
 * Waveform data for visualization
 */
export interface WaveformData {
  /** Time-domain samples (-1.0 to 1.0) */
  samples: AudioFloat32Array;
  /** Number of samples */
  sampleCount: number;
}

/**
 * Audio classification result
 */
export interface AudioClassification {
  /** Overall audio type detected */
  type: "silence" | "music" | "speech" | "noise" | "unknown";
  /** Confidence score 0.0 - 1.0 */
  confidence: number;
  /** Whether beat/rhythm is detected (for music) */
  hasBeat: boolean;
  /** Estimated tempo in BPM (if music detected) */
  tempo?: number;
}

/**
 * Combined audio analysis snapshot
 */
export interface AudioAnalysis {
  spectrum: SpectrumData;
  levels: AudioLevels;
  waveform: WaveformData;
  classification: AudioClassification;
  timestamp: number;
}

/**
 * Audio input event types
 */
export type AudioInputEvent =
  | { type: "started" }
  | { type: "stopped" }
  | { type: "error"; error: Error }
  | { type: "permission-denied" }
  | { type: "permission-granted" }
  | { type: "beat-detected"; tempo: number }
  | { type: "music-detected" }
  | { type: "silence-detected" }
  | { type: "speech-detected" };

/**
 * Callback for audio input events
 */
export type AudioInputEventCallback = (event: AudioInputEvent) => void;

/**
 * Audio Input Driver Interface
 */
export interface AudioInputDriver {
  /**
   * Initialize the audio input system
   * May require user permission for microphone access
   */
  initialize(): Promise<void>;

  /**
   * Start capturing audio from microphone
   */
  start(): Promise<void>;

  /**
   * Stop capturing audio
   */
  stop(): void;

  /**
   * Check if currently capturing
   */
  isCapturing(): boolean;

  /**
   * Check if audio input is available
   */
  isAvailable(): boolean;

  /**
   * Get current spectrum data (frequency domain)
   */
  getSpectrum(): SpectrumData | null;

  /**
   * Get current audio levels
   */
  getLevels(): AudioLevels | null;

  /**
   * Get current waveform (time domain)
   */
  getWaveform(): WaveformData | null;

  /**
   * Get full audio analysis snapshot
   */
  getAnalysis(): AudioAnalysis | null;

  /**
   * Register callback for audio events
   */
  onEvent(callback: AudioInputEventCallback): void;

  /**
   * Remove event callback
   */
  offEvent(callback: AudioInputEventCallback): void;

  /**
   * Set FFT size (must be power of 2, default 2048)
   */
  setFFTSize(size: number): void;

  /**
   * Set smoothing time constant (0.0 - 1.0, default 0.8)
   */
  setSmoothing(value: number): void;

  /**
   * Clean up resources
   */
  shutdown(): void;
}
