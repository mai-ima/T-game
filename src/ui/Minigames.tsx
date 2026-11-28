import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TaskNode } from '../engine/types';
import { TaskShell } from './Tasks';

/** クイズ以外の業務形式。いずれも 0〜100 の得点を返し、ストーリー側の results で分岐する。 */
type Done = (score: number) => void;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const Finish = ({ score, label, onDone, note }: { score: number; label: string; onDone: Done; note?: string }) => (
  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
    <span className="stamp">完了</span><p style={{ margin: 0 }}><b>{label} {score}点</b>{note && <><br /><span className="small">{note}</span></>}</p>
    <button className="btn primary" onClick={() => onDone(score)}>報告して戻る</button>
  </div>
);

/* ---------- 1) タイミング：ゲージが緑の範囲にあるうちに止める ---------- */
export function TimingTask({ node, onDone }: { node: TaskNode; onDone: Done }) {
  const cfg = node.config ?? {}; const rounds: { label: string }[] = cfg.rounds ?? [{ label: '1' }, { label: '2' }, { label: '3' }];
  const [i, setI] = useState(0); const [pos, setPos] = useState(0); const [res, setRes] = useState<number[]>([]); const dir = useRef(1); const p = useRef(0); const zone = useMemo(() => rounds.map(() => 0.2 + Math.random() * 0.5), []);  
  const w = cfg.width ?? 0.16; const fin = i >= rounds.length;
  useEffect(() => {
    if (fin) return; let raf = 0, last = performance.now(); const speed = (cfg.speed ?? 0.7) * (1 + i * 0.25);
    const tick = (t: number) => { const dt = (t - last) / 1000; last = t; p.current += dir.current * speed * dt; if (p.current > 1) { p.current = 1; dir.current = -1; } if (p.current < 0) { p.current = 0; dir.current = 1; } setPos(p.current); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [i, fin]);  
  const stop = () => { if (fin) return; const d = Math.abs(p.current - (zone[i] + w / 2)); const s = d <= w / 2 ? 100 : d <= w ? 55 : 10; setRes(r => [...r, s]); setI(n => n + 1); p.current = 0; dir.current = 1; };
  const score = clamp(res.reduce((a, b) => a + b, 0) / rounds.length);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="mg-meta">{rounds.map((r, k) => <span key={k} className={'mg-pip' + (k < res.length ? (res[k] >= 100 ? ' ok' : res[k] >= 55 ? ' mid' : ' ng') : k === i ? ' on' : '')}>{r.label}</span>)}</div>
      <div className="mg-gauge" aria-hidden>{!fin && <i className="zone" style={{ left: zone[i] * 100 + '%', width: w * 100 + '%' }} />}<b className="needle" style={{ left: pos * 100 + '%' }} /></div>
      {!fin ? <button className="btn primary mg-big" onClick={stop}>{cfg.button ?? '今！'}（{i + 1}/{rounds.length}：{rounds[i].label}）</button> : <Finish score={score} label="作業の正確さ" onDone={onDone} />}
    </TaskShell>
  );
}

/* ---------- 2) 探す：場面の中から異常箇所をタップして見つける ---------- */
interface Spot { id: string; x: number; y: number; r?: number; label: string; real?: boolean }
export function FindTask({ node, onDone, relaxed }: { node: TaskNode; onDone: Done; relaxed?: boolean }) {
  const cfg = node.config ?? {}; const spots: Spot[] = cfg.spots ?? []; const real = spots.filter(s => s.real !== false); const [found, setFound] = useState<string[]>([]); const [miss, setMiss] = useState(0); const [left, setLeft] = useState((cfg.seconds ?? 40) * (relaxed ? 3 : 1)); const [note, setNote] = useState(''); const [fin, setFin] = useState(false);
  useEffect(() => { if (fin) return; const id = setInterval(() => setLeft((n: number) => Math.max(0, n - 1)), 1000); return () => clearInterval(id); }, [fin]);
  useEffect(() => { if (left <= 0) setFin(true); }, [left]);
  useEffect(() => { if (found.length >= real.length && real.length) setFin(true); }, [found, real.length]);
  const aspect = useRef(1.6);
  const probe = (x: number, y: number) => {
    if (fin) return; const hit = spots.find(s => Math.hypot((s.x - x) * aspect.current, s.y - y) < (s.r ?? 0.09) + 0.02);
    if (hit && hit.real !== false) { if (!found.includes(hit.id)) { setFound(f => [...f, hit.id]); setNote('見つけた：' + hit.label); } }
    else if (hit) { setMiss(m => m + 1); setNote('問題ありません：' + hit.label); } else { setMiss(m => m + 1); setNote('何もありません'); }
  };
  const tap = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); aspect.current = r.width / r.height; probe((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
  const score = clamp((found.length / Math.max(1, real.length)) * 100 - miss * 8);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="mg-meta"><span>発見 {found.length}/{real.length}</span><span>残り {left}秒</span><span>誤タップ {miss}</span></div>
      <div className={'mg-scene ' + (cfg.scene ?? 'platform')} onPointerDown={tap} role="application" aria-label="探す場面。気になる場所をタップ">
        {(cfg.props ?? []).map((p: { x: number; y: number; w: number; h: number; c: string; t?: string }, k: number) => <i key={k} className="mg-prop" style={{ left: p.x * 100 + '%', top: p.y * 100 + '%', width: p.w * 100 + '%', height: p.h * 100 + '%', background: p.c }}>{p.t}</i>)}
        {spots.map(s => found.includes(s.id) && <em key={s.id} className="mg-ring" style={{ left: s.x * 100 + '%', top: s.y * 100 + '%' }} />)}
        {fin && real.filter(s => !found.includes(s.id)).map(s => <em key={s.id} className="mg-ring miss" style={{ left: s.x * 100 + '%', top: s.y * 100 + '%' }} />)}
      </div>
      <details className="mg-kbd"><summary>キーボード・読み上げで操作する（区画を選ぶ）</summary>
        <div className="mg-kgrid" role="group" aria-label="場面を3行4列に分けた区画">{[0, 1, 2].flatMap(r => [0, 1, 2, 3].map(q => <button key={r + '-' + q} className="btn sm" disabled={fin} onClick={() => probe((q + 0.5) / 4, (r + 0.5) / 3)} aria-label={`${r + 1}行${q + 1}列を調べる`}>{r + 1}-{q + 1}</button>))}</div></details>
      <p className="small" style={{ minHeight: 22 }}>{note || '怪しい場所・壊れた場所を見つけてタップします。'}</p>
      {fin && <Finish score={score} label="点検の結果" onDone={onDone} note={`見落とし ${real.length - found.length}件`} />}
    </TaskShell>
  );
}

/* ---------- 3) 見守り：黄色い線を越えた人を素早く下がらせる ---------- */
export function WatchTask({ node, onDone, relaxed }: { node: TaskNode; onDone: Done; relaxed?: boolean }) {
  const cfg = node.config ?? {}; const total = cfg.total ?? 8; type P = { id: number; x: number; y: number; vy: number; bad: boolean; hp: number; state: 'go' | 'saved' | 'lost' };
  const [ps, setPs] = useState<P[]>([]); const [t, setT] = useState(0); const nid = useRef(0); const spawned = useRef(0); const [fin, setFin] = useState(false);
  useEffect(() => {
    if (fin) return; let raf = 0, last = performance.now(), acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt; setT(x => x + dt);
      if (spawned.current < total && acc > 1.1) { acc = 0; spawned.current++; const bad = Math.random() < 0.7; setPs(a => [...a, { id: nid.current++, x: 0.1 + Math.random() * 0.8, y: 0.5 + Math.random() * 0.15, vy: bad ? (0.1 + Math.random() * 0.04) * (relaxed ? 0.45 : 1) : 0, bad, hp: 1, state: 'go' }]); }
      setPs(a => a.map(p => { if (p.state !== 'go') return p; const y = p.y + p.vy * dt; return y >= 0.93 && p.bad ? { ...p, y, state: 'lost' } : { ...p, y }; }));
      raf = requestAnimationFrame(tick);
    }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [fin]);  
  useEffect(() => { if (spawned.current >= total && ps.length >= total && ps.every(p => p.state !== 'go' || !p.bad)) { const id = setTimeout(() => setFin(true), 700); return () => clearTimeout(id); } }, [ps, total]);
  const tap = (id: number) => setPs(a => a.map(p => p.id === id && p.state === 'go' ? (p.bad ? { ...p, state: 'saved', y: 0.4 } : { ...p }) : p));
  const bads = ps.filter(p => p.bad); const saved = bads.filter(p => p.state === 'saved').length; const lost = bads.filter(p => p.state === 'lost').length;
  const score = bads.length === 0 ? 100 : clamp((saved / bads.length) * 100 - lost * 5);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="mg-meta"><span>声かけ成功 {saved}</span><span>線を越えた {lost}</span></div>
      <div className="mg-scene watch" aria-label="ホーム。黄色い線へ近づいた人をタップして声をかける"><div className="mg-line" /><div className="mg-edge">ホーム端</div>
        {ps.map(p => <button key={p.id} className={'mg-person ' + (p.state === 'saved' ? 'saved' : p.state === 'lost' ? 'lost' : p.bad ? 'bad' : 'safe')} style={{ left: p.x * 100 + '%', top: p.y * 100 + '%' }} onClick={() => tap(p.id)} aria-label={p.bad ? '線に近づく人' : '立ち止まっている人'}><Pawn kind={p.state === 'saved' ? 'saved' : p.state === 'lost' ? 'lost' : p.bad ? 'walk' : 'stand'} /></button>)}
      </div>
      <p className="small">黄色い線に向かって歩いてくる人をタップして、声をかけて下がってもらいます。立ち止まっている人は見守るだけで大丈夫です。</p>
      {fin && <Finish score={score} label="見守り" onDone={onDone} />}
    </TaskShell>
  );
}

