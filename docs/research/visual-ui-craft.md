# 映像・UI・動き・質感・音の演出調査（Detroit: Become Human 級を目指すための技法集）

調査日: 2026-11-27 / 調査担当: Claude（調査のみ。コード変更なし）

## 0. 先に読む要点

- 調査手段は WebSearch（要約結果）と WebFetch（精読）。**精読できたのは 9 ページだけ**で、残りは検索要約に基づく。精読したものは出典表の「読み方」欄を「精読」にした。
- 「Detroit 級」の中身は、技術より**演出の設計**が大きい。Detroit は約35,000ショットを作り、うち27,000以上を個別にライティングしている [19]。素材量では勝てないので、**少ない素材に効く演出を決めて繰り返し使う**のが現実的。
- 現状コードを読んだ範囲では、ACESトーンマップ・フォグ・影・品質プリセット・自動品質調整・ピクセル立ち絵（`Portrait`）・タイプライター（`useTypewriter`）・手続き型の環境音とBGMシーケンサまではある。ブルーム・ビネット・粒子・レターボックス・画面揺れ・まばたき・立ち絵の入退場・BGMレイヤーは**見つからなかった**（grep でのみ確認。未確認の箇所があり得る）。
- iPhone Safari 実機での検証は未実施（docs/ARCHITECTURE.md にも「未検証」とある）。本書の数値はすべて **UNVERIFIED** 扱い。

---

## 1. 出典一覧

信頼度: 高=公式・一次資料／中=専門メディア・著名な実務者／低=個人ブログ・フォーラム・出所不明。
読み方: 精読=WebFetchで本文を確認／要約=検索結果の要約のみ／403=取得失敗（検索要約のみ）。

