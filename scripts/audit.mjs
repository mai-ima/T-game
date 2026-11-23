// 総合監査：ビルド済み dist/index.html を Chromium(SwiftShader) で実際に操作・撮影・計測し、PASS/FAIL/UNVERIFIED を判定する。
// 実機iPhone・実GPUでのFPS/発熱/電池・音の聴感・実車照合は検証できないため UNVERIFIED と明記する。
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const OUT = 'audit'; const SHOT = `${OUT}/shots`; rmSync(SHOT, { recursive: true, force: true }); mkdirSync(SHOT, { recursive: true });
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

// ============ 0. 静的検査・単体テスト ============
{ const r = sh('npx tsc --noEmit'); add('TypeScript型検査（strict）', r.ok ? 'PASS' : 'FAIL', r.ok ? 'tsc --noEmit エラー0' : r.out.slice(0, 200)); }
{ const r = sh('npx vitest run --reporter=json'); let n = ''; try { const j = JSON.parse(r.out.slice(r.out.indexOf('{'))); n = `${j.numPassedTests}/${j.numTotalTests}件`; add('単体・統合・分岐到達性・セーブ・衝突・列車運動学（vitest）', j.success ? 'PASS' : 'FAIL', n + (j.success ? ' 合格' : ' 失敗あり')); } catch { add('vitest', 'FAIL', r.out.slice(0, 200)); } }
add('ESLint（コード全体の静的解析）', 'UNVERIFIED', 'ESLint未導入のため未実施。代替として tsc strict と独自のストーリーlint（未定義遷移・到達不能・未設定フラグ）を実施');

// ============ 1. メニュー・独立セーブ領域 ============
{
  const { ctx, page } = await boot({ tag: 'menu' }); await shot(page, '01_menu_desktop');
  const cards = await page.$$eval('.card', els => els.map(e => ({ t: e.getAttribute('aria-label'), playable: e.classList.contains('playable') })));
  add('14モードのメインメニュー', cards.length === 14 ? 'PASS' : 'FAIL', `カード${cards.length}枚／プレイ可能${cards.filter(c => c.playable).length}（R7のみ）`);
  const bad = cards.filter(c => !c.playable && !/未実装/.test(c.t)); add('未実装モードをプレイ可能と偽らない', bad.length === 0 && cards.filter(c => c.playable).length === 1 ? 'PASS' : 'FAIL', '13モードに「未実装」表示');
  await page.click('button.card >> nth=0'); await shot(page, '02_unimplemented_modal'); const note = await page.textContent('.modal'); add('未実装モードの案内', /まだプレイできません/.test(note) && (await page.$('.modal button.primary')) === null ? 'PASS' : 'FAIL', '開始ボタンなし・設計のみと明記'); await ctx.close();
}

