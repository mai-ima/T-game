# 第2〜3章 書き直しの引き継ぎ（後の章が読むフラグ一覧）

対象：`scripts/story/ch2.mjs` `scripts/story/ch3.mjs`。設計原則は `docs/DESIGN_PRINCIPLES.md`。
読み方：flag は `{flag:'…'}`、退場は `{gone:'id'}`、閉鎖は `{locked:'id'}`、関係値は `{rel:{char,key:'trust'|'rapport',op,val}}`。

## 取り返しのつかない変化
| 種別 | id | 発生 | 意味 | 後の章での使い方（案） |
|---|---|---|---|---|
| depart | `gone.uno` | 第2章 午後、券売機の前で宇野さんを窓口に回す／何も言わない | 宇野さん（券売機の常連）が駅の券売機を使わなくなる | 第5章の券売機不具合・お客様の声の場面で「あの月曜の人」が不在であることを言及。`{gone:'uno'}` と `ch2.uno_helped` で分岐 |
| depart | `gone.tsumura` | 第3章 末（全経路） | 津村さんは4/19を最後に始発に乗らなくなる | 第4章以降の「五時五十二分」の空席。坂井・杉浦の台詞。絵はがき等で再登場させるなら `ch3.ts_told` で内容を変える |
| lock | `locked.sugiura_goodbye` | 津村の最後の朝を杉浦に伝えなかった（`ts_kept` `ts_silent`）／会えなかった | 杉浦は津村に別れを言えなかった | 杉浦の退職式（3月）で「津村さんへの手紙」が出せない。伝えた場合は缶が残る |
| lock | `locked.sugiura_key` | 第3章 杉浦の後継者の話を断る（`ch3.successor_no`） | 杉浦の鍵束を預かる道が閉じる | 杉浦の後任に別の人物が立つ。引継ぎ式で主人公は見送る側 |
| lock | `locked.late_shift_pref` | 後継者の話を引き受ける（`ch3.successor_yes`） | 早番の後任候補。遅番や他部署の希望が通りにくい | 第6章の面談・異動希望で `{locked:'late_shift_pref'}` を読んで選択肢を絞る |
| lock | `locked.slot_service` / `slot_accuracy` / `slot_team` | 第2章 来週の研修枠（一つだけ） | 選ばなかった稽古は今期は戻らない | 該当稽古を前提にする業務で、主人公が不足する場面 |

## 第2章が立てるフラグ
- 券売機の扱い：`ch2.idea_consult` / `ch2.idea_selfpost` / `ch2.idea_boss`（駅長へ直訴）/ `ch2.idea_skip`。既存互換：前3つ＋skip は従来どおり。
- 提案書：`ch2.proposal_good`（出来が良い）、`ch2.proposal_sent`（本社へ回った）、`ch2.proposal_fast`（お客様の声ノートを済ませていた＝承認が1週間）。第3章冒頭の杉浦の台詞が読む。
- 貼り紙の後始末（selfpost のみ）：`ch2.owned_up`（駅長に名乗り出た）/ `ch2.repaired`（払い戻しの客に電話）/ `ch2.defended`（結果を主張）/ `ch2.kubota_covered`（黙った＝久保田が一人で持った）。
- 直訴の余波：`ch2.kubota_hurt`。
- 宇野さん：`ch2.uno_helped`（付き添った）/ `ch2.uno_left`（去った）。
- 昼：`ch2.lunch_kubota` `ch2.lunch_yamashina` `ch2.shiraishi_motto`（駅長と）`ch2.lunch_alone`（時間切れ＝一人）。`ch2.yama_confided`（山科が推薦枠の話をした）。
- 夕方：`ch2.yama_will_call`（山科が電話するかもと言った。rapport≥3）、`ch2.knows_key_story`（駅長が杉浦は鍵を預けたことがないと話した。trust≥3）。
- 研修枠：`next.focus_service` / `next.focus_accuracy` / `next.focus_team`（第3章 `ch3.focus` が読む。accuracy は `ch3.drilled`、team は `ch3.has_buddy`、service は `ch3.svc_ready` を立てる）。
- 捨てた依頼：`ch2.patrol_done` `ch2.coins_done` `ch2.guide_done` の未達（NF）を夕方（`ch2.out`）が読む（久保田・坂井の rel が下がる。坂井の rel は第3章で読まれる）。`ch2.voice_done` は提案の承認速度（`ch2.proposal_fast`）を決める。

