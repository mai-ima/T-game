import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, SUBTRACTION, ADDITION } from 'three-bvh-csg';

/** モデル制作キット：角丸ボックス・面取り押し出し・CSG（ブーリアン）・PBR材質・手続きテクスチャ。 */
export const M = THREE;

export function rnd(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!; draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/** ヘアライン仕上げ（ステンレス・アルミ）の粗さマップ。縦方向の細かい筋 */
export function brushedRough(seed = 1, base = 0.38) {
  return tex(256, 256, (g, w, h) => { const r = rnd(seed); g.fillStyle = `rgb(${base * 255},${base * 255},${base * 255})`; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = Math.floor((base + (r() - 0.5) * 0.3) * 255); g.strokeStyle = `rgba(${v},${v},${v},.5)`; g.lineWidth = 0.5 + r(); const x = r() * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 2, h); g.stroke(); } }, false, true);
}
export function noiseTex(base: string, amt: number, seed = 3, n = 4000, size = 256) {
  return tex(size, size, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rnd(seed); for (let i = 0; i < n; i++) { const v = Math.floor(128 + (r() - 0.5) * amt * 2); g.fillStyle = `rgba(${v},${v},${v},${0.1 + r() * 0.18})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, true, true);
}

export interface PBR { color?: string; rough?: number; metal?: number; map?: THREE.Texture | null; roughMap?: THREE.Texture | null; emissive?: string; ei?: number; alpha?: number; side?: THREE.Side; env?: number }
export function pbr(name: string, o: PBR = {}) {
  const m = new THREE.MeshStandardMaterial({ name, color: o.color ?? '#cccccc', roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, map: o.map ?? null, roughnessMap: o.roughMap ?? null, emissive: o.emissive ?? '#000000', emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide });
  if (o.alpha !== undefined && o.alpha < 1) { m.transparent = true; m.opacity = o.alpha; m.depthWrite = false; }
  return m;
}

let MAXSEG = 2; export const setMaxSeg = (n: number) => { MAXSEG = n; };
/** 角丸ボックス。分割数は部品の大きさと品質で自動的に絞る（三角形数の抑制） */
export const rbox = (w: number, h: number, d: number, r = 0.01, seg = 3) => { const s = Math.max(1, Math.min(seg, MAXSEG, Math.max(w, h, d) < 0.4 ? 1 : 99)); return new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)); };
/** 角丸矩形（XY）の輪郭 */
export function rrShape(w: number, h: number, r: number) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
/** 面取り付き押し出し（厚み depth、面取り bevel） */
export function extrude(shape: THREE.Shape, depth: number, bevel = 0.004, curveSeg = 10) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: curveSeg });
  g.translate(0, 0, -depth / 2); return g;
}
export function ring(w: number, h: number, r: number, t: number, depth: number, seg = 3) { const s = rrShape(w, h, r); s.holes.push(rrShape(w - t * 2, h - t * 2, Math.max(0.001, r - t)) as unknown as THREE.Path); return extrude(s, depth, 0, seg); }

/** ブーリアン演算（差・和）。結果は単一ジオメトリ */
const ev = new Evaluator(); ev.useGroups = false; ev.attributes = ['position', 'normal', 'uv'];
function brush(g: THREE.BufferGeometry, m?: THREE.Matrix4) { const b = new Brush(g.clone()); if (m) { b.applyMatrix4(m); } b.updateMatrixWorld(); return b; }
export function csgSub(base: THREE.BufferGeometry, cutters: { g: THREE.BufferGeometry; m?: THREE.Matrix4 }[]) {
  let cur = brush(base); for (const c of cutters) { const r = ev.evaluate(cur, brush(c.g, c.m), SUBTRACTION); r.updateMatrixWorld(); cur = new Brush(r.geometry); cur.updateMatrixWorld(); }
  return cur.geometry as THREE.BufferGeometry;
}
export function csgAdd(a: THREE.BufferGeometry, b: THREE.BufferGeometry) { const r = ev.evaluate(brush(a), brush(b), ADDITION); return r.geometry as THREE.BufferGeometry; }
export const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

/** 同一材質の小部品をまとめて1メッシュにする */
export class Parts {
  private map = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(mat: THREE.Material, g: THREE.BufferGeometry, m?: THREE.Matrix4) { const c = g.clone(); if (!c.attributes.uv) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2)); if (m) c.applyMatrix4(m); const a = this.map.get(mat) ?? []; a.push(c.index ? c : c); this.map.set(mat, a); return this; }
  /** 同一材質をインデックス付きで統合（ファイルサイズを抑える） */
  build(name: string, parent: THREE.Object3D) {
    for (const [mat, gs] of this.map) {
      const norm = gs.map(g => { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); if (!g.attributes.normal) g.computeVertexNormals(); return g.index ? g : mergeVertices(g, 1e-4); });
      const merged = mergeGeometries(norm, false); if (!merged) continue; const mesh = new THREE.Mesh(merged, mat); mesh.name = `${name}_${mat.name}`; mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    }
  }
}
export function mesh(g: THREE.BufferGeometry, m: THREE.Material, name: string, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(g, m); o.name = name; o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; }
export function triCount(o: THREE.Object3D) { let n = 0; o.traverse(c => { const m = c as THREE.Mesh; if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); return Math.round(n); }
export const FONT = '"Noto Sans JP","WenQuanYi Zen Hei",sans-serif';
