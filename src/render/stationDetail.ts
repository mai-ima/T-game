import * as THREE from 'three';

/** 改札まわりの細部（自動改札機・券売機・精算機・有人通路・誘導ブロック・防犯カメラ等）。
 *  寸法は日本の駅で一般的な値（改札機 長さ約1.3m・通路幅約0.8m／幅広通路1.2m）を参考にした概略で、実機の型番を再現したものではない。 */
export interface GateUnit { id: number; cx: number; cz: number; wide: boolean; xl: number; xr: number; left?: THREE.Object3D; right?: THREE.Object3D; open: number; target: number }

type Opt = { noShadow?: boolean; ghost?: boolean; ry?: number; lod?: 0 | 1 | 2; collide?: boolean | [number, number]; support?: 'ground' | 'platform' | 'deck' | 'mounted' | 'none'; tag?: string; group?: string };
export interface DetailCtx {
  D: number; root: THREE.Group; gates: GateUnit[]; place(model: string, x: number, y: number, z: number, ry: number, name: string): void;
  box(mat: string, name: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, o?: Opt): void;
  boxR(mat: string, name: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, o?: Opt): void;
  cyl(mat: string, name: string, cx: number, cy: number, cz: number, r: number, h: number, o?: Opt): void;
  sign(tex: THREE.Texture | null, name: string, cx: number, cy: number, cz: number, w: number, h: number, yaw: number): THREE.Mesh;
  mat(key: string): THREE.Material;
  tex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture | null;
  label(text: string, sub: string, w: number, h: number, bg: string, fg?: string): THREE.CanvasTexture | null;
}
const FONT = '"Noto Sans JP","WenQuanYi Zen Hei",sans-serif';

export const GATE_Z = -4.0;
export const GATE_X = [-3.85, -2.75, -1.65, -0.55, 0.55, 1.65, 2.75, 4.25];

