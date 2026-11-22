import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createMaterials } from './materials';

/** 313系を参考にした3両編成（簡略モデル）。実車寸法の公開値に基づく概略で、細部は推定。モデルは+x向き、ドア開閉は-z側。 */
export interface TrainRig {
  group: THREE.Group; setDoors(open: number): void; setHeading(dir: 1 | -1): void; wheels: THREE.Object3D[]; length: number;
  dims: { carLength: number; width: number; height: number; cars: number; platformSide: 'z-' };
}

export function buildTrain(): TrainRig {
  const mats = createMaterials(false);
  const group = new THREE.Group(); group.name = '313系参考 3両編成';
  const batches = new Map<string, THREE.BufferGeometry[]>();
  const add = (mat: string, g: THREE.BufferGeometry) => { (batches.get(mat) ?? batches.set(mat, []).get(mat)!).push(g); };
  const box = (mat: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) => { const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(cx, cy, cz); add(mat, g); };
  const doorPanels: { m: THREE.Mesh; base: number; dir: number }[] = [];
  const wheels: THREE.Object3D[] = [];
  const headL: THREE.Mesh[] = []; const tailL: THREE.Mesh[] = [];

  const CAR_L = 19.4, W = 2.9, FLOOR_Y = 1.75;
  const doorXs = [-7.2, -2.4, 2.4, 7.2];
  const winSegs: [number, number][] = [[-9.4, -7.9], [-6.5, -3.1], [-1.7, 1.7], [3.1, 6.5], [7.9, 9.4]];
  const panelMat = mats.steel.mat; const glassMat = mats.glassDark.mat;

  for (let c = 0; c < 3; c++) {
    const cx = (c - 1) * 20.0;
    box('stainless', cx, 2.45, 0, CAR_L, 2.6, W - 0.1);                 // 車体
    box('stainless', cx, 2.45, 0, CAR_L - 0.3, 2.6, W);               // 張り出し
    box('steel', cx, 3.82, 0, CAR_L - 0.2, 0.18, 2.5);               // 屋根
    box('white', cx, 3.93, 0, CAR_L - 1.0, 0.08, 1.9);               // 屋根上部
    box('steelDark', cx, 1.05, 0, CAR_L - 0.6, 0.28, W - 0.3);       // スカート
    for (const s of [-1, 1]) {
      box('teal', cx, 1.62, s * 1.455, CAR_L - 0.2, 0.1, 0.03);
      box('orange', cx, 1.48, s * 1.455, CAR_L - 0.2, 0.1, 0.03);
      for (const [a, b] of winSegs) { const m = new THREE.Mesh(new THREE.BoxGeometry(b - a, 1.0, 0.04), glassMat); m.position.set(cx + (a + b) / 2, 2.85, s * 1.46); group.add(m); }
      for (const dx of doorXs) {
        box('trim', cx + dx, FLOOR_Y + 0.9, s * 1.44, 1.46, 1.88, 0.03);   // 戸袋・枠
        if (s === 1) { box('steel', cx + dx - 0.34, FLOOR_Y + 0.88, 1.47, 0.64, 1.7, 0.04); box('steel', cx + dx + 0.34, FLOOR_Y + 0.88, 1.47, 0.64, 1.7, 0.04); }
        else for (const k of [-1, 1]) {
          const panel = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.7, 0.05), panelMat); panel.position.set(cx + dx + k * 0.34, FLOOR_Y + 0.88, -1.48); group.add(panel);
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.055), glassMat); win.position.set(0, 0.3, 0); panel.add(win);
          doorPanels.push({ m: panel, base: panel.position.x, dir: k });
        }
      }
    }
    // 床下機器
    box('steelDark', cx - 3.2, 0.82, 0, 3.4, 0.3, 2.0); box('steelDark', cx + 3.6, 0.82, 0, 2.6, 0.3, 1.9); box('steel', cx, 0.78, 0.2, 2.0, 0.22, 1.6);
    // 台車
    for (const bx of [-6.8, 6.8]) {
      box('steelDark', cx + bx, 0.98, 0, 2.4, 0.22, 0.28);
      for (const ax of [-1.05, 1.05]) {
        box('steelDark', cx + bx + ax, 0.98, 0, 0.1, 0.1, 2.0);
        for (const z of [-0.75, 0.75]) { const g = new THREE.CylinderGeometry(0.43, 0.43, 0.13, 20); g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, mats.steelDark.mat); m.position.set(cx + bx + ax, 0.98, z); m.castShadow = true; group.add(m); wheels.push(m); }
      }
      box('steelDark', cx + bx, 1.1, 0.88, 2.2, 0.2, 0.12); box('steelDark', cx + bx, 1.1, -0.88, 2.2, 0.2, 0.12);
    }
    // 屋根機器（AC）
    box('white', cx - 3.2, 4.1, 0, 2.2, 0.3, 1.6); box('white', cx + 3.0, 4.1, 0, 2.2, 0.3, 1.6);
    // 連結幌
    if (c < 2) { box('rubber', cx + 10.0, 2.4, 0, 0.7, 2.3, 2.5); }
    // パンタグラフ（先頭・後尾車）
    if (c !== 1) {
      const px = cx + (c === 0 ? 4.8 : -4.8);
      box('steelDark', px, 3.98, 0, 1.6, 0.08, 1.2);
      for (const z of [-0.45, 0.45]) { const a = new THREE.BoxGeometry(0.06, 0.06, 1.0); const t = new THREE.Matrix4().makeRotationZ(0.9); a.applyMatrix4(t); a.translate(px - 0.3, 4.35, z); add('steelDark', a); const b = new THREE.BoxGeometry(0.05, 0.05, 1.0); b.applyMatrix4(new THREE.Matrix4().makeRotationZ(-0.95)); b.translate(px + 0.3, 4.65, z); add('steelDark', b); }
      box('steelDark', px, 5.0, 0, 0.12, 0.05, 1.9);
    }
  }
  // 先頭部（両端）
  const ends: [number, number][] = [[-1, -29.7], [1, 29.7]];
  for (const [s, x] of ends) {
    box('stainless', x + s * 0.0, 2.45, 0, 0.16, 2.6, 2.9);
    box('glassDark', x + s * 0.1, 2.95, 0, 0.05, 1.0, 2.4);
    box('steelDark', x + s * 0.1, 2.25, 0, 0.05, 1.5, 0.85);   // 貫通扉
    box('teal', x + s * 0.09, 1.62, 0, 0.04, 0.1, 2.9); box('orange', x + s * 0.09, 1.48, 0, 0.04, 0.1, 2.9);
    box('steelDark', x + s * 0.15, 3.58, 0, 0.04, 0.24, 1.0);   // 行先表示器
    box('steelDark', x + s * 0.25, 1.0, 0, 0.3, 0.3, 2.3);      // 排障器
    box('steelDark', x + s * 0.2, 0.85, 0, 0.3, 0.12, 0.3);     // 連結器
    for (const z of [-1.0, 1.0]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.3), mats.emissiveWhite.mat.clone()); hl.position.set(x + s * 0.12, 1.95, z); group.add(hl); (s > 0 ? headL : tailL).push(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.22), mats.emissiveRed.mat.clone()); tl.position.set(x + s * 0.12, 1.95, z * 0.7); tl.userData.end = s; group.add(tl);
    }
  }
  const lightsByEnd: Record<string, THREE.Mesh[]> = { pos: [], neg: [] };
  group.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry.type === 'BoxGeometry') { const mm = m.material as THREE.MeshStandardMaterial; if (mm.emissive && mm.emissiveIntensity > 0) { const hdr = mm.emissive.r > 0.9 && mm.emissive.g < 0.3 ? 'red' : 'white'; (m.position.x > 0 ? lightsByEnd.pos : lightsByEnd.neg).push(Object.assign(m, { userData: { kind: hdr } })); } } });

  for (const [mk, geos] of batches) { const merged = mergeGeometries(geos, false); if (!merged) continue; const mesh = new THREE.Mesh(merged, mats[mk].mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = `313系[${mk}]`; group.add(mesh); }
  group.traverse(o => { if ((o as THREE.Mesh).isMesh) { (o as THREE.Mesh).castShadow = true; } });

  void headL; void tailL;
  return {
    group, wheels, length: 60,
    dims: { carLength: CAR_L, width: W, height: 3.93, cars: 3, platformSide: 'z-' },
    setDoors(open) { const e = Math.max(0, Math.min(1, open)); for (const d of doorPanels) d.m.position.x = d.base + d.dir * 0.64 * e; },
    setHeading(dir) {
      // 進行方向側の端：白（前照灯）、反対側：赤（尾灯）
      for (const m of lightsByEnd.pos.concat(lightsByEnd.neg)) { const front = (m.position.x > 0) === (dir > 0); const white = m.userData.kind === 'white'; m.visible = front ? white : !white; }
    }
  };
}
