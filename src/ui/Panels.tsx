import { useMemo, useState } from 'react';
import type { GameController } from '../engine/controller';
import { DEPARTMENTS, transferEligibility, sampleRoster, validateRoster, CERT_NAME, TRAIN_NAME, EVAL_NAME } from '../engine/career';
import { EVAL_LABEL, overallRating, fmtTime, gameDate } from '../engine/worldState';
import { successors } from '../engine/storyLint';
import type { EvalKey, StoryNode } from '../engine/types';
import { RosterCalendar } from './Tasks';
import { Portrait } from './parts';
import { locales, setLocale, getLocale } from '../i18n';
import { MODES } from '../data/modes';
import auditReport from '../data/audit-report.json';

export function Sheet({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="sheet-bg" data-ui onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-label={title} style={wide ? { width: 'min(1100px,100%)' } : undefined}>
        <div className="sheet-h"><h2>{title}</h2><button className="btn sm" onClick={onClose}>閉じる</button></div>
        <div className="sheet-b">{children}</div>
      </div>
    </div>
  );
}

export function RosterPanel({ c }: { c: GameController }) {
  const w = c.world; const roster = useMemo(() => sampleRoster(), []); const today = w.clock.day; const shift = roster[today] ?? '日勤';
  const blocks = [{ a: 8 * 60 + 30, b: 9 * 60, t: '点呼', c: '#1a2f55' }, { a: 9 * 60, b: 12 * 60, t: '駅務・巡回', c: '#1b6f45' }, { a: 12 * 60, b: 12 * 60 + 45, t: '昼休憩', c: '#6b6f73' }, { a: 12 * 60 + 45, b: 16 * 60, t: '案内・設備確認', c: '#1b6f45' }, { a: 16 * 60, b: 17 * 60 + 15, t: '記録・面談', c: '#a35c00' }];
  const lo = 8 * 60, hi = 18 * 60; const pct = (m: number) => ((m - lo) / (hi - lo)) * 100; const issues = validateRoster(roster);
  return (
    <Sheet title="勤務表" onClose={() => (c.panel = null, c.notify())}>
      <p style={{ marginTop: 0 }}><b>{c.dateLabel}</b>　本日の勤務：<span className="pill warn">{shift}</span>　（8:30–17:15、休憩45分）</p>
      <div className="tl" aria-label="本日の予定">{blocks.map(b => <div key={b.t} className="blk" style={{ left: pct(b.a) + '%', width: pct(b.b) - pct(b.a) + '%', background: b.c }}>{b.t}</div>)}<div className="now" style={{ left: Math.max(0, Math.min(100, pct(w.clock.minute))) + '%' }} />{[9, 12, 15, 18].map(h => <span key={h} className="tk" style={{ left: pct(h * 60) + '%' }}>{h}:00</span>)}</div>
      <RosterCalendar roster={roster} startYear={c.story.startYear} today={today} />
      <p className="small">社内規程（架空）：連続勤務6日まで／勤務間インターバル11時間以上／4週で公休8日以上。判定：{issues.length === 0 ? '適合' : `${issues.length}件の指摘`}　早番 5:30–14:15／遅番 12:30–21:15／研修 9:00–17:00</p>
    </Sheet>
  );
}

