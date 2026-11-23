/** 共通型定義。全14モードで再利用するデータ駆動ストーリー・世界状態の型。 */
export type ModeId = 'R1'|'R2'|'R3'|'R4'|'R5'|'R6'|'R7'|'R8'|'R9'|'R10'|'R11'|'C1'|'C2'|'C3';
export type Op = '>='|'<='|'>'|'<'|'=='|'!=';
export type CmpSpec = { op: Op; val: number };

export type Cond =
  | { flag: string } | { notFlag: string }
  | { rel: { char: string; key: 'trust'|'rapport'; op: Op; val: number } }
  | { eval: { key: string; op: Op; val: number } }
  | { skill: { key: string; op: Op; val: number } }
  | { var: { key: string; op: Op; val: number } }
  | { dept: string } | { cert: string }
  | { time: { op: Op; val: number } }
  | { visited: string } | { notVisited: string }
  | { chose: { node: string; option: string } }
  | { done: string } | { nodePrefix: string }
  | { all: Cond[] } | { any: Cond[] } | { not: Cond };

export type EvalKey = 'service'|'accuracy'|'reporting'|'teamwork'|'safety';

export type Effect =
  | { set: string } | { unset: string }
  | { var: { key: string; add?: number; set?: number } }
  | { rel: { char: string; trust?: number; rapport?: number; note?: string } }
  | { eval: { key: EvalKey; add: number } }
  | { skill: { key: string; add: number } }
  | { cert: string }
  | { training: { id: string; progress: number } }
  | { assign: { dept: string; role: string; site: string } }
  | { apply: { dept: string; note?: string } }
  | { time: number }
  | { clock: { addDay?: number; minute?: number } }
  | { log: { text: string; tag?: string } }
  | { timeline: { text: string; tag?: string } }
  | { done: string }
  | { ending: string };

export interface Speaker { id?: string; name?: string }
export interface Line { who?: string; text: string; mood?: 'normal'|'smile'|'worry'|'serious'|'surprise'; narration?: boolean }

export interface ViewHint {
  mode?: '3d'|'25d'|'2d';
  cam?: string;           // カメラプリセットID
  bg?: string;            // 2D/2.5D背景ID
  focus?: string[];       // 画面に出す人物ID
  caption?: string;       // 場所・時刻キャプション
}

interface Base { id: string; effects?: Effect[]; view?: ViewHint; label?: string }
export interface LineNode extends Base { type: 'line'; lines: Line[]; next: string }
export interface ChoiceOption {
  id: string; label: string; hint?: string; goto: string; effects?: Effect[]; requires?: Cond;
  tone?: 'careful'|'quick'|'caring'|'honest'|'neutral'|'risky';
}
export interface ChoiceNode extends Base {
  type: 'choice'; prompt: string; who?: string; options: ChoiceOption[];
  important?: boolean; timeLimit?: number; defaultOption?: string;
}
export interface BranchNode extends Base { type: 'branch'; cases: { when: Cond; goto: string }[]; else: string }
export interface EffectNode extends Base { type: 'effect'; next: string }
export interface Interaction {
  id: string; object: string; label: string; goto: string;
  requires?: Cond; once?: boolean; minutes?: number; icon?: string; hideWhen?: Cond;
}
export interface Goal { id: string; label: string; when: Cond; optional?: boolean; showWhen?: Cond }
export interface TimedEvent { id: string; at: number; when?: Cond; goto: string; once?: boolean }
export interface HubNode extends Base {
  type: 'hub'; scene: string; title: string; hint?: string;
  interactions: Interaction[]; goals: Goal[]; timed?: TimedEvent[];
  exit: { label: string; requires: Cond; goto: string };
  spawn?: string;
}
export interface ChecklistItem { id: string; label: string; truth: 'ok'|'ng'; why: string }
export interface ComposeSlot { id: string; label: string; options: { id: string; text: string; good: boolean; why: string }[] }
export interface TaskNode extends Base {
  type: 'task'; kind: 'checklist'|'compose'|'terminal'|'roster'|'timing'|'find'|'watch'|'route'|'sort'|'memory'; config?: any;
  title: string; intro?: string;
  items?: ChecklistItem[]; slots?: ComposeSlot[]; terminal?: string;
  results: { min: number; goto: string; effects?: Effect[]; label?: string }[];
  next?: string;
}
export interface EndNode extends Base { type: 'end'; chapter: string; title: string; summary: string; nextChapter?: string }
export type StoryNode = LineNode | ChoiceNode | BranchNode | EffectNode | HubNode | TaskNode | EndNode;

export interface ChapterMeta { id: string; title: string; season: string; start: string; status: 'playable'|'teaser'|'planned'; synopsis: string }
export interface CharacterDef {
  id: string; name: string; kana?: string; role: string; dept: string; age: number; years: number;
  uniform: string; hair: string; skin: string; trait: string; bio: string; gender?: 'm'|'f'|'x'; accessory?: 'cap'|'glasses'|'none'|'bag'|'cane'|'suitcase'; height?: number; visibleWhen?: Cond;
}
export interface StoryData {
  storyId: string; mode: ModeId; title: string; subtitle: string; startYear: number;
  characters: Record<string, CharacterDef>;
  chapters: ChapterMeta[];
  nodes: Record<string, StoryNode>;
  maps?: Record<string, StoryMapData>;
  endings?: Record<string, { title: string; text: string }>;
}

// ---- 世界状態 ----
export interface Relationship { trust: number; rapport: number; met: boolean; notes: string[] }
export interface Assignment { dept: string; role: string; site: string; fromDay: number; toDay?: number }
export interface CareerState {
  employeeNo: string; joinDay: number; grade: number; track: string;
  assignments: Assignment[];
  certifications: { id: string; day: number }[];
  trainings: Record<string, { progress: number; done: boolean }>;
  evaluations: Record<EvalKey, number>;
  evalHistory: { chapter: string; scores: Record<EvalKey, number>; rating: string; day: number }[];
  applications: { dept: string; status: 'submitted'|'approved'|'deferred'|'rejected'; day: number; note?: string }[];
  skills: Record<string, number>;
  workLog: { day: number; shift: string; hours: number }[];
}
export interface LogEntry { day: number; minute: number; text: string; tag?: string; node?: string }
export interface WorldState {
  schema: number; mode: ModeId; storyId: string;
  clock: { day: number; minute: number };
  playerName: string;
  flags: Record<string, boolean>; vars: Record<string, number>;
  relationships: Record<string, Relationship>;
  career: CareerState;
  story: {
    chapter: string; node: string; visited: string[]; choices: { node: string; option: string; day: number; minute: number; timedOut?: boolean }[];
    once: string[]; done: string[]; endings: string[]; completedChapters: string[];
    chapterResults: Record<string, ChapterResult>; trail: string[];
  };
  log: LogEntry[]; timeline: LogEntry[];
  playtimeSec: number;
  playerPos?: { x: number; y: number; z: number; yaw: number };
}
export interface ChapterResult {
  chapter: string; rating: string; scores: Record<EvalKey, number>;
  flags: string[]; relDelta: Record<string, { trust: number; rapport: number }>;
  nextVariants: string[];
}

/** あらすじ分岐図（UI用）。node.reveal のいずれかに到達済みなら「通った」表示になる */
export interface StoryMapData {
  lanes: { id: string; label: string; color: string }[];
  nodes: { id: string; lane: number; x: number; label: string; sub?: string; star?: boolean; reveal: string[]; choice?: string }[];
  edges: [string, string][];
}
