import type { CareerState, EvalKey } from './types';
import departments from '../data/departments.json';

export type DeptDef = {
  name: string; short: string; system: string; desc: string; demand: number; sites: string[];
  requirements: { minMonths: number; certs: string[]; training: string[]; minEval: Partial<Record<EvalKey, number>> };
};
export const DEPARTMENTS = departments as unknown as Record<string, DeptDef>;

export function createCareer(): CareerState {
  return {
    employeeNo: 'A27-0412', joinDay: 0, grade: 1, track: '総合職（現業系）',
    assignments: [], certifications: [], trainings: {},
    evaluations: { service: 50, accuracy: 50, reporting: 50, teamwork: 50, safety: 50 },
    evalHistory: [], applications: [], skills: {}, workLog: []
  };
}

export const monthsOfService = (c: CareerState, today: number) => Math.floor((today - c.joinDay) / 30);

export interface Eligibility { eligible: boolean; gaps: string[]; met: string[] }
/** 部署異動の資格・実績・研修・在籍期間の充足状況（架空の人事規程）。 */
export function transferEligibility(c: CareerState, deptId: string, today: number): Eligibility {
  const d = DEPARTMENTS[deptId]; const gaps: string[] = []; const met: string[] = [];
  if (!d) return { eligible: false, gaps: ['不明な部署'], met };
  const r = d.requirements;
  const mo = monthsOfService(c, today);
  (mo >= r.minMonths ? met : gaps).push(`在籍${r.minMonths}か月以上（現在${mo}か月）`);
  for (const id of r.certs) (c.certifications.some(x => x.id === id) ? met : gaps).push(`資格：${CERT_NAME[id] ?? id}`);
  for (const id of r.training) (c.trainings[id]?.done ? met : gaps).push(`研修：${TRAIN_NAME[id] ?? id}`);
  for (const [k, v] of Object.entries(r.minEval)) {
    const cur = c.evaluations[k as EvalKey] ?? 0;
    (cur >= (v as number) ? met : gaps).push(`評価${EVAL_NAME[k as EvalKey]}${v}以上（現在${Math.round(cur)}）`);
  }
  return { eligible: gaps.length === 0, gaps, met };
}

export const CERT_NAME: Record<string, string> = { station_basic: '駅務基礎修了', crew_candidate: '乗務員養成候補', depot_assist: '検修作業補助' };
export const TRAIN_NAME: Record<string, string> = { new_hire: '新入社員研修', station_basic: '駅務基礎実習', depot_intro: '車両基地入門', crew_selection: '乗務員適性・選考' };
export const EVAL_NAME: Record<EvalKey, string> = { service: '接客対応', accuracy: '正確性', reporting: '報連相', teamwork: '協調性', safety: '安全意識' };

export type TransferDecision = 'approved' | 'deferred' | 'rejected';
/** 希望が必ずしも通らない仕組み：資格・必要人数・現部署の育成方針を勘案。 */
export function decideTransfer(c: CareerState, deptId: string, today: number, opts: { currentDeptShortage?: boolean; mentorSupport?: boolean } = {}): { decision: TransferDecision; reason: string } {
  const e = transferEligibility(c, deptId, today);
  const d = DEPARTMENTS[deptId];
  if (!e.eligible) return { decision: 'rejected', reason: `要件未達：${e.gaps.join('／')}` };
  if (opts.currentDeptShortage && !opts.mentorSupport) return { decision: 'deferred', reason: '現部署の要員事情により次回面談まで保留' };
  if (d.demand <= 0) return { decision: 'deferred', reason: '受入部署の枠がないため保留' };
  return { decision: 'approved', reason: '要件を満たし、受入部署の枠もあるため承認' };
}

// ---- 勤務表 ----
export type Shift = '日勤' | '早番' | '遅番' | '宿直' | '明け' | '公休' | '有休' | '研修';
export const SHIFT_TIME: Record<Shift, [number, number] | null> = {
  '日勤': [8 * 60 + 30, 17 * 60 + 15], '早番': [5 * 60 + 30, 14 * 60 + 15], '遅番': [12 * 60 + 30, 21 * 60 + 15],
  '宿直': [16 * 60, 24 * 60 + 9 * 60], '明け': null, '公休': null, '有休': null, '研修': [9 * 60, 17 * 60]
};
export const isWork = (s: Shift) => s === '日勤' || s === '早番' || s === '遅番' || s === '宿直' || s === '研修';

/** 新人向け4週サンプル勤務表（基準日：4/1 木曜）。 */
export function sampleRoster(): Shift[] {
  const pat: Shift[] = ['日勤', '日勤', '日勤', '公休', '日勤', '日勤', '公休'];
  const out: Shift[] = [];
  for (let i = 0; i < 28; i++) out.push(pat[i % 7]);
  out[7] = '研修'; out[8] = '研修'; out[14] = '早番'; out[15] = '早番'; out[21] = '遅番'; out[22] = '遅番'; out[20] = '公休'; out[10] = '公休';
  return out;
}

export interface RosterIssue { day: number; msg: string }
/** 自社規程（架空）：連続勤務6日まで／勤務間インターバル11時間／4週で公休8日以上。 */
export function validateRoster(r: Shift[]): RosterIssue[] {
  const issues: RosterIssue[] = []; let run = 0; let off = 0;
  for (let i = 0; i < r.length; i++) {
    if (isWork(r[i])) { run++; if (run > 6) issues.push({ day: i, msg: '連続勤務が6日を超えています' }); } else run = 0;
    if (r[i] === '公休') off++;
    const cur = SHIFT_TIME[r[i]]; const prev = i > 0 ? SHIFT_TIME[r[i - 1]] : null;
    if (cur && prev) {
      const prevEnd = prev[1] - 24 * 60; // 前日終業を当日基準に換算
      if (cur[0] - prevEnd < 11 * 60) issues.push({ day: i, msg: '勤務間インターバルが11時間未満です' });
    }
  }
  if (off < 8 && r.length >= 28) issues.push({ day: -1, msg: `4週の公休が${off}日（8日以上が必要）` });
  return issues;
}