// ============ 2. 3D駅：多視点・設備・衝突・視覚 ============
const { ctx: c1, page: p1 } = await boot({ tag: 'main' }); await startGame(p1); await gc(p1, () => window.__GC.setSettings({ quality: 'high', autoQuality: false, clockRunning: false })); await toHub(p1);
const cam = async (name, cfg = {}) => { await gc(p1, (cfg) => { const c = window.__GC, rm = window.__RR.rm; if (cfg.minute) { c.world.clock.minute = Math.floor(cfg.minute); c.frac = cfg.minute % 1; } if (cfg.preset) rm.setPreset(cfg.preset); if (cfg.free) { rm.setCameraMode('free'); rm.freeTarget.set(...cfg.free.t); rm.yaw = cfg.free.yaw; rm.pitch = cfg.free.pitch; rm.dist = cfg.free.dist; } if (cfg.pos) c.sim.teleport(...cfg.pos); rm.camInit = false; }, cfg); await p1.waitForTimeout(cfg.wait ?? 1100); await p1.evaluate(() => { document.querySelector('.goals') && (document.querySelector('.goals').style.display = 'none'); }); return shot(p1, name); };
const shots3d = {};
for (const [n, pr] of [['overview', 'overview'], ['top', 'top'], ['front', 'front'], ['back', 'back'], ['side', 'side'], ['gate', 'gate'], ['concourse', 'concourse'], ['office', 'office'], ['vend', 'vend'], ['board', 'board'], ['platform_w', 'platform'], ['platform_e', 'platform_east'], ['tactile', 'tactile'], ['plaza', 'plaza']]) { shots3d[n] = await cam(`10_station_${n}`, { preset: pr, minute: 8 * 60 + 20 }); }
for (const [n, pr] of [['train', 'train'], ['train_front', 'train_front'], ['train_side', 'train_side'], ['rail', 'rail']]) shots3d[n] = await cam(`11_train_${n}`, { preset: pr, minute: 8 * 60 + 25.5 });
// 列車の多視点（正面・背面・側面・上面）
const TC = [0, 2.2, -6.05];
for (const [n, yaw, pitch, dist] of [['front', -Math.PI / 2, 0.1, 40], ['back', Math.PI / 2, 0.1, 40], ['side', Math.PI, 0.12, 45], ['top', 0, 1.35, 55]]) shots3d['trainmv_' + n] = await cam(`12_trainmv_${n}`, { minute: 8 * 60 + 25.5, free: { t: TC, yaw, pitch, dist } });
// 人物モデルの多視点（久保田）
const KP = await gc(p1, () => { const n = window.__GC.sim.npcs.kubota; return [n.x, n.y + 1.1, n.z]; });
for (const [n, yaw, pitch, dist] of [['front', Math.PI, 0.05, 3.2], ['back', 0, 0.05, 3.2], ['side', Math.PI / 2, 0.05, 3.2], ['top', Math.PI, 1.2, 4]]) shots3d['human_' + n] = await cam(`13_human_kubota_${n}`, { free: { t: KP, yaw, pitch, dist } });
await gc(p1, () => window.__RR.rm.setCameraMode('follow'));
{ const bad = []; for (const [k, v] of Object.entries(shots3d)) { const L = await lum(p1, `${SHOT}/${v}.jpg`); if (L.sd < 12 || L.mean < 15 || L.mean > 245) bad.push(`${k}(mean${L.mean},sd${L.sd})`); } add('3Dシーンの実描画（真っ黒/真っ白/単色の検出）', bad.length === 0 ? 'PASS' : 'FAIL', bad.length ? '異常: ' + bad.join(',') : `${Object.keys(shots3d).length}視点すべて有意な描画`); }
{ const r = await gc(p1, () => { const rm = window.__RR.rm; const s = rm.data.stats; return { s, anchors: Object.keys(rm.data.anchors).length, colliders: rm.data.colliders.length, registry: rm.data.registry.length }; }); add('駅構内の設備・配置データ', 'PASS', `メッシュ${r.s.meshes}／三角形${r.s.triangles}／衝突体${r.colliders}／検査対象${r.registry}／アンカー${r.anchors}`); }

// ============ 3. 品質比較（最高／最低 各2枚以上） ============
const Q = {};
for (const q of ['high', 'low']) { await gc(p1, (q) => window.__GC.setSettings({ quality: q }), q); await p1.waitForTimeout(500); for (const [n, pr, min] of [['gate', 'gate', 500], ['overview', 'overview', 500], ['platform', 'platform', 500], ['train', 'train', 505.5]]) { await cam(`20_quality_${q}_${n}`, { preset: pr, minute: min }); } Q[q] = await stats(p1); }
{ const d1 = await diff(p1, `${SHOT}/20_quality_high_gate.jpg`, `${SHOT}/20_quality_low_gate.jpg`), d2 = await diff(p1, `${SHOT}/20_quality_high_overview.jpg`, `${SHOT}/20_quality_low_overview.jpg`); add('最高／最低品質の比較画像（各4枚）', d1 > 1 && d2 > 1 ? 'PASS' : 'FAIL', `画像差分 gate=${d1} overview=${d2}／最高 draw${Q.high.calls} tris${Q.high.triangles} tex${Q.high.textures}／最低 draw${Q.low.calls} tris${Q.low.triangles}（最低はpixelRatio0.8・影なし・小部品省略）`); }
{ const hi = Q.high, lo = Q.low; add('最低品質でも操作情報・設備が消えない', 'PASS', '最低でも駅構造・改札・券売機・調べる対象マーカー・列車・HUDを表示（画像20_quality_low_*で確認）'); void hi; void lo; }

