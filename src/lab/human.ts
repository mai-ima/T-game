import * as THREE from 'three';
import { Parts, pbr, rbox, T, mesh, setMaxSeg, tex, FONT } from './kit';

/** 人物テンプレート（身長1.70m・足元原点・+z向き）。関節ピボットを節点として持ち、歩行アニメを節点回転で行う。
 *  材質名（Uniform/Shirt/Trousers/Skin/Hair/Shoes/Accessory/Tie）を実行時に差し替えて個別の人物を作る。
 *  オプション節点（HairShort/HairLong/Cap/Glasses/Bag/Cane/Suitcase/TieNode）は表示切替で使う。 */
export function humanTemplate() {
  setMaxSeg(2); const root = new THREE.Group(); root.name = 'Human'; const P = new Parts();
  const skin = pbr('Skin', { color: '#efc9a6', rough: 0.62 }); const uni = pbr('Uniform', { color: '#1d2a44', rough: 0.72 }); const shirt = pbr('Shirt', { color: '#f4f4f0', rough: 0.8 }); const trs = pbr('Trousers', { color: '#232a38', rough: 0.78 });
  const hairM = pbr('Hair', { color: '#2a2018', rough: 0.55 }); const shoe = pbr('Shoes', { color: '#17181a', rough: 0.45, metal: 0.1 }); const sole = pbr('Sole', { color: '#0d0d0e', rough: 0.9 }); const acc = pbr('Accessory', { color: '#1d2a44', rough: 0.7 });
  const tieM = pbr('Tie', { color: '#b02a2a', rough: 0.6 }); const eyeW = pbr('EyeWhite', { color: '#f6f6f2', rough: 0.3 }); const iris = pbr('Iris', { color: '#2a1b12', rough: 0.2 }); const lip = pbr('Lip', { color: '#b8665a', rough: 0.5 }); const gold = pbr('Brass', { color: '#d8b030', metal: 0.9, rough: 0.35 }); const black = pbr('Black', { color: '#0c0c0d', rough: 0.8 });
  const nameTex = tex(128, 40, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2a44'; g.font = `bold 18px ${FONT}`; g.fillText('青嶺鉄道', 8, 26); }); const tagM = pbr('NameTag', { color: '#ffffff', map: nameTex, rough: 0.5 });
  const cap = (r: number, h: number, seg = 10) => new THREE.CapsuleGeometry(r, h, 4, seg);

  // 腰・胴
  P.add(trs, rbox(0.34, 0.2, 0.21, 0.07), T(0, 0.93, 0));
  const torso = new THREE.Group(); torso.name = 'Torso'; root.add(torso); const TP = new Parts();
  TP.add(uni, rbox(0.4, 0.56, 0.23, 0.09, 3), T(0, 1.23, 0)); TP.add(uni, rbox(0.43, 0.2, 0.25, 0.07, 3), T(0, 1.02, 0));
  TP.add(shirt, new THREE.ConeGeometry(0.075, 0.17, 3), T(0, 1.42, 0.118, Math.PI, 0, 0)); TP.add(shirt, rbox(0.16, 0.035, 0.15, 0.015), T(0, 1.495, 0.01));
  for (const s of [-1, 1]) { TP.add(uni, rbox(0.045, 0.28, 0.02, 0.008, 1), T(s * 0.065, 1.35, 0.125, 0, 0, s * 0.28)); TP.add(uni, new THREE.SphereGeometry(0.078, 12, 8), T(s * 0.215, 1.46, 0)); }
  for (const y of [1.2, 1.1]) TP.add(gold, new THREE.CylinderGeometry(0.011, 0.011, 0.006, 10), T(0.0, y, 0.123, Math.PI / 2, 0, 0));
  TP.add(tagM, new THREE.BoxGeometry(0.09, 0.03, 0.006), T(0.12, 1.32, 0.123)); TP.add(black, rbox(0.43, 0.035, 0.255, 0.012), T(0, 0.96, 0));
  TP.build('TorsoParts', torso);
  const tie = new THREE.Group(); tie.name = 'TieNode'; const ts = new THREE.Shape(); ts.moveTo(-0.02, 0); ts.lineTo(0.02, 0); ts.lineTo(0.03, -0.17); ts.lineTo(0, -0.2); ts.lineTo(-0.03, -0.17); ts.closePath(); const tg = new THREE.ExtrudeGeometry(ts, { depth: 0.006, bevelEnabled: false }); tg.translate(0, 1.46, 0.128); tie.add(mesh(tg, tieM, 'TieMesh')); root.add(tie);
  // 首・頭
  P.add(skin, new THREE.CylinderGeometry(0.048, 0.054, 0.1, 14), T(0, 1.55, 0));
  const head = new THREE.Group(); head.name = 'Head'; head.position.set(0, 1.64, 0); root.add(head); const HP = new Parts();
  const skull = new THREE.SphereGeometry(1, 24, 18); skull.scale(0.099, 0.118, 0.108); HP.add(skin, skull, T(0, 0.04, 0));
  const jaw = new THREE.SphereGeometry(1, 18, 12); jaw.scale(0.078, 0.07, 0.085); HP.add(skin, jaw, T(0, -0.045, 0.012));
  for (const s of [-1, 1]) { const ear = new THREE.SphereGeometry(1, 10, 8); ear.scale(0.014, 0.034, 0.026); HP.add(skin, ear, T(s * 0.1, 0.01, 0)); const e = new THREE.SphereGeometry(0.0155, 10, 8); HP.add(eyeW, e, T(s * 0.036, 0.035, 0.093)); HP.add(iris, new THREE.CylinderGeometry(0.0085, 0.0085, 0.004, 12), T(s * 0.036, 0.035, 0.106, Math.PI / 2, 0, 0)); HP.add(hairM, rbox(0.044, 0.008, 0.012, 0.003, 1), T(s * 0.036, 0.066, 0.099, 0.1, 0, s * -0.12)); }
  HP.add(skin, new THREE.ConeGeometry(0.014, 0.034, 8), T(0, 0.012, 0.108, Math.PI / 2 - 0.25, 0, 0)); HP.add(lip, rbox(0.038, 0.008, 0.01, 0.003, 1), T(0, -0.043, 0.098));
  HP.build('HeadParts', head);
  const hs = new THREE.Group(); hs.name = 'HairShort'; const hsg = new THREE.SphereGeometry(0.114, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.58); hsg.scale(1, 1.08, 1.06); hs.add(mesh(hsg, hairM, 'HairShortMesh', 0, 0.045, -0.006)); hs.add(mesh(rbox(0.19, 0.04, 0.05, 0.02), hairM, 'Fringe', 0, 0.098, 0.082)); head.add(hs);
  const hl = new THREE.Group(); hl.name = 'HairLong'; hl.visible = false; const hlg = new THREE.SphereGeometry(0.116, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.6); hlg.scale(1, 1.1, 1.08); hl.add(mesh(hlg, hairM, 'HairLongTop', 0, 0.045, -0.008)); hl.add(mesh(rbox(0.23, 0.3, 0.07, 0.03), hairM, 'HairBack', 0, -0.1, -0.085)); for (const s of [-1, 1]) hl.add(mesh(rbox(0.03, 0.18, 0.08, 0.012), hairM, 'HairSide', s * 0.1, -0.03, -0.02)); head.add(hl);
  const capN = new THREE.Group(); capN.name = 'Cap'; capN.visible = false; const crown = new THREE.CylinderGeometry(0.12, 0.128, 0.07, 22); capN.add(mesh(crown, acc, 'CapCrown', 0, 0.115, 0)); capN.add(mesh(new THREE.CylinderGeometry(0.126, 0.126, 0.012, 22), acc, 'CapTop', 0, 0.152, 0)); capN.add(mesh(rbox(0.2, 0.012, 0.09, 0.006), black, 'CapVisor', 0, 0.085, 0.13)); capN.add(mesh(rbox(0.05, 0.036, 0.008, 0.004), gold, 'CapBadge', 0, 0.12, 0.123)); capN.add(mesh(new THREE.CylinderGeometry(0.127, 0.127, 0.014, 22), black, 'CapBand', 0, 0.087, 0)); head.add(capN);
  const gl = new THREE.Group(); gl.name = 'Glasses'; gl.visible = false; for (const s of [-1, 1]) { gl.add(mesh(new THREE.TorusGeometry(0.03, 0.0055, 6, 16), black, 'Lens', s * 0.036, 0.035, 0.112)); } gl.add(mesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), black, 'Bridge', 0, 0.04, 0.113)); head.add(gl);
  // 腕（肩ピボット）
  const mkArm = (side: 1 | -1) => { const a = new THREE.Group(); a.name = side > 0 ? 'ArmR' : 'ArmL'; a.position.set(side * 0.215, 1.46, 0); const AP = new Parts();
    AP.add(uni, cap(0.05, 0.22), T(0, -0.15, 0)); const fore = new THREE.Group(); fore.name = side > 0 ? 'ForearmR' : 'ForearmL'; fore.position.set(0, -0.3, 0); fore.rotation.x = -0.12; const FP = new Parts();
    FP.add(uni, cap(0.043, 0.2), T(0, -0.13, 0)); FP.add(shirt, new THREE.CylinderGeometry(0.044, 0.044, 0.02, 12), T(0, -0.255, 0)); const hand = new THREE.SphereGeometry(1, 12, 10); hand.scale(0.036, 0.06, 0.028); FP.add(skin, hand, T(0, -0.31, 0)); FP.add(skin, cap(0.011, 0.03, 6), T(side * -0.03, -0.29, 0.015, 0, 0, side * 0.5));
    FP.build('ForearmParts', fore); a.add(fore); AP.build('ArmParts', a); return a; };
  root.add(mkArm(1), mkArm(-1));
  // 脚（股関節ピボット）
  const mkLeg = (side: 1 | -1) => { const l = new THREE.Group(); l.name = side > 0 ? 'LegR' : 'LegL'; l.position.set(side * 0.095, 0.9, 0); const LP = new Parts(); const th = cap(0.078, 0.3, 12); th.scale(1, 1, 1); LP.add(trs, th, T(0, -0.24, 0));
    const shin = new THREE.Group(); shin.name = side > 0 ? 'ShinR' : 'ShinL'; shin.position.set(0, -0.46, 0); const SP = new Parts(); SP.add(trs, cap(0.062, 0.3, 12), T(0, -0.2, 0));
    SP.add(shoe, rbox(0.105, 0.075, 0.27, 0.03, 2), T(0, -0.43, 0.04)); SP.add(sole, rbox(0.11, 0.018, 0.275, 0.008, 1), T(0, -0.465, 0.04)); SP.add(shoe, new THREE.SphereGeometry(0.052, 10, 8), T(0, -0.405, -0.01));
    SP.build('ShinParts', shin); l.add(shin); LP.build('LegParts', l); return l; };
  root.add(mkLeg(1), mkLeg(-1));
  // 持ち物
  const bag = new THREE.Group(); bag.name = 'Bag'; bag.visible = false; bag.add(mesh(rbox(0.26, 0.2, 0.1, 0.03), pbr('BagLeather', { color: '#6a4a3a', rough: 0.7 }), 'BagBody', 0.3, 0.86, 0)); bag.add(mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 14, Math.PI), black, 'BagHandle', 0.3, 0.96, 0)); root.add(bag);
  const cane = new THREE.Group(); cane.name = 'Cane'; cane.visible = false; cane.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.85, 8), pbr('CaneWood', { color: '#4a3a2a', rough: 0.6 }), 'CaneShaft', 0.34, 0.45, 0.12)); cane.add(mesh(new THREE.TorusGeometry(0.035, 0.011, 6, 12, Math.PI), pbr('CaneWood2', { color: '#4a3a2a', rough: 0.6 }), 'CaneHandle', 0.305, 0.875, 0.12)); root.add(cane);
  const sc = new THREE.Group(); sc.name = 'Suitcase'; sc.visible = false; sc.add(mesh(rbox(0.4, 0.62, 0.24, 0.04), pbr('SuitcaseShell', { color: '#1f6f8a', rough: 0.35, metal: 0.2 }), 'CaseShell', 0.52, 0.4, 0.1)); sc.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.32, 6), pbr('SuitcaseHandle', { color: '#aaa', metal: 0.9, rough: 0.4 }), 'CaseHandle', 0.52, 0.88, 0.1)); root.add(sc);
  P.build('BodyParts', root); root.userData = { kind: 'human', height: 1.74, nodes: ['LegL', 'LegR', 'ArmL', 'ArmR', 'Head', 'ForearmL', 'ForearmR', 'ShinL', 'ShinR'] };
  return root;
}