| # | URL | 種別 | 信頼度 | 読み方 |
|---|---|---|---|---|
| 1 | https://en.wikipedia.org/wiki/HD-2D | 百科事典 | 中 | 精読 |
| 2 | https://www.unrealengine.com/en-us/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style | 開発者インタビュー（Epic） | 高 | 403 |
| 3 | https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true | 開発者談（Epic） | 高 | 要約 |
| 4 | https://gdcvault.com/play/1016487/Juice-It-or-Lose | GDC Europe 2012 講演ページ | 高 | 要約 |
| 5 | https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games | Game Developer記事（Art of Screenshake） | 中 | 要約 |
| 6 | https://dev.to/dat_one_dev/the-art-of-screen-shake-33bi | 個人ブログ | 低 | 要約 |
| 7 | https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting | 制作記事 | 中 | 精読 |
| 8 | https://gamedeveloper.com/art/adding-depth-to-2d-with-hand-drawn-normal-maps-in-i-the-siege-and-the-sandfox-i- | Game Developer記事 | 中 | 要約 |
| 9 | https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/ | 分析ブログ | 中 | 要約 |
| 10 | https://itch.io/blog/533534/making-ui-come-to-life-study-of-persona-5 | 開発者ブログ（Persona 5 UI研究） | 中 | 精読 |
| 11 | https://www.siliconera.com/?p=668266 | ゲームメディア（Persona 5 UI、講演要約） | 中 | 要約 |
| 12 | https://www.pcgamer.com/games/rpg/persona-series-director-says-atluss-flashy-menus-are-actually-really-annoying-to-design | ゲームメディア（橋野氏発言） | 中 | 要約 |
| 13 | https://www.inverse.com/gaming/persona-5-tactica-user-interface | ゲームメディア | 中 | 要約 |
| 14 | https://uxdesign.cc/the-detroit-game-experience-breaking-the-4th-wall-in-a-video-game-through-narrative-5876c167b4b6 | UXブログ | 低〜中 | 要約 |
| 15 | https://www.playstationlifestyle.net/2019/07/15/detroit-become-human-flowchart/amp/ | ゲームメディア（フローチャート） | 中 | 要約 |
| 16 | https://www.denofgeek.com/games/detroit-become-human-review | レビュー | 中 | 要約 |
| 17 | https://automaton-media.com/articles/columnjp/20180529-68734/ | 日本語ゲームメディア（Detroitメニュー） | 中 | 要約 |
| 18 | https://gamedeveloper.com/programming/video-the-lighting-technology-of-i-detroit-become-human-i- | GDC 2018 講演紹介（Quantic Dream） | 高 | 精読（紹介文のみ。講演本編は未視聴） |
| 19 | https://blog.quanticdream.com/?p=384 | 開発元ブログ（撮影監督インタビュー） | 高 | 要約 |
| 20 | https://gdconf.com/news/get-behind-scenes-look-detroit-become-humans-tech-gdc-2018 | GDC公式告知 | 高 | 要約 |
| 21 | https://discourse.threejs.org/t/unrealbloompass-poor-performance-on-macos-safari-with-intel/42606 | three.js公式フォーラム | 中 | 要約 |
| 22 | https://github.com/pmndrs/postprocessing | ライブラリ公式 | 高 | 要約 |
| 23 | https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/post-processing-effects-on-mobile-optimization-and-alternatives | Arm公式ブログ | 高 | 要約 |
| 24 | https://discourse.threejs.org/t/bloom-pass-bug-in-ios-15/37793 | three.js公式フォーラム | 中 | 要約 |
| 25 | https://www.abratabia.com/web-game-audio/dynamic-game-music.php | ゲーム音響ブログ | 低〜中 | 要約 |
| 26 | https://web.dev/articles/webaudio-intro | web.dev（Google） | 高 | 要約 |
| 27 | https://npmjs.com/package/orchestre-js | OSSライブラリ | 低〜中 | 要約 |
| 28 | https://www.slynyrd.com/blog/2018/6/15/pixelblog-6-light-and-shadow | ドット絵技法（Slynyrd） | 中 | 精読 |
| 29 | https://pixeljoint.com/forum/forum_posts.asp?TID=15138 | ドット絵フォーラム（色相シフト） | 低 | 要約 |
| 30 | https://80.lv/articles/pixel-animation-tutorial-by-pedro-medeiros | 制作記事（Pedro Medeiros） | 中 | 要約 |
| 31 | https://www.creativebloq.com/news/artist-makes-animated-gif-tutorials-to-teach-you-pixel-art | メディア（Saint11の紹介） | 中 | 要約 |
| 32 | https://wattson.itch.io/kinetic-text-tags | Ren'Py用テキスト効果アセット | 低〜中 | 要約 |
| 33 | https://bugnet.io/blog/how-to-implement-a-typewriter-text-effect | 実装ブログ | 低 | 要約 |
| 34 | https://arxiv.org/html/2512.13695 | 論文（ゲームテキストの“juicy”効果） | 中 | 要約 |
| 35 | https://blog.openreplay.com/add-snowfall-effect-website/ | 実装解説 | 低〜中 | 要約 |
| 36 | https://www.freecodecamp.org/chinese/news/canvas-animation-performance-optimization-practice/ | 中国語の実装記事 | 低〜中 | 要約 |
| 37 | https://clicktorelease.com/code/codevember-2016/1 | three.jsデモ（手続き型PBR） | 中 | 要約 |
| 38 | https://easymaking-site.pages.dev/shader-lab/22-normal-mapping.html | チュートリアル（法線マップ生成） | 低 | 要約 |
| 39 | https://discourse.threejs.org/t/is-agx-tonemapping-implemented-correctly/60609 | three.js公式フォーラム | 中 | 要約 |
| 40 | https://github.com/mrdoob/three.js/pull/27413 | three.js公式PR（AgX） | 高 | 要約 |
| 41 | https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928 | three.js公式フォーラム（群衆） | 中 | 要約 |
| 42 | https://medium.com/tech-at-wildlife-studios/texture-animation-techniques-1daecb316657 | 開発会社ブログ（VAT） | 中 | 要約 |
| 43 | https://80.lv/articles/6-000-agents-on-one-game-thread-novel-high-performance-framework-for-gpu-driven-crowd-systems/ | 制作記事（群衆） | 中 | 要約 |
| 44 | https://bugs.webkit.org/show_bug.cgi?id=228208 | WebKit公式バグ票 | 高 | 要約 |
| 45 | https://developer.apple.com/forums/thread/668999 | Apple公式フォーラム（WebGLリサイズでメモリ増加） | 中 | 要約 |
| 46 | https://www.pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/ | 実務ブログ（iOSキャンバス上限） | 低〜中 | 要約 |
| 47 | https://developer.mozilla.org/docs/Web/API/WebGL_API/WebGL_best_practices | MDN | 高 | 要約 |
| 48 | https://kotaku.com/the-art-of-hades-1845443438 | ゲームメディア（Hadesの美術） | 中 | 要約 |
| 49 | https://mcvuk.com/business-news/behind-the-art-of-hades-we-value-artistic-integrity-and-excellence-in-artistic-craft-at-supergiant-however-were-first-and-foremost-a-game-design-lead-team/ | 業界メディア（Jen Zee談） | 中 | 要約 |
| 50 | https://80.lv/articles/how-pixel-art-lighting-was-set-up-in-seamless-world-of-nectarmancer | 制作記事 | 中 | 要約（本文は未精読） |
| 51 | https://www.gamedeveloper.com/art/eastward-s-creators-share-insights-on-making-pixel-art-adventures | Game Developer記事（Eastward） | 中 | 要約 |
| 52 | https://www.creativebloq.com/3d/video-game-design/from-pixels-to-polygons-making-hyper-light-breaker-s-cel-shaded-world | メディア（Hyper Light） | 中 | 要約 |
| 53 | https://gamedeveloper.com/design/road-to-the-igf-heart-machine-s-i-hyper-light-drifter-i- | Game Developer記事（Hyper Light Drifter） | 中 | 要約 |
| 54 | https://nngroup.com/articles/animation-duration | Nielsen Norman Group | 高 | 精読 |
| 55 | https://blog.adobe.com/en/publish/2019/06/19/designing-animation-six-principles-using-animation-ux | Adobe公式ブログ（Val Head） | 高 | 要約 |
| 56 | https://fluent2.microsoft.design/motion | Microsoft Fluent 2 | 高 | 要約 |
| 57 | https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users | Smashing Magazine（Hoober研究の解説） | 中 | 要約 |
| 58 | https://smashingmagazine.com/2020/02/design-mobile-apps-one-hand-usage/ | Smashing Magazine | 中 | 要約 |
| 59 | https://addyosmani.com/blog/touch-friendly-design/ | 実務者ブログ | 中 | 要約 |
| 60 | https://publications.lib.chalmers.se/records/fulltext/111921.pdf | 修士論文「Beyond the HUD」（EA DICE協力） | 高 | 要約 |
| 61 | https://ics.media/en/entry/14087/ | 日本の制作会社記事（palt・日本語カーニング） | 中 | 要約 |
| 62 | https://lists.w3.org/Archives/Public/public-i18n-japanese/2023JanMar/0004.html | W3C日本語タスクフォース | 高 | 要約 |
| 63 | https://www.pcgamer.com/how-developers-create-cinematics | ゲームメディア（シネマティック制作） | 中 | 要約 |
| 64 | https://giantbomb.com/posts/the-very-very-large-black-bars-of-the-evil-within | ゲームメディア（レターボックスの意図） | 中 | 要約 |
| 65 | https://www.famitsu.com/news/202208/27273669.html | ファミ通（CEDEC 2022：ヘブバンの演出） | 中 | 要約 |
| 66 | https://developer.chrome.com/blog/animated-blur.md.txt | Chrome公式ブログ | 高 | 精読 |
| 67 | https://bugs.webkit.org/show_bug.cgi?id=228312 | WebKit公式バグ票（blur性能） | 高 | 要約 |
| 68 | https://www.audiokinetic.com/en/blog/generating-rain-with-pure-synthesis/ | 音響ミドルウェア公式ブログ | 高 | 403（検索要約のみ） |
| 69 | https://dev.to/hexshift/how-to-generate-procedural-audio-textures-in-the-browser-no-samples-needed-332l | 個人ブログ | 低 | 要約 |
| 70 | https://www.nngroup.com/articles/touch-target-size/ | Nielsen Norman Group | 高 | 要約 |
| 71 | https://support.google.com/accessibility/android/answer/7101858 | Google公式（タッチ対象48dp） | 高 | 要約 |
| 72 | https://www.w3.org/WAI/GL/mobile-a11y-tf/wiki/Proposed_SC_Target_Size | W3C | 高 | 要約 |
| 73 | https://threejs.org/manual/en/post-processing | three.js公式マニュアル | 高 | 要約 |
| 74 | https://threejs.org/manual/en/animation-system | three.js公式マニュアル | 高 | 要約 |
| 75 | https://threejs.org/manual/en/shadows | three.js公式マニュアル | 高 | 要約 |
| 76 | https://discourse.threejs.org/t/ambient-oclusion-vs-lightmaps/31333 | three.js公式フォーラム | 中 | 要約 |
| 77 | https://tympanus.net/codrops/2021/03/17/tropical-particles-rain-animation-with-three-js | Codrops（制作解説） | 中 | 要約 |
| 78 | https://developer.apple.com/forums/thread/23499 | Apple公式フォーラム（Web Audio解除） | 中 | 要約 |
| 79 | https://bugs.webkit.org/show_bug.cgi?id=291892 | WebKit公式バグ票（AudioContext） | 高 | 要約 |
| 80 | https://www.wikipedia.org/wiki/Game_feel | 百科事典（Game Feel / Swink） | 中 | 要約 |
| 81 | https://www.gamedeveloper.com/design/measuring-responsiveness-in-video-games | Game Developer記事（Mick West） | 中 | 要約 |
| 82 | https://discourse.threejs.org/t/how-to-optimize-shadow-rendering-in-three-js-for-better-performance/64681 | three.js公式フォーラム | 中 | 要約 |
| 83 | https://uhiyama-lab.com/en/notes/unity/unity-game-feel-hit-feedback/ | 個人ブログ（ヒットストップ等） | 低〜中 | 要約 |
| 84 | https://bugnet.io/blog/how-to-fix-hitstop-or-freeze-frame-feeling-off | 個人ブログ | 低 | 要約 |
| 85 | https://gamejuice.pages.dev/articles/hit-stop-frame-trick | 個人サイト | **使用不可** | 精読したところ「公開予告のみ」で中身が無かった。検索要約の数値は**採用しない** |