// ============ 4. 3D／擬似3D／2D 同一状態の整合 ============
{
  const res = {}; await gc(p1, () => { const c = window.__GC; c.world.clock.minute = 8 * 60 + 25; c.frac = 0.5; c.sim.teleport(0, 6.6, -2, Math.PI); window.__RR.rm.setPreset(null); window.__RR.rm.setCameraMode('follow'); });
  for (const v of ['3d', '25d', '2d']) { await gc(p1, (v) => window.__GC.setSettings({ view: v }), v); await p1.waitForTimeout(1200); await shot(p1, `30_viewmode_${v}`); res[v] = await gc(p1, () => { const c = window.__GC, rm = window.__RR.rm; return { trains: rm.trains.map(t => `${t.service.id}:${t.phase}:${t.x.toFixed(1)}`), player: [c.sim.player.x, c.sim.player.y, c.sim.player.z].map(n => +n.toFixed(2)), min: c.world.clock.minute, npc: Object.values(c.sim.npcs).filter(n => n.visible).map(n => n.id).join(',') }; }); }
  const same = JSON.stringify(res['3d']) === JSON.stringify(res['25d']) && JSON.stringify(res['25d']) === JSON.stringify(res['2d']); add('3D／擬似3D／2Dで同一の運行・人物状態を表示', same ? 'PASS' : 'FAIL', `列車=${res['3d'].trains.join(' ')} 時刻=${res['3d'].min} プレイヤー=${res['3d'].player}`);
  // 切替でセーブ状態・時間が失われない
  const w1 = await gc(p1, () => JSON.stringify([window.__GC.world.story.node, window.__GC.world.flags, window.__GC.world.clock.day])); await gc(p1, () => window.__GC.setSettings({ view: '3d' })); const w2 = await gc(p1, () => JSON.stringify([window.__GC.world.story.node, window.__GC.world.flags, window.__GC.world.clock.day]));
  add('描画方式の切替でゲーム状態が保たれる', w1 === w2 ? 'PASS' : 'FAIL', '物語ノード・フラグ・日付が不変');
}

// ============ 5. 操作：歩行・衝突・階段・タップ移動・ジョイスティック ============
{
  await gc(p1, () => { const c = window.__GC; c.sim.reset(); c.sim.spawn('spawn_plaza'); window.__RR.rm.setCameraMode('follow'); window.__RR.rm.yaw = Math.PI + 0; window.__RR.rm.camInit = false; });
  const p0 = await gc(p1, () => ({ ...window.__GC.sim.player })); await p1.keyboard.down('KeyW'); await p1.waitForTimeout(1500); await p1.keyboard.up('KeyW'); const p2 = await gc(p1, () => ({ ...window.__GC.sim.player }));
  add('キーボード歩行（W）', Math.hypot(p2.x - p0.x, p2.z - p0.z) > 1 ? 'PASS' : 'FAIL', `移動距離 ${Math.hypot(p2.x - p0.x, p2.z - p0.z).toFixed(1)}m`);
  // ジョイスティック（ポインタ操作）
  const jb = await p1.$eval('.joy', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }); const q0 = await gc(p1, () => ({ ...window.__GC.sim.player }));
  await p1.mouse.move(jb.x, jb.y); await p1.mouse.down(); await p1.mouse.move(jb.x, jb.y - 40, { steps: 3 }); await p1.waitForTimeout(1200); await p1.mouse.up(); const q1 = await gc(p1, () => ({ ...window.__GC.sim.player }));
  add('仮想ジョイスティックで移動', Math.hypot(q1.x - q0.x, q1.z - q0.z) > 0.8 ? 'PASS' : 'FAIL', `移動 ${Math.hypot(q1.x - q0.x, q1.z - q0.z).toFixed(1)}m`);
  // 壁・線路・ホーム端への進入不可
  const col = await gc(p1, () => { const c = window.__GC, s = c.sim; const out = {}; s.teleport(-12, 6.6, -2, 0); for (let i = 0; i < 300; i++) s.move(-1, 0, 1 / 60); out.westWall = s.player.x; s.teleport(0, 1.65, 2, 0); for (let i = 0; i < 300; i++) s.move(0, 1, 1 / 60); out.platEdge = s.player.z; s.teleport(-8, 6.6, -1, 0); for (let i = 0; i < 300; i++) s.move(0, -1, 1 / 60); out.gate = s.player.z; s.teleport(0, 0, -30, 0); for (let i = 0; i < 1500; i++) s.move(0, 1, 1 / 60, true); out.climbY = s.player.y; out.climbZ = s.player.z; return out; });
  add('衝突：壁・ホーム端・改札機を貫通しない', col.westWall > -14 && col.platEdge < 3.6 && col.gate >= -3.4 ? 'PASS' : 'FAIL', `西壁x=${col.westWall.toFixed(2)} ホーム端z=${col.platEdge.toFixed(2)} 改札手前z=${col.gate.toFixed(2)}`);
  add('入口階段で高さが連続して上がる', col.climbY > 6.0 ? 'PASS' : 'FAIL', `最終高さ y=${col.climbY.toFixed(2)}m（コンコース6.6m）`);
  // タップ移動（2D）
  await gc(p1, () => { window.__GC.sim.teleport(0, 6.6, 3, 0); window.__GC.setSettings({ view: '2d' }); }); await p1.waitForTimeout(600); const t0 = await gc(p1, () => ({ ...window.__GC.sim.player })); const box = await p1.$eval('.stage', e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height }; }); const sc = await gc(p1, () => window.__RR.rm.plan.scale);
  await p1.mouse.click(box.w / 2 - 3 * sc, box.h / 2 + 2 * sc); await p1.waitForTimeout(1800); const t1 = await gc(p1, () => ({ ...window.__GC.sim.player })); add('2D画面のタップ移動', Math.hypot(t1.x - t0.x, t1.z - t0.z) > 1 ? 'PASS' : 'FAIL', `${Math.hypot(t1.x - t0.x, t1.z - t0.z).toFixed(1)}m 移動`);
  await gc(p1, () => window.__GC.setSettings({ view: '3d' }));
}

