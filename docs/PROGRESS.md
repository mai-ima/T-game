# PROGRESS — セッション引継ぎ

最終更新：2026-11-23

- 状態：**IN PROGRESS**（R7第1章の縦断は実装済み。総合監査を実行中。全体の1%程度であり、完成ではない）
- ブランチ：`claude/determined-babbage-4drhs6`（pushは開発ブランチのみ。main直push・force push禁止）
- ビルド：`npx vite build` OK、`npm run check`（tsc／ESLint／madge／vitest 56件）PASS
- iPhone実機：UNVERIFIED／実機の音・FPS・発熱：UNVERIFIED／ESLint導入済み（0エラー）
- Artifact：ユーザー判断により**試作の公開は不要**（DEC-012）。`artifact/index.html` は生成のみ維持。Vercelは使わない

## 今回までの成果（実装済み）
14モードメニュー（R7のみプレイ可）／共通エンジン（条件・効果・保存・キャリア）／R7第1章（309ノード、重要選択4、34依頼、6種のミニゲーム、持ち場3分岐、ch2冒頭）／3D駅（GLBモデル、改札・扉・事務室）／3D・擬似3D・2D切替／2Dピクセル会話／BGM・効果音／スマホHUD・目的地ナビ。

## 検出したツール（BOOT-001）
- 使用可：Read/Write/Edit/Glob/Grep/Bash、TaskCreate/Get/List/Update、Agent（general-purpose, Explore, Plan, claude-code-guide ほか）、Skill（code-review ほか）、Monitor、ScheduleWakeup、Artifact、GitHub MCP、WebSearch。
- Playwright（playwright-core＋Chromium/SwiftShader）はスクリプトから使用。Claude in Chrome／Computer Use／iOSシミュレータは**この環境では使えない**（実機Safari検証は不可）。
- Vercel MCPは接続されているが、**試作では使用しない**（禁止）。Agent Teamsは実験的機能で既定では無効（有効化はユーザー判断）。

## 次の1〜3タスク
1. 総合監査（`SOAK_SEC=20 node scripts/audit.mjs`、背景実行）を完走 → FAIL修正 → `audit/REPORT.md` 更新（RRR-QA-002/003/004。試作のArtifact公開は不要）
2. RRR-RAIL-001（313系走行物理の単体テスト付き純エンジン）
3. RRR-ENGINE-010 → RRR-R8-001（複数ストーリー登録とR8第1章）

## 再開手順
`git status` → `docs/TASKS.md` → `npm run check` → `/tmp` に監査ログが無ければ `npx vite build && SOAK_SEC=20 node scripts/audit.mjs`（長時間）。コマンドの一覧は CLAUDE.md。

## ブロッカー・注意
- ソフトウェア描画（SwiftShader）では FPS が実機を表さない。
- 総合監査は約1時間かかる（通しプレイ2回を含む）。必ずバックグラウンドで実行する。