注: [85] の同サイトの他ページ（screen-shake-guide、100ms rule など）も検索結果に出たが、同種の未完成サイトの疑いがあるため**根拠にしない**。

---

## 2. 観点ごとの要約

表記: 【事実】出典に書かれていること／【推測】出典から私が導いた設計判断。

### 2.1 ドット絵での映画的演出

**HD-2D（Octopath Traveler系）の構成**
- 【事実】ピクセルのスプライトとビルボードを完全な3D環境に置く。点光源でキャラが周囲へ影を落とし、チルトシフト、被写界深度、ブルーム、ボリューメトリックライト、フォグ、粒子、パララックスを重ねる。背景を3Dで描くのでカメラワークの自由度が高い [1][3]。
- 【事実】Octopath のチームは Unreal Engine 4 に強く依存していた [1][3]。CEDEC等の技術講演そのものは今回見つからなかった。
- 【推測】本ゲームは既に「3D駅＋2D会話」という二層構造なので、HD-2Dの方向とは相性が良い。真似るべきは「ぼけ・ブルーム・粒子・光」の重ね方で、エンジンは不要。

**ドット絵に3Dライティングを当てる手法**
- 【事実】スプライトに手描き法線マップ、アルベド、ラフネス、メタルネスを持たせ、影を受け・落とすための非表示ジオメトリを別に作る。最終的にも全体が2Dに見えることを目標にしている [7]。The Siege and the Sandfox も手描き法線を使い、自動生成した法線は特にドット絵で質が悪い傾向があると述べられている [8]。
- 【事実】Sea of Stars は昼夜サイクルと連動した完全動的ライティングで、専用のレンダリングパイプラインを組んでいる（本文は未読・検索要約）。法線マップを使うかは出典で確認できなかった。
- 【推測】本ゲームの立ち絵は `pixelPortrait()` による手続き生成（`src/ui/parts.tsx`）なので、法線マップを手描きする方式は合わない。**色のライティング（後述）と擬似光源のグラデーション重ね**の方が費用対効果が高い。

**色とライティング**
- 【事実】Slynyrd: 光源をまず決める（上方・右上か左上が自然）。曇りや霞だと影はぼやけ、晴天だと鋭い。仕上げにコントラスト調整とキャストシャドウを足すと引き締まる。色の選び方だけでもムードが大きく変わる [28]。
- 【事実】ランプの色相シフト（影は寒色寄り、光は暖色寄り等）の考え方は広く共有されているが、今回確認できたのはフォーラム水準の記述（硬い面ほど大きく、柔らかい面は小さく）[29]。Slynyrd本文には色相シフトの記述は無かった [28]。
- 【事実】Hades は「色のスクリプト」（ゲーム全体の色の流れを可視化して、違和感を探す）を使ったと Jen Zee が述べている [49]。暖色のハイライトをプレイヤーの行為に、寒色や暗部を敵の圧に割り当てる、というのは第三者の分析であり公式発言ではない [48]。
- 【推測】章ごとに「色の台本」（朝は青白、昼は中立、夕は橙、夜は藍、事故の場面は彩度を落とす）を表にして、全場面で使い回す。

