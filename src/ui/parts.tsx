import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CharacterDef } from '../engine/types';
import { pixelPortrait, pixelScene, PW, PH } from './pixel';

const DEFAULT_DEF = { id: 'player', name: '', uniform: '#233658', hair: '#2a2018', skin: '#efc9a6', age: 24, gender: 'x', dept: 'station', accessory: 'none' } as unknown as CharacterDef;
/** 会話用の人物画（ドット絵）。詳細は pixel.ts */
/** 話している最中かどうかを、会話ボックス（文字送り）から立ち絵（口パク）へ軽く伝える小さなストア */
const talk = { v: false, subs: new Set<() => void>() };
export const setTalking = (v: boolean) => { if (talk.v === v) return; talk.v = v; talk.subs.forEach(f => f()); };
const useTalking = () => useSyncExternalStore(f => { talk.subs.add(f); return () => { talk.subs.delete(f); }; }, () => talk.v);
const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** ドット絵の立ち絵。alive のとき、まばたき・呼吸・（話者なら）口パクで「生きている」感じを出す。 */
export function Portrait({ def, mood = 'normal', size = 100, alive = false, speaking = false }: { def?: CharacterDef; mood?: string; size?: number; bare?: boolean; yaw?: number; alive?: boolean; speaking?: boolean }) {
  const [blink, setBlink] = useState(false); const [open, setOpen] = useState(false); const talking = useTalking() && speaking;
  useEffect(() => { if (!alive || reduceMotion()) return; let t: number; const loop = () => { t = window.setTimeout(() => { setBlink(true); t = window.setTimeout(() => { setBlink(false); loop(); }, 110); }, 2200 + Math.random() * 3800); }; loop(); return () => clearTimeout(t); }, [alive]);
  useEffect(() => { if (!alive || !talking || reduceMotion()) { setOpen(false); return; } const id = window.setInterval(() => setOpen(o => !o), 130); return () => clearInterval(id); }, [alive, talking]);
  const m = mood + (blink ? '~b' : '') + (open ? '~m' : '');
  const src = useMemo(() => pixelPortrait(def ?? DEFAULT_DEF, m), [def?.id, m]);
  return <img className={'pxp' + (alive ? ' alive' : '')} src={src} alt={def?.name ?? ''} width={size} height={Math.round(size * PH / PW)} draggable={false} />;
}

/** バーチャルジョイスティック（タッチ／マウス）。data-uiでカメラ操作と分離する。 */
export function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null); const [k, setK] = useState({ x: 0, y: 0 }); const id = useRef<number | null>(null);
  const set = (e: React.PointerEvent) => { const r = base.current!.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } setK({ x: dx, y: dy }); onMove(Math.abs(dx) < 0.12 ? 0 : dx, Math.abs(dy) < 0.12 ? 0 : dy); };
  const end = () => { id.current = null; setK({ x: 0, y: 0 }); onMove(0, 0); };
  return (
    <div className="joy" data-ui ref={base} role="application" aria-label="移動スティック" onPointerDown={e => { id.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); set(e); }} onPointerMove={e => { if (id.current === e.pointerId) set(e); }} onPointerUp={end} onPointerCancel={end}>
      <div className="knob" style={{ transform: `translate(${k.x * 34}px, ${k.y * 34}px)` }} />
    </div>
  );
}

/** 文字送り表示 */
/** 文字送り。句読点・三点リーダの後に間を置き、読みやすく感情の起伏が出るようにする。タップで全文表示。 */
const PAUSE: Record<string, number> = { '、': 90, '，': 90, '。': 220, '．': 220, '…': 260, '！': 170, '？': 170, '」': 60, '―': 120, '—': 120 };
export function useTypewriter(text: string, speed: 'fast' | 'normal' | 'slow', reset: unknown) {
  const cps = speed === 'fast' ? 90 : speed === 'slow' ? 24 : 48; const [n, setN] = useState(0);
  const timer = useRef<number | undefined>(undefined); const finished = useRef(false); // 全文表示後に、動いているタイマーが表示を巻き戻さないようにする
  useEffect(() => {
    finished.current = false; setN(0); const t0 = performance.now(); const base = 1000 / cps; const at: number[] = []; let acc = 0; for (const ch of text) { acc += base + (PAUSE[ch] ?? 0) * (speed === 'fast' ? 0.3 : speed === 'slow' ? 1.3 : 1); at.push(acc); }
    const chars = [...text].length;
    timer.current = window.setInterval(() => { if (finished.current) return; const el = performance.now() - t0; let k = 0; while (k < at.length && at[k] <= el) k++; setN(Math.min(text.length, k)); if (k >= chars) { finished.current = true; clearInterval(timer.current); } }, 30);
    return () => clearInterval(timer.current);
  }, [text, cps, reset, speed]);
  const skip = () => { finished.current = true; clearInterval(timer.current); setN(text.length); };
  return { shown: text.slice(0, n), done: n >= text.length, skip };
}

/** 2D場面：ドット絵の背景に、話者を明るく・他の人物を暗くして並べる */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
/** ゲーム内の時刻から、場面の色味（時間帯）を決める */
export const todOf = (minute: number): TimeOfDay => (minute >= 270 && minute < 450 ? 'dawn' : minute >= 450 && minute < 990 ? 'day' : minute >= 990 && minute < 1110 ? 'dusk' : 'night');
export function Stage25D({ bg, cast, speaker, characters, caption, mood, tod = 'day', cinema = false, sceneKey }: { bg: string; cast: string[]; speaker?: string; characters: Record<string, CharacterDef>; caption?: string; mood?: string; tod?: TimeOfDay; cinema?: boolean; sceneKey?: string }) {
  const url = useMemo(() => pixelScene(bg), [bg]);
  return (
    <div className={'s25 tod-' + tod + (cinema ? ' cinema' : '')} aria-label="2Dシーン">
      <div className="pxbg" key={bg + (sceneKey ?? '')} style={{ backgroundImage: `url(${url})` }} />
      <div className="tint" aria-hidden />
      <div className="dust" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: (i * 83 % 97) + '%', animationDelay: -(i * 1.7) + 's', animationDuration: 11 + (i % 5) * 3 + 's' }} />)}</div>
      <div className="cast" key={'c' + (sceneKey ?? '')}>{cast.map(id => <div key={id} className={'who' + (speaker && speaker !== id ? ' dim' : '')}><Portrait def={characters[id]} mood={speaker === id ? mood : 'normal'} size={360} alive speaking={speaker === id} /></div>)}</div>
      <div className="vig" aria-hidden /><div className="bars top" aria-hidden /><div className="bars bot" aria-hidden />
      {caption && <div className="cap">{caption}</div>}
    </div>
  );
}
