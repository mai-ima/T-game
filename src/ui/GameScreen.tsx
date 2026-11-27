import { useEffect, useReducer, useRef, useState } from 'react';
import type { GameController } from '../engine/controller';
import { RenderManager } from '../render/renderManager';
import { loadAssets } from '../render/assets';
import { Joystick, Portrait, Stage25D, useTypewriter } from './parts';
import { ChecklistTask, ComposeTask, RosterTask, TerminalTask } from './Tasks';
import { TimingTask, FindTask, WatchTask, RouteTask, SortTask, MemoryTask } from './Minigames';
import { DocsTask, GradeTask } from './DocTasks';
import { FlowPanel } from './StoryMap';
import { INFLUENCE } from './influence';
import { CareerPanel, GraphPanel, RelationsPanel, RosterPanel, SavePanel, SettingsPanel, TimelinePanel } from './Panels';
import { EVAL_LABEL } from '../engine/worldState';
import { Icon, FlapClock } from './icons';
import type { EvalKey } from '../engine/types';

export function useCtl(c: GameController) { const [, f] = useReducer((x: number) => x + 1, 0); useEffect(() => c.subscribe(f), [c]); return c.version; }


export function GameScreen({ c, onExit }: { c: GameController; onExit: () => void }) {
  useCtl(c);
  const cv3 = useRef<HTMLCanvasElement>(null), cv2 = useRef<HTMLCanvasElement>(null); const [webglFail, setWebglFail] = useState(false); const [stats, setStats] = useState<any>(null);
  const debug = typeof location !== 'undefined' && /[?&](debug|stats|audit)/.test(location.search);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!cv3.current || !cv2.current) return;
    let dead = false; let cleanup: (() => void) | null = null;
    loadAssets().catch(() => undefined).then(assets => {
    if (dead || !cv3.current || !cv2.current) return; setLoading(false);
    const rm = new RenderManager({
      assets: assets ?? undefined, canvas: cv3.current, plan: cv2.current, sim: c.sim, rail: c.rail, data: c.data, characters: c.story.characters, playerName: c.world.playerName, quality: c.settings.quality, auto: c.settings.autoQuality,
      onFootstep: s => c.audio.footstep(s), onGate: ok => c.audio.gate(ok), onDoor: k => c.audio.door(k), onQuality: q => { c.settings.quality = q; if (debug) c.say(`描画品質を自動調整しました：${q === 'high' ? '最高' : q === 'medium' ? '標準' : '最低'}`); },
      onRailEvent: e => { const dir = e.service.track === 'A' ? '1番線（海浜口方面）' : '2番線（空港連絡方面）'; if (e.type === 'approach') c.audio.chime('approach', `まもなく${dir}に${e.service.kind} ${e.service.dest}行きが到着します。黄色い線の内側でお待ちください。`); if (e.type === 'depart') c.audio.chime('depart', `${dir}の${e.service.kind}が発車します。`); },
      onTrainAudio: (v, g, p, d) => c.audio.trainUpdate(v, g, p, d)
    });
    c.attachRender(rm); if (!rm.webgl) { setWebglFail(true); rm.setViewMode('2d'); } else rm.setViewMode(c.settings.view);
    c.afterAttach(); rm.resize(); rm.start(); (window as any).__RR = { c, rm }; let last = performance.now(); let n = 0;
    rm.onUpdate = () => { const t = performance.now(); c.tick(Math.min(0.1, (t - last) / 1000)); last = t; if (debug && ++n % 20 === 0) setStats(rm.stats()); };
    const ro = new ResizeObserver(() => rm.resize()); ro.observe(cv3.current.parentElement!); const onVis = () => { rm.paused = document.hidden; }; document.addEventListener('visibilitychange', onVis);
    cleanup = () => { ro.disconnect(); document.removeEventListener('visibilitychange', onVis); rm.dispose(); c.rm = undefined; };
    });
    return () => { dead = true; cleanup?.(); };
  }, [c]);  

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return; const v = c.view;
      if (e.code === 'Space' || e.code === 'Enter') { if (v?.kind === 'line' && !c.panel) { e.preventDefault(); if (e.repeat) return; if (c.tapLine) c.tapLine(); else c.advanceLine(); } else if (v?.kind === 'hub' && c.prompt && !c.panel) { e.preventDefault(); c.doPrompt(); } }
      if (e.code === 'KeyE' && v?.kind === 'hub' && c.prompt && !c.panel) c.doPrompt();
      if (v?.kind === 'choice' && /^Digit[1-9]$/.test(e.code)) { const o = v.options[+e.code.slice(5) - 1]; if (o) c.choose(o.id); }
      if (e.code === 'Escape' && c.panel) { c.panel = null; c.notify(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [c]);

  const v = c.view; const hint = v && 'node' in v ? v.node.view : undefined; const stage = !!v && (v.kind === 'line' || v.kind === 'choice' || v.kind === 'task' || v.kind === 'end') && hint?.mode === '25d'; const hub = v?.kind === 'hub';
  const startAudio = () => { if (!c.audio.started) c.audio.start().then(() => { c.audio.setZone(c.audio.zone); c.notify(); }); };

  return (
    <div className="game" onPointerDown={startAudio}>
      <div className="stage" style={{ visibility: stage ? 'hidden' : 'visible' }}><canvas ref={cv3} aria-label="3D表示" /><canvas ref={cv2} aria-label="2D平面図" style={{ visibility: 'hidden' }} /></div>
      {loading && <div className="toast" style={{ top: '45%' }}>3Dモデルを読み込んでいます</div>}
      {stage && v && <StageView c={c} />}
      {(!stage || c.story.persistentHud) && <Hud c={c} onExit={onExit} />}
      {hub && !c.panel && <HubControls c={c} />}
      {v?.kind === 'line' && <DialogueBox c={c} />}
      {v?.kind === 'choice' && <ChoiceBox c={c} />}
      {v?.kind === 'task' && <TaskHost c={c} />}
      {c.endResult && v?.kind === 'end' && <ChapterEnd c={c} onExit={onExit} />}
      {c.panel === 'roster' && <RosterPanel c={c} />}{c.panel === 'career' && <CareerPanel c={c} />}{c.panel === 'relations' && <RelationsPanel c={c} />}{c.panel === 'timeline' && <TimelinePanel c={c} />}{c.panel === 'flow' && <FlowPanel c={c} />}{c.panel === 'graph' && <GraphPanel c={c} />}{c.panel === 'save' && <SavePanel c={c} />}{c.panel === 'settings' && <SettingsPanel c={c} onClose={() => { c.panel = null; c.notify(); }} />}
      {c.feedbacks.length > 0 && <div className="fb-stack" role="status" aria-live="polite" data-ui>{c.feedbacks.map(f => <div key={f.id} className={'fb ' + f.kind}><i aria-hidden>{f.kind === 'up' ? '▲' : '▼'}</i>{f.text}</div>)}</div>}
      {c.toast && <div className="toast" role="status" data-ui>{c.toast.text}</div>}
      {c.caption && <div className="caption" role="status" aria-live="polite">［放送］{c.caption.text}</div>}
      {webglFail && <div className="toast" style={{ top: 120 }}>この端末では3D描画（WebGL）を開始できなかったため、2D表示で動作しています。</div>}
      {debug && stats && <div className="stats">{stats.view}/{stats.cam} {stats.quality} {stats.fps}fps {stats.frameMs}ms calls:{stats.calls} tris:{stats.triangles} geo:{stats.geometries} tex:{stats.textures} heap:{stats.heapMB ?? '-'}MB</div>}
    </div>
  );
}