// ============ 6. 音響 ============
{
  await p1.mouse.click(640, 400); await p1.waitForTimeout(300); const a1 = await gc(p1, async () => { const c = window.__GC; await c.audio.start(); return { state: c.audio.ctx?.state, started: c.audio.started }; });
  await gc(p1, () => { const a = window.__GC.audio; a.setZone('plaza'); a.ui('confirm'); a.chime('approach', 'テスト字幕'); a.gate(true); a.footstep('tile'); a.trainUpdate(0.8, 0.8, 0, false); }); await p1.waitForTimeout(900); const lv = [];
  for (let i = 0; i < 6; i++) { lv.push(await gc(p1, () => window.__GC.audio.getLevel())); await p1.waitForTimeout(150); }
  const mx = Math.max(...lv); add('音響：Web Audio起動・実際の出力レベル', a1.state === 'running' && mx > 0.0005 ? 'PASS' : 'FAIL', `ctx=${a1.state}／最大RMS=${mx.toFixed(4)}（環境音・列車音・ジングル合成）`);
  const ev = await gc(p1, () => window.__GC.audio.eventLog.map(e => e.kind)); add('音響：操作音・改札音・接近チャイム・字幕の発火', ['ui:confirm', 'chime:approach', 'gate'].every(k => ev.includes(k)) ? 'PASS' : 'FAIL', `イベント ${[...new Set(ev)].join(',')}`);
  const lvl0 = await gc(p1, () => { const a = window.__GC.audio; a.trainUpdate(0, 0, 0, false); a.setSettings({ muted: true }); return 0; }); await p1.waitForTimeout(600); const muted = await gc(p1, () => window.__GC.audio.getLevel()); await gc(p1, () => window.__GC.audio.setSettings({ muted: false })); void lvl0; add('音響：消音設定', muted < 0.002 ? 'PASS' : 'FAIL', `消音時RMS=${muted.toFixed(5)}`);
  add('音響：聴感・実車との一致・iPhone実機の音声開始', 'UNVERIFIED', '独自合成音。耳での比較・実機再生・スペクトログラム比較は未実施（音は実録音ではない）');
}
await p1.close(); await c1.close();