/* ---------- 4) 経路：障害物を避けて目的地までの道を作る ---------- */
export function RouteTask({ node, onDone }: { node: TaskNode; onDone: Done }) {
  const cfg = node.config ?? {}; const grid: string[] = cfg.grid ?? []; const H = grid.length, W = grid[0]?.length ?? 0;
  const find = (ch: string) => { for (let y = 0; y < H; y++) { const x = grid[y].indexOf(ch); if (x >= 0) return [x, y] as const; } return [0, 0] as const; };
  const start = find('S'), goal = find('G'); const [path, setPath] = useState<(readonly [number, number])[]>([start]); const [fin, setFin] = useState(false);
  const last = path[path.length - 1]; const at = (x: number, y: number) => grid[y]?.[x] ?? '#';
  const tap = (x: number, y: number) => {
    if (fin) return; const idx = path.findIndex(p => p[0] === x && p[1] === y); if (idx >= 0) { setPath(path.slice(0, idx + 1)); return; }
    if (Math.abs(x - last[0]) + Math.abs(y - last[1]) !== 1 || at(x, y) === '#') return; setPath([...path, [x, y]]); if (at(x, y) === 'G') setFin(true);
  };
  const waypoints: string[] = cfg.must ?? []; const hit = waypoints.filter(w => path.some(p => at(p[0], p[1]) === w)); const reached = fin && at(last[0], last[1]) === 'G';
  const cost = path.reduce((a, p) => a + (at(p[0], p[1]) === '~' ? 3 : 1), 0); const best = cfg.best ?? cost; const score = reached ? clamp(100 - Math.max(0, cost - best) * 6 - (waypoints.length - hit.length) * 30) : 0;
  const legend: Record<string, string> = cfg.legend ?? {};
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="mg-meta"><span>歩数 {path.length - 1}</span>{waypoints.length > 0 && <span>必ず通る {hit.length}/{waypoints.length}</span>}<button className="btn sm" onClick={() => { setPath([start]); setFin(false); }}>やり直す</button></div>
      <div className="mg-grid" style={{ gridTemplateColumns: `repeat(${W}, 1fr)` }}>
        {grid.flatMap((row, y) => [...row].map((ch, x) => { const on = path.some(p => p[0] === x && p[1] === y); const cur = last[0] === x && last[1] === y; return <button key={x + ',' + y} className={`mg-cell c${ch === '.' ? 'f' : ch === '#' ? 'w' : ch === '~' ? 'r' : ch === 'S' ? 's' : ch === 'G' ? 'g' : 'k'}${on ? ' on' : ''}${cur ? ' cur' : ''}`} onClick={() => tap(x, y)} aria-label={legend[ch] ?? ch}>{ch === 'S' ? '起' : ch === 'G' ? '着' : ch !== '.' && ch !== '#' && ch !== '~' ? ch : cur ? '●' : ''}</button>; }))}
      </div>
      <p className="small">{Object.entries(legend).map(([k, v]) => `${k === '#' ? '■' : k === '~' ? '▒' : k}：${v}`).join('　')}　／　隣のマスをタップして道をつなぎます。戻るには通ったマスをタップ。</p>
      {fin && <Finish score={score} label="ご案内" onDone={onDone} note={reached ? `最短との差 ${Math.max(0, cost - best)}` : ''} />}
    </TaskShell>
  );
}