const RATE_CLR: Record<string, string> = { A: '#14663f', B: '#1a4fa0', C: '#a35c00', D: '#c8281e' };
export function CareerPanel({ c }: { c: GameController }) {
  const w = c.world; const car = w.career; const { score, rating } = overallRating(car); const today = w.clock.day; const cur = car.assignments[car.assignments.length - 1];
  return (
    <Sheet title="経歴・評価・異動" onClose={() => (c.panel = null, c.notify())} wide>
      <div className="result-hero"><div className="rating" style={{ color: RATE_CLR[rating], borderColor: RATE_CLR[rating] }}>{rating}</div><div><b style={{ fontSize: '1.2em' }}>{w.playerName}</b><div className="small">社員番号 {car.employeeNo}／{car.track}／等級{car.grade}／入社 {gameDate(c.story.startYear, car.joinDay).label}</div><div className="small">総合評価点 {score}（参考値）／現所属：{cur ? `${DEPARTMENTS[cur.dept]?.name}・${cur.role}（${cur.site}）` : '未配属'}</div></div></div>
      <h3>勤務評価</h3>{(Object.keys(EVAL_LABEL) as EvalKey[]).map(k => <div className="bar" key={k}><span>{EVAL_LABEL[k]}</span><i><b style={{ width: car.evaluations[k] + '%' }} /></i><span>{Math.round(car.evaluations[k])}</span></div>)}
      <h3>研修・資格</h3><table className="tbl"><tbody>{Object.entries(TRAIN_NAME).map(([id, nm]) => { const t = car.trainings[id]; return <tr key={id}><td>{nm}</td><td><span className={'pill ' + (t?.done ? 'ok' : t?.progress ? 'warn' : 'off')}>{t?.done ? '修了' : t?.progress ? `進行中 ${t.progress}%` : '未受講'}</span></td></tr>; })}{Object.entries(CERT_NAME).map(([id, nm]) => <tr key={id}><td>資格：{nm}</td><td><span className={'pill ' + (car.certifications.some(x => x.id === id) ? 'ok' : 'off')}>{car.certifications.some(x => x.id === id) ? '取得' : '未取得'}</span></td></tr>)}</tbody></table>
      <h3>異動の可能性（社内規程・架空）</h3><p className="small" style={{ marginTop: 0 }}>希望しただけでは異動できません。在籍期間・資格・研修・評価・受入枠が条件です。</p>
      <table className="tbl"><thead><tr><th>部署</th><th>判定</th><th>不足している条件</th></tr></thead><tbody>{Object.entries(DEPARTMENTS).filter(([id]) => id !== cur?.dept).map(([id, d]) => { const e = transferEligibility(car, id, today); return <tr key={id}><td><b>{d.name}</b><div className="small">{d.desc}</div></td><td><span className={'pill ' + (e.eligible ? 'ok' : 'bad')}>{e.eligible ? '申請可' : '要件未達'}</span></td><td className="small">{e.gaps.join('／') || '—'}</td></tr>; })}</tbody></table>
      <h3>配属履歴</h3><ul className="small">{car.assignments.map((a, i) => <li key={i}>{gameDate(c.story.startYear, a.fromDay).label}〜 {DEPARTMENTS[a.dept]?.name}・{a.role}（{a.site}）</li>)}</ul>
      {car.applications.length > 0 && <><h3>異動希望の申告</h3><ul className="small">{car.applications.map((a, i) => <li key={i}>{DEPARTMENTS[a.dept]?.name}：{a.status}</li>)}</ul></>}
    </Sheet>
  );
}