function Hud({ c, onExit }: { c: GameController; onExit: () => void }) {
  const s = c.settings; const rm = c.rm; const hub = c.view?.kind === 'hub'; const cap = c.view && 'node' in c.view ? c.view.node.view?.caption : undefined; const [open, setOpen] = useState(false);
  const P = (id: string) => () => { c.panel = id; c.audio.ui('click'); c.notify(); };
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.code === 'Escape') setOpen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  return (
    <>
      <div className="hud-top" data-ui>
        <div className="clock"><div className="t"><FlapClock text={c.clockLabel} /></div><div className="d">{c.dateLabel}</div>{cap && !c.story.persistentHud && <div className="d" style={{ color: '#ffa83a' }}>{cap}</div>}</div>
        <div className="hud-btns">
          {!c.story.persistentHud && <div className="seg" role="group" aria-label="表示方式">{(['3d', '25d', '2d'] as const).map(m => <button key={m} className={s.view === m ? 'on' : ''} onClick={() => c.setView(m)} aria-pressed={s.view === m} aria-label={m === '3d' ? '3D表示' : m === '25d' ? '擬似3D表示' : '2D表示'}>{m === '3d' ? <Icon.view3d /> : m === '25d' ? <Icon.view25 /> : <Icon.view2 />}<span className="lbl">{m === '3d' ? '3D' : m === '25d' ? '擬似3D' : '2D'}</span></button>)}</div>}
          <button className="btn menu-btn" onClick={() => { c.audio.ui('click'); setOpen(o => !o); }} aria-expanded={open}><Icon.gear />メニュー</button>
        </div>
      </div>
      {open && <div className="msheet-bg" data-ui onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}><div className="msheet" role="dialog" aria-label="メニュー">
        <div className="sheet-h"><h2>メニュー</h2><button className="btn sm" onClick={() => setOpen(false)}>閉じる</button></div>
        <div className="msheet-b">
          <div className="tilegrid wide" onClick={() => setOpen(false)}>
            {!c.story.persistentHud && <button className="tile" onClick={P('roster')}><Icon.roster />勤務表</button>}<button className="tile" onClick={P('career')}><Icon.career />経歴・評価</button><button className="tile" onClick={P('relations')}><Icon.people />人物関係</button><button className="tile" onClick={P('timeline')}><Icon.timeline />年表・日誌</button><button className="tile" onClick={P('flow')}><Icon.branch />分岐図</button><button className="tile" onClick={P('save')}><Icon.save />セーブ</button><button className="tile" onClick={P('settings')}><Icon.gear />設定</button><button className="tile danger" onClick={() => { c.saveSlot('auto', true); onExit(); }}><Icon.title />タイトルに戻る</button>
          </div>
          {hub && s.view !== '2d' && <><h3 className="msh">カメラ</h3><div className="hud-btns" style={{ justifyContent: 'flex-start' }}><div className="seg" role="group" aria-label="カメラ">{([['follow', '追従'], ['free', '自由'], ['first', '一人称']] as const).map(([m, l]) => <button key={m} className={rm?.camMode === m ? 'on' : ''} onClick={() => c.setCam(m)}>{l}</button>)}</div>
            <select aria-label="カメラ位置" value={rm?.presetName ?? ''} onChange={e => { rm?.setPreset(e.target.value || null); c.notify(); }} style={{ width: 'auto', minHeight: 38, padding: '4px 8px' }}><option value="">視点プリセット</option>{rm && Object.keys(rm.data.presets).map(k => <option key={k} value={k}>{PRESET_JA[k] ?? k}</option>)}</select></div></>}
          <h3 className="msh">その他</h3><button className="btn" style={{ width: '100%' }} onClick={() => { setOpen(false); onExit(); }}>タイトルに戻る</button>
        </div>
      </div></div>}
    </>
  );
}
const PRESET_JA: Record<string, string> = { plaza: '駅前広場', overview: '全景（俯瞰）', top: '真上', front: '正面（北）', back: '背面（南）', side: '側面（西）', gate: '改札', gate_close: '改札機（IC読取部）', gate_side: '改札列（側面）', gate_back: '改札（内側から）', gate_wide: '幅広・有人通路', vend_close: '券売機（接写）', seisan: '精算機', concourse: 'コンコース', office: '駅事務室', platform: 'ホーム（西向き）', platform_east: 'ホーム（東向き）', train: '停車中の列車', office_in: '駅事務室（内）', shop: '売店', toilet: 'トイレ', info: '観光案内所', waiting: 'ホーム待合室', entrance: '入口の自動ドア', bus: 'バスのりば', train_front: '列車（前方）', train_side: '列車（側面・北から）', platform_high: 'ホーム俯瞰', rail: '線路沿い', vend: '券売機', board: '発車標', tactile: '点字ブロック' };

