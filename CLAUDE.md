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

---
# v3.3 追加ルール（`docs/MASTER_PROMPT_v3.3.md` を最優先で読む。本節はその実行要約）

## 範囲（変更・縮小しない）
- 14独立モード（R1〜R11, C1〜C3）／12本の超長編（各8シーズン・96章以上＝計1,152章以上が目標）／自由2モード。未実装を完成扱いしない。
- 鉄道運転・各指令・経営・社員異動・車両基地、自動車物理・レース・チーム経営、3D/2.5D/2D適応描画、リアル音響、モバイルUI、厳密なQA。
- プロトタイプは Claude Artifacts のみ。Vercelへの試作デプロイ禁止。正式版の同等性は証明が必要な目標。ホラー・殺人なしのサスペンス。

## 実行手順
1. `docs/TASKS.md` `docs/PROGRESS.md` `docs/PLAN.md` `docs/DECISIONS.md` `docs/QA_REPORT.md` と `git status` を最初に読む。会話履歴を唯一の真実にしない。
2. Tasksツール（TaskCreate/Get/List/Update）が使えるときは開始・進捗・完了で更新し、台帳（TASKS.md）と同期する。
3. 受入基準を満たしてから completed。FAILが残るタスクは完了にしない（修正タスクを派生）。
4. 1タスク完了ごと：型検査→lint→テスト→ブラウザ視覚監査→修正→回帰→証拠保存→台帳更新→次のタスク。
5. 独立作業はサブエージェント（`.claude/agents/` の専門定義）へ。同じファイルを同時編集させない。レビューは実装者と別に。Agent Teams は実験的でコスト大のため既定では無効（例は `.claude/settings.agent-teams.example.json`）。
6. 小さな意味のあるコミット。pushは開発ブランチのみ。main直push・force push禁止。
7. 停止条件（ユーザー停止・権限・制限・環境故障）に当たったら、権限回避をせず `docs/PROGRESS.md` に再開手順を残して安全に停止。

## 記録形式
ID | 範囲 | 受入基準 | 依存 | 担当 | コード | テスト | 画像 | PASS/FAIL/UNVERIFIED | コミット
