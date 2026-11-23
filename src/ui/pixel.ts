import type { CharacterDef } from '../engine/types';

/** ドット絵の描画キット：小さなキャンバスに矩形・楕円・多角形を塗り、外周に1pxの輪郭を自動で付ける。拡大は image-rendering: pixelated。 */
export class Px {
  c: HTMLCanvasElement; g: CanvasRenderingContext2D; constructor(public w: number, public h: number) { this.c = document.createElement('canvas'); this.c.width = w; this.c.height = h; this.g = this.c.getContext('2d')!; this.g.imageSmoothingEnabled = false; }
  px(x: number, y: number, col: string) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.g.fillStyle = col; this.g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  rect(x: number, y: number, w: number, h: number, col: string) { this.g.fillStyle = col; this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  ellipse(cx: number, cy: number, rx: number, ry: number, col: string, clip?: (x: number, y: number) => boolean) { this.g.fillStyle = col; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) this.g.fillRect(x, y, 1, 1); } }
  poly(pts: [number, number][], col: string) { this.g.fillStyle = col; const ys = pts.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) { const xs: number[] = []; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1)); } xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) this.g.fillRect(Math.round(xs[k]), y, Math.max(1, Math.round(xs[k + 1]) - Math.round(xs[k])), 1); } }
  line(x1: number, y1: number, x2: number, y2: number, col: string) { const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); for (let i = 0; i <= n; i++) this.px(x1 + ((x2 - x1) * i) / (n || 1), y1 + ((y2 - y1) * i) / (n || 1), col); }
  /** 透明部に接する不透明画素の外側へ輪郭を描く */
  outline(col: string) { const d = this.g.getImageData(0, 0, this.w, this.h); const a = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : d.data[(y * this.w + x) * 4 + 3]); const mark: [number, number][] = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) mark.push([x, y]); this.g.fillStyle = col; for (const [x, y] of mark) this.g.fillRect(x, y, 1, 1); }
  url() { return this.c.toDataURL('image/png'); }
}

export const hex = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export function shade(h: string, a: number) { const [r, g, b] = hex(h); const f = (c: number) => Math.max(0, Math.min(255, Math.round(a >= 0 ? c + (255 - c) * a : c * (1 + a)))); return `#${[f(r), f(g), f(b)].map(x => x.toString(16).padStart(2, '0')).join('')}`; }
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

type Hair = 'short' | 'side' | 'spiky' | 'bob' | 'ponytail' | 'long' | 'bun' | 'thin' | 'child';
const STYLE: Record<string, { hair: Hair; eye?: string }> = {
  player: { hair: 'short' }, shiraishi: { hair: 'side' }, kubota: { hair: 'ponytail' }, yamashina: { hair: 'spiky' }, morishita: { hair: 'bob' }, kajiwara: { hair: 'bun' }, hamaguchi: { hair: 'short' }, traveler: { hair: 'long' },
  sakai: { hair: 'ponytail' }, hinata: { hair: 'child' }, nomura: { hair: 'thin' }, haha: { hair: 'bob' }, tourist2: { hair: 'short', eye: '#3a6a9a' }
};
const cache = new Map<string, string>();
export const PW = 64, PH = 80;

