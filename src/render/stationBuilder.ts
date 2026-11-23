import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createMaterials, canvasTex, labelTexture, type MatDef } from './materials';
import { buildGateLine, buildGuidance, buildVending, buildConcourseExtras, type GateUnit, type DetailCtx } from './stationDetail';

/** ===== 青嶺中央駅（架空）: 橋上駅舎＋島式ホーム1面2線。データ（衝突・歩行面・アンカー）と見た目を同一ビルダーから生成する ===== */
export const D = 6.6;          // 橋上コンコース床高
export const P = 1.65;         // ホーム面高
export const RAIL_TOP = 0.55;  // レール頭頂
export const TRACK_Z = { A: -6.05, B: 6.05 };
export const PLATFORM = { x0: -36, x1: 36, z0: -4.5, z1: 4.5 };

export interface Rect { x0: number; x1: number; z0: number; z1: number }
export interface Collider extends Rect { name: string; y0: number; y1: number }
export interface Zone { name: string; rect: Rect; h: (x: number, z: number) => number; exclude?: Rect[] }
export interface Anchor { id: string; x: number; y: number; z: number; yaw: number; label: string; radius: number; kind: 'npc' | 'object' }
export interface AssetBox { name: string; tag: string; min: [number, number, number]; max: [number, number, number]; support: 'ground' | 'platform' | 'deck' | 'mounted' | 'none'; group?: string }
export interface CamPreset { pos: [number, number, number]; target: [number, number, number]; fov?: number }

export interface StationData {
  root: THREE.Group; colliders: Collider[]; zones: Zone[]; anchors: Record<string, Anchor>; registry: AssetBox[];
  lodObjects: { lod: 1 | 2; obj: THREE.Object3D }[]; presets: Record<string, CamPreset>;
  boards: { departure: THREE.CanvasTexture | null; platformBoards: THREE.CanvasTexture[] };
  placements: { model: string; x: number; y: number; z: number; ry: number; name: string }[];
  dynamic: { cars: THREE.Group[]; lamps: THREE.Object3D[]; sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; sky: THREE.Mesh; gates: GateUnit[] };
  stats: { boxes: number; meshes: number; triangles: number };
  routes: Record<string, [number, number, number][]>;
}

interface BoxOpt { ghost?: boolean; ry?: number; lod?: 0 | 1 | 2; collide?: boolean | [number, number]; support?: AssetBox['support']; tag?: string; group?: string; noShadow?: boolean }

function planarUV(g: THREE.BufferGeometry, tile: number) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny >= nx && ny >= nz) uv.setXY(i, p.getX(i) / tile, p.getZ(i) / tile);
    else if (nx >= nz) uv.setXY(i, p.getZ(i) / tile, p.getY(i) / tile);
    else uv.setXY(i, p.getX(i) / tile, p.getY(i) / tile);
  }
  uv.needsUpdate = true;
}

