// メニュー用ヒーロー画像：実際の3D描画を1枚書き出す（src/assets/hero.jpg）。
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
mkdirSync('src/assets', { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 560 } });
await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await page.waitForSelector('.menu');
await page.click('button.card.playable'); await page.click('text=最初から（第1章）'); await page.waitForSelector('.dlg-box');
await page.evaluate(() => { const c = window.__GC; c.setSettings({ quality: 'high', autoQuality: false, clockRunning: false }); });
for (let i = 0; i < 40; i++) { const k = await page.evaluate(() => { const c = window.__GC; const v = c.view; if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') c.choose(v.options[0].id); return v.kind; }); if (k === 'hub') break; }
await page.evaluate(() => { const c = window.__GC, rm = window.__RR.rm; c.world.clock.minute = 8 * 60 + 25; c.frac = 0.5; rm.presets = null; const pr = rm.data.presets; pr.hero = { pos: [-30, 9, -30], target: [3, 4.2, -4], fov: 46 }; rm.setMarkers([]); rm.setPreset('hero'); rm.camInit = false; });
await page.waitForTimeout(4000);
const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.72));
writeFileSync('src/assets/hero.jpg', Buffer.from(url.split(',')[1], 'base64')); console.log('hero bytes', Buffer.from(url.split(',')[1], 'base64').length);
await browser.close();
