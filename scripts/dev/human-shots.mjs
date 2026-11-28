// 人物モデルの追加視点（顔・胸元・髪型・歩行・低LOD）を audit/models/human_*.jpg へ撮影する。要：dist-lab ビルド済み（node scripts/export-models.mjs human で生成）
import { chromium } from 'playwright-core'; import { writeFileSync } from 'node:fs'; import { pathToFileURL } from 'node:url'; import { resolve } from 'node:path';
const sel = process.argv[2] ? process.argv[2].split(',') : null;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 960, height: 640 } }); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(pathToFileURL(resolve('dist-lab/index.html')).href); await pg.waitForFunction(() => window.LAB);
const V = { face: ['human', 0.35, 0.05, 1, { target: [0, 1.62, 0], dist: 0.55 }], face_front: ['human', 0, 0.02, 1, { target: [0, 1.62, 0], dist: 0.5 }], chest: ['human', 0.35, 0.15, 1, { target: [0, 1.32, 0], dist: 0.75 }], hand: ['human', 1.2, 0.1, 1, { target: [0.25, 0.85, 0.05], dist: 0.6 }], shoe: ['human', 0.9, 0.3, 1, { target: [0, 0.1, 0.05], dist: 0.7 }],
  hair_long: ['human', 2.6, 0.1, 1, { hair: 'long', target: [0, 1.5, 0], dist: 1.3 }], hair_bun: ['human', 0.7, 0.1, 1, { hair: 'bun', cap: false, target: [0, 1.6, 0], dist: 0.7 }], cap: ['human', 0.5, 0.1, 1, { cap: true, glasses: true, target: [0, 1.6, 0], dist: 0.7 }],
  walk: ['human', 1.2, 0.1, 1, { walk: 1.0 }], walk_front: ['human', 0.4, 0.1, 1, { walk: -1.2 }], lo: ['human_lo', 0.7, 0.35, 1, {}], full_back: ['human', Math.PI, 0.1, 1, {}], full_side: ['human', Math.PI / 2, 0.1, 1, {}] };
for (const [k, a] of Object.entries(V)) { if (sel && !sel.includes(k)) continue; const url = await pg.evaluate(([n, y, p, m, o]) => window.LAB.preview(n, y, p, m, 800, 560, o), a); writeFileSync(`audit/models/human_${k}.jpg`, Buffer.from(url.split(',')[1], 'base64')); }
await b.close();
