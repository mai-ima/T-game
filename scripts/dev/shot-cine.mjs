// 3D会話の演出（切り返し・被写界深度・視線）を撮影する：node scripts/dev/shot-cine.mjs /tmp/out [high|low]
import { chromium } from 'playwright-core'; import { createServer } from 'vite'; import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/cine'; const q = process.argv[3] ?? 'high'; mkdirSync(out, { recursive: true });
const srv = await createServer({ server: { port: 5199 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const pg = await b.newPage({ viewport: { width: 960, height: 600 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
await pg.goto('http://localhost:5199/?audit'); await pg.click('.card.playable >> nth=0'); await pg.click('.start-box button:has-text("はじめる")'); await pg.waitForSelector('.dlg-box', { timeout: 60000 });
await pg.waitForFunction(() => window.__GC?.rm, null, { timeout: 60000 }); await pg.evaluate(q => { const c = window.__GC; c.rm.setAuto(false); c.rm.setQuality(q); c.view = c.runner.enter('ch1.tenko'); c.lineIndex = 0; c.afterView(false); c.notify(); }, q);
for (const i of [0, 1, 2]) { await pg.waitForTimeout(6000); await pg.screenshot({ path: `${out}/line${i}.png` }); await pg.evaluate(() => { const c = window.__GC; c.advanceLine(); }); }
console.log('errors', errs); await b.close(); await srv.close();
