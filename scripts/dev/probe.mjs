// 左下黒四角の切り分け: canvasの実ピクセルと画面スクショを比較
import { chromium } from 'playwright-core'; import { pathToFileURL } from 'node:url'; import { resolve } from 'node:path';
const args = process.argv[2] === 'gl' ? ['--no-sandbox', '--use-gl=swiftshader'] : ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args });
const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
await pg.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await pg.waitForSelector('.menu');
await pg.click('button.card.playable'); await pg.click('.start-box button:has-text("はじめる")'); await pg.waitForSelector('.dlg-box');
await pg.evaluate(() => { window.__GC.setSettings({ quality: 'low', autoQuality: false, clockRunning: false }); });
for (let i = 0; i < 40; i++) { const k = await pg.evaluate(() => { const c = window.__GC; const v = c.view; if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') c.choose(v.options[0].id); return v.kind; }); if (k === 'hub') break; }
await pg.waitForTimeout(2500);
console.log(await pg.evaluate(() => new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('canvas'); const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const g = t.getContext('2d'); g.drawImage(cv, 0, 0); const px = (x, y) => [...g.getImageData(x, y, 1, 1).data].join(','); res({ w: cv.width, h: cv.height, black: px(150, 700), ctrl: px(400, 700), above: px(150, 600) }); }))));
await b.close();
