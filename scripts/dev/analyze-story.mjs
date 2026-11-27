// 物語データの定量分析：章ごとの構成・分岐の質（合流の速さ・読まれない選択）・台詞・業務の偏りを測る。
// 使い方: node scripts/dev/analyze-story.mjs [r7|r8] > /tmp/analysis.json
import { readFileSync } from 'node:fs';
const which = process.argv[2] ?? 'r7';
const S = JSON.parse(readFileSync(`src/data/${which}/story.json`, 'utf8')); const N = S.nodes;
const succ = n => { const o = []; const a = x => x && o.push(x); a(n.next); (n.options ?? []).forEach(x => a(x.goto)); (n.cases ?? []).forEach(x => a(x.goto)); a(n.else); (n.interactions ?? []).forEach(x => a(x.goto)); (n.timed ?? []).forEach(x => a(x.goto)); a(n.exit?.goto); (n.results ?? []).forEach(x => a(x.goto)); return o; };
const chOf = id => id.split('.')[0];
// フラグの書き込み（set）と読み取り（条件）
const sets = new Map(), reads = new Map();
const walkCond = (o, f) => { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if ((k === 'flag' || k === 'notFlag') && typeof v === 'string') f(v); else walkCond(v, f); } };
const effectsOf = n => [...(n.effects ?? []), ...(n.options ?? []).flatMap(o => o.effects ?? []), ...(n.results ?? []).flatMap(r => r.effects ?? [])];
for (const [id, n] of Object.entries(N)) {
  for (const e of effectsOf(n)) if (e.set) (sets.get(e.set) ?? sets.set(e.set, new Set()).get(e.set)).add(id);
  walkCond({ c: n.cases, r: n.requires, s: n.showWhen, x: n.exit, i: n.interactions, o: (n.options ?? []).map(o => o.requires), g: n.goals }, f => (reads.get(f) ?? reads.set(f, new Set()).get(f)).add(id));
}
// 選択後の「合流」までの距離：全選択肢から到達できる最初のノード
const bfs = (start, limit = 60) => { const d = new Map([[start, 0]]); const q = [start]; while (q.length) { const x = q.shift(); const dx = d.get(x); if (dx >= limit) continue; for (const y of succ(N[x] ?? {})) if (!d.has(y) && N[y]) { d.set(y, dx + 1); q.push(y); } } return d; };
const chapters = {};
const ensure = ch => (chapters[ch] ??= { nodes: 0, lines: 0, chars: 0, long60: 0, narr: 0, player: 0, byType: {}, tasks: {}, choices: 0, important: 0, timed: 0, options: 0, deadOptions: 0, evalOnlyOptions: 0, relOptions: 0, branchNodes: 0, hubs: 0, merge: [], v3: 0, v25: 0, speakers: {}, taskSeq: [], bgs: {} });
for (const [id, n] of Object.entries(N)) {
  const c = ensure(chOf(id)); c.nodes++; c.byType[n.type] = (c.byType[n.type] ?? 0) + 1;
  if (n.type === 'line') for (const l of n.lines) { c.lines++; c.chars += l.text.length; if (l.text.length > 60) c.long60++; if (l.narration) c.narr++; if (l.who === 'player') c.player++; const w = l.who ?? '（地の文）'; c.speakers[w] = (c.speakers[w] ?? 0) + 1; }
  if (n.type === 'task') { c.tasks[n.kind] = (c.tasks[n.kind] ?? 0) + 1; c.taskSeq.push(n.kind); }
  if (n.type === 'branch') c.branchNodes++; if (n.type === 'hub') c.hubs++;
  if (n.view?.mode === '3d') c.v3++; if (n.view?.mode === '25d') { c.v25++; c.bgs[n.view.bg ?? '-'] = (c.bgs[n.view.bg ?? '-'] ?? 0) + 1; }
  if (n.type === 'choice') {
    c.choices++; if (n.important) c.important++; if (n.timeLimit) c.timed++;
    const ds = n.options.map(o => bfs(o.goto)); const common = [...ds[0].keys()].filter(k => ds.every(d => d.has(k))); let best = null;
    for (const k of common) { const m = Math.max(...ds.map(d => d.get(k))); if (best === null || m < best) best = m; } c.merge.push({ id, opts: n.options.length, important: !!n.important, mergeDist: best });
    for (const o of n.options) {
      c.options++; const fs = (o.effects ?? []).map(e => e.set).filter(Boolean); const hasRead = fs.some(f => reads.has(f)); const hasRel = (o.effects ?? []).some(e => e.rel && Math.abs(e.rel.trust) + Math.abs(e.rel.rapport) >= 2);
      if (!hasRead && !hasRel) c.deadOptions++; if ((o.effects ?? []).every(e => e.eval || e.log || e.timeline || e.skill || e.training || e.time)) c.evalOnlyOptions++; if ((o.effects ?? []).some(e => e.rel)) c.relOptions++;
    }
  }
}
const med = a => { const s = a.filter(x => x !== null).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
const out = { story: which, title: S.title, totalNodes: Object.keys(N).length, chapters: {}, flags: { set: sets.size, readSomewhere: [...sets.keys()].filter(f => reads.has(f)).length, neverRead: [...sets.keys()].filter(f => !reads.has(f)).length } };
for (const [ch, c] of Object.entries(chapters)) {
  if (!/^ch\d+$/.test(ch)) continue; const md = c.merge.map(m => m.mergeDist);
  const consec = c.taskSeq.filter((k, i) => i && k === c.taskSeq[i - 1]).length;
  out.chapters[ch] = { nodes: c.nodes, lines: c.lines, avgLen: c.lines ? Math.round(c.chars / c.lines) : 0, long60: c.long60, narrationShare: c.lines ? +(c.narr / c.lines).toFixed(2) : 0, playerLines: c.player, hubs: c.hubs, choices: c.choices, important: c.important, timedChoices: c.timed, options: c.options, deadOptions: c.deadOptions, deadShare: c.options ? +(c.deadOptions / c.options).toFixed(2) : 0, evalOnlyOptions: c.evalOnlyOptions, relOptions: c.relOptions, branchNodes: c.branchNodes, mergeDistMedian: med(md), mergeWithin3: md.filter(x => x !== null && x <= 3).length, noMergeFound: md.filter(x => x === null).length, tasks: c.tasks, sameKindInARow: consec, view3d: c.v3, view2d: c.v25, bgs: c.bgs, topSpeakers: Object.entries(c.speakers).sort((a, b) => b[1] - a[1]).slice(0, 4) };
}
if (process.argv[3] === 'choices') {
  for (const ch of Object.keys(out.chapters)) {
    const cs = Object.values(N).filter(n => n.type === 'choice' && n.important && n.id.startsWith(ch + '.')); console.log(`\n■ ${ch} ${S.chapters.find(c => c.id === ch)?.title ?? ''}`);
    for (const c of cs.slice(0, 4)) { console.log(` ・${c.prompt.replace(/[{}]/g, '').slice(0, 40)}${c.timeLimit ? ' [時限]' : ''}`); for (const o of c.options) console.log(`    - ${o.label.replace(/[{}]/g, '').slice(0, 34)} ｜ ${(o.effects ?? []).map(e => Object.keys(e)[0] + (e.rel ? ':' + e.rel.char + (e.rel.trust || 0) : '')).join(',')}`); }
  }
} else console.log(JSON.stringify(out, null, 1));
