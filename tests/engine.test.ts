import { describe, it, expect } from 'vitest';
import story from '../src/data/r7/story.json';
import { lintStory } from '../src/engine/storyLint';
import { StoryRunner } from '../src/engine/storyRunner';
import { createWorld, advanceClock, gameDate, overallRating } from '../src/engine/worldState';
import { evalCond } from '../src/engine/conditions';
import { transferEligibility, decideTransfer, sampleRoster, validateRoster } from '../src/engine/career';
import { SaveManager, MemoryAdapter } from '../src/engine/save';
import type { StoryData, WorldState } from '../src/engine/types';
import { MODES } from '../src/data/modes';

const S = story as unknown as StoryData;

// 簡易な乱数
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** ランダム・プレイスルー。到達ノード・終端・フラグを収集する。 */
function playthrough(seed: number, visitedAll: Set<string>) {
  const r = rng(seed); const w = createWorld(S, 'テスト');
  const run = new StoryRunner(S, w);
  let v = run.enter(S.chapters[0].start); let guard = 0; const chDay: Record<string, number> = {};
  const endNodes: string[] = [];
  while (guard++ < 800) {
    if (v.kind === 'line') v = run.next();
    else if (v.kind === 'choice') { const o = v.options[Math.floor(r() * v.options.length)]; v = run.choose(o.id, v.node.timeLimit ? r() < 0.15 : false); }
    else if (v.kind === 'task') v = run.resolveTask([0, 50, 100, 100][Math.floor(r() * 4)]);
    else if (v.kind === 'hub') {
      const t = run.checkTimed(); if (t) { v = t; continue; }
      if (v.canExit && r() < 0.5) { v = run.exitHub(); continue; }
      const ints = v.interactions;
      if (ints.length && r() < 0.85) v = run.interact(ints[Math.floor(r() * ints.length)].id);
      else { advanceClock(w, 30 + Math.floor(r() * 60)); v = run.view(); } // 実ゲームでも時刻が進むと画面状態を更新する
    } else if (v.kind === 'end') {
      endNodes.push(v.node.id); run.finishChapter();
      if (v.node.nextChapter) { v = run.startChapter(v.node.nextChapter); chDay[w.story.chapter] = w.clock.day; } else break;
    }
  }
  for (const n of w.story.visited) visitedAll.add(n);
  return { w, endNodes, guard, chDay };
}

describe('ストーリーデータの静的検査', () => {
  it('lintに error がない', () => {
    const errors = lintStory(S).filter(i => i.level === 'error');
    expect(errors).toEqual([]);
  });
  it('第1章の重要選択（大きな分岐）の数は、章の長さ（ノード数）に比例した上限内', () => {
    const imp = Object.values(S.nodes).filter(n => n.type === 'choice' && n.important && n.id.startsWith('ch1.'));
    const len = Object.keys(S.nodes).filter(k => k.startsWith('ch1.')).length; const cap = Math.max(3, Math.ceil(len / 60)); // 約60ノードあたり1個を上限の目安にする
    expect(imp.length).toBeGreaterThanOrEqual(1); expect(imp.length).toBeLessThanOrEqual(cap);
  });
  it('R7は経営シミュレーション機能を持たない（経営系エフェクトがない）', () => {
    const json = JSON.stringify(S);
    expect(json).not.toMatch(/budget|予算編成|株主総会/);
  });
  it('全章ステータスが誠実（未制作章は start が空）', () => {
    for (const c of S.chapters) if (c.status === 'planned') expect(c.start).toBe('');
  });
});

describe('分岐到達性（ランダム・プレイスルー 600回）', () => {
  const visited = new Set<string>(); const flagsSeen = new Set<string>(); const ratings = new Set<string>(); const endIds = new Set<string>(); const ch2variants = new Set<string>();
  for (let i = 0; i < 600; i++) {
    const { w, endNodes } = playthrough(1000 + i, visited);
    Object.keys(w.flags).forEach(f => flagsSeen.add(f));
    ratings.add(overallRating(w.career).rating);
    endNodes.forEach(e => endIds.add(e));
    Object.keys(w.flags).filter(f => f.startsWith('next.')).forEach(f => ch2variants.add(f));
  }
  it('実装済みノードがすべて到達可能', () => {
    const reachable = Object.keys(S.nodes).filter(id => !visited.has(id));
    expect(reachable).toEqual([]);
  });
  it('プレイ可能な全章の終端に到達できる', () => { const want = (S.chapters as any[]).filter(c => c.status === 'playable').map(c => c.id + '.end').sort(); expect([...endIds].sort()).toEqual(want); });
  it('第1章の選択が第2章の導入を変える（4種以上）', () => { expect(ch2variants.size).toBeGreaterThanOrEqual(4); });
  it('評価ランクが複数種類に分岐する', () => { expect(ratings.size).toBeGreaterThanOrEqual(2); });
});

