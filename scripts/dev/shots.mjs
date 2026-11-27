// 開発用：ゲームを第1章ハブまで進め、指定プリセットで撮影する。
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
mkdirSync('audit/tmp', { recursive: true });
const q = process.argv[2] ?? 'high'; const presets = (process.argv[3] ?? 'overview,front,gate').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = []; page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); }); page.on('pageerror', e => logs.push('pageerror: ' + e.message));
await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await page.waitForSelector('.menu');
await page.click('button.card.playable'); await page.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await page.waitForSelector('.dlg-box');
await page.evaluate((q) => { const c = window.__GC; c.settings.autoQuality = false; c.setSettings({ quality: q, autoQuality: false, clockRunning: false }); }, q);
for (let i = 0; i < 40; i++) { const k = await page.evaluate(() => { const c = window.__GC; const v = c.view; if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') c.choose(v.options[0].id); return v.kind; }); if (k === 'hub') break; }
await page.waitForTimeout(500);
for (const p of presets) { await page.evaluate((p) => { const rm = window.__RR.rm; rm.setPreset(p === 'follow' ? null : p); rm.camInit = false; }, p); await page.waitForTimeout(900); await page.screenshot({ path: `audit/tmp/${q}_${p}.png` }); }
console.log(JSON.stringify(await page.evaluate(() => window.__RR.rm.stats())), logs.slice(0, 5));
await browser.close();
