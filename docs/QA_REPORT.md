# QUALITY ASSURANCE REPORT

最終更新：2026-11-23。総合監査（scripts/audit.mjs）の詳細は `audit/REPORT.md`／`src/data/audit-report.json` に出力（実行中。完了後に本表を更新）。

| 検証対象 | 方法 | 結果 | 証拠 |
|---|---|---|---|
| TypeScript（strict） | `npx tsc --noEmit` | PASS | `npm run check` |
| 静的解析 | ESLint 9（0エラー、警告のみ）／madge循環依存0 | PASS | `npm run check`、`npm run knip`（未使用エクスポートの一覧あり：要整理） |
| 単体・統合・分岐到達性・保存・衝突・経路 | vitest 56件 | PASS | tests/*.test.ts |
| カバレッジ | `npm run coverage` | engine 約59%（全体約23%：UI・描画は主にPlaywright監査） | vitest coverage |
| 物語の到達性（2通りの選び方で第1章→第2章冒頭） | `node scripts/dev/walk.mjs good|risky` | PASS | 約210ステップで完走 |
| ミニゲーム6形式のUI操作 | Playwright（390px） | PASS（監査節6bで再確認中） | scripts/audit.mjs 6b |
| スマホHUD（縦390×780／横780×360） | Playwright画面確認・横スクロールなし | PASS（エミュレーション） | 実機UNVERIFIED |
| 総合監査（3D多視点・品質比較・UI重なり・E2E・長時間） | scripts/audit.mjs | 実行中（IN PROGRESS） | audit/ |
| 描画FPS・メモリ（実機） | 実機計測 | UNVERIFIED | SwiftShaderの値は参考のみ |
| iPhone Safari実機 | 実機操作 | UNVERIFIED | 環境にない |
| 音の聴感・音量バランス | 耳での確認 | UNVERIFIED | イベントログ・出力レベルのみ自動確認 |
| 実車との寸法照合 | 公開資料との比較 | UNVERIFIED | 313系参考の外形のみ。比較資料未取得 |
| Artifacts公式仕様の再確認 | 公式ヘルプを読む（サブエージェントが取得） | PARTIAL | WebGL/Web Audio/IndexedDBの可否は記載なし → 公開後に実際に動作確認する（DEC-011） |
| Artifacts/Vercel同等性 | 正式版のみ | 対象外 | 試作はArtifactsのみ |

## 既知の不具合・制約
- 探す場面（FindTask）の位置タップはポインタ専用（キーボード代替なし）。
- 第2章は冒頭のみ（プレイ可能な章ではない）。13モード・R7第3章以降は未実装。