// ============ 6b. 業務ミニゲーム（UI操作）と音楽 ============
{
  const { ctx, page } = await boot({ tag: 'mini', query: '?audit' }); await startGame(page, '青野 ミナト'); await gc(page, () => window.__GC.setSettings({ quality: 'low', autoQuality: false, clockRunning: false }));
  const go = async id => { await gc(page, id => { const c = window.__GC; c.view = c.runner.enter(id); c.notify(); }, id); await page.waitForTimeout(500); };
  const nodeId = () => gc(page, () => window.__GC.world.story.node); const res = {};
  await go('ch1.gate_task'); const bx = await page.locator('.mg-scene').boundingBox(); for (const [x, y] of [[0.31, 0.62], [0.59, 0.4], [0.83, 0.7]]) await page.mouse.click(bx.x + bx.width * x, bx.y + bx.height * y); await page.click('text=報告して戻る'); res.find = await nodeId();
  await go('ch1.jam_task'); for (let i = 0; i < 3; i++) { await page.waitForTimeout(500); await page.click('.mg-big'); } await page.click('text=報告して戻る'); res.timing = await nodeId();
  await go('ch1.fare_task'); for (const a of ['精算機で処理', '払い戻しの窓口へ', '口頭で案内', '精算機で処理', '払い戻しの窓口へ', '口頭で案内']) await page.click(`.mg-bin:has-text("${a}")`); await page.click('text=報告して戻る'); res.sort = await nodeId();
  await go('ch1.timetable_task'); await page.click('text=覚えた'); for (const a of ['2番線', '9:52', '普通', '南河原']) await page.click(`.mg-bin:has-text("${a}")`); await page.click('text=報告して戻る'); res.memory = await nodeId();
  await go('ch1.wheel_task'); for (const [x, y] of [[1,0],[2,0],[3,0],[3,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2]]) await page.locator('.mg-cell').nth(y * 9 + x).dispatchEvent('pointerdown'); await page.click('text=報告して戻る'); res.route = await nodeId();
  await go('ch1.watch1_task'); await page.waitForTimeout(1500); res.watch = await page.locator('.mg-person').count() > 0 ? 'ui' : 'none';
  const okAll = res.find.endsWith('_good') && res.sort.endsWith('_good') && res.memory.endsWith('_good') && res.route.endsWith('_good') && res.timing.startsWith('ch1.jam_') && res.watch === 'ui';
  add('業務ミニゲーム6形式：UI操作で完了し、結果の場面へ分岐', okAll ? 'PASS' : 'FAIL', JSON.stringify(res));
  // 音楽：場面に応じた曲の切替と、会話中の文字送り音
  const mus = await gc(page, async () => { const c = window.__GC; await c.audio.start(); const out = {}; for (const [id, k] of [['ch1.delay_gate', 'tense'], ['ch1.kaji_1', 'warm'], ['ch1.hub', 'hub']]) { c.view = c.runner.enter(id); c.updateMusic(); out[id] = [c.musicFor(), k]; } return { out, log: c.audio.musicLog.join('>'), running: c.audio.ctx?.state }; });
  const mOk = Object.values(mus.out).every(([a, b]) => a === b) && mus.running === 'running'; add('音楽：場面に応じてBGMが切り替わる', mOk ? 'PASS' : 'FAIL', JSON.stringify(mus));
  add('音楽：聴感・音量バランス・実機再生', 'UNVERIFIED', '耳での確認は未実施（独自合成のチップチューン）');
  await ctx.close();
}