**被写界深度・カメラ・パララックス**
- 【事実】HD-2Dはチルトシフトと被写界深度を後処理で作る [1]。
- 【事実】CSS の blur は iOS Safari で性能問題の歴史が長い [67]。Chrome 公式は「ぼかしのアニメーションは非常に遅い」とし、ぼかし量の違う複数コピーを重ねて不透明度でクロスフェードする、またぼかす要素そのものでなく親を昇格（レイヤー化）させる方法を挙げている [66]。
- 【推測】2D会話では、背景は**事前にぼかした画像を別レイヤーで用意**（Canvasで生成して `toDataURL` か `ImageBitmap`）し、焦点移動は不透明度の切替だけで行う。アニメーションする `filter: blur()` は避ける。

**レターボックス・間（ま）・無音**
- 【事実】The Evil Within は 2.35:1 を「芸術的意図」と公表している [64]。
- 【事実】シネマティック制作の記事に、数秒の無音が場面を成立させたという開発者の反応がある [63]。
- 【事実】ヘブバン（CEDEC 2022）は逆光・遮光で不安や孤独を表現し、画面の簡素さと余白で視線が迷わないようにしたという [65]。
- 【推測】「間」は演出として仕様化する（後述の“ビート”）。

**画面揺れ・ヒットストップ・ジュース**
- 【事実】"Juice It or Lose It"（GDC Europe 2012, Jonasson & Purho）は、退屈なゲームに小さな演出を重ねて満足感を上げる講演 [4]。"The Art of Screenshake"（Nijman）は約30の小さな調整を実演する。例: 射撃と逆方向にカメラを少し揺らす [5]。同じ講演がNuclear Throneの数値（発射ごとにカメラを6px引き、揺れ値に4加算）を引用している [6]（二次情報）。
- 【事実】ヒットストップは数フレーム程度で、用途別の目安が複数ブログにあるが数字は出典間で食い違う [83][84]。**数字は採用せず、実機で調整する**。
- 【事実】学術研究では、テキストの“juicy”効果は単独だと有意な効果が出にくいが、視覚的な演出と組み合わせると補完的に働く [34]。
- 【事実】応答は速いほど良く、入力遅延は仕様に測定値として入れるべきだ（Mick West）[81]。「100ms」説はSwink本人の記述として確認できず、二次情報のみ [80]。
- 【推測】本作は職業ドラマなので、揺れ・停止は「アクション」ではなく**事故・叱責・ヒヤリの瞬間にだけ**使う。多用すると安っぽくなる。

**表情・まばたき・口パク・呼吸・入退場**
- 【事実】Saint11（Pedro Medeiros）のGIFチュートリアル群は、スカッシュ＆ストレッチ、イージング、簡単な動作を扱う [30][31]。今回、立ち絵のまばたきや口パクの具体値は出典から得られなかった。
- 【推測（一般的な目安・要実機調整）】まばたき: 2〜6秒の乱数間隔、閉じ約80〜120ms。呼吸: 3秒周期で縦に1〜2px。口パク: タイプライターが文字を出している間だけ口差分を交互に切替。入場: 横から約40pxスライド＋フェード、約300ms。退場は入場より短く。

**テキスト演出**
- 【事実】句読点で止める可変速タイプライター（通常0.05秒、句読点0.2秒、スペース0.1秒の例）、インラインのポーズ・速度タグ、Ren'Py の文字ごとのランダムオフセットによる揺れ [32][33]。タイプライターは必ず**タップで即全文表示**できること [33]。
- 【推測】読みの速い人を遅くしない設計が最優先。揺れ・色は「感情の山」だけに使う。

### 2.2 パーティクル・環境演出（雨・雪・塵・光芒・湯気・夕日）

- 【事実】Canvasの粒子は `requestAnimationFrame`、`clearRect`、スプライトのオフスクリーン事前描画、`devicePixelRatio` の上限設定、非表示時の停止、`prefers-reduced-motion` の尊重が定石 [35][36]。
- 【事実】サンプルは固定数の粒子（例: 100個上限）で動かす [35]。
- 【事実】Three.js では `Points` で雨・雪を作れる。加算ブレンド・深度書き込みなし・フォグ連動でアルファを減衰させる実例がある（CodePen）。光芒は決まった実装が出典に無かった [77]。
- 【推測】光芒は「加算ブレンドの縦長グラデーション帯を2〜3枚、ゆっくり左右にドリフトさせる」で足りる。湯気は半透明の白い楕円を上昇・拡大・フェードさせる。夕日は画面全体の色味オーバーレイ（`mix-blend-mode: soft-light` か半透明グラデーション）で十分。

### 2.3 3D（Three.js）

**後処理**
- 【事実】pmndrs/postprocessing は複数エフェクトを**1つのシェーダパスに統合**して負荷を抑える。レンダラー設定として `antialias:false`、`stencil:false`、`depth:false`、`powerPreference:"high-performance"` を推奨 [22]。three.js標準の EffectComposer はエフェクトごとに1パスで、重ねるほど高くなる [73]。
- 【事実】`UnrealBloomPass` は Intel Mac の Safari で全画面サイズだと約20fps、幅400px程度で60fpsという報告。M1 では安定60fps [21]。フラグメント負荷（解像度）が支配的。iOS 15 でブルームの残像バグの報告もある [24]。モバイルのGPUは後処理が苦手で、モバイルでは後処理を切る運用が一般的 [21][23]。
- 【事実】ビネット・カラーグレーディングは軽い純計算エフェクトで、グレインは最後に掛ける、という整理が見られる（Unity向け資料の目安なので数値は参考）。three.js標準に `FilmPass`（グレイン）がある [73]。
- 【事実】トーンマップは three.js に ACES / AgX / Neutral がある。AgX は ACES より彩度が低めで、ACES前提で作ったシーンに差し替えても自動的には良くならない [39][40]。
- 【推測】iPhone では「ブルーム（半解像度）＋ビネット＋グレインを1パスにまとめた自作 ShaderPass」を high のみ、medium は CSS のビネットだけ、low は無し、が妥当。ブルームは夜の窓・信号・駅名標など**発光体にだけ**効かせる（選択ブルームの代わりに、明るさ閾値を高くする）。