/* ---------- 5) 仕分け：流れてくる物を、正しい行き先へ ---------- */
export function SortTask({ node, onDone, relaxed }: { node: TaskNode; onDone: Done; relaxed?: boolean }) {
  const cfg = node.config ?? {}; const bins: { id: string; label: string }[] = cfg.bins ?? []; const items: { id: string; label: string; bin: string; why: string }[] = cfg.items ?? [];
  const [i, setI] = useState(0); const [ok, setOk] = useState(0); const [msg, setMsg] = useState(''); const per = (cfg.perItem ?? 7) * (relaxed ? 3 : 1); const [left, setLeft] = useState(per); const fin = i >= items.length;
  const handled = useRef(-1); // 同じ問題をタップと時間切れで二重に進めない
  const next = useCallback((good: boolean, why: string) => { if (handled.current === i) return; handled.current = i; if (good) setOk(n => n + 1); setMsg((good ? '○ ' : '× ') + why); setI(n => n + 1); setLeft(per); }, [per, i]);
  useEffect(() => { if (fin) return; const id = setInterval(() => setLeft((n: number) => n - 1), 1000); return () => clearInterval(id); }, [fin, i]);
  useEffect(() => { if (!fin && left <= 0) next(false, '時間切れ：' + items[i].why); }, [left]);  
  const cur = items[i]; const score = clamp((ok / Math.max(1, items.length)) * 100);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="mg-meta"><span>{Math.min(i + 1, items.length)}/{items.length}</span><span>正しく仕分け {ok}</span>{!fin && <span>残り {left}秒</span>}</div>
      {!fin && <div className="mg-card" key={i}><b>{cur.label}</b><i className="mg-timer"><b style={{ width: (left / per) * 100 + '%' }} /></i></div>}
      <div className="mg-bins">{bins.map(b => <button key={b.id} className="btn mg-bin" disabled={fin} onClick={() => next(cur.bin === b.id, cur.why)}>{b.label}</button>)}</div>
      <p className="small" style={{ minHeight: 40 }}>{msg || '品物をどの扱いにするか、素早く決めます。'}</p>
      {fin && <Finish score={score} label="仕分け" onDone={onDone} />}
    </TaskShell>
  );
}

