/** Web Audio API による手続き生成の環境音・操作音（実録音ではない。独自合成）。iOS Safari対策としてユーザー操作後にstart()する。 */
export type AudioZone = 'plaza' | 'concourse' | 'platform' | 'office' | 'menu';
export interface AudioSettings { master: number; sfx: number; ambient: number; music: number; muted: boolean }

/** BGMの定義（すべて独自作曲のチップチューン調）。lead は音階の番号（.は休符）で、8分音符×小節ごとに並べる。 */
interface Track { bpm: number; root: number; scale: number[]; prog: number[]; minor: boolean[]; bass: string; lead: string; leadWave: OscillatorType; hat?: boolean; kick?: boolean; vol: number }
const MAJ = [0, 2, 4, 7, 9, 12, 14], MIN = [0, 3, 5, 7, 10, 12, 15];
export const TRACKS: Record<string, Track> = {
  menu: { bpm: 92, root: 57, scale: MIN, prog: [0, -4, 3, -2], minor: [true, false, false, false], bass: 'x.x.x.x.', lead: '0.2.4.2.|5.4.2.0.|2.4.5.4.|2.0.....|', leadWave: 'square', vol: 0.55, kick: true },
  hub: { bpm: 112, root: 60, scale: MAJ, prog: [0, 5, 7, 5], minor: [false, false, false, false], bass: 'x.xxx.x.', lead: '0.2.4.2.|4.5.4.2.|0.2.4.5.|4.2.0.2.|', leadWave: 'square', vol: 0.45, hat: true, kick: true },
  talk_calm: { bpm: 76, root: 55, scale: MAJ, prog: [0, 9, 5, 7], minor: [false, true, false, false], bass: 'x.......', lead: '4...2...|0...2...|4...5...|4.......|', leadWave: 'triangle', vol: 0.5 },
  office: { bpm: 90, root: 53, scale: MIN, prog: [0, 3, -2, 5], minor: [true, false, false, true], bass: 'x..x..x.', lead: '2...0...|3...2...|0...3...|2.......|', leadWave: 'triangle', vol: 0.45, hat: true },
  tense: { bpm: 126, root: 52, scale: MIN, prog: [0, 0, -2, -4], minor: [true, true, false, false], bass: 'xxxxxxxx', lead: '0.0.3.0.|5.4.3.0.|0.0.3.5.|4.3.2.0.|', leadWave: 'square', vol: 0.5, hat: true, kick: true },
  warm: { bpm: 84, root: 60, scale: MAJ, prog: [0, 7, 9, 5], minor: [false, false, true, false], bass: 'x...x...', lead: '2.4.5.4.|2...0...|4.5.7.5.|4...2...|', leadWave: 'triangle', vol: 0.5 },
  dawn: { bpm: 64, root: 57, scale: MAJ, prog: [0, 5, 9, 7], minor: [false, false, true, false], bass: 'x.......', lead: '4...5...|7...5...|4...2...|0.......|', leadWave: 'triangle', vol: 0.5 },
  friend: { bpm: 100, root: 62, scale: MAJ, prog: [0, 7, 9, 5], minor: [false, false, true, false], bass: 'x.x.x.x.', lead: '4.5.7.5.|4.2.4...|5.7.9.7.|5.4.2...|', leadWave: 'square', vol: 0.4, hat: true },
  mystery: { bpm: 78, root: 52, scale: MIN, prog: [0, 3, -2, -5], minor: [true, false, false, true], bass: 'x...x...', lead: '0...3...|2...0...|3...5...|4.......|', leadWave: 'triangle', vol: 0.45 },
  night: { bpm: 68, root: 55, scale: MIN, prog: [0, -4, -2, -7], minor: [true, false, false, false], bass: 'x.......', lead: '2...4...|3...2...|0...2...|0.......|', leadWave: 'triangle', vol: 0.45 },
  festival: { bpm: 122, root: 60, scale: MAJ, prog: [0, 5, 7, 5], minor: [false, false, false, false], bass: 'xxxxxxxx', lead: '4.5.7.9.|7.5.4.5.|4.5.7.9.|9.7.5.4.|', leadWave: 'square', vol: 0.45, hat: true, kick: true },
  pride: { bpm: 86, root: 58, scale: MAJ, prog: [0, 9, 5, 7], minor: [false, true, false, false], bass: 'x...x...', lead: '4...5.7.|9...7...|5...7.9.|7.......|', leadWave: 'triangle', vol: 0.5 },
  depot: { bpm: 100, root: 50, scale: MIN, prog: [0, 0, 5, 3], minor: [true, true, false, false], bass: 'x.x.xx.x', lead: '0...2...|3...5...|4...3...|2...0...|', leadWave: 'square', vol: 0.45, kick: true, hat: true }
};

