# 第4〜6章 書き直し：後続章への引継ぎ（flag一覧）

原本：`scripts/story/ch4.mjs` `ch5.mjs` `ch6.mjs`。後続章（第7章以降）が読める flag と、再登場の場面。

## 推薦枠（整合した設定）
- 志望書は 5/14 17:00 締切。駅から推薦は一名。条件は「研修開始時点で在籍12か月」（来年4月なら今年の新人も可）。結果は 5/21（第5章）。
- 全社の枠2・候補7は、各駅の推薦者が入る（第6章）。

## 第4章
| flag / lock | 意味 |
|---|---|
| `ch4.covered_yama` `ch4.secret_kept` | 庇った |
| `ch4.told_together` `ch4.told_alone` `ch4.told_truth` | 一緒に／一人で報告 |
| `ch4.trust_built` | 「一緒に報告」のみ（以前は一人でも立っていた矛盾を修正） |
| `ch4.helped_yama` | 午後に手伝った |
| `ch4.ledger_unknown` | 庇い＋沈黙で日計の400円が原因不明のまま閉じた |
| `ch4.told_late` `ch4.yama_spoke` | 庇ったが17:10に自分／山科が話した |
| `ch4.red_mark` `ch4.red_self` | 評価に赤印（山科／自分） |
| `ch4.signed_blind` `ch4.counted` `ch4.own_part_hidden` | 印を数える前に押した／数えた／黙った |
| `ch4.slot_apply` `ch4.slot_pass` `ch4.slot_wait` | 志望書への態度 |
| lock `slot_self` `clean_record` `ledger_may3` | 恒久（見送り／赤印／日計） |

## 第5章
| flag / lock | 意味 |
|---|---|
| `ch5.slot_player` `ch5.slot_yama` `ch5.slot_open` | 推薦の結果（本人／山科／空席）。第6章は読む |
| `ch5.y_out` | 山科が推薦から外れた |
| `ch5.late_report`（従来）＋ `late_hidden` `late_hq` `late_oral` `late_miyamae` | 遅れた報告を4分割 |
| `ch5.sk_confessed` `ch5.sk_evaded` | 発覚場面の自白／否認 |
| `ch5.false_report` `ch5.relapsed` | 部品交換で報告→翌週再停止 |
| `ch5.rep_chain` `rep_blame` `rep_narrow` `rep_wide` / `other_stop` `other_saved` `wide_blamed` | 報告の道とその結果 |
| `ch5.root_found` `ch5.recorded`（従来）／`ch5.watched` `ch5.note_found` `ch5.note_taken` | 自力到達／記録／木曜夜の見届け／宮前の付箋 |
| `ch5.stamp_exposed` `ch5.miyamae_skipped` | 印の件の発覚／宮前に連絡しなかった |
| lock `hq_trust_may` `hq_direct` `slot_yama` `slot_this_year` `miyamae_note` `slot_self` | 恒久 |

## 第6章
| flag / lock | 意味 |
|---|---|
| `ch6.wish_station/depot/dispatch/planning` `ch6.plan_cert` `ch6.plan_ojt`（従来） | 希望と研修計画 |
| `ch6.family_promise` `ch6.obon_request` `ch6.family_open` `ch6.family_quiet` | 母との約束。第7章（夏）で勤務と衝突させる想定 |
| `ch6.slot_yama_hold` `ch6.told_*` | 山科推薦の再審査／山科への宣言 |
| `ch6.note_returned` `ch6.note_kept` | 宮前の付箋を返した／持つ |
| depart `kiryu` `hiyama` | 桐生は本社監査課、檜山は東北支社へ。条件 `{gone:'kiryu'}` `{gone:'hiyama'}` |
| lock `wish_*_other` `slot_yama_final` | 選ばなかった道／山科推薦の再審査 |

## 再登場
- 桐生：第6章6/23に判子ケースの付箋「数えてから押す」を全ルートで見せ、去る。庇い沈黙ルートは最後の機会（時限、既定は沈黙）。
- 檜山：6/23 2号機の前で最後の更新（3.5.0・確定自動）。部品交換ルートは台詞が変わる。
- 宮前：6/23 窓口に来る。付箋を返す／持つ選択。
- 第7章以降で未読：`ch6.obon_request` `ch4.red_mark` `gone.kiryu` `gone.hiyama` `ch5.slot_*` を読む場面を追加してほしい。

## 3D
- 第4章：5/3 券売機室ハブ（数える／押す）、夕方の現場検証ハブ。第5章：木曜夜の張り込み、宮前の旧ロッカー。第6章：6/23 夕方の駅ハブ、駅ルートの「顔を集める」。
- UNVERIFIED：旧ロッカーは専用アンカーが無く `roster_board` で代用。実機の見た目は未確認。
