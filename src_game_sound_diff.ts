--- src/game/sound.ts (原始)


+++ src/game/sound.ts (修改后)
import { loadMuted, saveMuted } from "./core";

type OscType = OscillatorType;

class SoundEngine {
  muted: boolean;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    this.muted = loadMuted();
  }

  setMuted(m: boolean) {
    this.muted = m;
    saveMuted(m);
  }

  /** Разбудить аудио-контекст (требование автоплея браузеров). */
  unlock() {
    this.ensure();
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscType = "square",
    vol = 1,
    slideTo?: number,
    delay = 0,
  ) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }

  eat() {
    this.tone(520, 0.09, "square", 0.85, 800);
  }

  bonus() {
    [660, 880, 1320].forEach((f, i) => this.tone(f, 0.1, "triangle", 0.75, undefined, i * 0.07));
  }

  bonusSpawn() {
    this.tone(980, 0.07, "sine", 0.4, 1240, 0.12);
  }

  die() {
    this.tone(300, 0.5, "sawtooth", 0.85, 52);
    this.tone(160, 0.6, "square", 0.45, 38, 0.06);
  }

  start() {
    [440, 660].forEach((f, i) => this.tone(f, 0.08, "square", 0.65, undefined, i * 0.07));
  }

  pause() {
    this.tone(340, 0.09, "square", 0.5, 250);
  }

  resume() {
    this.tone(260, 0.09, "square", 0.5, 380);
  }

  ui() {
    this.tone(520, 0.05, "square", 0.35);
  }
}

export const sound = new SoundEngine();
