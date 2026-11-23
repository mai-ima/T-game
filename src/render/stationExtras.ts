import * as THREE from 'three';
import type { DetailCtx } from './stationDetail';

/** 駅の追加施設：動く扉（自動ドア・開き戸）、駅事務室（再配置）、観光案内所、トイレ、売店、ホーム待合室、駅前のバス・タクシー・駐輪場。 */
export interface DoorUnit { id: string; kind: 'slide' | 'swing'; cx: number; cy: number; cz: number; axis: 'x' | 'z'; width: number; leaves: THREE.Object3D[]; closed: number[]; dirs: number[]; open: number; target: number; radius: number; sweep: number; auto: boolean; level: number; locked?: boolean }
export interface ExtraCtx extends DetailCtx { doors: DoorUnit[]; wallX: (mat: string, name: string, z: number, x0: number, x1: number, y0: number, h: number, t: number, gaps?: [number, number][], collide?: boolean, o?: any) => void; wallZ: (mat: string, name: string, x: number, z0: number, z1: number, y0: number, h: number, t: number, gaps?: [number, number][], collide?: boolean, o?: any) => void; P: number }
const FONT = '"Noto Sans JP","WenQuanYi Zen Hei",sans-serif';

function leaf(c: ExtraCtx, w: number, h: number, solid = false) {
  const g = new THREE.Group(); const t = 0.04; const steel = c.mat('steel'); const glass = c.mat(solid ? 'wall' : 'glass');
  const m = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, 0); o.castShadow = true; g.add(o); return o; };
  m(new THREE.BoxGeometry(w, 0.07, t), steel, 0, h - 0.035); m(new THREE.BoxGeometry(w, solid ? h * 0.9 : 0.16, t), steel, 0, solid ? h * 0.45 : 0.08); m(new THREE.BoxGeometry(0.06, h, t), steel, -w / 2 + 0.03, h / 2); m(new THREE.BoxGeometry(0.06, h, t), steel, w / 2 - 0.03, h / 2);
  if (!solid) m(new THREE.BoxGeometry(w - 0.1, h - 0.3, 0.012), glass, 0, h / 2 + 0.05); else m(new THREE.BoxGeometry(w - 0.1, 0.5, 0.012), c.mat('glass'), 0, h * 0.62);
  m(new THREE.BoxGeometry(0.03, 0.5, 0.05), steel, w / 2 - 0.12, h * 0.5); return g;
}
/** 扉を作る。axis='x'：壁がx方向に延び、通行はz方向。slide=両開き自動ドア、swing=片開き戸（hinge側 +1/-1、開く向き sw） */
export function makeDoor(c: ExtraCtx, o: { id: string; kind: 'slide' | 'swing'; x: number; y: number; z: number; axis: 'x' | 'z'; width: number; height?: number; solid?: boolean; hinge?: 1 | -1; sw?: 1 | -1; radius?: number; auto?: boolean; level?: number }) {
  const h = o.height ?? 2.3; const d: DoorUnit = { id: o.id, kind: o.kind, cx: o.x, cy: o.y, cz: o.z, axis: o.axis, width: o.width, leaves: [], closed: [], dirs: [], open: 0, target: 0, radius: o.radius ?? 1.9, sweep: o.kind === 'slide' ? 1 : 1.75, auto: o.auto ?? true, level: o.level ?? o.y };
  const rot = o.axis === 'x' ? 0 : -Math.PI / 2;
  if (o.kind === 'slide') {
    for (const s of [-1, 1]) { const piv = new THREE.Group(); const lf = leaf(c, o.width / 2 - 0.02, h, o.solid); lf.position.x = 0; piv.add(lf); const cp = s * (o.width / 4); piv.position.set(o.axis === 'x' ? o.x + cp : o.x, o.y, o.axis === 'x' ? o.z : o.z - cp); piv.rotation.y = rot; c.root.add(piv); d.leaves.push(piv); d.closed.push(cp); d.dirs.push(s); }
    const hd = new THREE.Mesh(new THREE.BoxGeometry(o.width + 0.2, 0.18, 0.12), c.mat('steelDark')); hd.position.set(o.x, o.y + h + 0.09, o.z); hd.rotation.y = rot; c.root.add(hd);
  } else {
    const hg = o.hinge ?? -1; const piv = new THREE.Group(); const lf = leaf(c, o.width - 0.03, h, o.solid); lf.position.x = -hg * (o.width / 2); piv.add(lf);
    const hx = o.axis === 'x' ? o.x + hg * (o.width / 2) : o.x; const hz = o.axis === 'x' ? o.z : o.z - hg * (o.width / 2); piv.position.set(hx, o.y, hz); piv.rotation.y = rot; c.root.add(piv); d.leaves.push(piv); d.closed.push(rot); d.dirs.push((o.sw ?? 1) * hg);
  }
  c.doors.push(d); return d;
}

