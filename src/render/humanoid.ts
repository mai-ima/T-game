import * as THREE from 'three';
import type { CharacterDef } from '../engine/types';
import { canvasTex } from './materials';
import { cloneModel } from './assets';

export interface HumanoidLook { uniform: string; hair: string; skin: string; accessory?: string; gender?: string; trousers?: string; height?: number; staff?: boolean; cap?: boolean }
export interface Humanoid { group: THREE.Group; walk(phase: number, amount: number): void; setLabel(visible: boolean): void; look: HumanoidLook; label?: THREE.Sprite }

const geoCache = new Map<string, THREE.BufferGeometry>();
const G = (k: string, f: () => THREE.BufferGeometry) => geoCache.get(k) ?? (geoCache.set(k, f()), geoCache.get(k)!);
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const Mt = (c: string, r = 0.8, m = 0) => { const k = c + r + m; return matCache.get(k) ?? (matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m })), matCache.get(k)!); };

export function lookFromDef(d: CharacterDef): HumanoidLook {
  return { uniform: d.uniform, hair: d.hair, skin: d.skin, accessory: d.accessory, gender: d.gender, staff: d.dept === 'station' || d.dept === 'hr' || d.dept === 'dispatch', cap: d.accessory === 'cap' };
}

export function createHumanoid(look: HumanoidLook, name?: string): Humanoid {
  const g = new THREE.Group(); const s = look.height ?? 1;
  const trousers = look.trousers ?? (look.staff ? '#232a38' : '#3a3a44');
  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };
  // 脚（股関節を支点に回転）
  const mkLeg = (x: number) => { const p = new THREE.Group(); p.position.set(x, 0.9, 0); p.add(mesh(G('leg', () => new THREE.BoxGeometry(0.15, 0.82, 0.17)), Mt(trousers), 0, -0.41, 0)); p.add(mesh(G('shoe', () => new THREE.BoxGeometry(0.16, 0.08, 0.26)), Mt('#1a1a1a', 0.6), 0, -0.86, 0.04)); return p; };
  const legL = mkLeg(-0.11), legR = mkLeg(0.11); g.add(legL, legR);
  const torso = mesh(G('torso', () => new THREE.BoxGeometry(0.44, 0.58, 0.25)), Mt(look.uniform, 0.7), 0, 1.2, 0); g.add(torso);
  g.add(mesh(G('shirt', () => new THREE.BoxGeometry(0.16, 0.2, 0.02)), Mt('#f4f4f0'), 0, 1.38, 0.13));
  if (look.staff) { g.add(mesh(G('tie', () => new THREE.BoxGeometry(0.05, 0.2, 0.02)), Mt('#b02a2a'), 0, 1.34, 0.145)); g.add(mesh(G('tag', () => new THREE.BoxGeometry(0.09, 0.05, 0.01)), Mt('#ffffff'), 0.12, 1.25, 0.135)); }
  const mkArm = (x: number) => { const p = new THREE.Group(); p.position.set(x, 1.46, 0); p.add(mesh(G('arm', () => new THREE.BoxGeometry(0.11, 0.54, 0.13)), Mt(look.uniform, 0.7), 0, -0.26, 0)); p.add(mesh(G('hand', () => new THREE.SphereGeometry(0.06, 8, 6)), Mt(look.skin), 0, -0.56, 0)); return p; };
  const armL = mkArm(-0.28), armR = mkArm(0.28); g.add(armL, armR);
  g.add(mesh(G('neck', () => new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8)), Mt(look.skin), 0, 1.53, 0));
  const head = mesh(G('head', () => new THREE.SphereGeometry(0.125, 14, 12)), Mt(look.skin, 0.7), 0, 1.66, 0); g.add(head);
  for (const x of [-0.045, 0.045]) head.add(mesh(G('eye', () => new THREE.SphereGeometry(0.014, 6, 6)), Mt('#111'), x, 0.01, 0.115));
  const hairG = G('hair', () => new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62));
  const hair = mesh(hairG, Mt(look.hair, 0.9), 0, 1.675, -0.005); hair.rotation.x = -0.15; g.add(hair);
  if (look.gender === 'f') g.add(mesh(G('hairB', () => new THREE.BoxGeometry(0.24, 0.26, 0.08)), Mt(look.hair, 0.9), 0, 1.58, -0.1));
  if (look.cap) { g.add(mesh(G('cap', () => new THREE.CylinderGeometry(0.135, 0.145, 0.07, 14)), Mt('#1d2a44', 0.7), 0, 1.78, 0)); g.add(mesh(G('visor', () => new THREE.BoxGeometry(0.22, 0.015, 0.1)), Mt('#141c2e', 0.6), 0, 1.755, 0.14)); g.add(mesh(G('badge', () => new THREE.BoxGeometry(0.05, 0.04, 0.01)), Mt('#d8b030', 0.4, 0.5), 0, 1.785, 0.145)); }
  if (look.accessory === 'glasses') for (const x of [-0.05, 0.05]) { const r = mesh(G('lens', () => new THREE.TorusGeometry(0.03, 0.006, 6, 12)), Mt('#222'), x, 1.67, 0.122); g.add(r); }
  if (look.accessory === 'bag') g.add(mesh(G('bag', () => new THREE.BoxGeometry(0.2, 0.22, 0.1)), Mt('#6a4a3a', 0.8), 0.3, 0.88, 0));
  if (look.accessory === 'cane') g.add(mesh(G('cane', () => new THREE.CylinderGeometry(0.012, 0.012, 0.85, 6)), Mt('#4a3a2a'), 0.36, 0.42, 0.1));
  if (look.accessory === 'suitcase') { g.add(mesh(G('suitcase', () => new THREE.BoxGeometry(0.4, 0.62, 0.22)), Mt('#1f6f8a', 0.5), 0.5, 0.34, 0.1)); }
  g.scale.setScalar(s);
  let label: THREE.Sprite | undefined;
  if (name) {
    const tex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = 'rgba(14,20,34,.82)'; c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, 14); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 30px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2 + 2); }, { repeat: false });
    label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex ?? undefined, transparent: true, depthTest: true })); label.scale.set(1.1, 0.28, 1); label.position.y = 2.15; label.renderOrder = 20; g.add(label);
  }
  return {
    group: g, look, label,
    walk(phase, amount) { const a = Math.sin(phase) * 0.7 * amount; legL.rotation.x = a; legR.rotation.x = -a; armL.rotation.x = -a * 0.8; armR.rotation.x = a * 0.8; torso.position.y = 1.2 + Math.abs(Math.sin(phase)) * 0.015 * amount; },
    setLabel(v) { if (label) label.visible = v; }
  };
}


