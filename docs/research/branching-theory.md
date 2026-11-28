# 分岐物語の設計論と他作品の手法（REAL RAIL & ROAD 向け調査）

作成日: 2026-11-28 / 調査担当: サブエージェント / 版: v1（骨子＋肉付け済み。追補は末尾「調べきれなかった点」参照）

**読み方**: 各主張に出典番号 [n] を付ける。`[事実]` は出典に書かれている内容、`[推測]` は私の解釈・当ゲームへの推定。出典は WebSearch の要約と WebFetch の精読が混在する（信頼度欄に「精読」「検索要約」を明記）。長い引用はしない。

---

## 1. 出典一覧

信頼度: 高＝一次（開発者本人・学会・公式文書）／中＝報道・専門批評／低＝個人ブログ・フォーラム・ファン考察。取得: 精読＝本文を取得して読んだ／要約＝検索結果の要約のみ。

| # | 出典 | URL | 種別 | 信頼度 / 取得 |
|---|---|---|---|---|
| 1 | Emily Short「Beyond Branching: Quality-Based and Salience-Based Narrative Structures」(2016) | https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/ | 設計記事 | 高 / 精読 |
| 2 | Emily Short「Storylets: You Want Them」(2019) | https://emshort.blog/2019/11/29/storylets-you-want-them/ | 設計記事 | 高 / 精読 |
| 3 | Emily Short「Kreminski on Storylets」(2019) | https://emshort.blog/2019/01/06/kreminski-on-storylets/ | 設計記事 | 高 / 精読 |
| 4 | Max Kreminski「Sketching a Map of the Storylets Design Space」(ICIDS 2018) | https://mkremins.github.io/publications/Storylets_SketchingAMap.pdf | 学会論文 | 高 / 要約（検索結果の記述のみ） |
| 5 | Sam Kabo Ashwell「Standard Patterns in Choice-Based Games」(IFWiki転載) | https://www.ifwiki.org/Standard_Patterns_in_Choice-Based_Games | 分類論 | 高 / 精読 |
| 6 | Choice of Games「By the Numbers: How to Write a Long Interactive Novel That Doesn't Suck」(2011) | https://www.choiceofgames.com/2011/07/by-the-numbers-how-to-write-a-long-interactive-novel-that-doesnt-suck/ | 制作ガイド | 高 / 要約 |
| 7 | Emily Short「Mailbag: Choice of Aesthetics」（delayed branching への言及）＋IFMud議論の転記 | https://emshort.blog/2017/07/06/mailbag-choice-of-aesthetics/ | 設計記事 | 中 / 要約 |
| 8 | Game Developer「Sunless Sea, 80 Days and the rise of modular storytelling」(2015) | https://www.gamedeveloper.com/design/-i-sunless-sea-i-i-80-days-i-and-the-rise-of-modular-storytelling | 業界記事 | 中 / 精読 |
| 9 | Meg Jayanth GDC 2015「Leading Players Astray: 80 Days & Unexpected Stories」（GDC Vault 1022101／MCV報道） | https://gdcvault.com/play/1022101/contactUs , https://mcvuk.com/development-news/80-days-writer-tempt-your-players-into-making-bad-decisions/ | 学会講演報道 | 中 / 要約 |
| 10 | inkle ink 公式ドキュメント（knot/stitch/tunnel/thread/LIST）、GDC Vault「Ink: The Narrative Scripting Language」 | https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md , https://gdcvault.com/play/1023221/Ink-The-Narrative-Scripting-Language | 公式文書 | 高 / 要約 |
| 11 | Yarn Spinner 公式「Node Groups / Saliency / Storylets and Saliency」 | https://docs.yarnspinner.dev/write-yarn-scripts/advanced-scripting/node-groups , https://docs.yarnspinner.dev/write-yarn-scripts/advanced-scripting/saliency | 公式文書 | 高 / 要約 |
| 12 | Game Developer「How The Walking Dead limits player choice and why that's a good thing」 | https://gamedeveloper.com/design/how-the-walking-dead-limits-player-choice-and-why-that-s-a-good-thing- | 批評 | 中 / 精読 |
| 13 | PC Gamer「Telltale's choices aren't about plot, but something more significant」 | https://www.pcgamer.com/uk/telltales-choices-arent-about-plot-but-something-more-significant/ | 批評 | 中 / 要約 |
| 14 | Den of Geek「The Walking Dead: The False Promises of Telltale's Masterpiece」 | https://www.denofgeek.com/games/the-walking-dead-false-promises-telltale/ | 批評 | 中 / 要約 |
| 15 | iDMAa「Conventions and Innovations: Narrative Structure and Technique in Heavy Rain」 | https://idmaa.org/journalarticle-v8n2-conventions-and-innovations-narrative-structure-and-technique-in-heavy-rain/ | 学術 | 中〜高 / 精読 |
| 16 | BFI「Heavy Rain – 15 years of Quantic Dream's experiment in interactive drama」 | https://www.bfi.org.uk/features/heavy-rain-15-years-quantic-dreams-experiment-interactive-drama | 批評 | 中 / 要約 |
| 17 | Game Informer「Afterwords: Until Dawn」／Rely on Horror「Graham Reznick interview」 | https://www.gameinformer.com/b/features/archive/2015/10/18/afterwords-until-dawn , https://relyonhorror.com/in-depth/interview-from-homage-to-subversion-crafting-until-dawns-narrative-w-graham-reznick | 開発者インタビュー | 中 / 要約 |
| 18 | Dontnod 関連: PCGamesN／Square Enix「Life is Strange 2 interview」／CinemaBlend（エンディングは選択に連動しない） | https://www.square-enix-games.com/news/life-strange-2-interview-part-1 , https://www.cinemablend.com/games/Why-Life-Strange-Ending-Wasn-t-Tied-Game-Choices-According-Dev-132147.html | 開発者インタビュー | 中 / 要約 |
| 19 | Papers, Please: Game Developer「Designing the bleak genius of Papers, Please」／GDC Game Narrative Review(Weinstein)／Morrissette (Game Studies) | https://www.gamedeveloper.com/design/designing-the-bleak-genius-of-i-papers-please-i- , https://gamestudies.org/1701/articles/morrissette | 開発者記事・学術 | 中〜高 / 要約 |
| 20 | PC Gamer「Why I love failing in Disco Elysium」／Gamebanshee「New Approach to Failure」 | https://www.pcgamer.com/why-i-love-failing-in-disco-elysium , https://gamebanshee.com/3u3wu | 批評 | 中 / 要約 |
| 21 | Multiplier「Is fail-forward the future for CRPGs?」 | https://multiplierau.substack.com/p/is-fail-forward-the-future-for-crpgs | 評論 | 低〜中 / 精読 |
| 22 | Blades in the Dark の fail-forward 論評（There Will Be Games ほか） | https://therewillbe.games/blogs-by-staff/6529-blades-in-the-dark-a-minor-complication-pt-1 | 評論 | 低〜中 / 要約 |
| 23 | Game Developer「How Citizen Sleeper was inspired by tabletop RPGs and gig work」 | https://www.gamedeveloper.com/business/how-citizen-sleeper-was-inspired-by-tabletop-rpgs-and-gig-work | 開発者インタビュー | 中 / 精読 |
| 24 | inkle「Unpicking Oxenfree」／GamesRadar「interrupt dialogue in Oxenfree」／GDC 2017 Krankel講演 | https://www.inklestudios.com/2016/03/04/oxenfree , https://gamesradar.com/interrupt-dialogue-in-oxenfree-makes-conversations-feel-natural | 業界批評 | 中 / 要約 |
| 25 | Firewatch: Kotaku「A video game about how people actually talk」／Game Developer（Vanaman GDC 2014） | https://kotaku.com/a-video-game-about-how-people-actually-talk-to-each-oth-1629656934 , https://www.gamedeveloper.com/design/why-game-design-should-feel-like-taking-your-player-out-on-a-date | 報道 | 中 / 要約 |
| 26 | 80.lv「GDC18: The Design of Night in the Woods」 | https://80.lv/articles/gdc18-the-design-of-night-in-the-woods/ | 講演報道 | 中 / 要約（本文未読） |
| 27 | Game Developer「Making Her Story and using the player's imagination as a narrative tool」(Barlow GDC 2016) | https://gamedeveloper.com/design/video-making-i-her-story-i-and-using-the-player-s-imagination-as-a-narrative-tool | 講演報道 | 中 / 要約 |
| 28 | Return of the Obra Dinn: PC Gamer「Everything changed between demo and launch」／Automaton（Pope日本語インタビュー） | https://www.pcgamer.com/everything-changed-between-return-of-the-obra-dinns-demo-and-launch , https://automaton-media.com/articles/interviewsjp/20190719-97599/2/ | 開発者インタビュー | 中〜高 / 要約 |
| 29 | Game Developer「The value of small storytelling in Obsidian's Pentiment」 | https://gamedeveloper.com/design/the-value-of-small-storytelling-in-obsidan-s-next-rpg-pentiment | 業界記事 | 中 / 要約 |
| 30 | Danganronpa 公式システム解説（danganronpa.us）／Fandom wiki Class Trials | https://danganronpa.us/danganronpa/system.html , https://danganronpa.fandom.com/wiki/Class_Trials/Danganronpa_1 | 公式・ファンwiki | 中〜低 / 要約 |
| 31 | 週刊アスキー『428』紹介（ザッピングシステム） | https://weekly.ascii.jp/elem/000/001/849/1849323/ | 報道 | 中 / 要約 |
| 32 | Game*Spark「群像劇アドベンチャーゲームの可能性とは？…【CEDEC2025】」（イシイジロウ／北島行徳） | https://www.gamespark.jp/article/2025/08/14/155999.html | 講演報道（日本語） | 中〜高 / 精読 |
| 33 | 4Gamer『STEINS;GATE』『ROBOTICS;NOTES』関連インタビュー（フォーントリガー、ルート分岐） | https://www.4gamer.net/games/126/G012694/20120908008/index_3.html | 開発者インタビュー（日本語） | 中 / 要約 |
| 34 | ファミ通「逆転裁判」開発者インタビュー／GCC'18 巧舟講演報道 | https://www.famitsu.com/news/201804/03154881.html | 開発者講演（日本語） | 中 / 要約 |
| 35 | ペルソナ: First Person Scholar「Life Will Change」／Gamers with Glasses「Friends, Time, and Loss in the Persona Series」／PC Gamer「Persona 5: The Phantom X…calendar」／Kotaku | https://www.firstpersonscholar.com/?p=6899 , https://www.gamerswithglasses.com/features/take-your-time-scheduling-life-in-the-persona-series , https://www.pcgamer.com/games/rpg/persona-5-the-phantom-x-had-a-hard-time-doing-away-with-the-series-iconic-calendar-system-it-was-very-difficult-to-convince-the-team | 学術・批評 | 中 / 要約 |
| 36 | Game Informer「Mass Effect: Andromeda's new approach to romance」ほか（approval／loyalty／temperament） | https://gameinformer.com/b/features/archive/2016/11/18/mass-effect-andromeda-39-s-new-approach-to-romance | 開発者インタビュー | 中 / 要約 |
| 37 | iv4xr Story Validator（Twine JSONを有向グラフ化、到達不能・行き止まり検出）／Veloso 修士論文 | https://fenix.tecnico.ulisboa.pt/downloadFile/1689244997262309/83438_Carolina_Veloso_resumo.pdf | 学術 | 中〜高 / 要約 |
| 38 | PulseGeek「Automated Tests for Choice Coverage in Scripts」 | https://pulsegeek.com/articles/automated-tests-for-choice-coverage-in-scripts | 実務ブログ | 低 / 要約 |
| 39 | DendryScope: Narrative Designer Support via Symbolic Analysis (AIIDE 2023) | https://ojs.aaai.org/index.php/AIIDE/article/view/27527 | 学会論文 | 高 / 要約 |
| 40 | intfiction.org「Automated bugtesting?」（ChoiceScriptのquicktest/randomtest） | https://intfiction.org/t/automated-bugtesting/74760 | フォーラム | 低 / 要約 |
| 41 | Beyond: Two Souls の時系列崩しへの批評（Epilogue Gaming／PopMatters） | https://epiloguegaming.com/short-stories-and-scrambled-chronologies-in-beyond-two-souls/ | 批評 | 低〜中 / 要約 |
| 42 | Disco Elysium: RPS／Valve FAQ 引用（白判定は技能に1点振れば再挑戦可）、indiegraze（白・赤・黒判定）、PCInvasion/Canard PC（失敗しても内容を閉じない）、GameSpot（Thought Cabinet） | https://www.indiegraze.com/?p=231 , https://gamespot.com/articles/how-the-feature-that-almost-sunk-disco-elysium-was/1100-6472676/ | 開発者インタビュー（二次引用含む） | 中 / 要約 |
| 43 | Game Developer「The Walking Dead and the art of providing no good choice」(2013)／Telltale 古典ポストモーテム／Giant Bomb「Faces of Death」 | https://www.gamedeveloper.com/design/-i-the-walking-dead-i-and-the-art-of-providing-no-good-choice | 開発者記事 | 中〜高 / 要約 |
| 44 | 電ファミ『P5X』インタビュー（日付カレンダー廃止、朝・昼・夜は維持）／4Gamer 橋野桂氏登壇記事 | https://news.denfaminicogamer.jp/interview/241009p/2 , https://www.4gamer.net/games/272/G027222/20261006012 | 開発者インタビュー（日本語） | 中 / 要約 |
| 45 | Kreminski「Loose Ends」（並行プロット糸の管理、AIIDE）／学位論文「Narrative Instruments」 | https://ojs.aaai.org/index.php/AIIDE/article/download/21955/21724/26007 | 学会論文 | 高 / 要約（内容未読） |

