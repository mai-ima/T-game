import storyJson from '../data/r7/story.json';
import type { StoryData, WorldState, ModeId } from './types';
import { StoryRunner, type RunnerView } from './storyRunner';
import { createWorld, gameDate, fmtTime } from './worldState';
import { evalCond } from './conditions';
import { SaveManager, createAdapter, MemoryAdapter, type SaveFile } from './save';
import { StationSim } from './stationSim';
import { RailSim } from './railSim';
import { AudioEngine } from './audio';
import { buildStation, type StationData } from '../render/stationBuilder';
import type { RenderManager, ViewMode, CamMode } from '../render/renderManager';
import { QUALITY, type QualityId } from './quality';

export interface Settings { quality: QualityId; autoQuality: boolean; view: ViewMode; textSpeed: 'fast' | 'normal' | 'slow'; timeLimits: boolean; subtitles: boolean; clockRunning: boolean; master: number; sfx: number; ambient: number; muted: boolean; fontScale: number }
export const DEFAULT_SETTINGS: Settings = { quality: 'high', autoQuality: true, view: '3d', textSpeed: 'normal', timeLimits: true, subtitles: true, clockRunning: true, master: 0.8, sfx: 0.9, ambient: 0.7, muted: false, fontScale: 1 };

export interface Prompt { object: string; label: string; interactionId: string; icon?: string }
export const STORY = storyJson as unknown as StoryData;
export const SECONDS_PER_GAME_MIN = 6;

/** UIから独立したゲーム制御。ストーリー進行・世界状態・シミュレーション・保存・音を束ねるが、描画はRenderManagerに委譲する。 */
export class GameController {
  story = STORY; mode: ModeId = 'R7';
  world!: WorldState; runner!: StoryRunner; view: RunnerView | null = null; lineIndex = 0;
  data!: StationData; sim!: StationSim; rail = new RailSim(); rm?: RenderManager; audio = new AudioEngine();
  saves = new SaveManager(new MemoryAdapter()); storageKind = 'memory'; settings: Settings = { ...DEFAULT_SETTINGS };
  prompt: Prompt | null = null; toast: { text: string; id: number } | null = null; caption: { text: string; until: number } | null = null; backlog: { who: string; text: string }[] = [];
  choiceDeadline: number | null = null; choiceTotal = 0; frac = 0; active = false; version = 0; listeners = new Set<() => void>(); lastSaveAt = 0; panel: string | null = null; endResult: ReturnType<StoryRunner['finishChapter']> | null = null; hubOverlay = false;
  private promptKey = ''; private promptTimer = 0; private toastId = 0; private lastNotifyMin = -1; private choiceTimerId = 0;

  constructor() { this.data = buildStation('high'); this.sim = new StationSim(this.data); }

  subscribe(f: () => void) { this.listeners.add(f); return () => { this.listeners.delete(f); }; }
  notify() { this.version++; this.listeners.forEach(f => f()); }