/** GLBテンプレート（src/lab/human.ts製）から個別の人物を作る。材質名で色替え、節点の表示切替で髪型・持ち物を変える。 */
export function createHumanoidFrom(template: THREE.Object3D, look: HumanoidLook, name?: string): Humanoid {
  const g = cloneModel(template); const s = look.height ?? 1; g.scale.setScalar(s);
  const col: Record<string, string> = { Uniform: look.uniform, Hair: look.hair, Skin: look.skin, Trousers: look.trousers ?? (look.staff ? '#232a38' : '#3a3a44'), Accessory: '#1d2a44', Shirt: look.staff ? '#f4f4f0' : look.uniform };
  g.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { const mat = m.material as THREE.MeshStandardMaterial; const c = col[mat.name]; if (c) mat.color.set(c); } });
  const node = (n: string) => g.getObjectByName(n); const vis = (n: string, v: boolean) => { const o = node(n); if (o) o.visible = v; };
  vis('HairLong', look.gender === 'f'); vis('HairShort', look.gender !== 'f'); vis('Cap', !!look.cap); vis('Glasses', look.accessory === 'glasses'); vis('Bag', look.accessory === 'bag'); vis('Cane', look.accessory === 'cane'); vis('Suitcase', look.accessory === 'suitcase'); vis('TieNode', !!look.staff);
  const legL = node('LegL')!, legR = node('LegR')!, armL = node('ArmL')!, armR = node('ArmR')!, shinL = node('ShinL')!, shinR = node('ShinR')!, foreL = node('ForearmL')!, foreR = node('ForearmR')!, torso = node('Torso')!;
  let label: THREE.Sprite | undefined;
  if (name) {
    const tex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = 'rgba(14,20,34,.82)'; c.beginPath(); c.roundRect(2, 2, w - 4, h - 4, 14); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 30px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, w / 2, h / 2 + 2); }, { repeat: false });
    label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex ?? undefined, transparent: true, depthTest: true })); label.scale.set(1.1 / s, 0.28 / s, 1); label.position.y = 2.1; label.renderOrder = 20; g.add(label);
  }
  const base = torso.position.y;
  return { group: g as THREE.Group, look, label,
    walk(phase, amount) { const a = Math.sin(phase) * 0.62 * amount; legL.rotation.x = a; legR.rotation.x = -a; shinL.rotation.x = Math.max(0, -a) * 0.9 * amount; shinR.rotation.x = Math.max(0, a) * 0.9 * amount; armL.rotation.x = -a * 0.7; armR.rotation.x = a * 0.7; foreL.rotation.x = -0.12 - Math.max(0, a) * 0.5 * amount; foreR.rotation.x = -0.12 - Math.max(0, -a) * 0.5 * amount; torso.position.y = base + Math.abs(Math.sin(phase)) * 0.012 * amount; },
    setLabel(v) { if (label) label.visible = v; } };
}