/** 自動改札機：本体・天板・IC読取部・切符口・通行表示・センサー・扉（フラップ）を部品単位で作る */
export function buildGateLine(c: DetailCtx) {
  const { D, box } = c; const z0 = GATE_Z;
  // 改札機本体は高品質GLBモデル（gate_unit）。ここでは衝突・配置検査用の見えない箱と、モデル配置を登録する
  GATE_X.forEach((x, i) => {
    box('gateBody', `自動改札機${i + 1}`, x, D + 0.5, z0, 0.34, 1.0, 1.36, { ghost: true, collide: [D, D + 1.0], tag: 'gate', group: `gate${i}`, support: 'deck' });
    c.place(i >= 6 ? 'gate_unit_wide' : 'gate_unit', x, D, z0, 0, `改札機${i + 1}`);
  });
  // 通路（隣り合う機械の間）ごとに扉：実際のメッシュは実行時にGLB（gate_flap）から作る
  for (let p = 0; p < GATE_X.length - 1; p++) {
    const xl = GATE_X[p], xr = GATE_X[p + 1]; const cx = (xl + xr) / 2; const wide = p === GATE_X.length - 2; const cz = z0 + 0.32;
    c.gates.push({ id: p, cx, cz, wide, xl: xl + 0.17, xr: xr - 0.17, open: 0, target: 0 });
    const rod = (dx: number) => box('steelDark', '改札案内の吊り棒', cx + dx, D + 3.2, z0 - 0.7, 0.025, 2.1, 0.025, { lod: 1, tag: 'sign', support: 'mounted' });
    rod(0);
    c.sign(c.label(wide ? '車いす・ベビーカー' : String(p + 1), '', wide ? 256 : 96, 96, wide ? '#1f57b8' : '#1b6f45'), `改札${p + 1}番通路表示`, cx, D + 2.2, z0 - 0.7, wide ? 0.9 : 0.42, wide ? 0.34 : 0.32, Math.PI);
  }

  // ---- 西側の柵（支柱・上段・中段レール）----
  const x0 = -14, x1 = -4.35; const len = x1 - x0; const cx = (x0 + x1) / 2;
  box('steel', '改札柵（西）当たり', cx, D + 0.5, z0, len, 1.0, 0.06, { collide: [D, D + 1.0], tag: 'fence', support: 'none', lod: 0, group: 'fenceW' });
  box('steel', '改札柵 上段レール（西）', cx, D + 1.02, z0, len, 0.05, 0.07, { tag: 'fence', support: 'none', group: 'fenceW' });
  box('steel', '改札柵 中段レール（西）', cx, D + 0.55, z0, len, 0.03, 0.04, { tag: 'fence', support: 'none', group: 'fenceW', lod: 1 });
  for (let x = x0 + 0.3; x < x1; x += 1.2) box('steel', '改札柵 支柱', x, D + 0.52, z0, 0.05, 1.04, 0.05, { tag: 'fence', support: 'deck', group: 'fenceW', lod: 1 });
  box('glass', '改札柵 ガラス面', cx, D + 0.72, z0 - 0.04, len - 0.2, 0.36, 0.01, { tag: 'glass', support: 'none' });

  // ---- 有人通路（駅員ブース＋開口0.9m）と東側の柵 ----
  box('woodMat', '有人改札ブース 天板', 4.95, D + 1.03, z0 - 0.02, 1.2, 0.05, 0.62, { tag: 'counter', group: 'booth', support: 'none' });
  box('steel', '有人改札ブース 本体', 4.95, D + 0.5, z0 - 0.02, 1.1, 1.0, 0.56, { collide: [D, D + 1.0], tag: 'counter', group: 'booth', support: 'deck' });
  box('glass', '有人改札ブース ガラス', 4.95, D + 1.38, z0 - 0.3, 1.1, 0.6, 0.015, { tag: 'glass', support: 'none' });
  box('steelDark', '有人改札ブース モニター', 4.95, D + 1.2, z0 + 0.14, 0.3, 0.2, 0.03, { tag: 'counter', group: 'booth', support: 'none' });
  box('white', '有人改札ブース 窓口札', 4.95, D + 0.88, z0 - 0.31, 0.5, 0.12, 0.012, { tag: 'counter', group: 'booth', support: 'none', lod: 1 });
  c.sign(c.label('有人通路', 'Staffed Gate', 320, 96, '#1d2a44'), '有人通路表示', 5.85, D + 2.2, z0 - 0.7, 0.9, 0.34, Math.PI);
  box('steel', '改札柵（東）当たり', 6.6, D + 0.5, z0, 0.6, 1.0, 0.06, { collide: [D, D + 1.0], tag: 'fence', support: 'none', group: 'fenceE' });
  box('steel', '改札柵 上段レール（東）', 6.6, D + 1.02, z0, 0.6, 0.05, 0.07, { tag: 'fence', support: 'none', group: 'fenceE' });
  box('steel', '有人通路 ポール', 5.5, D + 0.5, z0 - 0.02, 0.04, 1.0, 0.04, { tag: 'fence', support: 'deck', lod: 1, group: 'fenceE' });
  // 柵端のインターホン（非常用）
  box('white', '改札インターホン', -4.5, D + 1.18, z0 + 0.06, 0.12, 0.2, 0.05, { tag: 'fence', support: 'none', group: 'fenceW' });
  box('red', '改札インターホン 呼出ボタン', -4.5, D + 1.2, z0 + 0.1, 0.05, 0.05, 0.015, { tag: 'fence', support: 'none', group: 'fenceW', lod: 1 });
}