**SSAOの代替・ベイク風ライティング**
- 【事実】AOマップは受光量を下げ、three.jsの lightMap は逆に光を足す。glTFはAOを持てるが lightmap は直接持てないため、emissiveスロットに入れて読込後に `lightMap` に付け替える手がある [76]。Blenderでのベイクやブラウザ内ベイカーが存在する [76]。
- 【推測】軽い順に、(1) 柱の根元・壁の下端・ホーム縁に**頂点カラーのグラデーション**を焼く、(2) 人や列車の足元に**ぼかした円形グラデーションの偽影**（影マップ無しでも接地感が出る）、(3) 駅舎全体のAOを Blender で焼いて `aoMap` に。

**手続き型PBRテクスチャ**
- 【事実】ノイズからディフューズとラフネスを作り、ディフューズを高さマップとして法線マップに変換して `MeshStandardMaterial` に渡す実例 [37]。Canvas上で高さ場から隣接差分で法線を求める解説もある [38]。
- 【事実】法線・ラフネスなどのデータ用テクスチャは色空間を指定せず（リニア）、色用のCanvasテクスチャは sRGB にする、という整理（third-party）。
- 【推測】コンクリート: 多段ノイズ（大小の斑）＋細かいピンホール＋目地線。タイル: 目地の凹み＋1枚ごとの明度ばらつき＋汚れ（目地に沿った暗部）。金属: 縦方向に伸ばしたノイズでヘアライン。塗装: 低周波の色ムラ＋縁の剥がれ。いずれも 256〜512px のタイル画像を起動時に1回だけ生成し、`RepeatWrapping`、`anisotropy` は2〜4。

**人物のアニメーション**
- 【事実】three.js は `AnimationMixer` と `crossFadeTo` でアイドル→歩行をブレンドできる。Mixamo系はルートモーションで位置が戻る問題の報告がある [74]。顔の表情やまばたきはモーフターゲットの `morphTargetInfluences` で駆動する [74]。
- 【推測】既存の `humanoid.ts` がGLBから組む構造なので、(a) アイドル中の呼吸（胸の微小スケール）、(b) 首の視線追従（会話相手へ）、(c) まばたきを乱数間隔で、の3点から入れる。

**群衆**
- 【事実】単一の `InstancedMesh` と頂点アニメーションテクスチャ（VAT）で1ドローコールの群衆を作る手法と、インスタンスごとの時間オフセットで同期感を消す工夫がある [41][42][43]。標準の InstancedMesh はモーフ・スキニングを直接サポートしない（フォーラムの報告。現行版は要確認）[41]。
- 【推測】現在の群衆は品質別に5〜16体（`quality.ts`）。体数を増やす前に「歩調・向き・立ち止まり・スマホを見る」のばらつきを増やす方が映像品質に効く。

**時間帯・雨・霧**
- 【事実】`THREE.Fog`、`Points` の雨、加算ブレンドが基本。体積フォグはWebGPU側の機能で、WebGLでは指数フォグが代替 [77]（third-party要約）。
- 【推測】既存の昼→夕の補間（`renderManager.ts` の sky・fog の lerp）を拡張し、`夜`では窓・照明・駅名標のエミッシブを上げ、`雨`では路面のラフネスを下げて空の反射を見せる（濡れ表現）。

**マテリアルと影のコスト**
- 【事実】`MeshStandardMaterial` は `MeshLambertMaterial` より重く、モバイルでは画面全体を覆うと苦しい報告がある。影を落とす光源は1〜2個に絞る [82][75]。

### 2.4 UI

**ディエジェティックUI**
- 【事実】UIは「ゲーム世界に存在するか」「3D空間にあるか」の2軸で分類できる（Fagerholt & Lorentzon）[60]。後続研究は、弾薬は空間表示が良く、体力はHUDの方が良い、と結果が割れた [60]。
- 【事実】Detroit は、アンドロイドのAR視界を使ったUIでゲーム世界との境を薄くしている [14][16]。成功率が手がかりや選択で上下する場面がある（TechRadar、検索要約）。
- 【推測】本作の「業務端末・駅の案内表示・運転台のモニタ」をそのままUIにするのが、職業ドラマと最も相性の良い“ディエジェティック”。

**選択・フローチャート・章末**
- 【事実】Detroit は章末にフローチャートを出し、選ばなかった道も示す。大小の決断が見え、因果を考えさせる [15]。
- 【推測】既に `StoryMap.tsx` があるので、**出現演出**（線が伸びる→分岐点が灯る→未選択は「？」の暗い枝）と、「この選択が効いた箇所」の注釈を足せば、近い体験になる。

**Persona 5 のUI**
- 【事実】日付切替は12秒（前半6秒を現在日表示、2秒で切替、新日付4秒保持）で、戦闘・会話で刺激され続けた後の「一息」になる。切替で色を変えると気づきやすい [10]。
- 【事実】UIは構成主義的（太いサンセリフ、角張った配置）、メニュー1枚ごとに設計が必要で作るのが大変（橋野氏）[12][13]。メニューに3Dモデルが回ってポーズを取る演出に専用ツールを使った [11]。
- 【推測】「全画面を派手に」ではなく、**場面の山にだけ独自の動きを割り当てる**のが現実的。

