# 構成（REAL RAIL & ROAD プロトタイプ）

依存は **上から下へ一方向**です。下の層は上の層を知りません。

```
ui/            React 画面（メニュー・会話・業務・パネル・HUD）
  └ engine/controller.ts   GameController：UI と描画・音・セーブをつなぐ唯一の窓口
       ├ engine/（ストーリー・世界状態・キャリア・セーブ）  ← 描画に依存しない純粋ロジック
       ├ engine/stationSim.ts, railSim.ts                    ← 歩行・衝突・経路探索・ダイヤ
       ├ engine/audio.ts                                     ← Web Audio（環境音・効果音・BGM）
       └ render/（Three.js）                                 ← 3D / 擬似3D / 2D 描画
data/          story.json（scripts/build-story.mjs が生成）・モード定義
lab/           3Dモデル制作所（GLB を書き出す。ゲーム本体には含まれない）
```

## engine（ロジック）
| ファイル | 役割 |
|---|---|
| types.ts | ストーリーノード・条件・効果・世界状態などの型 |
| conditions.ts / worldState.ts | 条件式の評価、フラグ・関係・経歴・時刻の状態 |
| storyRunner.ts | ノードを進める（会話・選択・分岐・ハブ・業務・章末）。副作用は effect だけ |
| career.ts | 評価・資格・異動可否・勤務表の検証 |
| save.ts | IndexedDB／メモリ、モードごとの独立スロット、チェックサム、書き出し |
| stationSim.ts | 固定刻み歩行・衝突・A*経路・NPC |
| railSim.ts | 時刻表と遅延の連鎖、列車の到着・出発 |
| controller.ts | 上記をまとめ、UI に状態を公開する |

## ストーリーデータ
複数ストーリーは `src/data/stories.ts` に登録（モードID→StoryData）。`GameController.newGame(name, mode)`／`restore(file)` がモードごとに story・runner・セーブ領域（`save:{modeId}:*`）を切り替える。R8は `scripts/build-story-r8.mjs` → `src/data/r8/story.json`（`persistentHud` で2D会話中もメニューを表示。業務形式 `docs`＝版比較・矛盾マーカー、`grade`＝確度仕分けを追加）。
`scripts/build-story.mjs` が唯一の原本です。`src/data/r7/story.json` は生成物です。
- ノード種別：`line` `choice` `branch` `effect` `hub` `task` `end`
- 業務（`task`）の形式：`checklist`（○×）`compose`（文章組立）`terminal` `roster`、
  および `timing` `find` `watch` `route` `sort` `memory`（`ui/Minigames.tsx`）。
  どの形式も 0〜100 の得点を返し、`results` の閾値で分岐します。
- 持ち場（`route.*`）は専用イベントと第2章冒頭を分け、通常業務はどの持ち場でも選べます。

## render（描画）
| ファイル | 役割 |
|---|---|
| stationBuilder / stationDetail / stationExtras | 駅の構築（衝突・床高さ・アンカー・経路・カメラ位置）。改札・扉・事務室など |
| assets.ts | GLB の読込（meshopt）。モデルは lab で制作し `assets/models` に置く |
| renderManager.ts | 描画ループ、3D／擬似3D／2D の切替、品質制御、タップ移動 |
| trainRig.ts / humanoid.ts | GLB から列車・人物を組み立て、扉やフラップを動かす |
| audit.ts | 配置監査（めり込み・浮き・未到達） |

## 検証
- `npm test`（vitest）：エンジン・ストーリー分岐・駅ジオメトリ・経路・配置監査
- `scripts/audit.mjs`：Playwright による通し監査（多視点スクリーンショット・UI重なり・保存復元）
- `scripts/dev/`：画像出力・動作確認用の補助スクリプト
- 実機の iPhone Safari は未検証です。

## 公開
プロトタイプは Claude Artifacts のみ（`npm run build` → `artifact/index.html`）。Vercel には公開しません。