**未入手・確認できなかったもの**（後述 §9）: Ben Kuchera の記事、Telltale 開発者の GDC 講演本文、Heavy Rain の実フローチャート。（Persona・Disco Elysium は追補で二次的に補った）

---

## 2. 観点(1) 分岐構造の型・長所短所・工数

### 2.1 型の一覧（Ashwell の分類 [5] と Short [1][2]）
| 型 | 概要 | 長所 | 短所・工数 |
|---|---|---|---|
| タイムケーブ | 選択ごとに枝分かれ、ほぼ合流しない [5] | 自由度・再プレイ [5] | 書く量が爆発、大半のプレイヤーが見逃す [5] |
| ガントレット | 一本道＋脇道（死亡・即復帰）[5] | 最も作りやすく重要場面は全員が見る [5] | 制約感、脇道の見せ方が重要 [5] |
| **ブランチ＆ボトルネック** | 枝が共有イベントで再合流 [5] | 成長感・個別化と物語の管理しやすさの両立。状態追跡に強く依存、**初回プレイは似た体験になりがち** [5] | 当ゲームの現状はこれ（＋合流が早すぎる） |
| クエスト型 | 独立クラスタが少数の結末へ [5] | 探索・世界の一貫性。状態追跡必須、断片的になりやすい [5] | 最小規模が大きい [5] |
| ソーティングハット | 序盤で大分岐→ほぼ線形の複数本線 [5] | 深さと幅の両立。作者は実質複数本を書く [5] | 序盤の状態追跡が重い、分岐を明示しないと「結局合流」と思われる [5] |
| 浮遊モジュール（＝QBN/storylet系） | 中心の幹がなく状態・乱数で出会いが解放 [5] | 反応性が高く追加が容易 [1][2][5] | 素材が少ないと一本化して見える。書くのが難しい [5] |
| ループ＆グロウ | 同じ幹を繰り返し、状態で選択肢が増減 [5] | 安定した世界と推進力 [5] | 繰り返しの理由づけが必要 [5] |
| 遅延分岐（delayed branching） | 選択は即座に分岐せず、数値/フラグとして蓄積し後の判定を左右 [6][7] | 工数は低め。ただし**毎章が状態を変え、後で必ず読む**ことが条件 [6] | 昔の選択で後に理不尽に弾かれると不満が出る [7] |