export function RelationsPanel({ c }: { c: GameController }) {
  const w = c.world; const ids = Object.keys(w.relationships).filter(k => w.relationships[k].met && c.story.characters[k]);
  const R = 120, cx = 220, cy = 160;
  return (
    <Sheet title="人物関係" onClose={() => (c.panel = null, c.notify())}>
      {ids.length === 0 ? <p className="small">まだ誰とも関係が記録されていません。</p> : <>
        <svg className="rel-svg" viewBox="0 0 440 320" role="img" aria-label="人物相関図"><circle cx={cx} cy={cy} r="26" fill="#fff" stroke="#c8281e" strokeWidth="3" /><text x={cx} y={cy + 4} textAnchor="middle" fill="#15181d" fontSize="11">{w.playerName.slice(0, 5)}</text>
          {ids.map((id, i) => { const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2; const x = cx + Math.cos(a) * R * 1.45, y = cy + Math.sin(a) * R * 0.95; const r = w.relationships[id]; const def = c.story.characters[id]; return <g key={id}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={r.trust >= 0 ? '#1b6f45' : '#c8281e'} strokeWidth={1 + Math.abs(r.trust) * 0.7} opacity=".8" strokeDasharray={r.rapport > 3 ? '' : '4 4'} />
            <circle cx={x} cy={y} r="22" fill="#fff" stroke="#1a2f55" strokeWidth="2" /><foreignObject x={x - 20} y={y - 20} width="40" height="40"><div style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden' }}><Portrait def={def} size={40} /></div></foreignObject>
            <text x={x} y={y + 36} textAnchor="middle" fill="#15181d" fontSize="11">{def.name}</text></g>; })}
        </svg>
        <table className="tbl"><thead><tr><th>人物</th><th>信頼</th><th>親しさ</th><th>メモ</th></tr></thead><tbody>{ids.map(id => { const r = w.relationships[id]; const d = c.story.characters[id]; return <tr key={id}><td><b>{d.name}</b><div className="small">{d.role}</div></td><td><Meter v={r.trust} min={-5} max={10} /></td><td><Meter v={r.rapport} min={0} max={10} /></td><td className="small">{r.notes.join(' ') || d.trait}</td></tr>; })}</tbody></table></>}
    </Sheet>
  );
}
function Meter({ v, min, max }: { v: number; min: number; max: number }) { const n = Math.max(0, Math.round(v)); return <span className={'meter' + (v < 0 ? ' neg' : '')} title={String(v)}>{Array.from({ length: Math.min(10, max) }, (_, i) => <i key={i} className={(v < 0 ? i < Math.min(5, -v) : i < n) ? 'on' : ''} />)}<span className="small" style={{ marginLeft: 6 }}>{v}</span></span>; }

export function TimelinePanel({ c }: { c: GameController }) {
  const w = c.world; const [tab, setTab] = useState('tl'); const items = tab === 'tl' ? w.timeline : w.log; const g = (d: number) => gameDate(c.story.startYear, d).label;
  return (
    <Sheet title="年表・業務日誌" onClose={() => (c.panel = null, c.notify())}>
      <div className="tabs"><button className={tab === 'tl' ? 'on' : ''} onClick={() => setTab('tl')}>年表</button><button className={tab === 'log' ? 'on' : ''} onClick={() => setTab('log')}>業務日誌・選択履歴</button><button className={tab === 'bl' ? 'on' : ''} onClick={() => setTab('bl')}>会話ログ</button></div>
      {tab === 'bl' ? <div className="small">{c.backlog.slice(-40).map((b, i) => <p key={i} style={{ margin: '4px 0' }}><b>{b.who}</b> {b.text}</p>)}</div>
        : <table className="tbl"><tbody>{items.length === 0 && <tr><td className="small">記録はまだありません。</td></tr>}{items.map((e, i) => <tr key={i}><td className="small" style={{ whiteSpace: 'nowrap' }}>{g(e.day)} {fmtTime(e.minute)}</td><td>{e.text}{e.tag === 'choice' && <span className="pill warn" style={{ marginLeft: 6 }}>選択</span>}</td></tr>)}</tbody></table>}
    </Sheet>
  );
}