  async init() {
    const ad = await createAdapter(); this.saves = new SaveManager(ad); this.storageKind = ad.kind;
    try { const raw = localStorage.getItem('rr:settings'); if (raw) this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch { /* 保存不可の環境 */ }
    if (typeof window !== 'undefined' && (window.matchMedia?.('(pointer:coarse)').matches || window.innerWidth < 700) && !localStorage.getItem?.('rr:settings')) { this.settings.quality = 'medium'; }
    this.applyAudioSettings(); this.audio.onCaption = (t, ms) => { if (this.settings.subtitles) { this.caption = { text: t, until: performance.now() + (ms ?? 5000) }; this.notify(); } };
  }
  saveSettings() { try { localStorage.setItem('rr:settings', JSON.stringify(this.settings)); } catch { /* 無視 */ } }
  setSettings(p: Partial<Settings>) {
    Object.assign(this.settings, p); this.saveSettings(); this.applyAudioSettings();
    if (p.quality) this.rm?.setQuality(p.quality); if (p.autoQuality !== undefined) this.rm?.setAuto(p.autoQuality); if (p.view) this.rm?.setViewMode(p.view);
    this.notify();
  }
  applyAudioSettings() { this.audio.setSettings({ master: this.settings.master, sfx: this.settings.sfx, ambient: this.settings.ambient, muted: this.settings.muted }); }

  // ===== 開始・保存 =====
  newGame(name: string) {
    this.mode = 'R7'; this.world = createWorld(this.story, name.trim() || '新入社員'); this.runner = new StoryRunner(this.story, this.world); this.backlog = []; this.endResult = null; this.panel = null;
    this.sim.reset(); this.sim.spawn("spawn_plaza"); this.sim.player.yaw = Math.PI; this.frac = 0; this.active = true;
    this.view = this.runner.enter(this.story.chapters[0].start); this.afterView(); this.notify();
  }
  restore(file: SaveFile) {
    this.mode = file.mode; this.world = file.world; this.runner = new StoryRunner(this.story, this.world); this.backlog = []; this.endResult = null; this.panel = null;
    this.sim.reset(); const p = this.world.playerPos; if (p) this.sim.teleport(p.x, p.y, p.z, p.yaw); else this.sim.spawn('spawn_plaza'); this.frac = 0; this.active = true;
    this.view = this.runner.view(); this.lineIndex = 0; this.afterView(false); this.notify();
  }
  summary(): SaveFile['summary'] {
    const w = this.world; const ch = this.story.chapters.find(c => c.id === w.story.chapter);
    return { chapter: w.story.chapter, chapterTitle: ch?.title ?? '', dayLabel: `${gameDate(this.story.startYear, w.clock.day).label} ${fmtTime(w.clock.minute)}`, node: w.story.node, rating: w.story.chapterResults[w.story.chapter]?.rating };
  }
  async saveSlot(slot: string, quiet = false) {
    const w = this.world; w.playerPos = { x: this.sim.player.x, y: this.sim.player.y, z: this.sim.player.z, yaw: this.sim.player.yaw };
    try { await this.saves.save(this.mode, slot, w, this.summary()); this.lastSaveAt = Date.now(); if (!quiet) { this.say(`スロット「${slot === 'auto' ? 'オートセーブ' : slot}」に保存しました`); this.audio.ui('save'); } } catch (e) { this.say('保存に失敗しました：' + (e as Error).message); this.audio.ui('error'); }
    this.notify();
  }
  async loadSlot(slot: string) { try { const f = await this.saves.load(this.mode, slot); if (!f) { this.say('このスロットは空です'); return false; } this.restore(f); this.say('読み込みました'); this.audio.ui('confirm'); return true; } catch (e) { this.say('読み込めません：' + (e as Error).message); this.audio.ui('error'); return false; } }
  say(text: string) { this.toast = { text, id: ++this.toastId }; this.notify(); const id = this.toastId; setTimeout(() => { if (this.toast?.id === id) { this.toast = null; this.notify(); } }, 3200); }

  // ===== 進行 =====
  get node() { return this.runner.node(); }
  get textWorld() { return (s: string) => s.replace(/\{player\}/g, this.world.playerName); }
  get clockLabel() { return `${fmtTime(this.world.clock.minute)}`; }
  get dateLabel() { return gameDate(this.story.startYear, this.world.clock.day).label; }

  private pushBacklog(who: string, text: string) { this.backlog.push({ who, text }); if (this.backlog.length > 80) this.backlog.shift(); }
  speakerName(who?: string) { if (!who) return ''; if (who === 'player') return this.world.playerName; return this.story.characters[who]?.name ?? who; }

  advanceLine() {
    if (!this.view || this.view.kind !== 'line') return; const n = this.view.node; this.audio.ui('page');
    if (this.lineIndex < n.lines.length - 1) { this.lineIndex++; this.recordLine(); this.notify(); return; }
    this.view = this.runner.next(); this.afterView(); this.notify();
  }
  private recordLine() { if (this.view?.kind !== 'line') return; const l = this.view.node.lines[this.lineIndex]; this.pushBacklog(l.narration ? '' : this.speakerName(l.who), this.textWorld(l.text)); }
  choose(id: string, timedOut = false) {
    if (this.view?.kind !== 'choice') return; clearTimeout(this.choiceTimerId); this.choiceDeadline = null;
    const label = this.view.node.options.find(o => o.id === id)?.label ?? ''; this.pushBacklog('選択', this.textWorld(label) + (timedOut ? '（時間切れ）' : ''));
    this.audio.ui(this.view.node.important ? 'choice' : 'confirm'); this.view = this.runner.choose(id, timedOut); this.afterView(); this.notify();
  }
  interact(id: string) { if (this.view?.kind !== 'hub') return; this.audio.ui('confirm'); this.view = this.runner.interact(id); this.afterView(); this.notify(); }
  resolveTask(score: number) { if (this.view?.kind !== 'task') return; this.audio.ui('confirm'); this.view = this.runner.resolveTask(score); this.afterView(); this.notify(); }
  exitHub() { if (this.view?.kind !== 'hub') return; this.view = this.runner.exitHub(); this.afterView(); this.notify(); }
  waitMinutes(m: number) { if (this.view?.kind !== 'hub') return; for (let i = 0; i < m; i++) { this.stepMinute(); if (this.view?.kind !== 'hub') break; } this.notify(); }
  finishChapter() { this.endResult = this.runner.finishChapter(); this.notify(); }
  startNextChapter() { const n = this.view?.kind === 'end' ? this.view.node : null; if (!n?.nextChapter) return; this.endResult = null; this.view = this.runner.startChapter(n.nextChapter); this.afterView(); this.saveSlot('auto', true); this.notify(); }

  /** ノード遷移後の共通処理：表示対象・NPC・カメラ・音・選択タイマー・オートセーブ */
  private afterView(autosave = true) {
    this.lineIndex = 0; this.recordLine(); const v = this.view!; const w = this.world;
    this.updateNpcVisibility();
    this.applyCamera(); this.updateAudioZone();
    // 時間制限つき選択
    clearTimeout(this.choiceTimerId); this.choiceDeadline = null;
    if (v.kind === 'choice' && v.node.timeLimit && this.settings.timeLimits) { this.choiceTotal = v.node.timeLimit; this.choiceDeadline = performance.now() + v.node.timeLimit * 1000; this.choiceTimerId = window.setTimeout(() => this.choose(v.node.defaultOption!, true), v.node.timeLimit * 1000); }
    if (v.kind === 'hub') { const t = this.runner.checkTimed(); if (t) { this.view = t; this.afterView(false); return; } }
    if (v.kind === 'end') { this.finishChapter(); }
    if (autosave && this.active) this.saveSlot('auto', true);
    this.promptKey = ''; this.updatePrompt(true);
  }

  /** 現在のノードに合わせて、注目カメラ・調べる対象マーカーを設定する */
  applyCamera() {
    const v = this.view; const rm = this.rm; if (!v || !rm) return; const hint = 'node' in v ? v.node.view : undefined;
    if (v.kind === 'hub') { rm.setFocus(null); if (rm.camMode === 'preset') rm.setPreset(null); rm.setMarkers(v.interactions.map(i => ({ object: i.object, label: i.label }))); }
    else { rm.setMarkers([]); const cam = hint?.cam; if (cam?.startsWith('npc:')) rm.setFocus(cam.slice(4)); else { rm.setFocus(null); if (cam && rm.data.presets[cam] && cam !== 'follow') rm.setPreset(cam); } }
  }
  afterAttach() { this.applyCamera(); }

  private stepMinute() {
    const w = this.world; w.clock.minute += 1; if (w.clock.minute >= 1440) { w.clock.minute = 0; w.clock.day++; }
    const t = this.runner.checkTimed(); if (t) { this.view = t; this.afterView(); return; }
    if (this.view?.kind === 'hub') this.refreshHub();
  }

  /** 人物の出入りは、人物データの visibleWhen（時刻・フラグ・場面）で決まる */
  updateNpcVisibility() { for (const def of Object.values(this.story.characters)) { const n = this.sim.npcs[def.id]; if (n && def.visibleWhen) n.visible = evalCond(def.visibleWhen, this.world); } }
  private knownReq = new Set<string>();
  /** 時間経過で増える「依頼」を反映し、新しく出たものを知らせる */
  refreshHub() {
    if (this.view?.kind !== 'hub') return; const prev = this.view; this.view = this.runner.view(); if (this.view.kind !== 'hub') return;
    const fresh = this.view.interactions.filter(i => !prev.interactions.some(p => p.id === i.id) && this.knownReq.has('init') && !this.knownReq.has(i.id));
    for (const i of this.view.interactions) this.knownReq.add(i.id); this.knownReq.add('init');
    if (fresh.length) { const g = this.view.goals.find(x => x.label.startsWith('（依頼）') || x.label.startsWith('（定期）') || x.label.startsWith('（定時）') || x.label.startsWith('（終業前）')); void g; this.say(`新しい仕事：${this.textWorld(fresh[0].label)}${fresh.length > 1 ? ` ほか${fresh.length - 1}件` : ''}`); this.audio.ui('notify'); }
    this.updateNpcVisibility(); this.applyCamera(); this.notify();
  }

  /** 毎フレーム：時計の進行・近接プロンプト・音（描画ループから呼ぶ） */
  tick(dt: number) {
    if (!this.active) return; this.world.playtimeSec += dt;
    if (this.view?.kind === 'hub' && this.settings.clockRunning && !this.panel) {
      this.frac += dt / SECONDS_PER_GAME_MIN; while (this.frac >= 1) { this.frac -= 1; this.stepMinute(); if (this.view?.kind !== 'hub') { this.frac = 0; break; } }
      if (this.world.clock.minute !== this.lastNotifyMin) { this.lastNotifyMin = this.world.clock.minute; this.notify(); }
    }
    this.rm?.setSimMinute(this.world.clock.minute + this.frac);
    this.promptTimer -= dt; if (this.promptTimer <= 0) { this.promptTimer = 0.1; this.updateNpcVisibility(); this.updatePrompt(); this.updateAudioZone(); }
    if (this.caption && performance.now() > this.caption.until) { this.caption = null; this.notify(); }
  }

  updatePrompt(force = false) {
    let next: Prompt | null = null;
    if (this.view?.kind === 'hub') {
      const objs = new Map(this.view.interactions.map(i => [i.object, i])); const near = this.sim.nearest(99, id => objs.has(id));
      if (near) { const it = objs.get(near.id)!; next = { object: near.id, label: this.textWorld(it.label), interactionId: it.id, icon: it.icon }; }
    }
    const k = next ? next.interactionId : ''; if (k !== this.promptKey || force) { this.promptKey = k; this.prompt = next; this.notify(); }
  }
  updateAudioZone() { const p = this.sim.player; const z = this.view?.kind !== 'hub' && this.view && 'node' in this.view && this.view.node.view?.mode === '25d' ? 'office' : p.y > 4 ? (p.x > 7 && p.z < -1 && p.z > -12 ? 'office' : 'concourse') : p.y > 1 ? 'platform' : 'plaza'; if (this.audio.zone !== z) this.audio.setZone(z); }

  // ===== 描画連携 =====
  attachRender(rm: RenderManager) { this.rm = rm; rm.o.onTap = (id, near) => this.onTap(id, near); rm.o.onNavigate = id => this.navigateTo(id, true); }
  /** 目的地（人物・設備）まで経路探索して自動で歩く。到着したら自動で調べる／話す */
  navigateTo(id: string, autoInteract = true) {
    const pt = this.sim.standNear(id); if (!pt || !this.rm) { this.say('そこへは行けません'); return false; }
    const path = this.sim.findPath({ x: pt.x, z: pt.z }); if (!path) { this.say('経路が見つかりません'); return false; }
    this.nav = { id, auto: autoInteract }; this.rm.followPath(path, () => { this.nav = null; if (autoInteract) { this.updatePrompt(true); if (this.prompt?.object === id) this.doPrompt(); } this.notify(); }); this.notify(); return true;
  }
  nav: { id: string; auto: boolean } | null = null;
  /** 次に向かう場所の候補：選べる仕事のうち、いちばん近いもの（必須の目標を優先） */
  suggestTarget(): { id: string; label: string; dist: number; bearing: number } | null {
    const v = this.view; if (v?.kind !== 'hub' || !this.rm) return null; let best: { id: string; label: string; dist: number } | null = null;
    for (const it of v.interactions) { const a = this.data.anchors[it.object]; if (!a) continue; const n = this.sim.npcs[it.object]; if (n && !n.visible) continue; const ax = n ? n.x : a.x, az = n ? n.z : a.z, ay = n ? n.y : a.y; const d = Math.hypot(ax - this.sim.player.x, az - this.sim.player.z) + Math.abs(ay - this.sim.player.y) * 3; if (!best || d < best.dist) best = { id: it.object, label: this.textWorld(it.label), dist: d }; }
    if (!best) return null; const a = this.data.anchors[best.id]; const n = this.sim.npcs[best.id]; const dx = (n ? n.x : a.x) - this.sim.player.x, dz = (n ? n.z : a.z) - this.sim.player.z; const th = this.rm.yaw; const af = Math.atan2(-Math.sin(th), -Math.cos(th)); const at = Math.atan2(dx, dz); let rel = at - af; while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
    return { ...best, bearing: -rel };
  }
  onTap(id: string, near: boolean) {
    if (this.view?.kind !== 'hub') return; const it = this.view.interactions.find(i => i.object === id);
    if (it && near) { this.interact(it.id); return; }
    const a = this.data.anchors[id]; if (a && !it) { this.say(EXAMINE[id] ? EXAMINE[id] : a.label); this.audio.ui('click'); }
  }
  doPrompt() { if (this.prompt) this.interact(this.prompt.interactionId); }
  setView(m: ViewMode) { this.setSettings({ view: m }); }
  setCam(m: CamMode) { this.rm?.setCameraMode(m); this.notify(); }
  qualityInfo() { return QUALITY[this.settings.quality]; }
}

export const EXAMINE: Record<string, string> = {
  departure_board: '発車標：1番線（海浜口方面）と2番線（空港連絡方面）の次の発車が表示されています。遅れが出ると赤字で更新されます。',
  timetable: '時刻表の掲示：下に「旧版（改正前）」と小さく印字されています。',
  emergency_btn: '列車非常停止ボタン：緊急時に押すと接近する列車へ停止を知らせます。押すのは異常があるときだけ。',
  aed: 'AED（自動体外式除細動器）：掲示の位置と使用期限は定期的に確認します。',
  elevator: 'エレベーター：ホームとコンコース、駅前広場を結ぶバリアフリー設備です。',
  fare_map: '路線図・運賃表：青嶺広域鉄道（架空）の路線図です。',
  gate_wide: '幅広改札：車いすやベビーカー、大きな荷物のお客様が通れる改札機です。',
  mic: '放送設備：駅事務室から構内放送を行います。',
  ticket_office: 'きっぷうりば：窓口で乗車券・指定席券の取扱いをします。',
  roster_board: '勤務表の掲示板です。',
  lost_item: 'ベンチに置かれた折りたたみ傘です。',
  tactile: '内方線付き点状ブロック：ホーム縁端の位置を足裏で伝える設備です。'
};
