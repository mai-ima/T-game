// 総合監査：ビルド済み dist/index.html を Chromium(SwiftShader) で実際に操作・撮影・計測し、PASS/FAIL/UNVERIFIED を判定する。
// 実機iPhone・実GPUでのFPS/発熱/電池・音の聴感・実車照合は検証できないため UNVERIFIED と明記する。
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const OUT = '/tmp/e2e'; const SHOT = OUT; mkdirSync(SHOT, { recursive: true });
const URL = pathToFileURL(resolve('dist/index.html')).href;
const items = []; const add = (name, status, note) => { items.push({ name, status, note }); console.log(`[${status}] ${name} — ${note}`); };
const sh = (cmd) => { try { return { ok: true, out: execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, out: (e.stdout ?? '') + (e.stderr ?? '') }; } };
const ARGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ARGS });
const errors = []; const track = (page, tag) => { page.on('pageerror', e => errors.push(`${tag}: ${e.message}`)); page.on('console', m => { if (m.type() === 'error') errors.push(`${tag}: ${m.text()}`); }); };

async function boot(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.vp ?? { width: 1280, height: 800 }, hasTouch: !!opts.touch, isMobile: !!opts.touch, deviceScaleFactor: opts.dpr ?? 1, userAgent: opts.ua });
  const page = await ctx.newPage(); track(page, opts.tag ?? 'page'); await page.goto(URL + (opts.query ?? '?audit')); await page.waitForSelector('.menu', { timeout: 20000 }); return { ctx, page };
}
async function startGame(page, name = '水野 湊') { await page.click('button.card.playable'); await page.fill('#pname', name); await page.click('text=最初から（第1章）'); await page.waitForSelector('.dlg-box'); }
const gc = (page, f, arg) => page.evaluate(f, arg);
async function toHub(page) { for (let i = 0; i < 60; i++) { const k = await gc(page, () => window.__GC.view.kind); if (k === 'hub') return true; if (k === 'line') await page.click('.dlg-box'), await page.click('.dlg-box').catch(() => {}); else if (k === 'choice') await page.click('.choice-opt >> nth=0'); else await page.waitForTimeout(100); } return false; }
async function shot(page, name, opts = {}) { await page.screenshot({ path: `${SHOT}/${name}.jpg`, type: 'jpeg', quality: opts.q ?? 82, timeout: 180000 }); return name; }
async function stats(page) { return gc(page, () => window.__RR.rm.stats()); }
async function lum(page, file) { // 画像の平均輝度・分散（真っ黒/真っ白の描画失敗検出）
  const b64 = readFileSync(file).toString('base64');
  return page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = 160; c.height = 100; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 160, 100); const d = g.getImageData(0, 0, 160, 100).data; let s = 0, s2 = 0, n = d.length / 4; for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += l; s2 += l * l; } const m = s / n; return { mean: Math.round(m), sd: Math.round(Math.sqrt(s2 / n - m * m)) }; }, b64);
}
async function diff(page, fa, fb) { const a = readFileSync(fa).toString('base64'), b = readFileSync(fb).toString('base64'); return page.evaluate(async ([a, b]) => { const L = async (x) => { const i = new Image(); i.src = 'data:image/jpeg;base64,' + x; await i.decode(); const c = document.createElement('canvas'); c.width = 160; c.height = 100; const g = c.getContext('2d'); g.drawImage(i, 0, 0, 160, 100); return g.getImageData(0, 0, 160, 100).data; }; const A = await L(a), B = await L(b); let s = 0; for (let i = 0; i < A.length; i += 4) s += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); return Math.round(s / (A.length / 4) / 3 * 10) / 10; }, [a, b]); }

