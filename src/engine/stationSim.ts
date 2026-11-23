import type { StationData, Zone, Collider, Rect } from '../render/stationBuilder';

/** 駅構内の歩行・衝突・人物位置シミュレーション。描画（Three.js）に依存せず、3D/2.5D/2Dが同一状態を表示する。 */
export const PLAYER_R = 0.3;
export const STEP_TOL = 1.0;

export interface Ent { id: string; x: number; y: number; z: number; yaw: number; visible: boolean; speed: number; walking: boolean }
export interface Npc extends Ent { anchorYaw: number; label: string }
export interface Crowd extends Ent { route: string; s: number; walkSpeed: number; look: number; wait: number }

const inRect = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

export function heightAt(zones: Zone[], x: number, z: number, curY: number): number | null {
  let best: number | null = null; let bd = Infinity;
  for (const zn of zones) {
    if (!inRect(zn.rect, x, z)) continue; if (zn.exclude?.some(e => inRect(e, x, z))) continue;
    const h = zn.h(x, z); const d = Math.abs(h - curY);
    if (d <= STEP_TOL && d < bd) { bd = d; best = h; }
  }
  return best;
}

export function hitsCollider(cs: Collider[], x: number, z: number, y: number, r: number): Collider | null {
  for (const c of cs) {
    if (!(c.y1 > y + 0.25 && c.y0 < y + 1.7)) continue;
    const cx = Math.max(c.x0, Math.min(x, c.x1)), cz = Math.max(c.z0, Math.min(z, c.z1));
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return c;
  }
  return null;
}

export function canStandAt(d: StationData, x: number, z: number, y: number, r = PLAYER_R, extra: { x: number; z: number; r: number }[] = []): number | null {
  const h = heightAt(d.zones, x, z, y); if (h === null) return null;
  const k = r * 0.85;
  for (const [dx, dz] of [[k, 0], [-k, 0], [0, k], [0, -k]]) { const hh = heightAt(d.zones, x + dx, z + dz, y); if (hh === null || Math.abs(hh - h) > 0.7) return null; }
  if (hitsCollider(d.colliders, x, z, h, r)) return null;
  for (const e of extra) if ((x - e.x) ** 2 + (z - e.z) ** 2 < (r + e.r) ** 2) return null;
  return h;
}

const HIDDEN = new Set(['traveler', 'hinata', 'nomura', 'haha', 'tourist2']);
export class StationSim {
  player: Ent = { id: 'player', x: 0, y: 0, z: -36, yaw: Math.PI, visible: true, speed: 0, walking: false };
  npcs: Record<string, Npc> = {}; crowd: Crowd[] = [];
  walkSpeed = 3.0; runSpeed = 5.0; time = 0;
  constructor(public data: StationData) { this.reset(); }
  /** 初期状態へ戻す（RenderManagerが同一インスタンスを参照し続けられるように作り直しはしない） */
  reset() {
    const data = this.data; this.time = 0; this.npcs = {}; this.crowd = []; Object.assign(this.player, { x: 0, y: 0, z: -36, yaw: Math.PI, speed: 0, walking: false });
    for (const a of Object.values(data.anchors)) if (a.kind === 'npc') this.npcs[a.id] = { id: a.id, x: a.x, y: a.y, z: a.z, yaw: a.yaw, anchorYaw: a.yaw, label: a.label, visible: !HIDDEN.has(a.id), speed: 0, walking: false };
    const routes = Object.keys(data.routes).filter(k => k !== 'paced');
    for (let i = 0; i < 16; i++) this.crowd.push({ id: 'pax' + i, route: routes[i % routes.length], s: i * 9, x: 0, y: 0, z: 0, yaw: 0, visible: false, speed: 0, walking: true, walkSpeed: 1.1 + (i % 3) * 0.2, look: i, wait: 0 });
    for (const c of this.crowd) this.placeCrowd(c, 0);
  }
  spawn(name: string) { const a = this.data.anchors[name]; if (a) { this.player.x = a.x; this.player.y = a.y; this.player.z = a.z; this.player.yaw = a.yaw; } }
  teleport(x: number, y: number, z: number, yaw: number) { Object.assign(this.player, { x, y, z, yaw }); }

