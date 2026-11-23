import * as THREE from 'three';
import { Parts, rbox, ring, csgSub, T, mesh, extrude, rrShape, tex, FONT } from './kit';

/** 313系を参考にした先頭車の前頭部（貫通型・2枚の前面窓・中央貫通扉・行先表示器・前照灯/尾灯・排障器・連結器）。
 *  前面は上部が後退するやや傾斜した面で、断面を連続的に変化させたロフト形状（角が丸い）として作り、窓・扉・灯具の凹みをCSGで抜く。 */
export interface FrontCtx { P: Parts; root: THREE.Group; M: Record<string, THREE.Material>; LEN: number; W: number; TOP: number; SILL: number; profile: (w: number, top: number, sill: number) => THREE.Shape; tube: (a: THREE.Vector3, b: THREE.Vector3, r: number, seg?: number) => THREE.BufferGeometry; hi: boolean }

const signedVolume = (g: THREE.BufferGeometry) => { const p = g.attributes.position, ix = g.index!; let v = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(); for (let i = 0; i < ix.count; i += 3) { a.fromBufferAttribute(p, ix.getX(i)); b.fromBufferAttribute(p, ix.getX(i + 1)); c.fromBufferAttribute(p, ix.getX(i + 2)); v += a.dot(b.clone().cross(c)) / 6; } return v; };

