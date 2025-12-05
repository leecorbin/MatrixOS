/**
 * Canvas Audio Input Driver
 *
 * Audio input driver using Web Audio API for browser-based microphone capture.
 * Provides real-time spectrum analysis, level metering, and audio classification.
 */

import {
  AudioInputDriver,
  AudioInputEvent,
  AudioInputEventCallback,
  SpectrumData,
  AudioLevels,
  WaveformData,
  AudioClassification,
  AudioAnalysis,
} from "./audio-input-driver";

export class CanvasAudioInputDriver implements AudioInputDriver {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  private fftSize: number = 2048;
  private smoothingTimeConstant: number = 0.8;

  private frequencyData: Float32Array | null = null;
  private timeDomainData: Float32Array | null = null;

  private capturing: boolean = false;
  private available: boolean = false;

  private eventCallbacks: Set<AudioInputEventCallback> = new Set();

  // For beat detection
  private beatHistory: number[] = [];
  private lastBeatTime: number = 0;
  private beatThreshold: number = 1.3;

  // For audio classification
  private energyHistory: number[] = [];
  private spectralHistory: number[][] = [];
  private classificationWindow: number = 30; // frames to analyze

  // Silence detection
  private silenceThreshold: number = -50; // dB
  private silenceFrames: number = 0;
  private silenceFrameThreshold: number = 30; // ~0.5 seconds at 60fps

  async initialize(): Promise<void> {
    // Check if Web Audio API is available
    if (typeof window === "undefined" || !window.AudioContext) {
      console.warn("[CanvasAudioInput] Web Audio API not available");
      this.available = false;
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("[CanvasAudioInput] getUserMedia not available");
      this.available = false;
      return;
    }

    this.available = true;
    console.log("[CanvasAudioInput] Initialized (ready for microphone access)");
  }