/** 誘導ブロック・警告ブロック（コンコース床） */
export function buildGuidance(c: DetailCtx) {
  const { D, box } = c; const y = D + 0.007; const W = 0.3; const T = (name: string, cx: number, cz: number, sx: number, sz: number) => box('tactile', name, cx, y, cz, sx, 0.014, sz, { tag: 'tactile', support: 'none', lod: 0, group: `tg-${name}-${cx.toFixed(1)}-${cz.toFixed(1)}` });
  T('警告ブロック（改札前）', 0.4, -5.2, 9.4, 0.6);
  T('誘導ブロック（階段→改札）', 0, -8.9, W, 6.4); T('誘導ブロック（改札前横）', 1.75, -6.0, 3.5, W); T('誘導ブロック（幅広通路へ）', 3.5, -5.55, W, 0.9);
  T('誘導ブロック（券売機へ）', -6.2, -8.5, 12.4 - 0.0 - 0.4, W);
  T('警告ブロック（券売機前）', -12.2, -8.5, 0.6, 5.0);
  T('誘導ブロック（改札→階段 西）', -3.3, -1.8, W, 3.4); T('誘導ブロック（階段へ 西）', -8.8, 0.0, 10.0, W); T('警告ブロック（西階段前）', -13.2, 0.0, 0.8, 3.0);
  T('誘導ブロック（改札→階段 東）', 3.5, -1.8, W, 3.4); T('誘導ブロック（階段へ 東）', 8.8, 0.0, 10.0, W); T('警告ブロック（東階段前）', 13.2, 0.0, 0.8, 3.0);
  T('警告ブロック（入口階段上）', 0, -11.6, 5.2, 0.6);
}

/** 券売機（3台）：高品質GLB（ticket_blue／ticket_red_fault）を配置し、衝突・検査用の見えない箱を登録する */
export function buildVending(c: DetailCtx) {
  const { D, box } = c; const x0 = -13.45;
  [-10.5, -8.5, -6.5].forEach((z, i) => {
    box(i === 1 ? 'vendRed' : 'vendBlue', `券売機${i + 1}号機`, x0, D + 1.05, z, 0.82, 2.1, 1.1, { ghost: true, collide: true, tag: 'vending', group: `vend${i}`, support: 'deck' });
    c.place(i === 1 ? 'ticket_red_fault' : 'ticket_blue', x0, D, z, 0, `券売機${i + 1}号機`);
  });
}