export class AudioEngine {
  ctx?: AudioContext; master?: GainNode; sfxBus?: GainNode; ambBus?: GainNode; analyser?: AnalyserNode;
  settings: AudioSettings = { master: 0.8, sfx: 0.6, ambient: 0.4, music: 0.5, muted: false };
  private musicBus?: GainNode; private duckGain?: GainNode; track: string | null = null; private seq?: { timer: number; step: number; next: number; t: Track; gain: GainNode }; musicLog: string[] = [];
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
      const c = this.ctx; this.master = c.createGain(); this.sfxBus = c.createGain(); this.ambBus = c.createGain(); this.musicBus = c.createGain(); this.duckGain = c.createGain(); this.musicBus.connect(this.duckGain); this.duckGain.connect(this.master); this.analyser = c.createAnalyser(); this.analyser.fftSize = 2048;
      this.sfxBus.connect(this.master); this.ambBus.connect(this.master); this.master.connect(this.analyser); this.analyser.connect(c.destination);
      this.noiseBuf = this.makeNoise(2, false); this.brownBuf = this.makeNoise(4, true); this.applySettings(); this.buildAmbient(); const pending = this.track; this.track = null; if (pending) this.playMusic(pending);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.started = this.ctx.state === 'running'; this.startBirds(); return this.started;
  }
  private makeNoise(sec: number, brown: boolean) {
    const c = this.ctx!; const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate); const d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  applySettings() { if (!this.master) return; const t = this.ctx!.currentTime; this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.master, t, 0.05); this.sfxBus!.gain.setTargetAtTime(this.settings.sfx, t, 0.05); this.ambBus!.gain.setTargetAtTime(this.settings.ambient, t, 0.05); this.musicBus!.gain.setTargetAtTime(this.settings.music, t, 0.05); }
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
      plaza: [900, 0.16, 0.1, 0.18, 0.03], concourse: [500, 0.1, 0.5, 0.04, 0.0], platform: [700, 0.13, 0.15, 0.05, 0.03], office: [380, 0.07, 0.5, 0.01, 0.0], menu: [400, 0.03, 0.05, 0.0, 0.0]
    };
    const p = P[z]; a.lp.frequency.setTargetAtTime(p[0], t, 0.4); a.gain.gain.setTargetAtTime(p[1], t, 0.4); a.hum.gain.setTargetAtTime(p[2], t, 0.4); a.road.gain.setTargetAtTime(p[3] * 0.5, t, 0.4); a.wind.gain.setTargetAtTime(p[4], t, 0.4);
  }
  private startBirds() { if (this.birdTimer) return; const tick = () => { if (this.ctx?.state === 'running' && (this.zone === 'plaza' || this.zone === 'platform')) this.bird(); this.birdTimer = window.setTimeout(tick, 9000 + Math.random() * 16000); }; this.birdTimer = window.setTimeout(tick, 1500); }
  private bird() { const c = this.ctx!, t = c.currentTime; const o = c.createOscillator(); const g = c.createGain(); o.type = 'sine'; const f = 2600 + Math.random() * 1400; for (let i = 0; i < 3; i++) { o.frequency.setValueAtTime(f + i * 200, t + i * 0.09); o.frequency.exponentialRampToValueAtTime(f * 1.4 + i * 200, t + i * 0.09 + 0.06); } g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.018, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.35); o.connect(g); g.connect(this.ambBus!); o.start(t); o.stop(t + 0.4); this.eventLog.push({ t, kind: 'bird' }); }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, when = 0, bus?: GainNode, glide?: number) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when; const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(bus ?? this.sfxBus!); o.start(t); o.stop(t + dur + 0.05);
  }
  private burst(dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = 'bandpass', when = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when; const s = this.src(this.noiseBuf!, false); const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.sfxBus!); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  /** 会話中は音楽を少し下げ、文字が出るたびに人物ごとの声の高さで短い音を鳴らす */
  duck(on: boolean) { if (this.duckGain && this.ctx) this.duckGain.gain.setTargetAtTime(on ? 0.55 : 1, this.ctx.currentTime, 0.2); }
  blip(pitch: number, kind: 'voice' | 'narration' = 'voice') { if (!this.ctx) return; this.eventLog.push({ t: 0, kind: 'blip' }); const f = pitch * (0.94 + Math.random() * 0.12); if (kind === 'narration') this.tone(180, 0.03, 'triangle', 0.025); else this.tone(f, 0.04, 'triangle', 0.03, 0, undefined, f * 1.04); }
  playMusic(name: string | null) {
    if (name === this.track) return; this.track = name; this.musicLog.push(String(name)); if (!this.ctx) return;
    if (this.seq) { const old = this.seq; clearInterval(old.timer); old.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25); setTimeout(() => old.gain.disconnect(), 1200); this.seq = undefined; }
    const t = name ? TRACKS[name] : undefined; if (!t) return; const gain = this.ctx.createGain(); gain.gain.value = 0; gain.connect(this.musicBus!); gain.gain.setTargetAtTime(t.vol, this.ctx.currentTime, 0.4);
    const seq = { timer: 0, step: 0, next: this.ctx.currentTime + 0.1, t, gain }; this.seq = seq; const stepDur = 60 / t.bpm / 2;
    const pump = () => { if (!this.ctx || this.seq !== seq) return; while (seq.next < this.ctx.currentTime + 0.35) { this.scheduleStep(seq, seq.step++, seq.next, stepDur); seq.next += stepDur; } };
    seq.timer = window.setInterval(pump, 60); pump();
  }
  private note(gain: GainNode, midi: number, when: number, dur: number, type: OscillatorType, vol: number) { const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12); g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, when + dur); o.connect(g); g.connect(gain); o.start(when); o.stop(when + dur + 0.05); }
  private scheduleStep(seq: { t: Track; gain: GainNode }, i: number, when: number, d: number) {
    const t = seq.t; const bars = t.prog.length; const bar = Math.floor(i / 8) % bars; const pos = i % 8; const root = t.root + t.prog[bar]; const minor = t.minor[bar];
    if (pos === 0) { for (const iv of [0, minor ? 3 : 4, 7]) this.note(seq.gain, root + iv, when, d * 7.5, 'triangle', 0.07); }
    if (t.bass[pos] === 'x') this.note(seq.gain, root - 12, when, d * 0.9, 'square', 0.085);
    const lead = t.lead.replace(/\|/g, ''); const ch = lead[i % lead.length]; if (ch && ch !== '.') { const deg = t.scale[Number(ch)]; if (deg !== undefined) this.note(seq.gain, t.root + t.prog[bar] + deg + 12, when, d * 1.6, t.leadWave, 0.06); }
    if (t.kick && (pos === 0 || pos === 4)) this.note(seq.gain, 36, when, d * 0.8, 'sine', 0.16);
    if (t.hat && pos % 2 === 1) { const c = this.ctx!; const s = this.src(this.noiseBuf!, false); const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = c.createGain(); g.gain.setValueAtTime(0.03, when); g.gain.exponentialRampToValueAtTime(0.0005, when + 0.04); s.connect(f); f.connect(g); g.connect(seq.gain); s.start(when, Math.random()); s.stop(when + 0.06); }
  }
  /** 場面の節目の合図（重要な選択／章の終わり）。控えめな短い旋律 */
  jingle(kind: 'choice' | 'end') {
    if (!this.ctx) return; this.eventLog.push({ t: 0, kind: 'jingle:' + kind });
    const seq = kind === 'choice' ? [[523, 0], [784, 0.11]] : [[523, 0], [659, 0.16], [784, 0.32], [1046, 0.5]];
    for (const [f, w] of seq) { this.tone(f, kind === 'end' ? 0.5 : 0.2, 'triangle', 0.07, w); this.tone(f * 2, 0.3, 'sine', 0.018, w); }
  }
  /** UI操作音 */
  ui(kind: 'click' | 'confirm' | 'cancel' | 'notify' | 'choice' | 'page' | 'save' | 'error') {
    this.eventLog.push({ t: this.ctx?.currentTime ?? 0, kind: 'ui:' + kind }); if (!this.ctx) return;
    switch (kind) {
      case 'click': this.tone(1200, 0.04, 'sine', 0.04); break;
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
  gate(ok = true) { this.eventLog.push({ t: 0, kind: 'gate' }); if (ok) this.tone(2000, 0.06, 'sine', 0.04); else { this.tone(900, 0.22, 'square', 0.08); this.tone(700, 0.22, 'square', 0.08, 0.2); } }
  /** 自動ドア（モーター音）・開き戸（ラッチ音） */
  door(kind: 'slide' | 'swing') { this.eventLog.push({ t: 0, kind: 'door' }); if (kind === 'slide') { this.burst(0.4, 600, 1.2, 0.015, 'bandpass'); this.tone(180, 0.35, 'sine', 0.02, 0, undefined, 240); } else { this.burst(0.05, 1000, 2, 0.03, 'bandpass'); this.tone(240, 0.08, 'sine', 0.03); } }
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
    tr.gain.gain.setTargetAtTime(gain * (0.04 + 0.2 * speed01), t, 0.1); tr.bp.frequency.setTargetAtTime(200 + speed01 * 900, t, 0.1); tr.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.1);
    // インバーター風：速度で段階的に周波数が上がるモーター音
    const stepped = Math.floor(speed01 * 8) / 8; tr.motor.frequency.setTargetAtTime(180 + stepped * 900 + speed01 * 120, t, 0.05); tr.motorGain.gain.setTargetAtTime(gain * (speed01 > 0.02 ? 0.008 + 0.008 * speed01 : 0), t, 0.1);
  }
  getLevel(): number { if (!this.analyser) return 0; this.analyser.getFloatTimeDomainData(this.buf); let s = 0; for (let i = 0; i < this.buf.length; i++) s += this.buf[i] * this.buf[i]; return Math.sqrt(s / this.buf.length); }
  dispose() { if (this.seq) clearInterval(this.seq.timer); if (this.birdTimer) clearTimeout(this.birdTimer); if (this.clackTimer) clearInterval(this.clackTimer); this.ctx?.close().catch(() => {}); this.ctx = undefined; this.started = false; }
}