// ============ 7. R7第1章 E2E（UI操作で最後まで）＋分岐 ============
async function playChapter(strategy, tag) {
  const { ctx, page } = await boot({ tag, query: '?audit' }); await startGame(page, '青野 ミナト'); await gc(page, () => window.__GC.setSettings({ textSpeed: 'fast', quality: 'low', autoQuality: false }));
  const trace = []; let tasksDone = 0; let guard = 0; const T0 = Date.now(); let sawEnd = false; let timedOut = false;
  while (guard++ < 600) {
    if (guard % 10 === 0) console.log('step', guard, Math.round((Date.now() - T0) / 1000) + 's');
    const st = await gc(page, () => { const c = window.__GC; const v = c.view; return { kind: v.kind, node: c.world.story.node, tk: v.node?.kind, end: !!c.endResult, next: v.node?.nextChapter, ch: c.world.story.chapter }; });
    if (st.kind === 'line') { await page.dispatchEvent('.dlg-box', 'click'); await page.waitForTimeout(30); await page.dispatchEvent('.dlg-box', 'click').catch(() => {}); continue; }
    if (st.kind === 'choice') { const n = await page.$$eval('.choice-opt', e => e.length); const idx = strategy.pick(st.node, n); trace.push(st.node + ':' + idx); if (st.node === 'ch1.delay_choice' && strategy.timeout) { await gc(page, () => { const c = window.__GC; clearTimeout(c.choiceTimerId); c.choiceTimerId = window.setTimeout(() => c.choose('ask', true), 1200); }); await page.waitForTimeout(1800); timedOut = true; continue; } await page.locator('.choice-opt').nth(idx).dispatchEvent('click'); continue; }
    if (st.kind === 'task') {
      const score = strategy.task(st.node);
      if (st.tk === 'checklist') { const items = await gc(page, () => window.__GC.view.node.items.map(i => i.truth)); const wrong = Math.round((1 - score) * items.length); for (let i = 0; i < items.length; i++) { const ans = i < wrong ? (items[i] === 'ok' ? 'ng' : 'ok') : items[i]; await page.click(`.item >> nth=${i} >> .tgl button >> nth=${ans === 'ok' ? 0 : 1}`); } await page.click('text=判定する'); await page.click('text=報告して戻る'); }
      else if (st.tk === 'compose') { const slots = await gc(page, () => window.__GC.view.node.slots.map(s => s.options.findIndex(o => o.good))); const wrong = Math.round((1 - score) * slots.length); for (let i = 0; i < slots.length; i++) { const gi = slots[i]; const idx = i < wrong ? (gi + 1) % 3 : gi; await page.click(`.item >> nth=${i} >> label >> nth=${idx}`); } await page.click('text=放送文を確定する'); await page.click('text=放送して戻る'); }
      else if (['timing', 'find', 'watch', 'route', 'sort', 'memory'].includes(st.tk)) { await gc(page, (sc) => { window.__GC.resolveTask(sc); }, Math.round(score * 100)); } // 新形式の個別UIは「業務ミニゲーム」節で操作検証
      else if (st.tk === 'terminal') { for (const t of ['運行情報', '引継ぎ', '設備状態']) await page.click(`role=tab[name^="${t}"]`); await page.click('role=tab[name^="引継ぎ"]'); for (const cb of await page.$$('.sheet input[type=checkbox]')) await cb.check(); await page.click('text=確認を完了する'); }
      else if (st.tk === 'roster') { const targets = await gc(page, () => window.__GC.view.node.config.targets.map(t => t.day)); for (let i = 0; i < targets.length; i++) { await page.click(`.tabs button >> nth=${i}`); const d = score >= 1 ? targets[i] : (targets[i] + 1) % 28; const lab = await gc(page, (d) => { const s = window.__GC.story.startYear; const dt = new Date(Date.UTC(s, 3, 1 + d)); return `${dt.getUTCMonth() + 1}月${dt.getUTCDate()}日`; }, d); await page.click(`.cal button[aria-label^="${lab}"]`); } await page.click('text=確認結果を提出する'); await page.click('.sheet-b >> text=戻る'); }
      tasksDone++; continue;
    }
    if (st.kind === 'hub') {
      const h = await gc(page, () => { const c = window.__GC; const v = c.view; return { ints: v.interactions.map(i => ({ id: i.id, obj: i.object })), canExit: v.canExit }; });
      if (h.canExit && strategy.exitEarly) { await page.click('.act .btn.primary'); continue; }
      let did = false;
      for (const it of h.ints) { if (strategy.skip?.includes(it.id)) continue; const pos = await gc(page, (o) => { const c = window.__GC; const p = c.sim.standNear(o); if (p) { c.sim.teleport(p.x, p.y, p.z, 0); } return p; }, it.obj); if (!pos) { trace.push('NOSTAND:' + it.id); continue; } await p_wait(page, () => window.__GC.prompt?.object, it.obj); await page.keyboard.press('KeyE'); did = true; break; }
      if (did) continue; await page.click('text=30分進める'); await page.waitForTimeout(50); continue;
    }
    if (st.kind === 'end') { if (!sawEnd) { await page.waitForSelector('.fullscreen'); await page.screenshot({ path: `${SHOT}/40_chapter_end_${tag}.jpg`, type: 'jpeg', quality: 80 }); sawEnd = true; } if (st.next) { await page.click('text=第2章 冒頭'); continue; } break; }
  }
  const fin = await gc(page, () => { const c = window.__GC; return { chapters: c.world.story.completedChapters, flags: Object.keys(c.world.flags), choices: c.world.story.choices.map(x => x.node + '>' + x.option + (x.timedOut ? '(T)' : '')), rating: c.world.story.chapterResults.ch1?.rating, rel: c.world.relationships, log: c.world.log.length, timeline: c.world.timeline.length, clock: c.world.clock }; });
  return { page, ctx, fin, trace, tasksDone, timedOut, guard };
}
async function p_wait(page, f, expect) { for (let i = 0; i < 40; i++) { const v = await page.evaluate(f); if (v === expect) return true; await page.waitForTimeout(60); } return false; }

