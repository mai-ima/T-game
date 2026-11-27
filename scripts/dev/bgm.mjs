// BGMの場面別切替と合図音の発火を確認する。
import { chromium } from 'playwright-core'; import { createServer } from 'vite';
const srv = await createServer({ server: { port: 5191 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--autoplay-policy=no-user-gesture-required'] }); const pg = await b.newPage({ viewport: { width: 390, height: 780 } });
await pg.goto('http://localhost:5191/?audit'); await pg.click('.card.playable >> nth=0'); await pg.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await pg.waitForSelector('.dlg-box');
const r = await pg.evaluate(async () => { const c = window.__GC; await c.audio.start(); const out = {};
  for (const id of ['ch1.delay_gate', 'ch1.kaji_1', 'ch1.hub', 'ch3.open', 'ch4.open']) { c.view = c.runner.enter(id); c.updateMusic(); out[id] = c.musicFor(); }
  c.view = c.runner.enter('ch1.p_wish'); c.updateMusic(); return { out, log: c.audio.musicLog.join('>'), jingle: c.audio.eventLog.filter(e => String(e.kind).startsWith('jingle')).length, state: c.audio.ctx?.state }; });
console.log(JSON.stringify(r)); await b.close(); await srv.close();
