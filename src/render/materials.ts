import * as THREE from 'three';

const hasDOM = typeof document !== 'undefined';

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, opts: { repeat?: boolean; srgb?: boolean } = {}): THREE.CanvasTexture | null {
  if (!hasDOM) return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); if (!g) return null;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.repeat !== false) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rnd(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function noise(g: CanvasRenderingContext2D, w: number, h: number, base: string, amt: number, seed: number, n = 6000) {
  g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rnd(seed);
  for (let i = 0; i < n; i++) { const v = Math.floor(128 + (r() - 0.5) * amt * 2); g.fillStyle = `rgba(${v},${v},${v},${0.12 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}

export interface MatDef { mat: THREE.Material; tile?: number }

/** 手続き生成テクスチャ付きPBR材質。tile指定のものはワールド座標ベースのUVを使う。 */
export function createMaterials(lowQuality = false): Record<string, MatDef> {
  const S = (p: THREE.MeshStandardMaterialParameters, tile?: number): MatDef => ({ mat: new THREE.MeshStandardMaterial(p), tile });
  const concrete = canvasTex(256, 256, (g, w, h) => { noise(g, w, h, '#b9b9b4', 22, 1, 9000); g.strokeStyle = 'rgba(70,70,70,.35)'; g.lineWidth = 1.5; g.strokeRect(0, 0, w, h); });
  const platformTex = canvasTex(256, 256, (g, w, h) => { noise(g, w, h, '#a9aaa6', 18, 2, 9000); g.strokeStyle = 'rgba(60,60,60,.4)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); });
  const tile = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d7d5cf'; g.fillRect(0, 0, w, h); const r = rnd(5); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 200 + r() * 14; g.fillStyle = `rgb(${v},${v - 2},${v - 8})`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } });
  const asphalt = canvasTex(256, 256, (g, w, h) => noise(g, w, h, '#3b3d41', 30, 3, 12000));
  const grass = canvasTex(256, 256, (g, w, h) => { noise(g, w, h, '#587a3e', 30, 4, 12000); });
  const ballast = canvasTex(256, 256, (g, w, h) => { noise(g, w, h, '#6d6a66', 45, 5, 16000); });
  const paving = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b9a791'; g.fillRect(0, 0, w, h); const r = rnd(6); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = r() * 22; g.fillStyle = `rgb(${185 + v},${166 + v},${140 + v})`; g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); } });
  const tactile = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#e8c21a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6dc55'; const r = rnd(7); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 7, 0, 7); g.fill(); } g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeRect(0, 0, w, h); void r; });
  const facade = (seed: number, base: string) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rnd(seed); for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) { g.fillStyle = r() > 0.78 ? '#f1dc9c' : '#3c4a5a'; g.fillRect(i * 42 + 8, j * 32 + 6, 28, 20); } });
  const roofSteel = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#cfd4d8'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 8; i++) g.fillRect(i * 16, 0, 2, h); });
  const wood = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i < 12; i++) g.fillRect(0, i * 11, w, 1.5); });
  const m: Record<string, MatDef> = {
    concrete: S({ map: concrete, roughness: 0.92 }, 3), platform: S({ map: platformTex, roughness: 0.88 }, 3), tile: S({ map: tile, roughness: 0.55, metalness: 0.02 }, 2),
    asphalt: S({ map: asphalt, roughness: 0.95 }, 4), grass: S({ map: grass, roughness: 1 }, 6), ballast: S({ map: ballast, roughness: 1 }, 2), paving: S({ map: paving, roughness: 0.9 }, 4),
    tactile: S({ map: tactile, roughness: 0.7 }, 0.9),
    wall: S({ color: '#e9e6df', roughness: 0.85 }), wallDark: S({ color: '#4b5560', roughness: 0.7 }), trim: S({ color: '#2d3640', roughness: 0.5, metalness: 0.4 }),
    steel: S({ color: '#8d959c', roughness: 0.45, metalness: 0.75 }), steelDark: S({ color: '#40464c', roughness: 0.5, metalness: 0.7 }), paint: S({ color: '#2f6a4f', roughness: 0.6, metalness: 0.2 }),
    glass: { mat: new THREE.MeshPhysicalMaterial({ color: '#a9cde0', roughness: 0.05, metalness: 0, transparent: true, opacity: lowQuality ? 0.35 : 0.28, side: THREE.DoubleSide, depthWrite: false }) },
    glassDark: S({ color: '#17212b', roughness: 0.1, metalness: 0.6 }),
    roof: S({ map: roofSteel, roughness: 0.6, metalness: 0.4 }, 3), woodMat: S({ map: wood, roughness: 0.75 }, 1), rubber: S({ color: '#1c1c1e', roughness: 0.9 }),
    yellow: S({ color: '#e6bd1e', roughness: 0.6 }), white: S({ color: '#f1f1ee', roughness: 0.7 }), red: S({ color: '#c0302b', roughness: 0.55 }), green: S({ color: '#2f8a4d', roughness: 0.6 }), blue: S({ color: '#2b5fa8', roughness: 0.5 }), orange: S({ color: '#e87a1e', roughness: 0.5 }), teal: S({ color: '#1f8a95', roughness: 0.5 }),
    stainless: S({ color: '#d4d9dd', roughness: 0.3, metalness: 0.88 }), rail: S({ color: '#7a756f', roughness: 0.4, metalness: 0.8 }), sleeper: S({ color: '#8f8a82', roughness: 0.9 }),
    emissiveWhite: new Object({ mat: new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#fff2b0', emissiveIntensity: 1.6 }) }) as MatDef,
    emissiveRed: { mat: new THREE.MeshStandardMaterial({ color: '#7a0f0f', emissive: '#ff2a1a', emissiveIntensity: 1.4 }) },
    leaf: S({ color: '#3f7a3a', roughness: 0.95 }), leafLight: S({ color: '#7aa648', roughness: 0.95 }), trunk: S({ color: '#5a4430', roughness: 1 }), skinMat: S({ color: '#e8c29c', roughness: 0.8 }),
    bldgA: S({ map: facade(11, '#c9c6bd'), roughness: 0.85 }, 6), bldgB: S({ map: facade(12, '#a9b5bf'), roughness: 0.85 }, 6), bldgC: S({ map: facade(13, '#d8c9b4'), roughness: 0.85 }, 6),
    hill: S({ color: '#5f7a58', roughness: 1, flatShading: true }), hillFar: S({ color: '#8aa0a6', roughness: 1, flatShading: true }),
    vendRed: S({ color: '#c9372d', roughness: 0.4, metalness: 0.2 }), vendBlue: S({ color: '#2a5caa', roughness: 0.4, metalness: 0.2 }), ticket: S({ color: '#e4e9ec', roughness: 0.35, metalness: 0.3 }), screen: { mat: new THREE.MeshStandardMaterial({ color: '#0e2a3a', emissive: '#2d8fc2', emissiveIntensity: 0.9 }) },
    errScreen: { mat: new THREE.MeshStandardMaterial({ color: '#3a0e0e', emissive: '#d03a2a', emissiveIntensity: 0.9 }) }
  };
  return m;
}

export function labelTexture(text: string, sub = '', w = 512, h = 128, bg = '#1c3d6e', fg = '#ffffff'): THREE.CanvasTexture | null {
  return canvasTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${sub ? 56 : 66}px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif`; g.fillText(text, w / 2, sub ? h * 0.38 : h / 2); if (sub) { g.font = `28px "Noto Sans JP","WenQuanYi Zen Hei",sans-serif`; g.fillText(sub, w / 2, h * 0.8); } g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8); }, { repeat: false });
}