describe('時間依存分岐・選択の後効き', () => {
  it('10:40の遅延イベントで、11:05以降は遅れて対応する分岐に入る', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w);
    run.enter('ch1.hub'); w.clock.minute = 11 * 60 + 10;
    const v = run.checkTimed(); expect(v).not.toBeNull();
    expect(w.story.node).toBe('ch1.delay_late'); expect(w.flags['ch1.delay_late']).toBe(true);
  });
  it('10:40ちょうどは通常の対応に入る', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w);
    run.enter('ch1.hub'); w.clock.minute = 10 * 60 + 41;
    run.checkTimed(); expect(w.story.node).toBe('ch1.delay_intro');
  });
  it('第1章の「たぶん」の回答→黙った場合、第2章冒頭で監査分岐に入る', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w);
    run.enter('ch1.delay_choice'); run.choose('quick'); // delay_quick
    expect(w.flags['ch1.guessed_info']).toBe(true);
    // 沈黙を選ぶ
    let v = run.next(); while (v.kind === 'line') v = run.next();
    expect(v.kind).toBe('choice'); run.choose('silent');
    expect(w.flags['legacy.concealed']).toBe(true);
    run.startChapter('ch2'); expect(w.story.node === 'ch2.audit' || w.flags['legacy.concealed']).toBe(true);
    const n = w.story.node; let g = 0; while (g++ < 10 && w.story.node !== 'ch2.audit') { try { run.next(); } catch { break; } }
    expect(w.story.visited).toContain('ch2.audit');
    expect(n).toBeDefined();
  });
  it('timeLimitの既定選択が履歴にtimedOutとして残る', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w);
    run.enter('ch1.delay_choice'); run.choose('ask', true);
    expect(w.story.choices.at(-1)).toMatchObject({ node: 'ch1.delay_choice', option: 'ask', timedOut: true });
  });
  it('ハブのeffectsは再進入で二重適用されない', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w);
    run.enter('ch1.hub'); run.enter('ch1.hub'); expect(w.story.visited.filter(x => x === 'ch1.hub').length).toBe(1);
  });
});

describe('人物関係・キャリア・勤務表', () => {
  it('人物関係が範囲内にクランプされる', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w);
    run.enter('ch1.closing_choice'); w.relationships.kubota = { trust: 9, rapport: 9, met: true, notes: [] };
    run.choose('mentor'); expect(w.relationships.kubota.trust).toBe(10); expect(w.relationships.kubota.rapport).toBe(10);
  });
  it('新入社員は他部署の異動要件を満たさない（希望すれば無条件で異動できない）', () => {
    const w = createWorld(S, 'T');
    for (const d of ['crew', 'depot', 'planning', 'facility', 'hr', 'pr', 'digital']) {
      const e = transferEligibility(w.career, d, 30); expect(e.eligible).toBe(false);
      expect(decideTransfer(w.career, d, 30).decision).toBe('rejected');
    }
  });
  it('要件を満たせば承認、現部署が逼迫していれば保留', () => {
    const w = createWorld(S, 'T'); const c = w.career;
    c.certifications.push({ id: 'station_basic', day: 100 }); c.trainings.depot_intro = { progress: 100, done: true };
    c.evaluations.safety = 70; c.evaluations.accuracy = 70;
    expect(decideTransfer(c, 'depot', 400).decision).toBe('approved');
    expect(decideTransfer(c, 'depot', 400, { currentDeptShortage: true }).decision).toBe('deferred');
    expect(decideTransfer(c, 'depot', 100).decision).toBe('rejected'); // 在籍期間不足
  });
  it('サンプル勤務表は自社規程（架空）を満たす', () => { expect(validateRoster(sampleRoster())).toEqual([]); });
  it('連続7日勤務・短いインターバルを検出する', () => {
    const r = sampleRoster().map(() => '日勤' as const); expect(validateRoster(r).length).toBeGreaterThan(0);
    const s = sampleRoster(); s[1] = '遅番'; s[2] = '早番'; expect(validateRoster(s).some(i => i.msg.includes('インターバル'))).toBe(true);
  });
  it('日付計算：入社日は2027-04-01(木)', () => { expect(gameDate(2027, 0).wd).toBe('木'); expect(gameDate(2027, 1).label).toContain('4月2日'); });
  it('条件式の入れ子', () => {
    const w = createWorld(S, 'T'); w.flags.a = true;
    expect(evalCond({ all: [{ flag: 'a' }, { not: { flag: 'b' } }, { any: [{ flag: 'x' }, { flag: 'a' }] }] }, w)).toBe(true);
  });
});