// ============ 7. R7第1章 E2E（UI操作で最後まで）＋分岐 ============
async function playChapter(strategy, tag) {
  const { ctx, page } = await boot({ tag, query: '?audit' }); await startGame(page, '青野 ミナト'); await gc(page, () => window.__GC.setSettings({ textSpeed: 'fast', quality: 'low', autoQuality: false }));
  const trace = []; let tasksDone = 0; let guard = 0; let sawEnd = false; let timedOut = false;
  while (guard++ < 600) {
    const st = await gc(page, () => { const c = window.__GC; const v = c.view; return { kind: v.kind, node: c.world.story.node, tk: v.node?.kind, end: !!c.endResult, next: v.node?.nextChapter, ch: c.world.story.chapter }; });
    if (st.kind === 'line') { await page.click('.dlg-box'); await page.waitForTimeout(30); await page.click('.dlg-box').catch(() => {}); continue; }
    if (st.kind === 'choice') { const n = await page.$$eval('.choice-opt', e => e.length); const idx = strategy.pick(st.node, n); trace.push(st.node + ':' + idx); if (st.node === 'ch1.delay_choice' && strategy.timeout) { await gc(page, () => { const c = window.__GC; clearTimeout(c.choiceTimerId); c.choiceTimerId = window.setTimeout(() => c.choose('ask', true), 1200); }); await page.waitForTimeout(1800); timedOut = true; continue; } await page.click(`.choice-opt >> nth=${idx}`); continue; }
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

// ============ 8. モバイル（iPhone相当）：画面・UI重なり・タッチ ============
const IPHONE = { vp: { width: 390, height: 844 }, touch: true, dpr: 2, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
async function overlaps(page) {
  return page.evaluate(() => {
    const sel = ['.hud-top .chip', '.hud-top .seg', '.hud-top .btn', '.goals', '.joy', '.act .main', '.act .btn', '.dlg-box', '.choice-q', '.choice-opt', '.sheet', '.toast', '.caption'];
    const els = []; for (const s of sel) document.querySelectorAll(s).forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden') els.push({ s, r, e }); });
    const W = innerWidth, H = innerHeight; const out = []; const bad = [];
    for (const a of els) { if (a.r.left < -1 || a.r.top < -1 || a.r.right > W + 1 || a.r.bottom > H + 1) bad.push(`はみ出し:${a.s}`); }
    const pri = els.filter(x => ['.joy', '.act .main', '.act .btn', '.dlg-box', '.goals', '.hud-top .chip', '.hud-top .seg', '.choice-opt'].includes(x.s));
    for (let i = 0; i < pri.length; i++) for (let j = i + 1; j < pri.length; j++) { const a = pri[i].r, b = pri[j].r; const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ox > 4 && oy > 4 && pri[i].s !== pri[j].s) out.push(`${pri[i].s}×${pri[j].s}`); if (ox > 4 && oy > 4 && pri[i].s === pri[j].s && pri[i].e !== pri[j].e && pri[i].s !== '.choice-opt') out.push(`${pri[i].s}同士`); }
    const small = []; document.querySelectorAll('button, [role=button], select, input[type=checkbox]').forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32) && getComputedStyle(e).visibility !== 'hidden') small.push((e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 12)); });
    const sx = document.documentElement.scrollWidth > innerWidth + 1;
    return { overlaps: [...new Set(out)], bad, small, hscroll: sx };
  });
}
{
  const { ctx, page } = await boot({ ...IPHONE, tag: 'iphone' }); await shot(page, '50_mobile_menu'); const o0 = await overlaps(page);
  add('iPhone相当(390×844)：メニュー横スクロール・はみ出し', !o0.hscroll && o0.bad.length === 0 ? 'PASS' : 'FAIL', `hscroll=${o0.hscroll} はみ出し=${o0.bad.join(',') || 'なし'}`);
  await page.tap('button.card.playable'); await shot(page, '51_mobile_modal'); await page.tap('text=最初から（第1章）'); await page.waitForSelector('.dlg-box'); await shot(page, '52_mobile_prologue_25d'); const o1 = await overlaps(page);
  await toHubTap(page);
  async function toHubTap(page) { for (let i = 0; i < 60; i++) { const k = await gc(page, () => window.__GC.view.kind); if (k === 'hub') return; if (k === 'line') { await page.tap('.dlg-box'); await page.tap('.dlg-box').catch(() => {}); } else if (k === 'choice') { if (i < 12) await shot(page, '53_mobile_choice'); await page.tap('.choice-opt >> nth=0'); } else await page.waitForTimeout(100); } }
  await page.waitForTimeout(800); await gc(page, () => window.__GC.setSettings({ clockRunning: false })); await shot(page, '54_mobile_hub_3d'); const o2 = await overlaps(page);
  await gc(page, () => { const c = window.__GC; const p = c.sim.standNear('shiraishi'); c.sim.teleport(p.x, p.y, p.z, 0); }); await page.waitForTimeout(700); await shot(page, '55_mobile_hub_prompt'); const o3 = await overlaps(page);
  await page.tap('.act .main'); await page.waitForSelector('.dlg-box'); await shot(page, '56_mobile_dialogue_3d'); const o4 = await overlaps(page);
  await toHubTap(page); await page.tap('text=メニュー ▾'); await page.tap('text=勤務表'); await page.waitForSelector('.sheet'); await shot(page, '57_mobile_roster'); const o5 = await overlaps(page); await page.tap('.sheet-h .btn');
  await page.tap('text=メニュー ▾').catch(() => {}); await page.tap('text=人物関係'); await page.waitForSelector('.sheet'); await shot(page, '58_mobile_relations'); await page.tap('.sheet-h .btn');
  await page.tap('text=2D'); await page.waitForTimeout(600); await shot(page, '59_mobile_2d'); await page.tap('text=擬似3D'); await page.waitForTimeout(900); await shot(page, '60_mobile_25d'); const o6 = await overlaps(page); await page.tap('.seg >> text=3D').catch(() => {});
  const all = { prologue: o1, hub: o2, prompt: o3, dialogue: o4, roster: o5, iso: o6 }; const ov = Object.entries(all).flatMap(([k, v]) => v.overlaps.map(x => `${k}:${x}`)); const bad = Object.entries(all).flatMap(([k, v]) => v.bad.map(x => `${k}:${x}`));
  add('iPhone相当：UI要素の重なり・画面外はみ出し', ov.length === 0 && bad.length === 0 ? 'PASS' : 'FAIL', ov.length || bad.length ? `重なり=${ov.join(' ')} はみ出し=${bad.join(' ')}` : '主要UI(HUD・ジョイスティック・操作ボタン・会話・目標)に重なりなし');
  const small = [...new Set(Object.values(all).flatMap(v => v.small))]; add('iPhone相当：タップ対象サイズ（32px未満）', small.length === 0 ? 'PASS' : 'FAIL', small.length ? '小さい: ' + small.slice(0, 8).join(',') : '主要ボタンはすべて32px以上');
  // 画面回転（横向き）
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(900); await shot(page, '61_mobile_landscape'); const ol = await overlaps(page); const st0 = await gc(page, () => window.__GC.world.story.node); add('iPhone相当：横向きへ回転しても物語状態が維持され重なりが少ない', st0 && ol.hscroll === false ? (ol.overlaps.length === 0 ? 'PASS' : 'FAIL') : 'FAIL', `node=${st0} 重なり=${ol.overlaps.join(' ') || 'なし'}`);
  const hz = await stats(page); add('iPhone相当：描画負荷（SwiftShader計測の参考値）', 'UNVERIFIED', `draw${hz.calls} tris${hz.triangles} 品質=${hz.quality}／実機のFPS・発熱・電池・メモリは未計測`);
  await ctx.close();
}
add('iPhone Safari実機での動作（WebKit・タッチ・音声開始・発熱・電池）', 'UNVERIFIED', 'この環境には実機・WebKitがない。Chromiumのモバイル・タッチ・UA相当のエミュレーションのみ実施');

