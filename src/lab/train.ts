import * as THREE from 'three';
import { buildCabFront, frontTextures } from './trainFront';
import { Parts, pbr, rbox, rrShape, extrude, ring, csgSub, T, tex, brushedRough, mesh, FONT, rnd, setMaxSeg } from './kit';

/** JR東海313系（3扉・ステンレス車体）を参考にした車両モデル。
 *  寸法の根拠：車体長 約19.5m、車体幅 約2.95m、屋根高 約3.6m、床面高さ 約1.2m（レール頭頂から）、軌間1,067mm、車輪径 約860mm。
 *  細部（機器配置・形状）は公開写真からの推定で、実車図面との照合は未実施。原点はレール頭頂面・車体中心、長手が x、前頭部は +x。 */
export type Detail = 'high' | 'low';
const LEN = 19.5, W = 2.95, TOP = 3.62, SILL = 0.8, FLOOR = 1.2, HW = W / 2;

function bodyProfile(w: number, top: number, sill: number) {
  const hw = w / 2; const s = new THREE.Shape(); s.moveTo(-hw, sill); s.lineTo(hw, sill); s.lineTo(hw, top - 0.78); s.quadraticCurveTo(hw, top - 0.18, hw - 0.55, top - 0.06); s.quadraticCurveTo(hw - 0.95, top, 0, top); s.quadraticCurveTo(-hw + 0.95, top, -hw + 0.55, top - 0.06); s.quadraticCurveTo(-hw, top - 0.18, -hw, top - 0.78); s.lineTo(-hw, sill); return s;
}
function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 8) {
  const d = b.clone().sub(a); const len = d.length(); const g = new THREE.CylinderGeometry(r, r, len, seg); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.applyQuaternion(q); const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
}
function wheelGeo(seg: number) {
  const pts = [[0.07, -0.07], [0.07, 0.07], [0.28, 0.07], [0.42, 0.065], [0.43, 0.05], [0.43, -0.045], [0.462, -0.055], [0.462, -0.07], [0.28, -0.07]].map(([r, a]) => new THREE.Vector2(r, a));
  const g = new THREE.LatheGeometry(pts, seg); g.rotateX(Math.PI / 2); return g;
}
function spring(r: number, h: number, turns: number) {
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: turns * 10 + 1 }, (_, i) => { const t = i / (turns * 10); const a = t * turns * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, t * h, Math.sin(a) * r); }));
  return new THREE.TubeGeometry(curve, turns * 16, 0.009, 6, false);
}