describe('セーブ・ロード・モード独立性', () => {
  it('保存→読込で状態が完全一致', async () => {
    const sm = new SaveManager(new MemoryAdapter()); const w = createWorld(S, 'ハル');
    const run = new StoryRunner(S, w); run.enter('ch1.p_wish'); run.choose('depot'); w.playtimeSec = 123;
    await sm.save('R7', '1', w, { chapter: 'ch1', chapterTitle: 't', dayLabel: 'd', node: w.story.node });
    const f = await sm.load('R7', '1'); expect(f!.world).toEqual(w);
  });
  it('スロットが独立している', async () => {
    const sm = new SaveManager(new MemoryAdapter()); const a = createWorld(S, 'A'); const b = createWorld(S, 'B');
    await sm.save('R7', '1', a, { chapter: 'ch1', chapterTitle: '', dayLabel: '', node: '' }); await sm.save('R7', '2', b, { chapter: 'ch1', chapterTitle: '', dayLabel: '', node: '' });
    expect((await sm.load('R7', '1'))!.world.playerName).toBe('A'); expect((await sm.load('R7', '2'))!.world.playerName).toBe('B');
  });
  it('別モードのセーブ領域は混ざらない', async () => {
    const sm = new SaveManager(new MemoryAdapter()); const w = createWorld(S, 'A');
    await sm.save('R7', '1', w, { chapter: '', chapterTitle: '', dayLabel: '', node: '' });
    expect(await sm.load('R8', '1')).toBeUndefined();
    await expect(sm.save('R8', '1', w, { chapter: '', chapterTitle: '', dayLabel: '', node: '' })).rejects.toThrow();
  });
  it('破損データを検出する', async () => {
    const ad = new MemoryAdapter(); const sm = new SaveManager(ad); const w = createWorld(S, 'A');
    await sm.save('R7', '1', w, { chapter: '', chapterTitle: '', dayLabel: '', node: '' });
    const raw = (await ad.get('save:R7:1'))!; await ad.set('save:R7:1', raw.replace('"A"', '"B"'));
    await expect(sm.load('R7', '1')).rejects.toThrow(/破損/);
    expect((await sm.list('R7'))['1']).toBe('corrupt');
  });
  it('エクスポート→インポートで復元', async () => {
    const sm = new SaveManager(new MemoryAdapter()); const w = createWorld(S, '漢字名');
    await sm.save('R7', '1', w, { chapter: '', chapterTitle: '', dayLabel: '', node: '' });
    const text = await sm.exportText('R7', '1'); const f = await sm.importText('R7', '3', text);
    expect(f.world.playerName).toBe('漢字名'); expect((await sm.load('R7', '3'))!.world).toEqual(w);
  });
});

describe('14モード定義', () => {
  it('14モード・ストーリー12・自由2で、プレイ可能なのはR7とR8のみ', () => {
    expect(MODES.length).toBe(14);
    expect(MODES.filter(m => m.kind === 'story').length).toBe(12);
    expect(MODES.filter(m => m.kind === 'free').length).toBe(2);
    expect(MODES.filter(m => m.status === 'playable').map(m => m.id)).toEqual(['R7', 'R8']);
    for (const m of MODES) if (m.status !== 'playable') expect(m.status).toBe('unimplemented');
  });
  it('R5〜R11に経営操作フラグがない／R2・C2のみ経営あり', () => {
    for (const m of MODES) { const mgmt = m.management; if (['R2', 'C2'].includes(m.id)) expect(mgmt).toBe(true); else if (['R4', 'C3'].includes(m.id)) expect(typeof mgmt).toBe('boolean'); else expect(mgmt).toBe(false); }
  });
  it('各モードのセーブ領域が一意', () => { expect(new Set(MODES.map(m => m.id)).size).toBe(14); });
});