### 2.2 状態ベース（QBN / storylet）
- [事実] Storylet は「内容・出現条件(prerequisite)・実行後の世界状態への効果」からなる小単位で、「単純・原子的・堅牢・再結合可能」と評される [2]。Failbetter の QBN は、数値の "quality" で storylet を解放する方式 [1][3]。
- [事実] 利点：任意順の入手物が「4つの storylet＋条件」で済み、木の順列爆発を避けられる／後から追加しても他を壊しにくい／過去内容への callback が安い [1]。
- [事実] 弱点：素材が少ないうちは薄く見える／大量だとプレイヤーが圧倒される／物語の背骨は進行 quality を手作業で管理 [1][3]。立ち上がりが遅い（動くまで多数必要）[3]。
- [事実] Salience 型（Left 4 Dead、Firewatch の台詞選択など）は「いま最も当てはまる素材をシステムが選ぶ」。既定素材から始めて特殊素材を足せるが、意図しないドラマ順序の組立や重みの手調整が課題 [1]。Yarn Spinner の Node Group は条件で候補を絞り、既定では「条件が最も具体的なもの」を選ぶ（`when: always` を保険に置く）[11]。
- [事実] 80 Days / Sunless Sea は都市・島ごとの自己完結した小話をモジュールとして増やす構成。「いつでも出荷可能」な状態を保て、外部ライターに島単位で任せられ、削っても目立たない。一方で個々の感情の強さは弱くなり、順序は制御できない。80 Days は旅の進行（金と時間の減少）で第三幕感を作る [8]。
- [事実] ink は knot/stitch/tunnel/thread、LIST（フラグ・状態機械・属性）を持つ。ネスト条件で「前の選択を後で読む」記述を軽くするための言語 [10]。
- [推測] 当ゲームの「章＝一本線のハブ＋業務」構造は storylet と相性が良い。ハブ（`hub`）の `interactions` がすでに「条件付きで解放される小単位」であり、ここを章間に拡張するのが最小の移行。

