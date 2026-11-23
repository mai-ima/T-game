/** 業務画面用の線画アイコン（24×24、2px線、角は丸めない）。 */
const S = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'butt' as const, strokeLinejoin: 'miter' as const, 'aria-hidden': true };
export const Icon = {
  roster: () => <svg {...S}><rect x="4" y="4" width="16" height="17" /><path d="M8 2v4M16 2v4M4 9h16M8 13h3M8 17h3M14 13h2M14 17h2" /></svg>,
  career: () => <svg {...S}><rect x="3" y="5" width="18" height="14" /><circle cx="9" cy="11" r="2.3" /><path d="M5.5 16.5c.6-2 2-2.8 3.5-2.8s2.9.8 3.5 2.8M14 10h4M14 13.5h3" /></svg>,
  people: () => <svg {...S}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M2.5 20c.5-4 2.6-6 5.5-6s5 2 5.5 6M14.5 14.3c.9-.4 1.6-.5 2.5-.5 2.6 0 4 1.8 4.5 5" /></svg>,
  timeline: () => <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 6.5V12l4 2.5" /></svg>,
  branch: () => <svg {...S}><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 7v10M6 12c0-3 3-3 6-3h4" /></svg>,
  save: () => <svg {...S}><path d="M4 3h13l3 3v15H4z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></svg>,
  gear: () => <svg {...S}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>,
  camera: () => <svg {...S}><path d="M3 8h4l2-3h6l2 3h4v12H3z" /><circle cx="12" cy="13" r="3.5" /></svg>,
  run: () => <svg {...S}><circle cx="15" cy="4.5" r="2" /><path d="M13 8l-3 3 3 3-1 5M10 11l-3 .5M13 8l4 3 3 .5M13 14l4 2 .5 4" /></svg>,
  title: () => <svg {...S}><path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-6h4v6" /></svg>,
  wait: () => <svg {...S}><path d="M5 4v16M5 12h12M13 7l5 5-5 5" /></svg>,
  view3d: () => <svg {...S}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" /></svg>,
  view25: () => <svg {...S}><path d="M4 9l8-4 8 4-8 4zM4 9v6l8 4 8-4V9" /></svg>,
  view2: () => <svg {...S}><rect x="4" y="4" width="16" height="16" /><path d="M4 12h16M12 4v16" /></svg>
};

/** 発車標風の反転フラップ表示（1文字ずつ黒いタイル） */
export function FlapClock({ text }: { text: string }) {
  return <span className="flaps" aria-label={text}>{text.split('').map((ch, i) => ch === ':' ? <i key={i} className="colon">:</i> : <b key={i} className="flap">{ch}</b>)}</span>;
}
