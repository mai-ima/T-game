import * as THREE from 'three';
import { cloneModel, type Assets } from './assets';
import { RAIL_TOP } from './stationBuilder';

/** 3両編成（先頭車＋中間車＋先頭車）。GLBの車両モデルを並べ、ホーム側ドアの開閉・車輪回転・前照灯/尾灯を制御する。 */
export interface TrainRig { group: THREE.Group; setDoors(open: number): void; spin(distance: number): void; doors: THREE.Object3D[]; wheels: THREE.Object3D[]; cars: number; triangles: number }

export function buildTrainRig(assets: Assets, track: 'A' | 'B', lowDetail: boolean): TrainRig {
  const group = new THREE.Group(); group.name = `編成_${track}線`; const suffix = lowDetail ? '_lo' : '';
  const heading = track === 'A' ? -1 : 1; group.rotation.y = heading === 1 ? 0 : Math.PI; group.position.y = RAIL_TOP;
  const spec: [string, number, number][] = [[`train_313_cab${suffix}`, -20, Math.PI], [`train_313_mid${suffix}`, 0, 0], [`train_313_cab${suffix}`, 20, 0]];
  const doors: THREE.Object3D[] = []; const wheels: THREE.Object3D[] = []; let tris = 0;
  spec.forEach(([name, x, ry], ci) => {
    const car = cloneModel(assets[name]); car.position.x = x; car.rotation.y = ry; car.name = `${name}#${ci}`; group.add(car);
    const rear = ci === 0; car.traverse(o => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mat = m.material as THREE.MeshStandardMaterial; if (mat.name === 'HeadLight') mat.emissiveIntensity = rear ? 0 : 1.8; if (mat.name === 'TailLight') mat.emissiveIntensity = rear ? 1.4 : 0.05; tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; if (mat.name === 'WindowGlass') { mat.opacity = 0.5; } });
  });
  group.updateMatrixWorld(true);
  const platSign = track === 'A' ? 1 : -1; const wp = new THREE.Vector3(); // 編成は構築時 z=0 にあるため、線路中心からの符号は world z の符号そのもの
  group.traverse(o => { if (/^Door_[PN]_/.test(o.name)) { o.getWorldPosition(wp); if (Math.sign(wp.z) === platSign) doors.push(o); } if (o.userData?.wheel) wheels.push(o); });
  return {
    group, doors, wheels, cars: 3, triangles: Math.round(tris),
    setDoors(open) { const e = Math.max(0, Math.min(1, open)); for (const d of doors) { d.position.x = d.userData.base + d.userData.slide * e; } },
    spin(dist) { for (const w of wheels) w.rotation.z -= dist / 0.43; }
  };
}
