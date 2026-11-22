import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { StationData } from './stationBuilder';
import { D, P, TRACK_Z } from './stationBuilder';
import { buildTrain, type TrainRig } from './trainBuilder';
import { createHumanoid, lookFromDef, type Humanoid, type HumanoidLook } from './humanoid';
import { drawPlan, type PlanMarker, type PlanView } from './plan2d';
import { canvasTex } from './materials';
import type { StationSim } from '../engine/stationSim';
import { RailSim, type TrainState } from '../engine/railSim';
import { QUALITY, AdaptiveQuality, type QualityId } from '../engine/quality';
import type { CharacterDef } from '../engine/types';

export type ViewMode = '3d' | '25d' | '2d';
export type CamMode = 'follow' | 'free' | 'first' | 'preset';

export interface RMOptions {
  canvas: HTMLCanvasElement; plan: HTMLCanvasElement; sim: StationSim; rail: RailSim; data: StationData;
  characters: Record<string, CharacterDef>; playerName: string; quality: QualityId; auto: boolean;
  onTap?: (id: string, near: boolean) => void; onFootstep?: (surface: 'tile' | 'concrete' | 'stairs') => void;
  onRailEvent?: (e: { type: 'approach' | 'arrive' | 'depart'; service: TrainState['service'] }) => void;
  onQuality?: (q: QualityId) => void; onTrainAudio?: (speed01: number, gain: number, pan: number, dwell: boolean) => void;
}

const MARK_H: Record<string, number> = { tactile: 1.3, lost_item: 1.4, elevator: 3.4, aed: 2.3, vend2: 2.5, roster_board: 2.5, terminal: 1.7, departure_board: 3.6, timetable: 2.3, emergency_btn: 1.7, fare_map: 3.2, gate_wide: 1.8, mic: 1.6, ticket_office: 2.4 };