### 2.3 時間・ループ・視点切替
- [事実] 『428』はザッピング（複数主人公の同時進行）で、他人の選択が自分の結果を変える [31]。イシイジロウ氏は「他人分岐」（自分でなく他人を動かして分岐）、「提灯分岐」（自分の結果は変わらないが他人の運命が変わる）を紹介 [32]。成立のために場所マップ・移動時間・各人物の時刻ごとの行動表を先に作る必要がある [32]。
- [事実] 『かまいたちの夜』はピラミッド型フローチャートで因果を保つ、ループでは冒頭グッドエンド→死を重ねて情報を集める [32]。講演は「頭でシミュレーションするより、実際に作りながら検証する」ことを強調 [32]。
- [事実] Beyond: Two Souls の時系列シャッフルは「短編集」として肯定する批評と、緊迫感と関係性の積み上げを損なうとする批評に割れる [41]。[推測] 時間分岐は「同じ出来事を別人物の視点で見る」形（428型）が低リスク、時系列崩しは関係の発達を扱う当ゲームには不向き。

---

## 3. 観点(2) 「見かけの選択」を避けつつ工数を抑える手法

- **何を変えるか**: Telltale 型は「筋は変えず、人物の反応と記憶を変える」。TWD は主要な生死分岐でも結末はほぼ固定だが、生存者が**あなたの行動を覚えていて**評価が変わる、という個人的な結果に集中している [12][13]。Den of Geek の批判は、大きな選択が世界を変えないとき落胆が生じる点 [14]。[事実] 「意図に責任を感じさせる」設計で、大規模スクリプトの分岐コストを避けている [12]。
- **局所分岐＋大域は固定**: Heavy Rain は章内で分岐し、大域は固定。章の結果をグローバル変数に記録し、**死んだ人物の登場章を丸ごと削除**、最終章の登場者を変え、18種のエピローグを状態から選ぶ。少ない追加素材で多数の結末に見える [15]。
- **反応の差分（reactivity by delta）**: 同じ場面に条件付きの台詞・一人の不在・一行の変化を足す。Firewatch は「物語に影響しないが多くの分岐と微妙な反応」を狙い、「選ばない（沈黙）」も色づけとして機能させた [25]。
- **後効き（遅延）**: 選択は数値/フラグに蓄積し、数章後の判定・場面で効く [6][7]。Short は終盤に「これまでの選択に合わせて結果を仕立てる」場面を、選択への見返りとみなす [7]。
- **ルートの人物構成の違い**: ソーティングハット [5]、Heavy Rain の章削除 [15]、Until Dawn の「蝶の効果」（小さな選択が人物の性格・生死に波及）[17]。ただし Until Dawn の脚本は10,000頁級と言われ、「見られない素材への投資」が課題とされる [17]（頁数は報道ベース。[推測] 当方は真似できない規模）。
- **選択肢を絞る**: Pentiment は能力値や数値を避け、小さな波紋を数十年にわたって積む方針、反応性の保守コストを意識し全選択を物語全体の分岐に結びつけない [29]。
- **「結末が選択と連動しない」の許容**: Life is Strange 開発者は結末が逐一の選択と結びつかないことを認めつつ、長期的な結果（続編）や「正解がない」感覚を狙った [18]。[推測] 見かけの選択でも、感情的に「正しくなかったかも」と思わせれば機能する。重要なのは**選択後 1〜2 場面のうちに、他者の反応が観測できる**こと。
- **工数の目安（推測）**: 追加コスト＝ Σ（選択肢×その後の固有場面）。固有場面を「全員が見る幹の場面の差分」（一行〜数行）で作ると 1/5〜1/10、完全に別場面だと 1 本。当ゲームでは「差分で作る＞固有場面1つ＞章単位の別本線」の順に使い分ける。

---

## 4. 観点(3) ジレンマの作り方

- [事実] Papers, Please は、規則・家族の生活費・時間制限（制約）を重ねて「どれを選んでも何かを失う」状況を作る。結果が実は穏やかでも、「国家に見られている」圧力と数値の板挟みで道徳選択が強まる、という分析 [19]。Pope 自身は判断を押し付けない曖昧さを狙った [19]。
- [事実] TWD の主要選択は「誰を救うか」のように**対称（どちらも損）**で、時間制限と、台詞を選ばない沈黙（"…" で無反応）も含む [12][25]。Firewatch は時間制限付き台詞の無回答が性格づけになる [25]。Oxenfree は相手の台詞を**遮る**/遮らない/黙る、が選択で、会話を自然にする [24]。
- [事実] Telltale 自身が TWD のポストモーテムで「良い選択肢がない（No Good Choice）」を新機能として挙げ、難しい選択の間隔（次の重い選択までどれだけ空けられるか）を意識したと述べる [43]。
- [事実] Life is Strange 2 開発者は「罰されたと感じさせない、影響の大きい決定」の設計を課題に挙げる [18]。
- **非暴力の職業ドラマ向けジレンマの型（推測・当方の整理）**
  1. 安全 vs 定時（止める判断／運行を保つ判断）
  2. 同僚・後輩の失敗を報告する vs 庇う（透明性 vs 信頼）
  3. 師匠・指導役への忠誠 vs 自分の異動/キャリア
  4. 利用者への個別の配慮 vs 規程・公平性
  5. 確定情報だけを言う vs 見込みを伝える（指令・放送）
  6. 沈黙：言うべきか迷う間に時間切れ（既存の `timeLimit`＋`defaultOption` が使える）
  - 設計の要点: 得と損を**両側に持たせ**、「正解は誰かの顔色」ではなく**誰を失うか**が見えるようにする。選択肢ラベルに結果の暗示（`hint`）は出さず、人物の事情を先に見せる。