## 第3章が立てるフラグ
- 前夜（山科の着信、時限）：`ch3.helped_yama`（志望書を手伝った）/ `ch3.slept_well`（出ずに寝た）/ `ch3.drilled`（手順書の予習）/ `ch3.yama_unanswered`（時間切れ＝出られず眠れなかった）。第4章以降、山科の志望書・推薦枠の競争で読める。
- 津村（任意の挨拶に会えた場合のみ）：`ch3.ts_done`。杉浦の問いへの答え：`ch3.ts_told` / `ch3.ts_kept` / `ch3.ts_silent`（時間切れ）。会えなかった場合は `ch3.ts_late_known`（坂井から聞いた）か何も無し。
- 眠気（時限）：`ch3.honest`（杉浦に言った）/ `ch3.told_kubota`（久保田にだけ言った）/ `ch3.pushed`（続けた・コーヒー・時間切れ）。**`ch3.honest` と `ch3.pushed` は第4・7〜10章が既に読んでいる。意味は変えていない**。久保田にだけ言った場合はどちらも立たない（第4章は else 側へ）。
- 鍵：`ch3.got_key`（杉浦が更衣室の予備鍵を預けた。honest かつ杉浦 trust≥2）、`ch3.sugiura_story`（杉浦が25年前の誤放送を語った。押し通した場合のみ）。
- 後継者の話（時限）：`ch3.successor_yes` / `ch3.successor_wait` / `ch3.successor_no` / `ch3.successor_mute`（時間切れ）。**第4〜6章で杉浦を再登場させ、これを読むこと。3月に定年**。
- 持ち場：`route.*`（第1章由来）。`ch3.briefed` `ch3.first_done` `ch3.sleepy_done` `ch3.break_done` は章内の進行用。

## 関係値（rel）を読む箇所（第2章・第3章）
ch2：`ch2.brief_rel`（kubota trust≥3）／`ch2.pm_boss_b`（kubota trust≥3）／`ch2.ps_own_b`（shiraishi trust≥3）／`ch2.psk_walk_b`（kubota trust≥2）／`ch2.pm_skip_c` の option `ask`（kubota trust≥2）／`ch2.rv_rel`（shiraishi trust≥3）／`ch2.rv_tb`（yamashina rapport≥2）／`ch2.out5`（yamashina rapport≥3）。
ch3：`ch3.hn_key`（sugiura trust≥2）／`ch3.sleepy_choice` の option `kubota`（kubota trust≥3 または `ch3.has_buddy`）／`ch3.bf_dawn` の option `accept`（sugiura trust≥2）／`ch3.svc_sakai_b`（sakai rapport）。

## 時限選択（アクセシビリティ設定で解除可能。解除時は既定が起きないだけで、通常の選択として選べる）
ch2：`ch2.lunch_choice`（既定＝一人で食べる）／`ch2.pm_self_c`（既定＝何も言わない）／`ch2.pm_skip_c`（既定＝何も言わない＝宇野さんが去る）。
ch3：`ch3.eve_choice`（既定＝出られない）／`ch3.ts_choice`（既定＝何も言わない）／`ch3.sleepy_choice`（既定＝黙って続ける）／`ch3.bf_dawn`（既定＝答えない）。

## 未接続（第4章以降の担当へ）
- 杉浦・津村は第4章以降に未登場。`ch3.successor_*` `locked.sugiura_*` `gone.tsumura` を読む場面を作る。
- 宇野さんは `gone.uno` ／ `ch2.uno_helped` の再登場先が未定。
- `next.*`（`next.depot_seed` など第1章由来）は `scripts/build-story.mjs` 側で、読まれていない。
