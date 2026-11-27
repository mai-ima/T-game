// 物語の質のゲート（Detroit級の分岐に向けた「測れる基準」）。
// 現状の数値を「悪化させない上限」として固定し、改善のたびに上限を引き下げていく（ラチェット方式）。
import { describe, it, expect } from 'vitest';
import r7 from '../src/data/r7/story.json';
import r8 from '../src/data/r8/story.json';
import type { StoryData } from '../src/engine/types';

type Any = any;
function succ(n: Any): string[] { const o: string[] = []; const a = (x?: string) => { if (x) o.push(x); }; a(n.next); (n.options ?? []).forEach((x: Any) => a(x.goto)); (n.cases ?? []).forEach((x: Any) => a(x.goto)); a(n.else); (n.interactions ?? []).forEach((x: Any) => a(x.goto)); (n.timed ?? []).forEach((x: Any) => a(x.goto)); a(n.exit?.goto); (n.results ?? []).forEach((x: Any) => a(x.goto)); return o; }
function walkCond(o: Any, f: (flag: string) => void) { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if ((k === 'flag' || k === 'notFlag') && typeof v === 'string') f(v); else walkCond(v, f); } }

export function measure(S: StoryData) {
  const N = S.nodes as Record<string, Any>; const sets = new Map<string, number>(); const reads = new Set<string>();
  for (const n of Object.values(N)) {
    const effs = [...(n.effects ?? []), ...(n.options ?? []).flatMap((o: Any) => o.effects ?? []), ...(n.results ?? []).flatMap((r: Any) => r.effects ?? [])];
    for (const e of effs) if (e.set) sets.set(e.set, (sets.get(e.set) ?? 0) + 1);
    walkCond({ c: n.cases, r: n.requires, s: n.showWhen, x: n.exit, i: n.interactions, o: (n.options ?? []).map((o: Any) => o.requires), g: n.goals }, f => reads.add(f));
  }
  const bfs = (start: string, limit = 60) => { const d = new Map<string, number>([[start, 0]]); const q = [start]; while (q.length) { const x = q.shift()!; const dx = d.get(x)!; if (dx >= limit) continue; for (const y of succ(N[x] ?? {})) if (!d.has(y) && N[y]) { d.set(y, dx + 1); q.push(y); } } return d; };
  let important = 0, options = 0, dead = 0, quickMerge = 0, timed = 0; const dists: number[] = [];
  for (const n of Object.values(N)) {
    if (n.type !== 'choice') continue;
    if (n.timeLimit) timed++; if (!n.important) continue; important++;
    const ds = n.options.map((o: Any) => bfs(o.goto)); let best: number | null = null;
    for (const k of ds[0].keys()) { if (!ds.every((d: Map<string, number>) => d.has(k))) continue; const m = Math.max(...ds.map((d: Map<string, number>) => d.get(k)!)); if (best === null || m < best) best = m; }
    if (best !== null) { dists.push(best); if (best <= 3) quickMerge++; }
    for (const o of n.options) { options++; const fs = (o.effects ?? []).map((e: Any) => e.set).filter(Boolean) as string[]; const rel = (o.effects ?? []).some((e: Any) => e.rel && Math.abs(e.rel.trust) + Math.abs(e.rel.rapport) >= 2); if (!fs.some(f => reads.has(f)) && !rel) dead++; }
  }
  const neverRead = [...sets.keys()].filter(f => !reads.has(f)).length;
  return { important, options, dead, deadShare: options ? dead / options : 0, quickMerge, quickMergeShare: important ? quickMerge / important : 0, timed, neverRead, setFlags: sets.size, neverReadShare: sets.size ? neverRead / sets.size : 0 };
}

// ラチェット：現状の値。改善したら、この数値を必ず下げる（上げてはならない）。
const CEILING = { R7: { deadShare: 0.34, quickMergeShare: 0.82, neverReadShare: 0.55 }, R8: { deadShare: 0.56, quickMergeShare: 1.0, neverReadShare: 0.60 } } as const;
// 目標（Detroit級に向けた到達基準）。まだ満たしていない。満たしたら CEILING をここまで引き下げる。
export const TARGET = { deadShare: 0.1, quickMergeShare: 0.25, neverReadShare: 0.15, timedMin: 12 };

describe('物語の質ゲート（悪化させない）', () => {
  for (const [name, S] of [['R7', r7], ['R8', r8]] as const) {
    it(`${name}：読まれない選択肢の比率が上限以下`, () => { const m = measure(S as unknown as StoryData); expect(m.deadShare).toBeLessThanOrEqual(CEILING[name].deadShare + 0.005); });
    it(`${name}：選択後すぐ（3歩以内）合流する重要選択の比率が上限以下`, () => { const m = measure(S as unknown as StoryData); expect(m.quickMergeShare).toBeLessThanOrEqual(CEILING[name].quickMergeShare + 0.005); });
    it(`${name}：どこからも読まれないフラグの比率が上限以下`, () => { const m = measure(S as unknown as StoryData); expect(m.neverReadShare).toBeLessThanOrEqual(CEILING[name].neverReadShare + 0.005); });
  }
  it('現状値と目標値を記録する（情報）', () => { const m = measure(r7 as unknown as StoryData); const m8 = measure(r8 as unknown as StoryData); console.log('R7 品質指標', JSON.stringify(m), 'R8', JSON.stringify(m8), '目標', JSON.stringify(TARGET)); expect(m.important).toBeGreaterThan(0); });
});