/** 章別の分岐フローチャート：未到達ノードは章終了までネタバレ防止のため「？」表示 */
export function GraphPanel({ c }: { c: GameController }) {
  const w = c.world; const chap = c.story.chapters.find(x => x.id === w.story.chapter)!; const prefix = chap.id + '.'; const reveal = w.story.completedChapters.includes(chap.id);
  const layout = useMemo(() => {
    const nodes = Object.values(c.story.nodes).filter(n => n.id.startsWith(prefix)); const byId = new Map(nodes.map(n => [n.id, n])); const depth = new Map<string, number>(); const q: string[] = [chap.start]; depth.set(chap.start, 0);
    while (q.length) { const id = q.shift()!; const n = byId.get(id); if (!n) continue; for (const s of successors(n)) if (byId.has(s) && !depth.has(s)) { depth.set(s, depth.get(id)! + 1); q.push(s); } }
    const cols = new Map<number, StoryNode[]>(); for (const n of nodes) { const d = depth.get(n.id) ?? 0; (cols.get(d) ?? cols.set(d, []).get(d)!).push(n); }
    const pos = new Map<string, { x: number; y: number }>(); const maxD = Math.max(...cols.keys()); let maxRows = 0;
    for (const [d, list] of cols) { maxRows = Math.max(maxRows, list.length); list.forEach((n, i) => pos.set(n.id, { x: 40 + d * 74, y: 30 + i * 34 })); }
    return { nodes, pos, width: 80 + (maxD + 1) * 74, height: 60 + maxRows * 34, byId };
  }, [c.story, prefix, chap.start]);
  const vis = new Set(w.story.visited); const chosen = new Set(w.story.choices.map(x => x.node + '>' + x.option));
  return (
    <Sheet title={`詳細グラフ：${chap.title}`} onClose={() => (c.panel = null, c.notify())} wide>
      <p className="small" style={{ marginTop: 0 }}>● 到達済み　○ 未到達（{reveal ? '章を終えたため表示' : 'ネタバレ防止のため伏せています'}）　◆ 選択肢　★ 重要な選択　■ 場面（ハブ）</p>
      <div className="flow-wrap"><svg width={layout.width} height={layout.height} role="img" aria-label="分岐フローチャート">
        {layout.nodes.flatMap(n => successors(n).filter(s => layout.pos.has(s) && s !== n.id).map(s => { const a = layout.pos.get(n.id)!, b = layout.pos.get(s)!; const walked = vis.has(n.id) && vis.has(s); const show = walked || reveal; return show ? <line key={n.id + s} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={walked ? '#c8281e' : '#a9a595'} strokeWidth={walked ? 1.8 : 1} opacity={b.x < a.x ? 0.25 : 0.9} /> : null; }))}
        {layout.nodes.map(n => { const p = layout.pos.get(n.id)!; const seen = vis.has(n.id); const show = seen || reveal; const isChoice = n.type === 'choice'; const imp = isChoice && n.important; const fill = seen ? (imp ? '#f2c500' : n.type === 'hub' ? '#1b6f45' : n.type === 'end' ? '#c8281e' : '#1a2f55') : '#e3e0d2';
          return <g key={n.id}><title>{show ? (n.type === 'choice' ? n.prompt : n.type === 'line' ? n.lines[0].text.slice(0, 40) : n.id) : '未到達'}</title>
            {isChoice ? <rect x={p.x - 8} y={p.y - 8} width="16" height="16" transform={`rotate(45 ${p.x} ${p.y})`} fill={fill} stroke={imp ? '#15181d' : '#6b6f73'} /> : n.type === 'hub' ? <rect x={p.x - 9} y={p.y - 9} width="18" height="18" fill={fill} stroke="#6b6f73" /> : <circle cx={p.x} cy={p.y} r="7" fill={fill} stroke="#6b6f73" />}
            {imp && <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill="#15181d">★</text>}{!show && <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="9" fill="#8c9196">?</text>}
            {isChoice && seen && n.options.map((o, i) => chosen.has(n.id + '>' + o.id) ? <circle key={o.id} cx={p.x + 12 + i * 4} cy={p.y - 10} r="2.5" fill="#14663f" /> : null)}</g>; })}
      </svg></div>
      <p className="small">選択した分岐は緑の点で示されます。到達ノード {w.story.visited.filter(x => x.startsWith(prefix)).length}／{layout.nodes.length}。</p>
    </Sheet>
  );
}