---

## 5. 観点(4) 他作品の分析（分岐の作り／心理効果）

| 作品 | 分岐の作り | プレイヤー心理への効果 | 出典 |
|---|---|---|---|
| Heavy Rain | 章内分岐＋固定大域。結果を状態に記録し章削除・エピローグ選択。ゲームオーバーなしで死が確定 | 「死は死」という重み。隠れた分岐は後に反省され、Detroit でフローチャート表示に | [15][16] |
| Beyond: Two Souls | 時系列をシャッフルした短編連作 | 賛否。関係の積み上がりと緊迫感の損失という批判 | [41] |
| Until Dawn | 「蝶の効果」。小さな選択が人物の性格・生死に波及。再ロード不可の視点移動 | 結果が追跡され責任を感じる。素材の大半は未見のまま（コスト） | [17] |
| Life is Strange | 時間巻き戻しを短期結果に限定。結末は逐一の選択に連動しない | 逃げられない感・「正解がない」感 | [18] |
| The Walking Dead | 局所選択・固定本線。人物が覚えている／評価が変わる | 意図への責任感、関係の変化 | [12][13][14] |
| Disco Elysium | スキル判定の失敗が物語を進める。人格内の声が分岐を担う | 失敗が楽しい、再ロード不要感。一方、単一スキル必須の判定は不満（ボトルネック） | [20][21] |
| Papers, Please | ジレンマ＝規則×生活費×時間。結果は穏やかでも圧力が強い | 倫理的な疲労、板挟み | [19] |
| Her Story | 検索で断片の順序を自由に。物語はプレイヤーの想像が組む | 能動的な再構成 | [27] |
| Firewatch | 時間制限付き台詞（沈黙も選択）。反応は微細、筋は不変 | 自己投影・関係の一貫性 | [25] |
| Oxenfree | リアルタイム会話、割り込み・沈黙 | 会話の自然さ、言わなかったことの余韻 | [24] |
| Night in the Woods | 本線はほぼ固定。会話の反復と小さな変化で関係が深まる | 日常の積み重ね（※本文未読の要約） | [26] |
| Return of the Obra Dinn | 分岐でなく**推理の構造**（60人の運命を埋める）。手帳を後から追加 | 手がかりが見落とされやすく難しすぎた（本人談） | [28] |
| 428 | ザッピング。他人の選択が自分に波及、「未来が保持されるフローチャート」 | 他人の運命に責任を持つ | [31][32] |
| STEINS;GATE | 携帯トリガー（返信・着信）で分岐。ギミックを物語の中心に | 「どの行為が分岐か」を作中の仕組みにする | [33] |
| 逆転裁判 | 論理的謎解き（本格ミステリ）。分岐は少なく、矛盾の指摘が山場 | 推理の快感、論理構築 | [34] |
| Danganronpa | 調査→学級裁判（討論・反論）。一本の筋に探索が資源として繋がる | 調査した証拠が議論で武器になる | [30] |
| ペルソナ | 日程（カレンダー）と絆（Social Link）の時間配分 | 全部は取れない緊張。「完璧な周回」の存在 | [35] |
| Pentiment | 小さな選択の波紋を長期に積む。数値を避ける | 時代の流れと個人の責任 | [29] |
| Citizen Sleeper | 毎日振るダイスの制限、「代償付き成功」、時計（クロック）、身体の欠乏 | 限られた日数で優先順位を迫られる | [23] |

---

## 6. 観点(5) 人物の関係性システム

- [事実] Mass Effect 系は approval/loyalty。Andromeda は二値でなく「気質（temperament）」で関係を表し、ロマンスと長期の関係の弧を切り離し、「全部の忠誠ミッションを完遂していないことで責めない」方向に調整した [36]。
- [事実] TWD は数値でなく**記憶**（誰が何を見たか）で関係が動く [12]。Persona は絆（Social Link）の段階を時間投資で進め、全部は上げ切れない [35]。
- [推測・設計原則]
  1. 数値（trust/rapport）だけでなく**記憶タグ**（"かばってくれた"、"報告を怠った"）を人物ごとに持つ。台詞が数値でなくタグを読む。
  2. 関係に**段階（stage）**を持たせる：知人→同僚→信頼→（決裂／離脱）。段階が上がる／壊れる**瞬間を場面にする**。
  3. 弧（アーク）は3〜4拍の固定ビート（出会い／頼られる／試される／分岐）として章に配置し、**ビート到達の条件を関係値＋記憶で判定**。条件を満たさなければ別ビート（失われた関係の場面）へ。
  4. 離脱・決裂の可能性を**必ず**用意する。さもないと関係値は「蓄積するだけの点」になる。

---

## 7. 観点(6) 時間経過・カレンダー・締切

- [事実] Persona は1日を時間帯に区切り、行動数に上限を設けて、社会関係・探索・締切(ダンジョン期限)の取捨選択を強いる。「全部はできない」ように作られている [35]。ただし Phantom X は固定日付をやめ、プレイヤーごとの日付のずれを避けた [35]。Metaphor の議論にも「機会損失への不安を和らげる」方向の調整がある [35]。電ファミのP5X記事は、運営型で期限のストレスを避けるため日付制を外したが朝・昼・夜は残したと述べ、橋野氏は元々ジュブナイル物語の構造（閉じた共同体・季節の経過）を重視したと語る [44]。
- [事実] Citizen Sleeper は日の始めに振ったダイスが1日の「できること」の上限を示し、時計と欠乏が圧力を作る [23]。80 Days は金と時間の減少が終盤の緊張を作る [8]。
- [推測] 当ゲームには `clock.day/minute` と hub の `timed`（日内イベント）があるが、**週・月単位の締切／時間割り当て**がない。「今週の二つのうち一つしか行けない」が、取り返しのつかない変化の自然な供給源になる（§10）。

