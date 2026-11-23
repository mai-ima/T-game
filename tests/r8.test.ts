import { describe, it, expect } from 'vitest';
import r7 from '../src/data/r7/story.json';
import r8 from '../src/data/r8/story.json';
import { storyFor, registeredModes } from '../src/data/stories';
import { MODES } from '../src/data/modes';
import { lintStory } from '../src/engine/storyLint';
import { condRefs } from '../src/engine/conditions';
import { StoryRunner, type RunnerView } from '../src/engine/storyRunner';
import { createWorld } from '../src/engine/worldState';
import { SaveManager, MemoryAdapter, key } from '../src/engine/save';
import type { Cond, Effect, StoryData, StoryNode, WorldState } from '../src/engine/types';

const S = r8 as unknown as StoryData;
const S7 = r7 as unknown as StoryData;
const nodes = Object.values(S.nodes);

/** 全ノードが持つ効果（選択肢・業務結果の効果を含む） */
function allEffects(n: StoryNode): Effect[] {
  const out: Effect[] = [...(n.effects ?? [])];
  if (n.type === 'choice') n.options.forEach(o => out.push(...(o.effects ?? [])));
  if (n.type === 'task') n.results.forEach(r => out.push(...(r.effects ?? [])));
  return out;
}
function allConds(n: StoryNode): (Cond | undefined)[] {
  if (n.type === 'choice') return n.options.map(o => o.requires);
  if (n.type === 'branch') return n.cases.map(c => c.when);
  return [];
}

/** 状態を厳密に列挙する探索：選択肢・業務の得点（0/50/100）・自動分岐をすべてたどり、到達ノードと結末を集める。
 *  R8の条件はフラグのみ（別テストで検査）なので、(ノード, フラグ集合) が同じ状態は同じ未来を持つ。 */
function explore() {
  const seen = new Set<string>(); const reached = new Set<string>(); const endings = new Set<string>(); const endNodes = new Set<string>();
  const stack: WorldState[] = []; const w0 = createWorld(S, 'テスト'); const r0 = new StoryRunner(S, w0); r0.enter(S.chapters[0].start); stack.push(w0);
  const refs = new Set<string>(); for (const n of nodes) allConds(n).forEach(c => condRefs(c).flags.forEach(f => refs.add(f)));
  const keyOf = (w: WorldState) => w.story.node + '|' + Object.keys(w.flags).filter(f => refs.has(f)).sort().join(',');
  while (stack.length) {
    const w = stack.pop()!; const k = keyOf(w); if (seen.has(k)) continue; seen.add(k); w.story.visited.forEach(x => reached.add(x));
    const n = S.nodes[w.story.node]; const step = (f: (r: StoryRunner) => RunnerView) => { const c = structuredClone(w); const r = new StoryRunner(S, c); f(r); stack.push(c); };
    const probe = new StoryRunner(S, structuredClone(w)); const v = probe.view();
    if (v.kind === 'line') step(r => r.next());
    else if (v.kind === 'choice') for (const o of v.options) step(r => r.choose(o.id));
    else if (v.kind === 'task') for (const sc of [0, 50, 100]) step(r => r.resolveTask(sc));
    else if (v.kind === 'end') { endNodes.add(n.id); w.story.endings.forEach(e => endings.add(e)); }
    else throw new Error('想定外のノード種別: ' + v.kind);
  }
  return { reached, endings, endNodes, states: seen.size };
}