function HubControls({ c }: { c: GameController }) {
  const [run, setRun] = useState(false); const [goals, setGoals] = useState(typeof window === 'undefined' || window.innerWidth >= 760);
  const v = c.view; if (v?.kind !== 'hub') return null; const p = c.prompt; const tgt = c.suggestTarget();
  return (
    <>
      <div className="goals chip" data-ui><b>業務メモ　{v.goals.filter(g => g.done).length}/{v.goals.length}</b>　<button className="btn sm ghost" style={{ minHeight: 28, padding: '0 8px' }} onClick={() => setGoals(g => !g)}>{goals ? 'たたむ' : '開く'}</button>
        {goals && <><div className="goals-scroll"><ul>{v.goals.map(g => <li key={g.id} className={g.done ? 'done' : ''}><span className="ck">{g.done ? '✓' : ''}</span>{g.label}</li>)}</ul></div>{v.node.hint && <div className="hint">{v.node.hint}</div>}</>}</div>
      <Joystick onMove={(x, y) => c.rm?.setMoveInput(x, y)} />
      <div className="act" data-ui>
        {p ? <button className="main" onClick={() => c.doPrompt()}>{p.label}<small>タップ／E／Enter</small></button> : tgt ? <button className="main nav" onClick={() => { c.audio.ui('click'); c.navigateTo(tgt.id, true); }} aria-label={'目的地へ自動で歩く：' + tgt.label}><span className="arrow" style={{ transform: `rotate(${tgt.bearing}rad)` }}>➤</span><span>目的地へ<small>{tgt.label}（約{Math.round(tgt.dist)}m）</small></span></button> : <div className="note">歩いて設備や人物に近づきます（黄色い標識が調べる対象）</div>}
        {p?.others?.map(o => <button key={o.id} className="btn sm" onClick={() => c.interact(o.id)}>{o.label}</button>)}
        {v.canExit && <button className="btn primary" onClick={() => c.exitHub()}>{v.node.exit.label}</button>}
        <div style={{ display: 'flex', gap: 6 }}><button className={'tile' + (run ? ' on' : '')} onClick={() => { if (c.rm) { c.rm.run = !c.rm.run; setRun(c.rm.run); } }} aria-pressed={run}><Icon.run />走る</button><button className="tile" onClick={() => c.waitMinutes(30)} title="時間を進める"><Icon.wait />30分待つ</button></div>
      </div>
    </>
  );
}