---

## 8. 観点(7)(8) 失敗しても進む設計／分岐の検証

### 8.1 Fail forward
- [事実] Disco Elysium の白判定（能動）は、失敗後、該当技能に1点振れば再挑戦でき、黒判定（受動）は裏で働き、赤判定（高リスク）は結果を受け入れて進む。作者は「間違いを罰して内容を閉ざさない」意図とされる [42]（二次引用）。[推測] 「再挑戦に資源が要る」設計は、当ゲームの業務ミニゲーム再挑戦を『資格・研修の進捗』と結びつける案に使える。
- [事実] 失敗が物語を止めず別の道を開く原則。Blades in the Dark の三段階（失敗／代償付き成功／完全成功）が典型 [22]。Disco Elysium は失敗が人物形成に繋がる一方、単一判定のボトルネックは不満の的 [20][21]。
- [事実] 再ロードで消せる「BAD END」はリスクの意味を壊す。失敗は成功と同程度に面白くする、リスクを知って受けた場合のみ重い結果を与える、という指針 [21]。Heavy Rain はゲームオーバーを置かず失敗後も進む [16]。
- [推測] 当ゲームの `task.results[{min, goto, effects}]` は既にこれに適した形。最下位の閾値でも**進行を続け、代償（記録・関係・評価）を残す**。

### 8.2 検証手法
- [事実] Twine を有向グラフにして DFS し、到達不能（lost plot）・行き止まりを検出する Story Validator [37]。ChoiceScript は quicktest/randomtest を持つ。Twine は標準にない [40]。
- [事実] 状態爆発対策：全組合せでなく**辺（edge）カバレッジ＋変数の区間分割**、深い探索は夜間実行 [38]（実務ブログ、低信頼）。
- [事実] DendryScope は記号解析で作者向けの支援をする研究 [39]（詳細未読）。
- [事実] Obra Dinn の作者は、プレイテストが難しい構造だったと述べる [28]。[推測] 分岐の多い作品ほど、人手の通しでは見落とすので自動化が要る。
- [事実] 当リポジトリの `src/engine/storyLint.ts` は未定義遷移・到達不能ノード・**読まれるが設定されない**フラグ・人物ID・timeLimit/defaultOption を検査する（実読）。

---

## 9. 調べきれなかった点
- Ben Kuchera 氏の記事は特定できなかった（検索で該当なし）。
- Telltale 開発者自身の GDC 講演本文、Heavy Rain の実フローチャートは入手できなかった。Disco Elysium の発言は二次引用のみ、Persona の設計意図も日本語記事の要約のみ（本文未精読）。
- Kreminski の長期弧（Loose Ends）[45] は存在を確認しただけで、storylet に長期弧を載せる具体手法は未調査（当ゲームの章またぎ弧に直結するため、次に最優先で読む価値あり）。
- 「ボトルネックの最適間隔」「遅延の最適距離」を実証した公開研究は見つからなかった。本書の閾値（N=4、固有2場面、差分率25%）はすべて当方の初期値案（推測）で、実測で調整が要る。
- 検索要約のみで本文を読んでいない出典が多い（一覧の「取得」欄参照）。数値（頁数・結末数）は報道ベースで未検証。
- Ink/Yarn の公式ドキュメントは機能の要約のみ。当ゲームへの移植可否（TypeScript ランタイムとの相性）は未検討。
- Obra Dinn の「分岐ではなく推理構造」は当ゲームへの直接の応用が薄いため深追いしていない。
- Danganronpa / 逆転裁判 は構造の要約止まりで、脚本設計の一次資料は見つからなかった。

---

## 10. 自作ゲームへの適用案

### 10.0 現状の診断（コード実読に基づく）
- データ形式：`line / choice / branch / effect / hub / task / end`、Cond（flag, rel, eval, var, chose, visited, done…）、Effect（set, rel, eval, var, log, timeline…）、`world.story.echoes`、`ChapterResult.flags/relDelta/nextVariants` が既にある（`src/engine/types.ts`）。
- 症状：(a) 選択が `set(flag)` を立てるだけで**読む側がない**（lint は「読まれるが設定されない」しか検出しない）。(b) 選択の `goto` が直後の1〜数ノードで同じ `ch1.p2` に合流する（`ch1.p_r_station` → `ch1.p2`）。(c) 評価点（eval）が主な結果で、**世界が変わらない**。
- [推測] 原因は「ブランチ＆ボトルネックで、ボトルネックの間隔が短すぎ、かつ状態を読む箇所が章末ハブ（`closing`）に偏っている」こと [5]。

### 10.1 原則（5つ）
1. **全選択は「読み手」を宣言する**（payoff 義務）。読む場所が無い選択は選択肢にしない／ラベルを変える。
2. **合流は許す、ただし「合流する前に固有場面を1つ」**。合流点の間隔は最短でも「固有場面1つ＋反応差分」。
3. **取り返しのつかない変化を、章ごとに最低1つ**（§10.4）。
4. **失敗は進める。代償を残す**（§10.6）。
5. **評価点を結果の主役にしない**。評価は裏で貯め、表では「誰が何を言ったか・何が変わったか」を見せる。

### 10.2 Storylet 型への移行（最小版）
既存の `hub.interactions` は「条件付きで解放される小単位」なので、これを**章をまたぐ場面プール**に一般化する。