  async start(): Promise<void> {
    if (!this.available) {
      throw new Error("Audio input not available");
    }

    if (this.capturing) {
      return;
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.emitEvent({ type: "permission-granted" });

      // Create audio context
      this.audioContext = new AudioContext();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

      // Connect microphone to analyser
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      // Allocate data arrays
      this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Float32Array(this.analyser.fftSize);

      // Reset analysis state
      this.beatHistory = [];
      this.energyHistory = [];
      this.spectralHistory = [];
      this.silenceFrames = 0;

      this.capturing = true;
      this.emitEvent({ type: "started" });

      console.log(
        `[CanvasAudioInput] Started capturing (FFT size: ${this.fftSize}, bins: ${this.analyser.frequencyBinCount})`
      );
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        this.emitEvent({ type: "permission-denied" });
        console.error("[CanvasAudioInput] Microphone permission denied");
      } else {
        this.emitEvent({ type: "error", error: error as Error });
        console.error("[CanvasAudioInput] Failed to start:", error);
      }
      throw error;
    }
  }

  stop(): void {
    if (!this.capturing) return;

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Disconnect and clean up
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.capturing = false;

    this.emitEvent({ type: "stopped" });
    console.log("[CanvasAudioInput] Stopped capturing");
  }

  isCapturing(): boolean {
    return this.capturing;
  }

  isAvailable(): boolean {
    return this.available;
  }

  getSpectrum(): SpectrumData | null {
    if (!this.capturing || !this.analyser || !this.frequencyData) {
      return null;
    }

    // Get frequency data in decibels
    // @ts-expect-error Float32Array generic variance issue with Web Audio API
    this.analyser.getFloatFrequencyData(this.frequencyData);

    // Convert to 32 bands for visualization (easier to work with)
    const bandCount = 32;
    const bands = this.createBands(this.frequencyData, bandCount);

    return {
      bands,
      bandCount,
      frequencyResolution:
        (this.audioContext?.sampleRate || 44100) / this.fftSize,
      timestamp: performance.now(),
    };
  }

  private createBands(
    frequencyData: Float32Array<ArrayBufferLike>,
    bandCount: number
  ): Float32Array<ArrayBuffer> {
    const bands = new Float32Array(bandCount);
    const binCount = frequencyData.length;

    // Use logarithmic distribution for more musical frequency bands
    for (let i = 0; i < bandCount; i++) {
      // Logarithmic mapping: lower bands get fewer bins, higher bands get more
      const lowIndex = Math.floor(Math.pow(binCount, i / bandCount));
      const highIndex = Math.floor(Math.pow(binCount, (i + 1) / bandCount));

      // Average the bins in this band
      let sum = 0;
      let count = 0;
      for (let j = lowIndex; j < highIndex && j < binCount; j++) {
        // Convert from dB to linear for averaging, then back
        const linear = Math.pow(10, frequencyData[j] / 20);
        sum += linear;
        count++;
      }

      if (count > 0) {
        // Convert back to dB and normalize to 0-1 range
        const avgLinear = sum / count;
        const avgDb = 20 * Math.log10(avgLinear + 0.0001);
        // Normalize: -100dB to 0dB -> 0 to 1
        bands[i] = Math.max(0, Math.min(1, (avgDb + 100) / 100));
      }
    }

    return bands;
  }

  getLevels(): AudioLevels | null {
    if (!this.capturing || !this.analyser || !this.timeDomainData) {
      return null;
    }

    // Get time domain data
    // @ts-expect-error Float32Array generic variance issue with Web Audio API
    this.analyser.getFloatTimeDomainData(this.timeDomainData);

    // Calculate RMS
    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < this.timeDomainData.length; i++) {
      const sample = this.timeDomainData[i];
      sumSquares += sample * sample;
      const absSample = Math.abs(sample);
      if (absSample > peak) {
        peak = absSample;
      }
    }

    const rms = Math.sqrt(sumSquares / this.timeDomainData.length);
    const db = 20 * Math.log10(rms + 0.0001);
    const isSilent = db < this.silenceThreshold;

    // Track silence for events
    if (isSilent) {
      this.silenceFrames++;
      if (this.silenceFrames === this.silenceFrameThreshold) {
        this.emitEvent({ type: "silence-detected" });
      }
    } else {
      this.silenceFrames = 0;
    }

    return {
      rms: Math.min(1, rms * 2), // Scale for display
      peak: Math.min(1, peak),
      db,
      isSilent,
    };
  }

  getWaveform(): WaveformData | null {
    if (!this.capturing || !this.analyser || !this.timeDomainData) {
      return null;
    }

    // Get time domain data
    // @ts-expect-error Float32Array generic variance issue with Web Audio API
    this.analyser.getFloatTimeDomainData(this.timeDomainData);

    // Downsample to 128 samples for visualization
    const sampleCount = 128;
    const samples = new Float32Array(sampleCount);
    const step = Math.floor(this.timeDomainData.length / sampleCount);

    for (let i = 0; i < sampleCount; i++) {
      samples[i] = this.timeDomainData[i * step];
    }

    return {
      samples,
      sampleCount,
    };
  }

  getAnalysis(): AudioAnalysis | null {
    const spectrum = this.getSpectrum();
    const levels = this.getLevels();
    const waveform = this.getWaveform();

    if (!spectrum || !levels || !waveform) {
      return null;
    }

    const classification = this.classifyAudio(spectrum, levels);

    return {
      spectrum,
      levels,
      waveform,
      classification,
      timestamp: performance.now(),
    };
  }

  private classifyAudio(
    spectrum: SpectrumData,
    levels: AudioLevels
  ): AudioClassification {
    // Default classification
    let type: AudioClassification["type"] = "unknown";
    let confidence = 0;
    let hasBeat = false;
    let tempo: number | undefined;

    // Check for silence first
    if (levels.isSilent) {
      return {
        type: "silence",
        confidence: 1.0,
        hasBeat: false,
      };
    }

    // Store energy history for beat detection
    const energy = this.calculateEnergy(spectrum.bands);
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.classificationWindow) {
      this.energyHistory.shift();
    }

    // Store spectral profile for classification
    const spectralProfile = Array.from(spectrum.bands);
    this.spectralHistory.push(spectralProfile);
    if (this.spectralHistory.length > this.classificationWindow) {
      this.spectralHistory.shift();
    }

    // Beat detection
    const beatResult = this.detectBeat(energy);
    hasBeat = beatResult.detected;
    if (beatResult.tempo) {
      tempo = beatResult.tempo;
    }

    // Audio classification based on spectral features
    if (this.energyHistory.length >= 10) {
      const features = this.extractFeatures(spectrum.bands);

      // Music typically has:
      // - Strong low frequencies (bass)
      // - Consistent rhythm (energy variance)
      // - Wide spectral spread

      // Speech typically has:
      // - Energy concentrated in 300Hz-3400Hz range
      // - High variation in energy
      // - Less low frequency content

      const lowEnergy = features.lowEnergy;
      const midEnergy = features.midEnergy;
      const highEnergy = features.highEnergy;
      const spectralSpread = features.spectralSpread;
      const energyVariance = this.calculateVariance(this.energyHistory);

      // Heuristic classification
      if (hasBeat && lowEnergy > 0.3 && spectralSpread > 0.4) {
        type = "music";
        confidence = 0.7 + (hasBeat ? 0.2 : 0) + (lowEnergy > 0.5 ? 0.1 : 0);
      } else if (
        midEnergy > lowEnergy &&
        midEnergy > highEnergy &&
        energyVariance > 0.1
      ) {
        type = "speech";
        confidence = 0.6 + (energyVariance > 0.2 ? 0.2 : 0);
      } else if (energy > 0.2) {
        type = "noise";
        confidence = 0.5;
      }

      // Emit events on classification change
      if (type === "music" && confidence > 0.7) {
        this.emitEvent({ type: "music-detected" });
      } else if (type === "speech" && confidence > 0.6) {
        this.emitEvent({ type: "speech-detected" });
      }
    }

    return {
      type,
      confidence: Math.min(1, confidence),
      hasBeat,
      tempo,
    };
  }

  private calculateEnergy(bands: Float32Array<ArrayBufferLike>): number {
    let sum = 0;
    for (let i = 0; i < bands.length; i++) {
      sum += bands[i] * bands[i];
    }
    return Math.sqrt(sum / bands.length);
  }

  private extractFeatures(bands: Float32Array<ArrayBufferLike>): {
    lowEnergy: number;
    midEnergy: number;
    highEnergy: number;
    spectralSpread: number;
  } {
    const third = Math.floor(bands.length / 3);

    // Low frequencies (bass) - first third
    let lowSum = 0;
    for (let i = 0; i < third; i++) {
      lowSum += bands[i];
    }
    const lowEnergy = lowSum / third;

    // Mid frequencies - middle third
    let midSum = 0;
    for (let i = third; i < third * 2; i++) {
      midSum += bands[i];
    }
    const midEnergy = midSum / third;

    // High frequencies - last third
    let highSum = 0;
    for (let i = third * 2; i < bands.length; i++) {
      highSum += bands[i];
    }
    const highEnergy = highSum / (bands.length - third * 2);

    // Spectral spread (how wide the energy is distributed)
    let weightedSum = 0;
    let totalEnergy = 0;
    for (let i = 0; i < bands.length; i++) {
      weightedSum += bands[i] * i;
      totalEnergy += bands[i];
    }
    const centroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;

    let varianceSum = 0;
    for (let i = 0; i < bands.length; i++) {
      const diff = i - centroid;
      varianceSum += bands[i] * diff * diff;
    }
    const spectralSpread =
      totalEnergy > 0 ? Math.sqrt(varianceSum / totalEnergy) / bands.length : 0;

    return { lowEnergy, midEnergy, highEnergy, spectralSpread };
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private detectBeat(energy: number): { detected: boolean; tempo?: number } {
    const now = performance.now();

    // Store beat history
    this.beatHistory.push(energy);
    if (this.beatHistory.length > 60) {
      // ~1 second at 60fps
      this.beatHistory.shift();
    }

    // Not enough data yet
    if (this.beatHistory.length < 30) {
      return { detected: false };
    }

    // Calculate average energy
    const avgEnergy =
      this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;

    // Beat detected if energy significantly above average
    const isAboveThreshold = energy > avgEnergy * this.beatThreshold;
    const timeSinceLastBeat = now - this.lastBeatTime;

    // Minimum 200ms between beats (max 300 BPM)
    if (isAboveThreshold && timeSinceLastBeat > 200) {
      this.lastBeatTime = now;

      // Calculate tempo from beat interval
      const tempo =
        timeSinceLastBeat > 0 ? 60000 / timeSinceLastBeat : undefined;

      if (tempo && tempo > 60 && tempo < 200) {
        this.emitEvent({ type: "beat-detected", tempo });
        return { detected: true, tempo };
      }

      return { detected: true };
    }

    return { detected: false };
  }

  onEvent(callback: AudioInputEventCallback): void {
    this.eventCallbacks.add(callback);
  }

  offEvent(callback: AudioInputEventCallback): void {
    this.eventCallbacks.delete(callback);
  }

  private emitEvent(event: AudioInputEvent): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error("[CanvasAudioInput] Event callback error:", error);
      }
    }
  }

  setFFTSize(size: number): void {
    // Must be power of 2 between 32 and 32768
    const validSizes = [
      32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
    ];
    if (!validSizes.includes(size)) {
      console.warn(`[CanvasAudioInput] Invalid FFT size ${size}, using 2048`);
      size = 2048;
    }

    this.fftSize = size;

    if (this.analyser) {
      this.analyser.fftSize = size;
      this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
      this.timeDomainData = new Float32Array(size);
    }
  }

  setSmoothing(value: number): void {
    this.smoothingTimeConstant = Math.max(0, Math.min(1, value));

    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
    }
  }

  shutdown(): void {
    this.stop();
    this.eventCallbacks.clear();
    this.available = false;
    console.log("[CanvasAudioInput] Shutdown complete");
  }
}
