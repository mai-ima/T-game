import { useEffect, useState } from 'react';
import type { GameController } from '../engine/controller';
import { MODES, type ModeDef } from '../data/modes';
import type { SaveFile } from '../engine/save';
import { SettingsPanel, StatusPanel } from './Panels';
import { fmtMinSafe } from './util';
import heroUrl from '../assets/hero.jpg';
import { Icon } from './icons';

type Slots = Record<string, SaveFile | 'corrupt' | undefined>;

export function MainMenu({ c, onStart }: { c: GameController; onStart: () => void }) {
  const [sel, setSel] = useState<ModeDef | null>(null); const [settings, setSettings] = useState(false); const [status, setStatus] = useState(false);
  const rail = MODES.filter(m => m.group === 'rail'), road = MODES.filter(m => m.group === 'road'); const rows = c.rail.board(8 * 60 + 20, 'A').concat(c.rail.board(8 * 60 + 20, 'B'));
  const impl = MODES.filter(m => m.status === 'playable').length;
  const open = (m: ModeDef) => { c.audio.ui('click'); setSel(m); };
  return (
    <div className="menu" onPointerDown={() => { if (!c.audio.started) c.audio.start().then(() => c.audio.playMusic('menu')); else c.audio.playMusic('menu'); }}>
      <div className="menu-in">
        <div className="hero" style={{ backgroundImage: `url(${heroUrl})` }} role="img" aria-label="青嶺中央駅（架空）に停車する313系参考の電車">
          <div className="hero-tools"><button className="btn sm" onClick={() => { c.audio.ui('click'); setStatus(true); }}>検証状況</button><button className="btn sm" onClick={() => setSettings(true)}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icon.gear />設定</span></button></div>
          <div className="nameplate"><div className="band" /><div className="in"><h1>REAL RAIL &amp; ROAD</h1><p>鉄道・自動車 統合シミュレーション　プロトタイプ（Claude Artifacts 版）</p></div></div>
        </div>
        <div className="board-strip" aria-label="実装状況">プレイ可能 {impl}/14　R7 第1章 実装済み・第2章 冒頭のみ（体験版）　R8 第1章 実装済み　<span className="d">そのほか{14 - impl}モード 未実装（設計のみ）</span>　{rows.slice(0, 3).map(r => `${r.line}番線 ${r.time} ${r.kind} ${r.dest}`).join('　')}</div>

        <div className="sect-h"><span>鉄道モード</span><small>R1〜R11（R4のみ自由モード）</small></div>
        <div className="grid">{rail.map(m => <ModeRow key={m.id} m={m} onClick={() => open(m)} />)}</div>
        <div className="sect-h"><span>自動車モード</span><small>C1〜C3（C3のみ自由モード）</small></div>
        <div className="grid">{road.map(m => <ModeRow key={m.id} m={m} onClick={() => open(m)} />)}</div>
        <p className="small" style={{ marginTop: 22 }}>実在車両・路線は参考にした架空設計です。音はすべて独自合成です。プロトタイプは Claude Artifacts のみで提供し、Vercel には公開していません。</p>
      </div>
      {sel && <ModeModal m={sel} c={c} onClose={() => setSel(null)} onStart={() => { setSel(null); onStart(); }} />}
      {settings && <SettingsPanel c={c} onClose={() => setSettings(false)} />}
      {status && <StatusPanel onClose={() => setStatus(false)} />}
    </div>
  );
}

function ModeRow({ m, onClick }: { m: ModeDef; onClick: () => void }) {
  const playable = m.status === 'playable';
  return (
    <button className={'card' + (playable ? ' playable' : ' dim')} onClick={onClick} aria-label={`${m.id} ${m.name} ${playable ? 'プレイ可能' : '未実装'}`}>
      <span className="id">{m.id}</span>
      <h3>{m.name}</h3>
      <span className={'st ' + (playable ? 'ok' : 'off')}>{playable ? 'プレイ可能（第1章）' : '未実装'}</span>
      <p>{m.tagline}／{m.kind === 'free' ? '自由モード' : 'ストーリー'}{m.management ? '・経営あり' : ''}</p>
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
        <div className="mh"><h2>{m.id}　{m.name}</h2><button className="btn sm" onClick={onClose}>閉じる</button></div>
        <div className="mb">
          <p className="sub">{m.tagline}　<span className={'pill ' + (playable ? 'ok' : 'off')}>{playable ? 'プレイ可能' : '未実装（設計のみ）'}</span></p>
          <dl className="kv"><dt>核となるプレイ</dt><dd>{m.core}</dd><dt>経営操作</dt><dd>{m.management ? 'あり（このモードの中で独立）' : 'なし'}</dd><dt>独立セーブ領域</dt><dd>save:{m.id}:*（他モードとは共有しません）</dd>{m.seasons && <><dt>最終計画</dt><dd>{m.seasons}</dd></>}{m.playableScope && <><dt>実装範囲</dt><dd>{m.playableScope}</dd></>}</dl>
          {!playable ? <p className="item">このモードはまだプレイできません。仕様として保持されており、共通エンジン（ストーリーグラフ・世界状態・セーブ・描画）の上に順次追加していきます。</p> : <>
            <h3 style={{ margin: '14px 0 6px', borderBottom: '2px solid var(--ink)' }}>セーブスロット</h3>
            <div className="slots">{['auto', '1', '2', '3'].map(s => { const f = slots[s]; return <div key={s} className="slot"><div className="meta"><b>{label(s)}</b><span>{f === 'corrupt' ? '破損データ' : f ? `${f.summary.chapterTitle}／${f.summary.dayLabel}／プレイ${Math.round(f.playtimeSec / 60)}分` : '空き'}</span></div><div className="acts"><button className="btn sm primary" disabled={!f || f === 'corrupt' || busy} onClick={async () => { setBusy(true); startAudio(); if (await c.loadSlot(s, m.id)) onStart(); setBusy(false); }}>続きから</button></div></div>; })}</div>
            <div style={{ display: 'grid', gap: 8, margin: '14px 0 4px' }}>
              <label htmlFor="pname">あなたの名前（作中で使われます）</label><input id="pname" type="text" value={name} maxLength={12} onChange={e => setName(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {latest && <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); startAudio(); const slot = latest.slot; if (await c.loadSlot(slot, m.id)) onStart(); setBusy(false); }}>最新のセーブから続ける（{fmtMinSafe(latest.savedAt)}）</button>}
                <button className={'btn' + (latest ? '' : ' primary')} disabled={busy} onClick={() => { startAudio(); c.newGame(name, m.id); onStart(); }}>最初から（第1章）</button>
              </div>
              <p className="small">表示方式は 3D／擬似3D／2D を切り替えられます。画面左下のスティックで歩き、画面のドラッグで視点を動かします。</p>
            </div></>}
        </div>
      </div>
    </div>
  );
}
