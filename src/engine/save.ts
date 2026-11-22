import type { ModeId, WorldState } from './types';
import { SCHEMA } from './worldState';

export interface SaveFile {
  schema: number; mode: ModeId; slot: string; savedAt: number; playtimeSec: number;
  summary: { chapter: string; chapterTitle: string; dayLabel: string; node: string; rating?: string };
  world: WorldState; checksum: string;
}
export interface StorageAdapter {
  get(key: string): Promise<string | undefined>; set(key: string, v: string): Promise<void>;
  remove(key: string): Promise<void>; keys(prefix: string): Promise<string[]>; kind: string;
}
export class MemoryAdapter implements StorageAdapter {
  kind = 'memory'; m = new Map<string, string>();
  async get(k: string) { return this.m.get(k); } async set(k: string, v: string) { this.m.set(k, v); }
  async remove(k: string) { this.m.delete(k); } async keys(p: string) { return [...this.m.keys()].filter(k => k.startsWith(p)); }
}
export class IndexedDBAdapter implements StorageAdapter {
  kind = 'indexeddb'; private db?: Promise<IDBDatabase>;
  private open() { return this.db ??= new Promise((res, rej) => { const r = indexedDB.open('rr-saves', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); }); }
  private async tx<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) { const db = await this.open(); return new Promise<T>((res, rej) => { const rq = f(db.transaction('kv', mode).objectStore('kv')); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); }
  async get(k: string) { return (await this.tx('readonly', s => s.get(k))) as string | undefined; }
  async set(k: string, v: string) { await this.tx('readwrite', s => s.put(v, k)); }
  async remove(k: string) { await this.tx('readwrite', s => s.delete(k)); }
  async keys(p: string) { return ((await this.tx('readonly', s => s.getAllKeys())) as string[]).filter(k => k.startsWith(p)); }
}

export function fnv1a(str: string): string { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); }

/** 旧スキーマ移行テーブル。将来のバージョンで追加する。 */
const MIGRATIONS: Record<number, (w: any) => any> = {};
export function migrate(f: SaveFile): SaveFile {
  let v = f.schema; const w: any = f.world;
  while (v < SCHEMA) { const m = MIGRATIONS[v]; if (!m) throw new Error(`セーブ形式v${v}からの移行手順がありません`); m(w); v++; }
  return { ...f, schema: SCHEMA, world: w };
}

export const SLOTS = ['auto', '1', '2', '3'] as const;
export const key = (mode: ModeId, slot: string) => `save:${mode}:${slot}`;

export class SaveManager {
  constructor(public adapter: StorageAdapter) {}
  async save(mode: ModeId, slot: string, world: WorldState, summary: SaveFile['summary']): Promise<SaveFile> {
    if (world.mode !== mode) throw new Error('モード不一致：他モードの状態は保存できません');
    const body = { schema: SCHEMA, mode, slot, savedAt: Date.now(), playtimeSec: world.playtimeSec, summary, world };
    const json = JSON.stringify(body); const file: SaveFile = { ...body, checksum: fnv1a(json) };
    await this.adapter.set(key(mode, slot), JSON.stringify(file)); return file;
  }
  parse(raw: string, expectMode?: ModeId): SaveFile {
    const f = JSON.parse(raw) as SaveFile; const { checksum, ...rest } = f;
    if (fnv1a(JSON.stringify(rest)) !== checksum) throw new Error('セーブデータが破損しています（チェックサム不一致）');
    if (expectMode && f.mode !== expectMode) throw new Error(`このセーブは別モード(${f.mode})のものです`);
    return migrate(f);
  }
  async load(mode: ModeId, slot: string): Promise<SaveFile | undefined> { const raw = await this.adapter.get(key(mode, slot)); return raw ? this.parse(raw, mode) : undefined; }
  async list(mode: ModeId): Promise<Record<string, SaveFile | 'corrupt' | undefined>> {
    const out: Record<string, SaveFile | 'corrupt' | undefined> = {};
    for (const s of SLOTS) { try { out[s] = await this.load(mode, s); } catch { out[s] = 'corrupt'; } }
    return out;
  }
  async remove(mode: ModeId, slot: string) { await this.adapter.remove(key(mode, slot)); }
  async exportText(mode: ModeId, slot: string): Promise<string> { const raw = await this.adapter.get(key(mode, slot)); if (!raw) throw new Error('空のスロットです'); return btoa(unescape(encodeURIComponent(raw))); }
  async importText(mode: ModeId, slot: string, text: string): Promise<SaveFile> {
    const raw = decodeURIComponent(escape(atob(text.trim()))); const f = this.parse(raw, mode);
    const { checksum: _old, ...rest } = { ...f, slot };
    const out: SaveFile = { ...rest, checksum: fnv1a(JSON.stringify(rest)) };
    await this.adapter.set(key(mode, slot), JSON.stringify(out)); return out;
  }
}

export async function createAdapter(): Promise<StorageAdapter> {
  try { if (typeof indexedDB === 'undefined') throw 0; const a = new IndexedDBAdapter(); await a.set('__probe', '1'); await a.remove('__probe'); return a; }
  catch { return new MemoryAdapter(); }
}
