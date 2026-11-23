import { useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterDef } from '../engine/types';
import { Portrait2D } from './Portrait2D';

/** 会話用の人物画（2Dベクター）。詳細は Portrait2D.tsx */
export function Portrait({ def, mood = 'normal', size = 100 }: { def?: CharacterDef; mood?: string; size?: number; bare?: boolean; yaw?: number }) { return <Portrait2D def={def} mood={mood} size={size} />; }

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
  useEffect(() => { setN(0); const t0 = performance.now(); const id = setInterval(() => { const k = Math.min(text.length, Math.floor(((performance.now() - t0) / 1000) * cps)); setN(k); if (k >= text.length) clearInterval(id); }, 30); return () => clearInterval(id); }, [text, cps, reset]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

/** 擬似3D（2.5D）ステージ：視差のある3層の背景＋奥行き順に並べた人物。ポインタ移動で奥行きが動く。 */
export function Stage25D({ bg, cast, speaker, characters, caption, mood }: { bg: string; cast: string[]; speaker?: string; characters: Record<string, CharacterDef>; caption?: string; mood?: string }) {
  const [p, setP] = useState({ x: 0, y: 0 });
  const onMove = (e: React.PointerEvent) => { const r = e.currentTarget.getBoundingClientRect(); setP({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }); };
  const tr = (d: number) => ({ transform: `translate(${-p.x * d}px, ${-p.y * d * 0.6}px)` });
  const back = useMemo(() => <Backdrop kind={bg} layer="back" />, [bg]); const mid = useMemo(() => <Backdrop kind={bg} layer="mid" />, [bg]); const front = useMemo(() => <Backdrop kind={bg} layer="front" />, [bg]);
  return (
    <div className="s25" onPointerMove={onMove} aria-label="擬似3Dシーン">
      <div className="layer" style={tr(10)}>{back}</div><div className="layer" style={tr(26)}>{mid}</div>
      <div className="cast" style={tr(46)}>{cast.map(id => <div key={id} className={'who' + (speaker && speaker !== id ? ' dim' : '')}><Portrait def={characters[id]} mood={speaker === id ? mood : 'normal'} size={420} /></div>)}</div>
      <div className="layer" style={tr(70)}>{front}</div>
      {caption && <div className="cap">{caption}</div>}
    </div>
  );
}

function Backdrop({ kind, layer }: { kind: string; layer: 'back' | 'mid' | 'front' }) {
  const W = 1200, H = 700;
  if (kind === 'depot') {
    if (layer === 'back') return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="dsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5f9bdc" /><stop offset="1" stopColor="#d4e6f1" /></linearGradient></defs><rect width={W} height={H} fill="url(#dsk)" />{[0, 1, 2, 3].map(i => <path key={i} d={`M${i * 330 - 100} 430 L${i * 330 + 80} 300 L${i * 330 + 300} 430z`} fill={i % 2 ? '#7f9aa4' : '#8fa8b0'} />)}</svg>;
    if (layer === 'mid') return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><rect x="0" y="380" width={W} height="140" fill="#5a636c" /><rect x="60" y="250" width="520" height="190" fill="#8c98a4" /><rect x="60" y="250" width="520" height="22" fill="#4a5560" />{[0, 1, 2, 3, 4].map(i => <rect key={i} x={90 + i * 100} y="300" width="70" height="140" fill="#2a3440" />)}<g fill="#cfd6dc"><rect x="640" y="340" width="480" height="90" rx="10" /></g><g fill="#2c4a6a">{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={660 + i * 76} y="352" width="56" height="30" />)}</g><rect x="640" y="408" width="480" height="8" fill="#e87a1e" /></svg>;
    return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><g stroke="#6d6a66" strokeWidth="10"><path d="M0 700L420 520M1200 700L780 520" /></g><g stroke="#9aa4ad" strokeWidth="5"><path d="M-40 640L430 500M1240 640L770 500" /></g><rect x="0" y="560" width={W} height="140" fill="#1b2430" opacity=".5" /></svg>;
  }
  if (kind === 'hr') {
    if (layer === 'back') return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><rect width={W} height={H} fill="#d9d4c8" /><rect x="120" y="90" width="460" height="300" fill="#a8d0e6" /><path d="M120 390l130-100 120 70 90-60 100 90z" fill="#7fa86f" /><g stroke="#8a7f6c" strokeWidth="10" fill="none"><rect x="120" y="90" width="460" height="300" /><path d="M350 90v300M120 240h460" /></g><rect x="760" y="120" width="300" height="200" fill="#f5f2ea" stroke="#8a7f6c" strokeWidth="8" /><g fill="#9aa" opacity=".8"><rect x="790" y="150" width="140" height="10" /><rect x="790" y="180" width="200" height="10" /><rect x="790" y="210" width="160" height="10" /></g></svg>;
    if (layer === 'mid') return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><rect y="470" width={W} height="230" fill="#8a7658" /><rect x="180" y="470" width="840" height="34" fill="#6a5a42" /></svg>;
    return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><g><rect x="40" y="520" width="80" height="170" fill="#4a3a2a" /><circle cx="80" cy="500" r="60" fill="#4f8a4a" /></g><rect x="0" y="620" width={W} height="80" fill="#10192a" opacity=".55" /></svg>;
  }
  // office
  if (layer === 'back') return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><rect width={W} height={H} fill="#d6dbe0" /><rect x="80" y="100" width="1040" height="280" fill="#a9d0e6" /><g stroke="#8a97a3" strokeWidth="10"><path d="M340 100v280M600 100v280M860 100v280M80 240h1040" /></g><g fill="#7a96a8" opacity=".7"><rect x="120" y="300" width="120" height="80" /><rect x="640" y="260" width="180" height="120" /><rect x="900" y="320" width="100" height="60" /></g></svg>;
  if (layer === 'mid') return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><rect y="400" width={W} height="300" fill="#b9b2a6" /><rect x="70" y="420" width="300" height="130" fill="#8a6a48" /><rect x="830" y="420" width="300" height="130" fill="#8a6a48" /><rect x="450" y="150" width="300" height="190" fill="#f6f6f0" stroke="#8c8c8c" strokeWidth="8" /><g fill="#2a4a7a"><rect x="474" y="180" width="160" height="10" /><rect x="474" y="210" width="220" height="10" /><rect x="474" y="240" width="130" height="10" /></g></svg>;
  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"><rect x="30" y="590" width="200" height="110" fill="#3a2f26" /><rect x="980" y="560" width="190" height="140" fill="#2f3a46" /><rect x="0" y="630" width={W} height="70" fill="#10192a" opacity=".5" /></svg>;
}
