# DESIGN DECISIONS

| ID | 決定 | 根拠 | ステータス |
|---|---|---|---|
| DEC-001 | TypeScript＋React＋Three.js（WebGL2）、Vite単一HTML出力 | Artifacts／iPhone／Web共通化。実際に動作確認済み | accepted |
| DEC-002 | 3D・擬似3D・2Dを適材適所で使う（会話は2Dピクセル、駅は3D） | 品質と専門UIの両立。ユーザー指示 | accepted |
| DEC-003 | プロトタイプはArtifactsのみ。Vercel禁止 | ユーザー明示要件 | accepted |
| DEC-004 | 長期タスクの状態はファイル（docs/）に永続化 | セッション境界を越える引継ぎ | accepted |
| DEC-005 | ストーリーはデータ駆動（build-story.mjs→JSON）。章内の重要選択数の上限は章の長さに比例 | ユーザー承認（第1章は4個可） | accepted |
| DEC-006 | 持ち場（route.*）は専用イベントと次章を分け、通常業務はどの持ち場でも自由に選べる | 「自由度を高く」の要望 | accepted |
| DEC-007 | 業務はクイズ形式に偏らず6種のミニゲーム形式を併用 | ユーザー要望 | accepted |
| DEC-008 | 3Dモデルはlabで制作しGLB化（プロシージャルな箱を使わない） | ユーザー要望（高品質・写実） | accepted |
| DEC-009 | 音はすべて独自合成。雑音系は低く、BGMは場面ごとに切替 | 実録を装わない／ユーザー要望 | accepted |
| DEC-010 | 品質ツール（ESLint・madge・knip・vitest coverage）を導入。使用量削減ツールは制限が厳しいときのみ | ユーザー許可と指示 | accepted |
| DEC-011 | Artifacts公式ヘルプ（2026-11-23確認）：既定は非公開。保存機能は100MB/25,000件。単一HTMLの上限、WebGL・Web Audio・IndexedDB・外部リソースの可否は**記載なし（UNVERIFIED）**。Artifactツール仕様では、ブラウザストレージは動くが空になる・例外を投げる場合がある（try/catchと非依存の動作が必要）、単一ページ16MB以下、外部スクリプトは許可CDNのみ | 採用前の公式再確認（§0-9,§15）。セーブはIndexedDB→メモリへ退避、音は操作後に開始、フォントはGoogle Fonts（許可済み） | accepted |
