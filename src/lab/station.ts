import * as THREE from 'three';
import { Parts, pbr, rbox, rrShape, extrude, ring, csgSub, T, tex, brushedRough, mesh, FONT } from './kit';

/** 自動改札機・券売機・精算機の高品質モデル。寸法は日本の駅で一般的な値の概略（実機の型番ではない）。 */

const mats = () => ({
  body: pbr('GateBody', { color: '#cfd4d8', metal: 0.85, rough: 0.4, roughMap: brushedRough(2, 0.4) }),
  housing: pbr('GateHousing', { color: '#e8ebed', metal: 0.05, rough: 0.42 }),
  top: pbr('GateTop', { color: '#2a2f35', metal: 0.25, rough: 0.5 }),
  black: pbr('Black', { color: '#08090a', rough: 0.85 }),
  foot: pbr('Rubber', { color: '#161718', rough: 0.95 }),
  cyan: pbr('LedCyan', { color: '#52d8ff', emissive: '#52d8ff', ei: 1.6 }),
  amber: pbr('LedAmber', { color: '#ffb938', emissive: '#ffb938', ei: 1.5 }),
  green: pbr('LedGreen', { color: '#2fe36b', emissive: '#2fe36b', ei: 1.6 }),
  red: pbr('LedRed', { color: '#ff3b2f', emissive: '#ff3b2f', ei: 1.4 }),
  flap: pbr('FlapBlue', { color: '#3a82e6', rough: 0.2, alpha: 0.62, emissive: '#0c3f8f', ei: 0.6, side: THREE.DoubleSide }),
  steel: pbr('SteelDark', { color: '#454b52', metal: 0.7, rough: 0.5 })
});

