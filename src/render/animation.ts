/**
 * 動作エンジン：歩行などの基本動作の上に、重ね合わせ（アディティブ）の層で「生きている」動きを足す。
 * 呼吸・体重移動・視線（頭の追従）・話すときの頭と腕の動き・聞くときのうなずき。
 * 各層はなめらかに重みが変わる（切替で急に動かない）。純粋に節点の回転だけを触る。
 */
import * as THREE from 'three';

export type Act = 'idle' | 'talk' | 'listen';
export interface ActInput { act: Act; lookAt?: THREE.Vector3 | null; emphasis?: number }
interface Rig { head?: THREE.Object3D; torso?: THREE.Object3D; armL?: THREE.Object3D; armR?: THREE.Object3D; root: THREE.Object3D }

const damp = (cur: number, to: number, rate: number, dt: number) => cur + (to - cur) * (1 - Math.exp(-rate * dt));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class Animator {
  private w = { talk: 0, listen: 0 }; private t = Math.random() * 100; private yaw = 0; private pitch = 0; private nod = 0; private seed = Math.random() * 6.28;
  private tmp = new THREE.Vector3(); private inv = new THREE.Matrix4(); private base = new Map<THREE.Object3D, THREE.Euler>();
  /** 歩行が駆動しない軸は、基準姿勢からの絶対値で指定する（毎フレーム足し込まない） */
  private set(o: THREE.Object3D | undefined, axis: 'x' | 'y' | 'z', v: number, absolute: boolean) { if (!o) return; let b = this.base.get(o); if (!b) { b = o.rotation.clone(); this.base.set(o, b); } o.rotation[axis] = absolute ? b[axis] + v : o.rotation[axis] + v; }
  constructor(private rig: Rig) {}

  /** 歩行など基本動作を適用したあとに呼ぶ。walkAmount が大きいほど重ね合わせを弱める。 */
  update(dt: number, inp: ActInput, walkAmount: number) {
    const { head, torso, armL, armR, root } = this.rig; this.t += dt; const still = 1 - clamp(walkAmount, 0, 1);
    this.w.talk = damp(this.w.talk, inp.act === 'talk' ? 1 : 0, 6, dt); this.w.listen = damp(this.w.listen, inp.act === 'listen' ? 1 : 0, 5, dt);
    // 呼吸：胸の上下とわずかな肩の動き
    const br = Math.sin(this.t * 1.7 + this.seed); this.set(torso, 'x', br * 0.012 * still, true); this.set(torso, 'z', Math.sin(this.t * 0.45 + this.seed) * 0.012 * still, true);
    // 視線：対象の方向へ頭を向ける（首の可動域内）。対象がなければ正面へ戻る
    let ty = 0, tp = 0;
    if (inp.lookAt && head) {
      root.updateWorldMatrix(true, false); this.inv.copy(root.matrixWorld).invert(); this.tmp.copy(inp.lookAt).applyMatrix4(this.inv);
      const d = Math.hypot(this.tmp.x, this.tmp.z); if (d > 0.2) { ty = clamp(Math.atan2(this.tmp.x, this.tmp.z), -0.9, 0.9); tp = clamp(-Math.atan2(this.tmp.y - 1.6, d), -0.35, 0.35); }
    }
    this.yaw = damp(this.yaw, ty, 5, dt); this.pitch = damp(this.pitch, tp, 5, dt);
    // 話す：強調に合わせた小さな頭の揺れ。聞く：ゆっくりしたうなずき
    const talkSway = this.w.talk * (Math.sin(this.t * 4.1) * 0.05 + Math.sin(this.t * 6.7) * 0.025) * (0.6 + (inp.emphasis ?? 0.4));
    this.nod = this.w.listen * Math.max(0, Math.sin(this.t * 1.3)) ** 3 * 0.16;
    this.set(head, 'y', this.yaw * still + talkSway * 0.6, true); this.set(head, 'x', this.pitch * still + this.nod + Math.abs(talkSway) * 0.5, true); this.set(head, 'z', Math.sin(this.t * 0.6 + this.seed) * 0.02 * still, true);
    // 話す：身ぶり（腕を少し持ち上げて、リズムに合わせて動かす）
    const g = this.w.talk * still; this.set(armR, 'x', -g * (0.45 + Math.sin(this.t * 3.1) * 0.18), false); this.set(armR, 'z', -g * 0.1, true);
    this.set(armL, 'x', -g * (0.2 + Math.max(0, Math.sin(this.t * 2.3 + 1)) * 0.2) * 0.8, false);
  }
}

export function rigOf(root: THREE.Object3D): Rig {
  const f = (n: string) => root.getObjectByName(n) ?? undefined; return { root, head: f('Head'), torso: f('Torso'), armL: f('ArmL'), armR: f('ArmR') };
}