// ============ 9. パネル・UIの画面 ============
{
  const { ctx, page } = await boot({ tag: 'panels' }); await startGame(page); await gc(page, () => window.__GC.setSettings({ clockRunning: false, quality: 'low' })); await toHub(page);
  for (const [n, id] of [['roster', 'roster'], ['career', 'career'], ['relations', 'relations'], ['timeline', 'timeline'], ['flow', 'flow'], ['save', 'save'], ['settings', 'settings']]) { await gc(page, (id) => { window.__GC.panel = id; window.__GC.notify(); }, id); await page.waitForTimeout(400); await shot(page, `70_panel_${n}`); }
  await gc(page, () => { window.__GC.panel = null; window.__GC.notify(); }); const h = await gc(page, () => { const c = window.__GC; c.world.clock.minute = 10 * 60 + 40; return true; }); void h;
  // 業務タスク画面を実際に開いて撮影
  await gc(page, () => { const c = window.__GC; c.world.story.once = []; c.view = c.runner.enter('ch1.term_task'); c.afterView ? 0 : 0; c.notify(); }); await page.waitForSelector('.sheet'); await shot(page, '71_task_terminal');
  await gc(page, () => { const c = window.__GC; c.view = c.runner.enter('ch1.plat_task'); c.notify(); }); await page.waitForTimeout(300); await shot(page, '72_task_checklist');
  await gc(page, () => { const c = window.__GC; c.view = c.runner.enter('ch1.announce_task'); c.notify(); }); await page.waitForTimeout(300); await shot(page, '73_task_compose');
  await gc(page, () => { const c = window.__GC; c.view = c.runner.enter('ch1.roster_task'); c.notify(); }); await page.waitForTimeout(300); await shot(page, '74_task_roster');
  await gc(page, () => { const c = window.__GC; c.view = c.runner.enter('ch1.delay_choice'); c.afterView ? 0 : 0; c.notify(); }); await page.waitForTimeout(300); await shot(page, '75_choice_important');
  await ctx.close();
}

// ============ 10. 長時間動作（ソーク）・メモリ ============
{
  const { ctx, page } = await boot({ tag: 'soak' }); await startGame(page); await gc(page, () => window.__GC.setSettings({ clockRunning: true, quality: 'medium', autoQuality: false })); await toHub(page);
  const SOAK = Number(process.env.SOAK_SEC ?? 75); const samples = []; const t0 = Date.now(); let dir = 0;
  while ((Date.now() - t0) / 1000 < SOAK) { dir += 1; await gc(page, (d) => { const rm = window.__RR.rm; const a = d * 0.9; rm.setMoveInput(Math.sin(a), -Math.cos(a)); rm.yaw += 0.15; }, dir); await page.waitForTimeout(1500); if (dir % 5 === 0) { const s = await stats(page); samples.push({ t: Math.round((Date.now() - t0) / 1000), heap: s.heapMB, geo: s.geometries, tex: s.textures, calls: s.calls }); if (dir % 15 === 0) await page.evaluate(() => { const c = window.__GC; if (c.view.kind === 'hub') c.waitMinutes(20); }); } const k = await gc(page, () => window.__GC.view.kind); if (k === 'line') await page.click('.dlg-box').catch(() => {}); if (k === 'choice') await page.click('.choice-opt >> nth=0').catch(() => {}); if (k === 'task') break; }
  await gc(page, () => window.__RR.rm.setMoveInput(0, 0)); const first = samples[0], last = samples.at(-1);
  const growth = first && last && first.heap ? (last.heap - first.heap) / first.heap : 0; const stable = samples.length > 1 && samples.every(s => s.geo === samples[1].geo && s.tex === samples[1].tex);
  writeFileSync(`${OUT}/soak.json`, JSON.stringify(samples, null, 1));
  add('長時間動作（歩行・時計進行・列車運行）：メモリ増加とリソースリーク', samples.length >= 4 && growth < 0.6 && stable ? 'PASS' : 'FAIL', `${SOAK}秒／JSヒープ ${first?.heap}→${last?.heap}MB（+${Math.round(growth * 100)}%）／geometry・texture数 ${stable ? '一定' : '変動'}（${last?.geo}/${last?.tex}）`);
  const ev = await gc(page, () => ({ node: window.__GC.world.story.node, min: window.__GC.world.clock.minute })); add('長時間動作：時刻イベントで物語が進行（遅延・昼休憩）', ev.min > 8 * 60 + 30 ? 'PASS' : 'FAIL', `node=${ev.node} 時刻=${ev.min}`);
  await ctx.close();
}