export function SavePanel({ c, onRefresh }: { c: GameController; onRefresh?: () => void }) {
  const [slots, setSlots] = useState<Record<string, any>>({}); const [text, setText] = useState(''); const [slot, setSlot] = useState('1'); const [tick, setTick] = useState(0);
  useMemo(() => { c.saves.list(c.mode).then(s => setSlots(s)); }, [c, tick]); const refresh = () => { setTick(t => t + 1); onRefresh?.(); };
  const label = (s: string) => (s === 'auto' ? 'オートセーブ' : `スロット${s}`);
  return (
    <Sheet title="セーブ／ロード" onClose={() => (c.panel = null, c.notify())}>
      <p className="small" style={{ marginTop: 0 }}>モード {c.mode} の独立セーブ領域（保存先：{c.storageKind === 'indexeddb' ? 'IndexedDB' : 'メモリ（この環境では永続化できません。書き出しでバックアップしてください）'}）</p>
      <div className="slots">{['auto', '1', '2', '3'].map(s => { const f = slots[s]; return (
        <div className="slot" key={s}><div className="meta"><b>{label(s)}</b><span>{f === 'corrupt' ? '破損データ' : f ? `${f.summary.chapterTitle}／${f.summary.dayLabel}／プレイ ${Math.round(f.playtimeSec / 60)}分` : '空き'}</span></div>
          <div className="acts">{s !== 'auto' && <button className="btn sm primary" onClick={async () => { await c.saveSlot(s); refresh(); }}>保存</button>}<button className="btn sm" disabled={!f || f === 'corrupt'} onClick={async () => { if (await c.loadSlot(s)) { c.panel = null; c.notify(); } }}>読込</button><button className="btn sm danger" disabled={!f} onClick={async () => { await c.saves.remove(c.mode, s); refresh(); }}>削除</button></div></div>); })}</div>
      <h3>バックアップ（書き出し／読み込み）</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}><select aria-label="対象スロット" value={slot} onChange={e => setSlot(e.target.value)} style={{ width: 'auto' }}>{['auto', '1', '2', '3'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
        <button className="btn sm" onClick={async () => { try { const t = await c.saves.exportText(c.mode, slot); setText(t); try { await navigator.clipboard.writeText(t); c.say('コピーしました'); } catch { c.say('テキストを選択してコピーしてください'); } } catch (e) { c.say((e as Error).message); } }}>セーブを書き出す</button>
        <button className="btn sm" onClick={async () => { try { await c.saves.importText(c.mode, slot, text); c.say('読み込みました'); refresh(); } catch (e) { c.say('読み込めません：' + (e as Error).message); } }}>セーブを取り込む</button></div>
      <textarea aria-label="セーブデータ文字列" value={text} onChange={e => setText(e.target.value)} placeholder="書き出した文字列をここに貼り付けて取り込みます" />
    </Sheet>
  );
}

export function SettingsPanel({ c, onClose }: { c: GameController; onClose: () => void }) {
  const s = c.settings; const [, force] = useState(0); const set = (p: Partial<typeof s>) => { c.setSettings(p); force(x => x + 1); };
  const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, alignItems: 'center', margin: '10px 0' }}><label>{l}</label><div>{children}</div></div>;
  return (
    <Sheet title="設定" onClose={onClose}>
      <Row l="描画品質"><select value={s.quality} onChange={e => set({ quality: e.target.value as any })}><option value="high">最高（影・環境反射・全ディテール）</option><option value="medium">標準（小部品を一部省略）</option><option value="low">最低（影なし・低解像度）</option></select></Row>
      <Row l="自動品質調整"><label><input type="checkbox" checked={s.autoQuality} onChange={e => set({ autoQuality: e.target.checked })} /> FPSが低いとき自動で下げる</label></Row>
      <Row l="表示方式"><div className="seg">{(['3d', '25d', '2d'] as const).map(v => <button key={v} className={s.view === v ? 'on' : ''} onClick={() => set({ view: v })}>{v === '3d' ? '3D' : v === '25d' ? '擬似3D' : '2D'}</button>)}</div></Row>
      <Row l="文字送り"><select value={s.textSpeed} onChange={e => set({ textSpeed: e.target.value as any })}><option value="slow">ゆっくり</option><option value="normal">標準</option><option value="fast">はやい</option></select></Row>
      <Row l="文字サイズ"><input type="range" min="0.9" max="1.4" step="0.05" value={s.fontScale} onChange={e => { set({ fontScale: +e.target.value }); document.documentElement.style.setProperty('--fs', String(e.target.value)); }} aria-label="文字サイズ" /></Row>
      <Row l="時間制限選択"><label><input type="checkbox" checked={s.timeLimits} onChange={e => set({ timeLimits: e.target.checked })} /> 制限時間つきの選択を有効にする（無効で制限なし）</label></Row>
      <Row l="業務時計"><label><input type="checkbox" checked={s.clockRunning} onChange={e => set({ clockRunning: e.target.checked })} /> 歩行中も時間が進む（1ゲーム内分＝6秒）</label></Row>
      <Row l="字幕"><label><input type="checkbox" checked={s.subtitles} onChange={e => set({ subtitles: e.target.checked })} /> 構内放送・通知音を字幕表示</label></Row>
      <Row l="音量（全体）"><input type="range" min="0" max="1" step="0.05" value={s.master} onChange={e => set({ master: +e.target.value })} aria-label="全体音量" /></Row>
      <Row l="音楽"><input type="range" min="0" max="1" step="0.05" value={s.music} onChange={e => set({ music: +e.target.value })} aria-label="音楽の音量" /></Row>
      <Row l="効果音"><input type="range" min="0" max="1" step="0.05" value={s.sfx} onChange={e => set({ sfx: +e.target.value })} aria-label="効果音量" /></Row>
      <Row l="環境音"><input type="range" min="0" max="1" step="0.05" value={s.ambient} onChange={e => set({ ambient: +e.target.value })} aria-label="環境音量" /></Row>
      <Row l="消音"><label><input type="checkbox" checked={s.muted} onChange={e => set({ muted: e.target.checked })} /> すべての音を消す</label></Row>
      <Row l="言語"><select value={getLocale()} onChange={e => { setLocale(e.target.value as any); force(x => x + 1); }}>{locales.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select></Row>
      <p className="small">音はすべて独自合成（Web Audio API）で、実車の録音ではありません。</p>
    </Sheet>
  );
}

