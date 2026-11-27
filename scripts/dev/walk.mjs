// 物語を画面操作なしで最後まで進め、止まる場所を調べる（高速な到達性診断）。使い方: node scripts/dev/walk.mjs [good|risky]
import { chromium } from 'playwright-core'; import { createServer } from 'vite';
const mode = process.argv[2] ?? 'good'; const srv = await createServer({ server: { port: 5196 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: 800, height: 500 } });
await pg.goto('http://localhost:5196/?audit'); await pg.click('.card.playable'); await pg.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await pg.waitForTimeout(2500);
const r = await pg.evaluate(async mode => {
  const c = window.__GC; c.setSettings({ clockRunning: false }); const trace = []; let guard = 0; let last = ''; const dates = [];
  while (guard++ < 6000) {
    const v = c.view; const n = c.world.story.node; if (n !== last) { trace.push(n); last = n; }
    if (v.kind === 'line') c.advanceLine(); else if (v.kind === 'choice') { const o = v.options; c.choose(o[mode === 'good' ? 0 : o.length - 1].id); }
    else if (v.kind === 'task') c.resolveTask(mode === 'good' ? 100 : 20);
    else if (v.kind === 'hub') { const it = v.interactions[0]; if (v.canExit) { c.exitHub(); } else if (it) c.interact(it.id); else c.waitMinutes(30); }
    else if (v.kind === 'end') { if (v.node.nextChapter) { c.startNextChapter(); dates.push(c.world.story.chapter + ' ' + c.dateLabel); } else return { ok: true, dates, lastChapter: c.world.story.chapter, completed: c.world.story.completedChapters, guard, flags: Object.keys(c.world.flags).length }; }
    else return { stuck: v.kind, n };
  }
  return { stuck: 'guard', n: c.world.story.node, tail: trace.slice(-12), view: c.view.kind, clock: c.world.clock.minute };
}, mode);
console.log(mode, JSON.stringify(r)); await b.close(); await srv.close();