function StageView({ c }: { c: GameController }) {
  const v = c.view!; if (v.kind === 'hub') return null; const h = v.node.view!; const line = v.kind === 'line' ? v.node.lines[c.lineIndex] : null;
  return <Stage25D bg={h.bg ?? 'office'} cast={h.focus ?? []} speaker={line?.who ?? (v.kind === 'choice' ? v.node.who : undefined)} characters={c.story.characters} caption={h.caption} mood={line?.mood} />;
}

function DialogueBox({ c }: { c: GameController }) {
  const v = c.view; const ln = v?.kind === 'line' ? v.node : null; const l = ln?.lines[c.lineIndex]; const text = l ? c.textWorld(l.text) : ''; const def = l?.who && l.who !== 'player' ? c.story.characters[l.who] : undefined;
  const tw = useTypewriter(text, c.settings.textSpeed, (ln?.id ?? '') + ':' + c.lineIndex); const [log, setLog] = useState(false);
  const lastLen = useRef(0); useEffect(() => { const n = tw.shown.length; if (l && n > lastLen.current && n % 3 === 0 && /\S/.test(tw.shown[n - 1] ?? '')) c.audio.blip(c.voiceOf(l.who), l.narration ? 'narration' : 'voice'); lastLen.current = n; }, [tw.shown]); // eslint-disable-line
  useEffect(() => { lastLen.current = 0; }, [ln?.id, c.lineIndex]);
  const click = () => { if (!tw.done) tw.skip(); else c.advanceLine(); };
  useEffect(() => { c.tapLine = click; return () => { if (c.tapLine === click) c.tapLine = undefined; }; }); // キー操作もタップと同じ動作にする
  if (v?.kind !== 'line' || !l) return null; const last = c.lineIndex === v.node.lines.length - 1;
  return (
    <div className="dlg" data-ui>
      <div className={'dlg-box' + (def ? '' : ' noav')} onClick={click} role="button" tabIndex={0} aria-label="会話。タップで次へ">
        {def && <div className="av"><div className="ph"><Portrait def={def} mood={l.mood} size={108} /></div><span className="nm">{def.name}</span></div>}
        <div><div className="dlg-name">{!l.narration && <b>{l.who === 'player' ? c.world.playerName : def?.name}</b>}{def && <small>{def.role}</small>}</div><div className={'dlg-text' + (l.narration ? ' nar' : '')} aria-live="polite">{tw.shown}</div></div>
        <div className="dlg-foot"><span>{c.lineIndex + 1}/{v.node.lines.length}</span><span><button className="btn sm ghost" onClick={e => { e.stopPropagation(); setLog(x => !x); }}>履歴</button> <span className="next">{tw.done ? <><i className="nx" aria-hidden>▼</i>{last ? '次へ' : '続く'}</> : '　'}</span></span></div>
      </div>
      {log && <div className="toast" style={{ top: 'auto', bottom: 170, maxHeight: '40vh', overflow: 'auto', width: 'min(640px, 92vw)', textAlign: 'left' }} onClick={() => setLog(false)}>{c.backlog.slice(-10).map((b, i) => <p key={i} style={{ margin: '4px 0' }}><b style={{ color: '#f2c500' }}>{b.who}</b> {b.text}</p>)}</div>}
    </div>
  );
}