  private npcCircles() { return Object.values(this.npcs).filter(n => n.visible).map(n => ({ x: n.x, z: n.z, r: 0.35 })); }

  /** 入力方向(ワールド座標・正規化済み)で歩行。壁沿いに滑る。 */
  move(dirX: number, dirZ: number, dt: number, run = false) {
    const p = this.player; const len = Math.hypot(dirX, dirZ);
    if (len < 0.05) { p.walking = false; p.speed = 0; return; }
    const sp = (run ? this.runSpeed : this.walkSpeed) * Math.min(1, len); const dx = (dirX / len) * sp * dt, dz = (dirZ / len) * sp * dt;
    const others = this.npcCircles(); let moved = false;
    const tryMove = (nx: number, nz: number) => { const h = canStandAt(this.data, nx, nz, p.y, PLAYER_R, others); if (h !== null) { p.x = nx; p.z = nz; p.y += (h - p.y) * Math.min(1, dt * 14); if (Math.abs(h - p.y) < 0.002) p.y = h; return true; } return false; };
    if (tryMove(p.x + dx, p.z + dz)) moved = true; else if (tryMove(p.x + dx, p.z)) moved = true; else if (tryMove(p.x, p.z + dz)) moved = true;
    const targetYaw = Math.atan2(dirX, dirZ); let d = targetYaw - p.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; p.yaw += d * Math.min(1, dt * 12);
    p.walking = moved; p.speed = moved ? sp : 0;
  }
  /** 指定アンカーの近くで立てる地点を探す（テスト・タップ移動用） */
  standNear(id: string, r0 = 0.9): { x: number; y: number; z: number } | null {
    const a = this.data.anchors[id]; if (!a) return null; const n = this.npcs[id]; const ax = n ? n.x : a.x, az = n ? n.z : a.z, ay = n ? n.y : a.y;
    for (let r = r0; r <= a.radius - 0.2; r += 0.15) for (let k = 0; k < 24; k++) { const t = (k / 24) * Math.PI * 2 + a.yaw; const x = ax + Math.sin(t) * r, z = az + Math.cos(t) * r; const h = canStandAt(this.data, x, z, ay, PLAYER_R, this.npcCircles()); if (h !== null) return { x, y: h, z }; }
    return null;
  }
  /** 経路探索（A*）：歩ける地点だけをたどり、壁・階段・扉の開口を通る。直線で行ける区間は間引く */
  findPath(to: { x: number; z: number }, cell = 0.5, maxNodes = 40000): { x: number; z: number }[] | null {
    const p = this.player; const others = this.npcCircles(); const key = (i: number, j: number, l: number) => `${i},${j},${l}`;
    let goalH = null as number | null, best: { x: number; z: number; d: number } | null = null;
    const gi = Math.round(to.x / cell), gj = Math.round(to.z / cell);
    const start = { i: Math.round(p.x / cell), j: Math.round(p.z / cell), y: p.y }; type N = { i: number; j: number; y: number; g: number; f: number; prev?: N };
    const open: N[] = [{ ...start, g: 0, f: Math.hypot(gi - start.i, gj - start.j) }]; const seen = new Map<string, number>(); seen.set(key(start.i, start.j, Math.round(p.y * 4)), 0); let cnt = 0; let found: N | null = null;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (open.length && cnt++ < maxNodes) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (open[k].f < open[bi].f) bi = k; const cur = open.splice(bi, 1)[0];
      if (Math.hypot(cur.i - gi, cur.j - gj) <= 1.5) { found = cur; break; }
      const d0 = Math.hypot(cur.i - gi, cur.j - gj); if (!best || d0 < best.d) best = { x: cur.i * cell, z: cur.j * cell, d: d0 };
      for (const [di, dj] of dirs) { const ni = cur.i + di, nj = cur.j + dj; const h = canStandAt(this.data, ni * cell, nj * cell, cur.y, PLAYER_R, others); if (h === null) continue; if (di !== 0 && dj !== 0 && (canStandAt(this.data, ni * cell, cur.j * cell, cur.y, PLAYER_R, others) === null || canStandAt(this.data, cur.i * cell, nj * cell, cur.y, PLAYER_R, others) === null)) continue; const k = key(ni, nj, Math.round(h * 4)); const g = cur.g + Math.hypot(di, dj) * (Math.abs(h - cur.y) > 0.05 ? 1.3 : 1); if (seen.has(k) && seen.get(k)! <= g) continue; seen.set(k, g); open.push({ i: ni, j: nj, y: h, g, f: g + Math.hypot(ni - gi, nj - gj), prev: cur }); }
    }
    void goalH; if (!found) return null;
    const pts: { x: number; z: number; y: number }[] = []; for (let n: N | undefined = found; n; n = n.prev) pts.push({ x: n.i * cell, z: n.j * cell, y: n.y }); pts.reverse();
    // 視線が通る区間を間引く（高さが変わる所は残す）
    const out: { x: number; z: number }[] = []; let a = 0;
    while (a < pts.length - 1) { let b = pts.length - 1; for (; b > a + 1; b--) { let ok = true; for (let t = 0.1; t < 1; t += 0.1) { const x = pts[a].x + (pts[b].x - pts[a].x) * t, z = pts[a].z + (pts[b].z - pts[a].z) * t, yi = pts[a].y + (pts[b].y - pts[a].y) * t; const h = canStandAt(this.data, x, z, yi, PLAYER_R + 0.05, others); if (h === null || Math.abs(h - yi) > 0.2) { ok = false; break; } } if (ok) break; } out.push({ x: pts[b].x, z: pts[b].z }); a = b; }
    out.push({ x: to.x, z: to.z }); return out;
  }
  settleHeight(dt: number) { const p = this.player; const h = heightAt(this.data.zones, p.x, p.z, p.y); if (h !== null && Math.abs(h - p.y) > 0.001) p.y += (h - p.y) * Math.min(1, dt * 14); }

  nearest(maxDist = 99, filter?: (id: string) => boolean): { id: string; dist: number } | null {
    let best: { id: string; dist: number } | null = null;
    for (const a of Object.values(this.data.anchors)) {
      if (a.id.startsWith('spawn')) continue; if (filter && !filter(a.id)) continue;
      if (a.kind === 'npc' && !this.npcs[a.id]?.visible) continue;
      const ax = a.kind === 'npc' ? this.npcs[a.id].x : a.x, az = a.kind === 'npc' ? this.npcs[a.id].z : a.z; const ay = a.kind === 'npc' ? this.npcs[a.id].y : a.y;
      if (Math.abs(ay - this.player.y) > 2.2) continue;
      const d = Math.hypot(ax - this.player.x, az - this.player.z); if (d <= Math.min(maxDist, a.radius) && (!best || d < best.dist)) best = { id: a.id, dist: d };
    }
    return best;
  }

  private placeCrowd(c: Crowd, dt: number) {
    const r = this.data.routes[c.route]; let total = 0; const segs: number[] = [];
    for (let i = 0; i < r.length - 1; i++) { const l = Math.hypot(r[i + 1][0] - r[i][0], r[i + 1][2] - r[i][2]); segs.push(l); total += l; }
    if (c.wait > 0) { c.wait -= dt; c.visible = false; c.walking = false; return; }
    c.s += c.walkSpeed * dt; if (c.s >= total) { c.s = 0; c.wait = 6 + c.look * 3; c.visible = false; return; }
    let s = c.s; let i = 0; while (i < segs.length - 1 && s > segs[i]) { s -= segs[i]; i++; }
    const t = segs[i] ? s / segs[i] : 0; const a = r[i], b = r[i + 1];
    c.x = a[0] + (b[0] - a[0]) * t; c.z = a[2] + (b[2] - a[2]) * t; c.y = a[1] + (b[1] - a[1]) * t; c.yaw = Math.atan2(b[0] - a[0], b[2] - a[2]); c.visible = c.wait <= 0; c.walking = true;
  }

  update(dt: number) {
    this.time += dt;
    for (const c of this.crowd) this.placeCrowd(c, dt);
    // NPCは近くのプレイヤーに向く（静止）
    for (const n of Object.values(this.npcs)) {
      if (!n.visible) continue; const dx = this.player.x - n.x, dz = this.player.z - n.z; const d = Math.hypot(dx, dz);
      const target = d < 4.5 && Math.abs(this.player.y - n.y) < 2 ? Math.atan2(dx, dz) : n.anchorYaw; let df = target - n.yaw; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; n.yaw += df * Math.min(1, dt * 4);
    }
  }
}
