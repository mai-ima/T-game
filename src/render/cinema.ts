/**
 * カメラ演出：会話を「撮る」。ショットの種類（二人・バストアップ・肩越し・引き）を決め、位置と画角を返す純粋関数。
 * 話者が変わるたびに切り返し、重要な台詞では寄る。手持ちカメラ風の微小な揺れも付ける。
 */
import * as THREE from 'three';

export type ShotKind = 'two' | 'medium' | 'close' | 'ots' | 'wide';
export interface Subject { x: number; y: number; z: number; yaw: number }
export interface Shot { pos: THREE.Vector3; target: THREE.Vector3; fov: number; focus: number }

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** subject：撮る人物。other：会話の相手（肩越しや二人の画面で使う）。 */
export function frameShot(kind: ShotKind, subject: Subject, other?: Subject, eye = 1.55): Shot {
  const s = V(subject.x, subject.y + eye, subject.z); const o = other ? V(other.x, other.y + eye, other.z) : null;
  const toOther = o ? o.clone().sub(s).setY(0).normalize() : V(Math.sin(subject.yaw), 0, Math.cos(subject.yaw));
  const side = V(toOther.z, 0, -toOther.x); // 相手方向に対して右
  const mid = o ? s.clone().lerp(o, 0.5) : s.clone(); const dist = o ? s.distanceTo(o) : 2;
  switch (kind) {
    case 'close': { const dir = toOther.clone(); const pos = s.clone().addScaledVector(dir, 1.25).addScaledVector(side, 0.28).add(V(0, 0.05, 0)); return { pos, target: s.clone().addScaledVector(side, -0.04).add(V(0, -0.04, 0)), fov: 30, focus: pos.distanceTo(s) }; }
    case 'medium': { const pos = s.clone().addScaledVector(toOther, 2.1).addScaledVector(side, 0.45).add(V(0, 0.1, 0)); return { pos, target: s.clone().add(V(0, -0.12, 0)), fov: 38, focus: pos.distanceTo(s) }; }
    case 'ots': { // 相手の肩越しに話者を撮る
      const base = o ?? s.clone().addScaledVector(toOther, 1.5); const back = s.clone().sub(base).setY(0).normalize();
      const pos = base.clone().addScaledVector(back, -0.7).addScaledVector(side, -0.32).add(V(0, 0.12, 0)); return { pos, target: s.clone().add(V(0, -0.08, 0)), fov: 34, focus: pos.distanceTo(s) };
    }
    case 'wide': { const pos = mid.clone().addScaledVector(side, Math.max(3.4, dist * 1.6)).add(V(0, 0.5, 0)); return { pos, target: mid.clone().add(V(0, -0.1, 0)), fov: 46, focus: pos.distanceTo(mid) }; }
    default: { const pos = mid.clone().addScaledVector(side, Math.max(2.6, dist * 1.25)).add(V(0, 0.25, 0)); return { pos, target: mid.clone().add(V(0, -0.1, 0)), fov: 40, focus: pos.distanceTo(mid) }; }
  }
}

/** 会話の流れからショットを選ぶ。最初は二人の画面、以降は話者ごとの切り返し。重要な台詞は寄る。 */
export function pickShot(lineIndex: number, speakerIsPlayer: boolean, emphasis: boolean): ShotKind {
  if (lineIndex === 0) return 'two';
  if (emphasis) return 'close';
  return speakerIsPlayer ? 'ots' : lineIndex % 3 === 0 ? 'medium' : 'close';
}

/** 手持ちカメラの微小な揺れ（位置・向き）。amount は 0〜1。 */
export function handheld(t: number, amount: number): { dx: number; dy: number; roll: number } {
  return { dx: (Math.sin(t * 0.9) + Math.sin(t * 2.3) * 0.4) * 0.012 * amount, dy: (Math.sin(t * 1.1 + 1) + Math.sin(t * 3.1) * 0.3) * 0.009 * amount, roll: Math.sin(t * 0.7) * 0.004 * amount };
}