/** 決まった選択と得点で最後まで進める（結末の再現用） */
function play(picks: Record<string, string>, scores: Record<string, number> = {}) {
  const w = createWorld(S, 'テスト'); const r = new StoryRunner(S, w); let v = r.enter(S.chapters[0].start); let guard = 0;
  while (guard++ < 500) {
    if (v.kind === 'line') v = r.next();
    else if (v.kind === 'choice') { const id = picks[v.node.id] ?? v.options[0].id; v = r.choose(id); }
    else if (v.kind === 'task') v = r.resolveTask(scores[v.node.id] ?? 100);
    else if (v.kind === 'end') return { w, end: v.node.id };
    else throw new Error('想定外: ' + v.kind);
  }
  throw new Error('終端に到達しません');
}
const INT_ALL = { 'ch1.int_menu': '' };
// 聞き取りメニューは「選んで戻る」形式なので、順番に全項目を選ぶための補助（未選択を順に選び、最後に終了を選ぶ）
function playAll(picks: Record<string, string>, scores: Record<string, number> = {}, order: Record<string, string[]> = {}) {
  const w = createWorld(S, 'テスト'); const r = new StoryRunner(S, w); let v = r.enter(S.chapters[0].start); let guard = 0; void INT_ALL;
  while (guard++ < 800) {
    if (v.kind === 'line') v = r.next();
    else if (v.kind === 'choice') {
      const id = v.node.id; const want = order[id]; let pick: string | undefined;
      if (want) pick = want.find(x => v.kind === 'choice' && v.options.some(o => o.id === x));
      pick ??= picks[id] ?? v.options[0].id; v = r.choose(pick);
    }
    else if (v.kind === 'task') v = r.resolveTask(scores[v.node.id] ?? 100);
    else if (v.kind === 'end') return { w, end: v.node.id };
    else throw new Error('想定外: ' + v.kind);
  }
  throw new Error('終端に到達しません');
}
const FULL_INT = { 'ch1.int_menu': ['tg', 'ot', 'mt', 'enough'], 'ch1.tg_menu': ['src', 'done', 'shared', 'end'], 'ch1.ot_menu': ['why', 'origin', 'end'], 'ch1.mt_menu': ['minutes', 'reg', 'end'] };
const MIN_INT = { 'ch1.int_menu': ['tg', 'ot', 'enough'], 'ch1.tg_menu': ['src', 'end'], 'ch1.ot_menu': ['why', 'end'] };

describe('R8 ストーリーの静的検査', () => {
  it('モードがR8で、lintに error がない', () => {
    expect(S.mode).toBe('R8'); expect(S.storyId).toBe('r8');
    expect(lintStory(S).filter(i => i.level === 'error')).toEqual([]);
  });
  it('条件はフラグ系だけ（到達性テストが状態を厳密に列挙できる）', () => {
    const bad: string[] = [];
    const walk = (c: Cond | undefined, id: string) => { if (!c) return; if ('all' in c) c.all.forEach(x => walk(x, id)); else if ('any' in c) c.any.forEach(x => walk(x, id)); else if ('not' in c) walk(c.not, id); else if (!('flag' in c) && !('notFlag' in c)) bad.push(id + ':' + Object.keys(c)[0]); };
    for (const n of nodes) allConds(n).forEach(c => walk(c, n.id));
    expect(bad).toEqual([]);
  });
  it('重要な選択は2〜3個（章の長さに応じた目安）', () => {
    const imp = nodes.filter(n => n.type === 'choice' && n.important); expect(imp.length).toBeGreaterThanOrEqual(2); expect(imp.length).toBeLessThanOrEqual(3);
  });
  it('章の状態が誠実（未制作章は start が空）', () => { for (const c of S.chapters) if (c.status === 'planned') expect(c.start).toBe(''); });
});

describe('R8 到達性（状態を列挙）', () => {
  const ex = explore();
  it('全ノードが、ある選択の組み合わせで到達できる', () => {
    const missing = Object.keys(S.nodes).filter(id => !ex.reached.has(id)); expect(missing).toEqual([]);
  });
  it('全エンディングに到達でき、意味の異なる結末が3通り以上ある', () => {
    const defined = nodes.filter(n => n.type === 'end'); expect([...ex.endNodes].sort()).toEqual(defined.map(n => n.id).sort());
    expect(ex.endings.size).toBeGreaterThanOrEqual(3); expect([...ex.endings].sort()).toEqual(Object.keys(S.endings ?? {}).sort());
    const summaries = new Set(defined.map(n => n.type === 'end' ? n.summary : '')); expect(summaries.size).toBe(defined.length);
  });
  it('探索した状態数が現実的（爆発していない）', () => { expect(ex.states).toBeGreaterThan(100); expect(ex.states).toBeLessThan(50000); });
});

