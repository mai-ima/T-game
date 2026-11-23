// 会話タップの回帰検査：1回目＝全文表示（巻き戻らない）、2回目＝次へ。キー操作（Space）でも同じ。
import { chromium } from 'playwright-core'; import { createServer } from 'vite';
const srv = await createServer({ server: { port: 5195 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: 390, height: 780 } });
await pg.goto('http://localhost:5195/?audit'); await pg.click('.card.playable'); await pg.click('text=最初から（第1章）'); await pg.waitForSelector('.dlg-box'); await pg.evaluate(() => window.__GC.setSettings({ textSpeed: 'slow' }));
const st = () => pg.evaluate(() => { const c = window.__GC; const n = c.view.node; return { idx: c.lineIndex, full: c.textWorld(n.lines[c.lineIndex].text).length, shown: document.querySelector('.dlg-text')?.textContent.length ?? -1, node: n.id }; });
const res = [];
for (const how of ['click', 'key']) {
  const press = async () => (how === 'click' ? pg.dispatchEvent('.dlg-box', 'click') : pg.keyboard.press('Space'));
  await pg.waitForTimeout(300); const a = await st(); await press(); await pg.waitForTimeout(100); const b1 = await st(); await pg.waitForTimeout(700); const b2 = await st(); await press(); await pg.waitForTimeout(100); const c1 = await st();
  const ok = a.shown < a.full && b1.shown === b1.full && b2.shown === b2.full && b2.idx === a.idx && (c1.idx > a.idx || c1.node !== a.node);
  res.push({ how, ok, a: [a.idx, a.shown, a.full], afterTap1: [b1.idx, b1.shown], after700ms: [b2.idx, b2.shown], afterTap2: [c1.idx, c1.shown, c1.node] });
}
console.log(JSON.stringify(res)); await b.close(); await srv.close();