/* ---------- 6) 記憶：表示された内容を覚えて、同じ順に入力する ---------- */
export function MemoryTask({ node, onDone }: { node: TaskNode; onDone: Done }) {
  const cfg = node.config ?? {}; const seq: string[] = cfg.sequence ?? []; const pool: string[] = cfg.pool ?? [...new Set(seq)]; const showMs = cfg.showMs ?? 4200;
  const [phase, setPhase] = useState<'show' | 'input' | 'done'>('show'); const [ans, setAns] = useState<string[]>([]); const [left, setLeft] = useState(Math.round(showMs / 1000));
  useEffect(() => { if (phase !== 'show') return; const id = setInterval(() => setLeft((n: number) => { if (n <= 1) { setPhase('input'); return 0; } return n - 1; }), 1000); return () => clearInterval(id); }, [phase]);
  const add = (v: string) => { const n = [...ans, v]; setAns(n); if (n.length >= seq.length) setPhase('done'); };
  const right = ans.filter((a, k) => a === seq[k]).length; const score = clamp((right / Math.max(1, seq.length)) * 100);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      {phase === 'show' && <><div className="term" style={{ whiteSpace: 'normal' }}><p className="small" style={{ margin: 0 }}>{cfg.showLabel ?? '次の順に変更します。覚えてください'}（{left}秒）</p><ol className="mg-seq">{seq.map((s, k) => <li key={k}>{s}</li>)}</ol></div><button className="btn" onClick={() => setPhase('input')}>覚えた（入力へ）</button></>}
      {phase !== 'show' && <>
        <div className="term" style={{ whiteSpace: 'normal' }}><p className="small" style={{ margin: 0 }}>{cfg.inputLabel ?? '同じ順に選んでください'}</p><ol className="mg-seq">{seq.map((_, k) => <li key={k} className={phase === 'done' ? (ans[k] === seq[k] ? 'ok' : 'ng') : ''}>{ans[k] ?? '＿＿'}{phase === 'done' && ans[k] !== seq[k] && <small>（正：{seq[k]}）</small>}</li>)}</ol></div>
        {phase === 'input' && <div className="mg-bins">{pool.map(p => <button key={p} className="btn mg-bin" onClick={() => add(p)}>{p}</button>)}</div>}
        {phase === 'input' && ans.length > 0 && <button className="btn sm" onClick={() => setAns(a => a.slice(0, -1))}>1つ戻す</button>}
      </>}
      {phase === 'done' && <Finish score={score} label="入力の正確さ" onDone={onDone} />}
    </TaskShell>
  );
}