describe('R8 結末の再現と選択の影響', () => {
  it('現地確認＋第3版の経緯＋確度を分けた報告 → 「版を正す」', () => {
    const { w, end } = playAll({ 'ch1.plan': 'site', 'ch1.policy': 'graded' }, {}, FULL_INT); expect(end).toBe('ch1.end_corrected'); expect(w.story.endings).toEqual(['corrected']);
  });
  it('書類の再確認＋完了報告書＋確度を分けた報告 → 「役目を終えた但し書き」', () => {
    const { w, end } = playAll({ 'ch1.plan': 'drawing', 'ch1.policy': 'graded' }, {}, FULL_INT); expect(end).toBe('ch1.end_retired'); expect(w.story.endings).toEqual(['retired']);
  });
  it('証拠が足りない／記憶頼みなら、報告が良くても「確認中のまま、前へ」', () => {
    expect(playAll({ 'ch1.plan': 'memory', 'ch1.policy': 'graded' }, {}, FULL_INT).end).toBe('ch1.end_open');
    expect(playAll({ 'ch1.plan': 'site', 'ch1.policy': 'graded' }, {}, MIN_INT).end).toBe('ch1.end_open');
    expect(playAll({ 'ch1.plan': 'site', 'ch1.policy': 'defer' }, {}, FULL_INT).end).toBe('ch1.end_open');
  });
  it('確度の混ざった報告（得点が低い）では「版を正す」に届かない', () => {
    expect(playAll({ 'ch1.plan': 'site', 'ch1.policy': 'graded' }, { 'ch1.report_task': 0 }, FULL_INT).end).toBe('ch1.end_open');
    expect(playAll({ 'ch1.plan': 'site', 'ch1.policy': 'graded' }, { 'ch1.grade_task': 0 }, FULL_INT).end).toBe('ch1.end_open');
  });
  it('根拠なしの断定は、信頼低下と報告の差し戻しにつながる', () => {
    const base = playAll({ 'ch1.plan': 'site', 'ch1.policy': 'graded' }, {}, FULL_INT).w.relationships.kawai.trust;
    const { w, end } = playAll({ 'ch1.ic1': 'assert', 'ch1.plan': 'memory', 'ch1.policy': 'assert' }, {}, FULL_INT);
    expect(end).toBe('ch1.end_sent_back'); expect(w.relationships.kawai.trust).toBeLessThan(0); expect(w.relationships.kawai.trust).toBeLessThan(base);
    expect(w.career.evaluations.reporting).toBeLessThan(50); expect(w.flags['r8.early_assert']).toBe(true);
  });
  it('最初の動き（3択）が、後の状態へ残る', () => {
    expect(playAll({ 'ch1.ic1': 'verify' }).w.flags['r8.docs_first']).toBe(true);
    const ask = playAll({ 'ch1.ic1': 'ask' }, {}, FULL_INT).w; expect(ask.flags['r8.phone_otsuki']).toBe(true); expect(ask.log.some(l => l.text.includes('電話'))).toBe(true);
  });
  it('聞き取りは最低2人（1人では「終える」を選べない）', () => {
    const w = createWorld(S, 't'); const r = new StoryRunner(S, w); r.enter('ch1.int_menu'); const v = r.view();
    expect(v.kind === 'choice' && v.options.map(o => o.id)).toEqual(['tg', 'ot', 'mt']);
    r.choose('tg'); w.flags['r8.tg_done'] = true; r.enter('ch1.int_menu'); const v2 = r.view(); expect(v2.kind === 'choice' && v2.options.some(o => o.id === 'enough')).toBe(false);
    w.flags['r8.ot_done'] = true; r.enter('ch1.int_menu'); const v3 = r.view(); expect(v3.kind === 'choice' && v3.options.some(o => o.id === 'enough')).toBe(true);
  });
});

