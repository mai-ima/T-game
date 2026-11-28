# scripts/dev — 開発補助スクリプト
すべて `node scripts/dev/<名前>.mjs [引数]`。画像を出すものは出力先を引数で指定（ヘッドレスChromium＝SwiftShaderのため、FPSや見え方は実機と異なる）。

| 分類 | スクリプト | 用途 |
|---|---|---|
| 物語の診断 | `analyze-story.mjs [r7\|r8] [choices]` | 章ごとの分岐の質（合流距離・未読フラグ・時限選択など） |
| | `walk.mjs` / `walk-r8.mjs` | 画面操作なしで最後まで進め、止まる場所を調べる |
| 画面の撮影 | `ui-shots.mjs <出力先>` | 主要画面（会話・業務・章末・分岐図ほか）を390px幅で撮影 |
| | `shot-2d.mjs` / `shot-3d.mjs <出力先>` | 2D場面の演出／3Dの品質別比較 |
| | `iphone.mjs` | iPhone相当のビューポートで確認 |
| | `hero.mjs` | メニュー用ヒーロー画像（src/assets/hero.jpg）を書き出す |
| | `fb-shot.mjs` | 選択後の手応え表示を撮影 |
| 回帰検査 | `smoke.mjs` | 起動スモーク（dist/index.html） |
| | `tap.mjs` / `dlg.mjs` | 会話タップ（全文表示→次へ）の回帰検査 |
| | `bgm.mjs` | BGMの場面別切替と合図音の発火 |