function ChoiceBox({ c }: { c: GameController }) {
  const [now, setNow] = useState(performance.now());
  useEffect(() => { if (c.choiceDeadline === null) return; const id = setInterval(() => setNow(performance.now()), 100); return () => clearInterval(id); }, [c.choiceDeadline]);
  const v = c.view; if (v?.kind !== 'choice') return null;
  const left = c.choiceDeadline ? Math.max(0, (c.choiceDeadline - now) / 1000) : null;
  return (
    <div className="choice" data-ui role="dialog" aria-label="選択">
      <div className="choice-in">
        <div className="choice-q">{v.node.important && <span className="imp">重要な選択</span>}{c.textWorld(v.node.prompt)}</div>
        {left !== null && <div><div className="timer" aria-label="残り時間"><i style={{ width: (left / c.choiceTotal) * 100 + '%' }} /></div><div className="small">残り {Math.ceil(left)} 秒（時間切れは「{c.textWorld(v.node.options.find(o => o.id === v.node.defaultOption)?.label ?? '')}」）</div></div>}
        {v.options.map((o, i) => <button key={o.id} className="choice-opt" onClick={() => c.choose(o.id)}><span className="n">{i + 1}</span><span>{c.textWorld(o.label)}{o.hint && <div className="small">{o.hint}</div>}</span></button>)}
      </div>
    </div>
  );
}

