import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gateUnit, gateFlap, ticketMachine, fareAdjuster } from './station';
import { triCount } from './kit';
import { trainCar } from './train';
import { humanTemplate } from './human';

/** モデルラボ：高品質モデルを組み立て、GLBへ書き出し、多視点プレビューを返す（Playwrightから呼ぶ）。 */
const MODELS: Record<string, () => THREE.Object3D> = {
  gate_unit: () => gateUnit(false), gate_unit_wide: () => gateUnit(true), gate_flap: () => gateFlap(false), gate_flap_wide: () => gateFlap(true),
  ticket_blue: () => ticketMachine('blue', 'normal', 'TicketMachine_Blue'), ticket_red_fault: () => ticketMachine('red', 'fault', 'TicketMachine_Red_Fault'), fare_adjuster: () => fareAdjuster(),
  train_313_cab: () => trainCar('cab', 'high'), train_313_mid: () => trainCar('mid', 'high'), train_313_cab_lo: () => trainCar('cab', 'low'), train_313_mid_lo: () => trainCar('mid', 'low'), human: () => humanTemplate(), human_lo: () => humanTemplate({ lod: 'low' })
};

let renderer: THREE.WebGLRenderer | null = null; let envTex: THREE.Texture | null = null;
function R(w: number, h: number) {
  if (!renderer) { renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c') as HTMLCanvasElement, antialias: true, preserveDrawingBuffer: true }); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; }
  renderer.setSize(w, h, false); return renderer;
}

(window as any).LAB = {
  names: Object.keys(MODELS),
  stats(name: string) { const o = MODELS[name](); const b = new THREE.Box3().setFromObject(o); const s = b.getSize(new THREE.Vector3()); const c = b.getCenter(new THREE.Vector3()); let meshes = 0, mats = new Set<string>(), named = 0; o.traverse(x => { if ((x as THREE.Mesh).isMesh) { meshes++; mats.add(((x as THREE.Mesh).material as THREE.Material).name); } if (x.name) named++; }); const top: [string, number][] = []; o.traverse(x => { const m = x as THREE.Mesh; if (m.isMesh) top.push([m.name, Math.round((m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3)]); }); top.sort((a, b) => b[1] - a[1]);
    return { top: top.slice(0, 7), tris: triCount(o), meshes, materials: [...mats], size: [s.x, s.y, s.z].map(v => +v.toFixed(3)), center: [c.x, c.y, c.z].map(v => +v.toFixed(3)), named }; },
  async exportGLB(name: string): Promise<string> {
    const o = MODELS[name](); const ex = new GLTFExporter();
    const buf: ArrayBuffer = await new Promise((res, rej) => ex.parse(o, r => res(r as ArrayBuffer), e => rej(e), { binary: true, onlyVisible: false, maxTextureSize: 512 }));
    let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
  },
  /** 多視点プレビュー。target未指定ならバウンディングボックス中心 */
  preview(name: string, yaw: number, pitch: number, distMul = 1.6, w = 640, h = 480, opts: { target?: [number, number, number]; dist?: number; walk?: number; hair?: string; cap?: boolean; glasses?: boolean } = {}) {
    const o = MODELS[name]();
    if (name.startsWith('human')) { const g = (n: string) => o.getObjectByName(n)!; const ph = opts.walk ?? 0, a = Math.sin(ph) * 0.62; g('LegL').rotation.x = a; g('LegR').rotation.x = -a; g('ShinL').rotation.x = Math.max(0, -a) * 0.9; g('ShinR').rotation.x = Math.max(0, a) * 0.9; g('ArmL').rotation.x = -a * 0.7; g('ArmR').rotation.x = a * 0.7; g('ForearmL').rotation.x = -0.12 - Math.max(0, a) * 0.5; g('ForearmR').rotation.x = -0.12 - Math.max(0, -a) * 0.5; if (opts.hair) { g('HairShort').visible = opts.hair === 'short'; g('HairLong').visible = opts.hair === 'long'; g('HairBun').visible = opts.hair === 'bun'; } if (opts.cap) g('Cap').visible = true; if (opts.glasses) g('Glasses').visible = true; if (distMul === 0.55 && !opts.target) { opts = { ...opts, target: [0, 1.6, 0], dist: 0.8 }; } } const scene = new THREE.Scene(); scene.background = new THREE.Color('#9fb2c4'); scene.environment = (R(w, h), envTex);
    const hemi = new THREE.HemisphereLight('#dfeaff', '#6b6657', 0.7); const sun = new THREE.DirectionalLight('#fff3df', 2.4); sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(hemi, sun); scene.add(o);
    const b = new THREE.Box3(); o.updateMatrixWorld(true); o.traverseVisible(x => { if ((x as THREE.Mesh).isMesh) b.expandByObject(x); }); const c = b.getCenter(new THREE.Vector3()); const sz = b.getSize(new THREE.Vector3()); const r = Math.max(sz.x, sz.y, sz.z) * 0.5;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#c4c4be', roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = b.min.y - 0.001; floor.receiveShadow = true; scene.add(floor);
    sun.shadow.camera.left = -r * 2; sun.shadow.camera.right = r * 2; sun.shadow.camera.top = r * 2; sun.shadow.camera.bottom = -r * 2; sun.shadow.camera.far = 60;
    const cam = new THREE.PerspectiveCamera(35, w / h, 0.02, 400); const d = opts.dist ?? r * distMul * 2.4; if (opts.target) c.set(...opts.target); cam.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * d, c.y + Math.sin(pitch) * d, c.z + Math.cos(yaw) * Math.cos(pitch) * d); cam.lookAt(c);
    const rr = R(w, h); rr.render(scene, cam); return (document.getElementById('c') as HTMLCanvasElement).toDataURL('image/jpeg', 0.86);
  }
};