export function buildStation(quality: 'high' | 'medium' | 'low' = 'high'): StationData {
  const mats = createMaterials(quality === 'low');
  const root = new THREE.Group(); root.name = 'station';
  const colliders: Collider[] = []; const zones: Zone[] = []; const anchors: Record<string, Anchor> = {}; const registry: AssetBox[] = [];
  const lodObjects: StationData['lodObjects'] = [];
  const batches = new Map<string, THREE.BufferGeometry[]>();
  let boxCount = 0;

  const M = (k: string): MatDef => { const m = mats[k]; if (!m) throw new Error('材質なし: ' + k); return m; };
  const push = (k: string, lod: number, g: THREE.BufferGeometry) => { const key = k + '|' + lod; (batches.get(key) ?? batches.set(key, []).get(key)!).push(g); };

  const reg = (name: string, o: BoxOpt, min: [number, number, number], max: [number, number, number]) => { registry.push({ name, tag: o.tag ?? 'prop', min, max, support: o.support ?? 'none', group: o.group }); };

  function box(mat: string, name: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, o: BoxOpt = {}) {
    const g = new THREE.BoxGeometry(sx, sy, sz); const ry = o.ry ?? 0;
    const m4 = new THREE.Matrix4().makeRotationY(ry).setPosition(cx, cy, cz); g.applyMatrix4(m4);
    const md = M(mat); if (md.tile) planarUV(g, md.tile);
    if (!o.ghost) { push(mat, o.lod ?? 0, g); boxCount++; }
    const hx = (Math.abs(Math.cos(ry)) * sx + Math.abs(Math.sin(ry)) * sz) / 2, hz = (Math.abs(Math.sin(ry)) * sx + Math.abs(Math.cos(ry)) * sz) / 2;
    reg(name, o, [cx - hx, cy - sy / 2, cz - hz], [cx + hx, cy + sy / 2, cz + hz]);
    if (o.collide) { const [y0, y1] = Array.isArray(o.collide) ? o.collide : [cy - sy / 2, cy + sy / 2]; colliders.push({ name, x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz, y0, y1 }); }
  }
  function cyl(mat: string, name: string, cx: number, cy: number, cz: number, r: number, h: number, o: BoxOpt = {}, seg = 10) {
    const g = new THREE.CylinderGeometry(r, r, h, seg); g.translate(cx, cy, cz);
    const md = M(mat); if (md.tile) planarUV(g, md.tile);
    push(mat, o.lod ?? 0, g); boxCount++;
    reg(name, o, [cx - r, cy - h / 2, cz - r], [cx + r, cy + h / 2, cz + r]);
    if (o.collide) { const [y0, y1] = Array.isArray(o.collide) ? o.collide : [cy - h / 2, cy + h / 2]; colliders.push({ name, x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r, y0, y1 }); }
  }
  /** 任意回転の直方体（傾斜面・斜め部品用）。衝突は作らず、レジストリには外接AABBを登録する */
  function boxR(mat: string, name: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, o: BoxOpt = {}) {
    const g = new THREE.BoxGeometry(sx, sy, sz); const m4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)).setPosition(cx, cy, cz); g.applyMatrix4(m4);
    const md = M(mat); if (md.tile) planarUV(g, md.tile); push(mat, o.lod ?? 0, g); boxCount++;
    g.computeBoundingBox(); const bb = g.boundingBox!; reg(name, o, [bb.min.x, bb.min.y, bb.min.z], [bb.max.x, bb.max.y, bb.max.z]);
  }
  /** 看板（平面・片面） */
  const loose: THREE.Object3D[] = [];
  function sign(tex: THREE.Texture | null, name: string, cx: number, cy: number, cz: number, w: number, h: number, yaw: number, fallback = '#2a5caa') {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex ?? undefined, color: tex ? '#ffffff' : fallback, roughness: 0.6, emissive: tex ? '#222222' : '#000000', emissiveMap: tex ?? undefined, emissiveIntensity: 0.5 }));
    m.position.set(cx, cy, cz); m.rotation.y = yaw; m.name = name; root.add(m); loose.push(m);
    reg(name, { tag: 'sign', support: 'mounted' }, [cx - w / 2, cy - h / 2, cz - w / 2], [cx + w / 2, cy + h / 2, cz + w / 2]);
    return m;
  }
  /** x方向に伸びる壁（z固定）。gaps は x区間 */
  function wallX(mat: string, name: string, z: number, x0: number, x1: number, y0: number, h: number, t: number, gaps: [number, number][] = [], collide = true, o: BoxOpt = {}) {
    const pts = [x0, ...gaps.flatMap(g => g), x1]; for (let i = 0; i < pts.length; i += 2) { const a = pts[i], b = pts[i + 1]; if (b - a > 0.01) box(mat, name, (a + b) / 2, y0 + h / 2, z, b - a, h, t, { collide: collide ? [y0, y0 + h] : false, tag: 'wall', support: 'deck', ...o }); }
  }
  function wallZ(mat: string, name: string, x: number, z0: number, z1: number, y0: number, h: number, t: number, gaps: [number, number][] = [], collide = true, o: BoxOpt = {}) {
    const pts = [z0, ...gaps.flatMap(g => g), z1]; for (let i = 0; i < pts.length; i += 2) { const a = pts[i], b = pts[i + 1]; if (b - a > 0.01) box(mat, name, x, y0 + h / 2, (a + b) / 2, t, h, b - a, { collide: collide ? [y0, y0 + h] : false, tag: 'wall', support: 'deck', ...o }); }
  }
  /** ガラスカーテンウォール（腰壁＋ガラス＋方立） */
  function curtainX(name: string, z: number, x0: number, x1: number, gaps: [number, number][]) {
    wallX('wall', name + '腰壁', z, x0, x1, D, 1.0, 0.25, gaps, true, { support: 'deck' });
    const pts = [x0, ...gaps.flatMap(g => g), x1];
    for (let i = 0; i < pts.length; i += 2) { const a = pts[i], b = pts[i + 1]; if (b - a > 0.01) { box('glass', name + 'ガラス', (a + b) / 2, D + 1.0 + 1.55, z, b - a, 3.1, 0.06, { tag: 'glass', support: 'none', noShadow: true }); for (let x = a; x <= b + 0.01; x += 2.5) box('trim', name + '方立', x, D + 2.55, z, 0.1, 4.1, 0.16, { lod: 1, tag: 'mullion', support: 'none' }); } }
    box('trim', name + '無目', (x0 + x1) / 2, D + 4.1, z, x1 - x0, 0.15, 0.2, { tag: 'trim', support: 'none' });
  }
  function curtainZ(name: string, x: number, z0: number, z1: number, gaps: [number, number][]) {
    wallZ('wall', name + '腰壁', x, z0, z1, D, 1.0, 0.25, gaps, true, { support: 'deck' });
    const pts = [z0, ...gaps.flatMap(g => g), z1];
    for (let i = 0; i < pts.length; i += 2) { const a = pts[i], b = pts[i + 1]; if (b - a > 0.01) { box('glass', name + 'ガラス', x, D + 2.55, (a + b) / 2, 0.06, 3.1, b - a, { tag: 'glass', support: 'none', noShadow: true }); for (let z = a; z <= b + 0.01; z += 2.5) box('trim', name + '方立', x, D + 2.55, z, 0.16, 4.1, 0.1, { lod: 1, tag: 'mullion', support: 'none' }); } }
    box('trim', name + '無目', x, D + 4.1, (z0 + z1) / 2, 0.2, 0.15, z1 - z0, { tag: 'trim', support: 'none' });
  }

  // ======= 地面 =======
  box('grass', '地面（草地）', 0, -0.52, 0, 260, 1, 260, { tag: 'terrain', support: 'ground' });
  box('paving', '駅前広場', 0, -0.25, -29, 140, 0.5, 34, { tag: 'terrain', support: 'ground' });
  box('asphalt', '道路', 0, -0.25, -52, 140, 0.5, 14, { tag: 'terrain', support: 'ground' });
  box('concrete', '構内外周（保線用地）', 0, -0.25, -10.5, 200, 0.5, 3.4, { tag: 'terrain', support: 'ground' });
  box('concrete', '構内外周（南）', 0, -0.25, 10.5, 200, 0.5, 3.4, { tag: 'terrain', support: 'ground' });
  box('white', '道路中央線', 0, 0.006, -52, 140, 0.01, 0.15, { lod: 1, tag: 'marking', support: 'ground' });
  for (let i = -3; i <= 3; i++) box('white', '横断歩道', i * 1.1 + 12, 0.007, -52, 0.6, 0.01, 12, { lod: 1, tag: 'marking', support: 'ground' });

  // ======= 線路（2線） =======
  const sleeperGeo = new THREE.BoxGeometry(0.26, 0.12, 2.5); const sleeperMat = M('sleeper').mat;
  const sleepers: THREE.InstancedMesh[] = [];
  for (const [k, cz] of Object.entries(TRACK_Z)) {
    box('ballast', `道床 ${k}線`, 0, 0.14, cz, 200, 0.28, 4.6, { tag: 'track', support: 'ground' });
    const count = Math.floor(200 / 0.62); const im = new THREE.InstancedMesh(sleeperGeo, sleeperMat, count); const m4 = new THREE.Matrix4();
    for (let i = 0; i < count; i++) { m4.setPosition(-100 + i * 0.62, 0.34, cz); im.setMatrixAt(i, m4); }
    im.receiveShadow = true; im.name = `枕木 ${k}`; root.add(im); sleepers.push(im); lodObjects.push({ lod: 2, obj: im });
    for (const s of [-1, 1]) box('rail', `レール ${k}線`, 0, 0.475, cz + s * 0.5335, 200, 0.15, 0.07, { tag: 'rail', support: 'none' });
    for (const s of [-1, 1]) box('steelDark', `レール底部 ${k}線`, 0, 0.405, cz + s * 0.5335, 200, 0.02, 0.14, { lod: 1, tag: 'rail', support: 'none' });
  }
  // ======= ホーム =======
  const pw = PLATFORM; const pwx = pw.x1 - pw.x0, pwz = pw.z1 - pw.z0;
  box('platform', 'ホーム本体', 0, P / 2, 0, pwx, P, pwz, { tag: 'platform', support: 'ground' });
  box('concrete', 'ホーム縁石（北）', 0, P - 0.12, pw.z0 + 0.05, pwx, 0.24, 0.1, { lod: 1, tag: 'trim', support: 'platform' });
  for (const s of [-1, 1]) {
    box('tactile', '内方線付き点状ブロック', 0, P + 0.007, s * 4.0, pwx, 0.014, 0.8, { tag: 'tactile', support: 'platform' });
    box('white', '内方線', 0, P + 0.012, s * 3.55, pwx, 0.01, 0.06, { lod: 1, tag: 'marking', support: 'platform' });
  }
  // 乗車位置（床サイン）
  for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) box('blue', '乗車位置サイン', i * 4.4 + 0.0, P + 0.01, s * 3.15, 0.7, 0.01, 0.3, { lod: 2, tag: 'marking', support: 'platform' });
  zones.push({ name: 'ホーム', rect: { x0: pw.x0, x1: pw.x1, z0: -3.45, z1: 3.45 }, h: () => P, exclude: [{ x0: -25.2, x1: -13.8, z0: -1.4, z1: 1.4 }, { x0: 13.8, x1: 25.2, z0: -1.4, z1: 1.4 }] });
  // ホーム端フェンス
  for (const s of [-1, 1]) box('steel', 'ホーム端フェンス', s * 36.1, P + 0.6, 0, 0.1, 1.2, 9, { collide: [P, P + 1.2], tag: 'fence', support: 'platform' });

  // ======= 橋上駅舎 =======
  box('concrete', 'コンコース床スラブ', 0, D - 0.21, 0, 28, 0.38, 24, { tag: 'slab', support: 'none' });
  box('tile', 'コンコース床仕上げ', 0, D - 0.01, 0, 28, 0.02, 24, { tag: 'floor', support: 'none' });
  for (const z of [-11, -3, 3, 11]) box('steel', '大梁', 0, D - 0.75, z, 28, 0.7, 0.3, { lod: 1, tag: 'girder', support: 'none' });
  for (const [cx, cz, base] of [[-13.4, -11.3, 0], [13.4, -11.3, 0], [-13.4, 11.3, 0], [13.4, 11.3, 0], [-13.4, -3.2, P], [13.4, -3.2, P], [-13.4, 3.2, P], [13.4, 3.2, P]] as [number, number, number][]) {
    box('concrete', '橋上駅舎の柱', cx, (base + D - 0.4) / 2, cz, 0.7, D - 0.4 - base, 0.7, { collide: [base, D - 0.4], tag: 'column', support: base ? 'platform' : 'ground' });
  }
  // 壁・ガラス
  curtainX('北面', -12.1, -14, 14, [[-2.6, 2.6]]);
  curtainX('南面', 12.1, -14, 14, []);
  curtainZ('西面', -14, -12.1, 12.1, [[-1.4, 1.4]]);
  curtainZ('東面', 14, -12.1, 12.1, [[-1.4, 1.4]]);
  // 屋根
  box('roof', '駅舎屋根', 0, D + 4.5, 0, 31, 0.3, 28, { tag: 'roof', support: 'none' });
  box('trim', '屋根ファシア（北）', 0, D + 4.3, -14.0, 31, 0.8, 0.18, { tag: 'trim', support: 'none' });
  box('trim', '屋根ファシア（南）', 0, D + 4.3, 14.0, 31, 0.8, 0.18, { lod: 1, tag: 'trim', support: 'none' });
  for (const x of [-4.5, -1.5, 1.5, 4.5]) for (const z of [-8, 0, 8]) box('emissiveWhite', '天井灯', x, D + 4.25, z, 1.8, 0.06, 0.25, { lod: 1, tag: 'light', support: 'none' });
  const nameTex = labelTexture('青嶺中央駅', 'Aorei-Chūō  JR-A07', 640, 160, '#14325c');
  sign(nameTex, '駅名看板', 0, D + 4.3, -14.12, 7.2, 0.72, Math.PI);

  // 北側 入口階段（駅前広場 → コンコース）
  const entry = { x0: -2.4, x1: 2.4, z0: -26, z1: -12.0 };
  const nEntry = 44;
  for (let i = 0; i < nEntry; i++) { const z = entry.z0 + (i + 0.5) * (entry.z1 - entry.z0) / nEntry; const top = (i + 1) * D / nEntry; box('concrete', '入口階段', 0, top / 2, z, 4.8, top, (entry.z1 - entry.z0) / nEntry + 0.01, { tag: 'stairs', support: 'ground', lod: 0 }); }
  for (const s of [-1, 1]) {
    box('steel', '階段手すり', s * 2.45, 0, -19, 0.06, 0.05, 1, { lod: 2, tag: 'rail', support: 'mounted' });
    const len = Math.hypot(entry.z1 - entry.z0, D); const ang = Math.atan2(D, entry.z1 - entry.z0);
    const g = new THREE.BoxGeometry(0.06, 0.06, len); g.rotateX(-ang); g.translate(s * 2.45, D / 2 + 0.95, (entry.z0 + entry.z1) / 2); push('steel', 1, g);
    for (let k = 0; k <= 6; k++) { const t = k / 6; box('steel', '階段手すり支柱', s * 2.45, t * D + 0.45, entry.z0 + t * (entry.z1 - entry.z0), 0.05, 0.9, 0.05, { lod: 1, tag: 'rail', support: 'mounted' }); }
  }
  zones.push({ name: '入口階段', rect: entry, h: (_x, z) => Math.max(0, Math.min(D, (z - entry.z0) / (entry.z1 - entry.z0) * D)) });
  zones.push({ name: '駅前広場', rect: { x0: -66, x1: 66, z0: -46, z1: -12.4 }, h: () => 0, exclude: [{ x0: -2.5, x1: 2.5, z0: -26.0, z1: -11.9 }] });
  zones.push({ name: 'コンコース', rect: { x0: -14, x1: 14, z0: -12, z1: 12 }, h: () => D });
  // ホーム階段（東西）
  const stairLen = 11.2;
  for (const s of [-1, 1]) {
    const xa = s * 14, xb = s * (14 + stairLen);
    const n = 38; for (let i = 0; i < n; i++) { const t0 = i / n, xm = xa + (xb - xa) * (t0 + 0.5 / n); const top = D - (D - P) * (t0 + 0.5 / n); box('concrete', 'ホーム階段', xm, (P + top) / 2, 0, stairLen / n + 0.01, top - P, 2.8, { tag: 'stairs', support: 'platform', lod: 0 }); }
    for (const zz of [-1.35, 1.35]) { const len = Math.hypot(stairLen, D - P); const ang = Math.atan2(D - P, stairLen) * s; const g = new THREE.BoxGeometry(len, 0.06, 0.06); g.rotateZ(-ang); g.translate((xa + xb) / 2, (D + P) / 2 + 0.95, zz); push('steel', 1, g); }
    zones.push({ name: s < 0 ? '西ホーム階段' : '東ホーム階段', rect: { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: -1.2, z1: 1.2 }, h: (x) => { const t = Math.abs(x - xa) / stairLen; return D - (D - P) * Math.max(0, Math.min(1, t)); } });
    sign(labelTexture('1・2番線 ↓', 'Platforms 1-2', 512, 128, '#1f6f4a'), '階段案内サイン', s * 13.86, D + 3.1, 0, 2.4, 0.6, -s * Math.PI / 2);
  }
  // ホーム屋根（上屋）
  for (const s of [-1, 1]) {
    const cx = s * 31, w = 11;
    box('roof', 'ホーム上屋', cx, 5.3, 0, w, 0.18, 9.4, { tag: 'roof', support: 'none' });
    box('trim', '上屋縁', cx, 5.12, 0, w, 0.25, 9.5, { lod: 1, tag: 'trim', support: 'none' });
    for (const dx of [-4.5, 0, 4.5]) box('steel', 'ホーム上屋柱', cx + dx, (P + 5.2) / 2, 0, 0.32, 5.2 - P, 0.32, { collide: [P, 5.2], tag: 'column', support: 'platform' });
  }

  // ======= 駅事務室 =======
  const oz0 = -12, oz1 = -1;
  wallZ('wall', '事務室壁（西）', 7, oz0, oz1, D, 3.6, 0.2, [[-11, -8.2]], true, { support: 'deck' });
  wallX('wall', '事務室壁（南）', oz1, 7, 14, D, 3.6, 0.2, [[8.0, 9.2]], true, { support: 'deck' });
  box('glass', '窓口ガラス', 7, D + 1.6, -9.6, 0.05, 1.2, 2.8, { tag: 'glass', noShadow: true });
  box('woodMat', 'きっぷうりば カウンター', 6.6, D + 0.5, -9.6, 0.7, 1.0, 3.2, { collide: true, tag: 'counter', support: 'deck' });
  sign(labelTexture('きっぷうりば', 'Ticket Office', 512, 128, '#1f6f4a'), 'きっぷうりば看板', 6.9, D + 3.0, -9.6, 2.6, 0.65, -Math.PI / 2);
  box('woodMat', '事務机（手前）', 11.3, D + 0.38, -4.6, 1.7, 0.76, 0.8, { collide: true, tag: 'desk', support: 'deck', group: 'desk1' });
  box('woodMat', '事務机（奥）', 11.3, D + 0.38, -7.6, 1.7, 0.76, 0.8, { collide: true, tag: 'desk', support: 'deck', group: 'desk2' });
  for (const z of [-4.6, -7.6]) { box('steelDark', '事務椅子', 10.2, D + 0.28, z, 0.5, 0.56, 0.5, { tag: 'chair', support: 'deck' }); box('steelDark', '椅子背', 9.95, D + 0.8, z, 0.08, 0.5, 0.5, { tag: 'chair', support: 'none' }); }
  const termScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), M('screen').mat); termScreen.position.set(11.9, D + 1.08, -7.62); termScreen.rotation.y = -Math.PI / 2; root.add(termScreen);
  box('steelDark', '業務端末（本体）', 11.95, D + 0.96, -7.6, 0.06, 0.4, 0.58, { tag: 'terminal', support: 'none', group: 'desk2' }); box('steelDark', '端末スタンド', 11.95, D + 0.8, -7.6, 0.1, 0.08, 0.2, { tag: 'terminal', support: 'none', group: 'desk2' }); box('ticket', 'キーボード', 11.5, D + 0.775, -7.6, 0.2, 0.03, 0.46, { lod: 1, tag: 'prop', support: 'none' });
  box('white', '勤務表ホワイトボード', 7.14, D + 1.75, -5.0, 0.04, 1.2, 2.2, { tag: 'board', support: 'mounted' });
  sign(canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#fafaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2a44'; g.font = 'bold 30px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.fillText('4月 勤務表（新人）', 20, 40); g.font = '22px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; ['4/2(金) 日勤 8:30-17:15  指導:久保田', '4/3(土) 公休', '4/5(月)〜 日勤 ／ 4/8(木) 研修', '4/15(木) 早番 5:30-14:15'].forEach((t, i) => g.fillText(t, 20, 88 + i * 36)); g.strokeStyle = '#b33'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12); }, { repeat: false }), '勤務表（掲示）', 7.18, D + 1.75, -5.0, 2.1, 1.05, Math.PI / 2);
  box('steel', '書類棚', 11.0, D + 0.95, -11.6, 2.2, 1.9, 0.5, { collide: true, tag: 'shelf', support: 'deck' });
  box('white', '遺失物保管ケース', 9.0, D + 0.4, -11.5, 0.9, 0.8, 0.5, { collide: true, tag: 'case', support: 'deck' });
  box('steelDark', '放送卓', 13.3, D + 0.45, -10.5, 0.8, 0.9, 1.4, { collide: true, tag: 'desk', support: 'deck' });
  box('steelDark', '放送マイク', 13.1, D + 1.0, -10.5, 0.1, 0.22, 0.1, { tag: 'prop', support: 'none' });
  box('white', '事務室 天井灯', 10.5, D + 3.5, -6.5, 3, 0.05, 0.3, { lod: 1, tag: 'light', support: 'none' });
  box('wall', '事務室 床（絨毯）', 10.5, D + 0.006, -6.5, 6.8, 0.012, 10.8, { tag: 'floor', support: 'deck' });
  box('wall', '窓口上部壁', 7, D + 2.9, -9.6, 0.2, 1.4, 2.8, { tag: 'wall', support: 'none' });

  // ======= 券売機・運賃表 =======
  /* 券売機は stationDetail.buildVending で細部まで作成 */
  sign(canvasTex(640, 256, (g, w, h) => { g.fillStyle = '#f5f3ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#14325c'; g.font = 'bold 34px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.fillText('路線図・運賃表', 20, 48); g.strokeStyle = '#2b6b50'; g.lineWidth = 8; g.beginPath(); g.moveTo(60, 160); g.lineTo(580, 160); g.stroke(); ['海浜口', '青嶺中央', '翠川', '星峰', '空港'].forEach((n, i) => { const x = 80 + i * 120; g.fillStyle = i === 1 ? '#c0302b' : '#fff'; g.beginPath(); g.arc(x, 160, 12, 0, 7); g.fill(); g.strokeStyle = '#2b6b50'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#222'; g.font = '22px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.fillText(n, x - 28, 205); }); g.fillStyle = '#a04'; g.font = '20px sans-serif'; g.fillText('※架空の路線図', 440, 40); }, { repeat: false }), '路線図・運賃表', -13.88, D + 2.8, -8.5, 4.4, 1.5, Math.PI / 2);
  // 自動販売機・ベンチ・AED
  [2.6, 4.0].forEach((z, i) => box(i ? 'vendBlue' : 'vendRed', '自動販売機', -13.4, D + 0.9, z, 0.8, 1.8, 1.1, { collide: true, tag: 'vending', support: 'deck', group: 'vm' + i }));
  for (const [x, z] of [[-6, 8], [-2, 8], [3, 8]] as [number, number][]) { box('woodMat', 'コンコースベンチ', x, D + 0.42, z, 2.0, 0.08, 0.5, { collide: [D, D + 0.5], tag: 'bench', support: 'none', group: `cb${x}` }); for (const dx of [-0.85, 0.85]) box('steelDark', 'ベンチ脚', x + dx, D + 0.2, z, 0.06, 0.4, 0.4, { tag: 'bench', support: 'deck', group: `cb${x}` }); }
  box('green', 'AED収納箱', -13.78, D + 1.4, 6.5, 0.2, 0.5, 0.4, { tag: 'aed', support: 'mounted' });
  box('white', 'AED白十字', -13.67, D + 1.4, 6.5, 0.02, 0.28, 0.08, { lod: 1, tag: 'aed', support: 'mounted' });
  // 案内サイン
  sign(labelTexture('改札口', 'Ticket Gates', 384, 110, '#1d2a44'), '改札口サイン', 0, D + 3.4, -4.2, 2.6, 0.75, Math.PI);
  sign(labelTexture('エレベーター ↑', '', 384, 110, '#1f6f4a'), 'エレベーターサイン', 4.2, D + 3.2, -11.95, 2.4, 0.7, 0);

  // ======= 改札まわり・券売機・精算機・誘導ブロックなど（stationDetail） =======
  const gates: GateUnit[] = []; const placements: StationData['placements'] = [];
  const dctx: DetailCtx = { D, root, gates, place: (model, x, y, z, ry, name) => placements.push({ model, x, y, z, ry, name }), box, boxR, cyl, sign, mat: k => M(k).mat, tex: (w, h, d) => canvasTex(w, h, d, { repeat: false }), label: (t, sub, w, h, bg, fg) => labelTexture(t, sub, w, h, bg, fg) };
  buildGateLine(dctx); buildVending(dctx); buildGuidance(dctx); buildConcourseExtras(dctx);
  sign(canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#fafaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#14325c'; g.font = 'bold 28px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.fillText('時刻表（平日）', 16, 38); g.font = '20px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.fillText('1番線 方面 海浜口', 16, 72); g.fillText('2番線 方面 空港連絡', 270, 72); ['8 41 53', '9 05 17 29 41 53', '10 05 17 29 41 53', '11 05 17 29 41 53'].forEach((t, i) => { g.fillText(t, 16, 110 + i * 32); g.fillText(['8 36 48', '9 00 12 24 36 48', '10 00 12 24 36 48', '11 00 12 24 36 48'][i], 270, 110 + i * 32); }); g.fillStyle = '#b33'; g.font = '18px sans-serif'; g.fillText('※旧版（改正前）', 340, 240); }, { repeat: false }), '時刻表掲示', 6.88, D + 1.75, -2.6, 1.6, 0.8, -Math.PI / 2);

  // ======= 発車標（コンコース／ホーム） =======
  const mkBoard = () => canvasTex(768, 192, (g, w, h) => { g.fillStyle = '#050505'; g.fillRect(0, 0, w, h); }, { repeat: false });
  const depTex = mkBoard(); const platBoards = [mkBoard(), mkBoard()].filter(Boolean) as THREE.CanvasTexture[];
  const boardMat = (t: THREE.Texture | null) => new THREE.MeshBasicMaterial({ map: t ?? undefined, color: t ? '#ffffff' : '#222' });
  const dep = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), boardMat(depTex)); dep.position.set(0, D + 3.0, -2.78); dep.rotation.y = Math.PI; dep.name = '発車標（コンコース）'; root.add(dep);
  box('steelDark', '発車標筐体', 0, D + 3.0, -2.72, 4.35, 1.2, 0.12, { tag: 'board', support: 'mounted' });
  for (const x of [-1.8, 1.8]) box('steelDark', '発車標吊り棒', x, D + 3.9, -2.72, 0.05, 1.2, 0.05, { lod: 1, tag: 'board', support: 'mounted' });
  [-1, 1].forEach((s, i) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), boardMat(platBoards[i] ?? null)); p.position.set(s * 28, 4.0, 0); p.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; p.position.x += s > 0 ? -0.5 : 0.5; root.add(p); box('steelDark', 'ホーム発車標筐体', s * 28.0 + (s > 0 ? -0.1 : 0.1), 4.0, 0, 0.1, 0.75, 2.75, { tag: 'board', support: 'mounted' }); box('steel', 'ホーム発車標吊り', s * 28.0, 4.6, 0, 0.05, 1.0, 0.05, { lod: 1, tag: 'board', support: 'mounted' }); });

  // ======= ホーム設備 =======
  const names = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b6f45'; g.fillRect(0, 0, w, 26); g.fillStyle = '#111'; g.font = 'bold 66px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.textAlign = 'center'; g.fillText('青嶺中央', w / 2, 100); g.font = '24px sans-serif'; g.fillText('Aorei-Chūō   A07', w / 2, 142); g.font = '22px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; g.textAlign = 'left'; g.fillText('← 海浜口', 10, 22); g.textAlign = 'right'; g.fillText('翠川 →', w - 10, 22); g.strokeStyle = '#1b6f45'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); }, { repeat: false });
  for (const x of [-20, 0, 20]) for (const s of [-1, 1]) { const px = x + (s > 0 ? 3 : -3); box('steel', '駅名標ポール', px, P + 1.2, s * 2.6, 0.08, 2.4, 0.08, { tag: 'pole', support: 'platform', collide: [P, P + 2.4], group: `ek${px}${s}` }); box('white', '駅名標', px, P + 2.15, s * 2.6, 1.6, 0.5, 0.05, { tag: 'sign', support: 'none', group: `ek${px}${s}` }); sign(names, '駅名標（面）', px, P + 2.15, s * 2.6 + 0.03, 1.55, 0.48, 0); sign(names, '駅名標（裏）', px, P + 2.15, s * 2.6 - 0.03, 1.55, 0.48, Math.PI); }
  for (const x of [-22, 22]) for (const s of [-1, 1]) { box('red', '列車非常停止ボタン', x, P + 1.25, s * 3.2, 0.2, 0.3, 0.14, { tag: 'emergency', support: 'none', group: `em${x}${s}` }); box('steel', '非常停止ボタン柱', x, P + 0.6, s * 3.2, 0.07, 1.2, 0.07, { collide: [P, P + 1.2], tag: 'pole', support: 'platform', group: `em${x}${s}` }); }
  [[-8, 2.6], [-5, 2.6], [9.0, 2.6], [12, 2.6], [-8, -2.6], [9, -2.6], [28, 2.6], [-28, -2.6]].forEach(([x, z], i) => { box('woodMat', 'ホームベンチ', x, P + 0.44, z, 1.8, 0.07, 0.48, { collide: [P, P + 0.52], tag: 'bench', support: 'none', group: `pb${i}` }); for (const dx of [-0.75, 0.75]) box('steelDark', 'ベンチ脚', x + dx, P + 0.21, z, 0.06, 0.42, 0.4, { tag: 'bench', support: 'platform', group: `pb${i}` }); box('steelDark', 'ベンチ背', x, P + 0.72, z + (z > 0 ? 0.22 : -0.22), 1.8, 0.4, 0.04, { lod: 1, tag: 'bench', support: 'none', group: `pb${i}` }); });
  box('blue', '傘（忘れ物）', 9.2, P + 0.55, 2.6, 0.72, 0.04, 0.05, { ry: 0.25, tag: 'lostitem', support: 'none' }); box('red', '傘の持ち手', 9.55, P + 0.55, 2.52, 0.14, 0.04, 0.05, { ry: 0.25, tag: 'lostitem', support: 'none' });
  for (const x of [-30, -16, -4, 4, 16, 30]) for (const s of [-1, 1]) { cyl('steel', 'ホーム照明柱', x, (P + 4.2) / 2, s * 3.1, 0.06, 4.2 - P, { collide: [P, 4.2], lod: 1, tag: 'pole', support: 'platform', group: `lp${x}${s}` }); box('emissiveWhite', 'ホーム照明', x, 4.25, s * 3.1, 0.9, 0.08, 0.25, { lod: 1, tag: 'light', support: 'mounted', group: `lp${x}${s}` }); }
  // 時計
  const clock = canvasTex(128, 128, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 5; g.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); g.lineTo(64 + Math.sin(a) * 58, 64 - Math.cos(a) * 58); g.stroke(); } g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.moveTo(64, 64); g.lineTo(90, 64); g.stroke(); }, { repeat: false });
  sign(clock, 'ホーム時計', 0, D - 1.1, 4.45, 0.7, 0.7, Math.PI);

  // ======= 架線・信号 =======
  const wireGeo: number[] = []; const w = (a: number[], b: number[]) => wireGeo.push(...a, ...b);
  for (const cz of [TRACK_Z.A, TRACK_Z.B]) { w([-100, 5.15, cz], [100, 5.15, cz]); w([-100, 5.65, cz], [100, 5.65, cz]); for (let x = -100; x <= 100; x += 6) w([x, 5.15, cz], [x, 5.65, cz]); }
  const wires = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wireGeo, 3)), new THREE.LineBasicMaterial({ color: '#2a2a2a' })); wires.name = '架線'; root.add(wires); lodObjects.push({ lod: 2, obj: wires });
  for (let x = -90; x <= 90; x += 30) { if (Math.abs(x) < 20) continue; for (const [pz, cz] of [[-9.6, TRACK_Z.A], [9.6, TRACK_Z.B]] as [number, number][]) { box('steel', '電柱（架線柱）', x, 3.5, pz, 0.34, 7, 0.34, { collide: [0, 7], lod: 0, tag: 'pole', support: 'ground', group: `cp${x}${pz}` }); box('steel', '架線ビーム', x, 5.9, (pz + cz) / 2, 0.14, 0.14, Math.abs(pz - cz), { lod: 1, tag: 'pole', support: 'mounted', group: `cp${x}${pz}` }); } }
  for (const [x, z, st] of [[-44, -8.8, 1], [44, 8.8, -1]] as [number, number, number][]) { box('steel', '信号機柱', x, 2.2, z, 0.18, 4.4, 0.18, { collide: [0, 4.4], tag: 'pole', support: 'ground', lod: 1, group: `sg${x}` }); box('steelDark', '信号機', x, 4.2, z + (z < 0 ? 0.25 : -0.25), 0.35, 1.1, 0.25, { tag: 'signal', support: 'mounted', lod: 1, group: `sg${x}` }); box('green', '信号灯（進行）', x, 4.5, z + (z < 0 ? 0.4 : -0.4), 0.22, 0.22, 0.04, { tag: 'signal', support: 'mounted', lod: 1, group: `sg${x}` }); void st; }
  box('white', 'キロポスト（12k300）', -40, 0.6, -8.4, 0.3, 1.2, 0.06, { lod: 1, tag: 'post', support: 'ground' }); box('steel', '速度制限標識の柱', 46, 0.7, -8.4, 0.06, 1.4, 0.06, { lod: 1, tag: 'post', support: 'ground', group: 'spd' }); box('white', '速度制限標識', 46, 1.55, -8.4, 0.5, 0.5, 0.06, { lod: 1, tag: 'post', support: 'none', group: 'spd' });

  // ======= 駅前広場 =======
  const trees: [number, number][] = [[-30, -20], [-24, -18], [-36, -26], [30, -20], [24, -24], [40, -16], [-44, -16], [46, -30], [-18, -34], [18, -36], [-50, -34], [52, -22]];
  trees.forEach(([x, z], i) => { cyl('trunk', '街路樹の幹', x, 1.3, z, 0.17, 2.6, { collide: true, lod: 0, tag: 'tree', support: 'ground', group: `tr${i}` }, 8); const g = new THREE.SphereGeometry(1.9, 9, 6); g.translate(x, 3.8, z); push(i % 2 ? 'leaf' : 'leafLight', 0, g); reg('街路樹の葉', { tag: 'tree', support: 'none', group: `tr${i}` }, [x - 1.9, 1.9, z - 1.9], [x + 1.9, 5.7, z + 1.9]); });
  for (const x of [-22, -10, 10, 22, 36, -36]) { cyl('steel', '街路灯', x, 3.1, -16.5, 0.07, 6.2, { collide: true, lod: 1, tag: 'pole', support: 'ground', group: `sl${x}` }); box('emissiveWhite', '街路灯ランプ', x, 6.1, -16.5, 0.7, 0.08, 0.25, { lod: 1, tag: 'light', support: 'mounted', group: `sl${x}` }); }
  box('trim', 'バス停の屋根', -26, 2.6, -40.5, 6, 0.12, 2.2, { tag: 'shelter', support: 'none' }); for (const dx of [-2.8, 2.8]) box('steel', 'バス停の柱', -26 + dx, 1.3, -40.5, 0.1, 2.6, 0.1, { collide: true, tag: 'shelter', support: 'ground', group: 'bs' }); box('glass', 'バス停ガラス', -26, 1.4, -41.5, 5.6, 2.2, 0.05, { tag: 'glass', noShadow: true }); box('woodMat', 'バス停ベンチ', -26, 0.45, -41.0, 2.4, 0.08, 0.5, { tag: 'bench', support: 'none', group: 'bsb' }); for (const dx of [-1.0, 1.0]) box('steelDark', 'バス停ベンチ脚', -26 + dx, 0.2, -41.0, 0.06, 0.4, 0.4, { tag: 'bench', support: 'ground', group: 'bsb' });
  sign(labelTexture('バスのりば', 'Bus Stop', 320, 100, '#2b5fa8'), 'バス停サイン', -26, 3.2, -40.4, 2.2, 0.7, Math.PI);
  sign(labelTexture('タクシー', 'Taxi', 256, 100, '#e0a010', '#111'), 'タクシーサイン', 28, 2.6, -36, 1.6, 0.6, Math.PI);
  cyl('steel', 'タクシー乗り場ポール', 28, 1.3, -36, 0.05, 2.6, { collide: true, lod: 1, tag: 'pole', support: 'ground' });
  [[-10, -24], [10, -24], [-6, -40], [6, -40]].forEach(([x, z], i) => { box('concrete', '植栽枡', x, 0.3, z, 2.4, 0.6, 1.0, { collide: true, tag: 'planter', support: 'ground', group: `pl${i}` }); box('leaf', '植栽', x, 0.8, z, 2.1, 0.5, 0.8, { tag: 'planter', support: 'none', group: `pl${i}` }); });
  for (const [bx, gi] of [[12, 'plb1'], [-12, 'plb2']] as [number, string][]) { box('woodMat', '広場ベンチ', bx, 0.45, -30, 1.8, 0.08, 0.5, { collide: [0, 0.6], tag: 'bench', support: 'none', group: gi }); for (const dx of [-0.75, 0.75]) box('steelDark', '広場ベンチ脚', bx + dx, 0.2, -30, 0.06, 0.4, 0.4, { tag: 'bench', support: 'ground', group: gi }); }
  // エレベーター棟（バリアフリー）
  box('glass', 'エレベーター棟ガラス', 6.0, D / 2 + 0.2, -14.0, 2.6, D + 0.4, 2.4, { collide: [0, D + 0.7], tag: 'elevator', support: 'ground', group: 'elev' }); for (const [dx, dz] of [[-1.3, -1.2], [1.3, -1.2], [-1.3, 1.2], [1.3, 1.2]]) box('steel', 'エレベーター棟フレーム', 6.0 + dx, D / 2 + 0.2, -14.0 + dz, 0.12, D + 0.4, 0.12, { tag: 'elevator', support: 'ground', group: 'elev' }); box('steel', 'エレベーター棟屋根', 6.0, D + 0.55, -14.0, 2.8, 0.12, 2.6, { tag: 'elevator', support: 'none', group: 'elev' }); box('steelDark', 'エレベーターかご', 6.0, 1.0, -14.4, 1.4, 2.0, 1.2, { tag: 'elevator', support: 'ground', group: 'elev' });

  // ======= 遠景：街並み・山 =======
  let seed = 7; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 34; i++) { const side = i % 2 ? 1 : -1; const bx = -90 + R() * 180, bz = -75 - R() * 50; const w = 8 + R() * 14, h = 8 + R() * 28, d = 8 + R() * 10; box(['bldgA', 'bldgB', 'bldgC'][i % 3], '遠景ビル', bx, h / 2, bz, w, h, d, { lod: 1, tag: 'backdrop', support: 'ground', group: `bd${i}` }); void side; }
  for (let i = 0; i < 24; i++) { const bx = -100 + R() * 200, bz = 30 + R() * 40; const w = 6 + R() * 6, h = 4 + R() * 6, d = 6 + R() * 5; box(['bldgC', 'bldgA'][i % 2], '郊外住宅', bx, h / 2, bz, w, h, d, { lod: 2, tag: 'backdrop', support: 'ground', group: `hs${i}` }); }
  for (let i = 0; i < 9; i++) { const g = new THREE.ConeGeometry(30 + R() * 25, 28 + R() * 26, 6); g.translate(-160 + i * 42, 12, 120 + R() * 30); push(i % 2 ? 'hill' : 'hillFar', 2, g); reg('遠景の山', { tag: 'backdrop', support: 'none', group: 'hill' + i }, [-200, 0, 90], [200, 40, 160]); }

  // ======= マージ・シーンへ追加 =======
  let triangles = 0; let meshes = 0;
  for (const [key, geos] of batches) {
    const [mk, lodS] = key.split('|'); const merged = mergeGeometries(geos, false); if (!merged) continue;
    const mesh = new THREE.Mesh(merged, M(mk).mat); mesh.name = `${mk}[lod${lodS}]`;
    const transparent = mk === 'glass'; mesh.castShadow = !transparent; mesh.receiveShadow = !transparent; root.add(mesh); meshes++;
    triangles += (merged.index ? merged.index.count : merged.attributes.position.count) / 3;
    if (lodS !== '0') lodObjects.push({ lod: Number(lodS) as 1 | 2, obj: mesh });
    geos.forEach(g => g.dispose());
  }
  for (const l of loose) { const m = l as THREE.Mesh; if (m.isMesh) { meshes++; triangles += 2; } }

  // ======= 光源・空 =======
  const hemi = new THREE.HemisphereLight('#cfe6ff', '#6a6a58', 1.05); root.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3dc', 2.6); sun.position.set(-40, 60, -25); sun.target.position.set(0, 0, 0); root.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -45; sun.shadow.camera.right = 45; sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45; sun.shadow.camera.near = 10; sun.shadow.camera.far = 160; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  const skyTex = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5f9bdc'); gr.addColorStop(0.55, '#a9d0ef'); gr.addColorStop(1, '#eaf3f4'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, { repeat: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex ?? undefined, color: skyTex ? '#ffffff' : '#a9d0ef', side: THREE.BackSide, fog: false, depthWrite: false })); sky.name = '空'; root.add(sky);

  // ======= アンカー（NPC・調べる対象） =======
  const A = (id: string, kind: Anchor['kind'], x: number, y: number, z: number, yaw: number, label: string, radius = 2.4) => { anchors[id] = { id, kind, x, y, z, yaw, label, radius }; };
  A('shiraishi', 'npc', 10.2, D, -9.6, -Math.PI / 2 + 0.3, '白石 駅長'); A('kubota', 'npc', 3.4, D, -2.7, Math.PI, '久保田'); A('yamashina', 'npc', -7.2, P, 2.3, 0, '山科'); A('kajiwara', 'npc', -11.2, D, -8.5, -Math.PI / 2, '梶原さん'); A('traveler', 'npc', 0.2, D, -6.4, Math.PI, '旅行客');
  A('roster_board', 'object', 7.6, D, -5.0, -Math.PI / 2, '勤務表（掲示板）'); A('terminal', 'object', 9.9, D, -7.6, Math.PI / 2, '業務端末'); A('vend2', 'object', -12.4, D, -8.5, -Math.PI / 2, '券売機2号機'); A('tactile', 'object', -8.0, P, 3.1, 0, 'ホーム縁端（点字ブロック）'); A('lost_item', 'object', 9.2, P, 2.0, 0, 'ベンチの傘', 2.2);
  A('departure_board', 'object', 0, D, -3.3, 0, '発車標'); A('timetable', 'object', 6.2, D, -2.6, Math.PI / 2, '時刻表'); A('emergency_btn', 'object', -21.8, P, 3.0, 0, '列車非常停止ボタン'); A('aed', 'object', -12.9, D, 6.5, -Math.PI / 2, 'AED'); A('elevator', 'object', 6.0, 0, -16.2, Math.PI, 'エレベーター');
  A('fare_map', 'object', -12.6, D, -9.8, -Math.PI / 2, '路線図・運賃表'); A('gate_wide', 'object', 4.25, D, -2.8, 0, '幅広改札'); A('mic', 'object', 12.6, D, -10.2, Math.PI / 2, '放送設備'); A('ticket_office', 'object', 5.8, D, -9.6, Math.PI / 2, 'きっぷうりば');
  A('spawn_plaza', 'object', 0, 0, -36, 0, '駅前広場', 1);

  const presets: Record<string, CamPreset> = {
    plaza: { pos: [-16, 3.2, -42], target: [0, 5, -12], fov: 55 }, overview: { pos: [-62, 42, -62], target: [0, 2, 0], fov: 45 }, top: { pos: [0.1, 120, 0.1], target: [0, 0, 0], fov: 40 },
    front: { pos: [0, 12, -62], target: [0, 5, -10], fov: 45 }, back: { pos: [0, 14, 62], target: [0, 5, 0], fov: 45 }, side: { pos: [-70, 8, 0], target: [0, 4, 0], fov: 45 },
    gate: { pos: [0, D + 1.7, -9], target: [0, D + 1.2, -2], fov: 62 }, concourse: { pos: [12.5, D + 2.6, 10.5], target: [-8, D + 1.2, -6], fov: 60 }, office: { pos: [8.2, D + 2.2, -2.2], target: [11.5, D + 1.0, -8], fov: 60 },
    platform: { pos: [-8, P + 1.65, 2.6], target: [-34, P + 1.5, -0.5], fov: 62 }, platform_east: { pos: [8, P + 1.65, -2.6], target: [34, P + 1.5, 0.5], fov: 62 }, train: { pos: [-12, P + 1.55, 2.6], target: [6, P + 1.9, -5], fov: 58 }, train_front: { pos: [-46, 2.2, -5.2], target: [-20, 2.0, -6.05], fov: 50 }, train_side: { pos: [0, 2.2, -14], target: [0, 2.0, -6.05], fov: 55 }, platform_high: { pos: [-20, 14, 14], target: [0, 3, 0], fov: 50 }, rail: { pos: [-48, 2.4, -9], target: [0, 1.8, -6], fov: 50 },
    gate_close: { pos: [-2.2, D + 1.55, -7.3], target: [-2.75, D + 0.9, -4.3], fov: 42 }, gate_side: { pos: [-9, D + 1.3, -1.6], target: [-1, D + 0.9, -4.0], fov: 50 }, gate_back: { pos: [0.5, D + 1.6, -0.6], target: [0, D + 0.9, -4.2], fov: 52 }, gate_wide: { pos: [5.5, D + 1.5, -7.2], target: [4.3, D + 0.9, -4.0], fov: 48 }, vend_close: { pos: [-10.9, D + 1.45, -8.1], target: [-13.1, D + 1.25, -8.5], fov: 38 }, seisan: { pos: [-10.9, D + 1.4, -1.2], target: [-13.1, D + 1.2, -1.6], fov: 40 },
    vend: { pos: [-9.6, D + 1.7, -8.5], target: [-13.4, D + 1.2, -8.5], fov: 50 }, board: { pos: [0, D + 2.6, 2.5], target: [0, D + 3.0, -3], fov: 45 }, tactile: { pos: [-6, P + 1.6, 0.5], target: [-8, P, 3.6], fov: 55 }
  };
  // 通路ルート（モブ用）
  const routes: StationData['routes'] = {
    inbound: [[0, 0, -34], [0, 0, -27], [0, D, -12], [-3.3, D, -6], [-3.3, D, -2.8], [-3.3, D, -1], [-8, D, 0], [-14.5, D, 0], [-24.5, P, 0], [-28, P, 1.5], [-18, P, 2.8]],
    outbound: [[-18, P, 2.8], [-24.5, P, 0], [-14.5, D, 0], [-8, D, 0.5], [-2.2, D, -2.8], [-2.2, D, -5.5], [0, D, -9], [0, D, -12], [0, 0, -27], [4, 0, -38], [-14, 0, -44]],
    eastIn: [[14, 0, -44], [0, 0, -27], [0, D, -12], [2.2, D, -6], [2.2, D, -2.8], [2.2, D, 0], [14.5, D, 0], [24.5, P, 0], [30, P, -2.5], [20, P, -2.8]],
    eastOut: [[20, P, -2.8], [24.5, P, 0], [14.5, D, 0], [3.5, D, 0.5], [3.5, D, -5.5], [0, D, -12], [0, 0, -27], [-6, 0, -38], [22, 0, -44]],
    paced: [[-2, D, 6], [6, D, 8], [10, D, 3], [-2, D, 4]]
  };

  const stats = { boxes: boxCount, meshes, triangles: Math.round(triangles) };
  return { root, colliders, zones, anchors, registry, lodObjects, presets, placements, boards: { departure: depTex, platformBoards: platBoards }, dynamic: { cars: [], lamps: [], sun, hemi, sky, gates }, stats, routes };
}