function TaskHost({ c }: { c: GameController }) {
  const v = c.view; if (v?.kind !== 'task') return null; const n = v.node; const done = (s: number) => c.resolveTask(s); const relaxed = !c.settings.timeLimits;
  if (n.kind === 'docs') return <DocsTask key={n.id} node={n} onDone={done} />; if (n.kind === 'grade') return <GradeTask key={n.id} node={n} onDone={done} flags={c.world.flags} />;
  if (n.kind === 'timing') return <TimingTask key={n.id} node={n} onDone={done} />; if (n.kind === 'find') return <FindTask key={n.id} node={n} onDone={done} relaxed={relaxed} />; if (n.kind === 'watch') return <WatchTask key={n.id} node={n} onDone={done} relaxed={relaxed} />;
  if (n.kind === 'route') return <RouteTask key={n.id} node={n} onDone={done} />; if (n.kind === 'sort') return <SortTask key={n.id} node={n} onDone={done} relaxed={relaxed} />; if (n.kind === 'memory') return <MemoryTask key={n.id} node={n} onDone={done} />;
  if (n.kind === 'checklist') return <ChecklistTask key={n.id} node={n} onDone={done} />; if (n.kind === 'compose') return <ComposeTask key={n.id} node={n} onDone={done} />;
  if (n.kind === 'terminal') return <TerminalTask key={n.id} node={n} onDone={done} rail={c.rail} minute={c.world.clock.minute} />; return <RosterTask key={n.id} node={n} onDone={done} world={c.world} startYear={c.story.startYear} />;
}

function ChapterEnd({ c, onExit }: { c: GameController; onExit: () => void }) {
  const r = c.endResult!; const n = c.view?.kind === 'end' ? c.view.node : null; const w = c.world; const flags = Object.keys(w.flags).filter(f => INFLUENCE[f]);
  const RC: Record<string, string> = { A: '#14663f', B: '#1a4fa0', C: '#a35c00', D: '#c8281e' };
  return (
    <div className="fullscreen" data-ui>
      <div className="in">
        <p className="small" style={{ margin: 0 }}>章の終了</p><h1 style={{ margin: '4px 0 6px', fontFamily: 'var(--display)' }}>{n?.title}</h1><p>{n?.summary}</p>
        {c.mode !== 'R8' && <div className="result-hero"><div className="rating" style={{ color: RC[r.rating], borderColor: RC[r.rating] }}>{r.rating}</div><div className="small">勤務評価（{n?.chapter === 'ch1' ? '勤務初日' : '導入'}の暫定評価）<br />{c.dateLabel} {c.clockLabel} 終了</div></div>}
        <h3>評価の内訳</h3>{(Object.keys(EVAL_LABEL) as EvalKey[]).map(k => <div className="bar" key={k}><span>{EVAL_LABEL[k]}</span><i><b style={{ width: r.scores[k] + '%' }} /></i><span>{Math.round(r.scores[k])}</span></div>)}
        <h3>人物関係の変化</h3><table className="tbl"><tbody>{Object.entries(r.relDelta).filter(([, d]) => d.trust || d.rapport).map(([id, d]) => <tr key={id}><td>{c.story.characters[id]?.name ?? id}</td><td>信頼 {d.trust >= 0 ? '+' : ''}{d.trust}</td><td>親しさ {d.rapport >= 0 ? '+' : ''}{d.rapport}</td></tr>)}</tbody></table>
        <h3>{n?.nextChapter ? '次の章への影響' : '今回の判断の記録'}</h3>
        {flags.length ? <ul>{flags.map(f => <li key={f}>{INFLUENCE[f]}</li>)}</ul> : <p className="small">特筆すべき分岐はありません。</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          {n?.nextChapter && <button className="btn primary" onClick={() => c.startNextChapter()}>第2章 冒頭（体験版）へ進む</button>}
          <button className="btn" onClick={() => { c.panel = 'flow'; c.notify(); }}>分岐図を見る</button><button className="btn" onClick={() => { c.panel = 'career'; c.notify(); }}>経歴・異動可否</button><button className="btn" onClick={() => { c.panel = 'save'; c.notify(); }}>セーブ</button><button className="btn ghost" onClick={onExit}>タイトルに戻る</button>
        </div>
        {!n?.nextChapter && <p className="small" style={{ marginTop: 14 }}>実装済みの範囲はここまでです。{c.mode === 'R8' ? '第2章以降（全96章企画）' : '第3章以降（全96章企画）'}は未実装です。</p>}
      </div>
    </div>
  );
}
