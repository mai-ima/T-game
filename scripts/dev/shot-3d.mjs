// 3D駅の見え方を、品質別に撮影して比較する：node scripts/dev/shot-3d.mjs /tmp/out
import { chromium } from 'playwright-core'; import { createServer } from 'vite'; import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/s3d'; mkdirSync(out, { recursive: true });
const srv = await createServer({ server: { port: 5191 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const pg = await b.newPage({ viewport: { width: 960, height: 600 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://localhost:5191/?audit'); await pg.click('.card.playable >> nth=0'); await pg.click('.start-box button:has-text("はじめる")'); await pg.waitForSelector('.dlg-box');
for (const q of ['low', 'high']) {
  await pg.evaluate(q => { const c = window.__GC; c.settings.autoQuality = false; c.rm.setAuto(false); c.rm.setQuality(q); c.view = c.runner.enter('ch1.hub'); c.notify(); }, q);
  await pg.waitForTimeout(9000); await pg.screenshot({ path: `${out}/${q}.png` });
}
console.log('errors', errs.slice(0, 4)); await b.close(); await srv.close();