export class RenderManager {
  o: RMOptions; sim: StationSim; data: StationData; rail: RailSim;
  renderer?: THREE.WebGLRenderer; webgl = false; scene = new THREE.Scene(); persp = new THREE.PerspectiveCamera(55, 1, 0.1, 900); ortho = new THREE.OrthographicCamera(-10, 10, 10, -10, -300, 600);
  viewMode: ViewMode = '3d'; camMode: CamMode = 'follow'; quality: QualityId; adaptive: AdaptiveQuality;
  yaw = Math.PI * 0.0; pitch = 0.32; dist = 6.2; target = new THREE.Vector3(); freeTarget = new THREE.Vector3(); isoYaw = Math.PI / 4; isoZoom = 30; fpYaw = 0; fpPitch = 0;
  presetName: string | null = null; presetPos = new THREE.Vector3(); presetTarget = new THREE.Vector3(); presetFov = 55;
  focusId: string | null = null; focusPos = new THREE.Vector3(); focusTarget = new THREE.Vector3();
  private curPos = new THREE.Vector3(); private curTarget = new THREE.Vector3(); private camInit = false;
  humans: Record<string, Humanoid> = {}; player!: Humanoid; crowd: Humanoid[] = []; rigs: Record<'A' | 'B', TrainRig> = {} as any;
  markers = new Map<string, THREE.Sprite>(); activeMarkers: PlanMarker[] = []; pickables: THREE.Object3D[] = []; markerTex?: THREE.CanvasTexture | null;
  joy = { x: 0, y: 0 }; keys = new Set<string>(); run = false; walkTarget: { x: number; z: number; id?: string } | null = null; stuck = 0;
  simMinute = 8 * 60 + 20; private lastMinute = -1; private lastBoardMinute = -1; trains: TrainState[] = [];
  private raf = 0; private last = 0; private acc = 0; private walkPhase = 0; private lastStepSign = 1; fps = 60; frameMs = 16; paused = false; time = 0;
  plan: PlanView = { cx: 0, cz: -10, scale: 6 }; planFollow = true; planLevel: 'auto' | 'ground' | 'platform' | 'deck' = 'auto'; ctx2d?: CanvasRenderingContext2D | null;
  clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 4.6); private pointers = new Map<number, { x: number; y: number }>(); private downInfo: { x: number; y: number; t: number; moved: boolean } | null = null; private pinch = 0;
  onUpdate?: (info: { t: number }) => void; envTex?: THREE.Texture; daylight = 1; private movedThisFrame = false;

  constructor(o: RMOptions) {
    this.o = o; this.sim = o.sim; this.data = o.data; this.rail = o.rail; this.quality = o.quality; this.adaptive = new AdaptiveQuality(o.quality, o.auto);
    this.ctx2d = o.plan.getContext('2d');
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: /[?&]audit/.test(location.search) });
      this.webgl = !!this.renderer.getContext(); this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch { this.webgl = false; this.viewMode = '2d'; }
    this.scene.add(this.data.root); this.scene.fog = new THREE.Fog('#cfe0ee', 90, 420); this.scene.background = new THREE.Color('#bcd6ea');
    if (this.webgl) this.setupEntities();
    this.attachInput(); this.applyQuality(); this.resetCamera();
  }

  // ===== 初期化 =====
  private setupEntities() {
    const chars = this.o.characters;
    this.player = createHumanoid({ uniform: '#233658', hair: '#2a2018', skin: '#efc9a6', staff: true, cap: false, gender: 'x' }, this.o.playerName); this.scene.add(this.player.group);
    for (const n of Object.values(this.sim.npcs)) {
      const def = chars[n.id]; const look: HumanoidLook = def ? lookFromDef(def) : { uniform: '#556', hair: '#222', skin: '#e8c29c' }; if (n.id === 'traveler') look.accessory = 'suitcase'; if (n.id === 'kajiwara') { look.height = 0.94; look.accessory = 'cane'; }
      const h = createHumanoid(look, def?.name ?? n.label); h.group.userData.anchorId = n.id; this.humans[n.id] = h; this.scene.add(h.group); this.pickables.push(h.group);
    }
    const palettes = ['#6a4c4c', '#4a5c6a', '#6a6a4c', '#5c4a6a', '#3f6a57', '#8a5a3a', '#44505e', '#7a4a60', '#4c4c4c'];
    for (let i = 0; i < this.sim.crowd.length; i++) { const h = createHumanoid({ uniform: palettes[i % palettes.length], hair: ['#222', '#3a2a1a', '#6a5a4a', '#111'][i % 4], skin: ['#efc9a6', '#e3b48f', '#f2d3b8'][i % 3], accessory: i % 3 === 0 ? 'bag' : 'none', height: 0.9 + (i % 4) * 0.05, gender: i % 2 ? 'f' : 'm' }); this.crowd.push(h); this.scene.add(h.group); }
    for (const t of ['A', 'B'] as const) { const r = buildTrain(); r.setHeading(1); r.group.visible = false; this.rigs[t] = r; this.scene.add(r.group); }
    // 調べる対象の拾い用プロキシ
    for (const a of Object.values(this.data.anchors)) {
      if (a.kind === 'npc' || a.id.startsWith('spawn')) continue;
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(a.x, a.y + 1.2, a.z); m.userData.anchorId = a.id; this.scene.add(m); this.pickables.push(m);
    }
    this.markerTex = canvasTex(128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.translate(64, 64); g.rotate(Math.PI / 4); g.fillStyle = '#ffd34d'; g.strokeStyle = '#1a1200'; g.lineWidth = 8; g.fillRect(-34, -34, 68, 68); g.strokeRect(-34, -34, 68, 68); g.rotate(-Math.PI / 4); g.fillStyle = '#1a1200'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 0, 3); }, { repeat: false });
    this.updateEntities(0);
  }

  setQuality(q: QualityId, fromAuto = false) { this.quality = q; this.adaptive.current = q; if (!fromAuto) this.adaptive.cooldown = 10; this.applyQuality(); }
  setAuto(v: boolean) { this.adaptive.enabled = v; }
  applyQuality() {
    const Q = QUALITY[this.quality]; const r = this.renderer; if (!r) return;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pixelRatioCap)); r.shadowMap.enabled = Q.shadows; r.shadowMap.needsUpdate = true;
    const sun = this.data.dynamic.sun; sun.castShadow = Q.shadows; if (sun.shadow.map) { sun.shadow.map.dispose(); (sun.shadow as any).map = null; } sun.shadow.mapSize.set(Q.shadowMap, Q.shadowMap);
    for (const l of this.data.lodObjects) l.obj.visible = Q.maxLod >= l.lod;
    this.crowd.forEach((h, i) => { h.group.userData.allowed = i < Q.crowd; });
    for (const h of Object.values(this.humans)) h.setLabel(Q.labels); this.player?.setLabel(Q.labels);
    if (Q.envMap) { if (!this.envTex) { const pm = new THREE.PMREMGenerator(r); this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } this.scene.environment = this.envTex; this.scene.environmentIntensity = 0.55; } else this.scene.environment = null;
    this.scene.traverse(o => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { x.needsUpdate = true; }); });
    this.resize();
  }
  setViewMode(m: ViewMode) {
    if (m !== '2d' && !this.webgl) return; this.viewMode = m; this.o.canvas.style.visibility = m === '2d' ? 'hidden' : 'visible'; this.o.plan.style.visibility = m === '2d' ? 'visible' : 'hidden';
    if (this.renderer) this.renderer.clippingPlanes = m === '25d' ? [this.clipPlane] : []; this.resize(); this.camInit = false;
  }
  setCameraMode(m: CamMode) { this.camMode = m; if (m === 'free') this.freeTarget.set(this.sim.player.x, this.sim.player.y + 1.4, this.sim.player.z); if (m === 'follow') { this.yaw = this.sim.player.yaw + Math.PI; } if (m === 'first') { this.fpYaw = this.sim.player.yaw; this.fpPitch = 0; } if (m !== 'preset') this.presetName = null; }
  setPreset(name: string | null) { if (!name) { this.presetName = null; if (this.camMode === 'preset') this.camMode = 'follow'; return; } const p = this.data.presets[name]; if (!p) return; this.presetName = name; this.camMode = 'preset'; this.presetPos.set(...p.pos); this.presetTarget.set(...p.target); this.presetFov = p.fov ?? 55; }
  /** 会話時：指定人物／設備にカメラを向ける */
  setFocus(id: string | null) {
    this.focusId = id; if (!id) return; const a = this.data.anchors[id]; if (!a) { this.focusId = null; return; }
    const n = this.sim.npcs[id]; const x = n ? n.x : a.x, y = n ? n.y : a.y, z = n ? n.z : a.z; const yaw = n ? n.anchorYaw : a.yaw; const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); const h = n ? 1.55 : (MARK_H[id] ?? 1.7) - 0.6;
    this.focusTarget.set(x, y + h, z).addScaledVector(side, -0.25); this.focusPos.set(x, y + h + 0.1, z).addScaledVector(fwd, n ? 2.3 : 2.8).addScaledVector(side, 0.5);
    if (this.camMode !== 'free') { /* 会話中は追従 */ }
  }
  resetCamera() { this.yaw = this.sim.player.yaw + Math.PI; this.pitch = 0.32; this.dist = 6.2; this.camInit = false; }
  setMoveInput(x: number, y: number) { this.joy.x = x; this.joy.y = y; }
  setMarkers(list: PlanMarker[]) {
    this.activeMarkers = list; const want = new Set(list.map(m => m.object));
    for (const [id, s] of this.markers) if (!want.has(id)) { this.scene.remove(s); s.material.dispose(); this.markers.delete(id); }
    for (const id of want) if (!this.markers.has(id) && this.webgl && this.data.anchors[id]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.markerTex ?? undefined, depthTest: false, transparent: true })); s.scale.set(0.55, 0.55, 1); s.renderOrder = 30; s.userData.anchorId = id; this.markers.set(id, s); this.scene.add(s); }
  }
  setSimMinute(t: number) { this.simMinute = t; }

  // ===== 入力 =====
  private attachInput() {
    const el = this.o.canvas.parentElement ?? this.o.canvas; el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => { if ((e.target as HTMLElement).closest('[data-ui]')) return; el.setPointerCapture?.(e.pointerId); this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (this.pointers.size === 1) this.downInfo = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; else { this.downInfo = null; this.pinch = this.pinchDist(); } });
    el.addEventListener('pointermove', e => {
      const p = this.pointers.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size === 1) { if (this.downInfo && Math.hypot(e.clientX - this.downInfo.x, e.clientY - this.downInfo.y) > 6) this.downInfo.moved = true; if (this.downInfo?.moved) this.drag(dx, dy, e.buttons === 2 || e.shiftKey); }
      else if (this.pointers.size === 2) { const d = this.pinchDist(); if (this.pinch > 0) this.zoom((this.pinch - d) * 0.02); this.pinch = d; this.drag(dx * 0.5, dy * 0.5, true, true); }
    });
    const up = (e: PointerEvent) => { const wasTap = this.downInfo && !this.downInfo.moved && performance.now() - this.downInfo.t < 400 && this.pointers.size === 1; this.pointers.delete(e.pointerId); if (wasTap) this.tap(e.clientX, e.clientY); if (this.pointers.size === 0) this.downInfo = null; if (this.pointers.size < 2) this.pinch = 0; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); this.zoom(e.deltaY * 0.01); }, { passive: false }); el.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)) return; this.keys.add(e.code); if (e.shiftKey) this.run = true; });
    window.addEventListener('keyup', e => { this.keys.delete(e.code); if (!e.shiftKey) this.run = false; });
  }
  private pinchDist() { const a = [...this.pointers.values()]; return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
  private drag(dx: number, dy: number, pan: boolean, _two = false) {
    if (this.viewMode === '2d') { const k = 1 / this.plan.scale; this.plan.cx -= dx * k; this.plan.cz -= dy * k; this.planFollow = false; return; }
    if (this.viewMode === '25d') { if (pan) { const k = this.isoZoom / 500; const c = Math.cos(this.isoYaw), s = Math.sin(this.isoYaw); this.freeTarget.x += (-dx * c - dy * s * 1.4) * k; this.freeTarget.z += (dx * s - dy * c * 1.4) * k; this.camMode = 'free'; } else this.isoYaw -= dx * 0.008; return; }
    if (this.camMode === 'preset') { this.camMode = 'free'; this.freeTarget.copy(this.presetTarget); const v = this.presetPos.clone().sub(this.presetTarget); this.dist = v.length(); this.yaw = Math.atan2(v.x, v.z); this.pitch = Math.asin(v.y / this.dist); }
    if (this.camMode === 'first') { this.fpYaw -= dx * 0.005; this.fpPitch = Math.max(-1.2, Math.min(1.2, this.fpPitch - dy * 0.005)); return; }
    if (pan && this.camMode === 'free') { const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); const r = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); this.freeTarget.addScaledVector(r, -dx * this.dist * 0.0022).addScaledVector(f, dy * this.dist * 0.0022); return; }
    this.yaw -= dx * 0.0065; this.pitch = Math.max(0.03, Math.min(1.35, this.pitch + dy * 0.005));
  }
  private zoom(d: number) { if (this.viewMode === '2d') { this.plan.scale = Math.max(1.6, Math.min(30, this.plan.scale * Math.exp(-d * 0.6))); return; } if (this.viewMode === '25d') { this.isoZoom = Math.max(9, Math.min(90, this.isoZoom * Math.exp(d * 0.4))); return; } if (this.camMode === 'preset') this.setCameraMode('free'); this.dist = Math.max(1.6, Math.min(this.camMode === 'free' ? 140 : 18, this.dist * Math.exp(d * 0.4))); }
  private activeCam(): THREE.Camera { return this.viewMode === '25d' ? this.ortho : this.persp; }
  private tap(cx: number, cy: number) {
    const rect = this.o.canvas.getBoundingClientRect(); const nx = ((cx - rect.left) / rect.width) * 2 - 1, ny = -((cy - rect.top) / rect.height) * 2 + 1;
    if (this.viewMode === '2d') {
      const wx = this.plan.cx + (cx - rect.left - rect.width / 2) / this.plan.scale, wz = this.plan.cz + (cy - rect.top - rect.height / 2) / this.plan.scale;
      let best: string | null = null, bd = 2.2; for (const a of Object.values(this.data.anchors)) { if (a.id.startsWith('spawn')) continue; const n = this.sim.npcs[a.id]; if (a.kind === 'npc' && !n?.visible) continue; const d = Math.hypot((n ? n.x : a.x) - wx, (n ? n.z : a.z) - wz); if (d < bd) { bd = d; best = a.id; } }
      if (best) { this.tapObject(best); return; } this.walkTarget = { x: wx, z: wz }; return;
    }
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(nx, ny), this.activeCam());
    const targets: THREE.Object3D[] = [...this.markers.values(), ...this.pickables]; const hits = ray.intersectObjects(targets, true);
    for (const h of hits) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.anchorId) o = o.parent; if (o?.userData.anchorId) { const id = o.userData.anchorId as string; if (this.o.characters[id] || this.data.anchors[id]) { this.tapObject(id); return; } } }
    const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.sim.player.y); const pt = new THREE.Vector3(); if (ray.ray.intersectPlane(pl, pt) && pt.distanceTo(this.persp.position) < 120) this.walkTarget = { x: pt.x, z: pt.z };
  }
  private tapObject(id: string) {
    const a = this.data.anchors[id]; const n = this.sim.npcs[id]; const ax = n ? n.x : a.x, az = n ? n.z : a.z; const d = Math.hypot(ax - this.sim.player.x, az - this.sim.player.z);
    const near = d <= a.radius && Math.abs((n ? n.y : a.y) - this.sim.player.y) < 2.2; this.o.onTap?.(id, near);
    if (!near && this.activeMarkers.some(m => m.object === id)) { const dx = ax - this.sim.player.x, dz = az - this.sim.player.z; const l = Math.hypot(dx, dz) || 1; this.walkTarget = { x: ax - (dx / l) * 1.2, z: az - (dz / l) * 1.2, id }; }
  }

  // ===== メインループ =====
  start() { if (this.raf) return; this.last = performance.now(); const loop = (t: number) => { this.raf = requestAnimationFrame(loop); const dt = Math.min(0.1, (t - this.last) / 1000); this.last = t; if (!this.paused) this.frame(dt); }; this.raf = requestAnimationFrame(loop); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  dispose() { this.stop(); this.renderer?.dispose(); }
  resize() {
    const host = this.o.canvas.parentElement; if (!host) return; const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    if (this.renderer) this.renderer.setSize(w, h, false); this.persp.aspect = w / h; this.persp.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); this.o.plan.width = Math.round(w * dpr); this.o.plan.height = Math.round(h * dpr); this.o.plan.style.width = '100%'; this.o.plan.style.height = '100%';
  }

  private moveVector(): { x: number; z: number } {
    let ix = this.joy.x, iy = this.joy.y; const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) iy -= 1; if (k.has('KeyS') || k.has('ArrowDown')) iy += 1; if (k.has('KeyA') || k.has('ArrowLeft')) ix -= 1; if (k.has('KeyD') || k.has('ArrowRight')) ix += 1;
    const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; }
    if (l > 0.02) this.walkTarget = null;
    const yaw = this.viewMode === '2d' ? 0 : this.viewMode === '25d' ? this.isoYaw : this.camMode === 'first' ? this.fpYaw + Math.PI : this.camMode === 'follow' || this.camMode === 'preset' ? this.yaw : this.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    let mx = fx * -iy + rx * ix, mz = fz * -iy + rz * ix;
    if (l <= 0.02 && this.walkTarget) { const dx = this.walkTarget.x - this.sim.player.x, dz = this.walkTarget.z - this.sim.player.z; const d = Math.hypot(dx, dz); if (d < 0.3) this.walkTarget = null; else { mx = dx / d; mz = dz / d; } }
    return { x: mx, z: mz };
  }

  private frame(dt: number) {
    this.time += dt; this.frameMs += (dt * 1000 - this.frameMs) * 0.1; this.fps = 1000 / Math.max(1, this.frameMs);
    const q = this.adaptive.sample(dt); if (q) { this.setQuality(q, true); this.o.onQuality?.(q); }
    this.acc += dt; let steps = 0; const mv = this.moveVector(); const frozen = this.focusId !== null && false;
    while (this.acc >= 1 / 60 && steps < 6) {
      const px = this.sim.player.x, pz = this.sim.player.z;
      if (!frozen) this.sim.move(mv.x, mv.z, 1 / 60, this.run); this.sim.update(1 / 60);
      if (this.walkTarget && Math.hypot(this.sim.player.x - px, this.sim.player.z - pz) < 0.0008) { this.stuck += 1 / 60; if (this.stuck > 0.6) { this.walkTarget = null; this.stuck = 0; } } else this.stuck = 0;
      this.acc -= 1 / 60; steps++;
    }
    if (this.sim.player.walking && this.o.onFootstep) { this.walkPhase += this.sim.player.speed * dt * 2.3; const sg = Math.sin(this.walkPhase) >= 0 ? 1 : -1; if (sg !== this.lastStepSign) { this.lastStepSign = sg; const y = this.sim.player.y; this.o.onFootstep(y > 0.1 && y < D - 0.1 && Math.abs(this.sim.player.x) > 14 || (y > 0.1 && this.sim.player.z < -12 && this.sim.player.z > -26) ? 'stairs' : y > 1 && y < 2 ? 'concrete' : 'tile'); } }
    this.updateRail(); this.updateEntities(dt); this.updateMarkers(); this.updateCamera(dt); this.render();
    this.onUpdate?.({ t: this.time });
  }

  private updateRail() {
    const t = this.simMinute; const states = this.rail.states(t); this.trains = states;
    if (this.lastMinute >= 0 && t !== this.lastMinute && Math.abs(t - this.lastMinute) < 8) for (const e of this.rail.events(this.lastMinute, t)) this.o.onRailEvent?.(e);
    this.lastMinute = t;
    if (!this.webgl) return;
    for (const tr of ['A', 'B'] as const) {
      const st = states.find(s => s.service.track === tr); const rig = this.rigs[tr]; if (!st) { rig.group.visible = false; continue; }
      rig.group.visible = true; rig.group.position.set(st.x, 0, tr === 'A' ? TRACK_Z.A : TRACK_Z.B); rig.group.rotation.y = st.service.dir === 1 ? 0 : Math.PI; rig.setDoors(st.doors);
      for (const w of rig.wheels) w.rotation.z -= (st.speed * (1 / 60)) / 0.43 * 4;
    }
    // 列車音（最も近い列車）
    let best: TrainState | null = null, bd = 1e9; for (const s of states) { const d = Math.abs(s.x - this.sim.player.x) + Math.abs((s.service.track === 'A' ? TRACK_Z.A : TRACK_Z.B) - this.sim.player.z) * 0.5; if (d < bd) { bd = d; best = s; } }
    if (best) { const indoor = this.sim.player.y > 4; const gain = Math.max(0, 1 - bd / 130) * (indoor ? 0.5 : 1); this.o.onTrainAudio?.(Math.min(1, best.speed / 24), gain, Math.max(-1, Math.min(1, (best.x - this.sim.player.x) / 40)), best.phase === 'dwell'); } else this.o.onTrainAudio?.(0, 0, 0, false);
    const mi = Math.floor(t); if (mi !== this.lastBoardMinute) { this.lastBoardMinute = mi; this.drawBoards(mi); this.applyDaylight(mi); }
  }
  private drawBoards(minute: number) {
    const rows = this.rail.board(minute); const draw = (tex: THREE.CanvasTexture | null, list: typeof rows, title: string) => { if (!tex) return; const c = tex.image as HTMLCanvasElement; const g = c.getContext('2d')!; g.fillStyle = '#060606'; g.fillRect(0, 0, c.width, c.height); g.font = 'bold 22px "Noto Sans JP","WenQuanYi Zen Hei",monospace'; g.fillStyle = '#7fd0ff'; g.fillText(title, 14, 28);
      list.slice(0, 4).forEach((r, i) => { g.fillStyle = r.delayed ? '#ff6a4a' : '#ffb347'; g.font = 'bold 34px "Noto Sans JP","WenQuanYi Zen Hei",monospace'; g.fillText(`${r.line}番線 ${r.time} ${r.kind} ${r.dest}`, 14, 68 + i * 42); g.font = 'bold 26px "Noto Sans JP","WenQuanYi Zen Hei",monospace'; g.fillStyle = r.delayed ? '#ff6a4a' : '#9bd77a'; g.textAlign = 'right'; g.fillText(r.status, c.width - 14, 68 + i * 42); g.textAlign = 'left'; }); tex.needsUpdate = true; };
    draw(this.data.boards.departure, rows, '発車案内  青嶺中央');
    this.data.boards.platformBoards.forEach((t, i) => draw(t, this.rail.board(minute, i === 0 ? 'A' : 'B'), i === 0 ? '1番線 発車案内' : '2番線 発車案内'));
  }
  applyDaylight(minute: number) {
    const f = Math.max(0, Math.min(1, (minute - 15 * 60 - 30) / (18 * 60 - 15 * 60 - 30))); this.daylight = 1 - f * 0.55; const d = this.data.dynamic;
    d.sun.intensity = 2.6 * (1 - f * 0.6); d.sun.color.set(new THREE.Color('#fff3dc').lerp(new THREE.Color('#ffb070'), f)); d.sun.position.set(-40 + f * 80, 60 - f * 36, -25 + f * 30); d.hemi.intensity = 1.05 * (1 - f * 0.4);
    (d.sky.material as THREE.MeshBasicMaterial).color.set(new THREE.Color('#ffffff').lerp(new THREE.Color('#ffc9a0'), f)); (this.scene.fog as THREE.Fog).color.set(new THREE.Color('#cfe0ee').lerp(new THREE.Color('#e8c9b0'), f));
  }

  private updateEntities(dt: number) {
    if (!this.webgl) return; const p = this.sim.player; this.player.group.position.set(p.x, p.y, p.z); this.player.group.rotation.y = p.yaw; this.player.walk(this.time * 9, p.walking ? 1 : 0); this.player.group.visible = this.camMode !== 'first' || this.viewMode !== '3d';
    for (const n of Object.values(this.sim.npcs)) { const h = this.humans[n.id]; if (!h) continue; h.group.visible = n.visible; h.group.position.set(n.x, n.y, n.z); h.group.rotation.y = n.yaw; h.walk(this.time * 2, 0); }
    this.sim.crowd.forEach((c, i) => { const h = this.crowd[i]; if (!h) return; h.group.visible = c.visible && h.group.userData.allowed !== false; h.group.position.set(c.x, c.y, c.z); h.group.rotation.y = c.yaw; h.walk(this.time * 6 + i, c.walking ? 0.8 : 0); });
    void dt;
  }
  private updateMarkers() {
    for (const [id, s] of this.markers) { const a = this.data.anchors[id]; const n = this.sim.npcs[id]; const x = n ? n.x : a.x, y = n ? n.y : a.y, z = n ? n.z : a.z; const h = n ? 2.55 : (MARK_H[id] ?? 2.0); s.position.set(x, y + h + Math.sin(this.time * 3 + x) * 0.08, z); s.visible = n ? n.visible : true; const d = s.position.distanceTo(this.activeCam().position); const sc = Math.max(0.5, Math.min(1.8, d * 0.06)); s.scale.set(sc, sc, 1); }
  }

  private updateCamera(dt: number) {
    const p = this.sim.player; const k = 1 - Math.exp(-dt * 8);
    if (this.viewMode === '25d') {
      const t = this.camMode === 'free' ? this.freeTarget : new THREE.Vector3(p.x, p.y + 1, p.z); this.target.lerp(t, this.camInit ? k : 1);
      const h = this.isoZoom, a = this.o.canvas.clientWidth / Math.max(1, this.o.canvas.clientHeight); this.ortho.left = -h * a / 2; this.ortho.right = h * a / 2; this.ortho.top = h / 2; this.ortho.bottom = -h / 2; this.ortho.updateProjectionMatrix();
      const pit = 0.615, dd = 90; this.ortho.position.set(this.target.x + Math.sin(this.isoYaw) * Math.cos(pit) * dd, this.target.y + Math.sin(pit) * dd, this.target.z + Math.cos(this.isoYaw) * Math.cos(pit) * dd); this.ortho.lookAt(this.target); this.camInit = true;
      this.clipPlane.constant = p.y > 4 ? D + 3.6 : 4.6; this.data.dynamic.sky.position.copy(this.ortho.position); return;
    }
    let pos = new THREE.Vector3(), tgt = new THREE.Vector3(); let fov = 55;
    if (this.focusId) { pos.copy(this.focusPos); tgt.copy(this.focusTarget); fov = 42; }
    else if (this.camMode === 'preset') { pos.copy(this.presetPos); tgt.copy(this.presetTarget); fov = this.presetFov; }
    else if (this.camMode === 'first') { pos.set(p.x, p.y + 1.62, p.z); tgt.set(p.x - Math.sin(this.fpYaw + Math.PI) * Math.cos(this.fpPitch), p.y + 1.62 + Math.sin(this.fpPitch), p.z - Math.cos(this.fpYaw + Math.PI) * Math.cos(this.fpPitch)); fov = 70; }
    else { const base = this.camMode === 'free' ? this.freeTarget : new THREE.Vector3(p.x, p.y + 1.45, p.z); tgt.copy(base); let d = this.dist; const inOffice = p.x > 7.2 && p.x < 13.8 && p.z > -11.8 && p.z < -1.2 && p.y > 4; if (inOffice && this.camMode === 'follow') d = Math.min(d, 3.4);
      pos.set(tgt.x + Math.sin(this.yaw) * Math.cos(this.pitch) * d, tgt.y + Math.sin(this.pitch) * d, tgt.z + Math.cos(this.yaw) * Math.cos(this.pitch) * d);
      if (this.camMode === 'follow') { const onDeck = p.y > 4 && Math.abs(p.x) < 15 && Math.abs(p.z) < 13; if (onDeck) pos.y = Math.min(pos.y, D + 3.3); if (inOffice) { pos.x = Math.max(7.35, Math.min(13.65, pos.x)); pos.z = Math.max(-11.7, Math.min(-1.3, pos.z)); } if (p.y < 0.3 && pos.y < 0.4) pos.y = 0.4; if (p.y > 1 && p.y < 3 && pos.y < p.y + 0.3) pos.y = p.y + 0.3; } }
    if (!this.camInit || this.camMode === 'follow' && !this.focusId) { this.curPos.copy(pos); this.curTarget.copy(tgt); } else { const kk = 1 - Math.exp(-dt * 6); this.curPos.lerp(pos, kk); this.curTarget.lerp(tgt, kk); }
    if (this.focusId || this.camMode === 'preset') { const kk = 1 - Math.exp(-dt * 5); this.curPos.lerp(pos, kk); this.curTarget.lerp(tgt, kk); }
    this.camInit = true; this.persp.position.copy(this.curPos); this.persp.lookAt(this.curTarget); if (Math.abs(this.persp.fov - fov) > 0.1) { this.persp.fov += (fov - this.persp.fov) * 0.15; this.persp.updateProjectionMatrix(); }
    this.data.dynamic.sky.position.copy(this.persp.position);
  }

  private render() {
    if (this.viewMode === '2d' || !this.renderer) {
      const g = this.ctx2d; if (!g) return; const cv = this.o.plan; const dpr = cv.width / Math.max(1, cv.clientWidth || cv.width);
      if (this.planFollow) { this.plan.cx += (this.sim.player.x - this.plan.cx) * 0.12; this.plan.cz += (this.sim.player.z - this.plan.cz) * 0.12; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); drawPlan(g, cv.width / dpr, cv.height / dpr, this.plan, this.data, this.sim, this.trains, this.activeMarkers, this.planLevel); return;
    }
    this.renderer.render(this.scene, this.activeCam());
  }

  stats() {
    const r = this.renderer; const mem = (performance as any).memory; return {
      fps: Math.round(this.fps), frameMs: Math.round(this.frameMs * 10) / 10, calls: r?.info.render.calls ?? 0, triangles: r?.info.render.triangles ?? 0, geometries: r?.info.memory.geometries ?? 0, textures: r?.info.memory.textures ?? 0,
      heapMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null, quality: this.quality, view: this.viewMode, cam: this.camMode, webgl: this.webgl, pixelRatio: r?.getPixelRatio() ?? 1
    };
  }
}
