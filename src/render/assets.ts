import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import gate_unit from '../../assets/models/gate_unit.glb?inline';
import gate_unit_wide from '../../assets/models/gate_unit_wide.glb?inline';
import gate_flap from '../../assets/models/gate_flap.glb?inline';
import gate_flap_wide from '../../assets/models/gate_flap_wide.glb?inline';
import ticket_blue from '../../assets/models/ticket_blue.glb?inline';
import ticket_red_fault from '../../assets/models/ticket_red_fault.glb?inline';
import fare_adjuster from '../../assets/models/fare_adjuster.glb?inline';
import train_313_cab from '../../assets/models/train_313_cab.glb?inline';
import train_313_mid from '../../assets/models/train_313_mid.glb?inline';
import train_313_cab_lo from '../../assets/models/train_313_cab_lo.glb?inline';
import train_313_mid_lo from '../../assets/models/train_313_mid_lo.glb?inline';
import human from '../../assets/models/human.glb?inline';

/** 事前制作したGLBモデル（scripts/export-models.mjs で src/lab から書き出し）。Meshopt圧縮済み。 */
const URLS: Record<string, string> = { gate_unit, gate_unit_wide, gate_flap, gate_flap_wide, ticket_blue, ticket_red_fault, fare_adjuster, train_313_cab, train_313_mid, train_313_cab_lo, train_313_mid_lo, human };
export type Assets = Record<string, THREE.Group>;
let cache: Promise<Assets> | null = null;

export function loadAssets(): Promise<Assets> {
  return (cache ??= (async () => {
    const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder as any); const out: Assets = {};
    await Promise.all(Object.entries(URLS).map(async ([k, url]) => { const g = await loader.loadAsync(url); out[k] = g.scene as THREE.Group; }));
    return out;
  })());
}

/** 材質を複製して共有を避ける（個別の色替え・点灯制御用） */
export function cloneModel(src: THREE.Object3D) {
  const c = src.clone(true); const seen = new Map<THREE.Material, THREE.Material>();
  c.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { const mat = m.material as THREE.Material; if (!seen.has(mat)) seen.set(mat, mat.clone()); m.material = seen.get(mat)!; m.castShadow = true; m.receiveShadow = true; } });
  return c;
}