/** ホーム見守り用のドット絵風の人影（絵文字をやめて画面の雰囲気を揃える） */
function Pawn({ kind }: { kind: 'saved' | 'lost' | 'walk' | 'stand' }) {
  const body = kind === 'lost' ? '#c0392b' : kind === 'saved' ? '#2e8b57' : kind === 'walk' ? '#d98a1e' : '#4a6fa5';
  return (
    <svg viewBox="0 0 16 16" width="30" height="30" shapeRendering="crispEdges" aria-hidden>
      <rect x="6" y="1" width="4" height="4" fill="#f1c9a0" /><rect x="6" y="1" width="4" height="1" fill="#3a2a22" />
      <rect x="5" y="5" width="6" height="5" fill={body} />
      {kind === 'walk' ? <><rect x="4" y="10" width="3" height="5" fill="#2b2b3a" /><rect x="9" y="9" width="3" height="5" fill="#2b2b3a" /></> : <><rect x="5" y="10" width="2" height="5" fill="#2b2b3a" /><rect x="9" y="10" width="2" height="5" fill="#2b2b3a" /></>}
      {kind === 'lost' && <rect x="7" y="6" width="2" height="3" fill="#fff" />}
      {kind === 'saved' && <rect x="6" y="3" width="4" height="1" fill="#fff" />}
    </svg>
  );
}
