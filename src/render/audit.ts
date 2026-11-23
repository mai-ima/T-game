import type { AssetBox, StationData } from './stationBuilder';
import { D, P } from './stationBuilder';

/** 配置監査：浮き・地中埋没・貫通（体積の重なり）を、ビルダーのレジストリから自動検出する。 */
export interface AuditIssue { kind: 'float' | 'sunk' | 'overlap' | 'outOfBounds'; a: string; b?: string; detail: string }

const SOLID = new Set(['vending', 'gate', 'bench', 'desk', 'shelf', 'counter', 'column', 'planter', 'tree', 'case', 'elevator', 'pole', 'emergency', 'fence', 'stairs', 'chair', 'shelter']);
const SKIP_NAMES = /ホーム階段|入口階段|階段手すり|架線|信号|キロポスト|速度制限|駅名標|傘|ホーム上屋柱|街路灯|ホーム照明/;

const vol = (a: AssetBox, b: AssetBox) => {
  const dx = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
  const dy = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  const dz = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
  return dx > 0.02 && dy > 0.02 && dz > 0.02 ? dx * dy * dz : 0;
};

export function auditPlacement(data: StationData): { issues: AuditIssue[]; checked: number } {
  const issues: AuditIssue[] = []; const lv = { ground: 0, platform: P, deck: D } as const;
  for (const a of data.registry) {
    if (a.support === 'ground' || a.support === 'platform' || a.support === 'deck') {
      const l = lv[a.support];
      if (a.min[1] > l + 0.06) issues.push({ kind: 'float', a: a.name, detail: `下端 ${a.min[1].toFixed(2)}m が支持面 ${l}m より上` });
      if (a.min[1] < l - 1.2 && a.tag !== 'terrain') issues.push({ kind: 'sunk', a: a.name, detail: `下端 ${a.min[1].toFixed(2)}m が支持面 ${l}m より下` });
    }
    if (Math.abs(a.min[0]) > 260 || Math.abs(a.max[0]) > 260 || Math.abs(a.min[2]) > 260 || Math.abs(a.max[2]) > 260) issues.push({ kind: 'outOfBounds', a: a.name, detail: '地形の範囲外' });
  }
  const solids = data.registry.filter(a => SOLID.has(a.tag) && !SKIP_NAMES.test(a.name));
  for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
    const a = solids[i], b = solids[j]; if (a.group && a.group === b.group) continue; if (a.name === b.name && !a.group) { /* 同名は別個体 */ }
    const v = vol(a, b); if (v > 0.004) issues.push({ kind: 'overlap', a: a.name, b: b.name, detail: `重なり体積 ${v.toFixed(3)}m³` });
  }
  return { issues, checked: data.registry.length };
}
