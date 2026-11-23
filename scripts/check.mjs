// 一括検査：型・静的解析・循環依存・テストを実行し、結果は1行ずつ、失敗したときだけ詳細を出す（出力量を抑える）。
import { spawnSync } from 'node:child_process';
const steps = [
  ['型検査(tsc)', 'npx', ['tsc', '--noEmit']],
  ['静的解析(ESLint)', 'npx', ['eslint', 'src', 'tests', '--quiet']],
  ['循環依存(madge)', 'npx', ['madge', '--circular', '--extensions', 'ts,tsx', '--ts-config', 'tsconfig.json', 'src']],
  ['テスト(vitest)', 'npx', ['vitest', 'run', '--reporter=dot']]
];
let bad = 0;
for (const [name, cmd, args] of steps) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' }); const out = (r.stdout ?? '') + (r.stderr ?? '');
  if (r.status === 0) console.log(`[PASS] ${name}`); else { bad++; console.log(`[FAIL] ${name}\n${out.split('\n').slice(-25).join('\n')}`); }
}
process.exit(bad ? 1 : 0);
