import type { StoryData, StoryNode, Cond } from './types';
import { condRefs } from './conditions';

export interface LintIssue { level: 'error' | 'warn'; node?: string; msg: string }

export function successors(n: StoryNode): string[] {
  switch (n.type) {
    case 'line': case 'effect': return [n.next];
    case 'choice': return n.options.map(o => o.goto);
    case 'branch': return [...n.cases.map(c => c.goto), n.else];
    case 'hub': return [...n.interactions.map(i => i.goto), ...(n.timed ?? []).map(t => t.goto), n.exit.goto];
    case 'task': return [...n.results.map(r => r.goto), ...(n.next ? [n.next] : [])];
    case 'end': return n.nextChapter ? [] : [];
  }
}

/** ストーリーデータの静的検査：未定義遷移・到達不能ノード・未設定フラグ・人物ID・選択肢の欠落 */
export function lintStory(s: StoryData): LintIssue[] {
  const out: LintIssue[] = []; const ids = new Set(Object.keys(s.nodes));
  const setFlags = new Set<string>();
  for (const n of Object.values(s.nodes)) {
    const walk = (es?: any[]) => es?.forEach(e => { if ('set' in e) setFlags.add(e.set); });
    walk(n.effects);
    if (n.type === 'choice') n.options.forEach(o => walk(o.effects));
    if (n.type === 'task') n.results.forEach(r => walk(r.effects));
  }
  for (const [id, n] of Object.entries(s.nodes)) {
    if (n.id !== id) out.push({ level: 'error', node: id, msg: `idとキーが不一致 (${n.id})` });
    for (const t of successors(n)) if (!ids.has(t)) out.push({ level: 'error', node: id, msg: `未定義の遷移先: ${t}` });
    const conds: (Cond | undefined)[] = [];
    if (n.type === 'choice') n.options.forEach(o => conds.push(o.requires));
    if (n.type === 'branch') n.cases.forEach(c => conds.push(c.when));
    if (n.type === 'hub') { n.interactions.forEach(i => { conds.push(i.requires, i.hideWhen); }); n.goals.forEach(g => conds.push(g.when, g.showWhen)); conds.push(n.exit.requires); n.timed?.forEach(t => conds.push(t.when)); }
    for (const c of conds) { const r = condRefs(c); r.flags.forEach(f => { if (!setFlags.has(f)) out.push({ level: 'error', node: id, msg: `どこでも設定されないフラグを参照: ${f}` }); }); r.chars.forEach(ch => { if (!s.characters[ch]) out.push({ level: 'error', node: id, msg: `未定義の人物: ${ch}` }); }); r.nodes.forEach(x => { if (!ids.has(x)) out.push({ level: 'error', node: id, msg: `未定義ノードを参照: ${x}` }); }); }
    if (n.type === 'line') n.lines.forEach(l => { if (l.who && l.who !== 'player' && !s.characters[l.who]) out.push({ level: 'error', node: id, msg: `未定義の話者: ${l.who}` }); if (!l.text.trim()) out.push({ level: 'error', node: id, msg: '空の台詞' }); });
    if (n.type === 'choice' && n.options.length < 2) out.push({ level: 'warn', node: id, msg: '選択肢が2未満' });
    if (n.type === 'choice' && n.timeLimit && !n.defaultOption) out.push({ level: 'error', node: id, msg: 'timeLimit指定にdefaultOptionがない' });
  }
  // 到達性
  const seen = new Set<string>(); const stack = s.chapters.filter(c => c.status !== 'planned').map(c => c.start);
  while (stack.length) { const id = stack.pop()!; if (seen.has(id) || !s.nodes[id]) continue; seen.add(id); successors(s.nodes[id]).forEach(x => stack.push(x)); }
  for (const id of ids) if (!seen.has(id)) out.push({ level: 'error', node: id, msg: '開始ノードから到達できないノード' });
  return out;
}

/** 全分岐探索：選択肢と時刻イベントを列挙し、到達可能な終端ノードと状態バリエーションを調べる（テスト用） */
export function enumerateEndings(): never { throw new Error('tests側で実装'); }
