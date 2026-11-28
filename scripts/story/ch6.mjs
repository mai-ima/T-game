// R7 第6章「三か月目の面談」（6月21日〜25日）。「異動の現実」を、人数・資格・評価・時間・実績・人の去り方で見せる。
// 構造：人事課（推薦の結果を聞く）→ 検修庫 → 6/23 夕方の3Dハブ（山科・久保田・坂井・梶原・檜山・宮前・桐生が、一人ずつ現れ、去る）
//       → 母の電話（時限・既定は沈黙）→ 三者面談（ch4・ch5 の選択が、懸念として読まれる）→ 希望の選択 → 最初の一歩（4ルート。駅は3Dの「顔を集める」）。
// 取り返しのつかない変化：depart kiryu（桐生は本社監査課へ）／depart hiyama（東北支社へ）／lock slot_yama_final（沈黙を破った場合）／lock wish_*（選ばなかった道）。
// 引継ぎ：docs/analysis/handoff-ch4-6.md
export default function ch6(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, res3, P } = k;

  characters.jikka = { id: 'jikka', name: '母（実家）', kana: 'はは', role: '家族（遠方の実家）', dept: 'none', age: 56, years: 0, uniform: '#7a5a78', hair: '#6a6a6a', skin: '#ecc8a8', trait: '心配は口にせず、食事のことばかり聞く。本当は帰ってきてほしい。', bio: '北の港町で小さな店を営む。弟と二人暮らし。', gender: 'f' };
  characters.hoshino = { id: 'hoshino', name: '星野 沙織', kana: 'ほしの さおり', role: '駅務区 教育担当（上級駅務）', dept: 'station', age: 39, years: 17, uniform: '#1d2a44', hair: '#2b2118', skin: '#f0cfae', trait: '穏やか。「お客様の顔を覚えているか」を必ず聞く。', bio: '窓口・ホーム・事務室の全てを経験した上級駅務員。', gender: 'f', accessory: 'glasses' };
  characters.sekiya = { id: 'sekiya', name: '関谷 周平', kana: 'せきや しゅうへい', role: '輸送指令主任', dept: 'dispatch', age: 47, years: 24, uniform: '#2a3d52', hair: '#3a3a3a', skin: '#e9c7a2', trait: '声が低く、短く言い切る。復唱を絶対に省かない。', bio: '運転士・駅・計画を経て指令へ。', gender: 'm', accessory: 'none' };
  characters.togashi = { id: 'togashi', name: '富樫 玲', kana: 'とがし れい', role: '輸送計画課 係長', dept: 'planning', age: 36, years: 13, uniform: '#3a4a5e', hair: '#2a2a2a', skin: '#f0cfae', trait: '資料の「版」と「根拠」にうるさい。聞き上手。', bio: 'ダイヤ資料室の責任者。元・駅の助役補佐。', gender: 'f', accessory: 'glasses' };

  const HR = (who, cap) => v25('hr', who, cap);
  const OF = (who, cap) => v25('office', who, cap);
  const DP = (who, cap) => v25('depot', who, cap);
  const RG = (char, op, val, key = 'trust') => ({ rel: { char, key, op, val } });
  const task = (id, kind, title, intro, extra, results, view) => (N[id] = { id, type: 'task', kind, title, intro, ...extra, results, view });
  const go = (id, lines, next, effects, view) => (effects && !Array.isArray(effects) ? line(id, lines, next, { view: HR([]), ...effects }) : line(id, lines, next, { ...(effects ? { effects } : {}), view: view ?? HR([]) }));
  const E = (key, op, val) => ({ eval: { key, op, val } });
  const lockE = (id, note) => ({ lock: { id, note } });
  const departE = (char, note) => ({ depart: { char, note } });

  // ================= 6月21日（月）：面談の前に、現実を知る =================
  line('ch6.open', [
    'カチ。森下のボールペンが鳴った。彼女が事実を告げる前の癖だ。',
    ['morishita', '先に言います。三か月目の面談で、異動は決まりません。', 'normal'],
    ['player', '……決まらないのに、希望を出すんですか。'],
    ['morishita', '来年4月の異動の検討は、秋に始まります。その前に、何を準備してきたかを知りたい。'],
    ['morishita', '基地入門は、研修が始まる時点で、在籍十二か月。来年四月なら、今年の入社組でも間に合います。ただし、駅の推薦が先です。'],
    ['morishita', '全社の枠は2、候補は7。計画は24か月で枠1。指令に新人の直通はありません。']
  ], 'ch6.slot_news', { effects: [{ clock: { addDay: 31, minute: hm(8, 40) } }, tl('6月21日 三か月目の面談の準備。異動の条件と枠を知る'), log('第6章開始。異動の条件と枠の説明', 'career')], view: HR(['morishita'], '6月21日（月） 8:40 本社 人事課') });
  branch('ch6.slot_news', [[F('ch5.slot_player'), 'ch6.sn_p'], [F('ch5.slot_yama'), 'ch6.sn_y']], 'ch6.sn_o');
  go('ch6.sn_p', [
    ['morishita', '青嶺中央からの推薦は、あなたでした。七人の中に、名前があります。'],
    ['player', '……はい。'],
    ['morishita', '「入った」だけです。二人に残るかは、これから。'],
    '森下の机の端に、推薦書の控えがある。白石の字だった。'
  ], 'ch6.sort_intro', { effects: [], view: HR(['morishita']) });
  go('ch6.sn_y', [
    ['morishita', '青嶺中央からの推薦は、山科さんです。{player}さんは、七人の外になります。'],
    ['morishita', '希望は出せます。ただ、基地の入口は、来年の公募を待つことになります。'],
    'ペンが、一度、鳴った。事実の癖だ。'
  ], 'ch6.sort_intro', { view: HR(['morishita']) });
  go('ch6.sn_o', [
    ['morishita', '今年度、青嶺中央からの推薦は、ありません。七人の中に、この駅の名前は、ありません。'],
    ['morishita', '空席は、珍しくありません。来年に向けた準備だけは、今日からできます。']
  ], 'ch6.sort_intro', { view: HR(['morishita']) });
  go('ch6.sort_intro', [['morishita', '条件は四種類に分かれます。足りないものの種類で、準備が変わる。振り分けてみて。']], 'ch6.sort_task', null, HR(['morishita']));
  task('ch6.sort_task', 'sort', '異動条件の仕分け', '異動の条件を、「資格・認定」「研修」「評価」「在籍期間」のどれに当たるかで分けます。', {
    config: { perItem: 10, bins: [{ id: 'cert', label: '資格・認定' }, { id: 'train', label: '研修' }, { id: 'eval', label: '評価' }, { id: 'term', label: '在籍期間' }], items: [
      { id: 'a', label: '駅務基礎の修了', bin: 'cert', why: '修了の認定を受ける資格に当たります。' },
      { id: 'b', label: '基地入門研修の修了', bin: 'train', why: '研修の修了が条件です。' },
      { id: 'c', label: '評価：安全意識58以上', bin: 'eval', why: '日々の勤務の評価で決まります。' },
      { id: 'd', label: '在籍12か月以上', bin: 'term', why: '時間が経たないと満たせません。' },
      { id: 'e', label: '乗務員の適性・選考', bin: 'train', why: '選考と適性の確認は、研修の枠組みで行われます。' },
      { id: 'f', label: '検修作業補助の認定', bin: 'cert', why: '認定を受ける資格に当たります。' },
      { id: 'g', label: '評価：報連相60以上', bin: 'eval', why: '日々の報告・連絡・相談の評価で決まります。' },
      { id: 'h', label: '在籍24か月以上（輸送計画）', bin: 'term', why: '時間が経たないと満たせません。' }] }
  }, res3('ch6.sort_good', 'ch6.sort_mid', 'ch6.sort_bad', [ev('accuracy', 1)], [], []), HR(['morishita'], '異動条件の仕分け'));
  go('ch6.sort_good', [['morishita', 'カチ。……在籍期間だけは、努力で縮みません。']], 'ch6.s2_open', null, HR(['morishita']));
  go('ch6.sort_mid', [['morishita', '持ち帰って構いません。木曜までに。']], 'ch6.s2_open', null, HR(['morishita']));
  go('ch6.sort_bad', [['morishita', 'カチ。種類が分かれば、順番が見えます。見えるまで、付き合います。']], 'ch6.s2_open', null, HR(['morishita']));

  // ================= 6月22日（火）：基地の検修長 =================
  line('ch6.s2_open', [
    '検修庫の床に、ぽつんと油の染み。ここへ来るたび、新品の靴の自分が浮く。',
    ['yamashina', '来たな。……背筋、伸びるだろ。', 'smile'],
    '事務所の机の向こうで、白髪混じりの男が顔を上げた。検修長の橘 源三だ。'
  ], 'ch6.s2_tb', { effects: [{ clock: { addDay: 1, minute: hm(9, 30) } }, tl('6月22日 青浜総合車両センターで、検修長の話を聞く')], view: DP(['yamashina'], '6月22日（火） 9:30 青浜総合車両センター') });
  branch('ch6.s2_tb', [[F('legacy.tachibana_met'), 'ch6.s2_met']], 'ch6.s2_new');
  line('ch6.s2_met', [
    ['tachibana', '四月に、床下を覗いていた新人か。', 'normal'],
    ['tachibana', '来る奴は二種類だ。憧れで来る奴と、見に来る奴。どっちだ。', 'serious']
  ], 'ch6.s2_talk', { view: DP(['tachibana'], '検修庫 事務所') });
  line('ch6.s2_new', [
    ['tachibana', '橘だ。駅の新人が来るのは年に数回。', 'normal'],
    ['tachibana', '憧れか、見に来たのか。自分で分かっておけ。顔に出る。']
  ], 'ch6.s2_talk', { view: DP(['tachibana'], '検修庫 事務所') });
  line('ch6.s2_talk', [
    ['player', '……まだ分かりません。ただ、止まっている電車のほうが気になります。'],
    ['tachibana', '止まっている電車、か。悪くない。'],
    ['tachibana', '検修は「見る・触る・記録する」だ。夜勤もある。'],
    ['yamashina', '橘さんは、なぜこの仕事を？'],
    ['tachibana', '行く場所がなかった。三十八年で、今はここしか無い。……あと二年だがな。', 'smile']
  ], 'ch6.s2_branch', { view: DP(['tachibana', 'yamashina'], '検修庫 事務所') });
  branch('ch6.s2_branch', [[F('ch5.false_report'), 'ch6.tc_false'], [ANY(F('ch5.recorded'), F('ch5.root_found')), 'ch6.tc_heard']], 'ch6.tc_plain');
  line('ch6.tc_heard', [
    ['tachibana', '券売機の件は白石から聞いた。手順の抜けを自分で突き止めた、とな。'],
    ['tachibana', '基地は人を選ばん。記録が選ぶ。お前の記録は読めた。']
  ], 'ch6.s2_slot', { effects: [rel('tachibana', 2, 1)], view: DP(['tachibana']) });
  line('ch6.tc_false', [
    ['tachibana', '「直った」と本社に出して、翌週に止まった。白石から聞いた。'],
    ['tachibana', '直ったと言って、直っていなかった奴は、基地では一番、嫌われる。……取り下げたことは、聞いた。']
  ], 'ch6.s2_slot', { effects: [rel('tachibana', 0, 0)], view: DP(['tachibana']) });
  line('ch6.tc_plain', [
    ['tachibana', '基地は人を選ばん。記録が選ぶ。駅で何を残した。一つ言え。'],
    ['player', '……胸を張れるものは、まだ少ないです。'],
    ['tachibana', '少ないと言えるなら伸びる。誤魔化す奴は伸びん。']
  ], 'ch6.s2_slot', { effects: [rel('tachibana', 1, 0)], view: DP(['tachibana']) });
  branch('ch6.s2_slot', [[F('ch5.slot_player'), 'ch6.s2_e_p'], [F('ch5.slot_yama'), 'ch6.s2_e_y']], 'ch6.s2_e_o');
  go('ch6.s2_e_p', [
    ['tachibana', '駅の推薦は、お前だと聞いた。'],
    ['yamashina', '……', 'worry'],
    ['tachibana', '七人の一人だ。枠は二つ。入ると約束はせん。']
  ], 'ch6.depot_intro', null, DP(['tachibana', 'yamashina']));
  go('ch6.s2_e_y', [
    ['tachibana', '駅の推薦は、山科だと聞いた。'],
    ['yamashina', '……はい。', 'normal'],
    ['tachibana', 'お前は、来年がある。見に来るなら、来い。']
  ], 'ch6.depot_intro', null, DP(['tachibana', 'yamashina']));
  go('ch6.s2_e_o', [
    ['tachibana', '今年は、青嶺中央から誰も来ない。空席は、珍しくない。'],
    ['yamashina', '……。', 'worry'],
    ['tachibana', '来年も、席は同じだけだ。']
  ], 'ch6.depot_intro', null, DP(['tachibana', 'yamashina']));
  go('ch6.depot_intro', [['tachibana', '線の内側から見ろ。触るな。作業と資格を、分けて覚えろ。']], 'ch6.depot_task', null, DP(['tachibana'], '検修庫 見学通路'));
  task('ch6.depot_task', 'sort', '検修の作業と資格', '各作業が、資格なしで見学できるのか、認定後に補助できるのか、有資格者のみなのかを選びます。', {
    config: { perItem: 12, bins: [{ id: 'view', label: '見学のみ（資格不要）' }, { id: 'assist', label: '検修作業補助の認定後' }, { id: 'only', label: '有資格の検修員のみ' }], items: [
      { id: 'a', label: '黄色い線の内側から、床下を見学する', bin: 'view', why: '見学者は、線の内側から見るだけです。' },
      { id: 'b', label: '工具・部品の運搬の補助', bin: 'assist', why: '認定を受けた補助員が行います。' },
      { id: 'c', label: 'ブレーキ装置の分解と検査', bin: 'only', why: '安全に直結する作業は、有資格の検修員だけです。' },
      { id: 'd', label: '検査記録票への転記の補助', bin: 'assist', why: '記録の補助は、認定後に任されます。' },
      { id: 'e', label: '編成の入出区の誘導', bin: 'only', why: '入出区は、有資格者が担います。' },
      { id: 'f', label: '台車まわりの清掃の補助', bin: 'assist', why: '認定後に、監督のもとで行います。' }] }
  }, res3('ch6.dt_good', 'ch6.dt_mid', 'ch6.dt_bad', [ev('safety', 2), sk('depot', 2)], [sk('depot', 1)], []), DP(['tachibana'], '検修の作業と資格'));
  go('ch6.dt_good', [['tachibana', '……線の外には、一歩も出なかったな。', 'smile']], 'ch6.s2_end', null, DP(['tachibana']));
  go('ch6.dt_mid', [['tachibana', '触る仕事ほど、厳しい。そこだけ。']], 'ch6.s2_end', null, DP(['tachibana']));
  go('ch6.dt_bad', [['tachibana', '線の内と外。まずそれを、足で覚えろ。', 'serious']], 'ch6.s2_end', null, DP(['tachibana']));
  go('ch6.s2_end', [
    ['tachibana', '枠は少ない。希望者は毎年いる。ここに来たいなら、待てる奴になれ。'],
    ['yamashina', '俺は待ちます。', 'normal'],
    ['tachibana', '返事が早い。……{player}は迷っていていい。自分の目で見ている証拠だ。']
  ], 'ch6.s3_open', [rel('yamashina', 0, 1), tl('6月22日 検修長から、見学の線と「待つ」ことを教わる')], DP(['tachibana', 'yamashina']));

  // ================= 6月23日（水）夕方：面談の前日。3Dの駅で、人が一人ずつ現れ、去る =================
  line('ch6.s3_open', [
    '6月23日（水）、十六時。面談を翌日に控えた青嶺中央駅は、いつもと同じ顔をしていた。',
    '同じ顔なのに、今日は、一人ずつ、別れのような目で、こちらを見る。'
  ], 'ch6.hub', { effects: [{ clock: { addDay: 1, minute: hm(16, 0) } }, tl('6月23日 面談の前日。青嶺中央駅で、世話になった人に会う')], view: v3('follow', '6月23日（水） 16:00 青嶺中央駅') });
  N['ch6.hub'] = { id: 'ch6.hub', type: 'hub', scene: 'station', title: '青嶺中央駅（6月23日・夕方）', hint: '面談の前日。歩いて、会える人に会います。桐生助役は、今日が最後の出納です。', view: v3('follow', '6月23日 夕方'), interactions: [],
    timed: [{ id: 'eve', at: hm(20, 0), goto: 'ch6.eve_gate' }],
    goals: [
      { id: 'g_y', label: '山科と話す', when: F('ch6.y_done') },
      { id: 'g_kr', label: '桐生助役に会う（17:30以降）', when: F('ch6.kr_done') },
      { id: 'g_hy', label: '（任意）2号機の前の檜山さん（16:30以降）', when: F('ch6.hy_done'), optional: true },
      { id: 'g_my', label: '（任意）窓口に来た人（17:00以降）', when: F('ch6.my_done'), optional: true },
      { id: 'g_k', label: '（任意）久保田さんと話す', when: F('ch6.k_done'), optional: true }
    ],
    exit: { label: '寮へ戻る（母から電話の時間）', requires: ALL(F('ch6.y_done'), F('ch6.kr_done')), goto: 'ch6.s4_open' } };
  N['ch6.hub'].interactions.push(
    { id: 'y', object: 'yamashina', label: '山科に話しかける', goto: 'ch6.s3_y', once: true, icon: '💬' },
    { id: 'k', object: 'kubota', label: '久保田さんに話しかける', goto: 'ch6.s3_k', once: true, icon: '💬' },
    { id: 'sk', object: 'sakai', label: '売店の坂井さんに声をかける', goto: 'ch6.s3_s', once: true, icon: '☕' },
    { id: 'kj', object: 'kajiwara', label: '梶原さんが、券売機の前にいる', goto: 'ch6.s3_kj', requires: F('legacy.helped_kajiwara'), once: true, icon: '🙋' },
    { id: 'hy', object: 'vend2', label: '2号機の前に、檜山さんが来ている', goto: 'ch6.s3_h', requires: T('>=', hm(16, 30)), once: true, icon: '🧰' },
    { id: 'my', object: 'ticket_office', label: '窓口の前に、見覚えのある人がいる', goto: 'ch6.s3_m', requires: T('>=', hm(17, 0)), once: true, icon: '📎' },
    { id: 'kr', object: 'terminal', label: '出納机の桐生助役に声をかける', goto: 'ch6.s3_kr', requires: T('>=', hm(17, 30)), once: true, icon: '🗂️' }
  );
  // 久保田
  go('ch6.s3_k', [['kubota', '明日の面談、緊張しますか。私は、三か月目に、手の汗で調書を濡らしました。']], 'ch6.s3_k_b', null, v3('npc:kubota', '16:10 コンコース'));
  branch('ch6.s3_k_b', [[RG('kubota', '>=', 6), 'ch6.s3_k_c'], [F('ch5.rep_blame'), 'ch6.s3_k_bl'], [F('ch5.rep_narrow'), 'ch6.s3_k_na'], [F('ch5.rep_wide'), 'ch6.s3_k_wi'], [F('ch5.rep_chain'), 'ch6.s3_k_ch']], 'ch6.s3_k_e');
  go('ch6.s3_k_bl', [['kubota', '送信前に止めた手順の紙、まだ机にあります。次は、先に見せてください。']], 'ch6.s3_k_e', null, v3('npc:kubota'));
  go('ch6.s3_k_na', [['kubota', '口頭で、私にだけ。……あの夜、私も少し、眠れませんでした。']], 'ch6.s3_k_e', null, v3('npc:kubota'));
  go('ch6.s3_k_wi', [['kubota', '全駅に出した夜、白石駅長は、帽子を二度、かぶり直していました。']], 'ch6.s3_k_e', null, v3('npc:kubota'));
  go('ch6.s3_k_ch', [['kubota', '北嶺の夜のこと、まだ考えます。順番は守った。それでも。']], 'ch6.s3_k_e', null, v3('npc:kubota'));
  go('ch6.s3_k_c', [
    ['kubota', 'その調書、まだ持っています。……何を書いたかは、内緒です。', 'smile'],
    '久保田は、引き出しの一番下を、手のひらで二度、叩いた。'
  ], 'ch6.s3_k_e', { effects: [rel('kubota', 1, 1)], view: v3('npc:kubota') });
  fx('ch6.s3_k_e', [set('ch6.k_done'), time(10)], 'ch6.hub');
  // 坂井：五月の結果が、顔に出る
  go('ch6.s3_s', [['sakai', 'あら。面談、明日でしょ。コーヒー、持っていきなさい。', 'smile']], 'ch6.s3_s_b', null, v3('npc:sakai', '16:20 売店'));
  branch('ch6.s3_s_b', [[F('ch5.relapsed'), 'ch6.s3_s_r'], [F('ch5.watched'), 'ch6.s3_s_w'], [F('ch5.other_stop'), 'ch6.s3_s_o'], [F('ch5.other_saved'), 'ch6.s3_s_v'], [F('ch5.wide_blamed'), 'ch6.s3_s_v']], 'ch6.s3_s_e');
  go('ch6.s3_s_o', [['sakai', '北嶺の駅の話、聞いたわ。うちの常連も、あっちで乗り換えるの。……無事だったかしら。', 'worry']], 'ch6.s3_s_e', null, v3('npc:sakai'));
  go('ch6.s3_s_v', [['sakai', '他の駅からも、お礼のお菓子が届いたんですって。白石さん、照れてたわよ。', 'smile']], 'ch6.s3_s_e', null, v3('npc:sakai'));
  go('ch6.s3_s_r', [['sakai', '終電を逃したお客さん、あれから、一度も来ないの。……来てほしかったわけじゃ、ないんだけどね。', 'worry']], 'ch6.s3_s_e', null, v3('npc:sakai'));
  go('ch6.s3_s_w', [['sakai', '木曜の夜、あなたが立ってたの、見たわよ。シャッターの隙間から。あれ、効いたわ。', 'smile']], 'ch6.s3_s_e', null, v3('npc:sakai'));
  fx('ch6.s3_s_e', [rel('sakai', 0, 1), time(10)], 'ch6.hub');
  // 梶原さん
  go('ch6.s3_kj', [
    ['kajiwara', 'あら、駅員さん。通院の帰りよ。この券売機、もう止まらないのね。', 'smile'],
    ['kajiwara', 'あなたの顔、覚えたの。明日、何かあるんでしょう。いい日になるわよ。']
  ], 'ch6.s3_kj_e', null, v3('npc:kajiwara', '16:40 券売機の前'));
  fx('ch6.s3_kj_e', [time(10)], 'ch6.hub');

  // 山科
  go('ch6.s3_y', [
    '事務室の机で、山科が希望調書を折っては開き、折っては開いていた。紙がもう柔らかい。',
    ['yamashina', '昼に先に面談だった。「枠は2、候補は7」だとよ。', 'worry']
  ], 'ch6.s3_y_b', null, OF(['yamashina'], '16:50 駅事務室'));
  branch('ch6.s3_y_b', [[F('ch5.slot_player'), 'ch6.s3_y_p'], [F('ch5.slot_yama'), 'ch6.s3_y_y']], 'ch6.s3_y_o');
  go('ch6.s3_y_p', [
    ['yamashina', '駅の推薦、お前だったな。……おめでとう、とは、言えない日もある。', 'normal'],
    ['yamashina', '条件は、まだ何も満たしてない。それでも希望は変わらない。変わらないから困ってる。']
  ], 'ch6.s3_y_c', null, OF(['yamashina']));
  go('ch6.s3_y_y', [
    ['yamashina', '駅の推薦、通った。……お前が、何を言ってくれたか、白石駅長は言わない。聞かない。', 'normal'],
    ['yamashina', '赤印は、扱いの欄に、駅長の字で、一行ついたそうだ。助かってる。助かってるのに、重い。']
  ], 'ch6.s3_y_c', null, OF(['yamashina']));
  go('ch6.s3_y_o', [
    ['yamashina', '箱、空のままだったな。……来年も、ある。そう言い聞かせてる。', 'worry'],
    ['yamashina', '条件は、まだ何も満たしてない。それでも希望は変わらない。変わらないから困ってる。']
  ], 'ch6.s3_y_c', null, OF(['yamashina']));
  branch('ch6.s3_y_c', [[F('ch2.saw_depot'), 'ch6.s3_depot']], 'ch6.s3_plain');
  line('ch6.s3_depot', [
    ['yamashina', '四月の見学、一緒に行っただろ。お前も同じ道に来ると勝手に思ってた。', 'smile'],
    ['yamashina', 'でも枠は2つ。お前が来たら、どっちかが落ちる。そう計算してる自分が、嫌なんだよ。', 'worry']
  ], 'ch6.told_choice', { view: OF(['yamashina']) });
  line('ch6.s3_plain', [
    ['yamashina', 'お前がどの道を選ぶか、ずっと気になってた。', 'normal'],
    ['yamashina', '同期の道がばらばらになるのは普通だ。普通なのに、少し寂しい。']
  ], 'ch6.told_choice', { view: OF(['yamashina']) });
  choice('ch6.told_choice', '山科は言った。「明日、何て言う」', [
    opt('depot', '「私も、基地を目指すかもしれない」', 'ch6.told_a', { tone: 'honest', effects: [set('ch6.told_depot')] }),
    opt('other', '「私は、別の道に進むかもしれない」', 'ch6.told_b', { tone: 'careful', effects: [set('ch6.told_other')] }),
    opt('open', '「まだ決められない。面談で話してから決める」', 'ch6.told_c', { tone: 'neutral', effects: [set('ch6.told_open')] })
  ], { view: OF(['yamashina']) });
  go('ch6.told_a', [['yamashina', '……そうか。嬉しいのと困るのが半分ずつだ。'], ['yamashina', '競争になる。でも相手がお前なら、悪くない。', 'smile']], 'ch6.y_end', [rel('yamashina', 1, 1)], OF(['yamashina']));
  go('ch6.told_b', [['yamashina', '……そうなのか。ほっとしたのと、置いていかれる気がするのと、両方だ。', 'surprise'], ['yamashina', '決めたら変えるなよ。']], 'ch6.y_end', [rel('yamashina', 1, 0)], OF(['yamashina']));
  go('ch6.told_c', [['yamashina', '決めてる俺でも怖い。お前が決められないのは、悪くない。'], '山科は、調書の折り目を、親指で、一本ずつ伸ばした。'], 'ch6.y_end', [rel('yamashina', 0, 1)], OF(['yamashina']));
  fx('ch6.y_end', [set('ch6.y_done'), time(15)], 'ch6.hub');

  // 檜山：最後の更新と、去る人
  go('ch6.s3_h', [
    '2号機の前に、工具バッグ。檜山が、画面の右下の小さな数字を、指さした。',
    ['hiyama', '3.5.0。補充後の「確定」は、自動になります。今夜から。']
  ], 'ch6.s3_h_b', null, v3('npc:vend2', '16:35 券売機2号機の前'));
  branch('ch6.s3_h_b', [[ANY(F('ch5.false_report'), F('ch5.relapsed')), 'ch6.s3_h_f'], [RG('hiyama', '>=', 2), 'ch6.s3_h_c']], 'ch6.s3_h_p');
  go('ch6.s3_h_f', [
    ['hiyama', '交換した基板は、返品になりました。部品は、悪くなかった。', 'normal'],
    ['hiyama', '私も、勧めなかったとは言え、止めきれなかった。……来月から、東北の担当に移ります。'],
    '檜山は、点検シールを一枚、台紙ごと、{player}に渡した。貼る欄は、空白のままだった。'
  ], 'ch6.s3_h_e', null, v3('npc:vend2'));
  go('ch6.s3_h_c', [
    ['hiyama', 'あの木曜の記録は、本社にも渡しました。「個人宛」の登録は、うちの側も直しました。'],
    ['hiyama', '来月から、東北の担当に移ります。……調べ方は、{player}さんのほうが、うまくなっている。', 'smile'],
    '点検シールが一枚。檜山は、自分の署名の横に、{player}の名前を書く欄を、空けておいた。'
  ], 'ch6.s3_h_e', { effects: [rel('hiyama', 1, 1)], view: v3('npc:vend2') });
  go('ch6.s3_h_p', [
    ['hiyama', '更新は、以上です。……来月から、東北の担当に移ります。お世話になりました。'],
    '工具バッグが、どすん、と持ち上がった。最初の日と、同じ音だった。'
  ], 'ch6.s3_h_e', null, v3('npc:vend2'));
  fx('ch6.s3_h_e', [set('ch6.hy_done'), departE('hiyama', '檜山さんが、東北支社へ異動した（来月から）'), time(15)], 'ch6.hub');

  // 宮前：海浜口から来た人
  go('ch6.s3_m', [
    '窓口の前に、紙袋を提げた男が立っていた。几帳面に折り目のついた制服の袖。',
    ['miyamae', '宮前です。海浜口から、研修の帰りに。'],
    ['miyamae', '海浜口の補充票に、確定の欄を足しました。それを、お見せしたくて。']
  ], 'ch6.s3_m_b', null, OF(['miyamae'], '17:05 きっぷうりば'));
  branch('ch6.s3_m_b', [[F('ch5.note_found'), 'ch6.s3_m_n'], [RG('miyamae', '>=', 2), 'ch6.s3_m_t'], [F('ch5.miyamae_skipped'), 'ch6.s3_m_s']], 'ch6.s3_m_p');
  go('ch6.s3_m_n', [
    ['miyamae', 'ロッカーの付箋、読んでもらえたそうですね。……白石駅長から、聞きました。', 'smile'],
    ['miyamae', '引継ぎ帳に書けなかった、あの一枚。今は、持っていますか。']
  ], 'ch6.s3_m_nc', null, OF(['miyamae']));
  choice('ch6.s3_m_nc', '付箋は、{player}の手帳に貼ってある。', [
    opt('return', '「お返しします。宮前さんの字ですから」', 'ch6.s3_m_r', { tone: 'honest', requires: F('ch5.note_taken'), effects: [set('ch6.note_returned'), rel('miyamae', 1, 2)] }),
    opt('keep', '「持っていてもいいですか。次の人に、渡すために」', 'ch6.s3_m_k', { tone: 'caring', effects: [set('ch6.note_kept'), rel('miyamae', 1, 1)] })
  ], { view: OF(['miyamae']) });
  go('ch6.s3_m_r', [['miyamae', '……ありがとうございます。海浜口のロッカーの内側に、貼り直します。', 'smile'], '宮前は、付箋を、指の腹で、一度、撫でた。'], 'ch6.s3_m_e', null, OF(['miyamae']));
  go('ch6.s3_m_k', [['miyamae', '……お願いします。次の人に、読める字で。', 'smile'], '宮前は、深く頭を下げた。折り目のついた袖が、揺れた。'], 'ch6.s3_m_e', null, OF(['miyamae']));
  go('ch6.s3_m_t', [
    ['miyamae', '電話で、「手がかりになった」と言っていただいて。……あのとき、救われました。', 'smile'],
    '海浜口の補充票の写しが、窓口の台に置かれた。「確定 ＿＿時＿＿分」の欄。'
  ], 'ch6.s3_m_e', { view: OF(['miyamae']) });
  go('ch6.s3_m_s', [
    ['miyamae', '白石駅長から、お電話をいただきました。……自分のせいかと、聞いてしまいました。', 'worry'],
    '補充票の写しが一枚。宮前は、{player}と目を合わせず、深く一礼して、帰っていった。'
  ], 'ch6.s3_m_e', { view: OF(['miyamae']) });
  go('ch6.s3_m_p', [
    ['miyamae', '電話では、失礼しました。……補充票、見ていただけますか。'],
    '補充票の写しが、窓口の台に置かれた。欄の字は、角ばって、几帳面だった。'
  ], 'ch6.s3_m_e', { view: OF(['miyamae']) });
  fx('ch6.s3_m_e', [set('ch6.my_done'), time(15)], 'ch6.hub');

  // 桐生：今日が最後の出納
  go('ch6.s3_kr', [
    ['kiryu', '来月から、本社の監査課です。今日が、最後の出納。'],
    '桐生が、判子ケースの蓋を開けた。蓋の裏に、黄ばんだ付箋が貼ってある。',
    '「数えてから押す」。角ばった、古い字。桐生は、それについて、何も言わなかった。'
  ], 'ch6.s3_kr_b', null, OF(['kiryu'], '17:40 出納机'));
  branch('ch6.s3_kr_b', [[F('ch4.ledger_unknown'), 'ch6.kr_led'], [F('ch4.told_together'), 'ch6.kr_tg'], [F('ch4.told_alone'), 'ch6.kr_al']], 'ch6.kr_late');
  go('ch6.kr_tg', [
    ['kiryu', '五月三日の票は、監査課に持っていきます。袋の置き場の件は、他の駅の手順に、載りました。'],
    ['kiryu', '赤印は、まだ付いています。……あの日、二人で来たことも、同じ箱に入っています。']
  ], 'ch6.kr_tg_b', null, OF(['kiryu']));
  branch('ch6.kr_tg_b', [[RG('kiryu', '>=', 3), 'ch6.kr_tg_c']], 'ch6.kr_end');
  go('ch6.kr_tg_c', [
    ['kiryu', '私は一度、黙った側の人間です。若い頃。その付箋は、それ以来のものです。', 'normal'],
    '桐生は、蓋を、そっと閉じた。パチン、と小さな音がした。'
  ], 'ch6.kr_end', { effects: [rel('kiryu', 1, 1)], view: OF(['kiryu']) });
  go('ch6.kr_al', [
    ['kiryu', '五月三日。あなたは、早く来た。それは、正しかった。'],
    ['kiryu', '伝え方には、別の道がありました。……私は、あなたに、それを言い損ねました。']
  ], 'ch6.kr_al_b', null, OF(['kiryu']));
  branch('ch6.kr_al_b', [[RG('kiryu', '>=', 3), 'ch6.kr_al_c']], 'ch6.kr_end');
  go('ch6.kr_al_c', [
    ['kiryu', '山科さんには、私から、一言、残しました。「あの日、一番先に動いたのは、{player}さんだった」と。'],
    '桐生は、判子ケースの蓋を、静かに閉じた。'
  ], 'ch6.kr_end', { effects: [rel('yamashina', 0, 1)], view: OF(['kiryu']) });
  go('ch6.kr_late', [
    ['kiryu', '五月三日は、閉じた件です。遅くなったけれど、日付が変わる前でした。'],
    ['kiryu', '今日、ここに立てて、よかったです。']
  ], 'ch6.kr_end', null, OF(['kiryu']));
  // 沈黙を続けた場合：最後の機会（時限・既定は沈黙）
  go('ch6.kr_led', [
    ['kiryu', '五月三日の、3号機。「過不足 −400円 原因不明」。', 'serious'],
    ['kiryu', '私が閉じる前に、原因を書き足せる人は、一人だけです。あなたか、山科さん。']
  ], 'ch6.kr_led_c', null, OF(['kiryu']));
  choice('ch6.kr_led_c', '桐生は、ペンの先を、欄の上で止めている。', [
    opt('truth', '「あの四百円は、山科さんの取り違えです。私は、知っていました」', 'ch6.kr_led_t', { tone: 'honest', effects: [rel('kiryu', 2, 0), ev('reporting', 2), rel('yamashina', -2, -1)] }),
    opt('silent', '何も言わない', 'ch6.kr_led_s', { tone: 'neutral', effects: [ev('reporting', -1), rel('kiryu', -1, -1)] })
  ], { timeLimit: 20, defaultOption: 'silent', important: true, who: 'kiryu', view: OF(['kiryu']) });
  go('ch6.kr_led_t', [
    ['kiryu', '……ありがとう。三か月、遅かった。'],
    '桐生は、欄に、五文字だけ足した。「取り違え」。判子が、静かに降りた。',
    ['kiryu', '山科さんの推薦は、この件の記載で、再審査になります。止めることは、私にはできません。']
  ], 'ch6.kr_led_t2', { view: OF(['kiryu']) });
  branch('ch6.kr_led_t2', [[ANY(F('ch5.slot_yama'), F('ch5.sk_evaded')), 'ch6.kr_led_t3']], 'ch6.kr_end');
  go('ch6.kr_led_t3', [
    '「再審査」の三文字が、二人の間に、落ちた。',
    ['kiryu', '推薦書は、まだ本社に残っています。取り下げか否かは、白石駅長が決めます。']
  ], 'ch6.kr_end', { effects: [set('ch6.slot_yama_hold'), lockE('slot_yama_final', '三号機の原因が書き足され、山科の推薦は再審査になった')], view: OF(['kiryu']) });
  go('ch6.kr_led_s', [
    ['kiryu', '……そうですか。'],
    '桐生は、欄の「原因不明」の上に、自分の判子を押した。紙の上で、朱が丸く広がった。',
    ['kiryu', '月末の監査で、この数字は、もう動きません。'],
    '蓋の裏の付箋が、見えなくなった。'
  ], 'ch6.kr_end', { view: OF(['kiryu']) });
  fx('ch6.kr_end', [set('ch6.kr_done'), departE('kiryu', '桐生助役が、本社の監査課へ異動した（今月末で）'), time(20)], 'ch6.hub');

  // 時間切れ：桐生が先に帰った場合
  branch('ch6.eve_gate', [[NF('ch6.kr_done'), 'ch6.kr_off']], 'ch6.s4_open');
  go('ch6.kr_off', [
    '二十時。出納机は、すでに、空だった。',
    '机の上に、判子ケースだけが残っている。蓋の裏に、黄ばんだ付箋。「数えてから押す」。',
    '桐生は、挨拶を一枚の紙に残して、先に帰っていた。'
  ], 'ch6.s4_open', { effects: [set('ch6.kr_done'), departE('kiryu', '桐生助役が、本社の監査課へ異動した（今月末で）')], view: OF([], '20:00 駅事務室 出納机') });

  // ---- 母の電話（時限・既定は沈黙） ----
  line('ch6.s4_open', [
    '夜9時半。寮の自室。携帯が震えた。画面に「母」。',
    ['jikka', 'ごはん食べてる？ ……面談、あるんだって？'],
    ['player', 'なんで知ってるの。'],
    ['jikka', '先週、あなたが言ったでしょう。覚えてるわよ。'],
    ['jikka', '遠くへ行くことになるの？ 店は弟がいるから、平気。……お盆は、帰れる？', 'worry'],
    '電話の向こうで、息だけが、待っている。'
  ], 'ch6.fam_choice', { effects: [{ clock: { minute: hm(21, 30) } }], view: HR(['jikka'], '21:30 社員寮の自室（電話）') });
  choice('ch6.fam_choice', '母に、どう話しますか？', [
    opt('open', '「異動で、遠くの職場になるかもしれない。行くとしても、まだ先だけど」と正直に話す', 'ch6.fam_a', { tone: 'honest', effects: [set('ch6.family_open'), rel('jikka', 1, 2)] }),
    opt('quiet', '「心配しないで。まだ何も決まってないから」とだけ答える（または、答えられない）', 'ch6.fam_b', { tone: 'neutral', effects: [set('ch6.family_quiet'), rel('jikka', 0, 1)] }),
    opt('promise', '「お盆は、帰れるように、勤務を調整してもらうよ」と約束する', 'ch6.fam_c', { tone: 'caring', effects: [set('ch6.family_promise'), rel('jikka', 1, 2), ev('teamwork', 1)] })
  ], { timeLimit: 20, defaultOption: 'quiet', view: HR(['jikka']) });
  go('ch6.fam_a', [['jikka', '……そう。遠く、ねえ。反対はしないわ。', 'normal'], ['jikka', '冬には顔を見せなさい。電話じゃ顔色が分からないから。', 'smile']], 'ch6.s5_open', null, HR(['jikka']));
  go('ch6.fam_b', [['jikka', 'そう。……決まったら、先に教えてね。後から聞くとびっくりするから。'], ['player', '……うん。先に言う。']], 'ch6.s5_open', null, HR(['jikka']));
  go('ch6.fam_c', [['jikka', '無理しなくていいのに。……弟は喜ぶけど。', 'smile'], ['jikka', 'お願いするなら、わがままじゃなく、お願いの仕方でね。']], 'ch6.s5_open', null, HR(['jikka']));

  // ================= 6月24日（木）：三者面談 =================
  line('ch6.s5_open', [
    '面談室の机に、希望調書と評価の控え。折り目のついた調書は、もう{player}のものだ。',
    ['morishita', 'カチ。では、始めます。白石駅長、久保田さんも同席です。'],
    ['shiraishi', '評価を言い渡す場じゃない。君が自分の道を、自分の言葉で話す場だ。'],
    ['kubota', '褒めることも、言いにくいことも、あります。']
  ], 'ch6.concern_gate', { effects: [{ clock: { addDay: 1, minute: hm(13, 30) } }, tl('6月24日 三か月目の面談。白石・久保田・森下の三者'), log('三か月目の面談が始まる', 'career')], view: HR(['morishita', 'shiraishi', 'kubota'], '6月24日（木） 13:30 面談室') });
  branch('ch6.concern_gate', [[ANY(F('ch5.false_report'), F('ch5.late_report'), F('ch4.secret_kept'), F('ch5.stamp_exposed'), F('ch2.idea_selfpost'), F('legacy.rule_break')), 'ch6.concern_set']], 'ch6.rv_gate');
  fx('ch6.concern_set', [set('ch6.concern')], 'ch6.concern_pick');
  branch('ch6.concern_pick', [[F('ch5.false_report'), 'ch6.cn_false'], [F('ch5.late_hidden'), 'ch6.cn_hid'], [F('ch5.late_hq'), 'ch6.cn_hq'], [F('ch5.late_oral'), 'ch6.cn_oral'], [F('ch5.late_miyamae'), 'ch6.cn_miya'], [F('ch5.stamp_exposed'), 'ch6.cn_stamp'], [F('ch4.secret_kept'), 'ch6.cn_cover'], [F('ch2.idea_selfpost'), 'ch6.cn_self']], 'ch6.cn_rule');
  go('ch6.cn_false', [
    ['shiraishi', '券売機の件。「部品交換で復旧」と本社に出した。一週間後に取り下げた。', 'serious'],
    ['kubota', '止まった夜に、終電を逃したお客様が、一人います。'],
    ['morishita', '記録には残っています。取り下げの早さも、同じ記録に。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  branch('ch6.cn_hid', [[F('ch5.sk_confessed'), 'ch6.cn_hid_c'], [F('ch5.sk_evaded'), 'ch6.cn_hid_e']], 'ch6.cn_hid_w');
  go('ch6.cn_hid_c', [
    ['shiraishi', '連休中の山科の件。君は、半月、報告しなかった。五月十八日に、自分から話した。'],
    ['kubota', '同期をかばう気持ちは分かります。話した日のことも、同じ箱に入っています。'],
    ['morishita', 'カチ。「遅れた」と「自分で言った」は、両方、記録です。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_hid_e', [
    ['shiraishi', '五月十八日。「関係ないと思います」と、君は言った。私は、覚えている。', 'serious'],
    ['kubota', '内容ではなく、あの場の答え方が、記録です。'],
    ['morishita', 'カチ。異動先は「困ったとき、すぐ言える人か」を見ます。']
  ], 'ch6.rv_gate', [ev('reporting', -2), rel('shiraishi', -1, 0)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_hid_w', [
    ['shiraishi', '連休中の山科の件。「話をさせてほしい」と、君は言った。その日のうちに、二人で来た。'],
    ['kubota', '待つ時間が、長かった。……でも、来ました。'],
    ['morishita', '記録には事実として残しました。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_hq', [
    ['shiraishi', '券売機の件。本社へ直接メールを送った。「前任者の漏れ」と書いて。', 'serious'],
    ['kubota', '内容は、事実の一部でした。宛先と書き方が、問題でした。'],
    ['morishita', '以後、駅長名義と聞いています。そこから、見ます。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_oral', [
    ['shiraishi', '券売機の件。報告は、口頭で久保田に、だけだった。私は、一週間、知らなかった。', 'serious'],
    ['kubota', '内容ではなく「いつ、誰に」です。異動先で一番問われます。'],
    ['morishita', '挽回できます。次にどう動いたかを見ます。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_miya', [
    ['shiraishi', '宮前への連絡は、私が午後に入れた。……本人は、自分のせいかと、聞いた。'],
    ['kubota', '事実だけの連絡は、人に届かないことがあります。'],
    ['morishita', '減点ではありません。ただ、記録に、そう書いてあります。']
  ], 'ch6.rv_gate', [ev('teamwork', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_stamp', [
    ['shiraishi', '五月三日の確認印。数える前の時刻だった。そのことを、桐生は、君に確認した。'],
    ['kubota', '隠すつもりでは、なかったのでしょう。でも、言えなかった。'],
    ['morishita', 'カチ。言えなかった日は、記録に、そう残ります。']
  ], 'ch6.rv_gate', [ev('accuracy', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_cover', [
    ['shiraishi', '連休中の山科の件。君は、その日のうちには、報告しなかった。後で向き合ったことも聞いている。', 'serious'],
    ['kubota', '同期をかばう気持ちは分かります。でも、かばいが成長を止めることもある。'],
    ['morishita', 'カチ。記録には事実として残しました。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_self', [
    ['shiraishi', '四月に、許可なく券売機へ掲示した件。善意だったのは分かっている。'],
    ['kubota', 'いい考えでも手順を飛ばせば、信頼が減る。今も、同じです。'],
    ['morishita', 'その後の改善提案も書いてあります。']
  ], 'ch6.rv_gate', [ev('safety', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_rule', [
    ['shiraishi', '入社早々の、規則を飛ばした件。以来、確認を先にするようになった。そこは評価している。'],
    ['morishita', '一度のミスより、その後の姿勢が残ります。']
  ], 'ch6.rv_gate', [ev('safety', -1)], HR(['shiraishi', 'morishita']));

  branch('ch6.rv_gate', [[ALL(E('safety', '>=', 60), E('accuracy', '>=', 58), E('reporting', '>=', 56)), 'ch6.rv_high'], [ALL(E('safety', '>=', 55), E('accuracy', '>=', 52)), 'ch6.rv_mid']], 'ch6.rv_low');
  go('ch6.rv_high', [
    ['morishita', '安全、正確性、報連相。三つとも各部署の目安に届いています。'],
    ['morishita', 'ただし入口に立てただけ。在籍期間と資格は、数字で前借りできません。']
  ], 'ch6.cr_gate', null, HR(['morishita', 'kubota']));
  go('ch6.rv_mid', [
    ['morishita', '安全と正確性は、目安にあと一歩。報連相は場面で差があります。'],
    ['kubota', '「できた日」と「できなかった日」の差が大きい。安定が課題です。']
  ], 'ch6.cr_gate', null, HR(['morishita', 'kubota', 'shiraishi']));
  go('ch6.rv_low', [
    ['morishita', 'カチ。正直に言います。いくつかの項目が、目安に届いていません。', 'serious'],
    ['kubota', '失敗が多いのではなく、基本の確認が抜ける日がある。そこを埋めないと進めません。']
  ], 'ch6.cr_gate', null, HR(['morishita', 'kubota', 'shiraishi']));
  branch('ch6.cr_gate', [[F('ch5.recorded'), 'ch6.cr_rec'], [F('ch5.root_found'), 'ch6.cr_root']], 'ch6.cr_none');
  go('ch6.cr_rec', [
    ['morishita', '実績として一つ。五月の券売機。原因を自力で追い、全過程を出典つきで残した。', 'smile'],
    ['morishita', '机の上に、控えの束が置かれた。出典の欄が、一行ずつ、埋まっている。']
  ], 'ch6.wish_intro', [ev('reporting', 1)], HR(['morishita']));
  go('ch6.cr_root', [
    ['morishita', '五月の券売機。原因には自力で着いた。ただ、記録の残し方に余地がありました。'],
    ['morishita', '「見つけた」だけでは壁は越えられません。「残した」ところまでで実績です。']
  ], 'ch6.wish_intro', null, HR(['morishita']));
  go('ch6.cr_none', [
    ['morishita', '実績は、まだ一つに絞れる成果がありません。三か月目の人は、みんなそうです。'],
    ['shiraishi', 'これからの半年で何を実績に変えるか。今日はそれを決める日だ。']
  ], 'ch6.wish_intro', null, HR(['morishita', 'shiraishi']));

  // ---- 希望の選択（本作最大の分岐）----
  go('ch6.wish_intro', [
    ['morishita', '一つ、選んでください。複数ではなく。迷いは後で聞きます。'],
    ['shiraishi', 'どれも間違いじゃない。ただ、壁の高さが違う。']
  ], 'ch6.wish_choice', null, HR(['morishita', 'shiraishi', 'kubota'], '14:20 面談室 希望の確認'));
  choice('ch6.wish_choice', 'これから目指したい道は？', [
    opt('station', '「駅の専門職として、現場を極めたいです（上級駅務を目指します）」', 'ch6.wr_station', { tone: 'caring', hint: '上級駅務の選考は在籍18か月以降／三つの持ち場の経験が必要', effects: [set('ch6.wish_station'), ev('service', 2), rel('morishita', 1, 1), rel('shiraishi', 1, 1), lockE('wish_station_other', '希望は「駅の専門職」に決めた。基地・指令・計画は、今年度の希望からは外れた'), tl('6月24日 面談：駅の専門職（上級駅務）を希望'), log('異動希望：駅の専門職（上級駅務）', 'career')] }),
    opt('depot', '「車両基地で、検修の仕事を目指したいです」', 'ch6.wr_depot', { tone: 'careful', hint: '研修開始時点で在籍12か月・駅務基礎・基地入門が必要／枠2に候補7名／駅の推薦が先', effects: [set('ch6.wish_depot'), sk('depot', 3), tr('depot_intro', 5), { apply: { dept: 'depot', note: '三か月目面談で希望（来年度の候補検討の対象）' } }, rel('morishita', 1, 1), rel('tachibana', 1, 0), lockE('wish_depot_other', '希望は「車両基地」に決めた。駅・指令・計画は、今年度の希望からは外れた'), tl('6月24日 面談：車両基地・検修を希望'), log('異動希望：車両基地・検修', 'career')] }),
    opt('dispatch', '「輸送指令の仕事を目指したいです」', 'ch6.wr_dispatch', { tone: 'quick', hint: '新人から直接の道はない／現場3年以上と年1回の選考', effects: [set('ch6.wish_dispatch'), ev('reporting', 2), sk('ops', 3), { apply: { dept: 'planning', note: '輸送指令を見据えた輸送計画経由の希望' } }, rel('morishita', 1, 1), rel('hamaguchi', 1, 0), lockE('wish_dispatch_other', '希望は「輸送指令」に決めた。駅・基地・計画は、今年度の希望からは外れた'), tl('6月24日 面談：輸送指令を希望'), log('異動希望：輸送指令（現場経験と計画経由の道）', 'career')] }),
    opt('planning', '「輸送計画（ダイヤ）の仕事を目指したいです」', 'ch6.wr_planning', { tone: 'careful', hint: '在籍24か月・駅務基礎／枠1・文書力が問われる', effects: [set('ch6.wish_planning'), sk('ops', 3), ev('reporting', 2), { apply: { dept: 'planning', note: '三か月目面談で希望（在籍24か月が目安）' } }, rel('morishita', 1, 1), lockE('wish_planning_other', '希望は「輸送計画」に決めた。駅・基地・指令は、今年度の希望からは外れた'), tl('6月24日 面談：輸送計画を希望'), log('異動希望：輸送計画', 'career')] })
  ], { important: true, who: 'morishita', view: HR(['morishita', 'shiraishi', 'kubota'], '14:25 面談室 希望の選択') });

  // ---- 希望ごとの「異動の現実」 ----
  line('ch6.wr_station', [
    ['morishita', '駅の専門職。これは「行けるか」ではなく「いつ、どの水準で」の話です。'],
    ['morishita', '上級駅務は年一回、九月締め。在籍18か月、駅務基礎、窓口・ホーム・事務室の三つの持ち場。'],
    ['shiraishi', 'この駅の上級は今、一人。空くのは、その人が動いたときだけだ。'],
    ['kubota', '地味ですよ。でも梶原さんは「あの人がいる駅は安心」と言う。それは他では手に入りません。']
  ], 'ch6.wr_station_ev', { view: HR(['morishita', 'shiraishi', 'kubota']) });
  branch('ch6.wr_station_ev', [[E('service', '>=', 60), 'ch6.wr_station_hi']], 'ch6.wr_station_lo');
  go('ch6.wr_station_hi', [['kubota', '接客の評価は、もう目安です。課題は窓口以外の二つの持ち場。', 'smile']], 'ch6.wr_station_c', null, HR(['kubota']));
  go('ch6.wr_station_lo', [['kubota', '接客はあと少し。窓口の声かけを「できる日」から「毎日」に。']], 'ch6.wr_station_c', null, HR(['kubota']));
  branch('ch6.wr_station_c', [[F('ch6.concern'), 'ch6.wr_station_cc']], 'ch6.plan_station');
  go('ch6.wr_station_cc', [['shiraishi', '先の件は、この道で特に響く。後輩を任されるのは「報告が遅れない人」だ。', 'serious'], ['morishita', '記録は消えません。でも半年の使い方で、上書きはできます。']], 'ch6.plan_station', null, HR(['shiraishi', 'morishita']));
  line('ch6.wr_depot', [
    ['morishita', 'カチ。数字から。来年度の枠は2、希望は全社で7。', 'serious'],
    ['morishita', '条件は、研修開始時点で在籍12か月、駅務基礎、基地入門。評価は安全58・正確性56。いまは在籍3か月、研修は未受講です。']
  ], 'ch6.wr_depot_sl', { view: HR(['morishita', 'shiraishi', 'kubota']) });
  branch('ch6.wr_depot_sl', [[F('ch6.slot_yama_hold'), 'ch6.wr_depot_h'], [F('ch5.slot_player'), 'ch6.wr_depot_p'], [F('ch5.slot_yama'), 'ch6.wr_depot_y']], 'ch6.wr_depot_o');
  go('ch6.wr_depot_p', [
    ['shiraishi', '駅の推薦は、君だ。七人に入っている。「行きたい」より先に「駅が回る」が来るのは、変わらない。'],
    ['kubota', '山科さんも基地希望です。励みにもなるし、比べられもします。'],
    ['morishita', '7人中の2人。推薦は、入口です。駅長が「送りたい」と書ける実績が、続きます。']
  ], 'ch6.wr_depot_ev', null, HR(['morishita', 'shiraishi', 'kubota']));
  go('ch6.wr_depot_y', [
    ['shiraishi', '今年の駅の推薦は、山科だ。君は、七人の外。基地入門は、来年の公募に出す形になる。'],
    ['kubota', '見学枠は、今年から使えます。橘さんが、そう言っていました。'],
    ['morishita', '遅い道です。落とされた道では、ありません。']
  ], 'ch6.wr_depot_ev', null, HR(['morishita', 'shiraishi', 'kubota']));
  go('ch6.wr_depot_o', [
    ['shiraishi', '今年の駅の推薦は、空席だった。来年、出せる者を出す。それが、君であるように、半年で作れ。'],
    ['kubota', '山科さんも基地希望です。同じ席を、同じ日に狙うことになります。']
  ], 'ch6.wr_depot_ev', null, HR(['morishita', 'shiraishi', 'kubota']));
  go('ch6.wr_depot_h', [
    ['shiraishi', '山科の推薦は、再審査になった。三号機の件の記載で。君が話したことも、記録にある。', 'serious'],
    ['morishita', '駅の推薦は、確定していません。七人の枠は、まだ動きます。'],
    ['kubota', '……どちらにも、嘘はつけない日が、ありますね。']
  ], 'ch6.wr_depot_ev', null, HR(['morishita', 'shiraishi', 'kubota']));
  branch('ch6.wr_depot_ev', [[ALL(E('safety', '>=', 58), E('accuracy', '>=', 56)), 'ch6.wr_depot_hi']], 'ch6.wr_depot_lo');
  go('ch6.wr_depot_hi', [['morishita', '安全も正確性も目安に届いています。ほかの候補と並ぶ最低ラインには、もう立っている。', 'smile']], 'ch6.wr_depot_c', null, HR(['morishita']));
  go('ch6.wr_depot_lo', [['morishita', '安全か正確性が、まだ目安に届いていません。基地では数字ではっきり見られます。', 'serious']], 'ch6.wr_depot_c', null, HR(['morishita']));
  branch('ch6.wr_depot_c', [[F('ch6.concern'), 'ch6.wr_depot_cc']], 'ch6.plan_depot');
  go('ch6.wr_depot_cc', [['shiraishi', '基地は手順を一つ飛ばせば、人が死にうる現場だ。「飛ばした」「遅れた」の記録は、他より重く読まれる。', 'serious'], ['kubota', '厳しいですが、先に知っておいたほうがいい。']], 'ch6.plan_depot', null, HR(['shiraishi', 'kubota']));
  line('ch6.wr_dispatch', [
    ['morishita', '輸送指令。新人から直接の道は、ありません。希望は預かります。道は遠回りです。'],
    ['morishita', '現場三年以上、運行管理の基礎資格、年一回の選考。枠は一、二名。多くは駅や計画を経由します。'],
    ['shiraishi', '浜口さんも元は駅の助役だ。電話の向こうの駅の空気が分かる人が座る席だ。'],
    ['kubota', '第一章の旅行客への案内。確定と見込みを分ける、あれを一日数十回です。']
  ], 'ch6.wr_dispatch_ev', { view: HR(['morishita', 'shiraishi', 'kubota']) });
  branch('ch6.wr_dispatch_ev', [[ALL(E('reporting', '>=', 60), E('accuracy', '>=', 58)), 'ch6.wr_dispatch_hi']], 'ch6.wr_dispatch_lo');
  go('ch6.wr_dispatch_hi', [['morishita', '報連相と正確性は指令の目安です。入口の強みになります。', 'smile']], 'ch6.wr_dispatch_c', null, HR(['morishita']));
  go('ch6.wr_dispatch_lo', [['morishita', '報連相と正確性が、まだ届いていません。指令員の仕事そのものです。', 'serious']], 'ch6.wr_dispatch_c', null, HR(['morishita']));
  branch('ch6.wr_dispatch_c', [[F('ch6.concern'), 'ch6.wr_dispatch_cc']], 'ch6.plan_dispatch');
  go('ch6.wr_dispatch_cc', [['shiraishi', '指令員の命は報告の速さと正確さだ。「遅れた」の記録は、この道で一番重い。', 'serious'], ['kubota', '挽回は「次に同じ場面でどう動いたか」の積み重ねです。']], 'ch6.plan_dispatch', null, HR(['shiraishi', 'kubota']));
  line('ch6.wr_planning', [
    ['morishita', '輸送計画。在籍24か月、駅務基礎、報連相60・正確性58。枠は1。二年先の話です。'],
    ['morishita', '志望者は毎年います。落ちる理由の多くは文書力。'],
    ['morishita', 'カチ。……私も、昔ここを志望しました。通りませんでした。文書が甘かったんです。', 'normal'],
    ['kubota', '券売機で版と日付を並べたでしょう。あれは計画の仕事に近いです。']
  ], 'ch6.wr_planning_ev', { view: HR(['morishita', 'kubota']) });
  branch('ch6.wr_planning_ev', [[ALL(E('reporting', '>=', 60), E('accuracy', '>=', 58)), 'ch6.wr_planning_hi']], 'ch6.wr_planning_lo');
  go('ch6.wr_planning_hi', [['morishita', '評価は計画課の目安に届いています。最大の味方は時間です。', 'smile']], 'ch6.wr_planning_c', null, HR(['morishita']));
  go('ch6.wr_planning_lo', [['morishita', '報連相と正確性が、あと少し。計画課は文書の誤りに特に厳しい。']], 'ch6.wr_planning_c', null, HR(['morishita']));
  branch('ch6.wr_planning_c', [[F('ch6.concern'), 'ch6.wr_planning_cc']], 'ch6.plan_planning');
  go('ch6.wr_planning_cc', [['shiraishi', '計画の資料は版と根拠が命だ。出典や手順を飛ばした記録は、この道で最も嫌われる。', 'serious'], ['morishita', '逆に、そこを直した記録は誰より強い証拠になります。']], 'ch6.plan_planning', null, HR(['shiraishi', 'morishita']));

  // ---- 研修計画 ----
  const planChoice = (r, prompt, certL, certLowL, ojtL, ojtCL) => choice('ch6.plan_' + r, prompt, [
    opt('cert', certL, `ch6.pl_${r}_cert`, { tone: 'careful', requires: { not: E('accuracy', '<', 52) }, effects: [set('ch6.plan_cert'), set('next.plan_cert'), tr('station_basic', 20), ev('accuracy', 2), tl('6月24日 研修計画：資格取得の準備を優先')] }),
    opt('cert_low', certLowL, `ch6.pl_${r}_cert`, { tone: 'careful', requires: E('accuracy', '<', 52), effects: [set('ch6.plan_cert'), set('next.plan_cert'), tr('station_basic', 15), ev('accuracy', 3), tl('6月24日 研修計画：基礎の補習から資格の準備へ')] }),
    opt('ojt', ojtL, `ch6.pl_${r}_ojt`, { tone: 'caring', requires: NF('ch6.concern'), effects: [set('ch6.plan_ojt'), set('next.plan_ojt'), ev('teamwork', 2), ev('service', 1), tl('6月24日 研修計画：現場経験を優先')] }),
    opt('ojt_c', ojtCL, `ch6.pl_${r}_ojt`, { tone: 'honest', requires: F('ch6.concern'), effects: [set('ch6.plan_ojt'), set('next.plan_ojt'), ev('reporting', 2), ev('teamwork', 1), rel('shiraishi', 1, 1), tl('6月24日 研修計画：報告の信頼を積み直しながら現場経験を優先')] })
  ], { who: 'morishita', view: HR(['morishita', 'shiraishi', 'kubota'], '14:50 面談室 研修計画') });
  planChoice('station', 'これからの半年を、どう使いますか？（駅の専門職）',
    '駅務基礎の修了考査と、社内の接遇資格の勉強を、先に進める', '評価が目安に届いていないので、まず基礎の補習を受けてから駅務基礎の考査を目指す',
    '窓口・ホーム・事務室を順に経験し、持ち場を広げながら現場の信頼を積む', '報告の速さと記録の質を積み直しながら、窓口・ホーム・事務室を順に経験する');
  planChoice('depot', 'これからの半年を、どう使いますか？（車両基地）',
    '駅務基礎の修了考査と、基地入門研修の受講に向けた準備を、先に進める', '評価が目安に届いていないので、まず基礎の補習を受けてから駅務基礎の考査を目指す',
    '駅の仕事を任される水準まで上げつつ、基地の見学枠に通って現場を知る', '報告の速さと手順の遵守を積み直しながら、基地の見学枠にも通う');
  planChoice('dispatch', 'これからの半年を、どう使いますか？（輸送指令）',
    '運行管理の基礎講座と、駅務基礎の修了考査を、先に進める', '評価が目安に届いていないので、まず基礎の補習を受けてから駅務基礎の考査を目指す',
    '運行情報の取扱い・指令との連絡を、駅の現場でできるだけ多く経験する', '報告の速さを積み直しながら、運行情報の取扱いと指令との連絡を、駅の現場で経験する');
  planChoice('planning', 'これからの半年を、どう使いますか？（輸送計画）',
    'ダイヤ・輸送計画の基礎検定と、駅務基礎の修了考査を、先に進める', '評価が目安に届いていないので、まず基礎の補習を受けてから駅務基礎の考査を目指す',
    '混雑の集計や資料づくりの手伝いなど、計画に近い現場の仕事に関わる', '出典と手順を守る記録を積み直しながら、混雑の集計や資料づくりに関わる');

  const R = (id, lines) => line(id, lines, 'ch6.fs_gate', { view: HR(['morishita', 'shiraishi', 'kubota']) });
  R('ch6.pl_station_cert', [['morishita', '駅務基礎の考査は九月と十二月。九月に間に合えば、上級の要件を早く満たせます。'], ['kubota', '勉強は勤務の外です。睡眠は削らないで。成績に一番響く。', 'smile']]);
  R('ch6.pl_station_ojt', [['shiraishi', '窓口が得意な者ほど、ホームで一から学ぶ。そのたびに景色が変わる。'], ['morishita', '勤務表は私が調整します。休みは確保します。']]);
  R('ch6.pl_depot_cert', [['morishita', '基地入門は、駅務基礎の修了が前提。順番を飛ばせないのが基地の道です。'], ['shiraishi', '認定は、基地の研修のあと。今は触れない。焦らず待てるかだ。']]);
  R('ch6.pl_depot_ojt', [['shiraishi', '見学枠は研修日を使え。駅の勤務を削って行くな。'], ['morishita', '基地側の枠は月に数名。取れない月もあります。落ち込まないで。']]);
  R('ch6.pl_dispatch_cert', [['morishita', '運行管理の基礎講座は社内の通信講座です。勤務の合間に進められます。'], ['shiraishi', '習ったことは、駅の運行情報で必ず試せ。現場で使って本物になる。']]);
  R('ch6.pl_dispatch_ojt', [['shiraishi', '指令との連絡は運行情報の担当が一番多い。遅延の日の電話役を引き受けろ。'], ['morishita', '遅番を意識して入れます。休みも同時に確保します。']]);
  R('ch6.pl_planning_cert', [['morishita', 'ダイヤの基礎検定は年二回。駅務基礎と合わせて受けられます。'], ['shiraishi', '検定は手段だ。取ったら、ダイヤを「読む」現場へすぐ戻れ。']]);
  R('ch6.pl_planning_ojt', [['morishita', '計画課からの集計依頼を、駅が受ける形が少数あります。窓口は私がつなぎます。'], ['shiraishi', '駅の混雑は駅の人間が一番知っている。数字にして出せ。']]);

  // ================= 6月25日（金）：希望ごとの「最初の一歩」=================
  branch('ch6.fs_gate', [[F('ch6.wish_depot'), 'ch6.fs_depot'], [F('ch6.wish_dispatch'), 'ch6.fs_dispatch'], [F('ch6.wish_planning'), 'ch6.fs_planning']], 'ch6.fs_station');

  // -- 駅の専門職：「顔を集める」3D歩行 --
  line('ch6.fs_station', [
    '教育室の壁一面に、業務手順の色分けの紙。端の一枚だけ、誰かの手書きで書き足されている。',
    ['hoshino', '星野です。……それ、私が十年前に書き足したの。まだ誰も直さない。', 'smile'],
    ['hoshino', '最初に聞くのは、いつも同じ。この三か月で、お客様の顔をいくつ覚えてる？'],
    ['hoshino', '申込書の「実績」欄は、数えてから書きましょう。駅を、一周してきて。']
  ], 'ch6.fs_hub', { effects: [{ clock: { addDay: 1, minute: hm(9, 30) } }], view: OF(['hoshino'], '6月25日（金） 9:30 駅務区 教育室') });
  N['ch6.fs_hub'] = { id: 'ch6.fs_hub', type: 'hub', scene: 'station', title: '青嶺中央駅 顔を集める（6月25日・朝）', hint: '駅を一周して、これまで関わった方に会います。顔の数で、申込書の「実績」欄が変わります。', view: v3('follow', '6月25日 10:00 青嶺中央駅'), interactions: [],
    timed: [{ id: 'fs_late', at: hm(10, 50), goto: 'ch6.fs_st_br' }],
    goals: [{ id: 'g_faces', label: '二人以上の顔に会う', when: { var: { key: 'ch6.faces', op: '>=', val: 2 } } }],
    exit: { label: '教育室へ戻る', requires: { var: { key: 'ch6.faces', op: '>=', val: 2 } }, goto: 'ch6.fs_st_br' } };
  N['ch6.fs_hub'].interactions.push(
    { id: 'f_kaj', object: 'kajiwara', label: '梶原さん（常連のおばあさん）に会う', goto: 'ch6.f_kaj', requires: F('legacy.helped_kajiwara'), once: true, icon: '🙋' },
    { id: 'f_sak', object: 'sakai', label: '売店の坂井さんに会う', goto: 'ch6.f_sak', once: true, icon: '☕' },
    { id: 'f_tour', object: 'tourist2', label: '旅行客に会う', goto: 'ch6.f_tour', once: true, icon: '🧳' },
    { id: 'f_riku', object: 'riku', label: '木曜の夜の高校生に会う', goto: 'ch6.f_riku', requires: F('ch5.n_cust'), once: true, icon: '🎫' }
  );
  go('ch6.f_kaj', [['kajiwara', 'あら、今日は早いのね。この前の、あの券売機の使い方、孫に教えたのよ。', 'smile']], 'ch6.f_kaj_e', null, v3('npc:kajiwara', '9:45 コンコース'));
  fx('ch6.f_kaj_e', [{ var: { key: 'ch6.faces', add: 1 } }, time(10)], 'ch6.fs_hub');
  go('ch6.f_sak', [['sakai', '顔なんて、数えてないわよ。……ああ、でも、あなたのは、もう覚えた。', 'smile']], 'ch6.f_sak_e', null, v3('npc:sakai', '9:55 売店前'));
  fx('ch6.f_sak_e', [{ var: { key: 'ch6.faces', add: 1 } }, time(10)], 'ch6.fs_hub');
  go('ch6.f_tour', [['tourist2', 'Oh, you! 臨時のtrain、ありがとう。……Good job.', 'smile']], 'ch6.f_tour_e', null, v3('npc:tourist2', '10:05 改札前'));
  fx('ch6.f_tour_e', [{ var: { key: 'ch6.faces', add: 1 } }, time(10)], 'ch6.fs_hub');
  go('ch6.f_riku', [['riku', 'あ、あの夜の駅員さん。……あれから、一回も止まってないです。', 'smile']], 'ch6.f_riku_e', null, v3('npc:riku', '10:15 券売機の前'));
  fx('ch6.f_riku_e', [{ var: { key: 'ch6.faces', add: 1 } }, time(10)], 'ch6.fs_hub');
  branch('ch6.fs_st_br', [[{ var: { key: 'ch6.faces', op: '>=', val: 3 } }, 'ch6.fs_st_many'], [F('legacy.helped_kajiwara'), 'ch6.fs_st_kaji']], 'ch6.fs_st_task');
  go('ch6.fs_st_many', [
    ['hoshino', '……三つ以上。実績欄が、埋まります。数じゃないのに、数えると、嬉しい。', 'smile']
  ], 'ch6.fs_st_task', [], OF(['hoshino'], '11:00 教育室'));
  go('ch6.fs_st_kaji', [
    ['hoshino', '実績欄に使えるものが、もうあるかも。梶原さんが窓口であなたの名前を尋ねた記録。'],
    ['hoshino', 'お客様が覚えている。推薦書より強いの。', 'smile']
  ], 'ch6.fs_st_task', [], OF(['hoshino']));
  task('ch6.fs_st_task', 'checklist', '上級駅務 研修申込書の確認', '申込書に書く内容として、適切かどうかを判定します。', {
    config: { labels: ['書く', '書かない'] }, items: [
      { id: 'a', label: '「何でもやります」とだけ書く', truth: 'ng', why: '意欲は伝わりますが、判断材料になりません。' },
      { id: 'b', label: '自分が一番苦手だと思う場面を、避けずに書く', truth: 'ok', why: '苦手を知る人には、教える側が手を差し伸べられます。' },
      { id: 'c', label: '現場で自分が経験した場面と、そのとき考えたことを、具体的に書く', truth: 'ok', why: '具体的な場面が、現場の目を示します。' },
      { id: 'd', label: '同期の誰かの失敗を引き合いに、自分の優位を書く', truth: 'ng', why: '他人の失敗は、あなたの実績ではありません。' },
      { id: 'e', label: '勤務の希望（休みや研修の日程）の相談事項', truth: 'ok', why: '申込の時点で相談しておくほうが、お互いのためです。' },
      { id: 'f', label: 'お客様から頂いた声を、日付と窓口の記録の出典つきで書く', truth: 'ok', why: '出典があれば、他の人が確かめられます。' }]
  }, res3('ch6.fs_st_good', 'ch6.fs_st_mid', 'ch6.fs_st_bad', [ev('service', 2)], [ev('service', 1)], []), OF(['hoshino'], '申込書の確認'));
  go('ch6.fs_st_good', [['hoshino', '……私の十年前より、具体的。悔しいくらい。', 'smile']], 'ch6.fs_st_choice', null, OF(['hoshino']));
  go('ch6.fs_st_mid', [['hoshino', '「何を見て、どう考えたか」を一行足して。それだけで読み手が変わる。']], 'ch6.fs_st_choice', null, OF(['hoshino']));
  go('ch6.fs_st_bad', [['hoshino', '宿題にしましょう。来週、一緒に。私も最初は白紙だった。']], 'ch6.fs_st_choice', null, OF(['hoshino']));
  choice('ch6.fs_st_choice', 'どの研修コースを、第一希望にしますか？', [
    opt('guide', '接遇・案内コース（お客様対応と、困っている方への支援）', 'ch6.fs_st_end', { tone: 'caring', effects: [set('ch6.st_course_guide'), ev('service', 2), sk('service', 3)] }),
    opt('safety', '安全・異常時対応コース（遅延や事故の際の判断と連携）', 'ch6.fs_st_end', { tone: 'careful', effects: [set('ch6.st_course_safety'), ev('safety', 2), sk('patrol', 3)] })
  ], { view: OF(['hoshino']) });
  branch('ch6.fs_st_end', [[F('ch6.st_course_guide'), 'ch6.fs_st_eg']], 'ch6.fs_st_es');
  go('ch6.fs_st_eg', [['hoshino', '接遇。承りました。研修は秋から。……最初の課題は、一日で、お客様の名前を三つ聞くこと。', 'smile']], 'ch6.fs_st_fin', null, OF(['hoshino']));
  go('ch6.fs_st_es', [['hoshino', '異常時。承りました。研修は秋から。……最初の課題は、止まった電車の中の、一人を想像すること。']], 'ch6.fs_st_fin', null, OF(['hoshino']));
  go('ch6.fs_st_fin', [
    ['hoshino', 'それまでに、持ち場をあと二つ。派手な異動じゃない。十年後に「あの人に聞こう」と言われる人になる道。', 'smile'],
    '窓の外、ホームに立つ誰かの背中が見えた。三か月前の自分も、あんなふうに緊張していた。'
  ], 'ch6.after', [tl('6月25日 上級駅務の研修申込。星野さんと面談'), log('最初の一歩：上級駅務の研修申込', 'career')], OF(['hoshino']));

  // -- 車両基地：検修長の下で見習い申請 --
  line('ch6.fs_depot', [
    '朝の入出区が一段落した検修庫。機械油と、冷えた鉄の匂い。',
    ['tachibana', '駅長から連絡は受けた。見習いの申請だな。', 'normal'],
    ['tachibana', '先に言う。触らせん。見学枠の延長だ。研修日に、月二度。', 'serious'],
    ['tachibana', '推薦欄には署名する。何を書くかは、お前が決める。'],
    ['yamashina', '（少し離れた所で、背中を見ている。目が合うと小さく頷いた）']
  ], 'ch6.depot_find', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }], view: DP(['tachibana', 'yamashina'], '6月25日（金） 10:00 青浜総合車両センター 検修庫') });
  task('ch6.depot_find', 'find', '床下の観察（見学線の内側から）', '台車まわりの絵から、危ない箇所を、線の内側から探してタップします。触らず、見るだけです。', {
    config: { scene: 'gate', seconds: 45, props: [P(0.04, 0.15, 0.28, 0.35, '#4a5568', '台車'), P(0.36, 0.15, 0.28, 0.35, '#2f5d8a', '主電動機'), P(0.68, 0.15, 0.28, 0.35, '#2f7a56', 'ブレーキ装置'), P(0.04, 0.6, 0.5, 0.25, '#8a8f96', '検査記録票'), P(0, 0.9, 1, 0.08, '#e5b800', '黄色い線')], spots: [
      { id: 'oil', x: 0.2, y: 0.38, label: '台車のばね部に、油がにじんだ跡がある（記録して検修員へ報告）' }, { id: 'bolt', x: 0.82, y: 0.3, label: 'ブレーキ装置の締結部の合マークが、ずれて見える' }, { id: 'log', x: 0.28, y: 0.72, label: '検査記録票の日付の欄が、一行、空白になっている' }, { id: 'ok', x: 0.5, y: 0.35, real: false, label: '主電動機は、異常ありません' }] }
  }, res3('ch6.dp_good', 'ch6.dp_mid', 'ch6.dp_bad', [ev('safety', 2), sk('depot', 3)], [sk('depot', 1)], []), DP(['tachibana'], '床下の観察'));
  go('ch6.dp_good', [['tachibana', '……三つ。触らなかったのも、見た。', 'smile'], ['tachibana', '記録票の空白に気づいたな。駅の綴りで、積んだもんだ。']], 'ch6.dp_choice', null, DP(['tachibana']));
  go('ch6.dp_mid', [['tachibana', '半分か。見る目は年単位で育つ。待て。']], 'ch6.dp_choice', null, DP(['tachibana']));
  go('ch6.dp_bad', [['tachibana', '見えていないな。だが、見えていないと分かったのは収穫だ。', 'serious']], 'ch6.dp_choice', null, DP(['tachibana']));
  choice('ch6.dp_choice', '橘さんに、ひとつだけ質問できます。何を聞きますか？', [
    opt('night', '「夜勤や宿直は、実際、どのくらいありますか」', 'ch6.dp_q1', { tone: 'careful', effects: [set('ch6.dp_q_night')] }),
    opt('first', '「最初の一年で、何を任されるのでしょうか」', 'ch6.dp_q2', { tone: 'caring', effects: [] }),
    opt('miss', '「失敗したとき、ここでは、どう報告するのですか」', 'ch6.dp_q3', { tone: 'honest', effects: [set('ch6.dp_q_miss'), ev('reporting', 1)] })
  ], { view: DP(['tachibana']) });
  go('ch6.dp_q1', [['tachibana', '月に四、五回。宿直明けは必ず休み。連続は組まん。'], ['tachibana', '眠れん日は言え。言わん方が危ない。']], 'ch6.dp_end', null, DP(['tachibana']));
  go('ch6.dp_q2', [['tachibana', '一年目は見るだけ。二年目に認定、運搬と記録の補助。触るのは三年目だ。'], ['tachibana', '長いか。電車が走り続けるための長さだ。']], 'ch6.dp_end', null, DP(['tachibana']));
  go('ch6.dp_q3', [['tachibana', '失敗はその場で言え。言い訳は後でいい。「どこを、いつ、何を」だけだ。', 'serious']], 'ch6.dp_end', [rel('tachibana', 1, 0)], DP(['tachibana']));
  branch('ch6.dp_end', [[F('ch6.dp_q_miss'), 'ch6.dp_e_m'], [F('ch6.dp_q_night'), 'ch6.dp_e_n']], 'ch6.dp_e_f');
  go('ch6.dp_e_m', [
    ['tachibana', '推薦欄には、一行だけ書く。「失敗を、その場で言う者」。'],
    ['tachibana', '枠は2。希望は7。入ると約束はせん。だが、資格のある奴には席を空ける。']
  ], 'ch6.dp_fin', null, DP(['tachibana']));
  go('ch6.dp_e_n', [
    ['tachibana', '推薦欄には、「体調を、自分で言える者」と書く。残りは半年で埋めろ。'],
    ['tachibana', '枠は2。希望は7。入ると約束はせん。']
  ], 'ch6.dp_fin', null, DP(['tachibana']));
  go('ch6.dp_e_f', [
    ['tachibana', '推薦欄には、「駅で記録を残す習慣のある者」。それだけ書く。残りは半年で埋めろ。'],
    ['tachibana', '枠は2。希望は7。入ると約束はせん。だが、資格のある奴には席を空ける。']
  ], 'ch6.dp_fin', null, DP(['tachibana']));
  go('ch6.dp_fin', [['yamashina', '（帰り際）俺も出した。同じ紙だな。', 'smile']], 'ch6.after', [rel('tachibana', 1, 0), tl('6月25日 検修長に見習い（見学枠）の申請書を出す'), log('最初の一歩：基地見習い（見学枠）の申請', 'career')], DP(['tachibana', 'yamashina']));

  // -- 輸送指令：指令見学の申込 --
  line('ch6.fs_dispatch', [
    'ガラス越しに、壁一面の運行表示盤。音はほとんどないのに、空気だけが張りつめている。',
    ['hamaguchi', '電話でしか名乗ってなかったな。実物はこの顔だ。', 'smile'],
    ['sekiya', '主任の関谷だ。ここで見聞きしたことは外に出さない。三十分。座らせない。', 'serious'],
    ['hamaguchi', '指令の仕事は一言で「復唱」だ。一日何百回やっても、省けない。']
  ], 'ch6.dispatch_task', { effects: [{ clock: { addDay: 1, minute: hm(10, 30) } }], view: OF(['hamaguchi', 'sekiya'], '6月25日（金） 10:30 輸送指令所 見学受付') });
  task('ch6.dispatch_task', 'memory', '指令の復唱', '表示された連絡の手順を覚えて、同じ順に選んでください。指令の仕事は、順番が命です。', {
    config: { sequence: ['運転状況を確認', '指令番号を復唱', '時刻を記録', '関係箇所へ報告'], pool: ['運転状況を確認', '指令番号を復唱', '時刻を記録', '関係箇所へ報告', '見込みで先に伝える', '記録は後回し', '復唱を省く'], showMs: 5000, showLabel: '指令の連絡手順（見学用の模擬）', inputLabel: '手順を同じ順に選んでください' }
  }, res3('ch6.dc_good', 'ch6.dc_mid', 'ch6.dc_bad', [ev('reporting', 2), sk('ops', 3)], [sk('ops', 1)], []), OF(['sekiya'], '指令の復唱'));
  go('ch6.dc_good', [['sekiya', '順序が崩れなかった。記録を後回しにしなかったのも、見た。'], ['hamaguchi', '意味まで分かってる顔だな。']], 'ch6.dc_choice', null, OF(['sekiya', 'hamaguchi']));
  go('ch6.dc_mid', [['sekiya', '一か所、入れ替わった。実際なら、その一か所が列車を止める。']], 'ch6.dc_choice', null, OF(['sekiya']));
  go('ch6.dc_bad', [['hamaguchi', '最初は噛む。俺も半年噛んだ。'], ['sekiya', '噛むのはいい。省くのは許さん。']], 'ch6.dc_choice', null, OF(['sekiya', 'hamaguchi']));
  choice('ch6.dc_choice', '関谷主任に、どの場面の見学を、第一希望にしますか？', [
    opt('normal', '平常ダイヤの運用（時刻通りに回す仕事）の見学', 'ch6.dc_br', { tone: 'careful', effects: [ev('accuracy', 1)] }),
    opt('trouble', 'ダイヤが乱れたときの対応（現場との連絡）の見学', 'ch6.dc_br', { tone: 'risky', effects: [set('ch6.dc_view_trouble'), ev('reporting', 1)] })
  ], { view: OF(['sekiya']) });
  branch('ch6.dc_br', [[F('ch6.dc_view_trouble'), 'ch6.dc_e_t']], 'ch6.dc_e_n');
  go('ch6.dc_e_t', [
    ['sekiya', '乱れた場面は抽選だ。外れても文句は言うな。'],
    ['hamaguchi', '電話の向こうが慌てた声だと、こっちも慌てる。落ち着いた声なら、状況が見える。']
  ], 'ch6.dc_end', null, OF(['sekiya', 'hamaguchi']));
  go('ch6.dc_e_n', [
    ['sekiya', '平常の見学は、席が取りやすい。だが、平常を回す人間が、一番、乱れを嫌う。'],
    ['hamaguchi', '時刻通りが、当たり前に見えるのが、仕事だ。']
  ], 'ch6.dc_end', null, OF(['sekiya', 'hamaguchi']));
  go('ch6.dc_end', [
    ['hamaguchi', 'お前は今日、電話の「こちら側」を見た。指令になってもならなくても役に立つ。', 'smile'],
    ['sekiya', '指令は遠い。駅で三年。そこで何を積むかが問われる。']
  ], 'ch6.after', [rel('hamaguchi', 1, 1), tl('6月25日 輸送指令所の見学を申込む'), log('最初の一歩：指令見学の申込', 'career')], OF(['hamaguchi', 'sekiya']));

  // -- 輸送計画：ダイヤ資料室の手伝い --
  line('ch6.fs_planning', [
    '書架の間に、赤鉛筆の削りかすが落ちている。拾うと、まだ温かかった。',
    ['togashi', '富樫です。……それ、私のです。ダイヤ資料室へようこそ。', 'smile'],
    ['togashi', '元は駅の助役補佐。現場から来る人の気持ちは、少し分かります。'],
    ['togashi', '計画は「約束を数字にする」仕事。今日は入口だけ。資料を仕分けて。']
  ], 'ch6.planning_task', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }], view: HR(['togashi'], '6月25日（金） 10:00 本社 輸送計画課 ダイヤ資料室') });
  task('ch6.planning_task', 'sort', 'ダイヤ資料の仕分け', '資料を、「現行ダイヤ」「改正案」「会議資料」「他部署への照会」のどれに当たるかで分けます。', {
    config: { perItem: 12, bins: [{ id: 'now', label: '現行ダイヤ（運用中）' }, { id: 'draft', label: '改正案（検討中）' }, { id: 'meet', label: '会議資料' }, { id: 'ask', label: '他部署への照会' }], items: [
      { id: 'a', label: '「2027年3月改正 平日ダイヤ（確定版）」', bin: 'now', why: '確定版で、すでに運用されています。' },
      { id: 'b', label: '「秋のダイヤ改正案 第2版（朱書きあり）」', bin: 'draft', why: '検討中の案です。' },
      { id: 'c', label: '「第12回 ダイヤ調整会議 議事メモ」', bin: 'meet', why: '会議の記録です。決定事項は別に確認が必要です。' },
      { id: 'd', label: '「車両基地への入出区時刻の確認依頼（回答待ち）」', bin: 'ask', why: '他部署に回答を求めている文書です。' },
      { id: 'e', label: '「通勤時間帯の混雑集計（4月〜6月）」', bin: 'meet', why: '会議で使う根拠資料です。' },
      { id: 'f', label: '「臨時列車の運転計画案（夏季）」', bin: 'draft', why: '検討中の案で、運用前の資料です。' }] }
  }, res3('ch6.pt_good', 'ch6.pt_mid', 'ch6.pt_bad', [ev('accuracy', 2), sk('ops', 3)], [sk('ops', 1)], []), HR(['togashi'], 'ダイヤ資料の仕分け'));
  go('ch6.pt_good', [['togashi', '全部、正しい箱。「版」を見てから分けましたね。', 'smile']], 'ch6.pt_choice', null, HR(['togashi']));
  go('ch6.pt_mid', [['togashi', '「確定版」と「案」は、版の表記と日付で。それだけ守って。']], 'ch6.pt_choice', null, HR(['togashi']));
  go('ch6.pt_bad', [['togashi', '案を確定だと思い込むのが一番こわい間違い。次は版から読みましょう。']], 'ch6.pt_choice', null, HR(['togashi']));
  choice('ch6.pt_choice', '資料室で、次に手伝いたい仕事は？', [
    opt('count', '混雑の集計（駅の現場の数字を、表にまとめる）', 'ch6.pt_br', { tone: 'careful', effects: [set('ch6.pt_count'), ev('accuracy', 1), sk('ops', 1)] }),
    opt('minutes', '会議の議事メモの清書（決定事項と未決事項を分けて書く）', 'ch6.pt_br', { tone: 'honest', effects: [set('ch6.pt_minutes'), ev('reporting', 2)] }),
    opt('ask', '他部署への照会文の下書き（誰に何を、どう聞くか）', 'ch6.pt_br', { tone: 'caring', effects: [ev('teamwork', 1)] })
  ], { view: HR(['togashi']) });
  branch('ch6.pt_br', [[F('ch6.pt_count'), 'ch6.pt_e_c'], [F('ch6.pt_minutes'), 'ch6.pt_e_m']], 'ch6.pt_e_a');
  go('ch6.pt_e_c', [['togashi', '混雑の集計。駅の人間が出す数字は、現場の呼吸が入ってる。まずは、五月の木曜から。']], 'ch6.pt_end', null, HR(['togashi']));
  go('ch6.pt_e_m', [['togashi', '議事メモの清書。「決定」と「未決」を混ぜた会議は、後で必ず、揉めます。']], 'ch6.pt_end', null, HR(['togashi']));
  go('ch6.pt_e_a', [['togashi', '照会文。誰に、何を、いつまでに。三つ揃えば、返事は来ます。']], 'ch6.pt_end', null, HR(['togashi']));
  go('ch6.pt_end', [
    ['togashi', '手伝いは月一度、半日。勤務に無理のない形で。'],
    ['togashi', '計画は「誰かの一日を数字で預かる」仕事。一つ違えば、ホームで誰かが待たされる。'],
    '書架の向こうで、誰かが赤鉛筆を走らせる音だけが、静かに続いていた。'
  ], 'ch6.after', [tl('6月25日 ダイヤ資料室の手伝いを申込む'), log('最初の一歩：ダイヤ資料室の手伝い', 'career')], HR(['togashi']));

  // ================= 合流：同じ駅の夕方。ただし、選んだ道は消えない =================
  go('ch6.after', [
    '夕方の事務室。窓の外を、帰宅する人の流れが通り過ぎていく。',
    ['kubota', 'お帰りなさい。駅長から聞きました。', 'normal']
  ], 'ch6.af_gate', [{ clock: { minute: hm(17, 30) } }], OF(['kubota'], '17:30 駅事務室'));
  branch('ch6.af_gate', [[F('ch6.wish_depot'), 'ch6.af_depot'], [F('ch6.wish_dispatch'), 'ch6.af_dispatch'], [F('ch6.wish_planning'), 'ch6.af_planning']], 'ch6.af_station');
  go('ch6.af_station', [
    ['kubota', '駅に残る道。実は、嬉しかったです。同じ地面を歩く人が増えるので。', 'smile'],
    ['kubota', '来週から持ち場を回ります。窓口だけの人から、駅を見る人へ。']
  ], 'ch6.af_yama', [rel('kubota', 1, 2)], OF(['kubota']));
  go('ch6.af_depot', [
    ['kubota', '基地。驚きません。機械の中でなく手順を見ていた人ですから。', 'smile'],
    ['kubota', '覚悟を。基地は「待つ」道です。待つあいだ、駅の仕事は減りません。']
  ], 'ch6.af_yama', [rel('kubota', 1, 1)], OF(['kubota']));
  go('ch6.af_dispatch', [
    ['kubota', '指令。遠い道です。三年は駅にいます。', 'normal'],
    ['kubota', 'あの旅行客の日に「確定と見込み」を分けられなかった人が、その仕事を目指す。道筋は見えます。']
  ], 'ch6.af_yama', [rel('kubota', 1, 1)], OF(['kubota']));
  go('ch6.af_planning', [
    ['kubota', '計画。券売機の記録を並べていた人が、図面を引く人になる。想像できます。', 'smile'],
    ['kubota', '二年は駅です。「数字になる前の話」を全部聞いてきて。']
  ], 'ch6.af_yama', [rel('kubota', 1, 1)], OF(['kubota']));

  // -- 山科との、希望のすれ違い（宣言と、最終的な希望の食い違いを、別々に受ける） --
  branch('ch6.af_yama', [
    [ALL(F('ch6.wish_depot'), F('ch6.told_depot')), 'ch6.yy_rival'],
    [ALL(F('ch6.wish_depot'), F('ch6.told_other')), 'ch6.yy_surprise'],
    [F('ch6.wish_depot'), 'ch6.yy_surprise_o'],
    [F('ch6.told_depot'), 'ch6.yy_changed'],
    [F('ch6.told_open'), 'ch6.yy_relief_o']
  ], 'ch6.yy_relief');
  go('ch6.yy_rival', [
    ['yamashina', '……同じ紙、出したな。', 'normal'],
    ['yamashina', '7人中の2人。俺かお前か、落ちるかもしれない。怖いよ。'],
    ['player', '決まってない。今日から半年、同じ条件で始めよう。'],
    ['yamashina', '競争するなら、お前とがいい。互いの記録を読み合おう。', 'smile']
  ], 'ch6.fam_end', [rel('yamashina', 2, 2)], OF(['yamashina']));
  go('ch6.yy_surprise', [
    ['yamashina', '……基地、選んだのか。「別の道かも」って言ってたのに。', 'surprise'],
    ['player', '面談で聞いて、変わった。先に言えなくてごめん。'],
    ['yamashina', '……お前が別の道だと思って、勝手に安心してた。勝手な話だ。'],
    ['yamashina', '同じ道なら、負けられないな。', 'normal']
  ], 'ch6.fam_end', [rel('yamashina', 0, 1)], OF(['yamashina']));
  go('ch6.yy_surprise_o', [
    ['yamashina', '……基地か。「まだ決められない」って言ってたのに。', 'surprise'],
    ['player', '面談で話して、決まった。'],
    ['yamashina', '決めたなら、貫けよ。……俺も、そうする。', 'normal']
  ], 'ch6.fam_end', [rel('yamashina', 1, 1)], OF(['yamashina']));
  go('ch6.yy_changed', [
    ['yamashina', '基地じゃなかったんだな。「私も基地を目指すかも」って言ってたのに。', 'normal'],
    ['player', '面談で変わった。先に言うべきだった。ごめん。'],
    ['yamashina', '責めてない。ほっとした。……けど、少し寂しい。同じ道を歩く奴が、いなくなった。'],
    ['yamashina', '決めたなら貫けよ。半年後、また会おう。', 'smile']
  ], 'ch6.fam_end', [rel('yamashina', 1, 1)], OF(['yamashina']));
  go('ch6.yy_relief_o', [
    ['yamashina', '「まだ決められない」って言ってたのに、決めたんだな。基地じゃない、道。', 'normal'],
    ['yamashina', '……少し、期待してた。同じ道に来るかもしれない、って。いや、ほっとしてもいる。両方だ。'],
    ['player', '山科も、基地が取れるといい。']
  ], 'ch6.fam_end', [rel('yamashina', 1, 1)], OF(['yamashina']));
  go('ch6.yy_relief', [
    ['yamashina', '決めたんだな。基地じゃない道。……正直ほっとしてる。嫌な言い方でごめん。', 'normal'],
    ['yamashina', '同期が違う道に行くのはいい。何年か後に、話せることが増える。'],
    ['player', '山科も、基地が取れるといい。'],
    ['yamashina', '取る。取れなくても、積んだものは残る。橘さんに教わった。', 'smile']
  ], 'ch6.fam_end', [rel('yamashina', 1, 2)], OF(['yamashina']));

  // -- 家族への一通 --
  branch('ch6.fam_end', [[F('ch6.family_open'), 'ch6.fe_open'], [F('ch6.family_promise'), 'ch6.fe_promise']], 'ch6.fe_quiet');
  go('ch6.fe_open', [
    '夜。母から短いメッセージが届いていた。',
    ['jikka', '決めたのね。どこで働いても、体だけは大事に。冬に顔を見せてね。', 'smile'],
    '返信を打つ指に、ペンのカチ、という音がよみがえった。今度は、自分で鳴らす番だ。'
  ], 'ch6.fe_note', null, HR(['jikka'], '夜 社員寮の自室'));
  go('ch6.fe_promise', [
    '夜。勤務表のお盆の週に、休暇申請の空欄がある。',
    ['jikka', '（メッセージ）お盆、本当に帰れる？ 弟が楽しみにしてるわ。', 'smile'],
    '「お願いの仕方で」。森下宛ての休暇相談の下書きを、書きはじめた。'
  ], 'ch6.fe_note', [set('ch6.obon_request')], HR(['jikka'], '夜 社員寮の自室'));
  go('ch6.fe_quiet', [
    '夜。母から「ちゃんと食べてる？」とだけ届いた。',
    '「今日、面談で」と打っては消し、結局「食べてる。元気」とだけ送った。窓の外で、雨が降りはじめた。'
  ], 'ch6.fe_note', null, HR([], '夜 社員寮の自室'));
  branch('ch6.fe_note', [[F('ch6.note_kept'), 'ch6.fn_k'], [F('ch6.note_returned'), 'ch6.fn_r']], 'ch6.end');
  go('ch6.fn_k', ['手帳の最後の頁に、黄色い付箋。宮前の字の下に、自分の字で、一行を足した。「次の人へ」。'], 'ch6.end', null, HR([], '夜 社員寮の自室'));
  go('ch6.fn_r', ['手帳の最後の頁は、白い。台紙の跡だけが、四角く、残っている。'], 'ch6.end', null, HR([], '夜 社員寮の自室'));

  N['ch6.end'] = { id: 'ch6.end', type: 'end', chapter: 'ch6', title: '第6章 三か月目の面談', nextChapter: 'ch7',
    summary: '三か月目の面談で、異動は「希望すれば行ける」ものではないと知った。人数、資格、評価、時間、実績の壁。駅の推薦は誰かに渡り、世話になった人は、それぞれの異動先へ去った。一つの道を選び、最初の一歩を踏み出した。選んだ道は、これから先の章を、別々の景色にしていく。',
    effects: [tl('6月25日 三か月目の面談を終える。進む道を一つ選ぶ'), log('第6章を終了', 'chapter')] };
}