const icTex = () => tex(256, 256, (g, w, h) => { g.fillStyle = '#0d47a8'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(60, 200, 10, 60, 200, 260); gr.addColorStop(0, 'rgba(120,190,255,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#d4ecff'; g.lineWidth = 12; g.lineCap = 'round'; for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(70, 190, i * 46, -Math.PI / 2 + 0.25, -0.25); g.stroke(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(70, 190, 13, 0, 7); g.fill(); g.font = `bold 34px ${FONT}`; g.fillStyle = '#fff'; g.fillText('IC', 168, 56); });
const arrowTex = () => tex(128, 128, (g, w, h) => { g.fillStyle = '#031208'; g.fillRect(0, 0, w, h); g.fillStyle = '#2fe36b'; g.beginPath(); g.moveTo(64, 112); g.lineTo(20, 56); g.lineTo(48, 56); g.lineTo(48, 16); g.lineTo(80, 16); g.lineTo(80, 56); g.lineTo(108, 56); g.closePath(); g.fill(); });
const crossTex = () => tex(128, 128, (g, w, h) => { g.fillStyle = '#130403'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff3b2f'; g.lineWidth = 20; g.lineCap = 'round'; g.beginPath(); g.moveTo(28, 28); g.lineTo(100, 100); g.moveTo(100, 28); g.lineTo(28, 100); g.stroke(); });
const emissivePlane = (name: string, map: THREE.Texture, ei = 1.1) => new THREE.MeshStandardMaterial({ name, map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: ei, color: '#ffffff', roughness: 0.3 });
const wheelchairTex = () => tex(128, 128, (g, w, h) => { g.fillStyle = '#1f57b8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(58, 28, 9, 0, 7); g.fill(); g.beginPath(); g.moveTo(58, 44); g.lineTo(58, 78); g.lineTo(86, 78); g.lineTo(98, 108); g.moveTo(58, 58); g.lineTo(82, 58); g.stroke(); g.beginPath(); g.arc(52, 88, 24, 0.6, 4.6); g.stroke(); });

/** 自動改札機1台（本体のみ。扉は別モデル gate_flap を左右に配置）。入口側が -z */
export function gateUnit(wide = false) {
  const g = new THREE.Group(); g.name = wide ? 'GateUnit_Wide' : 'GateUnit'; const m = mats(); const P = new Parts();
  // 足元・本体（パネル継ぎ目と通気スリットをCSGで彫る）
  P.add(m.foot, rbox(0.27, 0.07, 1.22, 0.012), T(0, 0.035, 0));
  let body: THREE.BufferGeometry = rbox(0.3, 0.66, 1.28, 0.03, 4); body.translate(0, 0.4, 0);
  const cut: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
  for (const s of [-1, 1]) {
    cut.push({ g: new THREE.BoxGeometry(0.01, 0.5, 0.004), m: T(s * 0.15, 0.42, -0.3) }); cut.push({ g: new THREE.BoxGeometry(0.01, 0.5, 0.004), m: T(s * 0.15, 0.42, 0.3) });
    cut.push({ g: new THREE.BoxGeometry(0.01, 0.004, 0.62), m: T(s * 0.15, 0.2, 0) }); cut.push({ g: new THREE.BoxGeometry(0.01, 0.004, 0.62), m: T(s * 0.15, 0.62, 0) });
    for (let k = 0; k < 6; k++) cut.push({ g: new THREE.BoxGeometry(0.012, 0.02, 0.16), m: T(s * 0.15, 0.12 + k * 0.03, 0.43) });
  }
  body = csgSub(body, cut); g.add(mesh(body, m.body, 'Body'));
  // 上部筐体
  g.add(mesh(rbox(0.34, 0.27, 1.32, 0.05, 4), m.housing, 'Housing', 0, 0.865, 0));
  // 天板（切符投入口・取出口を実際に凹ませる）
  const slabShape = rrShape(0.37, 1.36, 0.07); let slab: THREE.BufferGeometry = extrude(slabShape, 0.03, 0.006); slab.rotateX(Math.PI / 2); slab.translate(0, 1.016, 0);
  slab = csgSub(slab, [{ g: new THREE.BoxGeometry(0.15, 0.06, 0.034), m: T(0, 1.016, -0.16) }, { g: new THREE.BoxGeometry(0.15, 0.06, 0.034), m: T(0, 1.016, 0.32) }, { g: new THREE.BoxGeometry(0.05, 0.06, 0.012), m: T(0, 1.016, 0.5) }]);
  g.add(mesh(slab, m.top, 'TopSlab'));
  P.add(m.black, rbox(0.14, 0.02, 0.03, 0.004), T(0, 1.0, -0.16)); P.add(m.black, rbox(0.14, 0.02, 0.03, 0.004), T(0, 1.0, 0.32));
  P.add(m.amber, new THREE.BoxGeometry(0.035, 0.004, 0.02), T(0, 1.032, -0.24)); P.add(m.green, new THREE.BoxGeometry(0.05, 0.004, 0.014), T(0, 1.032, 0.5));
  for (let k = -1; k <= 1; k++) P.add(m.green, new THREE.CylinderGeometry(0.008, 0.008, 0.004, 10), T(k * 0.06, 1.032, 0.58));
  // IC読取部（傾斜面）
  const tilt = (x: number, y: number, z: number, lx: number, ly: number, lz: number) => new THREE.Matrix4().multiplyMatrices(T(x, y, z, -0.38, 0, 0), T(lx, ly, lz));
  P.add(m.top, rbox(0.27, 0.055, 0.31, 0.02, 3), tilt(0, 1.04, -0.5, 0, 0, 0));
  const r = ring(0.215, 0.215, 0.03, 0.012, 0.004); r.rotateX(-Math.PI / 2); P.add(m.cyan, r, tilt(0, 1.04, -0.5, 0, 0.03, 0));
  const ic = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.19), emissivePlane('ICPad', icTex(), 0.55)); ic.rotation.x = -Math.PI / 2 - 0.38; ic.position.set(0, 1.04 + 0.0305 * Math.cos(0.38), -0.5 - 0.0305 * Math.sin(0.38)); ic.name = 'ICPad'; g.add(ic);
  // 入口端面の表示（進入可／不可）
  P.add(m.black, rbox(0.27, 0.16, 0.035, 0.012), T(0, 0.85, -0.667));
  const mkDisp = (map: THREE.Texture, name: string, x: number) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), emissivePlane(name, map, 1.3)); p.rotation.y = Math.PI; p.position.set(x, 0.85, -0.687); p.name = name; g.add(p); };
  mkDisp(arrowTex(), 'DisplayGo', -0.065); mkDisp(crossTex(), 'DisplayStop', 0.065);
  // 出口端面の表示
  P.add(m.black, rbox(0.2, 0.08, 0.03, 0.01), T(0, 0.85, 0.667)); P.add(m.green, new THREE.BoxGeometry(0.1, 0.03, 0.006), T(0, 0.85, 0.686));
  // センサー（左右内側面）
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) for (const y of [0.32, 0.82]) P.add(m.cyan, new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 8), T(s * 0.152, y, -0.5 + k * 0.25, 0, 0, Math.PI / 2));
  // 幅広：識別帯と車いすマーク
  if (wide) { P.add(pbr('GateBlue', { color: '#1f57b8', rough: 0.5 }), new THREE.BoxGeometry(0.3, 0.006, 1.1), T(0, 1.034, 0)); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), emissivePlane('WheelchairSign', wheelchairTex(), 0.5)); w.position.set(0, 0.86, 0.69); w.name = 'WheelchairSign'; g.add(w); }
  P.build('GateParts', g);
  g.userData = { kind: 'gate', length: 1.36, width: 0.37, height: 1.07, passage: wide ? 1.2 : 0.8 };
  return g;
}


