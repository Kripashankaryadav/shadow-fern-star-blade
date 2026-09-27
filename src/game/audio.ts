import { useGameStore } from "./store";

type Osc = OscillatorNode;

function envGain(ctx: AudioContext, start: number, peak: number, dur: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  return g;
}

class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  engineBus: GainNode | null = null;
  sfxBus: GainNode | null = null;
  musicBus: GainNode | null = null;
  engineOsc: Osc | null = null;
  engineGain: GainNode | null = null;
  noiseGain: GainNode | null = null;
  windGain: GainNode | null = null;
  musicOsc: Osc[] = [];
  unlocked = false;
  lastBoost = false;

  unlock() {
    if (!this.ctx) this.create();
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
    this.unlocked = true;
    this.applyVolumes();
  }

  create() {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.engineBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.engineBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.musicBus.connect(this.master);
    this.master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 62;
    const og = ctx.createGain();
    og.gain.value = 0;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 420;
    osc.connect(filt);
    filt.connect(og);
    og.connect(this.engineBus);
    osc.start();
    this.engineOsc = osc;
    this.engineGain = og;

    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0;
    const nfilt = ctx.createBiquadFilter();
    nfilt.type = "bandpass";
    nfilt.frequency.value = 900;
    noise.connect(nfilt);
    nfilt.connect(ng);
    ng.connect(this.engineBus);
    noise.start();
    this.noiseGain = ng;

    const wind = ctx.createGain();
    wind.gain.value = 0;
    nfilt.connect(wind);
    wind.connect(this.engineBus);
    this.windGain = wind;

    const m1 = ctx.createOscillator();
    const m2 = ctx.createOscillator();
    m1.type = "sine";
    m2.type = "sine";
    m1.frequency.value = 110;
    m2.frequency.value = 164.8;
    const mg = ctx.createGain();
    mg.gain.value = 0.12;
    m1.connect(mg);
    m2.connect(mg);
    mg.connect(this.musicBus);
    m1.start();
    m2.start();
    this.musicOsc = [m1, m2];

    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.master || !this.engineBus || !this.sfxBus || !this.musicBus) return;
    const s = useGameStore.getState().settings;
    const mute = s.muted ? 0 : 1;
    const now = this.ctx!.currentTime;
    this.master.gain.setTargetAtTime(s.master * s.master * mute, now, 0.03);
    this.engineBus.gain.setTargetAtTime(s.engine * s.engine, now, 0.03);
    this.sfxBus.gain.setTargetAtTime(s.effects * s.effects, now, 0.03);
    this.musicBus.gain.setTargetAtTime(s.music * s.music, now, 0.05);
  }

  setEngine(speed01: number, boosting: boolean, playing: boolean) {
    if (!this.engineOsc || !this.engineGain || !this.noiseGain || !this.windGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const on = playing && this.unlocked ? 1 : 0;
    const f = 58 + speed01 * 150 + (boosting ? 40 : 0);
    this.engineOsc.frequency.setTargetAtTime(f, t, 0.05);
    this.engineGain.gain.setTargetAtTime((0.04 + speed01 * 0.12) * on, t, 0.05);
    this.noiseGain.gain.setTargetAtTime((0.02 + speed01 * 0.08 + (boosting ? 0.05 : 0)) * on, t, 0.05);
    this.windGain.gain.setTargetAtTime(speed01 * 0.06 * on, t, 0.08);
    if (boosting && !this.lastBoost) this.boost();
    this.lastBoost = boosting;
  }

  beep(freq: number, dur: number, gain = 0.12, type: OscillatorType = "triangle") {
    if (!this.ctx || !this.sfxBus || !this.unlocked) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    const g = envGain(this.ctx, t, gain, dur);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  checkpoint() {
    this.beep(660, 0.09, 0.1);
    this.beep(990, 0.12, 0.08);
  }

  trick() {
    this.beep(520, 0.07, 0.07);
    this.beep(780, 0.1, 0.07);
  }

  crash() {
    if (!this.ctx || !this.sfxBus || !this.unlocked) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.35);
    const g = envGain(this.ctx, t, 0.22, 0.4);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.42);
  }

  boost() {
    this.beep(140, 0.18, 0.1, "sawtooth");
  }

  ring() {
    this.beep(1200, 0.08, 0.06);
  }

  finish() {
    this.beep(440, 0.12, 0.1);
    this.beep(660, 0.16, 0.1);
    this.beep(880, 0.22, 0.1);
  }
}

export const audio = new GameAudio();