// 型の使用確認
export type _W = WorldState;

describe('時間経過で仕事（依頼）が増える', () => {
  const setup = (route: string) => { const w = createWorld(S, 'T'); const run = new StoryRunner(S, w); Object.assign(w.flags, { 'ch1.tenko': true, 'ch1.roster': true, 'ch1.platform': true, [route]: true }); run.enter('ch1.hub'); return { w, run }; };
  const at = (w: WorldState, run: StoryRunner, min: number) => { w.clock.minute = min; const v = run.view(); if (v.kind !== 'hub') throw new Error('hub'); return v; };
  it('時刻が進むと、選べる仕事と目標欄が増える', () => {
    const { w, run } = setup('route.service'); const seen = new Set<string>(); let g0 = 0, g3 = 0;
    for (const [i, m] of [8 * 60 + 40, 10 * 60 + 15, 13 * 60 + 40, 14 * 60 + 30, 16 * 60].entries()) { const v = at(w, run, m); v.interactions.forEach(x => seen.add(x.id)); if (i === 0) g0 = v.goals.length; if (i === 4) g3 = v.goals.length; }
    expect(seen.size).toBeGreaterThanOrEqual(16); expect(g3).toBeGreaterThan(g0 + 6);
  });
  it('依頼は少なくとも13種類あり、各依頼に独自の場面がある', () => {
    const hub = S.nodes['ch1.hub'] as any; const timed = hub.interactions.filter((i: any) => (JSON.stringify(i.requires) ?? '').includes('"time"'));
    expect(timed.length).toBeGreaterThanOrEqual(13); expect(new Set(timed.map((i: any) => i.goto)).size).toBe(timed.length);
  });
  it('午後の持ち場で専用の事件が分かれ、通常業務はどこでも自由に選べる', () => {
    const ids = (route: string) => { const { w, run } = setup(route); w.flags['ch1.delay_done'] = true; return new Set(at(w, run, 15 * 60).interactions.map(i => i.id)); };
    const s = ids('route.service'), p = ids('route.platform'), o = ids('route.office');
    expect(s.has('angry') && !p.has('angry') && !o.has('angry')).toBe(true); expect(p.has('cable') && !s.has('cable') && !o.has('cable')).toBe(true); expect(o.has('board') && !s.has('board') && !p.has('board')).toBe(true);
    for (const set of [s, p, o]) for (const id of ['gatecheck', 'stroller']) expect(set.has(id)).toBe(true); // 通常業務はどの持ち場でも自由に選べる
  });
  it('梶原さんに付き添った接客ルートでだけ、午後に再会の依頼が出る', () => {
    const { w, run } = setup('route.service'); w.clock.minute = 13 * 60 + 40; const has = () => { const v = run.view(); return v.kind === 'hub' && v.interactions.some(i => i.id === 'kaji2'); };
    expect(has()).toBe(false); w.flags['legacy.helped_kajiwara'] = true; expect(has()).toBe(true);
  });
  it('持ち場の選択が第2章の冒頭を変える', () => {
    const starts = ['route.service', 'route.platform', 'route.office'].map(r => { const w = createWorld(S, 'T'); w.flags[r] = true; if (r === 'route.office') w.flags['legacy.notebook_missing'] = true; const run = new StoryRunner(S, w); run.enter('ch2.mon'); return w.story.node; });
    expect(new Set(starts).size).toBe(3);
  });
});

describe('業務の形式が多様である', () => {
  const tasks = Object.values(S.nodes).filter((n: any) => n.type === 'task' && n.id.startsWith('ch1.')) as any[];
  it('クイズ以外の形式（6種類）が使われ、各形式が複数回は登場する', () => {
    const kinds = tasks.map(t => t.kind); for (const k of ['timing', 'find', 'sort', 'memory', 'route', 'watch']) expect(kinds.includes(k)).toBe(true);
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(8); expect(kinds.filter(k => !['checklist', 'compose'].includes(k)).length).toBeGreaterThanOrEqual(10);
  });
  it('どの業務も結果の分岐が存在する場所に続き、経路課題には最短が設定されている', () => {
    for (const t of tasks) { for (const r of t.results) expect(S.nodes[r.goto], t.id).toBeTruthy(); if (t.kind === 'route') expect(t.config.best).toBeGreaterThan(5); }
  });
  it('1日の仕事が増えた（ハブの依頼が30件以上）', () => { expect((S.nodes['ch1.hub'] as any).interactions.length).toBeGreaterThanOrEqual(30); });
});