/** 改札機の扉（フラップ）。ヒンジ軸が原点・+x方向へ伸びる。実行時に FlapPivot.rotation.y で開閉する */
export function gateFlap(wide = false) {
  const m = mats(); const L = wide ? 0.58 : 0.38; const pivot = new THREE.Group(); pivot.name = wide ? 'FlapPivot_Wide' : 'FlapPivot';
  pivot.add(mesh(rbox(0.032, 0.16, 0.032, 0.008), m.steel, 'FlapHinge'));
  const flap = new THREE.Group(); flap.name = 'Flap'; flap.add(mesh(rbox(L, 0.115, 0.016, 0.006, 2), m.flap, 'FlapPlate', L / 2 + 0.01, 0, 0)); flap.add(mesh(new THREE.BoxGeometry(L - 0.02, 0.004, 0.018), m.cyan, 'FlapEdgeLed', L / 2 + 0.01, 0.0585, 0));
  flap.add(mesh(rbox(0.05, 0.03, 0.022, 0.004), m.steel, 'FlapBracketA', 0.03, 0.0, 0)); flap.add(mesh(rbox(0.05, 0.03, 0.022, 0.004), m.steel, 'FlapBracketB', 0.03, -0.045, 0));
  pivot.add(flap); pivot.userData = { kind: 'gateFlap', length: L }; return pivot;
}