export function buildCabFront(c: FrontCtx) {
  const { P, root, M, LEN, W, TOP, SILL, hi } = c; const depth = 0.46; const S = hi ? 9 : 5; const X0 = LEN / 2; const XF = X0 + depth; const K = 0.22 / (TOP - 1.4); const ANG = Math.atan(K);
  const rake = (y: number) => K * Math.max(0, y - 1.4); const faceX = (y: number) => XF - rake(y);
  // ---- ロフト形状の前頭部 ----
  const base = c.profile(W - 0.02, TOP - 0.02, SILL).getPoints(hi ? 9 : 4); if (base[0].distanceTo(base[base.length - 1]) < 1e-6) base.pop(); const N = base.length;
  const pos: number[] = []; const idx: number[] = [];
  for (let i = 0; i <= S; i++) { const t = i / S; const e = t * t; for (const p of base) { const zz = p.x * (1 - 0.05 * e); const roof = Math.max(0, (p.y - 2.5) / 1.1); const yy = p.y - 0.26 * e * roof * roof * 0 - 0.2 * e * roof; pos.push(X0 + depth * t - rake(p.y) * t, yy, zz); } }
  for (let i = 0; i < S; i++) for (let j = 0; j < N; j++) { const a = i * N + j, b = i * N + (j + 1) % N, c2 = (i + 1) * N + j, d = (i + 1) * N + (j + 1) % N; idx.push(a, b, c2, b, d, c2); }
  const cy = (SILL + TOP) / 2; const cb = pos.length / 3; pos.push(X0, cy, 0); const cf = pos.length / 3; pos.push(XF - rake(cy), cy - 0.2 * 0.3, 0);
  for (let j = 0; j < N; j++) { const a = (j + 1) % N; idx.push(cb, j, a); const o = S * N; idx.push(cf, o + a, o + j); }
  const nose = new THREE.BufferGeometry(); nose.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); nose.setIndex(idx); nose.computeVertexNormals();
  if (signedVolume(nose) < 0) { const ix = nose.index!; for (let i = 0; i < ix.count; i += 3) { const t = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, t); } } nose.computeVertexNormals();
  if (!nose.attributes.uv) nose.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  // ---- 凹み（窓・扉・表示器・灯具・番号板・連結器口）をCSGで抜く ----
  const cut = (w: number, h: number, d: number, r: number, y: number, z: number, dx = 0) => ({ g: rbox(d, h, w, r), m: T(faceX(y) + dx, y, z, 0, 0, ANG) });
  const cutters = [cut(1.1, 0.8, 0.2, 0.09, 2.78, 0.66), cut(1.1, 0.8, 0.2, 0.09, 2.78, -0.66), cut(0.78, 1.86, 0.2, 0.05, 2.12, 0), cut(0.98, 0.24, 0.2, 0.04, 3.42, 0), cut(0.4, 0.36, 0.2, 0.06, 1.5, 1.14), cut(0.4, 0.36, 0.2, 0.06, 1.5, -1.14), cut(0.34, 0.1, 0.2, 0.02, 1.05, 0), cut(0.5, 0.3, 0.3, 0.05, 0.92, 0)];
  const front = csgSub(nose, cutters); root.add(mesh(front, M.stainless, 'FrontCap'));
  const fp = (y: number, z: number, dx = 0) => new THREE.Vector3(faceX(y) + dx, y, z);
  const at = (y: number, z: number, dx: number, lx = 0, ly = 0, lz = 0) => new THREE.Matrix4().multiplyMatrices(T(faceX(y) + dx, y, z, 0, 0, ANG), T(lx, ly, lz));
  // ---- 前面窓：ゴムパッキン・ガラス・ワイパー ----
  for (const z of [0.66, -0.66]) {
    const gk = ring(1.16, 0.86, 0.1, 0.06, 0.03, hi ? 4 : 1); gk.rotateY(Math.PI / 2); P.add(M.rubber, gk, at(2.78, z, 0.012));
    P.add(M.glass, rbox(0.03, 0.76, 1.06, 0.07), at(2.78, z, -0.05));
    P.add(M.steel, ring(1.2, 0.9, 0.11, 0.025, 0.012, 2).rotateY(Math.PI / 2), at(2.78, z, 0.035));
    if (hi) { const sgn = z > 0 ? 1 : -1; const p0 = fp(2.42, z - sgn * 0.42, 0.06), p1 = fp(2.95, z + sgn * 0.3, 0.06); P.add(M.black, c.tube(p0, p1, 0.011, 6)); P.add(M.black, c.tube(p0.clone().add(new THREE.Vector3(0.0, 0.0, 0)), p0.clone().add(new THREE.Vector3(0.02, 0.06, sgn * 0.1)), 0.016, 6)); P.add(M.steel, new THREE.CylinderGeometry(0.02, 0.02, 0.04, 10), at(2.4, z - sgn * 0.42, 0.045, 0, 0, 0)); P.add(M.black, new THREE.CylinderGeometry(0.007, 0.007, 0.05, 6), at(3.22, z - sgn * 0.3, 0.04)); }
  }
  // ---- 貫通扉（中央）----
  P.add(M.dark, rbox(0.04, 1.82, 0.74, 0.025), at(2.12, 0, -0.03)); P.add(M.glass, rbox(0.03, 0.6, 0.46, 0.05), at(2.62, 0, 0.0)); P.add(M.steel, ring(0.5, 0.64, 0.05, 0.02, 0.012, 2).rotateY(Math.PI / 2), at(2.62, 0, 0.022));
  P.add(M.steel, rbox(0.02, 0.1, 0.03, 0.008), at(2.0, 0.28, 0.03)); P.add(M.steel, rbox(0.012, 0.16, 0.02, 0.006), at(2.0, 0.3, 0.036)); P.add(M.black, rbox(0.006, 1.8, 0.008, 0.002), at(2.12, 0.36, 0.0)); P.add(M.black, rbox(0.006, 1.8, 0.008, 0.002), at(2.12, -0.36, 0.0));
  for (const dy of [-0.8, 0.0, 0.8]) P.add(M.steel, rbox(0.016, 0.08, 0.028, 0.006), at(2.12 + dy, -0.38, 0.02));
  // ---- 行先表示器（上部中央）----
  P.add(M.black, rbox(0.03, 0.22, 0.96, 0.03), at(3.42, 0, -0.03)); const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.18), M.frontDest); dm.rotation.y = Math.PI / 2; dm.rotation.z = ANG; dm.position.copy(fp(3.42, 0, -0.008)); dm.name = 'FrontDestination'; root.add(dm);
  P.add(M.steel, ring(1.0, 0.26, 0.04, 0.02, 0.012, 2).rotateY(Math.PI / 2), at(3.42, 0, 0.012));
  // ---- 灯具：前照灯（上）・尾灯（下）・標識灯 ----
  for (const z of [1.14, -1.14]) { P.add(M.steel, ring(0.44, 0.4, 0.07, 0.03, 0.02, 2).rotateY(Math.PI / 2), at(1.5, z, 0.014)); P.add(M.dark, rbox(0.05, 0.34, 0.38, 0.06), at(1.5, z, -0.03));
    const hl = new THREE.CylinderGeometry(0.075, 0.075, 0.03, hi ? 24 : 10); hl.rotateZ(Math.PI / 2); P.add(M.head, hl, at(1.6, z, 0.0)); const tl = new THREE.CylinderGeometry(0.045, 0.045, 0.03, hi ? 18 : 8); tl.rotateZ(Math.PI / 2); P.add(M.tail, tl, at(1.4, z * 0.95, 0.0)); P.add(M.steel, new THREE.TorusGeometry(0.082, 0.007, 6, hi ? 24 : 10).rotateY(Math.PI / 2), at(1.6, z, 0.012)); }
  // ---- 帯（オレンジ・青）：前面を横断 ----
  P.add(M.orange, new THREE.BoxGeometry(0.01, 0.1, W - 0.1), at(1.02, 0, 0.004)); P.add(M.blue, new THREE.BoxGeometry(0.01, 0.1, W - 0.1), at(0.88, 0, 0.004));
  // ---- 車号板・手すり・渡り板 ----
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.08), M.plate); plate.rotation.y = Math.PI / 2; plate.position.copy(fp(1.05, 0, 0.008)); plate.name = 'FrontNumberPlate'; root.add(plate);
  for (const z of [0.5, -0.5]) P.add(M.steel, c.tube(fp(1.55, z, 0.07), fp(2.3, z, 0.07), 0.014, 8));
  for (const z of [0.5, -0.5]) for (const y of [1.55, 2.3]) P.add(M.steel, c.tube(fp(y, z, 0.07), fp(y, z, 0.0), 0.012, 6));
  P.add(M.steel, rbox(0.3, 0.012, 0.7, 0.004), T(XF - 0.08, 1.12, 0));
  // ---- 排障器（スカート）・連結器・ホース ----
  const pilotShape = rrShape(2.0, 0.34, 0.07); const pilot = extrude(pilotShape, 0.34, 0.03, hi ? 6 : 2); pilot.rotateY(Math.PI / 2); P.add(M.dark, pilot, T(XF - 0.1, 0.72, 0, 0, 0, 0));
  for (let k = -3; k <= 3; k++) P.add(M.dark, rbox(0.05, 0.28, 0.03, 0.008, 1), T(XF + 0.1, 0.72, k * 0.28));
  P.add(M.steel, rbox(0.34, 0.26, 0.36, 0.05), T(XF + 0.08, 0.95, 0)); const nose2 = new THREE.CylinderGeometry(0.085, 0.12, 0.22, hi ? 16 : 8); nose2.rotateZ(-Math.PI / 2); P.add(M.dark, nose2, T(XF + 0.3, 0.95, 0)); P.add(M.dark, rbox(0.1, 0.14, 0.12, 0.02), T(XF + 0.42, 0.95, 0));
  if (hi) { for (const z of [-0.34, 0.34]) { P.add(M.rubber, c.tube(new THREE.Vector3(XF + 0.12, 0.88, z), new THREE.Vector3(XF + 0.3, 0.76, z * 1.3), 0.018, 6)); P.add(M.steel, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), T(XF + 0.3, 0.76, z * 1.3)); } for (const z of [-0.58, 0.58]) P.add(M.black, rbox(0.06, 0.1, 0.12, 0.012), T(XF + 0.1, 0.84, z)); for (const z of [-1.0, 1.0]) { P.add(M.steel, rbox(0.14, 0.012, 0.3, 0.004), T(XF - 0.05, 0.6, z)); P.add(M.steel, rbox(0.1, 0.012, 0.26, 0.004), T(XF - 0.04, 0.48, z)); } }
  // ---- 屋根前端：警笛カバー・アンテナ・標識灯 ----
  if (hi) { for (const z of [-0.3, 0.3]) { const hn = new THREE.CylinderGeometry(0.02, 0.07, 0.12, 12); P.add(M.dark, hn, T(XF - 0.7, TOP + 0.06, z)); } P.add(M.steel, c.tube(new THREE.Vector3(XF - 1.4, TOP + 0.02, 0.7), new THREE.Vector3(XF - 1.4, TOP + 0.3, 0.7), 0.008, 6)); P.add(M.black, rbox(0.12, 0.05, 0.2, 0.015), T(XF - 1.4, TOP + 0.03, 0.7)); P.add(M.white, rbox(0.8, 0.07, 0.5, 0.03), T(XF - 1.9, TOP + 0.04, -0.4)); }
  return { faceX, ANG };
}

export function frontTextures() {
  const dest = tex(256, 64, (g, w, h) => { g.fillStyle = '#040404'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff9a2e'; g.font = `bold 34px ${FONT}`; g.fillText('普通', 10, 42); g.fillText('海浜口', 110, 42); });
  const plate = tex(256, 64, (g, w, h) => { g.fillStyle = '#d8dadc'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a2230'; g.font = `bold 30px ${FONT}`; g.textAlign = 'center'; g.fillText('313-5001', w / 2, 42); g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); });
  return { dest, plate };
}
