// dist/index.html（単一HTML）から、Claude Artifacts 用の本文断片（artifact/index.html）を生成する。
// Artifactsは <!doctype>/<html>/<head>/<body> を自前で付けるため、title・style・root・scriptのみを出力する。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync('dist/index.html', 'utf8');
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim().length > 0);
if (scripts.length !== 1) throw new Error('想定外のscript数: ' + scripts.length);
const js = scripts[0].replace(/<\/script/gi, '<\\/script');
if (/import\.meta/.test(js)) console.warn('警告: import.meta が含まれます（classic scriptでは動作しない可能性）');

const out = `<title>REAL RAIL &amp; ROAD</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/index.html', out);
const hash = createHash('sha256').update(out).digest('hex').slice(0, 16);
console.log(`artifact/index.html: ${(out.length / 1024).toFixed(0)} KB, sha256:${hash}`);