export function StatusPanel({ onClose }: { onClose: () => void }) {
  const r = auditReport as any;
  const cls = (s: string) => s === 'PASS' ? 'ok' : s === 'FAIL' ? 'bad' : 'warn';
  return (
    <Sheet title="開発状況（検証結果：PASS／FAIL／UNVERIFIED）" onClose={onClose} wide>
      <p className="small" style={{ marginTop: 0 }}>{r.generatedAt ? `最終監査：${r.generatedAt}　環境：${r.env}` : '監査レポートはまだ生成されていません。'}　未検証・未実装を完成済みとして扱いません。</p>
      <table className="tbl"><thead><tr><th>項目</th><th>判定</th><th>根拠・備考</th></tr></thead><tbody>{(r.items ?? []).map((i: any, k: number) => <tr key={k}><td>{i.name}</td><td><span className={'pill ' + cls(i.status)}>{i.status}</span></td><td className="small">{i.note}</td></tr>)}</tbody></table>
      <h3>実装範囲</h3><ul className="small"><li>プレイ可能：R7「配属先は、明日変わる」第1章（完成）／第2章冒頭（体験版）、R8「消えた引継ぎ帳」第1章「白紙の一頁」（完成）</li><li>共通エンジン：ストーリーグラフ・世界状態・キャリア・勤務表・セーブ・音響・品質・3D/2.5D/2D描画</li><li>未実装：{MODES.filter(m => m.status !== 'playable').map(m => m.id).join('、')}（設計のみ）／R7第3章以降・R8第2章以降／313系運転シミュレーター等</li></ul>
    </Sheet>
  );
}