**動きの基準**
- 【事実】NN/g: 多くのアニメは100〜400ms。単純なフィードバックは約100ms、モーダル等は200〜300ms、大画面でも約400msまで。500msで煩わしい。表示は非表示より少し長く。reduce motion の設定を尊重 [54]。
- 【事実】Adobe（Val Head）はイージングが性格を決めるとする。Disneyの12原則はUIにそのまま当てはまるとは限らない [55]。Fluent 2 も長さとイージングの両立を説く [56]。

**親指ゾーンとタッチ目標**
- 【事実】Hoober の研究では、片手で親指だけを使う人が多数だが、握り方は状況で変わり、地図は固定の型ではなく**実機で検証するモデル**として扱う [57][58]。
- 【事実】最小タッチ目標: Apple 44pt（約7mm）、Material 48dp（約9mm）[70][71]。WCAG 2.2 AAは24×24 CSS px、44pxはAAA [72]。
- 【推測】選択肢は画面下部40%に、サイズは高さ48px以上、間隔8px以上。メニュー・ログ・スキップは上部に置き、誤タップを避ける。

**日本語タイポグラフィ**
- 【事実】日本語本文はベタ組みが原則で、`palt`（プロポーショナル詰め）は既定では付けない。見出しでは可読性が上がる。縦書きでは `vpal`。`system-ui` や Yu Gothic UI との組合せで不具合の報告がある [61][62]。
- 【推測】章タイトル・短いラベルにだけ `font-feature-settings: "palt"`、本文は付けない。字詰めは実機のiOSで確認する。

### 2.5 音

- 【事実】適応型音楽の基本は**縦のレイヤー**: 長さの揃った複数のステム（パッド・打楽器・旋律・低音）を同時に開始し、それぞれ `GainNode` を持たせ、ゲーム状態で出し入れする。クロスフェードは `ctx.currentTime` 基準のスケジュールで行い、等パワー曲線を使う。戦闘の出入りで頻繁に切り替わらないようヒステリシスを入れる [25][26]。
- 【事実】デコード済みバッファはメモリを食う。ステムが多いと数十〜百MB超になり得る（出典の見積りは過小の可能性が高いと検索要約が指摘）[25]。
- 【事実】雨は「小さな衝撃の集合」で、ピンクノイズ、ノイズのフィルタ、ランダムなLFO、粒の個別音、強度パラメータでレイヤー音量とフィルタを駆動する、という構成（Audiokinetic。本文は取得できず検索要約のみ）[68]。風や波もフィルタ付きノイズで実用的、ただし録音素材より質が落ちやすい [69]。
- 【事実】iOS: AudioContext は同期的なユーザー操作ハンドラ内で作成・`resume()` する必要がある。`touchstart` を巡る報告が割れているので `click` / `touchend` / `pointerup` も付ける。2025年に「runningなのに時間が進まない」という不具合報告もある [78][79]。
- 【事実】無音は演出として使える（上記 [63]）。
- 【推測】既存の `audio.ts` は環境音・列車・効果音・シーケンサBGMを手続きで作っている。**録音素材を足す前に**、(1) ステムではなく「シーケンサの層（パッド／ベース／ハット／メロ）を状態でミュート」する、(2) 重要な台詞の直前に音楽を0.8〜1.5秒で絞る、が最小工数。

### 2.6 パフォーマンス（iPhone Safari）

- 【事実】キャンバス総メモリには上限があり、1キャンバスの画素数上限（約1677万px）や総量上限の報告がある。上限超過時はキャンバスが描画されない。数値はiOS版で異なる [44][46]。
- 【事実】WebGLキャンバスの頻繁なリサイズでメモリが増える報告（iOS）[45]。`devicePixelRatio` を無制限に使うと性能が半減した報告もある [44]。
- 【事実】animated blur は避ける [66]。blur の性能は WebKit にバグ票が複数 [67]。
- 【事実】モバイルGPUは後処理に弱い [23]。
- 【推測】既存の `QUALITY`（`pixelRatioCap` 2／1.5／0.8）は方針として妥当。後処理・粒子数・偽影の有無も同じプリセットに載せ、`AdaptiveQuality` が落とすときに一緒に落ちるようにする。

---

## 3. 自作ゲームへの適用案

### 3.0 現状に足りない演出（コード確認の範囲）

| 領域 | 現状（確認箇所） | 足りないもの |
|---|---|---|
| 2D会話 | `Stage25D` `Portrait`（ピクセル生成）、`useTypewriter`、`.dim`（話者以外を暗く） | まばたき・呼吸・口パク、入退場、感情の「間」、背景の時間帯・天候、カメラ寄り引き、レターボックス、場面転換、粒子 |
| 3D | ACES、`THREE.Fog`、`PCFSoftShadowMap`、昼→夕の補間、品質3段階＋自動調整 | ブルーム・ビネット・グレイン、手続き型PBR、偽AO、夜・雨、人物の待機アニメ |
| UI | 業務ミニゲーム多数、`StoryMap`、`Joystick` | 時間制限リング、章タイトルカード、フローチャートの出現演出、章末の振り返り |
| 音 | 手続き型の環境音・列車・SE・シーケンサBGM | BGMレイヤーの出し入れ、無音の演出、タイプ音、鼓動、雨・屋内外のリバーブ |

### 3.1 実装案（工数は1人・実装のみ・実機調整抜きの目安）