const lcdTex = (mode: 'normal' | 'fault') => tex(512, 340, (g, w, h) => {
  g.fillStyle = mode === 'fault' ? '#2a0a0a' : '#0b2540'; g.fillRect(0, 0, w, h); g.fillStyle = mode === 'fault' ? '#7a1010' : '#1d5ea8'; g.fillRect(0, 0, w, 46); g.fillStyle = '#fff'; g.font = `bold 26px ${FONT}`;
  if (mode === 'fault') { g.fillText('現在、紙幣はご利用になれません', 16, 32); g.fillStyle = '#ffb3aa'; g.font = `bold 30px ${FONT}`; g.fillText('硬貨・ICカードをご利用ください', 24, 150); g.font = `22px ${FONT}`; g.fillText('係員をお呼びください', 24, 200); g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(440, 250, 40, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 56px sans-serif'; g.fillText('!', 430, 272); return; }
  g.fillText('きっぷをお買い求めください', 16, 32); const dest: [string, number][] = [['海浜口', 170], ['翠川', 210], ['星峰', 290], ['空港', 340], ['港南', 250], ['山岳旧線', 380]];
  dest.forEach(([n, f], i) => { const x = 14 + (i % 3) * 164, y = 62 + Math.floor(i / 3) * 100; g.fillStyle = '#f4f1e6'; g.fillRect(x, y, 152, 88); g.fillStyle = '#10243c'; g.font = `bold 24px ${FONT}`; g.fillText(n, x + 10, y + 34); g.font = `bold 30px ${FONT}`; g.fillText(f + '円', x + 10, y + 74); });
  g.fillStyle = '#e8b32a'; g.fillRect(14, 270, 236, 56); g.fillStyle = '#1a1200'; g.font = `bold 24px ${FONT}`; g.fillText('ICチャージ', 62, 306); g.fillStyle = '#4a6d90'; g.fillRect(262, 270, 236, 56); g.fillStyle = '#fff'; g.fillText('English / 中文 / 한국어', 276, 306);
});
const fareTex = () => tex(512, 192, (g, w, h) => { g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c3d6e'; g.fillRect(0, 0, w, 36); g.fillStyle = '#fff'; g.font = `bold 24px ${FONT}`; g.fillText('運賃表　青嶺中央から', 12, 27); g.fillStyle = '#111'; g.font = `bold 21px ${FONT}`; ([['海浜口', 170], ['翠川', 210], ['星峰', 290], ['空港', 340]] as [string, number][]).forEach(([n, f], i) => { g.fillText(n, 14 + (i % 2) * 250, 78 + Math.floor(i / 2) * 44); g.fillText(f + '円', 150 + (i % 2) * 250, 78 + Math.floor(i / 2) * 44); }); g.font = `16px ${FONT}`; g.fillStyle = '#a33'; g.fillText('※架空の運賃', 14, 176); });
const signTex = (t: string, sub: string, bg: string, fg = '#fff') => tex(320, 100, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.font = `bold 46px ${FONT}`; g.fillText(t, w / 2, 56); g.font = `20px ${FONT}`; g.fillText(sub, w / 2, 88); });
const btnTex = () => tex(256, 400, (g, w, h) => { g.fillStyle = '#c9ced2'; g.fillRect(0, 0, w, h); for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { const x = 10 + c * 82, y = 10 + r * 64; g.fillStyle = (r + c) % 4 === 0 ? '#f3c34a' : '#fafafa'; g.fillRect(x, y, 72, 54); g.strokeStyle = '#6b7075'; g.lineWidth = 2; g.strokeRect(x, y, 72, 54); g.fillStyle = '#222'; g.font = `bold 22px ${FONT}`; g.textAlign = 'center'; g.fillText(r === 5 ? ['取消', '呼出', '大人'][c] : String(150 + (r * 3 + c) * 20), x + 36, y + 35); } });
const brailleTex = () => tex(128, 160, (g, w, h) => { g.fillStyle = '#1c3d6e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 6; k++) if ((r * 7 + c * 3 + k) % 3 !== 0) { g.beginPath(); g.arc(16 + c * 38 + (k % 2) * 12, 18 + r * 28 + Math.floor(k / 2) * 8, 3, 0, 7); g.fill(); } });

/** 券売機（前面が +x、幅 1.1m・奥行 0.8m・高さ 2.1m）。variant: ブルー/レッド、screen: 通常/故障表示 */
export function ticketMachine(color: 'blue' | 'red' = 'blue', screen: 'normal' | 'fault' = 'normal', name = 'TicketMachine') {
  const g = new THREE.Group(); g.name = name; const P = new Parts(); const m = mats(); const col = color === 'red' ? '#c4352c' : '#2a5ca8';
  const paint = pbr('VendPaint', { color: col, metal: 0.35, rough: 0.32 }); const dark = pbr('VendDark', { color: '#1d2126', metal: 0.4, rough: 0.5 }); const trimM = pbr('VendTrim', { color: '#cfd3d6', metal: 0.8, rough: 0.4, roughMap: brushedRough(5, 0.4) }); const white = pbr('VendWhite', { color: '#f2f3f1', rough: 0.4 });
  // 本体（前面にLCD・ボタン・現金・取出口の凹みをCSGで彫る）
  let body: THREE.BufferGeometry = rbox(0.8, 1.78, 1.1, 0.04, 4); body.translate(0, 1.01, 0);
  body = csgSub(body, [
    { g: rbox(0.08, 0.5, 0.68, 0.02), m: T(0.4, 1.46, 0.0) },                    // LCDベイ
    { g: rbox(0.08, 0.42, 0.46, 0.015), m: T(0.4, 1.0, -0.26) },                  // ボタンベイ
    { g: rbox(0.1, 0.1, 0.4, 0.01), m: T(0.4, 0.88, 0.25) },                      // 現金ベイ
    { g: rbox(0.2, 0.17, 0.4, 0.02), m: T(0.4, 0.5, 0.0) },                       // 取出口の凹み（奥行きあり）
    { g: rbox(0.1, 0.14, 0.18, 0.01), m: T(0.4, 0.5, -0.4) },                     // 釣銭・返却口
    { g: rbox(0.06, 0.2, 0.2, 0.01), m: T(0.4, 1.0, 0.39) }                       // ICベイ
  ]);
  g.add(mesh(body, paint, 'Body'));
  P.add(dark, rbox(0.78, 0.12, 1.08, 0.02), T(0, 0.06, 0));
  // 上部ライトボックス
  P.add(white, rbox(0.62, 0.2, 0.98, 0.03), T(0.06, 2.0, 0)); const lt = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.17), emissivePlane('LightBoxFace', signTex('きっぷ', 'Tickets', '#f4f0e6', '#1c3d6e'), 0.9)); lt.rotation.y = Math.PI / 2; lt.position.set(0.372, 2.0, 0); lt.name = 'LightBoxFace'; g.add(lt);
  // 運賃表
  const fs = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.34), new THREE.MeshStandardMaterial({ name: 'FareTable', map: fareTex(), roughness: 0.5 })); fs.rotation.y = Math.PI / 2; fs.position.set(0.402, 1.75, 0); fs.name = 'FareTable'; g.add(fs);
  // LCD
  P.add(dark, rbox(0.045, 0.5, 0.68, 0.015), T(0.382, 1.46, 0));
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), emissivePlane('LCD', lcdTex(screen), 0.9)); lcd.rotation.y = Math.PI / 2; lcd.position.set(0.407, 1.46, 0); lcd.name = 'LCD'; g.add(lcd);
  // ボタン
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.37), new THREE.MeshStandardMaterial({ name: 'ButtonPanel', map: btnTex(), roughness: 0.45 })); bp.rotation.y = Math.PI / 2; bp.position.set(0.372, 1.0, -0.26); bp.name = 'ButtonPanel'; g.add(bp);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) P.add(trimM, rbox(0.012, 0.03, 0.095, 0.004, 2), T(0.378, 1.19 - r * 0.0585, -0.26 + (c - 1) * 0.134 + 0.0));
  // 現金部：紙幣口（スリット＋LED）、硬貨口、返却
  P.add(m.black, new THREE.BoxGeometry(0.02, 0.018, 0.3), T(0.372, 0.9, 0.3)); P.add(color === 'red' && screen === 'fault' ? m.red : m.green, new THREE.BoxGeometry(0.006, 0.01, 0.3), T(0.384, 0.935, 0.3));
  P.add(m.black, new THREE.BoxGeometry(0.02, 0.09, 0.012), T(0.372, 0.87, 0.06)); P.add(trimM, rbox(0.014, 0.03, 0.05, 0.006), T(0.38, 0.8, 0.06));
  // 取出口：奥の暗がりと、上辺の小さな跳ね上げ蓋
  P.add(m.black, rbox(0.16, 0.13, 0.34, 0.01), T(0.33, 0.5, 0)); P.add(trimM, rbox(0.01, 0.014, 0.37, 0.004), T(0.41, 0.586, 0));
  P.add(m.black, rbox(0.1, 0.1, 0.15, 0.008), T(0.35, 0.5, -0.4));
  // IC読取部
  P.add(m.top, rbox(0.06, 0.016, 0.21, 0.006), new THREE.Matrix4().multiplyMatrices(T(0.38, 1.0, 0.39, 0, 0, -0.45), T()));
  const ic = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), emissivePlane('ICPad', icTex(), 0.55)); ic.rotation.set(0, Math.PI / 2, 0); ic.rotateX(0); ic.position.set(0.395, 1.015, 0.39); ic.rotateY(0); ic.name = 'ICPad'; g.add(ic);
  // 点字案内板・号機プレート・側面の通気スリット
  const br = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), new THREE.MeshStandardMaterial({ name: 'BraillePlate', map: brailleTex(), roughness: 0.5 })); br.rotation.y = Math.PI / 2; br.position.set(0.402, 0.78, 0.45); br.name = 'BraillePlate'; g.add(br);
  P.add(white, rbox(0.008, 0.1, 0.1, 0.003), T(0.402, 1.74, -0.48));
  for (const s of [-1, 1]) for (let k = 0; k < 8; k++) P.add(m.black, new THREE.BoxGeometry(0.3, 0.012, 0.004), T(-0.1, 0.35 + k * 0.03, s * 0.552));
  P.add(m.amber, new THREE.BoxGeometry(0.006, 0.03, 0.03), T(0.402, 1.66, 0.48));
  P.build('VendParts', g); g.userData = { kind: 'ticketMachine', width: 1.1, depth: 0.82, height: 2.12 };
  return g;
}

/** 精算機（前面が +x、幅 0.9m） */
export function fareAdjuster() {
  const g = ticketMachine('blue', 'normal', 'FareAdjuster'); g.traverse(o => { const mm = o as THREE.Mesh; if (mm.isMesh && mm.name === 'LightBoxFace') { (mm.material as THREE.MeshStandardMaterial).map = signTex('精算機', 'Fare Adjustment', '#1c3d6e'); (mm.material as THREE.MeshStandardMaterial).emissiveMap = (mm.material as THREE.MeshStandardMaterial).map; } });
  return g;
}
