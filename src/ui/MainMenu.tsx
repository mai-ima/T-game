import { useEffect, useState } from 'react';
import type { GameController } from '../engine/controller';
import { MODES, type ModeDef } from '../data/modes';
import type { SaveFile } from '../engine/save';
import { SettingsPanel, StatusPanel } from './Panels';
import { fmtMinSafe } from './util';

type Slots = Record<string, SaveFile | 'corrupt' | undefined>;

export function MainMenu({ c, onStart }: { c: GameController; onStart: () => void }) {
  const [sel, setSel] = useState<ModeDef | null>(null); const [settings, setSettings] = useState(false); const [status, setStatus] = useState(false);
  const rail = MODES.filter(m => m.group === 'rail'), road = MODES.filter(m => m.group === 'road'); const rows = c.rail.board(8 * 60 + 20, 'B').concat(c.rail.board(8 * 60 + 20, 'A'));
  const impl = MODES.filter(m => m.status === 'playable').length;
  return (
    <div className="menu">
      <div className="menu-in">
        <div className="brand">
          <div><h1>REAL <b>RAIL</b> &amp; <b>ROAD</b></h1><p>鉄道・自動車 統合シミュレーション ／ 14モード・12本の長編職業ドラマ（企画）</p></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="pill warn">プロトタイプ（Claude Artifacts版）</span><button className="btn sm" onClick={() => { c.audio.ui('click'); setStatus(true); }}>検証状況</button><button className="btn sm" onClick={() => setSettings(true)}>設定</button></div>
        </div>
        <div className="board-strip" aria-label="実装状況">プレイ可能 {impl}/14　┃　R7 第1章 ◀ 実装済み　┃　R7 第2章 冒頭のみ（体験版）　┃　<span className="d">その他13モード 未実装（設計のみ）</span>　┃　{rows.slice(0, 2).map(r => `${r.line}番線 ${r.time} ${r.kind} ${r.dest}`).join('　')}</div>

        <div className="sect-h">鉄道モード <small>R1〜R11（R4のみ自由モード）</small></div>
        <div className="grid">{rail.map(m => <ModeCard key={m.id} m={m} c={c} onClick={() => { c.audio.ui('click'); setSel(m); }} />)}</div>
        <div className="sect-h">自動車モード <small>C1〜C3（C3のみ自由モード）</small></div>
        <div className="grid">{road.map(m => <ModeCard key={m.id} m={m} c={c} onClick={() => { c.audio.ui('click'); setSel(m); }} />)}</div>
        <p className="small" style={{ marginTop: 22 }}>実在車両・路線は参考にした架空設計です。音はすべて独自合成。プロトタイプはClaude Artifacts専用で、Vercelには公開していません。</p>
      </div>
      {sel && <ModeModal m={sel} c={c} onClose={() => setSel(null)} onStart={() => { setSel(null); onStart(); }} />}
      {settings && <SettingsPanel c={c} onClose={() => setSettings(false)} />}
      {status && <StatusPanel onClose={() => setStatus(false)} />}
    </div>
  );
}

function ModeCard({ m, onClick }: { m: ModeDef; c: GameController; onClick: () => void }) {
  const playable = m.status === 'playable';
  return (
    <button className={'card' + (playable ? ' playable' : ' dim')} onClick={onClick} aria-label={`${m.id} ${m.name} ${playable ? 'プレイ可能' : '未実装'}`}>
      <div className="row"><span className="id">{m.id}</span>{playable ? <span className="pill warn">プレイ可能</span> : <span className="pill off">未実装</span>}</div>
      <h3>{m.name}</h3><p>{m.tagline}</p>
      <div className="row"><span className="small">{m.kind === 'free' ? '自由モード' : 'ストーリー'}{m.management ? '・経営あり' : ''}</span>{playable && <span className="small" style={{ color: 'var(--amber)' }}>第1章</span>}</div>
    </button>
  );
}

function ModeModal({ m, c, onClose, onStart }: { m: ModeDef; c: GameController; onClose: () => void; onStart: () => void }) {
  const playable = m.status === 'playable'; const [slots, setSlots] = useState<Slots>({}); const [name, setName] = useState('水野 湊'); const [busy, setBusy] = useState(false);
  useEffect(() => { c.saves.list(m.id).then(setSlots); }, [c, m.id]);
  const latest = Object.values(slots).filter((x): x is SaveFile => !!x && x !== 'corrupt').sort((a, b) => b.savedAt - a.savedAt)[0];
  const startAudio = () => c.audio.start();
  const label = (s: string) => (s === 'auto' ? 'オートセーブ' : `スロット${s}`);
  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-label={m.name}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><span className="pill warn">{m.id}</span> {playable ? <span className="pill ok">プレイ可能</span> : <span className="pill off">未実装（設計のみ）</span>}<h2 style={{ marginTop: 8 }}>{m.name}</h2></div><button className="btn sm" onClick={onClose}>閉じる</button></div>
        <p className="sub">{m.tagline}</p>
        <dl className="kv"><dt>核となるプレイ</dt><dd>{m.core}</dd><dt>経営操作</dt><dd>{m.management ? 'あり（このモードの中で独立）' : 'なし'}</dd><dt>独立セーブ領域</dt><dd>save:{m.id}:*（他モードとは共有しません）</dd>{m.seasons && <><dt>最終計画</dt><dd>{m.seasons}</dd></>}{m.playableScope && <><dt>実装範囲</dt><dd>{m.playableScope}</dd></>}</dl>
        {!playable ? <p className="item" style={{ borderColor: 'var(--amber)' }}>{`このモードはまだプレイできません。仕様として保持されており、共通エンジン（ストーリーグラフ・世界状態・セーブ・描画）の上に順次追加していきます。`}</p> : <>
          <h3 style={{ margin: '14px 0 6px' }}>セーブスロット</h3>
          <div className="slots">{['auto', '1', '2', '3'].map(s => { const f = slots[s]; return <div key={s} className="slot"><div className="meta"><b>{label(s)}</b><span>{f === 'corrupt' ? '破損データ' : f ? `${f.summary.chapterTitle}／${f.summary.dayLabel}／プレイ${Math.round(f.playtimeSec / 60)}分` : '空き'}</span></div><div className="acts"><button className="btn sm primary" disabled={!f || f === 'corrupt' || busy} onClick={async () => { setBusy(true); startAudio(); if (await c.loadSlot(s)) onStart(); setBusy(false); }}>続きから</button></div></div>; })}</div>
          <div style={{ display: 'grid', gap: 8, margin: '14px 0 4px' }}>
            <label htmlFor="pname">あなたの名前（作中で使われます）</label><input id="pname" type="text" value={name} maxLength={12} onChange={e => setName(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {latest && <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); startAudio(); const slot = latest.slot; if (await c.loadSlot(slot)) onStart(); setBusy(false); }}>最新のセーブから続ける（{fmtMinSafe(latest.savedAt)}）</button>}
              <button className={'btn' + (latest ? '' : ' primary')} disabled={busy} onClick={() => { startAudio(); c.newGame(name); onStart(); }}>最初から（第1章）</button>
            </div>
            <p className="small">表示方式は3D／擬似3D／2Dを切り替えられます。iPhoneでは画面左下のスティックで歩き、画面ドラッグで視点を動かします。</p>
          </div></>}
      </div>
    </div>
  );
}
