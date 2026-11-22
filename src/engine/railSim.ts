/** 駅の列車運行シミュレーション（鉄道シミュレーションモジュールの最小版）。描画・UIに依存しない。
 *  時刻は「分（小数可）」。到着前2分で進入・停止、2分停車、2分で発車。進入は等減速、発車は等加速の運動学で位置を計算する。 */
export type TrackId = 'A' | 'B';
export interface Service { id: string; track: TrackId; at: number; kind: string; dest: string; num: string; dir: 1 | -1; line: string }
export interface TrainState { service: Service; delay: number; phase: 'arriving' | 'dwell' | 'departing'; progress: number; x: number; speed: number; doors: number; arriveAt: number }
export interface BoardRow { track: TrackId; line: string; time: string; kind: string; dest: string; status: string; delayed: boolean }

export const WINDOW = { arrive: 2, dwell: 2, depart: 2 };
export const APPROACH_DIST = 150;
const SECONDS_PER_GAME_MIN = 6;

const hm = (h: number, m: number) => h * 60 + m;
const fmt = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min) % 60).padStart(2, '0')}`;

export function buildTimetable(): Service[] {
  const out: Service[] = [];
  // 1番線（上り・海浜口方面）：15分間隔。-x方向へ進む。2番線（下り・空港連絡方面）：12分間隔。+x方向へ進む。
  for (let t = hm(8, 24), i = 0; t <= hm(18, 0); t += 15, i++) out.push({ id: `A${i}`, track: 'A', at: t, kind: i % 4 === 3 ? '快速' : '普通', dest: '海浜口', num: `${1200 + i * 2}M`, dir: -1, line: '1' });
  for (let t = hm(8, 30), i = 0; t <= hm(18, 0); t += 12, i++) out.push({ id: `B${i}`, track: 'B', at: t, kind: i % 5 === 4 ? '快速' : '普通', dest: '空港連絡', num: `${1301 + i * 2}M`, dir: 1, line: '2' });
  return out.sort((a, b) => a.at - b.at);
}

export interface DelayScenario { trigger: number; seq: number[] }
export const DEFAULT_DELAY: DelayScenario = { trigger: hm(10, 35), seq: [12, 8, 4, 0] };

export class RailSim {
  services: Service[]; scenario: DelayScenario; private delayMap = new Map<string, number>();
  constructor(services = buildTimetable(), scenario: DelayScenario = DEFAULT_DELAY) {
    this.services = services; this.scenario = scenario;
    const a = services.filter(s => s.track === 'A' && s.at >= scenario.trigger).slice(0, scenario.seq.length);
    a.forEach((s, i) => this.delayMap.set(s.id, scenario.seq[i]));
  }
  delayOf(s: Service) { return this.delayMap.get(s.id) ?? 0; }
  /** 駅に知らされている遅延見込み（第一報10分→11:00に12分へ更新） */
  announcedDelay(s: Service, t: number) { const d = this.delayOf(s); if (d <= 0) return 0; if (s.at === this.firstDelayed()?.at && t < hm(11, 0)) return 10; return d; }
  firstDelayed() { return this.services.find(s => this.delayMap.has(s.id) && this.delayMap.get(s.id)! > 0); }
  actualArrival(s: Service) { return s.at + this.delayOf(s); }

  states(t: number): TrainState[] {
    const out: TrainState[] = [];
    for (const s of this.services) {
      const T = this.actualArrival(s); const a0 = T - WINDOW.arrive, d0 = T + WINDOW.dwell, d1 = d0 + WINDOW.depart;
      if (t < a0 || t >= d1) continue;
      const D = APPROACH_DIST; let phase: TrainState['phase']; let progress = 0; let x = 0; let speed = 0; let doors = 0;
      if (t < T) { phase = 'arriving'; progress = (t - a0) / WINDOW.arrive; x = -s.dir * D * (1 - progress) ** 2; speed = (2 * D * (1 - progress)) / (WINDOW.arrive * SECONDS_PER_GAME_MIN); }
      else if (t < d0) { phase = 'dwell'; progress = (t - T) / WINDOW.dwell; doors = progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1; }
      else { phase = 'departing'; progress = (t - d0) / WINDOW.depart; x = s.dir * D * progress ** 2; speed = (2 * D * progress) / (WINDOW.depart * SECONDS_PER_GAME_MIN); }
      out.push({ service: s, delay: this.delayOf(s), phase, progress, x, speed, doors, arriveAt: T });
    }
    return out;
  }

  /** 発車標の行：各線の次の2本 */
  board(t: number, track?: TrackId): BoardRow[] {
    const rows: BoardRow[] = [];
    for (const tr of (track ? [track] : ['A', 'B']) as TrackId[]) {
      const next = this.services.filter(s => s.track === tr && this.actualArrival(s) + WINDOW.dwell > t).slice(0, 2);
      for (const s of next) {
        const dep = this.actualArrival(s) + WINDOW.dwell; const d = this.delayOf(s); const ann = this.announcedDelay(s, t);
        const known = t >= this.scenario.trigger;
        rows.push({ track: tr, line: s.line, time: fmt(s.at + WINDOW.dwell), kind: s.kind, dest: s.dest, status: d > 0 && known ? `約${ann}分遅れ` : '定刻', delayed: d > 0 && known });
        void dep;
      }
    }
    return rows;
  }

  /** t0→t1で発生した運行イベント（接近・到着・発車） */
  events(t0: number, t1: number): { type: 'approach' | 'arrive' | 'depart'; service: Service }[] {
    const ev: { type: 'approach' | 'arrive' | 'depart'; service: Service }[] = [];
    for (const s of this.services) {
      const T = this.actualArrival(s);
      if (T - WINDOW.arrive > t0 && T - WINDOW.arrive <= t1) ev.push({ type: 'approach', service: s });
      if (T > t0 && T <= t1) ev.push({ type: 'arrive', service: s });
      if (T + WINDOW.dwell > t0 && T + WINDOW.dwell <= t1) ev.push({ type: 'depart', service: s });
    }
    return ev;
  }

  /** 現在時刻に最も近い到着列車の運動学的整合チェック用 */
  static stopDistance(vMs: number, decel: number) { return (vMs * vMs) / (2 * decel); }
}
export const fmtMin = fmt;