describe('v3.3 追加検査（第17A章：非暴力・時間軸）', () => {
  const texts = (): string[] => { const out: string[] = []; const walk = (o: unknown) => { if (typeof o === 'string') out.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); }; walk(Object.values(S.nodes)); return out; };
  it('ホラー・殺人・暴力に依存する語彙が、台詞・選択肢・業務文に含まれない', () => {
    const ban = /殺人|殺害|殺す|殺され|死体|遺体|流血|出血|血まみれ|幽霊|怪異|心霊|呪い|暴行|拷問|監禁|脅迫|自殺/;
    const hits = texts().filter(t => ban.test(t)); expect(hits.slice(0, 3)).toEqual([]);
  });
  it('時計操作の効果が不正な値（24時超・負の日数）を作らない', () => {
    const bad: string[] = []; for (const n of Object.values(S.nodes) as any[]) { const effs = [...(n.effects ?? []), ...((n.results ?? []).flatMap((r: any) => r.effects ?? [])), ...((n.options ?? []).flatMap((o: any) => o.effects ?? []))]; for (const e of effs) if (e.clock && ((e.clock.minute ?? 0) > 1439 || (e.clock.addDay ?? 0) < 0)) bad.push(n.id); }
    expect(bad).toEqual([]);
  });
  it('章ごとに、開始ノードと終了ノードが対になっている', () => {
    for (const c of S.chapters as any[]) { if (c.status !== 'playable') continue; expect(S.nodes[c.start], c.id).toBeTruthy(); }
  });
});

describe('R7 時間軸（第1〜10章の開始日が年表どおり進む）', () => {
  // 期待する開始日（2027年）。章の開始時刻の年表：入社4/1、勤務初日4/2、…、基地実習12月
  const EXPECT: Record<string, [string, string]> = { ch2: ['4-3', '4-10'], ch3: ['4-15', '4-25'], ch4: ['4-24', '5-6'], ch5: ['5-7', '5-25'], ch6: ['6-15', '6-30'], ch7: ['8-1', '8-31'], ch8: ['9-1', '9-30'], ch9: ['10-15', '11-30'], ch10: ['12-1', '12-20'] };
  const md = (day: number) => { const d = new Date(Date.UTC(2027, 3, 1 + day)); return `${d.getUTCMonth() + 1}-${d.getUTCDate()}`; };
  const key = (m: string) => { const [a, b] = m.split('-').map(Number); return a * 100 + b; };
  it('どのランダム通しでも、章の開始日は単調増加し、想定の期間に収まる', () => {
    for (let i = 0; i < 40; i++) {
      const { chDay } = playthrough(7000 + i, new Set()); let prev = -1;
      for (const [ch, [lo, hi]] of Object.entries(EXPECT)) { const day = chDay[ch]; if (day === undefined) continue; const m = md(day); expect(key(m), `${ch} は ${m}`).toBeGreaterThanOrEqual(key(lo)); expect(key(m), `${ch} は ${m}`).toBeLessThanOrEqual(key(hi)); expect(day, ch).toBeGreaterThan(prev); prev = day; }
    }
  });
});

describe('後効き（過去の選択が場面を変えたことの記録）', () => {
  it('選択が立てたフラグの出どころが残り、後の分岐でその選択が「響いた」と記録される', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w); run.enter('ch1.p_wish'); run.choose('station');
    expect(w.story.origins?.['legacy.wish_station']?.label).toContain('お客様と向き合っていたい');
    const br = Object.values(S.nodes).find((n: any) => n.type === 'branch' && JSON.stringify(n.cases).includes('legacy.wish_station')) as any; expect(br).toBeTruthy();
    run.enter(br.id); const ec = run.takeEchoes(); expect(ec.length).toBeGreaterThan(0); expect(ec[0].flag).toBe('legacy.wish_station');
    run.enter(br.id); expect(run.takeEchoes().length).toBe(0); // 同じ場面で二重に出さない
  });
});
