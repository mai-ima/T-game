import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameController } from '../engine/controller';
import { Sheet } from './Panels';
import { INFLUENCE } from './influence';
import type { StoryNode } from '../engine/types';

const CW = 142, CH = 56, GX = 22, GY = 34, LX = 118;

/** あらすじ分岐図：共通の一日から、午後の持ち場・週末へと分かれる大きな流れを一枚で見せる。未到達の場面はネタバレを避けて伏せる。 */
export function FlowPanel({ c }: { c: GameController }) {
  const w = c.world; const [tab, setTab] = useState<'map' | 'log' | 'graph'>('map'); const chap = c.story.chapters.find(x => x.id === (w.story.chapter === 'ch2' ? 'ch1' : w.story.chapter))!;
  const map = c.story.maps?.[chap.id]; const reveal = w.story.completedChapters.includes(chap.id); const vis = new Set(w.story.visited); const cur = w.story.node;
  return (
    <Sheet title={`分岐図　${chap.title}`} onClose={() => (c.panel = null, c.notify())} wide>
      <div className="tabs"><button className={tab === 'map' ? 'on' : ''} onClick={() => setTab('map')}>あらすじ分岐図</button><button className={tab === 'log' ? 'on' : ''} onClick={() => setTab('log')}>選んだ道の記録</button><button className={tab === 'graph' ? 'on' : ''} onClick={() => { c.panel = 'graph'; c.notify(); }}>詳細グラフ</button></div>
      {tab === 'map' && map && <MapView c={c} map={map} vis={vis} cur={cur} reveal={reveal} />}
      {tab === 'log' && <ChoiceLog c={c} chapId={chap.id} reveal={reveal} />}
    </Sheet>
  );
}

function MapView({ c, map, vis, cur, reveal }: { c: GameController; map: NonNullable<GameController['story']['maps']>[string]; vis: Set<string>; cur: string; reveal: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const seen = (n: typeof map.nodes[number]) => n.reveal.some(r => vis.has(r)); const here = (n: typeof map.nodes[number]) => n.reveal.includes(cur) || (n.choice === cur);
  const W = LX + (Math.max(...map.nodes.map(n => n.x)) + 1) * (CW + GX), H = map.lanes.length * (CH + GY) + 20; const pos = (n: typeof map.nodes[number]) => ({ x: LX + n.x * (CW + GX), y: 10 + n.lane * (CH + GY) });
  const byId = useMemo(() => new Map(map.nodes.map(n => [n.id, n])), [map]); const current = map.nodes.find(here);
  useEffect(() => { if (ref.current && current) ref.current.scrollLeft = Math.max(0, pos(current).x - 160); }, []); // eslint-disable-line
  const chosen = (n: typeof map.nodes[number]) => { if (!n.choice) return ''; const ch = c.world.story.choices.filter(x => x.node === n.choice).at(-1); const node = c.story.nodes[n.choice] as StoryNode | undefined; if (!ch || node?.type !== 'choice') return ''; const o = node.options.find(x => x.id === ch.option); return o ? c.textWorld(o.label).replace(/[「」]/g, '').slice(0, 22) + (o.label.length > 22 ? '…' : '') : ''; };
  return (
    <>
      <p className="small" style={{ marginTop: 0 }}>左から右へ時間が進みます。<b>★</b>は大きな選択。<span style={{ color: '#1a2f55' }}>■</span>通った場面　<span style={{ color: '#c8281e' }}>■</span>いまの場面　<span style={{ color: '#8c9196' }}>□</span>未到達（{reveal ? '章を終えたため表示' : 'ネタバレ防止のため伏せています'}）。選ばなかった道は、別の周回で遊べます。</p>
      <div className="mapwrap" ref={ref}><svg width={W} height={H} role="img" aria-label="あらすじ分岐図">
        {map.lanes.map((l, i) => <g key={l.id}><rect x="0" y={10 + i * (CH + GY) - 8} width={W} height={CH + 16} fill={i % 2 ? '#ece9dc' : '#f6f4ea'} /><rect x="0" y={10 + i * (CH + GY) - 8} width="6" height={CH + 16} fill={l.color} /><text x="14" y={10 + i * (CH + GY) + CH / 2 + 4} fontSize="12" fontWeight="700" fill={l.color}>{l.label}</text></g>)}
        {map.edges.map(([a, b]) => { const A = byId.get(a)!, B = byId.get(b)!; const pa = pos(A), pb = pos(B); const walked = seen(A) && seen(B); const show = walked || reveal || seen(A); const x1 = pa.x + CW, y1 = pa.y + CH / 2, x2 = pb.x, y2 = pb.y + CH / 2; const mx = (x1 + x2) / 2; return <path key={a + b} d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} fill="none" stroke={walked ? '#c8281e' : show ? '#9a9788' : '#d8d4c6'} strokeWidth={walked ? 4 : 2} strokeDasharray={walked ? '' : '6 5'} />; })}
        {map.nodes.map(n => { const p = pos(n); const s = seen(n); const hr = here(n); const show = s || reveal; const lane = map.lanes[n.lane]; const ch = chosen(n);
          return <g key={n.id} transform={`translate(${p.x} ${p.y})`}><title>{show ? `${n.label}：${n.sub ?? ''}` : '未到達の場面'}</title>
            <rect width={CW} height={CH} fill={s ? lane.color : show ? '#fff' : '#e3e0d2'} stroke={hr ? '#c8281e' : s ? '#15181d' : '#9a9788'} strokeWidth={hr ? 5 : 2} strokeDasharray={s ? '' : '5 4'} />
            {show ? <><text x="10" y="23" fontSize="14" fontWeight="700" fill={s ? '#fff' : '#15181d'}>{n.label}</text><text x="10" y="42" fontSize="11" fill={s ? '#e8ecf3' : '#4a4f56'}>{n.sub}</text></> : <text x={CW / 2} y={CH / 2 + 8} textAnchor="middle" fontSize="22" fill="#8c9196">？</text>}
            {n.star && <g transform={`translate(${CW - 14} -10)`}><circle r="13" fill="#f2c500" stroke="#15181d" strokeWidth="2" /><text y="5" textAnchor="middle" fontSize="15" fontWeight="900" fill="#15181d">★</text></g>}
            {hr && <text x={CW - 6} y={CH - 6} textAnchor="end" fontSize="10" fontWeight="700" fill="#fff" style={{ paintOrder: 'stroke' }} stroke="#c8281e" strokeWidth="3">いまここ</text>}
            {s && ch && <g transform={`translate(0 ${CH + 4})`}><rect width={CW} height="15" fill="#fff7c4" stroke="#8a6500" /><text x="4" y="11" fontSize="9.5" fill="#15181d">▶ {ch}</text></g>}
          </g>; })}
      </svg></div>
    </>
  );
}

