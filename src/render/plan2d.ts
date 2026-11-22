import type { StationData } from './stationBuilder';
import { D, P, TRACK_Z } from './stationBuilder';
import type { StationSim } from '../engine/stationSim';
import type { TrainState } from '../engine/railSim';

/** 2D平面図：同一のStationData/StationSim状態から描画する（機能は3Dと同一。表示形式のみ異なる）。 */
export interface PlanView { cx: number; cz: number; scale: number }
export interface PlanMarker { object: string; label: string }

const COLORS = { bg: '#0f1722', ground: '#1b2736', plaza: '#2a3547', platform: '#3d4a5c', deck: '#4a5d73', track: '#6d6a66', rail: '#9aa4ad', wall: '#c8d0d8', obj: '#7d8fa3', gate: '#4fd0a0', vend: '#e4695f', npc: '#ffcf5c', player: '#5cc8ff', pax: '#8b97a6', mark: '#ffd34d', text: '#e8eef5' };

export function drawPlan(g: CanvasRenderingContext2D, w: number, h: number, view: PlanView, data: StationData, sim: StationSim, trains: TrainState[], markers: PlanMarker[], level: 'auto' | 'ground' | 'platform' | 'deck' = 'auto') {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = COLORS.bg; g.fillRect(0, 0, w, h);
  const S = view.scale; const X = (x: number) => w / 2 + (x - view.cx) * S, Z = (z: number) => h / 2 + (z - view.cz) * S;
  const py = sim.player.y; const lvl = level === 'auto' ? (py > 4 ? 'deck' : py > 0.8 ? 'platform' : 'ground') : level;
  const rect = (x0: number, z0: number, x1: number, z1: number, fill: string, alpha = 1) => { g.globalAlpha = alpha; g.fillStyle = fill; g.fillRect(X(x0), Z(z0), (x1 - x0) * S, (z1 - z0) * S); g.globalAlpha = 1; };
  rect(-130, -130, 130, 130, COLORS.ground);
  rect(-66, -46, 66, -12.4, COLORS.plaza, lvl === 'ground' ? 1 : 0.5);
  // 線路
  for (const cz of [TRACK_Z.A, TRACK_Z.B]) { rect(-100, cz - 2.2, 100, cz + 2.2, COLORS.track, 0.55); g.strokeStyle = COLORS.rail; g.lineWidth = Math.max(1, S * 0.12); for (const s of [-0.53, 0.53]) { g.beginPath(); g.moveTo(X(-100), Z(cz + s)); g.lineTo(X(100), Z(cz + s)); g.stroke(); } }
  rect(-36, -4.5, 36, 4.5, COLORS.platform, lvl === 'platform' ? 1 : 0.55);
  g.fillStyle = '#e8c21a'; for (const s of [-1, 1]) g.fillRect(X(-36), Z(s * 4.0 - 0.4), 72 * S, 0.8 * S);
  rect(-14, -12, 14, 12, COLORS.deck, lvl === 'deck' ? 0.95 : 0.35);
  // 階段
  g.fillStyle = '#8aa0b8'; g.globalAlpha = 0.7; g.fillRect(X(-2.4), Z(-26), 4.8 * S, 14 * S); g.fillRect(X(-25.2), Z(-1.2), 11.2 * S, 2.4 * S); g.fillRect(X(14), Z(-1.2), 11.2 * S, 2.4 * S); g.globalAlpha = 1;
  g.strokeStyle = '#2d3a4b'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(X(-2.4), Z(-26 + i)); g.lineTo(X(2.4), Z(-26 + i)); g.stroke(); }
  // 構造物（衝突体）
  const vis = (y0: number, y1: number) => lvl === 'deck' ? y0 >= D - 0.5 : lvl === 'platform' ? y0 >= P - 0.1 && y0 < D - 0.5 : y0 < P - 0.1;
  for (const c of data.colliders) {
    if (!vis(c.y0, c.y1)) continue; const isWall = /壁|腰壁|面|柵/.test(c.name) || /fence|フェンス/i.test(c.name); const isGate = /改札/.test(c.name) && /自動/.test(c.name); const isVend = /券売機|自動販売機/.test(c.name);
    g.fillStyle = isGate ? COLORS.gate : isVend ? COLORS.vend : isWall ? COLORS.wall : COLORS.obj; g.fillRect(X(c.x0), Z(c.z0), Math.max(1.5, (c.x1 - c.x0) * S), Math.max(1.5, (c.z1 - c.z0) * S));
  }
  // 列車
  for (const t of trains) { const z = t.service.track === 'A' ? TRACK_Z.A : TRACK_Z.B; g.fillStyle = t.delay > 0 ? '#ff9f43' : '#d8dee4'; g.fillRect(X(t.x - 30), Z(z - 1.45), 60 * S, 2.9 * S); g.fillStyle = '#17212b'; for (let i = 0; i < 3; i++) g.fillRect(X(t.x - 30 + i * 20 + 0.3), Z(z - 1.45), 0.2 * S, 2.9 * S); g.fillStyle = '#17212b'; g.font = `bold ${Math.max(9, S * 1.4)}px sans-serif`; g.textAlign = 'center'; g.fillText(t.service.num, X(t.x), Z(z + 0.4)); }
  // 目標マーカー
  const active = new Set(markers.map(m => m.object));
  g.textAlign = 'center'; g.font = `${Math.max(10, Math.min(15, S * 1.3))}px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif`;
  for (const a of Object.values(data.anchors)) {
    if (a.id.startsWith('spawn')) continue; const isNpc = a.kind === 'npc'; const n = isNpc ? sim.npcs[a.id] : undefined; if (isNpc && !n?.visible) continue;
    const ax = n ? n.x : a.x, az = n ? n.z : a.z, ay = n ? n.y : a.y; const onLevel = lvl === 'deck' ? ay > 4 : lvl === 'platform' ? ay > 0.8 && ay < 4 : ay < 0.8; if (!onLevel && lvl !== 'ground') continue; if (!onLevel && lvl === 'ground') continue;
    const hot = active.has(a.id);
    g.fillStyle = hot ? COLORS.mark : isNpc ? COLORS.npc : '#b8c4d2'; g.beginPath(); g.arc(X(ax), Z(az), Math.max(3.5, S * (isNpc ? 0.5 : 0.35)), 0, 7); g.fill();
    if (hot) { g.strokeStyle = COLORS.mark; g.lineWidth = 2; g.beginPath(); g.arc(X(ax), Z(az), Math.max(8, S * 1.1), 0, 7); g.stroke(); }
    if (S > 5 || hot || isNpc) { g.fillStyle = COLORS.text; g.fillText(a.label, X(ax), Z(az) - Math.max(8, S * 0.9)); }
  }
  for (const c of sim.crowd) { if (!c.visible) continue; const onLevel = lvl === 'deck' ? c.y > 4 : lvl === 'platform' ? c.y > 0.8 && c.y < 4 : c.y < 0.8; if (!onLevel) continue; g.fillStyle = COLORS.pax; g.beginPath(); g.arc(X(c.x), Z(c.z), Math.max(2.5, S * 0.28), 0, 7); g.fill(); }
  // プレイヤー
  const p = sim.player; g.save(); g.translate(X(p.x), Z(p.z)); g.rotate(-p.yaw + Math.PI); g.fillStyle = COLORS.player; g.beginPath(); const r = Math.max(6, S * 0.7); g.moveTo(0, -r * 1.4); g.lineTo(r, r); g.lineTo(0, r * 0.5); g.lineTo(-r, r); g.closePath(); g.fill(); g.restore();
  // 凡例
  g.fillStyle = 'rgba(8,12,20,.78)'; g.fillRect(10, 10, 232, 74); g.fillStyle = COLORS.text; g.textAlign = 'left'; g.font = '13px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif';
  g.fillText(`2D平面図  階層：${lvl === 'deck' ? 'コンコース(+6.6m)' : lvl === 'platform' ? 'ホーム(+1.65m)' : '地上(0m)'}`, 18, 30); g.fillText('● 人物　● 調べる対象　▲ あなた', 18, 50); g.fillText('ドラッグで移動／ホイール・ピンチで拡大', 18, 70);
}