describe('R8 非暴力・非ホラー・非経営', () => {
  const BAN = /殺|死|遺体|遺書|失踪|行方不明|消息|幽霊|怪異|怪談|呪|亡霊|祟|心霊|血|暴力|脅迫|脅し|脅す|殴|蹴|刺す|刺さ|刃物|拉致|監禁|誘拐|爆破|放火|拷問|悲鳴|恐怖|ホラー|不気味|おぞま|殺気/;
  const texts = (): string[] => {
    const t: string[] = [S.title, S.subtitle]; for (const c of Object.values(S.characters)) t.push(c.name, c.role, c.trait, c.bio);
    for (const c of S.chapters) t.push(c.title, c.synopsis); for (const e of Object.values(S.endings ?? {})) t.push(e.title, e.text);
    for (const n of nodes) {
      if (n.type === 'line') n.lines.forEach(l => t.push(l.text));
      if (n.type === 'choice') { t.push(n.prompt); n.options.forEach(o => t.push(o.label, o.hint ?? '')); }
      if (n.type === 'task') { t.push(n.title, n.intro ?? '', JSON.stringify(n.config ?? {}), JSON.stringify(n.items ?? []), JSON.stringify(n.slots ?? [])); n.results.forEach(r => t.push(r.label ?? '')); }
      if (n.type === 'end') t.push(n.title, n.summary);
      allEffects(n).forEach(e => { if ('log' in e) t.push(e.log.text); if ('timeline' in e) t.push(e.timeline.text); });
    }
    return t;
  };
  it('ホラー・殺人・失踪・怪異・暴力・脅迫の語彙を含まない', () => {
    const hits = texts().filter(s => BAN.test(s)).map(s => s.match(BAN)![0] + '：' + s.slice(0, 40)); expect(hits).toEqual([]);
  });
  it('経営系のエフェクト・語彙がない（効果は物語・関係・評価・時間・記録のみ）', () => {
    const allowed = new Set(['set', 'eval', 'rel', 'log', 'timeline', 'clock', 'ending', 'assign']);
    const used = new Set<string>(); nodes.forEach(n => allEffects(n).forEach(e => used.add(Object.keys(e)[0]))); expect([...used].filter(k => !allowed.has(k))).toEqual([]);
    expect(JSON.stringify(S)).not.toMatch(/budget|revenue|profit|予算|売上|利益|株主|資金|融資|投資|収支|決算/);
    const m = MODES.find(x => x.id === 'R8')!; expect(m.management).toBe(false);
  });
  it('主人公は規程を破らない：規程確認の業務があり、無断持出し・書換えは「不適切」と判定される', () => {
    const t = S.nodes['ch1.rules_task']; expect(t.type).toBe('task'); if (t.type !== 'task') return;
    const ng = (t.items ?? []).filter(i => i.truth === 'ng').map(i => i.label).join('\n'); expect(ng).toMatch(/持ち出/); expect(ng).toMatch(/書き直/);
  });
});

describe('R8 根拠の確度（確認済み／未確認／推定）', () => {
  it('証言・記憶のみの主張は「確認済み」にならず、現在の系統は「未確認」である', () => {
    const t = S.nodes['ch1.grade_task']; if (t.type !== 'task') throw new Error('task'); const claims = t.config.claims as { id: string; source: string; truth: string }[];
    for (const c of claims) if (/記憶|証言|説明（|のみ/.test(c.source) && !/履歴|記録|報告書|台帳|写し|照合/.test(c.source)) expect(c.truth).not.toBe('confirmed');
    expect(claims.find(c => c.id === 'g5')!.truth).toBe('unconfirmed');
    expect(new Set(claims.map(c => c.truth))).toEqual(new Set(['confirmed', 'inferred', 'unconfirmed']));
  });
  it('文書比較：版・日付・出典・確認状況があり、矛盾の対象行は1組、ほかの差（更新・表記）は矛盾に数えない', () => {
    const t = S.nodes['ch1.docs_task']; if (t.type !== 'task') throw new Error('task'); const cfg = t.config;
    expect(cfg.docs.length).toBe(2); for (const d of cfg.docs) for (const k of ['ver', 'date', 'iso', 'source', 'check']) expect(d[k]).toBeTruthy();
    const ids = cfg.docs.flatMap((d: { lines: { id: string }[] }) => d.lines.map(l => l.id)); for (const x of cfg.targets) expect(ids).toContain(x);
    expect(cfg.targets).toEqual(['a3', 'b3']); expect(Object.keys(cfg.why).length).toBeGreaterThan(cfg.targets.length);
  });
});