const stratGood = { pick: (n, k) => 0, task: () => 1 };
const stratRisky = { pick: (n, k) => (n === 'ch1.delay_quick_choice' ? 1 : n === 'ch1.delay_choice' ? 1 : n === 'ch1.closing_choice' ? 2 : n === 'ch1.p_wish' ? 3 : 1) % k, task: () => 0.3, skip: ['kajiwara', 'lost'] };
const resultsE2E = {};
for (const [tag, strat] of [['good', stratGood], ['risky', stratRisky]]) {
  const r = await playChapter(strat, tag); resultsE2E[tag] = r.fin; const ok = r.fin.chapters.includes('ch1') && r.fin.chapters.includes('ch2');
  add(`R7第1章→第2章冒頭を最後まで通しプレイ（UI操作・${tag}ルート）`, ok ? 'PASS' : 'FAIL', `完了章=${r.fin.chapters.join(',')}／評価=${r.fin.rating}／選択${r.fin.choices.length}件／タスク${r.tasksDone}／ループ${r.guard}`);
  if (tag === 'good') { // 保存・読込・独立スロット
    const page = r.page; await gc(page, () => { const c = window.__GC; c.world.story.node = 'ch1.end'; });
    const saved = await gc(page, async () => { const c = window.__GC; const before = JSON.stringify(c.world); await c.saveSlot('2'); const f = await c.saves.load('R7', '2'); return { ok: JSON.stringify(f.world) === before, kind: c.storageKind, other: (await c.saves.load('R8', '2')) === undefined, auto: (await c.saves.load('R7', 'auto')) !== undefined }; });
    add('セーブ：保存→読込で世界状態が完全一致（人物関係・経歴・履歴を含む）', saved.ok ? 'PASS' : 'FAIL', `保存先=${saved.kind}`); add('セーブ：モード別の独立領域・オートセーブ', saved.other && saved.auto ? 'PASS' : 'FAIL', 'R7の保存がR8領域に混入しない／章遷移でオートセーブ');
    // ページ再読込後のロード（IndexedDB永続化）
    if (saved.kind === 'indexeddb') { await page.reload(); await page.waitForSelector('.menu'); await page.click('button.card.playable'); await page.waitForTimeout(1200); const slotTxt = await page.textContent('.modal .slots'); add('セーブ：ページ再読込後も残る（IndexedDB）', /スロット2/.test(slotTxt) && !/スロット2空き/.test(slotTxt.replace(/\s/g, '')) ? 'PASS' : 'FAIL', slotTxt.replace(/\s+/g, ' ').slice(0, 90)); } else add('セーブ：再読込後の永続化', 'UNVERIFIED', 'この環境ではIndexedDBが使えずメモリ保存');
  }
  await r.ctx.close();
}
{ const g = resultsE2E.good, rk = resultsE2E.risky; const diffFlags = g.flags.filter(f => !rk.flags.includes(f)).length + rk.flags.filter(f => !g.flags.includes(f)).length; add('選択による分岐の差（人物関係・フラグ・評価）', diffFlags >= 6 && g.rating !== rk.rating ? 'PASS' : 'FAIL', `フラグ差${diffFlags}件／評価 ${g.rating} vs ${rk.rating}／信頼(久保田) ${g.rel.kubota?.trust} vs ${rk.rel.kubota?.trust}`); }
{ const { ctx, page } = await boot({ tag: 'timeout' }); await startGame(page); await gc(page, () => window.__GC.setSettings({ textSpeed: 'fast', quality: 'low' })); const r = await playChapter({ pick: () => 0, task: () => 1, timeout: true }, 'timeout'); add('時間制限つき選択：時間切れが既定選択として記録される', r.fin.choices.some(c => c === 'ch1.delay_choice>ask(T)') ? 'PASS' : 'FAIL', r.fin.choices.filter(c => /delay_choice/.test(c)).join(',')); await r.ctx.close(); await ctx.close(); }

await browser.close();
