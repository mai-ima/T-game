import { chromium } from 'playwright-core'; import { pathToFileURL } from 'node:url'; import { resolve } from 'node:path';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
await pg.goto(pathToFileURL(resolve('dist/index.html')).href + '?audit'); await pg.waitForSelector('.menu');
await pg.click('button.card.playable'); await pg.click('.start-box button:has-text("はじめる")'); await pg.waitForSelector('.dlg-box');
for (let i = 0; i < 40; i++) { const k = await pg.evaluate(() => { const c = window.__GC; const v = c.view; if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') c.choose(v.options[0].id); return v.kind; }); if (k === 'hub') break; }
await pg.waitForTimeout(1500);
console.log(await pg.evaluate(() => [...document.querySelectorAll("body *")].filter(e => { const r = e.getBoundingClientRect(); return r.left < 160 && r.right > 140 && r.top < 680 && r.bottom > 660 && r.width < 1000; }).map(e => e.tagName + "." + e.className + " " + JSON.stringify(e.getBoundingClientRect()) + " " + getComputedStyle(e).backgroundColor + " pe=" + getComputedStyle(e).pointerEvents).join("\n")));
await b.close();
