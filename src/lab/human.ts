import * as THREE from 'three';
import { Parts, pbr, T, mesh, setMaxSeg, tex, FONT, rnd, rbox } from './kit';

/** 人物テンプレート v2（身長約1.74m・約7.2頭身・足元原点・+z向き）。
 *  断面リング（ロフト）で胴・腕・脚・頭・靴を滑らかに成形し、縫い目・しわ・折り目は頂点変位＋織り目の法線マップで表現する。
 *  関節ピボットは節点（Torso/Head/ArmL/R/ForearmL/R/LegL/R/ShinL/R）で、歩行は節点回転。材質名・節点名は旧版互換。 */
export interface HumanOpts { lod?: 'high' | 'low'; shoulder?: number; hip?: number; bust?: number }
interface Ring { y: number; a: number; b: number; cx?: number; cz?: number; n?: number }
type V3 = [number, number, number];
const UVR = 24; // UV全体を[0,1]に収め（量子化できる）、テクスチャ側の repeat で織り目を繰り返す
const sp = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 格子状の曲面。向きは外向きに自動補正し、継ぎ目（wrap）の法線は平均化する */
function grid(nu: number, nv: number, f: (i: number, j: number) => V3, uv: (i: number, j: number) => [number, number], ref: V3, wrap = true) {
  const pos: number[] = [], uvs: number[] = [], idx: number[] = []; const W = nu + 1;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { pos.push(...f(i, j)); uvs.push(...uv(i, j)); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  let s = 0; const p = (k: number) => new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]); const ctr = new THREE.Vector3(...ref);
  for (let t = 0; t < idx.length; t += 3) { const A = p(idx[t]), B = p(idx[t + 1]), C = p(idx[t + 2]); const n = B.clone().sub(A).cross(C.clone().sub(A)); s += n.dot(A.clone().add(B).add(C).multiplyScalar(1 / 3).sub(ctr)); }
  if (s < 0) for (let t = 0; t < idx.length; t += 3) { const k = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = k; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
  if (wrap) { const n = g.attributes.normal as THREE.BufferAttribute; for (let j = 0; j <= nv; j++) { const a = j * W, b = a + nu; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b); const l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
  return g;
}
const full = (r: Ring): Required<Ring> => ({ y: r.y, a: r.a, b: r.b, cx: r.cx ?? 0, cz: r.cz ?? 0, n: r.n ?? 2 });
/** 断面リングをCatmull-Romで細分（1区間あたりk行） */
function sample(rs: Ring[], k: number): Required<Ring>[] {
  const f = rs.map(full); if (k <= 1) return f; const out: Required<Ring>[] = []; const at = (i: number) => f[Math.max(0, Math.min(f.length - 1, i))];
  const cr = (p0: number, p1: number, p2: number, p3: number, t: number) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  for (let i = 0; i < f.length - 1; i++) for (let s = 0; s < k; s++) { const t = s / k; const o: any = {}; for (const key of ['y', 'a', 'b', 'cx', 'cz', 'n'] as const) o[key] = key === 'y' ? lerp(f[i].y, f[i + 1].y, t) : cr(at(i - 1)[key], at(i)[key], at(i + 1)[key], at(i + 2)[key], t); out.push(o); }
  out.push(f[f.length - 1]); return out;
}
interface LoftO { k?: number; disp?: (th: number, y: number, x: number) => number; arc?: [number, number]; tile?: number }
function loft(rings: Ring[], seg: number, o: LoftO = {}) {
  const rows = sample(rings, o.k ?? 1); const [t0, t1] = o.arc ?? [0, Math.PI * 2]; const tile = o.tile ?? 0.06; const maxA = Math.max(...rows.map(r => r.a));
  const uU = Math.max(1, Math.round(((t1 - t0) * maxA) / tile)) / UVR; const y0 = rows[0].y; const m = rows[Math.floor(rows.length / 2)];
  return grid(seg, rows.length - 1, (i, j) => { const r = rows[j]; const th = t0 + ((t1 - t0) * i) / seg; let x = r.a * sp(Math.sin(th), 2 / r.n), z = r.b * sp(Math.cos(th), 2 / r.n); const d = 1 + (o.disp ? o.disp(th, r.y, x) : 0); x *= d; z *= d; return [r.cx + x, r.y, r.cz + z]; },
    (i, j) => [(i / seg) * uU, (rows[j].y - y0) / tile / UVR], [m.cx, m.y, m.cz], !o.arc);
}
const secAt = (rs: Ring[], y: number): Required<Ring> => { const f = rs.map(full); for (let i = 0; i < f.length - 1; i++) { const a = f[i], b = f[i + 1]; if (y >= Math.min(a.y, b.y) && y <= Math.max(a.y, b.y)) { const t = (y - a.y) / (b.y - a.y || 1); return { y, a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t), cx: lerp(a.cx, b.cx, t), cz: lerp(a.cz, b.cz, t), n: lerp(a.n, b.n, t) }; } } return f[y < f[0].y ? 0 : f.length - 1]; };
const frontZ = (s: Required<Ring>, x: number) => s.cz + s.b * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x - s.cx) / s.a, s.n)), 1 / s.n);
const slopeYaw = (rs: Ring[], y: number, x: number) => { const s = secAt(rs, y); return -Math.atan((frontZ(s, x + 0.004) - frontZ(s, x - 0.004)) / 0.008); };
/** 形状をXY→任意面に沿わせる（各頂点のzを面の高さに合わせる） */
function conform(g: THREE.BufferGeometry, zf: (x: number, y: number) => number, off = 0) { const p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, zf(p.getX(i), p.getY(i)) + off + p.getZ(i)); g.computeVertexNormals(); return g; }
const shapeGeo = (pts: [number, number][], depth: number, bevel = 0) => { const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1 }); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; };
const mirror = (pts: [number, number][]) => pts.map(p => [-p[0], p[1]] as [number, number]).reverse();