**A. 会話シーンの「場面スタック」（工数 1.5〜2日）**
- `Stage25D` に `scene` 設定（時間帯 `dawn|day|dusk|night`、天候 `clear|rain|snow|fog`、屋内外）を渡す。
- レイヤー構成（下から）: 背景画像 → 事前ぼかし背景（焦点用、不透明度で切替）→ 立ち絵 → 色味オーバーレイ → 粒子Canvas → ビネット → レターボックス。
- 色味は CSS 変数＋1枚のオーバーレイ（`mix-blend-mode: soft-light` か単純な半透明グラデーション）。時間帯4種×天候で「色の台本」表を `data/` に置く。
- カメラの寄り引きは `.stage` に `transform: scale()`（1.00→1.04を6〜10秒、`ease-in-out`）。パンは `translateX` 数px。`filter` は動かさない [66]。
- レターボックスは上下の黒帯を高さ0→画面の約10%へ300〜400ms（NN/g目安 [54]）。使うのは章の山と回想だけにする。

**B. 立ち絵に「生きている感じ」（工数 1日）**
- `Portrait` を `Canvas` 生成の2枚（目開き／目閉じ）＋口開閉の差分にし、`useEffect` の乱数タイマーでまばたき（間隔2〜6秒、閉じ約100ms）。呼吸は CSS `@keyframes` で `translateY(0→1.5px)` を約3秒周期。
- 口パクは `useTypewriter` が文字を出している間だけ約120msごとに切替。`prefers-reduced-motion` では停止。
- 入退場: クラス付与で `transform: translateX(±40px)`＋`opacity` を約300ms。退場は約200ms。

**C. タイプライターを「演出」にする（工数 0.5〜1日）**
- 句読点で止める（、100ms／。200ms／…400msを初期値に実機で調整）。インラインタグ `{w:300}`（待つ）`{shake}...{/shake}`（揺れ）`{c:warn}...{/c}`（色）を `build-story.mjs` 側で許可し、`storyLint.ts` で検査。
- タップで即全文表示は維持 [33]。揺れは文字ごとに `transform` を数px、感情の山だけ。
- 「間」: ノード属性 `beat: 800` で台詞の後に800ms何も出さず、BGMを絞る（E-2）。

**D. 場面転換と衝撃（工数 0.5〜1日）**
- ワイプ・フェード・アイリスは `clip-path` か `mask` で。300〜600ms [54]。
- 画面揺れは「トラウマ値」方式（衝撃で値を加算し、時間で減衰、揺れ量は値の2乗）。事故・叱責・ヒヤリの場面だけ。短い停止（数フレーム）と明るいフラッシュ1フレームを併用。数値は実機で調整し、出典の数字は採らない [83][84][85]。
- 設定画面に「画面揺れ・点滅を減らす」を用意（`reduce motion` と連動）。

**E-1. 粒子Canvas（工数 1日）**
- `components/Weather.tsx`: 単一Canvas、粒子は雨80〜150／雪60／塵30。DPRは最大1.5、`document.hidden` で停止、`prefers-reduced-motion` で静止画に。スプライトはオフスクリーンで事前描画 [35][36]。
- 光芒: 加算ブレンドの縦帯グラデーションDOMを2〜3枚（CSSアニメ）。Canvasには入れない。

**E-2. 音の演出（工数 1.5日）**
- BGMレイヤー: 既存シーケンサを4層（パッド／ベース／リズム／メロ）に分け、`tension`（0〜1）で各層の `GainNode` を `setTargetAtTime` で動かす。ヒステリシスを入れ、等パワーで1〜3秒 [25][26]。
- 「無音の山」: 重要台詞の直前にBGMを約1秒で0.15程度へ。台詞後に1.5秒かけて戻す。
- タイプ音: 話者ごとに高さを変えた極短い三角波ティック（音量は小さく、設定で切）。
- 時間制限の鼓動: 残り時間に応じて低音の「ドクン」を間隔短縮（60→110bpm相当）、同期して視覚の縮小パルス。
- 雨: 既存の `noiseBuf` を流用し、ピンクノイズ＋バンドパス＋ランダムLFO＋粒の短いクリックで合成 [68]。屋内外は `ConvolverNode` を使うか、ローパスの切替だけで代用。
- iOS: 最初のタップで `ctx` を作成し、`click`/`touchend`/`pointerup` で `resume()`、`statechange` を監視して失敗時に再試行 [78][79]。

**F. 選択UI（工数 1日）**
- 時間制限リング: SVG円の `stroke-dashoffset` を `requestAnimationFrame` で更新（CSSアニメでも可）。残り少で色を寒色→警告色、リングの太さを微増、鼓動と同期。**制限なしモード**を設定に置く（アクセシビリティ）。
- 選択肢は画面下部40%、高さ48px以上、間隔8px以上 [57][70][71]。選択確定時に選ばなかった項目を80〜120msで消す。
- 成功率のような数値は出さず、「評価に影響する」小さなアイコンだけにする案（Detroitの成功率表示 [16] より、職業ドラマの“重み”に合う、という推測）。

**G. 章タイトルカードと章末（工数 1〜1.5日）**
- 章タイトル: 黒背景→細いライン→章番号→タイトルの順に文字単位でフェード（各40ms遅延）。タイトルは `palt`、本文は付けない [61][62]。場所・時刻のサブ見出しは小さく。
- 章末: 既存 `StoryMap` に出現演出（線が伸びる→分岐点が灯る→未選択は暗い枝＋「？」）と、「この選択が後で効いた」注釈 [15]。

