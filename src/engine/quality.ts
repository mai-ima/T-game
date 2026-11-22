export type QualityId = 'high' | 'medium' | 'low';
export interface QualityPreset { id: QualityId; label: string; pixelRatioCap: number; shadows: boolean; shadowMap: number; maxLod: 0 | 1 | 2; crowd: number; envMap: boolean; labels: boolean; desc: string }

export const QUALITY: Record<QualityId, QualityPreset> = {
  high: { id: 'high', label: '最高', pixelRatioCap: 2, shadows: true, shadowMap: 2048, maxLod: 2, crowd: 9, envMap: true, labels: true, desc: '影・環境反射・全ディテール' },
  medium: { id: 'medium', label: '標準', pixelRatioCap: 1.5, shadows: true, shadowMap: 1024, maxLod: 1, crowd: 6, envMap: false, labels: true, desc: '影あり・小部品を一部省略' },
  low: { id: 'low', label: '最低', pixelRatioCap: 0.8, shadows: false, shadowMap: 512, maxLod: 0, crowd: 3, envMap: false, labels: false, desc: '影なし・低解像度・主要設備のみ' }
};

/** FPSに応じて品質を自動調整（autoモード時）。下げるのは速く、上げるのは慎重に。 */
export class AdaptiveQuality {
  ema = 60; lowFor = 0; highFor = 0; cooldown = 0;
  constructor(public current: QualityId = 'high', public enabled = true) {}
  sample(dtSec: number): QualityId | null {
    if (dtSec <= 0 || dtSec > 1) return null; const fps = 1 / dtSec; this.ema += (fps - this.ema) * 0.08; this.cooldown -= dtSec;
    if (!this.enabled || this.cooldown > 0) return null;
    if (this.ema < 22) { this.lowFor += dtSec; this.highFor = 0; } else if (this.ema > 56) { this.highFor += dtSec; this.lowFor = 0; } else { this.lowFor = 0; this.highFor = 0; }
    if (this.lowFor > 3 && this.current !== 'low') { this.current = this.current === 'high' ? 'medium' : 'low'; this.lowFor = 0; this.cooldown = 6; return this.current; }
    if (this.highFor > 12 && this.current !== 'high') { this.current = this.current === 'low' ? 'medium' : 'high'; this.highFor = 0; this.cooldown = 12; return this.current; }
    return null;
  }
}
