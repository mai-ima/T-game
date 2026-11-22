import { useMemo, useState } from 'react';
import type { TaskNode, WorldState } from '../engine/types';
import { SHIFT_TIME, sampleRoster, validateRoster, type Shift } from '../engine/career';
import { gameDate, fmtTime } from '../engine/worldState';
import type { RailSim } from '../engine/railSim';

type Done = (score: number) => void;

export function TaskShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="sheet-bg" data-ui>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-h"><h2>{title}</h2></div>
        <div className="sheet-b">{intro && <p className="small" style={{ marginTop: 0 }}>{intro}</p>}{children}</div>
      </div>
    </div>
  );
}

export function ChecklistTask({ node, onDone }: { node: TaskNode; onDone: Done }) {
  const items = node.items ?? []; const [ans, setAns] = useState<Record<string, 'ok' | 'ng'>>({}); const [fin, setFin] = useState(false);
  const score = Math.round((items.filter(i => ans[i.id] === i.truth).length / items.length) * 100);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      {items.map(i => (
        <div key={i.id} className={'item' + (fin ? (ans[i.id] === i.truth ? ' ok' : ' ng') : '')}>
          <div>{i.label}</div>
          <div className="tgl">{(['ok', 'ng'] as const).map(v => <button key={v} disabled={fin} className={'btn sm' + (ans[i.id] === v ? ' on' : '')} onClick={() => setAns(a => ({ ...a, [i.id]: v }))}>{v === 'ok' ? '正常' : '異常'}</button>)}</div>
          {fin && <div className="why">{ans[i.id] === i.truth ? '○ 正解。' : `× 正しくは「${i.truth === 'ok' ? '正常' : '異常'}」。`}{i.why}</div>}
        </div>
      ))}
      {!fin ? <button className="btn primary" disabled={Object.keys(ans).length < items.length} onClick={() => setFin(true)}>判定する（{Object.keys(ans).length}/{items.length}）</button>
        : <div><p><b>正答率 {score}%</b></p><button className="btn primary" onClick={() => onDone(score)}>報告して戻る</button></div>}
    </TaskShell>
  );
}

export function ComposeTask({ node, onDone }: { node: TaskNode; onDone: Done }) {
  const slots = node.slots ?? []; const [pick, setPick] = useState<Record<string, string>>({}); const [fin, setFin] = useState(false);
  const good = slots.filter(s => s.options.find(o => o.id === pick[s.id])?.good).length; const score = Math.round((good / slots.length) * 100);
  const assembled = slots.map(s => s.options.find(o => o.id === pick[s.id])?.text).filter(Boolean).join('');
  return (
    <TaskShell title={node.title} intro={node.intro}>
      {slots.map(s => (
        <div key={s.id} className="item"><b>{s.label}</b>
          <div className="opts">{s.options.map(o => <label key={o.id} className={pick[s.id] === o.id ? 'on' : ''}><input type="radio" name={s.id} disabled={fin} checked={pick[s.id] === o.id} onChange={() => setPick(p => ({ ...p, [s.id]: o.id }))} /><span>{o.text}{fin && pick[s.id] === o.id && <span className="small"> — {o.good ? '○ ' : '× '}{o.why}</span>}</span></label>)}</div>
        </div>
      ))}
      <div className="term" style={{ margin: '10px 0' }}>【構内放送（案）】{assembled || '（未選択）'}</div>
      {!fin ? <button className="btn primary" disabled={Object.keys(pick).length < slots.length} onClick={() => setFin(true)}>放送文を確定する</button>
        : <div><p><b>適切な項目 {good}/{slots.length}</b></p><button className="btn primary" onClick={() => onDone(score)}>放送して戻る</button></div>}
    </TaskShell>
  );
}

export function TerminalTask({ node, onDone, rail, minute }: { node: TaskNode; onDone: Done; rail: RailSim; minute: number }) {
  const [tab, setTab] = useState('ops'); const [seen, setSeen] = useState<Set<string>>(new Set(['ops'])); const [ack, setAck] = useState<Record<string, boolean>>({});
  const rows = rail.board(minute); const sel = (t: string) => { setTab(t); setSeen(s => new Set(s).add(t)); };
  const handover = [{ id: 'h1', t: '券売機2号機：紙幣の通りが悪い（前日夜勤より）' }, { id: 'h2', t: '時刻表の掲示差替え：ダイヤ改正前の版が一部残っている可能性' }, { id: 'h3', t: 'ホームベンチ：座面のぐらつきを確認（要修繕依頼）' }];
  const score = seen.size >= 3 && handover.every(h => ack[h.id]) ? 100 : seen.size >= 2 ? 50 : 0;
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="tabs" role="tablist">{[['ops', '運行情報'], ['handover', '引継ぎ'], ['equipment', '設備状態']].map(([id, l]) => <button key={id} role="tab" className={tab === id ? 'on' : ''} onClick={() => sel(id)}>{l}{seen.has(id) && id !== tab ? ' ✓' : ''}</button>)}</div>
      {tab === 'ops' && <div className="term"><table><thead><tr><th>線</th><th>発車</th><th>種別</th><th>行先</th><th>状況</th></tr></thead><tbody>{rows.map((r, i) => <tr key={i} className={r.delayed ? 'd' : ''}><td>{r.line}</td><td>{r.time}</td><td>{r.kind}</td><td>{r.dest}</td><td>{r.status}</td></tr>)}</tbody></table>
        <p className="w" style={{ whiteSpace: 'normal' }}>▼ 確定していること／見込みの区別<br />・確定：列車の在線・定刻の時刻。　・見込み：遅れ時分や回復時刻（変更される場合があります）。</p></div>}
      {tab === 'handover' && <div>{handover.map(h => <label key={h.id} className="item" style={{ display: 'flex', gap: 10 }}><input type="checkbox" checked={!!ack[h.id]} onChange={e => setAck(a => ({ ...a, [h.id]: e.target.checked }))} /><span>{h.t}</span></label>)}<p className="small">全項目を確認済みにしてください。</p></div>}
      {tab === 'equipment' && <div className="term"><table><tbody>{[['券売機1号機', '正常'], ['券売機2号機', '要確認（紙幣部）'], ['券売機3号機', '正常'], ['自動改札機 1〜8', '正常'], ['発車標', '正常'], ['エレベーター', '正常'], ['AED', '正常（期限 2027/07）']].map(([a, b]) => <tr key={a} className={b.startsWith('要') ? 'w' : ''}><td>{a}</td><td>{b}</td></tr>)}</tbody></table></div>}
      <p className="small">※ 架空の業務画面です。実在の運行管理・保安システムの操作手順は再現していません。</p>
      <button className="btn primary" onClick={() => onDone(score)}>確認を完了する（{seen.size}/3画面確認）</button>
    </TaskShell>
  );
}

