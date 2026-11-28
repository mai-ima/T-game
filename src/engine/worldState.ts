import type { CareerState, Effect, EvalKey, ModeId, Relationship, WorldState, StoryData } from './types';
import { createCareer } from './career';

export const SCHEMA = 1;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function createWorld(story: StoryData, playerName: string, mode: ModeId = story.mode): WorldState {
  const first = story.chapters[0];
  return {
    schema: SCHEMA, mode, storyId: story.storyId, clock: { day: 0, minute: 13 * 60 },
    playerName, flags: {}, vars: {}, relationships: {},
    career: createCareer(),
    story: { chapter: first.id, node: first.start, visited: [], choices: [], once: [], done: [], endings: [], completedChapters: [], chapterResults: {}, trail: [] },
    log: [], timeline: [], playtimeSec: 0
  };
}

export function ensureRel(w: WorldState, id: string): Relationship {
  return (w.relationships[id] ??= { trust: 0, rapport: 0, met: false, notes: [] });
}

export function advanceClock(w: WorldState, minutes: number) {
  let m = w.clock.minute + minutes;
  while (m >= 1440) { m -= 1440; w.clock.day++; }
  w.clock.minute = m;
}

export function fmtTime(min: number) { return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }
export function parseTime(s: string) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

export function gameDate(startYear: number, day: number) {
  const d = new Date(Date.UTC(startYear, 3, 1 + day));
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getUTCDay()];
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd, label: `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${wd}）` };
}

export function applyEffect(w: WorldState, e: Effect, nodeId?: string) {
  if ('set' in e) w.flags[e.set] = true;
  else if ('unset' in e) delete w.flags[e.unset];
  else if ('var' in e) { const cur = w.vars[e.var.key] ?? 0; w.vars[e.var.key] = e.var.set !== undefined ? e.var.set : cur + (e.var.add ?? 0); }
  else if ('rel' in e) {
    const r = ensureRel(w, e.rel.char); r.met = true;
    r.trust = clamp(r.trust + (e.rel.trust ?? 0), -5, 10);
    r.rapport = clamp(r.rapport + (e.rel.rapport ?? 0), 0, 10);
    if (e.rel.note) r.notes.push(e.rel.note);
  }
  else if ('eval' in e) w.career.evaluations[e.eval.key] = clamp((w.career.evaluations[e.eval.key] ?? 50) + e.eval.add, 0, 100);
  else if ('skill' in e) w.career.skills[e.skill.key] = clamp((w.career.skills[e.skill.key] ?? 0) + e.skill.add, 0, 100);
  else if ('cert' in e) { if (!w.career.certifications.some(c => c.id === e.cert)) w.career.certifications.push({ id: e.cert, day: w.clock.day }); }
  else if ('training' in e) { const t = (w.career.trainings[e.training.id] ??= { progress: 0, done: false }); t.progress = clamp(t.progress + e.training.progress, 0, 100); t.done = t.progress >= 100; }
  else if ('assign' in e) {
    const cur = w.career.assignments[w.career.assignments.length - 1];
    if (cur) cur.toDay = w.clock.day;
    w.career.assignments.push({ dept: e.assign.dept, role: e.assign.role, site: e.assign.site, fromDay: w.clock.day });
  }
  else if ('apply' in e) w.career.applications.push({ dept: e.apply.dept, status: 'submitted', day: w.clock.day, note: e.apply.note });
  else if ('time' in e) advanceClock(w, e.time);
  else if ('clock' in e) { if (e.clock.addDay) w.clock.day += e.clock.addDay; if (e.clock.minute !== undefined) w.clock.minute = e.clock.minute; }
  else if ('log' in e) w.log.push({ day: w.clock.day, minute: w.clock.minute, text: e.log.text, tag: e.log.tag, node: nodeId });
  else if ('timeline' in e) w.timeline.push({ day: w.clock.day, minute: w.clock.minute, text: e.timeline.text, tag: e.timeline.tag, node: nodeId });
  else if ('done' in e) { if (!w.story.done.includes(e.done)) w.story.done.push(e.done); }
  else if ('depart' in e) { w.flags['gone.' + e.depart.char] = true; w.timeline.push({ day: w.clock.day, minute: w.clock.minute, text: e.depart.note ?? `${e.depart.char} が職場を去った`, tag: 'depart', node: nodeId }); }
  else if ('lock' in e) { w.flags['locked.' + e.lock.id] = true; if (e.lock.note) w.timeline.push({ day: w.clock.day, minute: w.clock.minute, text: e.lock.note, tag: 'lock', node: nodeId }); }
  else if ('ending' in e) { if (!w.story.endings.includes(e.ending)) w.story.endings.push(e.ending); }
}

export function applyEffects(w: WorldState, es: Effect[] | undefined, nodeId?: string) { es?.forEach(e => applyEffect(w, e, nodeId)); }

export const EVAL_LABEL: Record<EvalKey, string> = { service: '接客対応', accuracy: '正確性', reporting: '報連相', teamwork: '協調性', safety: '安全意識' };

export function overallRating(c: CareerState): { score: number; rating: string } {
  const e = c.evaluations; const score = (e.service + e.accuracy * 1.2 + e.reporting * 1.1 + e.teamwork + e.safety * 1.2) / 5.5;
  const rating = score >= 66 ? 'A' : score >= 56 ? 'B' : score >= 46 ? 'C' : 'D';
  return { score: Math.round(score * 10) / 10, rating };
}

export function snapshotRel(w: WorldState) {
  const o: Record<string, { trust: number; rapport: number }> = {};
  for (const [k, v] of Object.entries(w.relationships)) o[k] = { trust: v.trust, rapport: v.rapport };
  return o;
}
