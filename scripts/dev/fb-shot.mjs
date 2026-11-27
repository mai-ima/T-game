// 手応え表示の確認：関係が動く選択をして、画面隅の合図を撮影する。
import { chromium } from 'playwright-core'; import { createServer } from 'vite';
const srv = await createServer({ server: { port: 5192 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: 390, height: 780 } });
await pg.goto('http://localhost:5192/?audit'); await pg.click('.card.playable >> nth=0'); await pg.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await pg.waitForSelector('.dlg-box'); await pg.waitForTimeout(800);
await pg.evaluate(() => { const c = window.__GC; c.view = c.runner.enter('ch1.assist_c1'); c.afterViewForTest?.(); c.notify(); }); await pg.waitForTimeout(500);
await pg.locator('.choice-opt').nth(0).dispatchEvent('click'); await pg.waitForTimeout(700); await pg.screenshot({ path: '/tmp/fb.png' });
console.log(await pg.evaluate(() => JSON.stringify(window.__GC.feedbacks.map(f => f.text)))); await b.close(); await srv.close();