/** 精算機（改札内）・自動販売機・ゴミ箱・防犯カメラ・スピーカー・案内サイン・ポスターなど */
export function buildConcourseExtras(c: DetailCtx) {
  const { D, box, cyl } = c;
  // 精算機（改札内・西壁際）：高品質GLB（fare_adjuster）を配置
  { const x = -13.45, z = -1.6; box('vendBlue', '精算機', x, D + 1.05, z, 0.82, 2.1, 1.1, { ghost: true, collide: true, tag: 'vending', group: 'seisan', support: 'deck' }); c.place('fare_adjuster', x, D, z, 0, '精算機'); }
  // 自動販売機（既存位置の細部）
  [2.6, 4.0].forEach((z, i) => { const O = (e: Opt = {}): Opt => ({ tag: 'vending', group: 'vm' + i, support: 'none', ...e }); box('white', '自販機 前面パネル', -12.99, D + 1.25, z, 0.02, 1.1, 0.95, O()); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) box(['red', 'blue', 'green', 'orange'][(r + k) % 4], '自販機 サンプル缶', -12.97, D + 1.7 - r * 0.22, z - 0.34 + k * 0.23, 0.02, 0.16, 0.1, O({ lod: 2 })); box('slot', '自販機 取出口', -12.98, D + 0.34, z, 0.03, 0.2, 0.5, O({ lod: 1 })); box('ledAmber', '自販機 投入口灯', -12.98, D + 0.78, z + 0.38, 0.02, 0.1, 0.05, O({ lod: 2 })); });
  // ゴミ箱（分別3口）
  [[-13.2, 5.4, 0], [0.0, 11.0, Math.PI], [5.5, 11.0, Math.PI]].forEach(([x, z], i) => { const O = (e: Opt = {}): Opt => ({ tag: 'bench', group: 'bin' + i, support: 'none', ...e }); box('steel', 'ゴミ箱 本体', x, D + 0.45, z, 0.5, 0.9, 1.2, O({ collide: [D, D + 0.9], support: 'deck' })); (['blue', 'green', 'orange'] as const).forEach((m, k) => box(m, 'ゴミ箱 投入口', x + (x < 0 ? 0.26 : -0.26), D + 0.72, z - 0.4 + k * 0.4, 0.02, 0.22, 0.3, O({ lod: 1 }))); });
  // 防犯カメラ・スピーカー・火災報知器
  [[-10, -8], [10, -9], [-10, 9], [10, 9], [0, 0]].forEach(([x, z], i) => { const O = (e: Opt = {}): Opt => ({ tag: 'prop', group: 'cam' + i, support: 'none', lod: 1, ...e }); box('white', '防犯カメラ 台座', x, D + 4.28, z, 0.16, 0.06, 0.16, O()); box('steelDark', '防犯カメラ ドーム', x, D + 4.2, z, 0.13, 0.1, 0.13, O()); });
  for (const [x, z] of [[-7, -2], [7, -2], [-7, 6], [7, 6], [0, -9], [0, 8]]) cyl('white', '天井スピーカー', x, D + 4.3, z, 0.12, 0.08, { lod: 1, tag: 'prop', support: 'none', group: `spk${x}${z}` });
  for (const [x, z] of [[-3, 4], [3, 4], [-3, -8], [3, -8]]) cyl('red', '火災報知器', x, D + 4.34, z, 0.05, 0.04, { lod: 2, tag: 'prop', support: 'none', group: `fa${x}${z}` });
  // 案内サイン（吊り下げ・両面）
  const dbl = (t: THREE.Texture | null, n: string, x: number, y: number, z: number, w: number, h: number) => { c.sign(t, n + '（北面）', x, y, z - 0.02, w, h, Math.PI); c.sign(t, n + '（南面）', x, y, z + 0.02, w, h, 0); box('steelDark', n + ' 本体', x, y, z, w + 0.04, h + 0.04, 0.03, { lod: 1, tag: 'sign', support: 'mounted', group: 'sg' + n }); for (const dx of [-w * 0.35, w * 0.35]) box('steelDark', n + ' 吊り棒', x + dx, y + (D + 4.3 - y) / 2 + 0.02, z, 0.025, D + 4.3 - y, 0.025, { lod: 1, tag: 'sign', support: 'mounted', group: 'sg' + n }); };
  dbl(c.label('← 1・2番線ホーム →', 'Platforms 1-2 / Stairs', 512, 112, '#1f6f4a'), '番線案内', 0, D + 3.1, 1.6, 2.8, 0.62);
  dbl(c.label('← 券売機　　きっぷうりば →', 'Ticket Machines / Ticket Office', 640, 112, '#1c3d6e'), '券売機案内', 0, D + 3.1, -9.2, 3.8, 0.66);
  // ポスター（事務室外壁）
  c.sign(c.tex(256, 384, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#c0302b'; g.fillRect(0, 0, w, 70); g.fillStyle = '#fff'; g.font = `bold 34px ${FONT}`; g.fillText('ホームでの', 16, 32); g.fillText('歩きスマホ禁止', 16, 62); g.fillStyle = '#111'; g.font = `22px ${FONT}`; g.fillText('黄色い線の内側で', 16, 120); g.fillText('お待ちください', 16, 150); g.strokeStyle = '#e6bd1e'; g.lineWidth = 14; g.beginPath(); g.moveTo(16, 330); g.lineTo(240, 330); g.stroke(); }), 'ポスター（ホームの安全）', 6.89, D + 1.75, -6.4, 0.7, 1.05, -Math.PI / 2);
  c.sign(c.tex(256, 384, (g, w, h) => { g.fillStyle = '#eaf3ef'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b6f45'; g.fillRect(0, 0, w, 70); g.fillStyle = '#fff'; g.font = `bold 32px ${FONT}`; g.fillText('春の臨時列車', 16, 46); g.fillStyle = '#111'; g.font = `22px ${FONT}`; g.fillText('4月下旬 運転', 16, 118); g.fillText('星峰線 観光列車', 16, 150); g.fillStyle = '#a33'; g.font = '16px sans-serif'; g.fillText('※架空の掲示', 16, 360); }), 'ポスター（臨時列車）', 6.89, D + 1.75, -7.5, 0.7, 1.05, -Math.PI / 2);
}
