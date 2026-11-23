import { useState } from 'react';
import type { TaskNode } from '../engine/types';
import { TaskShell } from './Tasks';

type Done = (score: number) => void;
export type Confidence = 'confirmed' | 'unconfirmed' | 'inferred';
export const CONF_LABEL: Record<Confidence, string> = { confirmed: '確認済み', unconfirmed: '未確認', inferred: '推定' };

interface DocLine { id: string; text: string; missing?: boolean }
interface DocDef { id: string; title: string; ver: string; date: string; iso: string; source: string; check: string; tone: 'ok' | 'warn'; lines: DocLine[] }

/** 版管理された2つの文書を並べ、内容が食い違う行に矛盾マーカーを付ける（表記の揺れ・担当の更新は矛盾ではない）。 */
export function DocsTask({ node, onDone }: { node: TaskNode; onDone: Done }) {
  const cfg = node.config ?? {}; const docs: DocDef[] = cfg.docs ?? []; const targets: string[] = cfg.targets ?? []; const why: Record<string, string> = cfg.why ?? {};
  const [marks, setMarks] = useState<string[]>([]); const [fin, setFin] = useState(false);
  const hits = targets.filter(t => marks.includes(t)).length; const fp = marks.filter(m => !targets.includes(m)).length;
  const score = Math.max(0, Math.round((hits / Math.max(1, targets.length)) * 100 - fp * 25));
  const toggle = (id: string) => { if (fin) return; setMarks(m => (m.includes(id) ? m.filter(x => x !== id) : [...m, id])); };
  const order = [...docs].sort((a, b) => a.iso.localeCompare(b.iso));
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <div className="doc-time" aria-label="版の年表">{order.map((d, i) => <span key={d.id} className="doc-t">{i > 0 && <i aria-hidden>→</i>}<b>{d.date}</b>　{d.ver}</span>)}</div>
      <div className="docs-grid">
        {docs.map(d => (
          <section key={d.id} className="doc" aria-label={d.title}>
            <h4>{d.title}</h4>
            <dl className="doc-meta"><dt>版</dt><dd>{d.ver}</dd><dt>日付</dt><dd>{d.date}</dd><dt>出典</dt><dd>{d.source}</dd><dt>確認状況</dt><dd><span className={'cf ' + d.tone}>{d.check}</span></dd></dl>
            <ol className="doc-lines">
              {d.lines.map(l => {
                const on = marks.includes(l.id); const isT = targets.includes(l.id);
                const st = fin ? (isT ? (on ? ' hit' : ' miss') : on ? ' fp' : '') : on ? ' on' : '';
                return (
                  <li key={l.id}><button className={'doc-line' + st + (l.missing ? ' missing' : '')} aria-pressed={on} disabled={fin} onClick={() => toggle(l.id)}>
                    <span className="mk" aria-hidden>{on ? '⚠' : ''}</span><span>{l.text}</span></button>
                    {fin && (isT || on) && why[l.id] && <div className="why">{isT ? (on ? '○ 矛盾あり。' : '△ 見落とし。') : '× 矛盾ではありません。'}{why[l.id]}</div>}</li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
      <p className="small">内容が食い違う行をタップして矛盾マーカー（⚠）を付けます。表記の違い・担当者の更新は、内容の矛盾ではありません。付けた数：{marks.length}</p>
      {!fin ? <button className="btn primary" disabled={marks.length === 0} onClick={() => setFin(true)}>照合結果を確定する</button>
        : <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><span className="stamp">照合<br />済</span><p style={{ margin: 0 }}><b>照合の精度 {score}%</b>（矛盾の発見 {hits}/{targets.length}、過剰なマーカー {fp}）</p><button className="btn primary" onClick={() => onDone(score)}>メモに記録して戻る</button></div>}
    </TaskShell>
  );
}

interface Claim { id: string; label: string; source: string; truth: Confidence; why: string; when?: string; unless?: string }

/** 根拠の確度（確認済み／未確認／推定）を仕分ける。確度を取り違えた主張は、そのまま報告に使えない。 */
export function GradeTask({ node, onDone, flags }: { node: TaskNode; onDone: Done; flags: Record<string, boolean> }) {
  const cfg = node.config ?? {}; const claims: Claim[] = ((cfg.claims ?? []) as Claim[]).filter(c => (!c.when || flags[c.when]) && (!c.unless || !flags[c.unless])); const [ans, setAns] = useState<Record<string, Confidence>>({}); const [fin, setFin] = useState(false);
  const score = Math.round((claims.filter(c => ans[c.id] === c.truth).length / Math.max(1, claims.length)) * 100);
  return (
    <TaskShell title={node.title} intro={node.intro}>
      <dl className="grade-guide small"><dt>確認済み</dt><dd>原本や記録を自分で確認した、または独立した記録で裏づけがある</dd><dt>推定</dt><dd>証言や状況から、そうだろうと考えられるが、裏づけの資料がない</dd><dt>未確認</dt><dd>まだ確かめていない。真偽はどちらとも言えない</dd></dl>
      {claims.map(c => (
        <div key={c.id} className={'item' + (fin ? (ans[c.id] === c.truth ? ' ok' : ' ng') : '')}>
          <div>{c.label}</div><div className="small">根拠の出どころ：{c.source}</div>
          <div className="tgl">{(['confirmed', 'inferred', 'unconfirmed'] as const).map(v => <button key={v} disabled={fin} className={'btn sm' + (ans[c.id] === v ? ' on' : '')} onClick={() => setAns(a => ({ ...a, [c.id]: v }))}>{CONF_LABEL[v]}</button>)}</div>
          {fin && <div className="why">{ans[c.id] === c.truth ? '○ 適切。' : `× 現時点では「${CONF_LABEL[c.truth]}」として扱います。`}{c.why}</div>}
        </div>
      ))}
      {!fin ? <button className="btn primary" disabled={Object.keys(ans).length < claims.length} onClick={() => setFin(true)}>確度を確定する（{Object.keys(ans).length}/{claims.length}）</button>
        : <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><span className="stamp">確度<br />整理</span><p style={{ margin: 0 }}><b>適切に区別できた割合 {score}%</b></p><button className="btn primary" onClick={() => onDone(score)}>整理表を保存して戻る</button></div>}
    </TaskShell>
  );
}