**H. 3D 後処理と質感（工数 3〜5日）**
- high のみ: 自作 `ShaderPass`（ブルーム相当は半解像度レンダーターゲット＋閾値＋簡易ブラー、ビネット、グレイン、軽いLUT）を1パスに統合。`pmndrs/postprocessing` の導入は依存追加なので別途判断 [22][73]。medium: CSSビネットのみ、low: なし。`QUALITY` に `post: 'full'|'css'|'off'` を追加。
- 発光体（窓・信号・発車標）のエミッシブを夜に上げ、ブルームの対象にする。
- 手続き型PBR: `materials.ts` にコンクリート・タイル・塗装・金属（ヘアライン）・汚れを追加。256〜512px、起動時1回生成、法線は高さ場の隣接差分、ラフネスはノイズ [37][38]。
- 偽AO: 柱根元・壁下端に頂点カラー、人物・列車足元にブロブ影、最後にBlender焼き込み `aoMap` [76]。
- 夜・雨: 既存の昼→夕補間を一般化し、`timeOfDay`/`weather` から光色・強度・フォグ・エミッシブ・ラフネスを一括決定する関数にする [77]。
- 人物: `AnimationMixer` で待機⇄歩行を `crossFadeTo`、ルートモーションを除去 [74]。呼吸・視線追従・まばたきを追加。群衆は体数より行動のばらつきを優先 [41]。

**I. パフォーマンス運用（常時）**
- `filter: blur()` をアニメしない [66]。粒子・後処理・偽影・ステム数を `QUALITY` に載せ、`AdaptiveQuality` が一緒に下げる。
- WebGLキャンバスを作り直さない、リサイズの頻度を抑える [45]。
- キャンバス数と画素数に予算（例: 同時に生きるキャンバスは3枚以下）を設ける [44][46]。

---

## 4. 優先順位つき実装リスト

優先度は「体験への効き÷工数÷リスク」。UNVERIFIED は実機未確認。

| 順 | 項目 | 工数 | 効果 | リスク |
|---|---|---|---|---|
| P0-1 | 立ち絵のまばたき・呼吸・口パク・入退場（B） | 1日 | 大 | 低 |
| P0-2 | タイプライター強化（句読点・タグ・間）（C） | 0.5〜1日 | 大 | 低 |
| P0-3 | 会話シーンの色味・ビネット・レターボックス・ゆっくりした寄り（A の一部） | 1日 | 大 | 低 |
| P0-4 | 重要台詞前の音楽の絞り（無音の山）＋タイプ音（E-2 の一部） | 0.5日 | 大 | 低 |
| P1-1 | 時間制限リング＋鼓動（F） | 1日 | 大 | 低（制限なしモード必須） |
| P1-2 | 章タイトルカード（G 前半） | 0.5日 | 中〜大 | 低 |
| P1-3 | 天候Canvas（雨・雪・塵）＋光芒（E-1） | 1日 | 中〜大 | 中（iOS性能） |
| P1-4 | 場面転換（ワイプ等）・画面揺れ（D） | 0.5〜1日 | 中 | 低 |
| P1-5 | BGMレイヤー出し入れ（E-2 の本体） | 1日 | 大 | 中（iOS音） |
| P2-1 | フローチャートの出現演出・章末の振り返り（G 後半） | 0.5〜1日 | 中〜大 | 低 |
| P2-2 | 手続き型PBR（コンクリート・タイル・塗装・汚れ）（H） | 1.5日 | 中〜大 | 低 |
| P2-3 | 偽AO（頂点カラー・ブロブ影）（H） | 1日 | 中 | 低 |
| P2-4 | 夜・雨の3D表現（時間帯・天候の一般化）（H） | 1〜1.5日 | 大 | 中 |
| P3-1 | 3D後処理1パス（ブルーム・ビネット・グレイン）high限定（H） | 2〜3日 | 中 | **高（iOS性能・不具合 [24]）** |
| P3-2 | 人物のアイドル・歩行ブレンド・視線（H） | 1〜2日 | 中 | 中 |
| P3-3 | 群衆の行動ばらつき／VAT化 | 2日〜 | 小〜中 | 中 |
| P3-4 | 背景の事前ぼかしレイヤーによる被写界深度（A の一部） | 1日 | 中 | 中 |

合計目安: P0 で約3〜3.5日、P1 で約4〜5日、P2 で約4〜5日、P3 で約6日以上。

検証の置き方（CLAUDE.md の運用に合わせる）: 各項目を `npm run check` と `scripts/audit.mjs` のスクリーンショットで確認し、**iPhone Safari 実機での FPS・メモリ・音の再生は別途 UNVERIFIED として台帳に残す**。

---

## 5. 調べきれなかった点

- **Detroit 本編の技術講演（GDC 2018 のライティング講演、エンジン講演）は本編未視聴**。紹介文のみ [18][20]。UIの動きの詳細（フレーム単位の分析）は出典が見つからなかった。
- **Octopath の CEDEC 講演**は見つからず。公式インタビューは403で本文未取得 [2]。
- **Sea of Stars／Eastward／CrossCode／Hyper Light Drifter の技術的な内部実装**は、検索要約の範囲で一般論のみ。CrossCode の描画に関するRadical Fishの一次記事は見つからなかった。
- **Saint11 の画面揺れ**、**Pixel Logic**（Pixel Logic本そのもの）は未確認。
- **"Juice It or Lose It"／"The Art of Screenshake" の講演本編**は未視聴。数値は二次情報 [4][5][6]。
- **Game Feel（Swink）の書籍**は未読。「100ms」は一次確認できず [80]。
- **ヒットストップの具体的フレーム数**は信頼できる出典が得られなかった（[85] は中身が無かった）。実機で調整すること。
- **立ち絵のまばたき・呼吸・口パクの具体値**はこの調査では出典を得られず、一般的な目安（推測）で記載した。
- **iPhone Safari での three.js 後処理の実測値**（ブルームのフレーム時間等）は見つからなかった [21][22]。
- **iOS のキャンバス・メモリ上限**は古い報告中心で、最新iOSでの値は未確認 [44][46]。
- **Audiokinetic の雨の合成**は本文を取得できず、検索要約のみ [68]。
- **日本語の CEDEC／ゲーム演出記事**は1件のみ [65]。日本語の技法記事（ADV演出・立ち絵アニメ）はさらに探す余地がある。
- **AgX と ACES の見た目の比較**は、本ゲームの色味で実際に試していない。
