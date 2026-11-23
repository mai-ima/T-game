import { useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterDef } from '../engine/types';
import { pixelPortrait, pixelScene, PW, PH } from './pixel';

const DEFAULT_DEF = { id: 'player', name: '', uniform: '#233658', hair: '#2a2018', skin: '#efc9a6', age: 24, gender: 'x', dept: 'station', accessory: 'none' } as unknown as CharacterDef;
/** 会話用の人物画（ドット絵）。詳細は pixel.ts */
export function Portrait({ def, mood = 'normal', size = 100 }: { def?: CharacterDef; mood?: string; size?: number; bare?: boolean; yaw?: number }) {
  const src = useMemo(() => pixelPortrait(def ?? DEFAULT_DEF, mood), [def?.id, mood]);
  return <img className="pxp" src={src} alt={def?.name ?? ''} width={size} height={Math.round(size * PH / PW)} draggable={false} />;
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
export function useTypewriter(text: string, speed: 'fast' | 'normal' | 'slow', reset: unknown) {
  const cps = speed === 'fast' ? 90 : speed === 'slow' ? 24 : 48; const [n, setN] = useState(0);
  const timer = useRef<number | undefined>(undefined); const finished = useRef(false); // 全文表示後に、動いているタイマーが表示を巻き戻さないようにする
  useEffect(() => {
    finished.current = false; setN(0); const t0 = performance.now();
    timer.current = window.setInterval(() => { if (finished.current) return; const k = Math.min(text.length, Math.floor(((performance.now() - t0) / 1000) * cps)); setN(k); if (k >= text.length) { finished.current = true; clearInterval(timer.current); } }, 30);
    return () => clearInterval(timer.current);
  }, [text, cps, reset]);
  const skip = () => { finished.current = true; clearInterval(timer.current); setN(text.length); };
  return { shown: text.slice(0, n), done: n >= text.length, skip };
}

/** 2D場面：ドット絵の背景に、話者を明るく・他の人物を暗くして並べる */
export function Stage25D({ bg, cast, speaker, characters, caption, mood }: { bg: string; cast: string[]; speaker?: string; characters: Record<string, CharacterDef>; caption?: string; mood?: string }) {
  const url = useMemo(() => pixelScene(bg), [bg]);
  return (
    <div className="s25" aria-label="2Dシーン">
      <div className="pxbg" style={{ backgroundImage: `url(${url})` }} />
      <div className="cast">{cast.map(id => <div key={id} className={'who' + (speaker && speaker !== id ? ' dim' : '')}><Portrait def={characters[id]} mood={speaker === id ? mood : 'normal'} size={360} /></div>)}</div>
      {caption && <div className="cap">{caption}</div>}
    </div>
  );
}