const SHIFT_CLR: Record<string, string> = { '日勤': '日勤', '早番': '早番', '遅番': '遅番', '公休': '公休', '研修': '研修', '宿直': '日勤', '明け': '公休', '有休': '公休' };
export function RosterCalendar({ roster, startYear, today, picks, onPick, mark }: { roster: Shift[]; startYear: number; today: number; picks?: number[]; onPick?: (d: number) => void; mark?: Record<number, 'ok' | 'ng'> }) {
  const first = gameDate(startYear, 0); const dowNames = ['日', '月', '火', '水', '木', '金', '土']; const offset = dowNames.indexOf(first.wd);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...roster.map((_, i) => i)];
  return (
    <div className="cal" role="grid" aria-label="4週間の勤務表">
      {dowNames.map((d, i) => <div key={d} className={'dow' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}>{d}</div>)}
      {cells.map((d, i) => d === null ? <div key={'e' + i} /> : (() => { const g = gameDate(startYear, d); const s = roster[d]; const tm = SHIFT_TIME[s]; return (
        <button key={d} className={`day ${SHIFT_CLR[s]}${d === today ? ' today' : ''}${picks?.includes(d) ? ' pick' : ''}${mark?.[d] ? ' ' + mark[d] : ''}`} disabled={!onPick} onClick={() => onPick?.(d)} aria-label={`${g.m}月${g.d}日 ${s}`} style={{ cursor: onPick ? 'pointer' : 'default' }}>
          <span className="n">{g.m}/{g.d}</span><span className="s">{s}</span><span className="t">{tm ? `${fmtTime(tm[0] % 1440)}-${fmtTime(tm[1] % 1440)}` : ''}</span></button>); })())}
    </div>
  );
}

export function RosterTask({ node, onDone, world, startYear }: { node: TaskNode; onDone: Done; world: WorldState; startYear: number }) {
  const roster = useMemo(() => sampleRoster(), []); const targets = (node.config?.targets ?? []) as { day: number; label: string }[];
  const [picks, setPicks] = useState<Record<number, number>>({}); const [sel, setSel] = useState(0); const [fin, setFin] = useState(false);
  const onPick = (d: number) => { if (fin) return; setPicks(p => ({ ...p, [sel]: d })); };
  const score = Math.round((targets.filter((t, i) => picks[i] === t.day).length / targets.length) * 100);
  const mark: Record<number, 'ok' | 'ng'> = {}; if (fin) targets.forEach((t, i) => { mark[t.day] = 'ok'; if (picks[i] !== undefined && picks[i] !== t.day) mark[picks[i]] = 'ng'; });
  const issues = validateRoster(roster);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="tabs">{targets.map((t, i) => <button key={i} className={sel === i ? 'on' : ''} onClick={() => setSel(i)}>{t.label}{picks[i] !== undefined ? `：${gameDate(startYear, picks[i]).m}/${gameDate(startYear, picks[i]).d}` : ''}</button>)}</div>
      <RosterCalendar roster={roster} startYear={startYear} today={world.clock.day} picks={Object.values(picks)} onPick={onPick} mark={mark} />
      <p className="small">社内規程（架空）：連続勤務は6日まで／勤務間インターバル11時間以上／4週で公休8日以上。→ {issues.length === 0 ? '問題なし' : `${issues.length}件の指摘`}</p>
      {!fin ? <button className="btn primary" disabled={Object.keys(picks).length < targets.length} onClick={() => setFin(true)}>確認結果を提出する</button>
        : <div><p><b>{score === 100 ? '正解です。' : '日付に誤りがあります。正しい日が緑で表示されています。'}</b></p><button className="btn primary" onClick={() => onDone(score)}>戻る</button></div>}
    </TaskShell>
  );
}
