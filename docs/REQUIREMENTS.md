# 要求ID一覧と合否基準（v3.3 第20章-1）

出典：`docs/MASTER_PROMPT_v3.3.md`（v3.2原本は完全収録・差分なしを確認済み）。状態：DONE（受入基準を満たし証拠あり）／PARTIAL／TODO／UNVERIFIED（実機等で未検証）。
「現セッションの範囲」は R7第1章〜第10章の縦断と共通エンジン。ほかは未実装として正直に保持する。

| 要求ID | 要件（出典） | 合否基準 | 状態 | 証拠・担当タスク |
|---|---|---|---|---|
| REQ-MODE-01 | 14独立モード、12ストーリー＋自由2（§1） | メニューに14入口、独立ID・セーブ領域 | DONE | tests, audit「14モード」 / RRR-MENU-001 |
| REQ-MODE-02 | 未実装をプレイ可能と偽らない（§0,§16,質問回答7） | 未実装カードに開始ボタンが無い | DONE | audit |
| REQ-MODE-03 | 他モードのクリア・強制切替を要求しない（§0-7） | 各モード単独で開始可 | PARTIAL | R7のみプレイ可（R8は統合待ち） |
| REQ-STORY-01 | R7第1章の縦断（§19A.1） | 部署紹介・3D駅・2D勤務表・会話・重要選択・保存 | DONE | RRR-R7-001〜004 |
| REQ-STORY-02 | R7 8シーズン×12章以上・96章以上（§10A,§13A） | 章ごとの完成率を台帳で区別 | PARTIAL | 第1〜10章を実装（約1,800ノード）。第11章以降・8シーズン×12章＝96章は未実装 |
| REQ-STORY-03 | 重要選択は章あたり原則1〜3（§13）／ユーザー承認で章の長さに比例 | 章ごとの上限を満たす | DONE | tests（長さ比例） |
| REQ-STORY-04 | 再合流でも過去の選択を無効化しない（§13A.4）。ユーザー指示：重要分岐は別ルートに戻らない | 永続ルートフラグが後続章の場面を変える | PARTIAL | 持ち場3×体調2×山科2×希望部署4の永続ルート。第7〜10章は希望部署ごとに別の場面。通し診断で確認 |
| REQ-STORY-05 | 8種以上の意味の異なる結末（§13） | 到達可能な終端／結末の数 | TODO | R7は章末評価のみ |
| REQ-STORY-06 | ホラー・殺人・暴力なし（§10B,§17A-5） | 禁止語の自動検査 | DONE | tests（非暴力語彙チェック） |
| REQ-STORY-07 | R5〜R11に経営操作なし（§13,§20-8） | 経営系エフェクトが無い | DONE | tests |
| REQ-STORY-08 | 到達不能ノード・矛盾の検出、保存再開（§13-9） | lint＋ランダム再生600回 | DONE | tests, walk.mjs |
| REQ-CAREER-01 | 配属・資格・異動の整合（§10A.2,§17A-1） | 無資格で特殊業務に就かない／希望だけで異動しない | PARTIAL | career.ts・テスト（第1〜2章）、第10章で拡張 |
| REQ-CAREER-02 | 勤務の整合（§17A-2） | 労働条件を無視しない | PARTIAL | 勤務表検証あり。章ごとの時刻検査を追加 |
| REQ-CAREER-03 | 時間軸・年齢・勤続の整合（§13A.3,§17A-3） | 章の日付が単調増加 | DONE | tests（章の開始日の単調増加・想定期間）。通し診断で曜日も確認 |
| REQ-3D-01 | 3D駅を自由に移動・観察・相互作用（質問回答2,6） | 歩行・衝突・設備との相互作用 | DONE | station.test.ts, audit |
| REQ-3D-02 | 高品質モデル（GLB）。実在寸法・細部（ユーザー指示） | GLBをロードして使用 | PARTIAL | 駅設備・313系参考車両・人物。実車照合 UNVERIFIED |
| REQ-VIEW-01 | 3D/擬似3D/2Dの切替で状態が変わらない（§4） | 同一時刻で3方式一致 | DONE | audit節4 |
| REQ-VIEW-02 | 会話は2D（ユーザー指示。ピクセル調） | 2Dピクセル場面で表示 | DONE | UI |
| REQ-UI-01 | 日本語UI、i18n構造（質問回答4） | 文言を一元管理 | PARTIAL | src/i18n（一部のみ） |
| REQ-UI-02 | iPhone操作・セーフエリア・44px（§15,§17A-11） | タッチ・横縦・重なり | PARTIAL | エミュレーションのみ。実機 UNVERIFIED |
| REQ-UI-03 | アクセシビリティ（字幕・キーボード・コントラスト） | WCAG 2.1 AAの審査と修正 | PARTIAL | 審査実施・修正済み、スクリーンリーダー実機 UNVERIFIED |
| REQ-AUDIO-01 | 環境音・操作音・BGM、独自合成（§12） | Web Audio、消音、字幕 | DONE | audit節6 |
| REQ-AUDIO-02 | 聴感・実録比較 | 耳での確認 | UNVERIFIED | 環境にない |
| REQ-SAVE-01 | モード別独立セーブ・再読込で復元・移行（§16） | IndexedDB、チェックサム | DONE | tests, audit |
| REQ-SAVE-02 | セーブのエクスポート／インポート（§16） | base64書き出し | DONE | save.ts |
| REQ-QA-01 | 型・lint・テスト・循環依存（質問回答3） | `npm run check` PASS | DONE | check.mjs |
| REQ-QA-02 | 多視点視覚監査・最高/最低各2枚（§17） | 画像と数値を生成 | PARTIAL | audit 実行中。完走後に更新 |
| REQ-QA-03 | FPS・メモリ・長時間（§15） | 計測 | PARTIAL | SwiftShaderのみ。実機 UNVERIFIED |
| REQ-QA-04 | 分岐・保存・モード独立の自動検査（§17.8） | vitest＋walk | DONE | tests |
| REQ-QA-05 | PASS/FAIL/UNVERIFIEDで管理（§17.9） | 全項目に付与 | DONE | audit/REPORT.md |
| REQ-REL-01 | 試作はArtifactsのみ、Vercel禁止（§16,§G） | Vercelへ公開しない | DONE（遵守中） | 公開は Artifact ツールのみ |
| REQ-REL-02 | Artifactsで実際に動く（§19 Phase1） | 公開して動作確認 | WAIVED（ユーザー判断で試作公開は不要。2026-11-23） | DEC-012。ビルド成果物 artifact/index.html の生成までは維持 |
| REQ-RAIL-01 | 313系ほか5形式・車両物理（§5） | 物理モデルと単体テスト | PARTIAL | railPhysics.ts（313系参考・推定値フラグ）。他4形式 TODO |
| REQ-RAIL-02 | 車両基地A・2D配線・入出区同期（§3） | 配線・占有の一致 | TODO | RRR-DEPOT-001 |
| REQ-RAIL-03 | 運転台・路線・線形（§2,§6） | 走行・停止 | TODO | 未着手 |
| REQ-DISP-01 | 指令盤・ダイヤ・在線（§8） | 計画/実績の一致 | TODO | RRR-DISP-001 |
| REQ-MGMT-01 | 鉄道経営（R2）（§7） | 収支・需要 | TODO | 未着手 |
| REQ-AUTO-01 | 自動車物理・レース・チーム経営（§11） | 物理・AI | TODO | 未着手 |
| REQ-FREE-01 | 自由モードR4・C3（§14） | 編集・自由運転 | TODO | 未着手 |
| REQ-PAR-01 | Artifacts/Vercel同等性（§16） | 正式版のみ | TODO（対象外） | 正式完成段階 |
