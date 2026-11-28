import type { Cond, Op, WorldState } from './types';

export function cmp(a: number, op: Op, b: number): boolean {
  switch (op) { case '>=': return a >= b; case '<=': return a <= b; case '>': return a > b; case '<': return a < b; case '==': return a === b; case '!=': return a !== b; }
}

export function evalCond(c: Cond | undefined, w: WorldState): boolean {
  if (!c) return true;
  if ('flag' in c) return !!w.flags[c.flag];
  if ('notFlag' in c) return !w.flags[c.notFlag];
  if ('rel' in c) { const r = w.relationships[c.rel.char]; return cmp(r ? r[c.rel.key] : 0, c.rel.op, c.rel.val); }
  if ('eval' in c) return cmp(w.career.evaluations[c.eval.key as keyof typeof w.career.evaluations] ?? 0, c.eval.op, c.eval.val);
  if ('skill' in c) return cmp(w.career.skills[c.skill.key] ?? 0, c.skill.op, c.skill.val);
  if ('var' in c) return cmp(w.vars[c.var.key] ?? 0, c.var.op, c.var.val);
  if ('dept' in c) { const a = w.career.assignments[w.career.assignments.length - 1]; return !!a && a.dept === c.dept; }
  if ('cert' in c) return w.career.certifications.some(x => x.id === c.cert);
  if ('time' in c) return cmp(w.clock.minute, c.time.op, c.time.val);
  if ('visited' in c) return w.story.visited.includes(c.visited);
  if ('notVisited' in c) return !w.story.visited.includes(c.notVisited);
  if ('chose' in c) return w.story.choices.some(x => x.node === c.chose.node && x.option === c.chose.option);
  if ('done' in c) return w.story.done.includes(c.done);
  if ('nodePrefix' in c) return w.story.node.startsWith(c.nodePrefix);
  if ('gone' in c) return !!w.flags['gone.' + c.gone];
  if ('locked' in c) return !!w.flags['locked.' + c.locked];
  if ('all' in c) return c.all.every(x => evalCond(x, w));
  if ('any' in c) return c.any.some(x => evalCond(x, w));
  if ('not' in c) return !evalCond(c.not, w);
  return false;
}

/** 条件から参照されるフラグ等を収集（静的解析用） */
export function condRefs(c: Cond | undefined, out: { flags: Set<string>; chars: Set<string>; nodes: Set<string>; dones: Set<string> } = { flags: new Set(), chars: new Set(), nodes: new Set(), dones: new Set() }) {
  if (!c) return out;
  if ('flag' in c) out.flags.add(c.flag);
  else if ('notFlag' in c) out.flags.add(c.notFlag);
  else if ('rel' in c) out.chars.add(c.rel.char);
  else if ('visited' in c) out.nodes.add(c.visited);
  else if ('notVisited' in c) out.nodes.add(c.notVisited);
  else if ('chose' in c) out.nodes.add(c.chose.node);
  else if ('done' in c) out.dones.add(c.done);
  else if ('all' in c) c.all.forEach(x => condRefs(x, out));
  else if ('any' in c) c.any.forEach(x => condRefs(x, out));
  else if ('not' in c) condRefs(c.not, out);
  return out;
}