```ts
// 追加: 新ノード種別 'pool'（storyRunner に 1 ケース追加）
interface PoolNode extends Base {
  type: 'pool';
  slot: string;                 // 例 'wk3.midweek'（同じ slot の候補から選ぶ）
  picks: number;                // その回に提示 or 自動選択する数
  mode: 'auto' | 'menu';        // auto=最も具体的な条件を満たすものを自動、menu=プレイヤーが選ぶ
  candidates: {
    goto: string;               // 実体は既存の line/choice ノード
    when?: Cond;                // 前提（qualityに相当）
    once?: boolean;             // 一度きり
    weight?: number;            // 同点時の重み（seed固定乱数）
    cooldown?: { days: number };// 連続を避ける
    arc?: string;               // 弧ID（§10.5）。同じ弧は1日1つまで等の制約に使う
  }[];
  fallback: string;             // 該当ゼロのときの保険（Yarnの `when: always` に相当）[11]
  next: string;                 // プール消化後の次ノード
}
```
- 選択方式 `auto` は「条件の数が多いものを優先」（Yarn の best に近い）[11]。`menu` は Fallen London 型で、プレイヤーが優先順位を決める [1]。
- 追加するのは**エンジン 1 ケース＋型 1つ**。既存ノードはそのまま候補になれる。
- 章の幹は `end` 直前のボトルネック1か所だけ残し、**章の中盤は pool**にする（ボトルネック間隔が伸びる）。
- 質（quality）は既存 `vars` に命名規則で入れる：`arc.mentor`（0–5）、`pressure.safety`、`debt.shiraishi` など。**進行 quality と menace（緊張）を別に持つ**のは Short の指針 [2]。

### 10.3 各章の「ルート固有の場面」を増やす方法
ルートは現状 `route.service / route.platform / legacy.wish_*` など。次の**3層ルール**を章設計の必須にする：

| 層 | 内容 | 量の目安（推測） |
|---|---|---|
| 幹 | 全員が見る場面（章のボトルネック） | 章の 50〜60% |
| 差分 | 同じ場面で台詞・在席者・結果が変わる（`Line.when`、人物 `visibleWhen`） | 章の 20〜30%。工数は小 |
| ルート固有 | そのルート/関係でしか見ない場面（pool 候補、`when` 付き） | 1章あたり **最低 2 場面**（最大 3 ルートなら 2×3=6、実際は共有分があり 4〜5） |

- **ルール**: 章の完了ごとに「ルート間で見たノード集合の差」を計測（§10.7）。差が閾値未満なら章を差し戻す。
- **データ追加**: `Line.when?: Cond`（行単位の条件）、`LineNode.variants?: {when: Cond; lines: Line[]}[]`（先頭一致で差し替え）。1 場面を複製せずに「反応の差分」を作れる [12][25]。
- **人物構成の違い**: 異動・研修先・シフトで同席者が変わる。`CharacterDef.visibleWhen`（既存）を章末状態ごとに配置。Heavy Rain の「死んだ人物の章は丸ごと削除」と同じ原理で、**決裂した人物の章内の出番を `visibleWhen` で消す** [15]。

### 10.4 取り返しのつかない変化の候補（非暴力の職業ドラマ）
各項目は「Effect で恒久フラグ＋Cond で読む」形にする。`lock:` は §10.8 の新Effect。

1. **異動の確定／不成立**：申請（`apply`）が `approved/rejected/deferred`（既存 `applications`）。却下された希望は**その期は再申請不可**（`lock:'apply.depot.y1'`）。異動すると旧部署の師弟関係が段階低下。
2. **離職・退場する同僚**：後輩/同期が辞める。直前に断った相談・見て見ぬふりの記憶タグが理由として別の場面で明かされる（遅延）。
3. **師弟関係の決裂**：指導役と衝突し、以後その人物から**手順の教えを受けられない**（学べる訓練 `training` が1本消える）。和解の道は 1 回だけ。
4. **信頼の喪失**：隠した報告が後で露見し、特定人物（駅長・指令）が「確認を求める」口調に変わり、自由裁量の業務が減る。
5. **事故・インシデント報告の結果**：報告の書き方（正直／曖昧／責任転嫁）が、数章後の**再発防止会議・監査**の席での扱いを決める（`ch2.audit` のような読み手を実在させる）。
6. **利用者との関係**：常連（梶原さん等）の最後の来駅。助けた/見過ごした記憶が数章後の別の人物の言葉で返る。
7. **資格の取りこぼし**：研修日程が重なり、片方の試験を受けられない（カレンダー締切：§10.9）。
8. **希望の公言**：面談で言った希望（`legacy.wish_*`）が、後で他者から**責任として指摘**される（言ったことは残る）。

### 10.5 関係性システムの拡張（既存 `rel` を壊さず足す）
```ts
interface Relationship { trust:number; rapport:number; met:boolean; notes:string[];
  stage?: 'stranger'|'colleague'|'trusted'|'strained'|'estranged'|'gone'; // 追加
  memory?: { tag: string; day: number; node: string }[];                    // 追加
  arcBeat?: number;                                                         // 追加: 進んだ弧の拍
}
// Effect 追加
{ remember: { char: string; tag: string } }       // 記憶タグを刻む
{ stage: { char: string; to: Stage } }            // 段階を明示変更（決裂・離脱の瞬間）
{ arc: { id: string; beat: number } }             // 弧の拍を進める
// Cond 追加
{ remembers: { char: string; tag: string } }
{ stage: { char: string; is: Stage | Stage[] } }
{ arcAt: { id: string; beat: number; op: Op } }
```
- 弧は 3〜4 拍（出会い／頼られる／試される／分岐）。**試される拍で「決裂／離脱／継続」の3結果**を必ず用意（§6）。
- 台詞は `Line.when: {remembers:{char:'kubota',tag:'covered_my_error'}}` で記憶を拾う。**数値より記憶を読む**のが TWD 方式 [12]。

### 10.6 Fail forward の組み込み
- `task.results` を 3 段（良／代償付き／失敗）に統一。**失敗でも進む**。失敗の `effects` には必ず `remember` か `timeline`（年表・ログ）か 恒久 `set` を含め、評価点だけの減点にしない。
- 時間切れ `timeLimit` の `defaultOption`（既存）を**「何も言わない」**にする設計を標準化 [25][24]。沈黙の結果も `remember` で残す。
- 選択肢が条件で消えるとき、**灰色表示で理由を出す**（`ChoiceOption.lockedLabel?: string`）。「その道は閉じた」ことを可視化するほうが、「何も起きない」より重く感じさせる [5]（[推測]）。

