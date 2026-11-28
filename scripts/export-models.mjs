// モデルラボをビルドし、Chromium上でGLBへ書き出し＋多視点プレビューを保存する。
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization, KHRTextureTransform } from '@gltf-transform/extensions';
import { dedup, prune, quantize, meshopt, textureCompress } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { resolve } from 'node:path';

const only = process.argv[2] ? process.argv[2].split(',') : null;
if (!process.env.SKIP_BUILD) execSync('npx vite build --config vite.lab.config.ts', { stdio: 'inherit' });
mkdirSync('assets/models', { recursive: true }); mkdirSync('audit/models', { recursive: true });
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization, KHRTextureTransform]).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 640 } }); const errs = [];
page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(pathToFileURL(resolve('dist-lab/index.html')).href); await page.waitForFunction(() => window.LAB);
const names = (await page.evaluate(() => window.LAB.names)).filter(n => !only || only.includes(n)); const report = {};
for (const n of names) {
  const st = await page.evaluate(n => window.LAB.stats(n), n); const b64 = await page.evaluate(n => window.LAB.exportGLB(n), n);
  writeFileSync(`assets/models/${n}.glb`, Buffer.from(b64, 'base64')); const rawKB = Math.round(statSync(`assets/models/${n}.glb`).size / 1024);
  { const doc = await io.read(`assets/models/${n}.glb`); await doc.transform(dedup(), prune(), quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }), meshopt({ encoder: MeshoptEncoder, level: 'high' })); await io.write(`assets/models/${n}.glb`, doc); }
  const kb = Math.round(statSync(`assets/models/${n}.glb`).size / 1024); report[n] = { ...st, glbKB: kb, rawKB };
  const views = [['pz', 0, 0.08, 1.15], ['px', Math.PI / 2, 0.08, 1.15], ['nz', Math.PI, 0.08, 1.15], ['nx', -Math.PI / 2, 0.08, 1.15], ['top', 0.3, 1.25, 1.15], ['three', 0.7, 0.35, 1.0], ['close', 0.5, 0.2, 0.55]]; if (n.includes('cab')) views.push(['face', Math.PI / 2 - 0.5, 0.1, 0, { target: [10.1, 2.1, 0], dist: 6 }], ['face2', Math.PI / 2 + 0.35, 0.12, 0, { target: [10.1, 2.0, 0], dist: 4.2 }], ['facelow', Math.PI / 2 - 0.25, 0.0, 0, { target: [10.3, 1.2, 0], dist: 3.4 }]);
  for (const [v, yaw, pitch, mul, o] of views) { const url = await page.evaluate(([n, yaw, pitch, mul, o]) => window.LAB.preview(n, yaw, pitch, mul ?? 1.7, 800, 560, o ?? {}), [n, yaw, pitch, mul, o]); writeFileSync(`audit/models/${n}_${v}.jpg`, Buffer.from(url.split(',')[1], 'base64')); }
  console.log(n, JSON.stringify(report[n]));
}
writeFileSync('assets/models/manifest.json', JSON.stringify({ generated: new Date().toISOString(), models: report }, null, 1));
if (errs.length) console.log('ERRORS', errs.slice(0, 5));
await browser.close();
