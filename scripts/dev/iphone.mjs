// iPhone相当(390×844, DPR2, タッチ)での画面確認用。実機(WebKit)ではない。
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await page.waitForSelector('.menu');
await page.screenshot({ path: 'audit/tmp/ip_menu.png', timeout: 120000 });
await page.tap('button.card.playable'); await page.tap('text=最初から（第1章）'); await page.waitForSelector('.dlg-box');
await page.screenshot({ path: 'audit/tmp/ip_prologue.png', timeout: 120000 });
for (let i = 0; i < 60; i++) { const k = await page.evaluate(() => window.__GC.view.kind); if (k === 'hub') break; if (k === 'line') await page.tap('.dlg-box'); else if (k === 'choice') { await page.screenshot({ path: 'audit/tmp/ip_choice.png', timeout: 120000 }); await page.tap('.choice-opt >> nth=0'); } await page.waitForTimeout(80); }
await page.evaluate(() => window.__GC.setSettings({ clockRunning: false })); await page.waitForTimeout(1500);
await page.screenshot({ path: 'audit/tmp/ip_hub.png', timeout: 120000 });
await page.tap('text=メニュー'); await page.waitForTimeout(500); await page.screenshot({ path: 'audit/tmp/ip_hudmenu.png', timeout: 120000 });
console.log(JSON.stringify(await page.evaluate(() => window.__RR.rm.stats())), errs.slice(0, 3));
await browser.close();
