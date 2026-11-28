// 3D場面の撮影。使い方: node scripts/dev/shots2.mjs '{"name":"x","preset":"plaza","minute":600,"q":"high","out":"/tmp/o"}'
// 前提: dist/ が vite build 済み。出力先は cfg.out（既定 audit/tmp）。
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const cfg = JSON.parse(process.argv[2]); const out = cfg.out ?? 'audit/tmp'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const [w, h] = cfg.vp ?? [1280, 800];
const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: !!cfg.touch, isMobile: !!cfg.touch, deviceScaleFactor: cfg.dpr ?? 1 });
const logs = []; page.on('pageerror', e => logs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await page.waitForSelector('.menu');
await page.click('button.card.playable'); await page.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await page.waitForSelector('.dlg-box');
await page.evaluate((cfg) => { const c = window.__GC; c.setSettings({ quality: cfg.q ?? 'high', autoQuality: false, clockRunning: false, view: cfg.view ?? '3d' }); }, cfg);
for (let i = 0; i < 40; i++) { const k = await page.evaluate(() => { const c = window.__GC; const v = c.view; if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') c.choose(v.options[0].id); return v.kind; }); if (k === 'hub') break; }
await page.evaluate((cfg) => { const c = window.__GC, rm = window.__RR.rm; if (cfg.minute) { c.world.clock.minute = Math.floor(cfg.minute); c.frac = cfg.minute % 1; } if (cfg.custom) { rm.data.presets.custom = cfg.custom; rm.setPreset('custom'); } else if (cfg.preset) rm.setPreset(cfg.preset); rm.camInit = false; }, cfg);
await page.waitForTimeout(cfg.wait ?? 2500); await page.screenshot({ path: `${out}/${cfg.name}.png` });
console.log(cfg.name, JSON.stringify(await page.evaluate(() => window.__RR.rm.stats())), logs.slice(0, 3));
await browser.close();