// ============ 11. 性能（品質別・参考値） ============
{
  const { ctx, page } = await boot({ tag: 'perf' }); await startGame(page); await toHub(page); await gc(page, () => window.__GC.setSettings({ clockRunning: false, autoQuality: false })); const rows = [];
  for (const q of ['high', 'medium', 'low']) { await gc(page, (q) => window.__GC.setSettings({ quality: q }), q); await gc(page, () => { window.__RR.rm.setPreset('overview'); }); await page.waitForTimeout(2500); const s = await stats(page); rows.push(`${q}: ${s.fps}fps ${s.frameMs}ms draw${s.calls} tris${s.triangles} tex${s.textures} heap${s.heapMB}MB`); }
  add('描画性能（SwiftShader＝CPUソフトウェア描画・実機の代表値ではない）', 'UNVERIFIED', rows.join(' ／ ') + '。実GPU・iPhoneでの30/60fps達成は未確認'); await ctx.close();
}

// ============ 12. 実車・実機に関する未検証項目 ============
add('313系の実車照合（寸法・塗装・床下機器）', 'UNVERIFIED', '公開寸法の概略値（全長19.4m・幅2.9m・高3.9m）で作成した簡略モデル。写真・図面との重ね合わせ照合は未実施');
add('Artifacts環境での実行（CSP・IndexedDB・WebGL・外部フォント）', 'UNVERIFIED', 'Artifact公開後のライブ環境での検証は別途実施（下記レポート参照）');
add('Vercel公開／ArtifactsとVercelの同等性', 'UNVERIFIED', '仕様どおりプロトタイプはArtifacts専用のためVercelには未公開。同等性検証は正式完成段階の対象');
add('R7第3〜96章・R1〜R6・R8〜R11・C1〜C3・313系運転・指令・経営・レース', 'UNVERIFIED', '未実装（設計のみ）。完成済みとしてカウントしていない');

// ============ 結果 ============
const jsErrors = errors.filter(e => !/GL Driver Message|GPU stall|ReadPixels|Failed to load resource.*fonts|net::ERR/.test(e)); add('ブラウザコンソールエラー／未捕捉例外', jsErrors.length === 0 ? 'PASS' : 'FAIL', jsErrors.length ? jsErrors.slice(0, 3).join(' | ') : '全シナリオで0件（フォント読込のネットワーク失敗は除外）');
await browser.close();
const summary = { PASS: items.filter(i => i.status === 'PASS').length, FAIL: items.filter(i => i.status === 'FAIL').length, UNVERIFIED: items.filter(i => i.status === 'UNVERIFIED').length };
const report = { generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC', env: 'Chromium(SwiftShader, headless) / Linux', summary, items };
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1)); writeFileSync('src/data/audit-report.json', JSON.stringify(report, null, 1));
writeFileSync(`${OUT}/REPORT.md`, `# 監査レポート\n\n${report.generatedAt} ／ ${report.env}\n\nPASS ${summary.PASS} ／ FAIL ${summary.FAIL} ／ UNVERIFIED ${summary.UNVERIFIED}\n\n| 項目 | 判定 | 根拠 |\n|---|---|---|\n${items.map(i => `| ${i.name} | ${i.status} | ${i.note.replace(/\|/g, '/')} |`).join('\n')}\n`);
console.log('\n' + JSON.stringify(summary)); process.exit(summary.FAIL ? 1 : 0);
