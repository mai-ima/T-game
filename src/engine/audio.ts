/** Web Audio API による手続き生成の環境音・操作音（実録音ではない。独自合成）。iOS Safari対策としてユーザー操作後にstart()する。 */
export type AudioZone = 'plaza' | 'concourse' | 'platform' | 'office' | 'menu';
export interface AudioSettings { master: number; sfx: number; ambient: number; muted: boolean }

export class AudioEngine {
  ctx?: AudioContext; master?: GainNode; sfxBus?: GainNode; ambBus?: GainNode; analyser?: AnalyserNode;
  settings: AudioSettings = { master: 0.8, sfx: 0.9, ambient: 0.7, muted: false };
  private noiseBuf?: AudioBuffer; private brownBuf?: AudioBuffer;
  private amb?: { lp: BiquadFilterNode; gain: GainNode; hum: GainNode; road: GainNode; roadLp: BiquadFilterNode; wind: GainNode };
  private train?: { gain: GainNode; bp: BiquadFilterNode; motor: OscillatorNode; motorGain: GainNode; pan: StereoPannerNode; clack: number };
  private birdTimer?: number; private clackTimer?: number; zone: AudioZone = 'menu'; onCaption?: (t: string, ms?: number) => void;
  started = false; private buf = new Float32Array(1024);
  eventLog: { t: number; kind: string }[] = [];

  get supported() { return typeof window !== 'undefined' && !!(window.AudioContext || (window as any).webkitAudioContext); }

