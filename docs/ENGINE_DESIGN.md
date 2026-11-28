# ENGINE_DESIGN — Detroit: Become Human を参考にしたエンジン設計（RRR-ENGINE-020）

## 参照した事実（出典あり）
- 描画：ディファードからクラスタード・フォワードへ移行、実世界の測光単位によるライティング、ボリュームライティング、TAA、エンジンはMayaと統合（GDC 2018 講演の紹介記事 https://gdconf.com/news/get-behind-scenes-look-detroit-become-humans-tech-gdc-2018 、https://wccftech.com/detroit-become-human-checkerboard-4k/ ）。
- 顔・全身のキャプチャ技術の詳細は、今回の検索では確認できなかった（UNVERIFIED）。以下は一般に知られた方向性を参考にした設計であり、Detroit の内部実装を再現するものではない。

## 方針
「同じ発想を、ブラウザ（Three.js）で動く規模で実装する」。重い技術は、見た目への寄与が大きいものから置き換える。

| Detroit の発想 | 本作での実装（現状） | 状態 |
|---|---|---|
| 俳優の演技に基づく自然な身体動作 | `src/render/animation.ts`：歩行の上に重ねる層（呼吸・体重移動・視線・話す/聞く） | 実装（目視は撮影で確認中） |
| 感情と視線が会話を駆動 | 台詞の話者→`talk`、相手→`listen`、近づくと頭がプレイヤーを追う | 実装 |
| 映画的カメラ（切り返し・寄り・肩越し） | `src/render/cinema.ts`：ショット選択（二人・寄り・肩越し・引き）、話者ごとの切り返し、手持ち揺れ | 実装 |
| 被写界深度・フィルム質感 | 高品質のみ：BokehPass（話者にピント）、仕上げシェーダ（ビネット・色の傾き・粒状感） | 実装 |
| 物理ベースの光と素材 | PBR材質・環境反射・GTAO・Bloom（高品質）。手続きテクスチャは別担当（RRR-3D-001） | 一部 |
| 顔の表情（ブレンドシェイプ） | 2Dはドット絵のまばたき・口パク。3Dは表情用の節点（眉・口）を持つが駆動は未実装 | 未実装 |
| 分岐を支えるスクリプト | ストーリーエンジン（Cond/Effect、depart/lock、echo） | 実装済み（別文書） |

## 構成
- `animation.ts`：`Animator`（節点の回転を足すだけの純粋な層）。入力は `{act, lookAt, emphasis}`。歩行中は重みを下げる。
- `cinema.ts`：`frameShot`（ショットの位置・向き・画角・ピント距離）、`pickShot`（台詞番号・話者・強調から選ぶ）、`handheld`。
- `renderManager.ts`：`setDialogue()`（controller が台詞ごとに更新）、会話中のカメラは `frameShot` で決定。後処理は `buildComposer`（GTAO→Bloom→Bokeh→Output→仕上げ）。
- 品質プリセットの `post` が true のときだけ後処理を使う。失敗時は通常描画へ戻る（`postBroken`）。

## 次の段階
1. 3D表情（節点駆動）と、目のまばたき・視線の細かい動き。
2. モーションの追加（立つ・座る・振り向く・うなずき・驚き）のクリップ化と、状態機械による遷移。
3. 逆運動学（足の接地、手の持ち物）。
4. 光の演出（時間帯・窓からの光線）、TAA、光量の測光単位化。
5. 実機での性能確認（現在はSwiftShaderのみ。FPSは実機を表さない）。
