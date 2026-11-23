import type { ChoiceNode, HubNode, StoryData, StoryNode, TaskNode, WorldState, ChapterResult } from './types';
import { evalCond } from './conditions';
import { applyEffects, snapshotRel, overallRating } from './worldState';

export type RunnerView =
  | { kind: 'line'; node: Extract<StoryNode, { type: 'line' }> }
  | { kind: 'choice'; node: ChoiceNode; options: ChoiceNode['options'] }
  | { kind: 'hub'; node: HubNode; interactions: HubNode['interactions']; goals: { id: string; label: string; done: boolean; optional?: boolean }[]; canExit: boolean }
  | { kind: 'task'; node: TaskNode }
  | { kind: 'end'; node: Extract<StoryNode, { type: 'end' }> };

/** データ駆動ストーリーランナー。UI・描画に依存しない純粋ロジック（全14モードで共通利用）。 */
export class StoryRunner {
  private snapshotAtChapterStart?: Record<string, { trust: number; rapport: number }>;
  constructor(public story: StoryData, public world: WorldState) {}

  node(): StoryNode { const n = this.story.nodes[this.world.story.node]; if (!n) throw new Error(`未定義ノード: ${this.world.story.node}`); return n; }

  /** ノード進入：自動ノード（branch/effect）は解決し、停止ノードで止まる */
  enter(id: string, guard = 0): RunnerView {
    if (guard > 64) throw new Error('ノード遷移が循環しています: ' + id);
    const w = this.world; const n = this.story.nodes[id];
    if (!n) throw new Error(`未定義ノード: ${id}`);
    w.story.node = id;
    const first = !w.story.visited.includes(id);
    if (first) w.story.visited.push(id);
    w.story.trail.push(id); if (w.story.trail.length > 400) w.story.trail.shift();
    if (n.id === this.story.chapters.find(c => c.id === w.story.chapter)?.start && !this.snapshotAtChapterStart) this.snapshotAtChapterStart = snapshotRel(w);
    // effects：ハブは初回のみ、その他は進入のたびに適用
    if (n.type !== 'hub' || first) applyEffects(w, n.effects, id);
    switch (n.type) {
      case 'branch': { for (const c of n.cases) if (evalCond(c.when, w)) return this.enter(c.goto, guard + 1); return this.enter(n.else, guard + 1); }
      case 'effect': return this.enter(n.next, guard + 1);
      case 'hub': return this.view();
      default: return this.view();
    }
  }

  view(): RunnerView {
    const w = this.world; const n = this.node();
    switch (n.type) {
      case 'line': return { kind: 'line', node: n };
      case 'choice': return { kind: 'choice', node: n, options: n.options.filter(o => evalCond(o.requires, w)) };
      case 'hub': {
        const interactions = n.interactions.filter(i => evalCond(i.requires, w) && !(i.hideWhen && evalCond(i.hideWhen, w)) && !(i.once && w.story.once.includes(n.id + '/' + i.id)));
        const goals = n.goals.filter(g => !g.showWhen || evalCond(g.showWhen, w)).map(g => ({ id: g.id, label: g.label, done: evalCond(g.when, w), optional: g.optional }));
        return { kind: 'hub', node: n, interactions, goals, canExit: evalCond(n.exit.requires, w) };
      }
      case 'task': return { kind: 'task', node: n };
      case 'end': return { kind: 'end', node: n };
      default: throw new Error('自動ノードはviewできません: ' + n.type);
    }
  }

  next(): RunnerView { const n = this.node(); if (n.type !== 'line') throw new Error('lineノードではありません'); return this.enter(n.next); }

  choose(optionId: string, timedOut = false): RunnerView {
    const n = this.node(); if (n.type !== 'choice') throw new Error('choiceノードではありません');
    const opt = n.options.find(o => o.id === optionId); if (!opt) throw new Error('不明な選択肢: ' + optionId);
    this.world.story.choices.push({ node: n.id, option: opt.id, day: this.world.clock.day, minute: this.world.clock.minute, timedOut });
    this.world.log.push({ day: this.world.clock.day, minute: this.world.clock.minute, text: `選択：${opt.label}`, tag: 'choice', node: n.id });
    applyEffects(this.world, opt.effects, n.id);
    return this.enter(opt.goto);
  }

  interact(interactionId: string): RunnerView {
    const n = this.node(); if (n.type !== 'hub') throw new Error('hubノードではありません');
    const it = n.interactions.find(i => i.id === interactionId); if (!it) throw new Error('不明な相互作用: ' + interactionId);
    if (it.once) this.world.story.once.push(n.id + '/' + it.id);
    if (it.minutes) applyEffects(this.world, [{ time: it.minutes }], n.id);
    this.hubReturn = n.id;
    return this.enter(it.goto);
  }
  hubReturn?: string;

  /** ハブの時刻イベントを確認。該当すれば遷移。 */
  checkTimed(): RunnerView | null {
    const n = this.node(); if (n.type !== 'hub') return null;
    for (const t of n.timed ?? []) {
      const key = n.id + '/timed/' + t.id;
      if (this.world.story.once.includes(key)) continue;
      if (this.world.clock.minute >= t.at && evalCond(t.when, this.world)) { this.world.story.once.push(key); this.hubReturn = n.id; return this.enter(t.goto); }
    }
    return null;
  }

  exitHub(): RunnerView {
    const n = this.node(); if (n.type !== 'hub') throw new Error('hubノードではありません');
    if (!evalCond(n.exit.requires, this.world)) throw new Error('まだ退出できません');
    return this.enter(n.exit.goto);
  }

  resolveTask(score: number): RunnerView {
    const n = this.node(); if (n.type !== 'task') throw new Error('taskノードではありません');
    const sorted = [...n.results].sort((a, b) => b.min - a.min);
    const r = sorted.find(x => score >= x.min) ?? sorted[sorted.length - 1];
    this.world.vars[`task.${n.id}`] = score;
    applyEffects(this.world, r.effects, n.id);
    return this.enter(r.goto);
  }

  /** 章末処理：評価・フラグ・人物関係の変化を結果として保存し、次章に引き継ぐ。 */
  finishChapter(): ChapterResult {
    const w = this.world; const n = this.node(); if (n.type !== 'end') throw new Error('endノードではありません');
    const { rating } = overallRating(w.career);
    const before = this.snapshotAtChapterStart ?? {};
    const rel: ChapterResult['relDelta'] = {};
    for (const [k, v] of Object.entries(w.relationships)) { const b = before[k] ?? { trust: 0, rapport: 0 }; rel[k] = { trust: v.trust - b.trust, rapport: v.rapport - b.rapport }; }
    const res: ChapterResult = { chapter: n.chapter, rating, scores: { ...w.career.evaluations }, flags: Object.keys(w.flags).filter(f => f.startsWith(n.chapter + '.') || f.startsWith('legacy.')), relDelta: rel, nextVariants: Object.keys(w.flags).filter(f => f.startsWith('next.')) };
    w.story.chapterResults[n.chapter] = res;
    if (!w.story.completedChapters.includes(n.chapter)) w.story.completedChapters.push(n.chapter);
    w.career.evalHistory.push({ chapter: n.chapter, scores: { ...w.career.evaluations }, rating, day: w.clock.day });
    this.snapshotAtChapterStart = undefined;
    return res;
  }

  startChapter(chapterId: string): RunnerView {
    const c = this.story.chapters.find(x => x.id === chapterId); if (!c) throw new Error('不明な章: ' + chapterId);
    this.world.story.chapter = chapterId; this.snapshotAtChapterStart = snapshotRel(this.world);
    return this.enter(c.start);
  }
}
