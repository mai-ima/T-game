// R8 第1章を、実際の画面操作（メニュー→名前→最初から→会話→選択→業務）で最後まで進め、スクリーンショットを保存する。
// 使い方: node scripts/dev/walk-r8.mjs [outDir] [site|drawing|memory|assert] [width] [height]
import { chromium } from 'playwright-core'; import { createServer } from 'vite'; import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? '/tmp/r8shots'; const plan = process.argv[3] ?? 'site'; const W = +(process.argv[4] ?? 1000), H = +(process.argv[5] ?? 640); mkdirSync(out, { recursive: true });
const srv = await createServer({ server: { port: 5197 }, logLevel: 'error' }); await srv.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] }); const pg = await b.newPage({ viewport: { width: W, height: H }, hasTouch: W < 600, isMobile: W < 600 });
const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
await pg.goto('http://localhost:5197/?audit'); await pg.waitForSelector('.menu');
await pg.screenshot({ path: `${out}/00_menu.png` });
await pg.click('button.card[aria-label^="R8"]'); await pg.waitForSelector('.modal'); await pg.screenshot({ path: `${out}/01_modal.png` });
await pg.fill('#pname', '水野 湊'); await pg.click('text=最初から（第1章）'); await pg.waitForSelector('.dlg-box'); await pg.waitForTimeout(1500);
await pg.evaluate(() => { const r = window.__RR; if (r) r.rm.paused = true; }); // 2D会話場面では3D描画を止めて高速化
const shots = new Set(); const snap = async (name) => { if (shots.has(name)) return; shots.add(name); await pg.waitForTimeout(450); await pg.screenshot({ path: `${out}/${name}.png` }); };
const want = { 'ch1.o1': '10_o1', 'ch1.o3': '11_o3_discovery', 'ch1.ic1': '12_choice1', 'ch1.rules_task': '13_rules_task', 'ch1.docs_task': '14_docs_task', 'ch1.int_menu': '15_int_menu', 'ch1.tg_src': '16_tg_src', 'ch1.ot_why': '17_ot_why', 'ch1.mt_minutes': '18_mt', 'ch1.plan': '19_plan', 'ch1.grade_task': '20_grade_task', 'ch1.policy': '21_policy', 'ch1.report_task': '22_report_task' };
const pickPlan = { site: ['site', 'graded'], drawing: ['drawing', 'graded'], memory: ['memory', 'graded'], assert: ['memory', 'assert'] }[plan];
let guard = 0, last = '', stuck = 0; const trace = [];
while (guard++ < 1500) {
  const st = await pg.evaluate(() => { const c = window.__GC; const v = c.view; return { kind: v.kind, node: c.world.story.node, panel: c.panel, endResult: !!c.endResult }; });
  if (st.node !== last) { trace.push(st.node); console.log('node', st.node); last = st.node; stuck = 0; } else if (++stuck > 40) { console.log('STUCK', JSON.stringify(st)); break; }
  if (want[st.node]) await snap(want[st.node]);
  if (st.kind === 'line') { await pg.evaluate(() => window.__GC.advanceLine()); }
  else if (st.kind === 'choice') {
    const pickId = await pg.evaluate(([node, p]) => { const c = window.__GC; const o = c.view.options; const want = { 'ch1.ic1': 'verify', 'ch1.note_how': 'separate', 'ch1.plan': p[0], 'ch1.policy': p[1] }[node]; const order = { 'ch1.int_menu': ['tg', 'ot', 'mt', 'enough'], 'ch1.tg_menu': ['src', 'done', 'shared', 'end'], 'ch1.ot_menu': ['why', 'origin', 'end'], 'ch1.mt_menu': ['minutes', 'reg', 'end'] }[node]; if (want) return o.findIndex(x => x.id === want); if (order) { for (const id of order) { const i = o.findIndex(x => x.id === id); if (i >= 0) return i; } } return 0; }, [st.node, pickPlan]);
    try { await pg.click(`.choice-opt >> nth=${pickId}`, { timeout: 5000 }); } catch (e) { console.log("choice click fail", pickId, e.message.slice(0, 300)); break; }
  }
  else if (st.kind === 'task') {
    if (st.node === 'ch1.docs_task') { await pg.click('text=【但し書き】PL-3はB棟'); await pg.click('text=（この位置に、但し書きの記載はありません）'); await pg.click('text=【工期】切替工事 2028年5月'); await snap('14b_docs_marked'); await pg.click('text=【工期】切替工事 2028年5月'); await pg.click('text=照合結果を確定する'); await snap('14c_docs_result'); await pg.click('text=メモに記録して戻る'); }
    else if (st.node === 'ch1.grade_task') {
      const truths = await pg.evaluate(() => { const c = window.__GC; const f = c.world.flags; return c.view.node.config.claims.filter(x => (!x.when || f[x.when]) && (!x.unless || !f[x.unless])).map(x => x.truth); });
      const lab = { confirmed: '確認済み', inferred: '推定', unconfirmed: '未確認' };
      for (let i = 0; i < truths.length; i++) await pg.locator('.sheet .item').nth(i).locator('.tgl button', { hasText: new RegExp('^' + lab[truths[i]] + '$') }).click();
      await snap('20b_grade_filled'); await pg.click('text=確度を確定する'); await snap('20c_grade_result'); await pg.click('text=整理表を保存して戻る');
    }
    else if (st.node === 'ch1.report_task') { const n = await pg.locator('.sheet .item').count(); for (let i = 0; i < n; i++) await pg.locator('.sheet .item').nth(i).locator('label').first().click(); await snap('22b_report_filled'); await pg.click('text=報告文を確定する'); await pg.click('text=室長へ報告する'); }
    else if (st.node === 'ch1.rules_task') { const items = await pg.evaluate(() => window.__GC.view.node.items.map(x => x.truth)); for (let i = 0; i < items.length; i++) await pg.locator('.sheet .item').nth(i).locator('.tgl button').nth(items[i] === 'ok' ? 0 : 1).click(); await pg.click('text=判定する'); await pg.click('text=報告して戻る'); }
    else { console.log('未対応の業務', st.node); break; }
  }
  else if (st.kind === 'end') { await pg.waitForSelector('.fullscreen'); await snap('30_end_' + st.node.replace('ch1.', '')); break; }
  }
const fin = await pg.evaluate(() => { const c = window.__GC; return { node: c.world.story.node, endings: c.world.story.endings, trust: c.world.relationships.kawai?.trust, visited: c.world.story.visited.length, flags: Object.keys(c.world.flags).length, kind: c.view.kind }; });
console.log(JSON.stringify({ viewport: [W, H], plan, steps: guard, trace: trace.length, fin, errs: errs.slice(0, 8) }));
// セーブ→メニュー→R7との独立確認
await pg.evaluate(async () => { const c = window.__GC; await c.saveSlot('1', true); });
await pg.screenshot({ path: `${out}/31_after_end.png` });
await b.close(); await srv.close();
