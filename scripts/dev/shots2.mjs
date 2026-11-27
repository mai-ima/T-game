import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
mkdirSync('audit/tmp', { recursive: true });
const cfg = JSON.parse(process.argv[2]); // {name, q, view, minute, preset, pos:[x,y,z,yaw], vp:[w,h], cam}
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const [w, h] = cfg.vp ?? [1280, 800];
const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: !!cfg.touch, isMobile: !!cfg.touch, deviceScaleFactor: cfg.dpr ?? 1 });
const logs = []; page.on('pageerror', e => logs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await page.waitForSelector('.menu');
await page.click('button.card.playable'); await page.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await page.waitForSelector('.dlg-box');
await page.evaluate((cfg) => { const c = window.__GC; c.setSettings({ quality: cfg.q ?? 'high', autoQuality: false, clockRunning: false, view: cfg.view ?? '3d' }); }, cfg);
for (let i = 0; i < 40; i++) { const k = await page.evaluate(() => { const c = window.__GC; const v = c.view; if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') c.choose(v.options[0].id); return v.kind; }); if (k === 'hub') break; }
await page.evaluate((cfg) => { const c = window.__GC, rm = window.__RR.rm; if (cfg.minute) { c.world.clock.minute = Math.floor(cfg.minute); c.frac = cfg.minute % 1; } if (cfg.pos) c.sim.teleport(...cfg.pos); if (cfg.preset) { rm.setPreset(cfg.preset); } else if (cfg.cam) rm.setCameraMode(cfg.cam); if (cfg.yaw !== undefined) { rm.yaw = cfg.yaw; } if (cfg.dist) rm.dist = cfg.dist; if (cfg.pitch !== undefined) rm.pitch = cfg.pitch; if (cfg.panel) { c.panel = cfg.panel; c.notify(); } if (cfg.level) rm.planLevel = cfg.level; if (cfg.scale) rm.plan.scale = cfg.scale; rm.camInit = false; }, cfg);
await page.waitForTimeout(cfg.wait ?? 1500); await page.screenshot({ path: `audit/tmp/${cfg.name}.png` });
console.log(cfg.name, JSON.stringify(await page.evaluate(() => window.__RR.rm.stats())), logs.slice(0, 3));
await browser.close();
