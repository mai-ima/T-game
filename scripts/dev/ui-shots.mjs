// UI確認用：主要画面を390px幅で撮影する（出力先は引数。既定 /tmp/ui）。
import { chromium } from 'playwright-core'; import { createServer } from 'vite'; import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/ui'; mkdirSync(out, { recursive: true });
const srv = await createServer({ server: { port: 5193 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true });
await pg.goto('http://localhost:5193/?audit'); await pg.waitForSelector('.menu'); await pg.screenshot({ path: out + '/1_menu.png' });
await pg.click('.card.playable >> nth=0'); await pg.waitForTimeout(400); await pg.screenshot({ path: out + '/2_modal.png' });
await pg.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await pg.waitForSelector('.dlg-box'); await pg.waitForTimeout(1200); await pg.screenshot({ path: out + '/3_dialogue.png' });
await pg.evaluate(() => { const c = window.__GC; c.view = c.runner.enter('ch1.p_wish'); c.notify(); }); await pg.waitForTimeout(800); await pg.screenshot({ path: out + '/4_choice.png' });
await pg.evaluate(() => { const c = window.__GC; c.runner.world.flags['ch1.tenko'] = true; c.view = c.runner.enter('ch1.hub'); c.notify(); }); await pg.waitForTimeout(2500); await pg.screenshot({ path: out + '/5_hub.png' });
await pg.evaluate(() => { const c = window.__GC; c.view = c.runner.enter('ch1.vend_task'); c.notify(); }); await pg.waitForTimeout(600); await pg.screenshot({ path: out + '/6_task.png' });
await b.close(); await srv.close(); console.log('ok');
