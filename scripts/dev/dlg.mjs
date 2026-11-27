import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const mobile = process.argv[2] === 'm'; const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await page.waitForSelector('.menu');
await page.click('button.card.playable'); await page.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await page.waitForSelector('.dlg-box'); await page.waitForTimeout(2500);
await page.screenshot({ path: `audit/tmp/dlg_${mobile ? 'm' : 'd'}_1.png`, timeout: 120000 });
await page.evaluate(() => { const c = window.__GC; c.advanceLine(); c.advanceLine(); c.advanceLine(); c.advanceLine(); }); await page.waitForTimeout(1500);
// 3D会話（久保田）
await page.evaluate(() => { const c = window.__GC; c.view = c.runner.enter('ch1.kaji_1'); c.afterView ? 0 : 0; c.notify(); }); await page.waitForTimeout(2500);
await page.screenshot({ path: `audit/tmp/dlg_${mobile ? 'm' : 'd'}_2.png`, timeout: 120000 });
console.log(errs.slice(0, 3)); await browser.close();
