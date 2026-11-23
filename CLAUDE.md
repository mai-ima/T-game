# REAL RAIL & ROAD — 作業メモ（Claude向け）

- 常に日本語で応答。UIは自然な日本語。プロトタイプは Claude Artifacts のみ（Vercel禁止）。開発ブランチ `claude/determined-babbage-4drhs6` のみにpush。
- 実行・検証していないことを「完了」と言わない。結果は PASS / FAIL / UNVERIFIED で報告。
- 構成は `docs/ARCHITECTURE.md`。ストーリーの原本は `scripts/build-story.mjs`（`node scripts/build-story.mjs` で `src/data/r7/story.json` を再生成）。

## よく使うコマンド（出力が短い順）
- `npm run check` … 型・ESLint・循環依存・テストを一括実行し、1行ずつ結果表示（失敗時のみ詳細）
- `npm test` / `npm run lint` / `npm run knip`（未使用コード）/ `npm run coverage`
- `npx vite build && node scripts/make-artifact.mjs` … Artifact用 `artifact/index.html` を生成
- `SOAK_SEC=20 node scripts/audit.mjs` … 総合監査（長いので必ずバックグラウンド実行。`dist/` のビルドが前提）

## 読まないこと（大きい生成物。必要なら grep/jq で一部だけ）
`dist/` `artifact/` `audit/shots/` `src/data/r7/story.json` `assets/models/*.glb` `package-lock.json`