/** 織り目の法線マップ（ツイル）を手続き生成 */
function fabricNormal() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d')!; const im = g.createImageData(N, N); const h = new Float32Array(N * N); void rnd;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] = (Math.sin(((x + y) * Math.PI) / 4) * 0.5 + 0.5) * 0.8;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)], dy = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x]; let nx = -dx * 1.4, ny = dy * 1.4, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; const k = (y * N + x) * 4; im.data[k] = (nx * 0.5 + 0.5) * 255; im.data[k + 1] = (ny * 0.5 + 0.5) * 255; im.data[k + 2] = (nz * 0.5 + 0.5) * 255; im.data[k + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(UVR, UVR); t.anisotropy = 8; return t;
}

export function humanTemplate(o: HumanOpts = {}) {
  const lo = o.lod === 'low'; const sh = o.shoulder ?? 1, hp = o.hip ?? 1, bu = o.bust ?? 0;
  setMaxSeg(2); const root = new THREE.Group(); root.name = 'Human'; const P = new Parts();
  const nrm = fabricNormal(); const fab = (m: THREE.MeshStandardMaterial, s = 0.7) => { m.normalMap = nrm; m.normalScale.set(s, s); return m; };
  const skin = pbr('Skin', { color: '#efc9a6', rough: 0.62 }); const uni = fab(pbr('Uniform', { color: '#1d2a44', rough: 0.72 })); const shirt = fab(pbr('Shirt', { color: '#f4f4f0', rough: 0.8 }), 0.5); const trs = fab(pbr('Trousers', { color: '#232a38', rough: 0.78 }));
  const hairM = pbr('Hair', { color: '#2a2018', rough: 0.55 }); const shoe = pbr('Shoes', { color: '#17181a', rough: 0.4, metal: 0.1 }); const sole = pbr('Sole', { color: '#0d0d0e', rough: 0.9 }); const acc = pbr('Accessory', { color: '#1d2a44', rough: 0.7 });
  const tieM = fab(pbr('Tie', { color: '#b02a2a', rough: 0.55 }), 0.4); const eyeW = pbr('EyeWhite', { color: '#f6f6f2', rough: 0.3 }); const iris = pbr('Iris', { color: '#2a1b12', rough: 0.2 }); const lip = pbr('Lip', { color: '#b8665a', rough: 0.5 }); const gold = pbr('Brass', { color: '#d8b030', metal: 0.9, rough: 0.35 }); const black = pbr('Black', { color: '#0c0c0d', rough: 0.8 });
  const nameTex = tex(128, 40, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2a44'; g.font = `bold 18px ${FONT}`; g.fillText('青嶺鉄道', 8, 26); }); const tagM = pbr('NameTag', { color: '#ffffff', map: nameTex, rough: 0.5 });
  const S = lo ? { torso: 24, limb: 12, head: 18, k: 1 } : { torso: 40, limb: 16, head: 28, k: 2 };

  // ---- 胴（ジャケット）----
  const JR: Ring[] = [{ y: 0.955, a: 0.17 * hp, b: 0.108, n: 2.4 }, { y: 0.985, a: 0.158 * hp, b: 0.101, n: 2.4 }, { y: 1.05, a: 0.152, b: 0.097, n: 2.4 }, { y: 1.13, a: 0.164, b: 0.103 + bu * 0.3, n: 2.5 }, { y: 1.25, a: 0.176 * sh, b: 0.108 + bu, n: 2.5 }, { y: 1.35, a: 0.182 * sh, b: 0.104 + bu * 0.5, n: 2.4 }, { y: 1.425, a: 0.19 * sh, b: 0.092, n: 2.3 }, { y: 1.455, a: 0.13 * sh, b: 0.08, n: 2.2 }, { y: 1.49, a: 0.066, b: 0.063 }, { y: 1.4955, a: 0.002, b: 0.002 }];
    const jacket = loft(JR, S.torso, { k: S.k, disp: (th, y, x) => {
    let d = 0; void x;
    const th2 = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); const nearSeam = (c: number) => Math.abs(th2 - c) < 0.02;
    if (nearSeam(Math.PI / 2) || nearSeam(Math.PI * 1.5) || nearSeam(Math.PI)) d -= 0.022; if (y < 1.2 && (th2 < 0.02 || th2 > Math.PI * 2 - 0.02)) d -= 0.016;
    d += 0.01 * Math.exp(-(((y - 1.04) / 0.03) ** 2)) * Math.sin(th * 3 + 1) + 0.008 * Math.exp(-(((y - 1.1) / 0.02) ** 2)) * Math.cos(th * 2) * (Math.abs(x) < 0.1 ? 1 : 0.3);
    d += 0.01 * Math.exp(-(((y - 1.36) / 0.02) ** 2)) * Math.sin(th * 5) * sm(0.4, 1.2, Math.abs(th2 - Math.PI)); return d; } });
  const torso = new THREE.Group(); torso.name = 'Torso'; root.add(torso); const TP = new Parts();
  TP.add(uni, jacket);
  // 白シャツ（V字の開きから見える）とシャツ襟
    { const g = shapeGeo([[-0.057, 1.5], [0.057, 1.5], [0.02, 1.2], [0, 1.185], [-0.02, 1.2]], 0.002); TP.add(shirt, conform(g, (x, y) => frontZ(secAt(JR, y), x), 0.009)); }
  TP.add(shirt, loft([{ y: 1.47, a: 0.056, b: 0.056 }, { y: 1.53, a: 0.052, b: 0.052 }], lo ? 10 : 20, { arc: [0.7, Math.PI * 2 - 0.7] }));
  TP.add(uni, loft([{ y: 1.455, a: 0.072, b: 0.07 }, { y: 1.49, a: 0.07, b: 0.068 }, { y: 1.52, a: 0.066, b: 0.064 }], lo ? 10 : 20, { arc: [0.9, Math.PI * 2 - 0.9], tile: 0.03 }));
  for (const s of [-1, 1]) { const w = shapeGeo([[0, 0], [s * 0.034, 0.004], [s * 0.016, -0.036]], 0.003); TP.add(shirt, w, T(s * 0.014, 1.508, 0.056, 0.15, s * 0.3, s * -0.25)); }
  // 襟（ノッチドラペル）。V字の縁に沿って上着の面へ貼る
  const lapel = [[0.042, 1.478], [0.082, 1.462], [0.108, 1.425], [0.075, 1.395], [0.056, 1.3], [0.012, 1.2], [0.008 + 0.034 * (1.455 - 1.2) / 0.278, 1.455]] as [number, number][]; const zf = (x: number, y: number) => frontZ(secAt(JR, y), x);
  for (const s of [1, -1]) { const g = shapeGeo(s > 0 ? lapel : mirror(lapel), 0.006, 0.0015); TP.add(uni, conform(g, zf, 0.0125)); }
  // ボタン・ポケット・肩章・名札
  const btn = new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, lo ? 6 : 10); btn.rotateX(Math.PI / 2);
  for (const y of [1.15, 1.06, 0.99]) TP.add(gold, btn, T(0, y, zf(0, y) + 0.003));
  for (const s of [-1, 1]) { const y = 1.025, x = s * 0.095; TP.add(uni, rbox(0.07, 0.03, 0.008, 0.003, 1), T(x, y, zf(x, y) + 0.003, 0, slopeYaw(JR, y, x) * 1, 0)); TP.add(black, rbox(0.066, 0.004, 0.004, 0.001, 1), T(x, y + 0.016, zf(x, y) + 0.0045, 0, slopeYaw(JR, y, x), 0)); }
  { const x = 0.105, y = 1.29; TP.add(uni, rbox(0.058, 0.05, 0.006, 0.002, 1), T(x, y, zf(x, y) + 0.002, 0, slopeYaw(JR, y, x), 0)); TP.add(uni, rbox(0.06, 0.016, 0.009, 0.003, 1), T(x, y + 0.026, zf(x, y) + 0.003, 0, slopeYaw(JR, y, x), 0)); }
  TP.add(tagM, new THREE.BoxGeometry(0.09, 0.028, 0.005), T(-0.1, 1.29, zf(-0.1, 1.29) + 0.004, 0, slopeYaw(JR, 1.29, -0.1), 0));
  for (const s of [-1, 1]) { const x = s * 0.14, ang = -s * 0.46; TP.add(uni, rbox(0.052, 0.01, 0.08, 0.004, 1), T(x, 1.452, 0, 0, 0, ang)); for (const z of [-0.012, 0.012]) TP.add(gold, rbox(0.03, 0.004, 0.006, 0.001, 1), T(x, 1.458, z + 0.012, 0, 0, ang)); }
  TP.build('TorsoParts', torso);
  // ネクタイ
  { const tie = new THREE.Group(); tie.name = 'TieNode'; const blade = shapeGeo([[-0.011, 1.47], [0.011, 1.47], [0.017, 1.42], [0.02, 1.3], [0.023, 1.24], [0, 1.2], [-0.023, 1.24], [-0.02, 1.3], [-0.017, 1.42]], 0.004);
    const sz = (x: number, y: number) => frontZ(secAt(JR, y), x); conform(blade, sz, 0.015);
    const knot = loft([{ y: 1.448, a: 0.013, b: 0.011 }, { y: 1.466, a: 0.019, b: 0.015 }, { y: 1.488, a: 0.016, b: 0.012 }], 12, {}); knot.translate(0, 0, sz(0, 1.466) + 0.019);
    const tg = new THREE.BufferGeometry(); const bn = blade.toNonIndexed(); const kn = knot.toNonIndexed(); for (const g of [bn, kn]) { g.deleteAttribute('uv'); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
    const merged = new THREE.BufferGeometry(); const arr = (g: THREE.BufferGeometry, k: string) => Array.from((g.attributes[k] as THREE.BufferAttribute).array as ArrayLike<number>);
    for (const k of ['position', 'normal', 'uv']) merged.setAttribute(k, new THREE.Float32BufferAttribute([...arr(bn, k), ...arr(kn, k)], k === 'uv' ? 2 : 3)); void tg;
    tie.add(mesh(merged, tieM, 'TieMesh')); root.add(tie); }

  // ---- 骨盤・ベルト・首 ----
  P.add(trs, loft([{ y: 0.79, a: 0.02, b: 0.02 }, { y: 0.83, a: 0.15, b: 0.095, n: 2.4 }, { y: 0.9, a: 0.164 * hp, b: 0.1, n: 2.4 }, { y: 1.0, a: 0.15, b: 0.095, n: 2.4 }], S.torso / 2, { k: S.k, tile: 0.05 }));
  P.add(black, loft([{ y: 0.905, a: 0.173 * hp, b: 0.11, n: 2.4 }, { y: 0.912, a: 0.177 * hp, b: 0.114, n: 2.4 }, { y: 0.948, a: 0.172 * hp, b: 0.11, n: 2.4 }, { y: 0.955, a: 0.168 * hp, b: 0.106, n: 2.4 }], S.torso / 2));
  P.add(gold, rbox(0.034, 0.03, 0.01, 0.004, 1), T(0, 0.93, 0.117)); P.add(black, rbox(0.018, 0.016, 0.012, 0.003, 1), T(0, 0.93, 0.117));
  P.add(skin, loft([{ y: 1.4, a: 0.062, b: 0.058, cz: -0.005 }, { y: 1.46, a: 0.052, b: 0.052 }, { y: 1.52, a: 0.047, b: 0.049, cz: 0.004 }, { y: 1.62, a: 0.046, b: 0.048, cz: 0.012 }], lo ? 10 : 18, { k: 1 }));

  // ---- 頭・顔 ----
  const HR: Ring[] = [{ y: -0.105, a: 0.004, b: 0.01, cz: 0.035 }, { y: -0.098, a: 0.028, b: 0.042, cz: 0.028, n: 2.6 }, { y: -0.08, a: 0.052, b: 0.07, cz: 0.012, n: 2.6 }, { y: -0.055, a: 0.076, b: 0.088, n: 2.5 }, { y: -0.025, a: 0.088, b: 0.097, cz: -0.006, n: 2.3 }, { y: 0.01, a: 0.092, b: 0.1, cz: -0.01 }, { y: 0.04, a: 0.093, b: 0.1, cz: -0.012 }, { y: 0.08, a: 0.088, b: 0.095, cz: -0.012 }, { y: 0.11, a: 0.07, b: 0.078, cz: -0.012 }, { y: 0.13, a: 0.04, b: 0.045, cz: -0.012 }, { y: 0.14, a: 0.003, b: 0.003, cz: -0.012 }];
  const hz = (x: number, y: number) => frontZ(secAt(HR, y), x);
  const head = new THREE.Group(); head.name = 'Head'; head.position.set(0, 1.6, 0); root.add(head); const HP = new Parts();
  HP.add(skin, loft(HR, S.head, { k: S.k, tile: 0.1 }));
  { const nose = loft([{ y: 0.03, a: 0.006, b: 0.008, cz: 0.082 }, { y: 0.012, a: 0.009, b: 0.012, cz: 0.088 }, { y: -0.005, a: 0.012, b: 0.016, cz: 0.092 }, { y: -0.018, a: 0.0155, b: 0.018, cz: 0.095 }, { y: -0.026, a: 0.012, b: 0.012, cz: 0.096 }, { y: -0.03, a: 0.003, b: 0.004, cz: 0.095 }], 10, { k: 1 }); HP.add(skin, nose); }
  for (const s of [-1, 1]) {
    const ear = new THREE.SphereGeometry(1, 8, 6); ear.scale(0.008, 0.03, 0.021); HP.add(skin, ear, T(s * 0.091, -0.004, -0.004, 0, s * 0.32, 0)); const hx = new THREE.TorusGeometry(0.017, 0.0032, 3, 8, Math.PI * 1.4); HP.add(skin, hx, T(s * 0.093, -0.002, -0.006, 0, s * (Math.PI / 2 + 0.3), 0.6));
    const ex = s * 0.034, ey = 0.025, ez = hz(ex, ey) - 0.01; const ball = new THREE.SphereGeometry(1, 10, 8); ball.scale(0.0155, 0.0125, 0.0145); HP.add(eyeW, ball, T(ex, ey, ez));
    const ir = new THREE.SphereGeometry(1, 8, 5); ir.scale(0.0075, 0.0075, 0.003); HP.add(iris, ir, T(ex, ey - 0.0005, ez + 0.0143)); const pu = new THREE.SphereGeometry(1, 6, 4); pu.scale(0.0036, 0.0036, 0.002); HP.add(black, pu, T(ex, ey - 0.0005, ez + 0.0158));
    HP.add(black, new THREE.TorusGeometry(0.0118, 0.0018, 4, 12, Math.PI), T(ex, ey - 0.001, ez + 0.0105, 0, 0, 0)); HP.add(skin, new THREE.TorusGeometry(0.0122, 0.0022, 4, 12, Math.PI), T(ex, ey + 0.003, ez + 0.0102, 0, 0, 0));
  }
  HP.build('HeadParts', head);
  for (const [n, s2] of [['BrowL', -1], ['BrowR', 1]] as [string, number][]) {
    const cx = s2 * 0.036, cy = 0.058; const pts: [number, number][] = [[-0.025, -0.001], [-0.012, 0.004], [0.006, 0.0055], [0.024, 0.0], [0.025, -0.004], [0.006, 0.0005], [-0.012, -0.0005], [-0.025, -0.004]].map(p => [p[0] * s2, p[1]] as [number, number]);
    const g = shapeGeo(pts, 0.004, 0.0008); g.translate(0, 0, 0); const p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, hz(cx + p.getX(i), cy + p.getY(i)) + 0.001 + p.getZ(i)); g.computeVertexNormals();
    const b = new THREE.Group(); b.name = n; b.position.set(cx, cy, 0); b.add(mesh(g, hairM, n + 'Mesh')); head.add(b);
  }
  { const my = -0.06; const mz = hz(0, my);
    const mouth = (n: string, g: THREE.BufferGeometry[], vis = false, m2?: THREE.Material) => { const m = new THREE.Group(); m.name = n; m.visible = vis; m.position.set(0, my, mz); g.forEach((gg, i) => m.add(mesh(gg, i === 0 || !m2 ? lip : m2, n + 'Mesh' + (i || '')))); head.add(m); };
    const curve = (k: number, r = 0.0035) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([-1, -0.5, 0, 0.5, 1].map(u => { const x = u * 0.022, y = k * (u * u - 0.5) * 0.012; return new THREE.Vector3(x, y, hz(x, my + y) - mz + 0.001); })), 10, r, 6, false);
    const cap = (w: number, r: number, y: number) => { const g = new THREE.CapsuleGeometry(r, w, 2, 6); g.rotateZ(Math.PI / 2); g.scale(1, 1, 0.8); g.translate(0, y, 0.001); return g; };
    mouth('MouthFlat', [cap(0.026, 0.0046, 0.0028), cap(0.024, 0.0054, -0.0032)], true); mouth('MouthSmile', [curve(1)]); mouth('MouthWorry', [curve(-1)]);
    const open = new THREE.SphereGeometry(1, 12, 10); open.scale(0.015, 0.019, 0.006); open.translate(0, -0.004, -0.001); mouth('MouthOpen', [open, curve(0.0, 0.003)], false, pbr('MouthDark', { color: '#3a1212', rough: 0.6 })); }
  // 髪：生え際を角度で変えた殻。短髪／長髪／まとめ髪を節点で切替
  const shell = (yh: (th: number) => number, seg: number, rows: number, thick = 0.012, puff = 0.006) => grid(seg, rows, (i, j) => { const th = (Math.PI * 2 * i) / seg; const v = j / rows; if (j === 0) return [0, 0.1475, -0.012]; const y = lerp(0.13, yh(th), (j - 1) / (rows - 1)); const s = secAt(HR, y); const t = thick + puff * (1 - v) + 0.0025 * Math.sin(th * 12 + v * 4); return [s.cx + (s.a + t) * sp(Math.sin(th), 2 / s.n), y, s.cz + (s.b + t) * sp(Math.cos(th), 2 / s.n)]; }, (i, j) => [i / seg, j / rows], [0, 0.04, -0.01]);
  const hs = new THREE.Group(); hs.name = 'HairShort'; hs.add(mesh(shell(th => 0.03 + 0.045 * Math.cos(th), lo ? 16 : 28, lo ? 4 : 7), hairM, 'HairShortMesh'));
  { const pts: [number, number][] = []; for (let k = 0; k <= 14; k++) { const x = -0.078 + (0.156 * k) / 14; pts.push([x, -0.01 - 0.009 * (0.5 + 0.5 * Math.cos(x * 62)) + 0.004 * Math.abs(x) * 10]); } pts.push([0.074, 0.03], [-0.074, 0.03]); const g = shapeGeo(pts, 0.008, 0.002); const p = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < p.count; i++) p.setZ(i, hz(p.getX(i), 0.075 + p.getY(i)) + 0.011 + p.getZ(i)); g.translate(0, 0.075, 0); g.computeVertexNormals(); hs.add(mesh(g, hairM, 'Fringe')); }
  head.add(hs);
  const hl = new THREE.Group(); hl.name = 'HairLong'; hl.visible = false; hl.add(mesh(shell(th => -0.01 + 0.07 * Math.cos(th), lo ? 16 : 28, lo ? 4 : 7, 0.013, 0.01), hairM, 'HairLongTop'));
  hl.add(mesh(loft([{ y: -0.21, a: 0.012, b: 0.01, cz: -0.125 }, { y: -0.2, a: 0.085, b: 0.035, cz: -0.125, n: 3 }, { y: -0.12, a: 0.096, b: 0.04, cz: -0.115, n: 3 }, { y: -0.05, a: 0.098, b: 0.045, cz: -0.095 }, { y: 0.03, a: 0.09, b: 0.05, cz: -0.07 }], lo ? 14 : 24, { k: 1, arc: [Math.PI * 0.55, Math.PI * 1.45] }), hairM, 'HairBack'));
  for (const s of [-1, 1]) hl.add(mesh(loft([{ y: -0.19, a: 0.004, b: 0.004, cz: -0.03 }, { y: -0.17, a: 0.018, b: 0.026, cz: -0.03 }, { y: -0.08, a: 0.022, b: 0.03, cz: -0.025 }, { y: 0.0, a: 0.02, b: 0.04, cz: -0.02 }], 12, { k: 1 }), hairM, 'HairSide', s * 0.1, 0, 0));
  head.add(hl);
  const bun = new THREE.Group(); bun.name = 'HairBun'; bun.visible = false; bun.add(mesh(shell(th => 0.04 + 0.04 * Math.cos(th), lo ? 16 : 28, lo ? 4 : 7, 0.011, 0.006), hairM, 'HairBunTop')); bun.add(mesh(new THREE.SphereGeometry(0.046, lo ? 8 : 14, lo ? 6 : 10), hairM, 'HairBunKnot', 0, 0.105, -0.095)); bun.add(mesh(new THREE.TorusGeometry(0.042, 0.005, 5, 14), black, 'HairBunBand', 0, 0.105, -0.095)); head.add(bun);
  // 帽子・眼鏡
  const capN = new THREE.Group(); capN.name = 'Cap'; capN.visible = false; const cr = (y: number, k: number): Ring => { const s = secAt(HR, y); return { y, a: s.a + k, b: s.b + k, cz: s.cz, n: s.n }; };
  capN.add(mesh(loft([cr(0.07, 0.024), cr(0.1, 0.026), cr(0.13, 0.03), { y: 0.162, a: 0.056, b: 0.062, cz: -0.012 }, { y: 0.166, a: 0.002, b: 0.002, cz: -0.012 }], S.head, { k: 1 }), acc, 'CapCrown'));
  capN.add(mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.006, 20), acc, 'CapTop', 0, 0.164, -0.012)); capN.add(mesh(loft([cr(0.068, 0.027), cr(0.092, 0.027)], S.head, { k: 1 }), black, 'CapBand'));
  { const vis = new THREE.Shape(); vis.absarc(0, 0, 0.1, 0, Math.PI, false); vis.lineTo(-0.08, 0); const g = new THREE.ExtrudeGeometry(vis, { depth: 0.004, bevelEnabled: false, curveSegments: 10 }); g.rotateX(Math.PI / 2 - 0.0); g.scale(1, 1, 0.78); capN.add(mesh(g, black, 'CapVisor', 0, 0.082, 0.112)); }
  capN.add(mesh(rbox(0.04, 0.028, 0.008, 0.004), gold, 'CapBadge', 0, 0.112, 0.118)); head.add(capN);
  const gl = new THREE.Group(); gl.name = 'Glasses'; gl.visible = false; for (const s of [-1, 1]) { gl.add(mesh(new THREE.TorusGeometry(0.0285, 0.0035, 6, 18), black, 'Lens', s * 0.036, 0.025, hz(s * 0.036, 0.025) + 0.012)); gl.add(mesh(new THREE.BoxGeometry(0.004, 0.004, 0.115), black, 'Temple', s * 0.093, 0.03, 0.035)); } gl.add(mesh(new THREE.BoxGeometry(0.018, 0.004, 0.004), black, 'Bridge', 0, 0.03, hz(0, 0.03) + 0.012)); head.add(gl);

  // ---- 腕（肩ピボット）----
  const hand = (side: 1 | -1, AP: Parts) => {
    AP.add(skin, loft([{ y: -0.262, a: 0.016, b: 0.026 }, { y: -0.3, a: 0.0185, b: 0.038, cz: 0.004 }, { y: -0.34, a: 0.019, b: 0.04, cz: 0.004 }, { y: -0.349, a: 0.004, b: 0.02, cz: 0.004 }], lo ? 10 : 16, { k: 1, tile: 0.1 }));
    if (lo) { AP.add(skin, rbox(0.03, 0.08, 0.075, 0.012, 1), T(0, -0.375, 0.004)); return; }
    const fingers: [number, number, number][] = [[0.026, 0.044, 0.0085], [0.009, 0.05, 0.0088], [-0.008, 0.046, 0.0085], [-0.024, 0.036, 0.0078]];
    for (const [z, len, r] of fingers) AP.add(skin, new THREE.CapsuleGeometry(r, len, 1, 5), T(-side * 0.002, -0.345 - len / 2, z + 0.004, 0, 0, side * 0.1));
    AP.add(skin, new THREE.CapsuleGeometry(0.0095, 0.034, 1, 5), T(-side * 0.02, -0.318, 0.04, 0.5, 0, side * 0.25));
  };
  const mkArm = (side: 1 | -1) => {
    const a = new THREE.Group(); a.name = side > 0 ? 'ArmR' : 'ArmL'; a.position.set(side * 0.205 * sh, 1.42, 0); a.rotation.z = side * 0.05; const AP = new Parts();
    const elbow = [-0.225, -0.2375, -0.2625, -0.275, -0.3];
    const upper: Ring[] = [{ y: 0.046, a: 0.002, b: 0.002 }, { y: 0.042, a: 0.018, b: 0.018 }, { y: 0.032, a: 0.034, b: 0.034 }, { y: 0.016, a: 0.044, b: 0.044 }, { y: -0.02, a: 0.047, b: 0.047 }, { y: -0.1, a: 0.045, b: 0.046 }, { y: -0.2, a: 0.042, b: 0.043 }, ...elbow.map(y => ({ y, a: 0.041, b: 0.042 }))];
    const nsm = (th: number) => ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    AP.add(uni, loft(upper, S.limb, { k: 1, disp: (th, y) => { let d = 0; if (Math.abs(nsm(th) - Math.PI * 1.5) < 0.02) d -= 0.03; if (y < -0.22) d += 0.05 * Math.cos((2 * Math.PI * y) / 0.025) * (0.4 + 0.6 * Math.max(0, Math.cos(th))); return d; } }));
    const fore = new THREE.Group(); fore.name = side > 0 ? 'ForearmR' : 'ForearmL'; fore.position.set(0, -0.3, 0); fore.rotation.x = -0.12; const FP = new Parts();
    const fr: Ring[] = [{ y: 0.03, a: 0.041, b: 0.042 }, ...[0, -0.0125, -0.025, -0.0375].map(y => ({ y, a: 0.0415, b: 0.042 })), { y: -0.12, a: 0.037, b: 0.038 }, { y: -0.19, a: 0.0345, b: 0.0355 }, { y: -0.232, a: 0.033, b: 0.034 }, { y: -0.248, a: 0.0355, b: 0.036 }, { y: -0.262, a: 0.0355, b: 0.036 }];
    FP.add(uni, loft(fr, S.limb, { k: 1, disp: (th, y) => { let d = 0; if (Math.abs(nsm(th) - Math.PI * 1.5) < 0.02) d -= 0.03; if (y > -0.05) d += 0.045 * Math.cos((2 * Math.PI * y) / 0.025) * Math.max(0, Math.cos(th)); return d; } }));
    FP.add(shirt, loft([{ y: -0.252, a: 0.032, b: 0.033 }, { y: -0.285, a: 0.0305, b: 0.0315 }], S.limb, { k: 1 })); FP.add(gold, new THREE.TorusGeometry(0.0362, 0.0022, 4, lo ? 10 : 18), T(0, -0.215, 0, Math.PI / 2, 0, 0)); FP.add(gold, new THREE.TorusGeometry(0.0358, 0.0022, 4, lo ? 10 : 18), T(0, -0.228, 0, Math.PI / 2, 0, 0));
    hand(side, FP); FP.build('ForearmParts', fore); a.add(fore); AP.build('ArmParts', a); return a;
  };
  root.add(mkArm(1), mkArm(-1));

  // ---- 脚（股関節ピボット）----
  const mkLeg = (side: 1 | -1) => {
    const l = new THREE.Group(); l.name = side > 0 ? 'LegR' : 'LegL'; l.position.set(side * 0.09 * hp, 0.9, 0); const LP = new Parts();
    const crease = (th: number) => { const t = ((th % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return t < 0.02 || Math.abs(t - Math.PI) < 0.02 || t > Math.PI * 2 - 0.02 ? 0.045 : 0; };
    LP.add(trs, loft([{ y: 0.05, a: 0.088, b: 0.096 }, { y: 0, a: 0.086, b: 0.095 }, { y: -0.12, a: 0.078, b: 0.088 }, { y: -0.25, a: 0.068, b: 0.074 }, { y: -0.36, a: 0.058, b: 0.062 }, { y: -0.4, a: 0.057, b: 0.059 }, { y: -0.415, a: 0.0535, b: 0.058 }, { y: -0.43, a: 0.057, b: 0.059 }, { y: -0.47, a: 0.052, b: 0.056 }], S.limb, { k: 1, disp: (th, y) => crease(th) * 0.9 + (y < -0.39 && y > -0.44 ? 0.02 * Math.cos(th) : 0) }));
    const shin = new THREE.Group(); shin.name = side > 0 ? 'ShinR' : 'ShinL'; shin.position.set(0, -0.45, 0); const SP = new Parts();
    SP.add(trs, loft([{ y: 0.03, a: 0.054, b: 0.057 }, { y: -0.05, a: 0.05, b: 0.053 }, { y: -0.1, a: 0.048, b: 0.052, cz: -0.005 }, { y: -0.18, a: 0.043, b: 0.046, cz: -0.004 }, { y: -0.26, a: 0.04, b: 0.042 }, { y: -0.3, a: 0.0395, b: 0.04 }, { y: -0.318, a: 0.0455, b: 0.047 }, { y: -0.333, a: 0.0415, b: 0.043 }, { y: -0.348, a: 0.0465, b: 0.0475 }, { y: -0.362, a: 0.0435, b: 0.045 }, { y: -0.373, a: 0.046, b: 0.048 }], S.limb, { k: 1, disp: crease }));
    const sr = (s: number, a: number, hh: number, hc: number): Ring => ({ y: s, a, b: hh, cz: -hc, n: 2.4 });
    const sg = (rs: Ring[], mat: THREE.Material) => { const g = loft(rs, lo ? 8 : 14, { k: 1, tile: 0.1 }); g.rotateX(Math.PI / 2); g.translate(0, -0.45, 0); SP.add(mat, g); };
    sg([sr(-0.08, 0.004, 0.01, 0.04), sr(-0.075, 0.03, 0.032, 0.04), sr(-0.05, 0.036, 0.037, 0.045), sr(0, 0.04, 0.038, 0.046), sr(0.05, 0.043, 0.034, 0.043), sr(0.1, 0.046, 0.028, 0.037), sr(0.15, 0.046, 0.022, 0.03), sr(0.19, 0.04, 0.017, 0.022), sr(0.207, 0.024, 0.011, 0.014), sr(0.213, 0.004, 0.004, 0.012)], shoe);
    sg([sr(-0.08, 0.004, 0.006, 0.007), sr(-0.076, 0.031, 0.011, 0.011), sr(-0.03, 0.035, 0.011, 0.011), sr(0, 0.041, 0.009, 0.009), sr(0.15, 0.047, 0.008, 0.008), sr(0.2, 0.04, 0.008, 0.008), sr(0.216, 0.008, 0.006, 0.006)], sole);
    SP.build('ShinParts', shin); l.add(shin); LP.build('LegParts', l); return l;
  };
  root.add(mkLeg(1), mkLeg(-1));

  // ---- 持ち物 ----
  const bag = new THREE.Group(); bag.name = 'Bag'; bag.visible = false; bag.add(mesh(rbox(0.26, 0.2, 0.1, 0.03), pbr('BagLeather', { color: '#6a4a3a', rough: 0.7 }), 'BagBody', 0.3, 0.86, 0)); bag.add(mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 14, Math.PI), black, 'BagHandle', 0.3, 0.96, 0)); root.add(bag);
  const cane = new THREE.Group(); cane.name = 'Cane'; cane.visible = false; cane.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.85, 8), pbr('CaneWood', { color: '#4a3a2a', rough: 0.6 }), 'CaneShaft', 0.34, 0.45, 0.12)); cane.add(mesh(new THREE.TorusGeometry(0.035, 0.011, 6, 12, Math.PI), pbr('CaneWood2', { color: '#4a3a2a', rough: 0.6 }), 'CaneHandle', 0.305, 0.875, 0.12)); root.add(cane);
  const sc = new THREE.Group(); sc.name = 'Suitcase'; sc.visible = false; sc.add(mesh(rbox(0.4, 0.62, 0.24, 0.04), pbr('SuitcaseShell', { color: '#1f6f8a', rough: 0.35, metal: 0.2 }), 'CaseShell', 0.52, 0.4, 0.1)); sc.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 6), pbr('SuitcaseHandle', { color: '#aaa', metal: 0.9, rough: 0.4 }), 'CaseHandle', 0.52, 0.88, 0.1)); root.add(sc);
  P.build('BodyParts', root); root.userData = { kind: 'human', height: 1.74, nodes: ['LegL', 'LegR', 'ArmL', 'ArmR', 'Head', 'ForearmL', 'ForearmR', 'ShinL', 'ShinR'] };
  return root;
}
