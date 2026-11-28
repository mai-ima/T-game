# PROGRESS — セッション引継ぎ

最終更新：2026-11-28

- 状態：**IN PROGRESS**（R7第1〜10章とR8第1章は実装済み。総合監査は再実行待ち。全体の1%程度であり、完成ではない）
- ブランチ：`claude/determined-babbage-4drhs6`（pushは開発ブランチのみ。main直push・force push禁止）
- ビルド：`npx vite build` OK、`npm run check`（tsc／ESLint／madge／vitest 56件）PASS
- iPhone実機：UNVERIFIED／実機の音・FPS・発熱：UNVERIFIED／ESLint導入済み（0エラー）
- Artifact：ユーザー判断により**試作の公開は不要**（DEC-012）。`artifact/index.html` は生成のみ維持。Vercelは使わない

## 直近の更新（2026-11-28）
- 分岐の基盤を作り直し：`docs/DESIGN_PRINCIPLES.md`（原則・測定目標）、効果 `depart`/`lock`、条件 `gone`/`locked`、品質ゲート `tests/narrative-quality.test.ts`（CEILINGは下げる一方）。
- R7第2〜10章を story-architect で書き直して統合（採点講評の撤去、rel条件、時限選択25個、取り返しのつかない変化、3Dハブの復活）。引き継ぎフラグは `docs/analysis/handoff-ch*.md`。目標値（dead≤10%、3ノード合流≤25%、未読≤15%）は未達（UNVERIFIED：実プレイ未実施）。
- 演出：立ち絵のまばたき・呼吸・口パク、2D場面の時間帯の色味、句読点の間、時限選択のリング、章の題字カード。3D：最高品質でGTAO・Bloom。
- 3Dモデル（人物GLB・駅の素材）は担当エージェントが作業中（RRR-3D-001）。
- 整理：生成物 `audit/models`・`audit/shots` を追跡から外した。`scripts/dev/README.md`、`docs/README.md` を追加。

## 今回までの成果（実装済み）
14モードメニュー（R7・R8がプレイ可）／共通エンジン（条件・効果・保存・キャリア）／R7第1〜10章（約1,800ノード。第1章は34依頼・6種のミニゲーム、第3章以降は永続ルート分岐、第7〜10章は希望部署ごとに別の中盤）、R8第1章／3D駅（GLBモデル、改札・扉・事務室）／3D・擬似3D・2D切替／2Dピクセル会話／BGM・効果音／スマホHUD・目的地ナビ。

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