function ChoiceLog({ c, chapId, reveal }: { c: GameController; chapId: string; reveal: boolean }) {
  const w = c.world; const nodes = Object.values(c.story.nodes).filter((n): n is Extract<StoryNode, { type: 'choice' }> => n.type === 'choice' && n.id.startsWith(chapId + '.') && !!n.important);
  return (
    <div>
      <p className="small" style={{ marginTop: 0 }}>大きな選択と、その結果です。選ばなかった選択肢は、章を終えると表示されます。</p>
      {nodes.map(n => { const ch = w.story.choices.filter(x => x.node === n.id).at(-1); const sel = ch ? n.options.find(o => o.id === ch.option) : undefined; const flags = sel ? (sel.effects ?? []).flatMap(e => ('set' in e ? [e.set] : [])).filter(f => INFLUENCE[f]) : [];
        return <div key={n.id} className="item" style={{ borderLeftColor: sel ? '#c8281e' : '#9a9788' }}><b>★ {c.textWorld(n.prompt)}</b>
          {sel ? <><div style={{ margin: '6px 0' }}>選んだ道：<b>{c.textWorld(sel.label)}</b>{ch?.timedOut && <span className="pill warn" style={{ marginLeft: 6 }}>時間切れ</span>}</div>{flags.map(f => <div key={f} className="small">→ {INFLUENCE[f]}</div>)}</> : <div className="small" style={{ margin: '6px 0' }}>まだ選んでいません。</div>}
          {reveal ? <div className="small">ほかの道：{n.options.filter(o => o.id !== sel?.id).map(o => c.textWorld(o.label).replace(/[「」]/g, '')).join(' ／ ')}</div> : <div className="small">ほかに {n.options.length - (sel ? 1 : 0)} 通りの道があります（章を終えると表示）。</div>}</div>; })}
    </div>
  );
}