const lab = (c: ExtraCtx, t: string, sub: string, bg: string, w = 320, h = 100, fg = '#fff') => c.label(t, sub, w, h, bg, fg);

export function buildExtras(c: ExtraCtx) {
  const { D, P, box, sign } = c; const O = (e: any = {}) => ({ tag: 'prop', support: 'none', ...e });

  // ================= 駅事務室（再配置）：x 7〜14, z -12〜-1 =================
  c.wallZ('wall', '事務室壁（西）', 7, -12, -1, D, 3.6, 0.2, [[-11, -8.2]], true, { support: 'deck' });
  c.wallX('wall', '事務室壁（南）', -1, 7, 14, D, 3.6, 0.2, [[8.0, 9.2]], true, { support: 'deck' });
  c.wallZ('wall', '休憩室仕切り壁', 11.2, -12, -1, D, 3.2, 0.14, [[-3.6, -2.6]], true, { support: 'deck' });
  box('glass', '窓口ガラス', 7, D + 1.6, -9.6, 0.05, 1.2, 2.8, { tag: 'glass', noShadow: true });
  box('wall', '窓口上部壁', 7, D + 2.9, -9.6, 0.2, 1.4, 2.8, { tag: 'wall', support: 'none' });
  box('woodMat', 'きっぷうりば カウンター', 6.6, D + 0.5, -9.6, 0.7, 1.0, 3.2, { collide: true, tag: 'counter', support: 'deck' });
  sign(lab(c, 'きっぷうりば', 'Ticket Office', '#1f6f4a', 512, 128), 'きっぷうりば看板', 6.9, D + 3.0, -9.6, 2.6, 0.65, -Math.PI / 2);
  box('wall', '事務室 床（絨毯）', 9.1, D + 0.006, -6.5, 4.0, 0.012, 10.8, { tag: 'floor', support: 'deck' }); box('wallDark', '休憩室 床', 12.6, D + 0.006, -6.5, 2.8, 0.012, 10.8, { tag: 'floor', support: 'deck' });
  box('white', '事務室 天井灯', 9.1, D + 3.5, -8.5, 2.6, 0.05, 0.3, { lod: 1, tag: 'light', support: 'none' }); box('white', '事務室 天井灯', 9.1, D + 3.5, -4.0, 2.6, 0.05, 0.3, { lod: 1, tag: 'light', support: 'none' });
  // 勤務表ホワイトボード（北壁）
  box('white', '勤務表ホワイトボード', 8.2, D + 1.75, -11.93, 1.7, 1.1, 0.04, { tag: 'board', support: 'mounted' });
  sign(c.tex(512, 256, (g, w, h) => { g.fillStyle = '#fafaf5'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d2a44'; g.font = `bold 30px ${FONT}`; g.fillText('4月 勤務表（新人）', 20, 40); g.font = `22px ${FONT}`; ['4/2(金) 日勤 8:30-17:15 指導:久保田', '4/3(土) 公休', '4/5(月)〜 日勤 ／ 4/8(木) 研修', '4/15(木) 早番 5:30-14:15'].forEach((t, i) => g.fillText(t, 20, 88 + i * 36)); g.strokeStyle = '#b33'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12); }), '勤務表（掲示）', 8.2, D + 1.75, -11.9, 1.62, 1.04, 0);
  // 駅長席・業務端末の島・放送卓・窓口側デスク
  const desk = (n: string, x: number, z: number, sx: number, sz: number, g: string) => { box('woodMat', n, x, D + 0.38, z, sx, 0.76, sz, O({ collide: true, tag: 'desk', support: 'deck', group: g })); };
  const chair = (x: number, z: number, g: string, face: 1 | -1) => { box('steelDark', '事務椅子（座面）', x, D + 0.45, z, 0.5, 0.08, 0.5, O({ tag: 'chair', group: g })); box('steelDark', '事務椅子（背）', x, D + 0.78, z + face * -0.22, 0.5, 0.56, 0.06, O({ tag: 'chair', group: g })); box('steelDark', '事務椅子（脚）', x, D + 0.22, z, 0.08, 0.44, 0.08, O({ tag: 'chair', support: 'deck', group: g })); box('steelDark', '事務椅子（足）', x, D + 0.03, z, 0.5, 0.05, 0.5, O({ tag: 'chair', support: 'deck', group: g })); };
  desk('駅長席', 10.0, -11.0, 1.7, 0.75, 'dk1'); chair(10.0, -10.2, 'dk1c', -1);
  box('steelDark', '電話機（指令直通）', 9.3, D + 0.8, -11.0, 0.22, 0.08, 0.2, O({ tag: 'terminal', group: 'dk1' })); box('red', '電話機 表示灯', 9.3, D + 0.85, -10.92, 0.04, 0.02, 0.02, O({ lod: 2, group: 'dk1' }));
  desk('端末席', 10.1, -7.6, 1.8, 0.8, 'dk2'); chair(10.1, -8.5, 'dk2c', 1);
  { const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), c.mat('screen')); scr.position.set(10.1, D + 1.07, -7.78); scr.rotation.y = 0; c.root.add(scr); box('steelDark', '業務端末（本体）', 10.1, D + 1.07, -7.82, 0.56, 0.38, 0.04, O({ tag: 'terminal', group: 'dk2' })); box('steelDark', '端末スタンド', 10.1, D + 0.82, -7.8, 0.12, 0.12, 0.1, O({ tag: 'terminal', group: 'dk2' })); box('ticket', 'キーボード', 10.1, D + 0.775, -7.45, 0.46, 0.03, 0.18, O({ lod: 1, group: 'dk2' })); }
  desk('放送卓', 7.55, -6.2, 0.9, 1.5, 'dk3'); box('steelDark', '放送マイク', 7.6, D + 0.9, -6.2, 0.1, 0.22, 0.1, O({ tag: 'prop', group: 'dk3' })); box('steelDark', '放送卓 機器', 7.55, D + 0.84, -5.6, 0.4, 0.16, 0.4, O({ tag: 'prop', group: 'dk3' })); chair(8.5, -6.2, 'dk3c', 1);
  box('steel', '書類棚', 7.5, D + 0.95, -3.2, 0.5, 1.9, 2.0, O({ collide: true, tag: 'shelf', support: 'deck' })); box('white', '遺失物保管ケース', 7.5, D + 0.45, -1.7, 0.5, 0.9, 0.9, O({ collide: true, tag: 'case', support: 'deck' }));
  for (let k = 0; k < 4; k++) box(['blue', 'red', 'green', 'orange'][k], '書類棚 ファイル', 7.78, D + 1.0 + (k % 2) * 0.6, -3.7 + k * 0.45, 0.02, 0.4, 0.2, O({ lod: 2, group: 'shelf' }));
  box('steel', '耐火金庫', 10.4, D + 0.45, -1.7, 0.7, 0.9, 0.6, O({ collide: true, tag: 'case', support: 'deck' }));
  // 休憩室
  for (let k = 0; k < 5; k++) box('steelDark', '更衣ロッカー', 13.65, D + 0.95, -10.8 + k * 0.52, 0.5, 1.9, 0.5, O({ collide: true, tag: 'shelf', support: 'deck', group: `lk${k}` }));
  box('woodMat', '休憩室テーブル', 12.5, D + 0.38, -5.0, 1.3, 0.76, 0.8, O({ collide: true, tag: 'desk', support: 'deck', group: 'tb' })); for (const [x, z] of [[12.5, -5.7], [12.5, -4.3]]) box('steelDark', '休憩室の椅子', x, D + 0.25, z, 0.4, 0.5, 0.4, O({ tag: 'chair', support: 'deck', group: 'tbc' + z }));
  box('steel', '給湯・流し台', 13.5, D + 0.45, -3.2, 0.6, 0.9, 1.0, O({ collide: true, tag: 'counter', support: 'deck' })); box('red', '給湯ポット', 13.5, D + 1.0, -3.4, 0.2, 0.22, 0.2, O({ lod: 2, group: 'pot' }));
  sign(lab(c, '休憩室', 'Staff Room', '#6b6f73', 256, 80), '休憩室札', 11.12, D + 2.35, -3.1, 0.6, 0.2, -Math.PI / 2);
  sign(lab(c, '駅事務室', 'Station Office', '#1c3d6e', 320, 100), '駅事務室札', 8.6, D + 2.6, -0.88, 0.9, 0.28, 0);
  makeDoor(c, { id: 'door_office', kind: 'swing', x: 8.6, y: D, z: -1, axis: 'x', width: 1.2, height: 2.2, solid: true, hinge: -1, sw: -1, radius: 1.7 });
  makeDoor(c, { id: 'door_staffroom', kind: 'swing', x: 11.2, y: D, z: -3.1, axis: 'z', width: 1.0, height: 2.15, solid: true, hinge: 1, sw: 1, radius: 1.5 });

  // ================= 観光案内所（改札外・北側）=================
  box('woodMat', '案内カウンター', -5.5, D + 0.5, -10.7, 2.6, 1.0, 0.7, O({ collide: true, tag: 'counter', support: 'deck', group: 'info' })); box('white', '案内所 背面パネル', -5.5, D + 1.4, -11.7, 2.8, 2.8, 0.1, O({ collide: true, tag: 'wall', support: 'deck', group: 'infoW' }));
  sign(lab(c, '観光案内所', 'Tourist Information', '#1b6f45', 384, 110), '観光案内所看板', -5.5, D + 3.1, -11.6, 2.4, 0.7, 0);
  sign(c.tex(256, 340, (g, w, h) => { g.fillStyle = '#fbf5e4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b6f45'; g.fillRect(0, 0, w, 56); g.fillStyle = '#fff'; g.font = `bold 30px ${FONT}`; g.fillText('周辺マップ', 16, 40); g.fillStyle = '#9ab'; g.fillRect(24, 90, 208, 3); g.fillRect(120, 70, 3, 240); g.fillStyle = '#d33'; g.beginPath(); g.arc(122, 92, 9, 0, 7); g.fill(); g.fillStyle = '#222'; g.font = `18px ${FONT}`; g.fillText('青嶺中央駅', 130, 130); g.fillText('海浜公園', 30, 200); g.fillText('星峰ロープウェイ', 100, 270); g.fillStyle = '#a33'; g.font = '14px sans-serif'; g.fillText('※架空の地図', 20, 326); }), '周辺マップ', -7.4, D + 1.7, -11.85, 0.8, 1.05, 0);
  for (let k = 0; k < 3; k++) box(['red', 'blue', 'green'][k], '観光パンフレット', -4.2 + k * 0.28, D + 1.12, -10.55, 0.2, 0.28, 0.02, O({ lod: 2, group: 'pamph' }));
  box('steelDark', 'パンフレットラック', -3.3, D + 0.7, -9.6, 0.5, 1.4, 0.3, O({ collide: true, tag: 'shelf', support: 'deck' }));

  // ================= トイレ（改札内・南西）：女/男/多目的 =================
  const tx0 = -13.9, tx1 = -8.1, tz0 = 8.6, tz1 = 11.9; const rooms: [number, number, string, string, string][] = [[-13.9, -11.5, '女性', '#c0392b', 'toilet_w'], [-11.5, -9.7, '男性', '#1f57b8', 'toilet_m'], [-9.7, -8.1, '多目的', '#1b6f45', 'toilet_a']];
  c.wallX('wall', 'トイレ前壁', tz0, tx0, tx1, D, 3.0, 0.14, [[-13.4, -12.2], [-11.2, -10.0], [-9.4, -8.3]], true, { support: 'deck' });
  c.wallX('wall', 'トイレ奥壁', tz1, tx0, tx1, D, 3.0, 0.14, [], true, { support: 'deck' }); c.wallZ('wall', 'トイレ仕切り', -11.5, tz0, tz1, D, 3.0, 0.14, [], true, { support: 'deck' }); c.wallZ('wall', 'トイレ仕切り', -9.7, tz0, tz1, D, 3.0, 0.14, [], true, { support: 'deck' });
  box('tile', 'トイレ床', -11.0, D + 0.006, 10.25, 5.8, 0.012, 3.3, { tag: 'floor', support: 'deck' });
  rooms.forEach(([a, b, n, col], i) => { const cx = (a + b) / 2; sign(lab(c, n, i === 2 ? 'Accessible' : i === 0 ? 'Women' : 'Men', col, 256, 100), `${n}トイレ表示`, cx, D + 2.55, tz0 - 0.09, 0.8, 0.3, Math.PI);
    box('white', `${n} 便器`, cx, D + 0.22, tz1 - 0.55, 0.4, 0.44, 0.6, O({ tag: 'fixture', group: `wc${i}`, support: 'deck' })); box('white', `${n} 洗面台`, a + 0.45, D + 0.85, tz1 - 0.3, 0.5, 0.1, 0.4, O({ tag: 'fixture', group: `wc${i}`, support: 'mounted' })); box('glass', `${n} 鏡`, a + 0.45, D + 1.5, tz1 - 0.08, 0.5, 0.6, 0.02, O({ tag: 'glass', noShadow: true, group: `wc${i}` })); });
  makeDoor(c, { id: 'door_wc_w', kind: 'swing', x: -12.8, y: D, z: tz0, axis: 'x', width: 1.2, height: 2.2, solid: true, hinge: -1, sw: -1, radius: 1.5 });
  makeDoor(c, { id: 'door_wc_m', kind: 'swing', x: -10.6, y: D, z: tz0, axis: 'x', width: 1.2, height: 2.2, solid: true, hinge: -1, sw: -1, radius: 1.5 });
  makeDoor(c, { id: 'door_wc_a', kind: 'slide', x: -8.85, y: D, z: tz0, axis: 'x', width: 1.1, height: 2.2, solid: true, radius: 1.7 });

  // ================= 売店（改札内・東）=================
  const sx0 = 8.3, sx1 = 13.8, sz0 = 2.2, sz1 = 9.6;
  c.wallX('wall', '売店北壁', sz0, sx0, sx1, D, 3.2, 0.14, [], true, { support: 'deck' }); c.wallX('wall', '売店南壁', sz1, sx0, sx1, D, 3.2, 0.14, [], true, { support: 'deck' });
  c.wallZ('wall', '売店西壁（ガラス窓あり）', sx0, sz0, sz1, D, 1.1, 0.14, [[3.4, 5.2]], true, { support: 'deck' }); box('glass', '売店ショーウィンドウ', sx0, D + 2.0, 6.3, 0.05, 1.8, 6.3, O({ tag: 'glass', noShadow: true })); box('wall', '売店 まぐさ', sx0, D + 2.95, 4.3, 0.14, 0.5, 1.8, O({ tag: 'wall' }));
  box('white', '売店 床', 11.05, D + 0.006, 5.9, 5.4, 0.012, 7.3, { tag: 'floor', support: 'deck' }); box('wall', '売店 天井灯', 11.0, D + 3.1, 5.9, 3.5, 0.05, 0.3, { lod: 1, tag: 'light', support: 'none' });
  sign(lab(c, '売店', 'Aorei Mart', '#c0392b', 320, 110), '売店看板', 8.2, D + 3.45, 4.3, 1.8, 0.62, -Math.PI / 2);
  box('woodMat', '売店レジカウンター', 10.2, D + 0.55, 6.9, 0.7, 1.1, 2.6, O({ collide: true, tag: 'counter', support: 'deck', group: 'reg' })); box('steelDark', 'レジ', 10.2, D + 1.2, 6.5, 0.4, 0.2, 0.4, O({ tag: 'terminal', group: 'reg' })); box('ticket', 'レジ 表示', 10.0, D + 1.4, 6.5, 0.02, 0.18, 0.3, O({ tag: 'terminal', group: 'reg' }));
  for (let r = 0; r < 3; r++) { box('steel', '商品棚', 12.0, D + 0.8, 3.2 + r * 1.0, 0.5, 1.6, 0.8, O({ collide: true, tag: 'shelf', support: 'deck', group: `sh${r}` })); for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) box(['red', 'blue', 'green', 'orange', 'yellow', 'white'][(k + j + r) % 6], '商品', 12.0, D + 0.35 + k * 0.36, 2.95 + r * 1.0 + j * 0.24, 0.4, 0.22, 0.14, O({ lod: 2, group: `sh${r}` })); }
  box('white', '冷蔵ケース', 13.5, D + 0.95, 6.8, 0.6, 1.9, 2.4, O({ collide: true, tag: 'vending', support: 'deck', group: 'fr' })); box('glass', '冷蔵ケース ガラス', 13.18, D + 1.0, 6.8, 0.02, 1.5, 2.2, O({ tag: 'glass', noShadow: true, group: 'fr' }));
  makeDoor(c, { id: 'door_shop', kind: 'slide', x: sx0, y: D, z: 4.3, axis: 'z', width: 1.8, height: 2.3, radius: 2.2 });

  // ================= ホーム待合室（東寄り・北側）=================
  const wx0 = 27.3, wx1 = 35.0, wz0 = -3.35, wz1 = -0.9;
  box('glass', '待合室ガラス（北）', (wx0 + wx1) / 2, P + 1.3, wz0, wx1 - wx0, 2.4, 0.04, { tag: 'glass', noShadow: true }); box('glass', '待合室ガラス（南）', (wx0 + wx1) / 2, P + 1.3, wz1, wx1 - wx0, 2.4, 0.04, { tag: 'glass', noShadow: true });
  c.wallZ('trim', '待合室東壁', wx1, wz0, wz1, P, 2.5, 0.08, [], true, { support: 'platform' }); c.wallZ('trim', '待合室西壁', wx0, wz0, wz1, P, 2.5, 0.08, [[-2.5, -1.4]], true, { support: 'platform' }); box('trim', '待合室 屋根', (wx0 + wx1) / 2, P + 2.55, (wz0 + wz1) / 2, wx1 - wx0 + 0.2, 0.1, wz1 - wz0 + 0.2, { tag: 'roof', support: 'none' });
  for (let k = 0; k < 3; k++) { box('woodMat', '待合室ベンチ', 30.5 + k * 2.2, P + 0.44, -3.0, 1.8, 0.07, 0.45, O({ collide: [P, P + 0.52], tag: 'bench', support: 'none', group: `wr${k}` })); for (const dx of [-0.75, 0.75]) box('steelDark', 'ベンチ脚', 30.5 + k * 2.2 + dx, P + 0.21, -3.0, 0.06, 0.42, 0.4, O({ tag: 'bench', support: 'platform', group: `wr${k}` })); }
  box('steel', '待合室 暖房機', 34.5, P + 0.3, -1.3, 0.5, 0.6, 0.2, O({ tag: 'prop', support: 'platform' })); sign(lab(c, '待合室', 'Waiting Room', '#1c3d6e', 320, 100), '待合室表示', 27.0, P + 2.3, -1.95, 0.9, 0.28, -Math.PI / 2);
  makeDoor(c, { id: 'door_waiting', kind: 'slide', x: wx0, y: P, z: -1.95, axis: 'z', width: 1.1, height: 2.2, radius: 1.8, level: P });
  // 構内入口の自動ドア（北面）
  makeDoor(c, { id: 'door_entrance', kind: 'slide', x: 0, y: D, z: -12.1, axis: 'x', width: 5.2, height: 3.3, radius: 3.2 });

  // ================= 駅前：バス・タクシー・駐輪場・交番 =================
  const bus = (x: number, z: number, col: string, g: string) => { box(col, 'バス車体', x, 1.7, z, 10.5, 2.5, 2.5, { collide: true, tag: 'vehicle', support: 'none', group: g }); box('white', 'バス屋根', x, 3.0, z, 10.3, 0.2, 2.4, O({ tag: 'vehicle', group: g })); box('glassDark', 'バス窓帯', x, 2.2, z, 10.0, 0.9, 2.56, O({ tag: 'vehicle', group: g })); for (const dx of [-3.4, 3.2]) for (const dz of [-1.1, 1.1]) box('rubber', 'バス車輪', x + dx, 0.55, z + dz, 1.0, 1.0, 0.3, O({ tag: 'vehicle', support: 'ground', group: g })); box('emissiveWhite', 'バス前照灯', x + 5.2, 1.0, z - 0.8, 0.05, 0.2, 0.3, O({ lod: 1, group: g })); box('emissiveWhite', 'バス前照灯', x + 5.2, 1.0, z + 0.8, 0.05, 0.2, 0.3, O({ lod: 1, group: g })); box('steelDark', 'バス底', x, 0.55, z, 10.2, 0.4, 2.2, O({ tag: 'vehicle', group: g })); };
  bus(-22, -44.5, 'blue', 'bus1'); bus(8, -44.5, 'green', 'bus2');
  const taxi = (x: number, z: number, g: string) => { box('yellow', 'タクシー', x, 0.8, z, 4.4, 1.0, 1.8, { collide: true, tag: 'vehicle', support: 'none', group: g }); box('yellow', 'タクシー 上部', x - 0.2, 1.5, z, 2.4, 0.7, 1.7, O({ tag: 'vehicle', group: g })); box('glassDark', 'タクシー 窓', x - 0.2, 1.5, z, 2.5, 0.5, 1.72, O({ tag: 'vehicle', group: g })); box('emissiveWhite', 'タクシー 行灯', x - 0.2, 1.95, z, 0.5, 0.18, 0.3, O({ lod: 1, group: g })); for (const dx of [-1.4, 1.4]) for (const dz of [-0.85, 0.85]) box('rubber', 'タクシー 車輪', x + dx, 0.32, z + dz, 0.64, 0.64, 0.25, O({ tag: 'vehicle', support: 'ground', group: g })); };
  taxi(26, -39, 'tx1'); taxi(32, -39, 'tx2');
  for (let k = 0; k < 8; k++) { box('steel', '駐輪ラック', 38 + k * 1.1, 0.5, -16.5, 0.05, 1.0, 1.6, O({ tag: 'rack', support: 'ground', group: `bk${k}` })); box('red', '自転車', 38 + k * 1.1, 0.5, -16.5, 0.05, 0.9, 1.5, O({ lod: 1, tag: 'vehicle', group: `bk${k}` })); }
  box('wall', '交番', -44, 1.7, -22, 4.2, 3.4, 3.4, { collide: true, tag: 'building', support: 'ground' }); box('red', '交番 屋根', -44, 3.55, -22, 4.6, 0.3, 3.8, O({ tag: 'building', group: 'kb' })); sign(lab(c, '交番', 'POLICE', '#1c3d6e', 256, 90), '交番看板', -44, 2.9, -20.28, 1.4, 0.45, 0);
}
