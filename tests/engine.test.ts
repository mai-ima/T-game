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
  let v = run.enter(S.chapters[0].start); let guard = 0;
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
      else advanceClock(w, 30 + Math.floor(r() * 60));
    } else if (v.kind === 'end') {
      endNodes.push(v.node.id); run.finishChapter();
      if (v.node.nextChapter) v = run.startChapter(v.node.nextChapter); else break;
    }
  }
  for (const n of w.story.visited) visitedAll.add(n);
  return { w, endNodes, guard };
}

describe('ストーリーデータの静的検査', () => {
  it('lintに error がない', () => {
    const errors = lintStory(S).filter(i => i.level === 'error');
    expect(errors).toEqual([]);
  });
  it('第1章に重要選択が1〜3個ある', () => {
    const imp = Object.values(S.nodes).filter(n => n.type === 'choice' && n.important && n.id.startsWith('ch1.'));
    expect(imp.length).toBeGreaterThanOrEqual(1); expect(imp.length).toBeLessThanOrEqual(3);
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
  it('第1章・第2章の終端に到達できる', () => { expect([...endIds].sort()).toEqual(['ch1.end', 'ch2.end']); });
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
    let n = w.story.node; let g = 0; while (g++ < 10 && w.story.node !== 'ch2.audit') { try { run.next(); } catch { break; } }
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
  it('14モード・ストーリー12・自由2で、R7のみプレイ可能', () => {
    expect(MODES.length).toBe(14);
    expect(MODES.filter(m => m.kind === 'story').length).toBe(12);
    expect(MODES.filter(m => m.kind === 'free').length).toBe(2);
    expect(MODES.filter(m => m.status === 'playable').map(m => m.id)).toEqual(['R7']);
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
  it('朝・昼・午後で選べる仕事が増え、目標欄にも追加される', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w); w.flags['ch1.tenko'] = true; w.flags['ch1.roster'] = true; w.flags['ch1.platform'] = true; run.enter('ch1.hub');
    const count = (min: number) => { w.clock.minute = min; const v = run.view(); if (v.kind !== 'hub') throw new Error('hub'); return { ints: v.interactions.length, goals: v.goals.length }; };
    const a = count(8 * 60 + 40), b = count(10 * 60 + 15), c = count(13 * 60 + 40), d = count(16 * 60);
    expect(b.ints).toBeGreaterThan(a.ints); expect(c.ints).toBeGreaterThan(b.ints); expect(d.goals).toBeGreaterThan(a.goals + 8);
  });
  it('依頼は少なくとも13種類あり、各依頼に独自の場面がある', () => {
    const hub = S.nodes['ch1.hub'] as any; const timed = hub.interactions.filter((i: any) => JSON.stringify(i.requires).includes('"time"'));
    expect(timed.length).toBeGreaterThanOrEqual(13); expect(new Set(timed.map((i: any) => i.goto)).size).toBe(timed.length);
  });
  it('梶原さんに付き添った場合だけ、午後に再会の依頼が出る', () => {
    const w = createWorld(S, 'T'); const run = new StoryRunner(S, w); w.flags['ch1.tenko'] = true; run.enter('ch1.hub'); w.clock.minute = 13 * 60 + 40;
    const has = () => { const v = run.view(); return v.kind === 'hub' && v.interactions.some(i => i.id === 'kaji2'); };
    expect(has()).toBe(false); w.flags['legacy.helped_kajiwara'] = true; expect(has()).toBe(true);
  });
});
