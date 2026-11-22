import { describe, it, expect } from 'vitest';
import { buildStation, D, P, TRACK_Z } from '../src/render/stationBuilder';
import { StationSim, canStandAt, heightAt } from '../src/engine/stationSim';
import { RailSim, WINDOW, APPROACH_DIST } from '../src/engine/railSim';

const data = buildStation('high');

/** 格子BFS：プレイヤーが歩ける範囲で、指定地点同士が到達可能か（高さ連続性を含む） */
function reachable(from: [number, number, number], to: [number, number], cell = 0.4) {
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`; const seen = new Set<string>(); const q: [number, number, number, number][] = [];
  const start: [number, number, number, number] = [Math.round(from[0] / cell), Math.round(from[2] / cell), from[1], 0]; q.push(start); seen.add(key(start[0], start[1], Math.round(from[1] * 4)));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let best = Infinity;
  while (q.length) {
    const [i, j, y] = q.shift()!; const x = i * cell, z = j * cell;
    best = Math.min(best, Math.hypot(x - to[0], z - to[1]));
    if (best < 0.6) return true;
    for (const [di, dj] of dirs) {
      const ni = i + di, nj = j + dj; const h = canStandAt(data, ni * cell, nj * cell, y);
      if (h === null) continue; const k = key(ni, nj, Math.round(h * 4)); if (seen.has(k)) continue; seen.add(k); q.push([ni, nj, h, 0]);
    }
  }
  return false;
}

describe('駅ジオメトリ・歩行', () => {
  it('ビルド統計：メッシュ統合でドローコールが少ない', () => {
    expect(data.stats.triangles).toBeGreaterThan(5000);
    expect(data.stats.meshes).toBeLessThan(120);
  });
  it('駅前広場→入口階段→コンコースの高さが連続', () => {
    expect(heightAt(data.zones, 0, -30, 0)).toBe(0);
    expect(heightAt(data.zones, 0, -19, 3)).toBeCloseTo(D * (7 / 14), 1);
    expect(heightAt(data.zones, 0, -12.1, D)).toBeCloseTo(D, 1);
    expect(heightAt(data.zones, 0, 0, D)).toBe(D);
  });
  it('広場→コンコース（改札外）へ歩いて到達できる', () => { expect(reachable([0, 0, -34], [-10.8, -8.5])).toBe(true); });
  it('広場→改札→ホーム（階段経由）へ歩いて到達できる', () => { expect(reachable([0, 0, -34], [-18, 2.6])).toBe(true); expect(reachable([0, 0, -34], [20, -2.8])).toBe(true); });
  it('事務室（勤務表・端末・駅長）へ到達できる', () => { expect(reachable([0, 0, -34], [10.2, -8.6])).toBe(true); expect(reachable([0, 0, -34], [9.9, -7.6])).toBe(true); });
  it('線路上は歩けない（ホームから軌道へ落ちない）', () => {
    expect(canStandAt(data, 0, TRACK_Z.A, P)).toBeNull(); expect(canStandAt(data, 0, TRACK_Z.B, P)).toBeNull(); expect(canStandAt(data, 0, 3.9, P)).toBeNull();
  });
  it('改札機の間は通れず、通路は通れる', () => {
    expect(canStandAt(data, -2.75, -4.0, D)).toBeNull(); expect(canStandAt(data, -2.2, -4.0, D)).not.toBeNull(); expect(canStandAt(data, 3.5, -4.0, D)).not.toBeNull();
    expect(canStandAt(data, -8, -4.0, D)).toBeNull();
  });
  it('ホーム階段の下（ホーム面）は階段の下に潜れない', () => { expect(canStandAt(data, -20, 0, P)).toBeNull(); expect(canStandAt(data, -20, 0, 3.6)).not.toBeNull(); });
  it('全インタラクト対象にプレイヤーが近づける（アンカー周囲に立てる場所がある）', () => {
    for (const a of Object.values(data.anchors)) {
      if (a.id.startsWith('spawn') || a.id === 'elevator') continue;
      let ok = false; for (let r = 0.8; r <= 2.2 && !ok; r += 0.2) for (let t = 0; t < 16; t++) { const x = a.x + Math.cos(t / 16 * 6.283) * r, z = a.z + Math.sin(t / 16 * 6.283) * r; if (canStandAt(data, x, z, a.y) !== null) { ok = true; break; } }
      expect(ok, `${a.id} に近づけない`).toBe(true);
    }
  });
  it('移動：壁に向かって進んでも貫通しない', () => {
    const sim = new StationSim(data); sim.teleport(-12, D, -2, 0); for (let i = 0; i < 400; i++) sim.move(-1, 0, 0.016); expect(sim.player.x).toBeGreaterThan(-14.0);
    sim.teleport(0, D, -6, 0); for (let i = 0; i < 300; i++) sim.move(0, 1, 0.016); expect(sim.player.z).toBeLessThan(12.1);
  });
  it('移動：入口階段を登ると高さが上がる', () => {
    const sim = new StationSim(data); sim.teleport(0, 0, -28, 0); for (let i = 0; i < 900; i++) sim.move(0, 1, 0.016, true); expect(sim.player.y).toBeGreaterThan(D - 0.5);
  });
  it('レジストリ：浮き・地中埋没の自動検査（床・地面支持物）', () => {
    const lv = { ground: 0, platform: P, deck: D } as const; const bad: string[] = [];
    for (const a of data.registry) { if (a.support === 'ground' || a.support === 'platform' || a.support === 'deck') { const l = lv[a.support]; if (a.min[1] > l + 0.06) bad.push(`${a.name}(浮き ${a.min[1].toFixed(2)})`); if (a.min[1] < l - 1.2 && a.tag !== 'terrain') bad.push(`${a.name}(埋没 ${a.min[1].toFixed(2)})`); } }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

describe('鉄道シミュレーション', () => {
  const rail = new RailSim();
  it('停車位置は常にホーム中央、到着前は遠方、発車後は遠方へ', () => {
    const s = rail.services.find(x => x.track === 'B')!; const T = rail.actualArrival(s);
    const at = (t: number) => rail.states(t).find(x => x.service.id === s.id);
    expect(at(T - WINDOW.arrive - 0.01)).toBeUndefined(); expect(at(T - WINDOW.arrive)!.x).toBeCloseTo(-s.dir * APPROACH_DIST, 3);
    expect(at(T)!.x).toBeCloseTo(0, 5); expect(at(T + 1)!.x).toBe(0); expect(at(T + 1)!.doors).toBeGreaterThan(0.99);
    expect(Math.abs(at(T + WINDOW.dwell + WINDOW.depart - 0.001)!.x)).toBeGreaterThan(APPROACH_DIST * 0.99);
  });
  it('進入速度は等減速で停止時に0（運動学整合：v²=2·a·d）', () => {
    const s = rail.services.find(x => x.track === 'A')!; const T = rail.actualArrival(s);
    const a = rail.states(T - 1)[0]; const sec = 6; // 1分=6秒
    const aDec = (2 * APPROACH_DIST) / ((WINDOW.arrive * sec) ** 2); const v0 = aDec * WINDOW.arrive * sec;
    expect(v0 * 3.6).toBeGreaterThan(60); expect(v0 * 3.6).toBeLessThan(110);
    const dist = Math.abs(a.x); const v = Math.sqrt(2 * aDec * dist); expect(a.speed).toBeCloseTo(v, 0);
  });
  it('同一線路の列車が時間的に重ならない（遅延連鎖を含む）', () => {
    for (const tr of ['A', 'B'] as const) {
      const ss = rail.services.filter(s => s.track === tr);
      for (let i = 0; i < ss.length - 1; i++) { const end = rail.actualArrival(ss[i]) + WINDOW.dwell + WINDOW.depart; const start = rail.actualArrival(ss[i + 1]) - WINDOW.arrive; expect(end, `${ss[i].id}→${ss[i + 1].id}`).toBeLessThanOrEqual(start + 1e-9); }
    }
  });
  it('遅延：10:35以降の1番線に12→8→4→0分の連鎖遅延、第一報は10分', () => {
    const d = rail.services.filter(s => rail.delayOf(s) > 0); expect(d.map(s => rail.delayOf(s))).toEqual([12, 8, 4]);
    const f = rail.firstDelayed()!; expect(rail.announcedDelay(f, 10 * 60 + 45)).toBe(10); expect(rail.announcedDelay(f, 11 * 60 + 5)).toBe(12);
    const rows = rail.board(10 * 60 + 45, 'A'); expect(rows.some(r => r.delayed && r.status.includes('10'))).toBe(true);
  });
  it('イベント：接近→到着→発車の順で発生', () => {
    const s = rail.services[3]; const T = rail.actualArrival(s); const ev = rail.events(T - 3, T + 5).filter(e => e.service.id === s.id).map(e => e.type);
    expect(ev).toEqual(['approach', 'arrive', 'depart']);
  });
});