### 10.7 遅延した結果の置き方
```ts
// Effect 追加: 予約イベント
{ schedule: { inDays?: number; inChapters?: number; goto: string; when?: Cond; id: string } }
// WorldState 追加
pending: { id: string; dueDay?: number; dueChapter?: string; goto: string; when?: Cond }[]
```
- `schedule` は章末/日替わり時に評価され、`when` を満たせば次のハブの `timed` 風に差し込まれる。満たされなければ**静かに失効（失効も記録）**。
- 推奨遅延: **短（同章内、反応）／中（次章冒頭、人物の一言）／長（3〜4章後、監査・面談・異動辞令）**の3段を、章あたり 1〜2 本。
- 長い遅延は「理不尽な裏切り」にならないよう、**選択時に原因が観測できる**（その場で相手の表情・メモ・ログの一行）ことを要件にする [7]。
- 既存 `world.story.echoes` を「このフラグが後で読まれた」記録として拡張し、**章末サマリで「あなたの選択が、これを変えた」を表示**する（Detroit のフローチャート的効果。Cage 自身が隠すのは良くなかったと述べる [16]）。

### 10.8 評価点中心からの脱却
- `eval` は内部資源として残し、表示は「評価面談の言葉（定性）」へ。点数が見える場所は章末の1か所のみ。
- 新 Effect `{ lock: string }` / Cond `{ locked: string }`：恒久的に閉じる選択肢・ハブ項目・訓練の管理（`requires: {not:{locked:'apply.depot.y1'}}`）。
- 章末 `ChapterResult` に `lost: string[]`（失ったもの：関係・資格・機会）を足し、**得点より「失ったもの」を主表示**。

### 10.9 カレンダー／締切
- 既存 `clock.day` を週ブロックに拡張し、`budget: { week: n, slots: [...] }`（Persona の時間割）：**1週間に2〜3枠**、研修・会食・見学会・資格試験・師匠との面談から選ぶ [35]。
- `deadline: { id, day, goto }` を `chapter` に付ける（例：試験日、異動希望の提出日、指令訓練）。期限超過は fail-forward 分岐（不受験→次期まで資格なし）。
- Citizen Sleeper 的「日の上限」[23] を各日の `hub` に導入するのは、業務ミニゲーム数が多い当ゲームでは過負荷になる。[推測] **週単位の枠**（日内は現状維持）が妥当。

### 10.10 検証手法の追加（`storyLint.ts` / テストへ）
| 検査 | 内容 | 狙い |
|---|---|---|
| **死んだフラグ** | `set` されるが一度も `Cond` で読まれないフラグ（`log/eval` だけで終わる選択を含む）を **error** | 「立てるが読まれない」の直接対策。現 lint は逆方向のみ |
| **payoff 宣言** | `ChoiceOption.payoff?: string`（読み手ノードID）を必須化し、読み手が存在かつ到達可能か検査 | 原則1 |
| **合流距離** | 各 choice から、全 option の goto 先が最初に同一ノードへ合流するまでの最短ノード数。N（既定 4）未満を warn | 即合流の可視化 [5] |
| **ルート差分率** | 章ごとに、代表ルート集合（志望×性格×関係）を深さ優先で走らせ、見たノード集合の Jaccard 距離を算出。閾値（例 ≥ 25%）未満で warn | §10.3 の受入基準 |
| **章末署名の多様性** | `ChapterResult.flags/relDelta` のハッシュ種類数。1 種に潰れる章を warn | ボトルネック過多の検出 |
| **到達性（状態込み）** | 変数を区間に丸めた抽象状態で BFS（辺カバレッジ）。全 `end` 到達、全 pool 候補が少なくとも1経路で到達、`fallback` で行き止まりがない | 状態爆発対策 [38][37] |
| **ランダム通し** | seed 固定で 1,000 通りの乱数プレイ。ノード到達率、フラグ/記憶タグの読まれ率、結末分布を JSON に出力 | ChoiceScript randomtest 相当 [40] |
| **sched 失効監査** | `schedule` が常に失効するプレイが 95% 超なら warn（読まれない予約） | §10.7 |
| **台帳連携** | 結果を `docs/QA_REPORT.md` に PASS/FAIL/UNVERIFIED で記載 | CLAUDE.md の規定 |

- 実装順（推測・工数小→大）: 死んだフラグ → 合流距離 → payoff 宣言 → ランダム通し → ルート差分率 → 抽象状態 BFS。

### 10.11 段階的な導入計画（提案）
1. **P0（コード小・即効）**: lint に「死んだフラグ」「合流距離」を追加し、現状の R7 第1章の悪さを数値化（ベースライン）。
2. **P1**: `Line.when` / `LineNode.variants`、`remember` Effect、`Cond.remembers` を追加。第1章の既存選択に**反応の差分**を付ける（`ch1.p_r_*` → 面談の後も森下の言葉が変わる、等）。
3. **P2**: `lock` / `schedule` を追加。章ごとに「取り返しのつかない変化」を最低1つ＋遅延の読み手を実装（§10.4）。
4. **P3**: `pool` ノードと週枠カレンダーを導入。第2章以降を storylet 化（ハブの中盤）。
5. **P4**: ルート差分率・ランダム通しを CI（`npm run check`）に組み込み、章の受入基準に追加。

### 10.12 リスクと留意（推測）
- storylet は**素材が少ない間は薄く見える**ので [1][3]、第2章を丸ごと移行するより、まず「章の中盤だけ」を pool にする。
- 遅延結果は**因果が見えないと理不尽**になる [7]。ログ・年表・手帳での可視化を併用。
- ルート固有場面は工数が最も大きい。差分（`variants`）で稼ぎ、固有場面は**関係の山場と異動の山場に集中**させる。
- 12 作品×1,152 章の目標に対し、全章で上記を守るなら、**台帳（TASKS.md）に「章ごとの固有場面数・遅延読み手数・取り返しのつかない変化」の列を追加**するのが現実的。