const textures = () => ({
  moq: tex(256, 256, (g, w, h) => { g.fillStyle = '#23508f'; g.fillRect(0, 0, w, h); const r = rnd(9); for (let i = 0; i < 1800; i++) { g.fillStyle = r() > 0.5 ? 'rgba(160,200,255,.28)' : 'rgba(5,20,50,.3)'; g.fillRect(r() * w, r() * h, 3, 3); } g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 32 + 16); g.lineTo(w, i * 32 + 16); g.stroke(); } }, true, true),
  floor: tex(256, 256, (g, w, h) => { g.fillStyle = '#8c8f91'; g.fillRect(0, 0, w, h); const r = rnd(4); for (let i = 0; i < 2400; i++) { g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},.05)`; g.fillRect(r() * w, r() * h, 2, 2); } g.fillStyle = '#d9c04a'; g.fillRect(0, 0, w, 10); }, true, true),
  dest: tex(256, 64, (g, w, h) => { g.fillStyle = '#040404'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff9a2e'; g.font = `bold 34px ${FONT}`; g.fillText('普通', 10, 42); g.fillText('海浜口', 110, 42); }),
  num: tex(256, 64, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); g.fillStyle = '#26303a'; g.font = `bold 30px ${FONT}`; g.fillText('クモハ313-5001', 4, 40); })
});

export function trainCar(kind: 'cab' | 'mid', detail: Detail = 'high') {
  const hi = detail === 'high'; setMaxSeg(hi ? 2 : 1); const root = new THREE.Group(); root.name = `Train313_${kind}_${detail}`; const P = new Parts(); const tx = textures();
  const stainless = pbr('Stainless', { color: '#d5dade', metal: 0.9, rough: 0.34, roughMap: brushedRough(7, 0.34) });
  const trim = pbr('BodyTrim', { color: '#9aa2a8', metal: 0.85, rough: 0.4 }); const dark = pbr('UnderDark', { color: '#2b2f33', metal: 0.55, rough: 0.55 }); const black = pbr('Black', { color: '#0b0c0d', rough: 0.85 });
  const glass = pbr('WindowGlass', { color: '#1a2a33', metal: 0.2, rough: 0.08, alpha: 0.5, side: THREE.DoubleSide }); const orange = pbr('StripeOrange', { color: '#e8801f', rough: 0.4, metal: 0.2 }); const teal = pbr('StripeBlue', { color: '#1b5fa8', rough: 0.4, metal: 0.2 });
  const rubber = pbr('Rubber', { color: '#18191a', rough: 0.95 }); const steelM = pbr('Steel', { color: '#7e868c', metal: 0.85, rough: 0.45 }); const roofM = pbr('Roof', { color: '#aeb4b9', metal: 0.5, rough: 0.55 }); const white = pbr('RoofWhite', { color: '#e8eaec', rough: 0.55 });
  const cushion = pbr('Moquette', { color: '#ffffff', map: tx.moq, rough: 0.9 }); const floorM = pbr('Floor', { color: '#ffffff', map: tx.floor, rough: 0.8 }); const ceiling = pbr('Ceiling', { color: '#e9e9e4', rough: 0.8 }); const lampM = pbr('CeilingLight', { color: '#fff7dd', emissive: '#fff2c0', ei: 1.4 });
  const headM = pbr('HeadLight', { color: '#fffbe8', emissive: '#fff4c8', ei: 1.8 }); const tailM = pbr('TailLight', { color: '#ff3a2a', emissive: '#ff2a1a', ei: 1.3 });

  // ---- 車体殻（外板−内側）→ ドア・窓の開口をCSGで抜く ----
  const outer = extrude(bodyProfile(W, TOP, SILL), LEN, 0, hi ? 7 : 4); outer.rotateY(Math.PI / 2);
  const inner = extrude(bodyProfile(W - 0.12, TOP - 0.06, SILL + 0.06), LEN - 0.24, 0, hi ? 7 : 4); inner.rotateY(Math.PI / 2);
  const doorX = kind === 'mid' ? [-6.2, 0, 6.2] : [-6.8, -1.4]; const doorW = 1.3, doorH = 1.86, doorY = FLOOR + 0.06 + doorH / 2;
  const winH = 1.04, winY = FLOOR + 0.95 + winH / 2 + 0.0;
  const segs: [number, number][] = []; const edges = [-LEN / 2 + 0.3, ...doorX.flatMap(x => [x - doorW / 2 - 0.12, x + doorW / 2 + 0.12]), (kind === 'cab' ? 3.6 : LEN / 2 - 0.3)];
  for (let i = 0; i < edges.length; i += 2) segs.push([edges[i], edges[i + 1]]);
  const cutters: THREE.BufferGeometry[] = []; const side = (s: number, fn: (x: number, y: number, w: number, h: number, r: number) => void) => { void s; void fn; };
  void side;
  const mkCut = (s: number) => { const gs: THREE.BufferGeometry[] = [];
    for (const x of doorX) { const g = hi ? rbox(doorW, doorH, 0.4, 0.04) : new THREE.BoxGeometry(doorW, doorH, 0.4); g.applyMatrix4(T(x, doorY, s * (HW - 0.02))); gs.push(g); }
    for (const [a, b] of segs) { const n = Math.max(1, Math.round((b - a) / 1.15)); const pw = 0.1; const ww = (b - a - pw * (n - 1)) / n; if (ww < 0.4) continue; for (let k = 0; k < n; k++) { const g = hi ? rbox(ww, winH, 0.4, 0.05) : new THREE.BoxGeometry(ww, winH, 0.4); g.applyMatrix4(T(a + ww / 2 + k * (ww + pw), winY, s * (HW - 0.02))); gs.push(g); } }
    if (kind === 'cab') { const g = rbox(0.74, 1.8, 0.4, 0.04); g.applyMatrix4(T(6.55, FLOOR + 0.06 + 0.9, s * (HW - 0.02))); gs.push(g); }
    return gs; };
  for (const s of [-1, 1]) cutters.push(...mkCut(s));
  // 小さな開口は個別にCSG（演算回数を抑えるため側面ごと）
  const merge = (gs: THREE.BufferGeometry[]) => { const m = new THREE.BufferGeometry(); const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = []; let off = 0; for (const g of gs) { const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); } const ix = g.index; if (ix) for (let i = 0; i < ix.count; i++) idx.push(ix.getX(i) + off); else for (let i = 0; i < p.count; i++) idx.push(i + off); off += p.count; } m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.setIndex(idx); return m; };
  let shell = csgSub(outer, [{ g: inner }]); shell = csgSub(shell, [{ g: merge(cutters.filter((_, i) => i < cutters.length / 2)) }, { g: merge(cutters.filter((_, i) => i >= cutters.length / 2)) }]);
  root.add(mesh(shell, stainless, 'Body'));

  // ---- 帯（オレンジ・青）：ドア開口でとぎれる ----
  const stripeSegs = (z: number) => { const xs = [-LEN / 2 + 0.05, ...doorX.flatMap(x => [x - doorW / 2 - 0.05, x + doorW / 2 + 0.05]), (kind === 'cab' ? 3.9 : LEN / 2 - 0.05)]; for (let i = 0; i < xs.length; i += 2) { const a = xs[i], b = xs[i + 1]; if (b - a < 0.2) continue; P.add(orange, new THREE.BoxGeometry(b - a, 0.1, 0.012), T((a + b) / 2, 1.5, z)); P.add(teal, new THREE.BoxGeometry(b - a, 0.1, 0.012), T((a + b) / 2, 1.34, z)); } };
  stripeSegs(HW + 0.004); stripeSegs(-HW - 0.004);
  // ---- 窓ガラス・窓枠・ドア ----
  for (const s of [-1, 1]) {
    for (const x of doorX) { const fr = ring(doorW + 0.1, doorH + 0.1, 0.05, 0.05, 0.022, hi ? 3 : 1); P.add(trim, fr, T(x, doorY, s * (HW + 0.002))); }
    for (const [a, b] of segs) { const n = Math.max(1, Math.round((b - a) / 1.15)); const pw = 0.1; const ww = (b - a - pw * (n - 1)) / n; if (ww < 0.4) continue; for (let k = 0; k < n; k++) { const cx = a + ww / 2 + k * (ww + pw); P.add(trim, ring(ww + 0.05, winH + 0.05, 0.05, 0.03, 0.018, hi ? 3 : 1), T(cx, winY, s * (HW + 0.002))); P.add(glass, new THREE.BoxGeometry(ww, winH, 0.012), T(cx, winY, s * (HW - 0.045))); } }
    for (const [di, x] of doorX.entries()) for (const k of [-1, 1]) {
      const leaf = new THREE.Group(); leaf.name = `Door_${s > 0 ? 'P' : 'N'}_${di}_${k < 0 ? 'L' : 'R'}`; leaf.position.set(x + k * (doorW / 4 + 0.01), doorY, s * (HW - 0.035)); leaf.userData = { slide: k * (doorW / 2 - 0.03), base: leaf.position.x };
      let lf: THREE.BufferGeometry = rbox(doorW / 2 - 0.02, doorH - 0.04, 0.04, 0.012, 3); lf = csgSub(lf, [{ g: rbox(0.4, 0.74, 0.2, 0.03), m: T(0, 0.38, 0) }]); leaf.add(mesh(lf, stainless, 'DoorLeaf'));
      leaf.add(mesh(new THREE.BoxGeometry(0.4, 0.74, 0.01), glass, 'DoorGlass', 0, 0.38, 0)); leaf.add(mesh(rbox(0.05, 1.5, 0.05, 0.01), rubber, 'DoorRubber', -k * (doorW / 4 - 0.02), -0.1, 0.0));
      root.add(leaf);
    }
  }
  // 側面の行先表示器・車号
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.16), new THREE.MeshStandardMaterial({ name: 'SideDest', map: tx.dest, emissiveMap: tx.dest, emissive: '#fff', emissiveIntensity: 0.9 })); m.position.set(kind === 'mid' ? 3.2 : -3.9, 3.22, s * (HW + 0.004)); m.rotation.y = s > 0 ? 0 : Math.PI; m.name = 'SideDestination'; root.add(m); P.add(dark, rbox(0.66, 0.2, 0.02, 0.01), T(kind === 'mid' ? 3.2 : -3.9, 3.22, s * (HW + 0.0)));
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.2), new THREE.MeshStandardMaterial({ name: 'CarNumber', map: tx.num, transparent: true, roughness: 0.5 })); nm.position.set(kind === 'mid' ? -8.0 : -8.2, 2.5, s * (HW + 0.006)); nm.rotation.y = s > 0 ? 0 : Math.PI; nm.name = 'CarNumber'; if (hi) root.add(nm); }
  // ---- 屋根・屋根上機器 ----
  P.add(roofM, rbox(LEN - 0.5, 0.05, 1.5, 0.02), T(0, TOP + 0.01, 0));
  for (const x of [-3.4, 3.6]) { P.add(white, rbox(2.05, 0.34, 1.75, 0.07, 4), T(x, TOP + 0.2, 0)); if (hi) for (let k = 0; k < 9; k++) P.add(dark, new THREE.BoxGeometry(0.012, 0.01, 1.5), T(x - 0.8 + k * 0.2, TOP + 0.375, 0)); P.add(steelM, rbox(2.15, 0.05, 1.85, 0.02), T(x, TOP + 0.03, 0)); }
  if (hi) { for (const z of [-0.6, 0.6]) P.add(dark, new THREE.CylinderGeometry(0.03, 0.03, LEN - 2, 8), T(0, TOP + 0.07, z, 0, 0, Math.PI / 2)); P.add(dark, rbox(0.5, 0.18, 0.4, 0.04), T(-8.0, TOP + 0.13, 0.5)); P.add(steelM, new THREE.CylinderGeometry(0.01, 0.01, 0.5, 6), T(-7.0, TOP + 0.28, -0.7)); }
  // ---- パンタグラフ（先頭車のみ・上昇状態：集電舞い高さは架線高さ約4.6m）----
  if (kind === 'cab') {
    const px = -4.0, hp = hi ? 10 : 6; const BASE = TOP + 0.06, COL = 4.6; const v = (x: number, y: number, z: number) => new THREE.Vector3(px + x, y, z);
    for (const z of [-0.62, 0.62]) { P.add(white, new THREE.CylinderGeometry(0.06, 0.07, 0.18, hp), T(px - 0.35, BASE + 0.09, z)); P.add(white, new THREE.CylinderGeometry(0.06, 0.07, 0.18, hp), T(px + 0.35, BASE + 0.09, z)); }
    P.add(steelM, rbox(1.0, 0.06, 1.5, 0.02), T(px, BASE + 0.2, 0));
    const knee = v(0.1, (BASE + COL) / 2 + 0.05, 0);
    for (const z of [-0.5, 0.5]) { P.add(steelM, tube(v(-0.35, BASE + 0.22, z), v(0.12, knee.y, z), 0.026, hp)); P.add(steelM, tube(v(0.35, BASE + 0.22, z), v(0.0, knee.y + 0.05, z), 0.018, hp)); P.add(steelM, tube(v(0.12, knee.y, z), v(-0.02, COL - 0.04, z * 0.85), 0.022, hp)); P.add(steelM, tube(v(0.0, knee.y + 0.05, z), v(0.14, COL - 0.04, z * 0.85), 0.016, hp)); }
    P.add(steelM, tube(v(0.12, knee.y, -0.5), v(0.12, knee.y, 0.5), 0.02, hp)); P.add(steelM, tube(v(-0.02, COL - 0.04, -0.42), v(-0.02, COL - 0.04, 0.42), 0.018, hp));
    P.add(black, rbox(0.1, 0.045, 1.95, 0.012), T(px + 0.04, COL, 0)); P.add(dark, rbox(0.04, 0.03, 1.9, 0.008), T(px + 0.04, COL + 0.03, 0));
    for (const z of [-0.98, 0.98]) P.add(steelM, tube(v(0.04, COL, z), v(0.04, COL + 0.07, z * 1.03), 0.012, 6));
  }
  // ---- 台車：側ばり・輪軸・軸ばね・ブレーキ円板・主電動機 ----
  const wSeg = hi ? 40 : 18; const bogieXs = [-6.8, 6.8]; const wheels: THREE.Group[] = [];
  bogieXs.forEach((bx, bi) => {
    const bg = new THREE.Group(); bg.name = `Bogie_${bi}`; bg.position.set(bx, 0, 0); const BP = new Parts();
    for (const z of [-0.93, 0.93]) { BP.add(dark, rbox(2.6, 0.2, 0.12, 0.03, 3), T(0, 0.98, z)); BP.add(dark, rbox(0.5, 0.3, 0.14, 0.04), T(0, 1.06, z * 0.99)); }
    BP.add(dark, rbox(0.3, 0.22, 1.76, 0.04), T(0.0, 1.0, 0)); BP.add(dark, rbox(0.18, 0.18, 1.7, 0.03), T(-0.7, 0.98, 0)); BP.add(dark, rbox(0.18, 0.18, 1.7, 0.03), T(0.7, 0.98, 0));
    if (hi) { BP.add(dark, new THREE.CylinderGeometry(0.2, 0.2, 0.5, 20), T(0.4, 0.62, 0.0, Math.PI / 2, 0, 0)); BP.add(dark, rbox(0.34, 0.34, 0.3, 0.06), T(0.65, 0.5, 0.5)); }
    for (const ax of [-1.05, 1.05]) {
      const a = new THREE.Group(); a.name = `Wheelset_${bi}_${ax < 0 ? 0 : 1}`; a.position.set(ax, 0.43, 0); const AP = new Parts();
      AP.add(steelM, new THREE.CylinderGeometry(0.06, 0.06, 2.0, hi ? 16 : 8), T(0, 0, 0, Math.PI / 2, 0, 0));
      for (const z of [-0.5335, 0.5335]) { const wg = wheelGeo(wSeg); if (z < 0) wg.rotateY(Math.PI); AP.add(steelM, wg, T(0, 0, z)); }
      if (hi) { for (const z of [-0.28, 0.28]) { const d = new THREE.CylinderGeometry(0.27, 0.27, 0.025, 36); d.rotateX(Math.PI / 2); AP.add(dark, d, T(0, 0, z)); } }
      AP.build('WheelParts', a); a.userData = { wheel: true }; bg.add(a); wheels.push(a);
      for (const z of [-0.93, 0.93]) { BP.add(dark, rbox(0.3, 0.26, 0.2, 0.05), T(ax, 0.43, z * 1.03)); if (hi) { const sp = spring(0.07, 0.3, 5); BP.add(steelM, sp, T(ax * 0.98, 0.58, z * 0.96)); } }
    }
    if (hi) for (const z of [-0.95, 0.95]) { BP.add(steelM, tube(new THREE.Vector3(-0.9, 0.7, z * 1.05), new THREE.Vector3(-0.5, 1.12, z * 1.05), 0.022, 8)); BP.add(steelM, tube(new THREE.Vector3(0.9, 0.7, z * 1.05), new THREE.Vector3(0.5, 1.12, z * 1.05), 0.022, 8)); }
    BP.build('BogieParts', bg); root.add(bg);
  });
  // ---- 床下機器 ----
  const UF = FLOOR - 0.08;
  P.add(dark, rbox(2.4, 0.5, 1.5, 0.05), T(-3.2, UF - 0.31, 0)); P.add(dark, rbox(2.0, 0.42, 1.4, 0.05), T(2.6, UF - 0.27, 0));
  if (hi) { for (let k = 0; k < 14; k++) P.add(steelM, new THREE.BoxGeometry(0.012, 0.18, 1.3), T(-4.2 + k * 0.15, UF - 0.65, 0)); for (const z of [-0.5, 0.5]) P.add(dark, new THREE.CylinderGeometry(0.17, 0.17, 1.4, 20), T(0.2, UF - 0.2, z * 0.6, 0, 0, Math.PI / 2)); P.add(dark, rbox(0.8, 0.3, 1.0, 0.04), T(-0.8, UF - 0.2, 0)); P.add(steelM, new THREE.CylinderGeometry(0.1, 0.1, 0.5, 14), T(4.6, UF - 0.2, 0.5, Math.PI / 2, 0, 0)); }
  P.add(dark, rbox(LEN - 1.2, 0.08, W - 0.3, 0.03), T(0, SILL + 0.06, 0, 0, 0, 0)); // スカート（腰板）
  // ---- 台枠・床 ----
  P.add(floorM, new THREE.BoxGeometry(LEN - 0.4, 0.03, W - 0.2), T(0, FLOOR - 0.012, 0));
  if (hi) {
    // 座席（ロングシート）：ドア間に配置
    const seatSegs = kind === 'mid' ? [[-9.2, -7.0], [-5.4, -0.9], [0.9, 5.4], [7.0, 9.2]] : [[-9.2, -7.8], [-5.8, -2.4], [0.0, 3.2]];
    for (const [a, b] of seatSegs) { const l = b - a; const cx = (a + b) / 2; for (const s of [-1, 1]) { const zc = s * (HW - 0.06 - 0.26); P.add(dark, rbox(l, 0.26, 0.46, 0.02), T(cx, FLOOR + 0.16, zc)); P.add(cushion, rbox(l, 0.1, 0.48, 0.04, 3), T(cx, FLOOR + 0.36, zc)); P.add(cushion, rbox(l, 0.46, 0.09, 0.04, 3), T(cx, FLOOR + 0.67, s * (HW - 0.06 - 0.06), 0, 0, 0)); for (let k = 1; k < Math.round(l / 0.46); k++) P.add(dark, new THREE.BoxGeometry(0.006, 0.08, 0.4), T(a + k * 0.46, FLOOR + 0.43, zc)); P.add(steelM, rbox(0.06, 0.86, 0.05, 0.01), T(a, FLOOR + 0.62, zc * 0.8)); P.add(steelM, rbox(0.06, 0.86, 0.05, 0.01), T(b, FLOOR + 0.62, zc * 0.8)); } }
    // 手すり・つり革
    for (const z of [-0.5, 0.5]) P.add(steelM, new THREE.CylinderGeometry(0.017, 0.017, LEN - 1.2, 10), T(0, 2.95, z, 0, 0, Math.PI / 2));
    for (const x of doorX) for (const dx of [-doorW / 2 - 0.07, doorW / 2 + 0.07]) P.add(steelM, new THREE.CylinderGeometry(0.02, 0.02, 2.0, 10), T(x + dx, FLOOR + 1.0, HW - 0.12)), P.add(steelM, new THREE.CylinderGeometry(0.02, 0.02, 2.0, 10), T(x + dx, FLOOR + 1.0, -HW + 0.12));
    for (let x = -8.6; x <= 8.6; x += 0.85) for (const z of [-0.5, 0.5]) { P.add(black, new THREE.TorusGeometry(0.04, 0.007, 4, 8), T(x, 2.78, z, Math.PI / 2, 0, 0)); P.add(rubber, new THREE.BoxGeometry(0.012, 0.1, 0.006), T(x, 2.9, z)); }
    // 天井・照明・冷房ダクト
    P.add(ceiling, new THREE.BoxGeometry(LEN - 0.5, 0.03, W - 0.3), T(0, 3.3, 0)); for (const z of [-0.7, 0.7]) for (let x = -8.5; x <= 8.5; x += 1.9) P.add(lampM, new THREE.BoxGeometry(1.2, 0.02, 0.18), T(x, 3.28, z)); P.add(ceiling, rbox(LEN - 1, 0.05, 0.5, 0.02), T(0, 3.24, 0));
  } else { P.add(cushion, new THREE.BoxGeometry(LEN - 3, 0.5, 0.5), T(0, FLOOR + 0.3, HW - 0.35)); P.add(cushion, new THREE.BoxGeometry(LEN - 3, 0.5, 0.5), T(0, FLOOR + 0.3, -HW + 0.35)); P.add(ceiling, new THREE.BoxGeometry(LEN - 0.5, 0.03, W - 0.3), T(0, 3.3, 0)); }
  // ---- 妻面・連結部 ----
  const endX = (s: number) => s * (LEN / 2);
  const gang = (s: number) => { P.add(rubber, ring(1.2, 2.0, 0.12, 0.16, 0.5, 1), new THREE.Matrix4().multiplyMatrices(T(endX(s) + s * 0.28, FLOOR + 1.0, 0), T(0, 0, 0, 0, Math.PI / 2, 0))); P.add(dark, rbox(0.12, 2.1, 1.3, 0.04), T(endX(s) + s * 0.06, FLOOR + 1.0, 0)); P.add(steelM, tube(new THREE.Vector3(endX(s), 0.95, 0), new THREE.Vector3(endX(s) + s * 0.5, 0.95, 0), 0.07, 10)); P.add(dark, rbox(0.3, 0.26, 0.34, 0.05), T(endX(s) + s * 0.3, 0.95, 0)); };
  gang(-1); if (kind === 'mid') gang(1);
  // ---- 先頭部（kind==='cab'：+x側）：trainFront.ts の高精細な前頭部 ----
  if (kind === 'cab') {
    const ft = frontTextures(); const Mf = { stainless, glass, black, dark, steel: steelM, rubber, head: headM, tail: tailM, orange, blue: teal, white, frontDest: new THREE.MeshStandardMaterial({ name: 'FrontDestination', map: ft.dest, emissiveMap: ft.dest, emissive: '#ffffff', emissiveIntensity: 1 }), plate: new THREE.MeshStandardMaterial({ name: 'FrontPlate', map: ft.plate, roughness: 0.5 }) } as Record<string, THREE.Material>;
    buildCabFront({ P, root, M: Mf, LEN, W, TOP, SILL, profile: bodyProfile, tube, hi });
  }
  P.build('Parts', root);
  root.userData = { kind: 'train', variant: kind, detail, length: LEN + (kind === 'cab' ? 0.46 : 0), width: W, height: TOP + 0.4, floor: FLOOR, doorCenters: doorX, wheelCount: wheels.length };
  return root;
}
