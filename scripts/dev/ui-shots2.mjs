// 分析用：2D場面（背景別）・分岐図・業務・章末など、画面の幅広い見本を撮影する。出力先は引数（既定 /tmp/ui5）。
import { chromium } from 'playwright-core'; import { createServer } from 'vite'; import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/ui5'; mkdirSync(out, { recursive: true });
const srv = await createServer({ server: { port: 5188 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: 390, height: 780 }, hasTouch: true });
await pg.goto('http://localhost:5188/?audit'); await pg.click('.card.playable >> nth=0'); await pg.click('.start-box button:has-text("はじめる")'); await pg.waitForSelector('.dlg-box'); await pg.evaluate(() => window.__GC.setSettings({ textSpeed: 'fast', clockRunning: false }));
const go = async (id, name, wait = 900, pre) => { await pg.evaluate(([id]) => { const c = window.__GC; c.panel = null; c.view = c.runner.enter(id); c.lineIndex = 0; c.notify(); }, [id]); await pg.waitForTimeout(wait); if (pre) await pg.evaluate(pre); await pg.waitForTimeout(300); await pg.screenshot({ path: `${out}/${name}.png` }); };
await go('ch2.lunch_s', '10_dlg_hr'); await go('ch1.closing', '11_dlg_office'); await go('ch2.depot', '12_dlg_depot'); await go('ch3.open', '13_ch3_open', 1500); await go('ch5.open', '14_ch5_open', 1500); await go('ch10.open', '15_ch10_open', 1500);
await go('ch1.delay_choice', '16_timed_choice', 900); await go('ch1.jam_task', '17_task_timing', 800); await go('ch1.watch1_task', '18_task_watch', 2200); await go('ch1.fare_task', '19_task_sort', 800);
await go('ch1.end', '20_chapter_end', 1200, () => { const c = window.__GC; c.endResult = c.runner.finishChapter(); c.notify(); });
await go('ch1.hub', '21_hub', 2000, () => { const c = window.__GC; c.world.flags['ch1.tenko'] = true; c.notify(); });
await pg.evaluate(() => { const c = window.__GC; c.panel = 'flow'; c.notify(); }); await pg.waitForTimeout(800); await pg.screenshot({ path: `${out}/22_flowmap.png` });
await pg.evaluate(() => { const c = window.__GC; c.panel = 'relations'; c.notify(); }); await pg.waitForTimeout(600); await pg.screenshot({ path: `${out}/23_relations.png` });
await pg.evaluate(() => { const c = window.__GC; c.panel = 'career'; c.notify(); }); await pg.waitForTimeout(600); await pg.screenshot({ path: `${out}/24_career.png` });
await b.close(); await srv.close(); console.log('ok');
