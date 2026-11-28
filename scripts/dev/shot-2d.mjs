// 2D場面（Stage25D）の演出を撮影する：node scripts/dev/shot-2d.mjs /tmp/out
import { chromium } from 'playwright-core'; import { createServer } from 'vite'; import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/s2d'; mkdirSync(out, { recursive: true });
const srv = await createServer({ server: { port: 5189 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true });
await pg.goto('http://localhost:5189/?audit'); await pg.click('.card.playable >> nth=0'); await pg.click('.start-box button:has-text("はじめる")'); await pg.waitForSelector('.dlg-box');
for (const [id, name, min] of [['ch1.p_r_station', 'lunch_day', 720], ['ch1.p_r_station', 'lunch_dusk', 1050], ['ch1.p_r_station', 'lunch_night', 1260]]) {
  await pg.evaluate(([id, min]) => { const c = window.__GC; c.panel = null; c.world.clock.minute = min; c.view = c.runner.enter(id); c.lineIndex = 0; c.notify(); }, [id, min]); await pg.waitForTimeout(1500); await pg.screenshot({ path: `${out}/${name}.png` });
}
await b.close(); await srv.close(); console.log('ok');
