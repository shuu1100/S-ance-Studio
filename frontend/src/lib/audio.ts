"use client";

/**
 * Procedural Web Audio Engine for Séance Studio
 * 100% offline, procedural sound synthesis using the native Web Audio API.
 * Defaults strictly to MUTED until the investigator opts in.
 */

class GothicAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Active oscillators / noise nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private noiseNode: AudioNode | null = null;
  private crackleInterval: number | null = null;
  private activePreset: "cellar_drone" | "rain_storm" | "silent_crypt" = "cellar_drone";
  private initialized: boolean = false;

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambience bus
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.initContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.4;
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    }
    if (!this.isMuted && !this.droneOsc1) {
      this.startAmbience(this.activePreset);
    }
    return this.isMuted;
  }

  public setVolume(volume: number) {
    this.initContext();
    if (this.masterGain && this.ctx && !this.isMuted) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.linearRampToValueAtTime(clamped * 0.6, this.ctx.currentTime + 0.05);
    }
  }

  public startAmbience(preset: "cellar_drone" | "rain_storm" | "silent_crypt" = "cellar_drone") {
    this.initContext();
    if (!this.ctx || !this.ambienceGain) return;
    this.stopAmbience();
    this.activePreset = preset;

    if (preset === "silent_crypt") {
      return;
    }

    const t = this.ctx.currentTime;

    if (preset === "cellar_drone") {
      // Deep ominous gothic sub-drone: 55Hz & 55.4Hz beating
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = "sine";
      this.droneOsc1.frequency.setValueAtTime(55, t); // A1

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = "sine";
      this.droneOsc2.frequency.setValueAtTime(55.8, t); // 0.8Hz throbbing beat

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, t);

      this.droneOsc1.connect(filter);
      this.droneOsc2.connect(filter);
      filter.connect(this.ambienceGain);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // Subtle vintage vinyl crackle
      this.startVinylCrackle();
    } else if (preset === "rain_storm") {
      // Filtered pink noise rain
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.08;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = "lowpass";
      rainFilter.frequency.setValueAtTime(800, t);

      whiteNoise.connect(rainFilter);
      rainFilter.connect(this.ambienceGain);
      whiteNoise.start();
      this.noiseNode = whiteNoise;
    }
  }

  private startVinylCrackle() {
    if (typeof window === "undefined" || this.crackleInterval) return;
    this.crackleInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.ambienceGain) return;
      if (Math.random() > 0.4) return;

      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      clickOsc.type = "triangle";
      clickOsc.frequency.setValueAtTime(1800 + Math.random() * 2400, t);

      clickGain.gain.setValueAtTime(0.015, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.01);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ambienceGain);

      clickOsc.start(t);
      clickOsc.stop(t + 0.012);
    }, 400);
  }

  public stopAmbience() {
    if (this.droneOsc1) {
      try { this.droneOsc1.stop(); this.droneOsc1.disconnect(); } catch {}
      this.droneOsc1 = null;
    }
    if (this.droneOsc2) {
      try { this.droneOsc2.stop(); this.droneOsc2.disconnect(); } catch {}
      this.droneOsc2 = null;
    }
    if (this.noiseNode) {
      try { (this.noiseNode as AudioScheduledSourceNode).stop(); this.noiseNode.disconnect(); } catch {}
      this.noiseNode = null;
    }
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }
  }

  public playSfx(type: "bell" | "planchette" | "candle_snuff" | "paper_rustle" | "whisper_chime") {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    switch (type) {
      case "bell": {
        // High harmonic occult bell chime (880Hz + 1760Hz)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, t);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 2.5);
        break;
      }
      case "candle_snuff": {
        // Quick breath / air burst
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.35);
        break;
      }
      case "planchette": {
        // Wooden drag friction
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.linearRampToValueAtTime(110, t + 0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(320, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.45);
        break;
      }
      case "paper_rustle": {
        // Crisp parchment rustle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.15);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.2);
        break;
      }
      case "whisper_chime": {
        // Two eerie dissonant chimes
        [440, 466.16].forEach((freq) => {
          if (!this.ctx || !this.sfxGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

          osc.connect(gain);
          gain.connect(this.sfxGain);

          osc.start(t);
          osc.stop(t + 1.8);
        });
        break;
      }
    }
  }
}

export const soundEngine = new GothicAudioEngine();
