# 第7〜10章 引継ぎフラグ一覧（第11章以降・他章が読める）

生成元：`scripts/story/ch7.mjs`〜`ch10.mjs`。`gone.X` / `locked.X` は `depart` / `lock` 効果が立てる恒久フラグ（条件 `{gone}` `{locked}`）。

## 人物ID
- `sawada` = 沢田 慎一（輸送計画課 課長補佐。第7・8章の計画ルート）
- `sawada_r` = 沢田 良平（車両基地 検修技術員。第9・10章の基地ルート）。旗 `ch9.rec_sawada_r`

## 第7章（夏の臨時列車）
- 判断（三択。どれか一つ）：`ch7.limited` / `ch7.flowed` / `ch7.hesitated`（沈黙・時間切れ）
- 夜の出来事：`ch7.inc_plaza` `ch7.inc_stairs` `ch7.haha_helped|relayed|slipped` `ch7.mizuki_helped|covered|frozen` `ch7.nomura_water` `ch7.ogawa_calmed|thanks|rule|hurry|unheard`
- 連携の選択：`ch7.guard_stairs|plaza` `ch7.shop_clear|water` `ch7.crew_announce|ops|left`
- 橘の秘密と眼鏡：`ch7.tachi_secret` `ch7.tachi_asked|covered|quiet`
- 関係値で開く話：`ch7.shiraishi_story`（去年の話）/ `ch7.shiraishi_closed`、`ch7.hama_invite`、`ch7.miz_confided`
- 非駅ルートの序盤の選択：`ch7.d_told_now|late|other` `ch7.x_called|noted|missed` `ch7.p_flagged|waited|missed`
- 記録：`ch7.note_proc|limit|care`、ひなた：`ch7.hinata_seed` `ch7.found_uchiwa`

## 第8章（ホームの声）
- 野村さん：`ch8.elder_helped|elder_late|elder_missed`、`ch8.nomura_gone`（`gone.nomura`）、`ch8.hat_left` `ch8.hat_story` `ch8.nomura_honored|stung`
- 橘：`ch8.tachi_told_nomura` `ch8.tachi_hat_promise` `ch8.tachi_stepped`
- 見学：`ch8.tour_done|tour_cut`、`locked.ch8.cab_visit`（`ch8.cab_locked`）
- ひなた：`ch8.hi_today|general|ask|honest|silent`、`ch8.uchiwa_back`、`ch8.school_invite`
- 決意：`ch8.vow_greet|note|wait`

## 第9章（はじめての評価）
- 面談の答え：`ch9.iv_argue|accept|fix|silent`（accept→`ch9.weekly_report`、fix→`ch9.weekend_gone`）、`ch9.polished`、評価：`ch9.rate_high|mid|low`
- 山科：`ch9.yama_real|soothe|silent`、匿名の声：`ch9.guess_ts|og|kj|none` / `ch9.slip_*` / `ch9.guess_right`
- 帽子：`ch9.hat_sent` / `ch9.hat_pending`、`ch9.nomura_gift`
- 推薦者：`ch9.rec_kubota|shiraishi|yamashina|tachibana|sawada_r|hamaguchi|minase|toda`

## 第10章（基地実習へ）
- 章末の選択：`ch10.stay` / `ch10.transfer` + `ch10.transfer_to_<station|depot|dispatch|planning>`、`locked.ch10.transfer_path`（残る）/ `locked.ch10.stay_deepen`（異動希望）
- 基地：`ch10.back_to_station` `ch10.apply_depot`、`gone.tachibana`（橘は年内で基地を降りる）、`ch10.tachi_left_stay|tr`
- 実習中の代償：`ch10.cost_*` と `locked.ch10.dp_glasses|dp_notes|dp_hands|st_hand|st_button|st_call|ds_*|pl_*`、沈黙：`ch10.dp|st|ds|pl_silent`
