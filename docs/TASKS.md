# REAL RAIL & ROAD — TASKS（実態に合わせた台帳）

最終更新：2026-11-23。Claude Code の Tasks（TaskCreate/Get/List/Update）と同期。要件は `docs/REQUIREMENTS.md`（要求ID）。
記録形式（v3.3 CLAUDE.md）：ID | 範囲 | 受入基準 | 依存 | 担当 | コード | テスト | 画像・証拠 | 状態 | コミット。
**受入基準を満たし証拠があるものだけ completed**。実機が必要な項目は UNVERIFIED を別記。

## 第1波：R7第1章の縦断実装
| ID | 範囲 | 受入基準 | 依存 | 担当 | コード | テスト／証拠 | 状態 | コミット |
|---|---|---|---|---|---|---|---|---|
| RRR-BOOT-001 | リポジトリ・ツール・環境監査 | 実装済・未実装と利用可能ツールを特定 | - | リード | docs/PROGRESS.md | 検出ツール表 | completed | 16a40eb |
| RRR-TASK-001 | Tasks台帳の運用 | ID・依存・状態・証拠 | BOOT | リード | 本ファイル | TaskList同期 | completed | 16a40eb |
| RRR-ARCH-001 | 共通モジュール設計 | 境界が明確・循環依存0 | BOOT | リード | docs/ARCHITECTURE.md, src/* | madge PASS | completed | 複数 |
| RRR-MENU-001 | 14モードメニュー | 14入口・未実装表示 | ARCH | リード | src/ui/MainMenu.tsx, data/modes.ts | audit PASS | completed | 複数 |
| RRR-R7-001 | 第1章シナリオ | 重要選択が後続に反映 | ARCH | リード | scripts/build-story.mjs | tests PASS | completed | 複数 |
| RRR-R7-002 | 3D駅と移動操作 | 3D表示・自由視点・相互作用 | ARCH | リード | src/render/*, assets/models | station.test, audit | completed | 複数 |
| RRR-R7-003 | 勤務表・人物UI・会話 | 日本語会話・勤務表 | R7-001 | リード | src/ui/* | audit | completed | 複数 |
| RRR-R7-004 | Story Graph統合 | 行動・関係・分岐が接続 | R7-001 | リード | src/engine/storyRunner.ts | tests | completed | 複数 |
| RRR-SAVE-001 | 保存・読込 | 再読込後に選択が復元 | R7-004 | リード | src/engine/save.ts | tests, audit | completed | 複数 |
| RRR-INPUT-001 | iPhone操作 | タップ・ドラッグ・画面サイズ | R7-002 | リード | src/ui/*, styles.css | Playwright（実機 UNVERIFIED） | completed* | 複数 |
| RRR-QA-001 | 型・lint・テスト・ビルド | `npm run check` PASS | ARCH | リード | scripts/check.mjs, eslint.config.js | check PASS | completed | 複数 |
| RRR-QA-002 | 3D視覚監査 | 多視点・画面幅比較・修正 | R7-002 | リード | scripts/audit.mjs | audit/ 実行中 | in_progress | - |
| RRR-QA-003 | ストーリー・セーブ監査 | 到達条件とセーブを自動試験 | R7-004 | リード | tests, scripts/dev/walk.mjs | walk PASS／audit実行中 | in_progress | - |
| RRR-QA-004 | 高/低品質比較・性能 | 各2画像・FPS/メモリ | R7-002 | リード | audit節3,10,11 | 実行中 | in_progress | - |
| RRR-RELEASE-001 | Artifacts試作の公開 | ユーザー判断により不要（Vercelには出さない方針は継続） | - | - | artifact/（生成のみ） | - | cancelled（DEC-012） | - |

## 第1波の拡張（completed）
RRR-R7-010 一日の業務拡充（34依頼・6種のミニゲーム）／R7-011 持ち場分岐・自由選択／R7-012 昼休憩の2D長尺会話／AUDIO-001 BGM・文字送り音・雑音低減／QA-005 ESLint・madge・knip・coverage／RRR-A11Y-001 アクセシビリティ審査と修正／RRR-FIX-001 会話タップ不具合の修正（scripts/dev/tap.mjs）／RRR-R7-005 第2章の実プレイ化（scripts/story/ch2.mjs）／RRR-R7-007 章ごとの分岐図の自動生成／RRR-RAIL-001 313系参考の走行物理（src/engine/railPhysics.ts, 13テスト, commit 611f9f0）／RRR-DOC-001 要求ID一覧（docs/REQUIREMENTS.md）。

## 進行中
| ID | 範囲 | 受入基準 | 担当 | 状態 |
|---|---|---|---|---|
| RRR-R7-006 | R7第3〜10章（永続ルート分岐・長い会話・章ごとに別の構造） | 各章が open→end で連結、到達性・非暴力・経営なし、`npm run check` PASS、通しプレイ（good/risky） | story-architect×4（ch3-4 / ch5-6 / ch7-8 / ch9-10） | in_progress |
| RRR-ENGINE-010 / RRR-R8-001 | 複数ストーリー登録とR8第1章「白紙の一頁」（src/data/stories.ts, scripts/build-story-r8.mjs, tests/r8.test.ts） | R8を最後まで通せる／R7とセーブ独立／到達性 | story-architect（worktree）→統合済み | completed（結末2/4の画面確認は未実施、実機UNVERIFIED） |

## 第2波（ローリング計画）
| ID | 範囲 | 依存 | 受入基準 | 状態 |
|---|---|---|---|---|
| RRR-QA-006 | 時間軸・年齢・勤続の章間整合検査（R7第1〜10章） | R7-006 | 章の日付が単調増加、人物の年齢・役職が矛盾しない | pending |
| RRR-QA-007 | R7全章のE2E（UI操作・good/risky・ルート別） | R7-006 | 全ルートで第10章まで完走、保存再開 | pending |
| RRR-DEPOT-001 | 基地Aの2D配線略図と3D最小動作の同期 | ARCH | 入出区・占有が2D/3Dで一致 | pending |
| RRR-DISP-001 | 2D指令盤（在線・ダイヤ）最小版 | RAIL-001 | 計画/実績ダイヤと列車位置が一致 | pending |
| RRR-RAIL-002 | railPhysicsを運転台UI・列車運動に接続（313系運転の最小版） | RAIL-001 | 加速・制動・停止を操作して確認 | pending |
| RRR-R9-001〜R11-001 | R9時刻表照合／R10駅前案比較／R11駅の日常 各第1章 | ENGINE-010 | 各1章を実プレイ | pending |
| RRR-I18N-001 | 文言の一元管理（日本語＋英語の切替の土台） | - | 文言をi18n経由に統一 | pending |

## 長期（未着手・未実装として保持）
R1・R2・R3・R5・R6・C1・C2 の第1章、313系運転台、基地B/C/工場、レース物理、経営、自由編集（R4/C3）、5形式、全96章×12作、結末8種以上、Artifacts/Vercel正式版同等性。