/** 人物のドット絵（64×80）。人物データと表情から生成し、結果はキャッシュする。 */
export function pixelPortrait(d: CharacterDef, mood: string): string {
  const key = `${d.id}:${mood}`; const hit = cache.get(key); if (hit) return hit;
  const P = new Px(PW, PH); const st = STYLE[d.id] ?? { hair: d.gender === 'f' ? 'bob' : 'short' } as { hair: Hair; eye?: string }; const female = d.gender === 'f', child = st.hair === 'child', old = d.age >= 65;
  const staff = d.dept === 'station' || d.dept === 'dispatch' || d.dept === 'hr' || d.id === 'player';
  const sk = d.skin, skL = shade(sk, 0.22), skD = shade(sk, -0.18), skDD = shade(sk, -0.34); const hr = d.hair, hrL = shade(hr, 0.3), hrD = shade(hr, -0.35); const un = d.uniform, unL = shade(un, 0.2), unD = shade(un, -0.32);
  const INK = '#1a1410'; const eyeC = st.eye ?? '#2a1d16'; const happy = mood === 'smile', worry = mood === 'worry', serious = mood === 'serious', surprise = mood === 'surprise';
  const cx = 32, fy = child ? 33 : 30, frx = child ? 13 : 14, fry = child ? 14 : 17;
  // 髪（後ろ）
  if (st.hair === 'bob') { P.rect(14, 14, 36, 42, hr); P.rect(14, 56, 36, 1, hrD); }
  if (st.hair === 'long') { P.rect(12, 14, 40, 54, hr); P.rect(13, 14, 8, 54, hrD); }
  if (st.hair === 'ponytail') { P.ellipse(53, 34, 4, 13, hr); P.ellipse(53, 36, 2, 10, hrD); P.rect(50, 20, 4, 3, '#b02a2a'); }
  if (st.hair === 'bun') { P.ellipse(32, 8, 6, 5, hrL); P.ellipse(32, 9, 4, 3, hr); }
  // 首・体
  P.rect(27, 44, 10, 14, sk); P.rect(27, 49, 10, 3, skD);
  const bx = child ? 14 : 4, bw = PW - bx * 2; P.poly([[bx + 6, 58], [PW - bx - 6, 58], [PW - bx, PH], [bx, PH]], un); P.poly([[bx + 6, 58], [bx + 14, 58], [bx + 6, PH], [bx, PH]], unL); P.poly([[PW - bx - 14, 58], [PW - bx - 6, 58], [PW - bx, PH], [PW - bx - 8, PH]], unD); void bw;
  if (staff) {
    P.poly([[26, 52], [38, 52], [32, 66]], '#f4f2ec'); P.poly([[22, 54], [27, 52], [32, 66], [28, 80], [18, 80]], unD); P.poly([[42, 54], [37, 52], [32, 66], [36, 80], [46, 80]], unD);
    P.rect(30, 54, 4, 3, '#a82626'); P.poly([[30, 57], [34, 57], [35, 72], [32, 75], [29, 72]], '#b92d2d'); P.rect(31, 58, 1, 12, '#d65a5a');
    P.rect(40, 70, 2, 2, '#e0b838'); P.rect(22, 70, 2, 2, '#e0b838'); P.rect(44, 62, 8, 4, '#ffffff'); P.rect(44, 62, 2, 4, '#1b6f45'); P.rect(47, 63, 4, 1, '#1d2a44'); P.rect(47, 65, 3, 1, '#1d2a44');
  } else { P.poly([[24, 55], [32, 62], [40, 55], [38, 52], [26, 52]], shade(un, -0.2)); if (d.accessory === 'bag') { P.line(12, 80, 24, 58, '#6a4a3a'); P.line(13, 80, 25, 58, '#6a4a3a'); P.line(52, 80, 40, 58, '#6a4a3a'); } }
  // 耳・顔
  P.ellipse(cx - frx - 1, fy + 3, 2, 4, sk); P.ellipse(cx + frx + 1, fy + 3, 2, 4, sk); P.px(cx - frx - 1, fy + 3, skD); P.px(cx + frx + 1, fy + 3, skD);
  P.ellipse(cx, fy, frx, fry, sk); P.ellipse(cx + 3, fy + 3, frx - 3, fry - 3, sk); P.ellipse(cx - 4, fy - 4, frx - 7, fry - 9, skL);
  // 陰影（右・あご）
  for (let y = fy - fry; y <= fy + fry; y++) for (let x = cx - frx; x <= cx + frx; x++) { const dx = (x - cx) / frx, dy = (y - fy) / fry; if (dx * dx + dy * dy <= 1 && (dx > 0.62 || dy > 0.82)) P.px(x, y, skD); }
  if (female || child) { P.rect(cx - 11, fy + 6, 4, 2, '#e9877c'); P.rect(cx + 7, fy + 6, 4, 2, '#e9877c'); }
  if (old) { P.rect(cx - 10, fy - 9, 7, 1, skDD); P.rect(cx + 3, fy - 9, 7, 1, skDD); P.px(cx - 6, fy + 10, skDD); P.px(cx + 6, fy + 10, skDD); }
  // 目・眉・鼻・口
  const ey = fy - 1; const eye = (x: number, f: number) => {
    if (happy) { P.px(x - 3, ey + 1, INK); P.px(x - 2, ey, INK); P.px(x - 1, ey - 1, INK); P.px(x, ey - 1, INK); P.px(x + 1, ey - 1, INK); P.px(x + 2, ey, INK); P.px(x + 3, ey + 1, INK); return; }
    const hgt = surprise ? 6 : serious ? 3 : 4; P.rect(x - 3, ey - 2, 7, hgt, '#fbfaf6'); P.rect(x - 1 + f, ey - 1, 3, surprise ? 4 : 3, eyeC); P.px(x + f, ey - 1, '#000'); P.px(x - 1 + f, ey - 1, '#fff'); P.rect(x - 3, ey - 3, 7, 1, INK); if (female) { P.px(x - 4 * f * -1, ey - 3, INK); P.px(x + 4 * f * -1 + (f > 0 ? 0 : 0), ey - 3, INK); } P.rect(x - 3, ey + hgt - 2, 7, 1, skD);
  };
  eye(cx - 7, 1); eye(cx + 7, -1);
  const by = ey - 6; const bc = old ? '#a9a9a4' : shade(hr, -0.1); const brow = (x: number, f: number) => { const t = worry ? -f : serious ? f : 0; for (let i = -3; i <= 3; i++) P.px(x + i, by + (t > 0 ? (i * f > 0 ? 1 : 0) : t < 0 ? (i * f > 0 ? 0 : 1) : 0) - (surprise ? 2 : 0), bc); if (!female && !child) for (let i = -3; i <= 3; i++) P.px(x + i, by + 1 + (t > 0 ? (i * f > 0 ? 1 : 0) : t < 0 ? (i * f > 0 ? 0 : 1) : 0) - (surprise ? 2 : 0), bc); };
  brow(cx - 7, 1); brow(cx + 7, -1);
  P.px(cx, fy + 4, skD); P.px(cx, fy + 5, skDD); P.px(cx + 1, fy + 5, skDD);
  const my = fy + 10; const lip = '#8a3a34';
  if (happy) { P.rect(cx - 3, my, 7, 1, lip); P.rect(cx - 2, my + 1, 5, 2, '#5a1f1c'); P.rect(cx - 2, my + 1, 5, 1, '#fff'); P.px(cx - 4, my - 1, lip); P.px(cx + 4, my - 1, lip); }
  else if (surprise) { P.rect(cx - 1, my, 3, 3, '#5a1f1c'); P.rect(cx - 2, my + 1, 1, 1, lip); P.rect(cx + 2, my + 1, 1, 1, lip); P.rect(cx - 1, my - 1, 3, 1, lip); P.rect(cx - 1, my + 3, 3, 1, lip); }
  else if (worry) { P.rect(cx - 2, my + 1, 5, 1, lip); P.px(cx - 3, my + 2, lip); P.px(cx + 3, my + 2, lip); P.px(cx + 12, ey - 4, '#9fd0ee'); P.px(cx + 12, ey - 3, '#9fd0ee'); P.px(cx + 12, ey - 2, '#5aa6cc'); }
  else if (serious) P.rect(cx - 3, my + 1, 7, 1, lip); else { P.rect(cx - 2, my + 1, 5, 1, lip); P.px(cx - 3, my, lip); P.px(cx + 3, my, lip); }
  // 髪（前）
  const cap = (yy0: number) => { void yy0; };
  void cap;
  const topY = fy - fry; const hairTop = (h: number, w = frx + 3) => { P.ellipse(cx, topY + 4, w, h, hr, (x, y) => y <= topY + 6); P.ellipse(cx - 4, topY + 2, w - 6, h - 4, hrL, (x, y) => y <= topY + 3); };
  switch (st.hair) {
    case 'short': hairTop(9); P.rect(cx - frx - 2, topY + 4, 3, 9, hr); P.rect(cx + frx, topY + 4, 3, 9, hrD); P.rect(cx - 6, topY + 5, 12, 2, hr); break;
    case 'side': hairTop(9); P.rect(cx - frx - 2, topY + 4, 3, 9, old || d.age > 45 ? '#cfcfcf' : hr); P.rect(cx + frx, topY + 4, 3, 9, old || d.age > 45 ? '#cfcfcf' : hrD); P.line(cx - 6, topY + 3, cx + 8, topY + 8, hrD); P.line(cx - 6, topY + 4, cx + 6, topY + 9, hr); break;
    case 'spiky': hairTop(9); P.rect(cx - frx - 2, topY + 4, 3, 8, hr); P.rect(cx + frx, topY + 4, 3, 8, hrD); for (const [sx, sh] of [[-9, 6], [-4, 9], [1, 10], [6, 8], [11, 5]] as [number, number][]) P.poly([[cx + sx - 3, topY + 4], [cx + sx, topY + 4 - sh], [cx + sx + 3, topY + 4]], hr); P.rect(cx - 7, topY + 5, 14, 2, hr); break;
    case 'bob': hairTop(9); P.rect(cx - frx - 1, topY + 4, 5, 16, hr); P.rect(cx + frx - 3, topY + 4, 5, 16, hrD); P.rect(cx - frx + 3, topY + 6, 6, 3, hr); P.rect(cx + 4, topY + 6, 6, 3, hr); break;
    case 'ponytail': hairTop(9); P.rect(cx - frx - 2, topY + 4, 3, 9, hr); P.rect(cx + frx, topY + 4, 3, 10, hrD); P.rect(cx - 8, topY + 5, 16, 2, hr); break;
    case 'long': hairTop(10); P.rect(cx - frx - 3, topY + 4, 5, 34, hr); P.rect(cx + frx - 1, topY + 4, 5, 34, hrD); P.rect(cx - 9, topY + 6, 18, 3, hr); break;
    case 'bun': hairTop(8); P.rect(cx - frx - 1, topY + 4, 3, 8, hr); P.rect(cx + frx - 1, topY + 4, 3, 8, hrD); P.rect(cx - 6, topY + 5, 12, 2, hrL); break;
    case 'thin': P.rect(cx - frx - 2, topY + 6, 3, 10, '#d9d9d4'); P.rect(cx + frx, topY + 6, 3, 10, '#c4c4bf'); P.rect(cx - 7, topY + 1, 14, 1, '#d9d9d4'); P.ellipse(cx - 5, topY + 3, 4, 2, skL, (x, y) => y <= topY + 4); break;
    case 'child': hairTop(9, frx + 2); P.rect(cx - frx - 1, topY + 4, 4, 9, hr); P.rect(cx + frx - 2, topY + 4, 4, 9, hrD); P.rect(cx - frx + 2, topY + 5, 11, 4, hr); P.rect(cx + 1, topY + 5, 12, 3, hrD); break;
  }
  if (d.accessory === 'cap') { const cy2 = topY - 1; P.ellipse(cx, cy2 + 4, 17, 10, un, (x, y) => y <= cy2 + 5); P.ellipse(cx - 4, cy2 + 2, 11, 7, unL, (x, y) => y <= cy2 + 3); P.rect(cx - 17, cy2 + 5, 35, 4, unD); P.rect(cx - 16, cy2 + 9, 33, 2, '#0d1220'); P.rect(cx - 3, cy2 + 1, 6, 5, '#e0b838'); P.rect(cx - 2, cy2 + 2, 4, 3, '#8a6a10'); P.px(cx - 1, cy2 + 3, '#e0b838'); P.px(cx, cy2 + 3, '#e0b838'); }
  if (d.accessory === 'glasses') { for (const x of [cx - 7, cx + 7]) { P.rect(x - 5, ey - 4, 11, 1, INK); P.rect(x - 5, ey + 3, 11, 1, INK); P.rect(x - 5, ey - 4, 1, 8, INK); P.rect(x + 5, ey - 4, 1, 8, INK); } P.rect(cx - 2, ey - 2, 4, 1, INK); P.px(cx - 4, ey - 3, '#ffffff'); P.px(cx + 10, ey - 3, '#ffffff'); }
  P.outline(INK); const url = P.url(); cache.set(key, url); return url;
}

