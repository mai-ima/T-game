// 起動スモークテスト：dist/index.html を開き、コンソールエラー・WebGL・メニューを確認して画面を保存する。
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

mkdirSync('audit/tmp', { recursive: true });
const url = pathToFileURL(resolve('dist/index.html')).href + '?debug';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = []; page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', e => logs.push('pageerror: ' + e.message));
await page.goto(url); await page.waitForSelector('.menu', { timeout: 15000 });
await page.screenshot({ path: 'audit/tmp/menu.png' });
await page.click('button.card.playable'); await page.waitForSelector('.modal');
await page.screenshot({ path: 'audit/tmp/modal.png' });
await page.click('.start-box button:has-text("はじめる"), .start-box button:has-text("最初からやり直す")'); await page.waitForSelector('.dlg-box', { timeout: 10000 });
await page.waitForTimeout(800); await page.screenshot({ path: 'audit/tmp/prologue.png' });
console.log(JSON.stringify(logs.slice(0, 20), null, 1));
await browser.close();
