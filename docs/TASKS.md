# REAL RAIL & ROAD — TASKS（実態に合わせた台帳）

最終更新：2026-11-23。Claude Code の Tasks（TaskCreate/Get/List/Update）と同期。
状態：pending / in_progress / blocked / completed。**受入基準を満たし証拠があるものだけ completed**。実機が必要な項目は「UNVERIFIED」を別記。

## 第1波：R7第1章の縦断実装（v3.3 §C3）
| ID | 範囲 | 状態 | 受入基準 | 証拠・コード |
|---|---|---|---|---|
| RRR-BOOT-001 | リポジトリ・ツール・環境監査 | completed | 実装済・未実装、利用可能ツールを特定 | docs/PROGRESS.md「検出したツール」 |
| RRR-TASK-001 | Tasks台帳の運用 | completed | ID・依存・状態・証拠が記録される | 本ファイル＋TaskList |
| RRR-ARCH-001 | 共通モジュール設計 | completed | Story/Save/UI/Rendererの境界が明確 | docs/ARCHITECTURE.md、madge循環依存0 |
| RRR-MENU-001 | 14モードメニュー | completed | 14入口・未実装表示・独立ID | src/ui/MainMenu.tsx、監査「14モード」PASS |
| RRR-R7-001 | 第1章シナリオ | completed | 重要選択が後続状態に反映 | scripts/build-story.mjs（309ノード）、tests/engine.test.ts |
| RRR-R7-002 | 3D駅と移動操作 | completed（視覚監査はQA-002） | 3D表示・自由視点・相互作用 | src/render/*、assets/models/*.glb |
| RRR-R7-003 | 勤務表・人物UI・会話 | completed | 日本語会話・勤務表・UI操作 | src/ui/Panels.tsx, GameScreen.tsx |
| RRR-R7-004 | Story Graph統合 | completed | 行動・人物関係・分岐が接続 | src/engine/storyRunner.ts |
| RRR-SAVE-001 | 保存・読込 | completed | 再読込後に選択が復元 | src/engine/save.ts、テスト |
| RRR-INPUT-001 | iPhone操作 | completed（実機UNVERIFIED） | タップ・ドラッグ・画面サイズ | モバイルHUD（エミュレーション確認のみ） |
| RRR-QA-001 | 型・lint・テスト・ビルド | completed | コマンドと結果を記録 | `npm run check`（tsc/ESLint/madge/vitest 56件） |
| RRR-QA-002 | 3D視覚監査 | in_progress | 多視点・画面幅比較・修正 | scripts/audit.mjs 実行中 → audit/REPORT.md |
| RRR-QA-003 | ストーリー・セーブ監査 | in_progress | 到達条件とセーブを自動試験 | scripts/dev/walk.mjs（到達OK）／audit E2E 実行中 |
| RRR-QA-004 | 高/低品質比較・性能 | in_progress | 各2画像・FPS/メモリ、環境区別 | audit節3・10・11 |
| RRR-RELEASE-001 | Artifacts試作確認 | pending | 実行確認・Vercelへ出さない | QA-002/003完了後に公開 |

## 追加済み（第1波の拡張）
RRR-R7-010 一日の業務拡充（34依頼・6種のミニゲーム）／RRR-R7-011 持ち場による分岐と自由選択／RRR-R7-012 昼休憩の2D長尺会話／RRR-AUDIO-001 BGM・文字送り音・雑音低減／RRR-QA-005 ESLint・madge・knip・coverage導入 — すべて completed。

## 第2波（ローリング計画。依存の浅い順）
| ID | 範囲 | 依存 | 状態 | 受入基準 |
|---|---|---|---|---|
| RRR-RAIL-001 | 313系参考の走行物理（牽引・ブレーキ・抵抗・停止距離）純エンジン＋単体テスト | - | pending | 加速・制動・停止距離が単位つきで検証、推定値フラグ |
| RRR-ENGINE-010 | 複数ストーリー登録（モード別の story/save/runner） | ARCH-001 | 実装済（check PASS） | R7以外のIDで別ストーリーを起動でき、セーブ独立 |
| RRR-R8-001 | R8第1章「白紙の一頁」：文書版比較（非暴力） | ENGINE-010 | 実装済（check PASS・Playwright通し2回） | 版管理文書・矛盾マーカー・確度の区別・分岐到達性テスト |
| RRR-R7-005 | R7第2章を実プレイ化（現在は冒頭のみ） | R7-001 | pending | 章末評価・分岐・保存まで通る |
| RRR-DEPOT-001 | 基地Aの2D配線略図と3D最小動作の同期 | ARCH-001 | pending | 入出区・占有が2D/3Dで一致 |
| RRR-DISP-001 | 2D指令盤（在線・ダイヤ）最小版 | RAIL-001 | pending | 計画/実績ダイヤと列車位置が一致 |
| RRR-R9-001〜R11-001 | R9時刻表照合／R10駅前案比較／R11駅の日常 各第1章 | ENGINE-010 | pending | 各1章を実プレイ |

## 長期（未着手・未実装として保持）
R1・R2・R3・R5・R6・C1・C2 の第1章、313系運転台、基地B/C/工場、レース物理、経営、自由編集（R4/C3）、5形式、全96章×12作、Artifacts/Vercel正式版同等性。