/** 2D場面の背景（192×108のドット絵）。image-rendering: pixelated で拡大する。 */
const sceneCache = new Map<string, string>();
export function pixelScene(kind: string): string {
  const hit = sceneCache.get(kind); if (hit) return hit; const W = 192, H = 108; const P = new Px(W, H); const r = rng(kind.length * 977 + 13);
  const sky = (h: number) => { for (let y = 0; y < h; y++) { const t = y / h; const col = t < 0.33 ? '#7fb6ea' : t < 0.66 ? '#9cc9f0' : '#bddcf5'; P.rect(0, y, W, 1, col); if (t > 0.3 && t < 0.37) for (let x = y % 2; x < W; x += 2) P.px(x, y, '#9cc9f0'); if (t > 0.62 && t < 0.69) for (let x = y % 2; x < W; x += 2) P.px(x, y, '#bddcf5'); } };
  const cloud = (x: number, y: number) => { P.ellipse(x, y, 9, 3, '#fff'); P.ellipse(x - 5, y - 2, 5, 3, '#fff'); P.ellipse(x + 4, y - 2, 6, 4, '#fff'); P.rect(x - 9, y + 2, 19, 1, '#dbeaf6'); };
  const hills = (y: number, c1: string, c2: string) => { for (let x = 0; x < W; x++) { const h = Math.round(Math.sin(x / 15) * 5 + Math.sin(x / 6 + 2) * 2); P.rect(x, y + h, 1, 40, x % 2 ? c1 : c2); } };
  const tile = (x0: number, y0: number, w: number, h: number, a: string, b: string, s = 4) => { for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) P.rect(x0 + x, y0 + y, s, s, ((x + y) / s) % 2 ? a : b); };
  if (kind === 'depot') {
    sky(62); cloud(40, 14); cloud(130, 22); hills(58, '#6d8f6a', '#678a64');
    P.rect(0, 70, W, 38, '#59616a'); tile(0, 70, W, 38, '#59616a', '#535b64', 4);
    for (let i = 0; i < 4; i++) { const x = 6 + i * 22; P.rect(x, 40, 18, 32, '#8a97a3'); P.rect(x, 40, 18, 4, '#4a5560'); P.rect(x + 3, 50, 12, 22, '#2a3440'); P.rect(x + 3, 50, 12, 2, '#3b4a58'); for (let k = 0; k < 4; k++) P.rect(x + 3, 54 + k * 4, 12, 1, '#222c36'); } P.rect(0, 70, 100, 2, '#3a444e');
    P.rect(98, 56, 90, 22, '#d6dce2'); P.rect(98, 56, 90, 3, '#b8c0c8'); for (let k = 0; k < 6; k++) { P.rect(104 + k * 14, 61, 10, 8, '#2c4a6a'); P.rect(104 + k * 14, 61, 10, 1, '#4a6a8a'); } P.rect(98, 70, 90, 2, '#e8801f'); P.rect(98, 72, 90, 2, '#1b5fa8'); P.rect(104, 78, 80, 3, '#2a2f35'); for (const wx of [108, 124, 160, 176]) { P.ellipse(wx, 81, 3, 3, '#3a3f45'); }
    P.rect(0, 84, W, 3, '#6d6a66'); P.rect(0, 88, W, 1, '#9aa4ad'); P.rect(0, 94, W, 1, '#9aa4ad'); for (let x = 0; x < W; x += 6) P.rect(x, 86, 3, 12, '#7a746c'); P.rect(0, 98, W, 10, '#3a3f45');
  } else if (kind === 'office') {
    P.rect(0, 0, W, H, '#d9dde0'); tile(0, 0, W, 4, '#c9ced2', '#d9dde0', 2); P.rect(0, 70, W, 38, '#b9b2a6'); tile(0, 70, W, 38, '#b9b2a6', '#aea79b', 6);
    P.rect(18, 14, 100, 46, '#7fb6ea'); sky(0); for (let y = 14; y < 60; y++) P.rect(18, y, 100, 1, y < 34 ? '#8dc0ee' : '#b4d6f2'); for (let i = 0; i < 6; i++) P.rect(20 + i * 16, 36 - (i % 3) * 6, 12, 24 + (i % 3) * 6, i % 2 ? '#9aa8b6' : '#aab6c2'); cloud(50, 24); cloud(96, 30);
    P.rect(16, 12, 104, 2, '#8a97a3'); P.rect(16, 60, 104, 3, '#8a97a3'); for (const x of [16, 50, 84, 118]) P.rect(x, 12, 3, 51, '#8a97a3');
    P.rect(132, 18, 44, 30, '#f6f6f0'); P.rect(132, 18, 44, 2, '#8c8c8c'); P.rect(132, 46, 44, 2, '#8c8c8c'); P.rect(132, 18, 2, 30, '#8c8c8c'); P.rect(174, 18, 2, 30, '#8c8c8c'); for (let k = 0; k < 4; k++) P.rect(138, 25 + k * 5, 24 - (k % 2) * 6, 2, '#2a4a7a'); P.rect(166, 24, 5, 5, '#c0302b'); P.ellipse(152, 10, 6, 6, '#fff'); P.line(152, 10, 152, 6, '#222'); P.line(152, 10, 155, 11, '#222');
    P.rect(6, 76, 70, 14, '#8a6a48'); P.rect(6, 76, 70, 2, '#a98560'); P.rect(8, 90, 4, 12, '#6a4a30'); P.rect(68, 90, 4, 12, '#6a4a30'); P.rect(20, 66, 22, 10, '#26384a'); P.rect(22, 68, 18, 6, '#4aa0d8'); P.rect(28, 76, 6, 2, '#26384a');
    P.rect(120, 74, 66, 16, '#8a6a48'); P.rect(120, 74, 66, 2, '#a98560'); P.rect(124, 90, 4, 12, '#6a4a30'); P.rect(178, 90, 4, 12, '#6a4a30'); P.rect(140, 64, 24, 10, '#26384a'); P.rect(142, 66, 20, 6, '#4aa0d8');
    P.rect(86, 66, 20, 34, '#7a8794'); for (let k = 0; k < 5; k++) P.rect(88, 70 + k * 6, 16, 1, '#5a6874');
  } else {
    P.rect(0, 0, W, H, '#d9d4c8'); for (let y = 0; y < 66; y += 2) P.rect(0, y, W, 1, y % 4 ? '#d9d4c8' : '#d2cdbf'); P.rect(0, 66, W, 6, '#6a5a42'); P.rect(0, 72, W, 36, '#8a7658'); tile(0, 72, W, 36, '#8a7658', '#7f6c50', 6);
    P.rect(14, 12, 64, 42, '#8a7f6c'); P.rect(17, 15, 58, 36, '#9cc9f0'); sky(0); for (let y = 15; y < 51; y++) P.rect(17, y, 58, 1, y < 30 ? '#8dc0ee' : '#bddcf5'); P.rect(45, 15, 3, 36, '#8a7f6c'); P.rect(17, 31, 58, 3, '#8a7f6c'); P.ellipse(30, 48, 18, 7, '#6d9a62'); P.ellipse(60, 46, 16, 6, '#7fa86f'); cloud(34, 22); cloud(64, 26);
    P.rect(104, 18, 58, 34, '#f5f2ea'); P.rect(104, 18, 58, 2, '#8a7f6c'); P.rect(104, 50, 58, 2, '#8a7f6c'); P.rect(104, 18, 2, 34, '#8a7f6c'); P.rect(160, 18, 2, 34, '#8a7f6c'); for (let k = 0; k < 3; k++) P.rect(110, 25 + k * 8, 34 + (k % 2) * 10, 2, '#9aa'); P.rect(120, 76, 56, 14, '#6a5a42'); P.rect(120, 76, 56, 2, '#8a7658');
    P.rect(6, 86, 12, 22, '#4a3a2a'); P.ellipse(12, 80, 10, 8, '#4f8a4a'); P.ellipse(9, 77, 5, 4, '#68a862');
  }
  for (let i = 0; i < 40; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H); if (P.g.getImageData(x, y, 1, 1).data[3]) P.px(x, y, i % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'); }
  const url = P.url(); sceneCache.set(kind, url); return url;
}