  async start() {
    if (!this.supported) return false;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext; this.ctx = new AC();
      const c = this.ctx; this.master = c.createGain(); this.sfxBus = c.createGain(); this.ambBus = c.createGain(); this.analyser = c.createAnalyser(); this.analyser.fftSize = 2048;
      this.sfxBus.connect(this.master); this.ambBus.connect(this.master); this.master.connect(this.analyser); this.analyser.connect(c.destination);
      this.noiseBuf = this.makeNoise(2, false); this.brownBuf = this.makeNoise(4, true); this.applySettings(); this.buildAmbient();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.started = this.ctx.state === 'running'; this.startBirds(); return this.started;
  }
  private makeNoise(sec: number, brown: boolean) {
    const c = this.ctx!; const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate); const d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  applySettings() { if (!this.master) return; const t = this.ctx!.currentTime; this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.master, t, 0.05); this.sfxBus!.gain.setTargetAtTime(this.settings.sfx, t, 0.05); this.ambBus!.gain.setTargetAtTime(this.settings.ambient, t, 0.05); }
  setSettings(s: Partial<AudioSettings>) { Object.assign(this.settings, s); this.applySettings(); }

  private src(buf: AudioBuffer, loop = true) { const s = this.ctx!.createBufferSource(); s.buffer = buf; s.loop = loop; return s; }
  private buildAmbient() {
    const c = this.ctx!;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const gain = c.createGain(); gain.gain.value = 0.35;
    const n = this.src(this.brownBuf!); n.connect(lp); lp.connect(gain); gain.connect(this.ambBus!); n.start();
    const hum = c.createGain(); hum.gain.value = 0.0; for (const f of [60, 120, 180]) { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = f === 60 ? 0.02 : 0.008; o.connect(g); g.connect(hum); o.start(); } hum.connect(this.ambBus!);
    const roadLp = c.createBiquadFilter(); roadLp.type = 'bandpass'; roadLp.frequency.value = 260; roadLp.Q.value = 0.6; const road = c.createGain(); road.gain.value = 0.25;
    const rn = this.src(this.noiseBuf!); rn.connect(roadLp); roadLp.connect(road); road.connect(this.ambBus!); rn.start();
    const wind = c.createGain(); wind.gain.value = 0.06; const wf = c.createBiquadFilter(); wf.type = 'highpass'; wf.frequency.value = 1800; const wn = this.src(this.noiseBuf!); wn.connect(wf); wf.connect(wind); wind.connect(this.ambBus!); wn.start();
    this.amb = { lp, gain, hum, road, roadLp, wind };
    this.setZone(this.zone);
  }
  setZone(z: AudioZone) {
    this.zone = z; if (!this.amb || !this.ctx) return; const t = this.ctx.currentTime; const a = this.amb;
    const P: Record<AudioZone, [number, number, number, number, number]> = { // lp, gain, hum, road, wind
      plaza: [1400, 0.45, 0.2, 0.4, 0.12], concourse: [700, 0.28, 1.0, 0.1, 0.02], platform: [1000, 0.35, 0.3, 0.12, 0.1], office: [520, 0.18, 1.0, 0.03, 0.0], menu: [600, 0.12, 0.2, 0.05, 0.02]
    };
    const p = P[z]; a.lp.frequency.setTargetAtTime(p[0], t, 0.4); a.gain.gain.setTargetAtTime(p[1], t, 0.4); a.hum.gain.setTargetAtTime(p[2], t, 0.4); a.road.gain.setTargetAtTime(p[3] * 0.5, t, 0.4); a.wind.gain.setTargetAtTime(p[4], t, 0.4);
  }
  private startBirds() { if (this.birdTimer) return; const tick = () => { if (this.ctx?.state === 'running' && (this.zone === 'plaza' || this.zone === 'platform')) this.bird(); this.birdTimer = window.setTimeout(tick, 2500 + Math.random() * 6000); }; this.birdTimer = window.setTimeout(tick, 1500); }
  private bird() { const c = this.ctx!, t = c.currentTime; const o = c.createOscillator(); const g = c.createGain(); o.type = 'sine'; const f = 2600 + Math.random() * 1400; for (let i = 0; i < 3; i++) { o.frequency.setValueAtTime(f + i * 200, t + i * 0.09); o.frequency.exponentialRampToValueAtTime(f * 1.4 + i * 200, t + i * 0.09 + 0.06); } g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.35); o.connect(g); g.connect(this.ambBus!); o.start(t); o.stop(t + 0.4); this.eventLog.push({ t, kind: 'bird' }); }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, when = 0, bus?: GainNode, glide?: number) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when; const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(bus ?? this.sfxBus!); o.start(t); o.stop(t + dur + 0.05);
  }
  private burst(dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = 'bandpass', when = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when; const s = this.src(this.noiseBuf!, false); const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.sfxBus!); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  /** UI操作音 */
  ui(kind: 'click' | 'confirm' | 'cancel' | 'notify' | 'choice' | 'page' | 'save' | 'error') {
    this.eventLog.push({ t: this.ctx?.currentTime ?? 0, kind: 'ui:' + kind }); if (!this.ctx) return;
    switch (kind) {
      case 'click': this.tone(1200, 0.05, 'triangle', 0.08); break;
      case 'page': this.tone(880, 0.04, 'sine', 0.05); break;
      case 'confirm': this.tone(660, 0.09, 'triangle', 0.12); this.tone(990, 0.12, 'triangle', 0.12, 0.07); break;
      case 'choice': this.tone(523, 0.1, 'sine', 0.12); this.tone(659, 0.1, 'sine', 0.12, 0.08); this.tone(784, 0.16, 'sine', 0.12, 0.16); break;
      case 'cancel': this.tone(440, 0.1, 'triangle', 0.1); this.tone(330, 0.14, 'triangle', 0.1, 0.07); break;
      case 'notify': this.tone(1046, 0.12, 'sine', 0.13); this.tone(1318, 0.2, 'sine', 0.13, 0.1); break;
      case 'save': this.tone(784, 0.08, 'sine', 0.1); this.tone(1046, 0.14, 'sine', 0.1, 0.07); break;
      case 'error': this.tone(220, 0.18, 'square', 0.08); break;
    }
  }
  /** 改札機（ピッ／ピンポーン） */
  gate(ok = true) { this.eventLog.push({ t: 0, kind: 'gate' }); if (ok) this.tone(2400, 0.07, 'square', 0.07); else { this.tone(900, 0.22, 'square', 0.08); this.tone(700, 0.22, 'square', 0.08, 0.2); } }
  footstep(surface: 'tile' | 'concrete' | 'stairs' = 'tile') { const f = surface === 'stairs' ? 520 : surface === 'tile' ? 900 : 650; this.burst(0.07, f + Math.random() * 120, 1.2, surface === 'stairs' ? 0.16 : 0.1); }
  /** 接近放送・発車メロディ風の独自ジングル（既存曲ではない）＋字幕 */
  chime(kind: 'approach' | 'depart' | 'info' = 'approach', caption?: string) {
    this.eventLog.push({ t: this.ctx?.currentTime ?? 0, kind: 'chime:' + kind });
    if (caption) this.onCaption?.(caption, 6000); if (!this.ctx) return;
    const seq = kind === 'depart' ? [784, 988, 1175, 988, 1319] : kind === 'info' ? [880, 698] : [698, 880, 1047, 880];
    seq.forEach((f, i) => { this.tone(f, 0.38, 'sine', 0.14, i * 0.26, this.sfxBus!); this.tone(f * 2, 0.3, 'sine', 0.04, i * 0.26); });
  }
  /** 列車走行音：速度(0..1)・距離ゲイン・パン。モーター音＋転動音＋ジョイント音 */
  trainUpdate(speed01: number, gain: number, pan = 0, dwell = false) {
    if (!this.ctx) return; const c = this.ctx;
    if (!this.train) {
      const g = c.createGain(); g.gain.value = 0; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7; const pn = c.createStereoPanner(); const n = this.src(this.noiseBuf!); n.connect(bp); bp.connect(g); g.connect(pn); pn.connect(this.sfxBus!); n.start();
      const motor = c.createOscillator(); motor.type = 'sawtooth'; const mg = c.createGain(); mg.gain.value = 0; const mlp = c.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 1800; motor.connect(mlp); mlp.connect(mg); mg.connect(pn); motor.start();
      this.train = { gain: g, bp, motor, motorGain: mg, pan: pn, clack: 0 };
      this.clackTimer = window.setInterval(() => { const tr = this.train; if (!tr || this.ctx?.state !== 'running') return; const v = (tr as any).v01 as number; const gn = (tr as any).g as number; if (v > 0.05 && gn > 0.02) this.burst(0.05, 180 + v * 400, 2.5, 0.25 * gn * Math.min(1, v * 2), 'bandpass'); }, 260);
    }
    const t = c.currentTime; const tr = this.train; (tr as any).v01 = speed01; (tr as any).g = gain;
    tr.gain.gain.setTargetAtTime(gain * (0.12 + 0.55 * speed01), t, 0.1); tr.bp.frequency.setTargetAtTime(200 + speed01 * 900, t, 0.1); tr.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.1);
    // インバーター風：速度で段階的に周波数が上がるモーター音
    const stepped = Math.floor(speed01 * 8) / 8; tr.motor.frequency.setTargetAtTime(180 + stepped * 900 + speed01 * 120, t, 0.05); tr.motorGain.gain.setTargetAtTime(gain * (speed01 > 0.02 ? 0.025 + 0.02 * speed01 : dwell ? 0.003 : 0), t, 0.1);
  }
  getLevel(): number { if (!this.analyser) return 0; this.analyser.getFloatTimeDomainData(this.buf); let s = 0; for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i]; return Math.sqrt(s / this.buf.length); }
  dispose() { if (this.birdTimer) clearTimeout(this.birdTimer); if (this.clackTimer) clearInterval(this.clackTimer); this.ctx?.close().catch(() => {}); this.ctx = undefined; this.started = false; }
}