describe('複数ストーリー登録とセーブの独立', () => {
  it('モードIDでストーリーが切り替わり、プレイ可能モードと登録が一致する', () => {
    expect(storyFor('R7').mode).toBe('R7'); expect(storyFor('R8').mode).toBe('R8'); expect(storyFor('R8')).not.toBe(storyFor('R7'));
    expect(() => storyFor('R9')).toThrow();
    expect(registeredModes().sort()).toEqual(MODES.filter(m => m.status === 'playable').map(m => m.id).sort());
    expect(MODES.find(m => m.id === 'R8')!.status).toBe('playable');
  });
  it('R7とR8のセーブは同じスロット名でも独立し、互いに上書き・読込できない', async () => {
    const sm = new SaveManager(new MemoryAdapter());
    const w7 = createWorld(S7, 'セブン'); const w8 = createWorld(S, 'エイト'); w8.flags['r8.docs_first'] = true; w8.story.node = 'ch1.o4'; w7.story.node = 'ch1.hub';
    await sm.save('R7', 'auto', w7, { chapter: 'ch1', chapterTitle: '新しい名札', dayLabel: '', node: w7.story.node });
    await sm.save('R8', 'auto', w8, { chapter: 'ch1', chapterTitle: '白紙の一頁', dayLabel: '', node: w8.story.node });
    expect(key('R7', 'auto')).toBe('save:R7:auto'); expect(key('R8', 'auto')).toBe('save:R8:auto');
    const l7 = (await sm.load('R7', 'auto'))!; const l8 = (await sm.load('R8', 'auto'))!;
    expect(l7.world.playerName).toBe('セブン'); expect(l8.world.playerName).toBe('エイト'); expect(l7.world.storyId).toBe('r7'); expect(l8.world.storyId).toBe('r8');
    expect(l7.world.flags['r8.docs_first']).toBeUndefined(); expect(l8.world.flags['r8.docs_first']).toBe(true);
    // R8を上書きしてもR7は変わらない
    w8.story.node = 'ch1.policy'; await sm.save('R8', 'auto', w8, { chapter: 'ch1', chapterTitle: '', dayLabel: '', node: w8.story.node });
    expect((await sm.load('R7', 'auto'))!.world.story.node).toBe('ch1.hub'); expect((await sm.load('R8', 'auto'))!.world.story.node).toBe('ch1.policy');
    // 他モードの世界は保存できず、他モードのファイルは読み込めない
    await expect(sm.save('R7', '1', w8, { chapter: '', chapterTitle: '', dayLabel: '', node: '' })).rejects.toThrow();
    const raw = (await (sm.adapter.get(key('R8', 'auto'))))!; expect(() => sm.parse(raw, 'R7')).toThrow(/別モード/);
    expect(Object.values(await sm.list('R7')).filter(x => x && x !== 'corrupt').length).toBe(1); expect((await sm.list('R8')).auto).toBeTruthy();
  });
  it('R8のセーブから、同じ状況で再開しても分岐が変わらない（保存再開）', async () => {
    const sm = new SaveManager(new MemoryAdapter()); const w = createWorld(S, 'テスト'); const r = new StoryRunner(S, w); r.enter('ch1.plan'); r.choose('site');
    await sm.save('R8', '1', w, { chapter: 'ch1', chapterTitle: '', dayLabel: '', node: w.story.node }); const f = (await sm.load('R8', '1'))!;
    const r2 = new StoryRunner(S, f.world); const v = r2.view(); expect(v.kind).toBe('line'); expect(f.world.flags['r8.plan_site']).toBe(true); expect(f.world).toEqual(w);
  });
  it('R7のデータは変更されていない（R8がR7の人物・フラグを使わない）', () => {
    expect(Object.keys(S7.nodes).some(k => k.startsWith('ch1.'))).toBe(true);
    expect(Object.keys(S.characters).filter(c => c in S7.characters)).toEqual([]);
    expect(Object.keys(S.nodes).filter(k => k in S7.nodes && !k.startsWith('ch1.'))).toEqual([]);
  });
});
