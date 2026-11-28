// R7 第3章「はじめての早番」（4月18日(日)夜〜19日(月)朝）。
// 構造：前夜（山科の電話＝時限選択）→ 夜明け前から10:30までのハブ（業務は時間に収まらない）→ 津村の最後の朝（時限選択）→ 眠気（時限選択）→ 朝食と杉浦の後継者話（時限選択）。
// モチーフ：杉浦助役の「鍵束の音」。夜明け・点呼・開錠・失敗・最後の夢で、少しずつ意味が変わる。
// 欲しいもの／隠していること：杉浦＝鍵を預ける後継者が欲しい／来年定年、昔の誤放送。津村＝毎朝の「おはよう」／今日が最後、妻の入院。
// 取り返しのつかない変化：津村は4月19日を最後に始発に乗らなくなる（depart）。杉浦が別れを言えたか（lock sugiura_goodbye）、鍵を預かる道（lock sugiura_key）、後任候補になる代償（lock late_shift_pref）。
// 後の章が読むフラグ一覧：docs/analysis/handoff-ch2-3.md
export default function ch3(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, mini, hub, P, res3, chk } = k;
  const REL = (char, key, op, val) => ({ rel: { char, key, op, val } });
  const GONE = id => ({ gone: id });
  const lock = (id, note) => ({ lock: { id, note } });
  const depart = (char, note) => ({ depart: { char, note } });

  // ---- 人物 ----
  characters.sugiura = { id: 'sugiura', name: '杉浦 恒夫', kana: 'すぎうら つねお', role: '駅務助役（早番担当）', dept: 'station', age: 57, years: 35, uniform: '#1d2a44', hair: '#8a8a86', skin: '#dcb48c', trait: '口数は少ないが、朝の駅のことは何でも知っている。無理をしている人をすぐ見抜く。', bio: '早番を二十五年担当してきた助役。久保田が新人の頃、早番を教えた人。', gender: 'm', accessory: 'cap' };
  characters.tsumura = { id: 'tsumura', name: '津村 和夫', kana: 'つむら かずお', role: '利用者（始発の常連）', dept: 'none', age: 67, years: 0, uniform: '#5a6a5a', hair: '#c8c8c8', skin: '#dcb48c', trait: '海浜口の食堂の仕込みのため、二十五年、毎朝この始発に乗っている。', bio: '杉浦助役とは、改札越しの「おはよう」だけで二十五年の付き合い。', gender: 'm', accessory: 'bag' };

  // ---- 持ち場の判定（route.* が無ければ接客ルートを既定とする） ----
  const PLAT = F('route.platform'), OFFC = F('route.office'), SVC = ALL(NF('route.platform'), NF('route.office'));
  const BR = F('ch3.briefed');
  const HR = (who, cap) => v25('hr', who, cap), OF = (who, cap) => v25('office', who, cap);

  // 最短経路コスト（経路課題の「最短」算出用）
  const bestRoute = (grid, must) => { const H = grid.length, W = grid[0].length; let s; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) { q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi; const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); } } }
    return 20; };

  // =====================================================================
  // 前夜（4月18日 日曜 20:30）：第2章の昼の過ごし方が、夜のメッセージに残る
  // =====================================================================
  line('ch3.open', [
    '目覚ましは二台。まだ鳴ってもいないのに、胃が先に早起きしている。',
    '日曜の夜八時半。明日は、初めての早番だ。',
    ['kubota', '（メッセージ）勤務間隔の欄、見ましたか。見ていない人ほど「見ました」と返します。'],
    ['player', '（見ました、という返事を、今から本当にしよう）']
  ], 'ch3.open_b', { effects: [{ clock: { addDay: 13, minute: hm(20, 30) } }, tl('4月18日 初めての早番の前夜'), log('第3章 はじめての早番', 'chapter')], view: HR(['kubota'], '4月18日（日） 20:30 社員寮') });
  branch('ch3.open_b', [[F('ch2.lunch_yamashina'), 'ch3.op_y'], [F('ch2.lunch_kubota'), 'ch3.op_k'], [F('ch2.lunch_alone'), 'ch3.op_a']], 'ch3.eve_task');
  line('ch3.op_y', [['yamashina', '（メッセージ）昼に話したこと、誰にも言うなよ。推薦は一名。……おやすみ。']], 'ch3.eve_task', { view: HR(['yamashina']) });
  line('ch3.op_k', [['kubota', '（メッセージ）あの日、隣に座ってくれて、嬉しかったです。早く寝てください。', 'smile']], 'ch3.eve_task', { view: HR(['kubota']) });
  line('ch3.op_a', [['kubota', '（メッセージ）あの日のお昼、声をかければよかったです。明日の朝食は、一緒に。']], 'ch3.eve_task', { view: HR(['kubota']) });

  N['ch3.eve_task'] = { id: 'ch3.eve_task', type: 'task', kind: 'checklist', title: '前夜の確認', intro: '早番の前夜の過ごし方について、正しい記述か、誤りかを判断してください。', config: { labels: ['正しい', '誤り'] },
    items: [
      { id: 'interval', label: '前回の終業は17:15、明日の始業は5:30。勤務間隔は12時間15分あり、社内規程の「11時間以上」を満たしている', truth: 'ok', why: '前の勤務の終わりから次の始業まで、規程で定められた間隔が空いています。' },
      { id: 'walk', label: '寮から駅まで徒歩約12分。4:50に出れば5:05に着き、始業前に身支度を整える余裕がある', truth: 'ok', why: '始発前は電車がありません。徒歩の時間を含めて逆算しておきます。' },
      { id: 'alarm', label: '目覚ましはスマートフォン1台で十分。電池が切れても、朝は自然に起きられるはず', truth: 'ng', why: '早番は遅刻が許されません。目覚ましは複数用意し、電池や音量も前夜に確認します。' },
      { id: 'drink', label: '眠れなくても、栄養ドリンクを飲めば、睡眠の代わりになる', truth: 'ng', why: '睡眠の代わりになるものはありません。眠れない夜は、体を休めること自体が大切です。' },
      { id: 'study', label: '手順書の予習は大切だが、睡眠を大きく削ってまで行うと、翌朝の判断力が落ちる', truth: 'ok', why: '眠気は、見落としや言い間違いの原因になります。予習は、睡眠を削らない範囲で。' },
      { id: 'sick', label: '朝、体調に不安があるときは、始業前でも事務室へ電話して相談してよい', truth: 'ok', why: '体調の相談は、遠慮せず早めに。事前の連絡のほうが、職場の対応も取りやすくなります。' }
    ],
    results: res3('ch3.eve_ring', 'ch3.eve_ring', 'ch3.eve_ring', [ev('accuracy', 3), ev('safety', 2)], [ev('accuracy', 1)], [ev('accuracy', -2), ev('safety', -1)]), view: HR(['kubota'], '4月18日（日） 20:45 社員寮') };

  // ---- 21:30 山科の着信（時限選択）：出る／出ない／決められない ----
  branch('ch3.eve_ring', [[F('ch2.yama_will_call'), 'ch3.ring_w']], 'ch3.ring_n');
  line('ch3.ring_w', ['二十一時三十分。携帯が震えた。山科。「電話するかもしれない」は、本当になった。', '三回、四回。目覚ましを止める指が、画面の上で止まっている。'], 'ch3.eve_choice', { view: HR(['yamashina'], '4月18日（日） 21:30 社員寮') });
  line('ch3.ring_n', ['二十一時三十分。携帯が震えた。山科。……珍しい。', '三回、四回。目覚ましを止める指が、画面の上で止まっている。'], 'ch3.eve_choice', { view: HR(['yamashina'], '4月18日（日） 21:30 社員寮') });
  choice('ch3.eve_choice', '着信が、鳴り続けている。', [
    opt('help', '出る。山科の志望書を、一緒に書く', 'ch3.eve_help', { tone: 'caring', effects: [set('ch3.helped_yama'), rel('yamashina', 2, 2)] }),
    opt('sleep', '出ない。「ごめん、明日早い」とだけ送って、寝る', 'ch3.eve_sleep', { tone: 'careful', effects: [set('ch3.slept_well'), rel('yamashina', 0, -1)] }),
    opt('study', '出ない。画面を伏せて、手順書を読み込む', 'ch3.eve_study', { tone: 'risky', effects: [set('ch3.drilled'), rel('yamashina', 0, -1)] }),
    opt('ring', '画面を見つめたまま、何もしない', 'ch3.eve_ring2', { effects: [set('ch3.yama_unanswered'), rel('yamashina', 0, -2)] })
  ], { important: true, timeLimit: 12, defaultOption: 'ring', who: 'yamashina', view: HR(['yamashina']) });

  line('ch3.eve_help', [
    ['yamashina', '眠れないわけじゃない。目が冴えてるだけだ。'],
    ['player', '……何かあったんだな。'],
    ['yamashina', '基地入門研修の志望書。締切は明後日。一行も書けてない。']
  ], 'ch3.eve_help_b', { view: HR(['yamashina'], '4月18日（日） 21:35 社員寮') });
  branch('ch3.eve_help_b', [[F('ch2.yama_confided'), 'ch3.eh_known']], 'ch3.eh_new');
  line('ch3.eh_known', [['player', '昼に言ってたやつだな。'], ['yamashina', '……覚えてたのか。']], 'ch3.eh_mid', { view: HR(['yamashina']) });
  line('ch3.eh_new', [['yamashina', '推薦は、駅から一名だけだ。……言ってなかったな。'], ['player', '一名。']], 'ch3.eh_mid', { view: HR(['yamashina']) });
  line('ch3.eh_mid', [
    '「なぜ、車両なのか」。山科は、その一行で、四十分、止まっていた。',
    ['player', '最初に床下を見た日のこと、書けばいい。図面と、全然違ったって言ってたろ。'],
    '二十三時五十分。志望書は、三行だけ、書けた。'
  ], 'ch3.eh_end', { view: HR(['yamashina'], '4月18日（日） 23:50 社員寮') });
  line('ch3.eh_end', [
    ['yamashina', '借りだな。……この一名は、俺が取る。'],
    ['player', '（明日の自分に、手順書は任せた）']
  ], 'ch3.wake', { view: HR(['yamashina']) });
  line('ch3.eve_sleep', [
    'メッセージを一通だけ送った。「ごめん、明日早い。」',
    '二台の目覚ましを、わざと別の音にした。並べると、小さな合唱団だ。',
    '二十一時四十分、消灯。通知は一度だけ光って、消えた。'
  ], 'ch3.wake', { effects: [time(30)], view: HR([], '4月18日（日） 21:40 社員寮') });
  line('ch3.eve_study', [
    '画面を伏せた。着信は、机の上で、震えたまま止まった。',
    '手順書の三ページ目で、同じ行を三回読んでいた。',
    ['player', '（照明、改札、券売機、シャッター。……照明、何だっけ）'],
    '二十三時四十分。目を閉じても、手順の文字が天井を流れていく。'
  ], 'ch3.wake', { effects: [time(30)], view: HR([], '4月18日（日） 23:40 社員寮') });
  line('ch3.eve_ring2', [
    '画面を、見つめていた。出るでも、切るでもなく。',
    '鳴り止んだあとの部屋は、前より静かになった。',
    '眠れなかった。二時を回っても、天井が近い。'
  ], 'ch3.wake', { effects: [time(30)], view: HR([], '4月19日（月） 2:10 社員寮') });

  branch('ch3.wake', [[F('ch3.slept_well'), 'ch3.wake_a']], 'ch3.wake_b', {});
  line('ch3.wake_a', ['四時十分。二台の合唱で、きちんと起きた。', '窓を開けると、空気が冷たくて、少し甘い。'], 'ch3.arrive', { effects: [{ clock: { addDay: 1, minute: hm(4, 10) } }, tl('4月19日 初めての早番の朝')], view: HR([], '4月19日（月） 4:10 社員寮') });
  line('ch3.wake_b', ['二台目の目覚ましで目が開いた。一台目は、止めたことすら覚えていない。', '窓を開けても、頭の奥の霧は晴れない。'], 'ch3.arrive', { effects: [{ clock: { addDay: 1, minute: hm(4, 10) } }, tl('4月19日 初めての早番の朝')], view: HR([], '4月19日（月） 4:10 社員寮') });
  line('ch3.arrive', [
    'シャッターの降りた改札の奥で、非常灯の緑だけが起きている。',
    '午前五時五分。始業まで、二十五分。この時間は、自分のものだ。'
  ], 'ch3.hub', { effects: [{ clock: { minute: hm(5, 5) } }], view: v3('plaza', '4月19日（月） 5:05 青嶺中央駅 駅前') });

  // =====================================================================
  // 早番のハブ（5:05〜10:30）：朝の依頼は、時間に収まらない
  // =====================================================================
  hub('ch3', {
    title: '青嶺中央駅 早番（4月19日・月）', hint: '夜明け前の駅を歩き、始発までの準備を進めます。時間は静かに進みます。',
    timed: [
      { id: 'sunrise', at: hm(5, 14), goto: 'ch3.sunrise' },
      { id: 'brief', at: hm(5, 30), goto: 'ch3.brief' },
      { id: 'first', at: hm(5, 55), goto: 'ch3.first' },
      { id: 'sleepy', at: hm(8, 40), goto: 'ch3.sleepy' },
      { id: 'close', at: hm(10, 30), goto: 'ch3.breakfast' }
    ],
    goals: [
      { id: 'g_brief', label: '点呼と夜勤からの引継ぎ（5:30）', when: BR },
      { id: 'g_first', label: '始発列車を見送る（5:55）', when: F('ch3.first_done') },
      { id: 'g_sleepy', label: '体調の確認（8:40ごろ）', when: F('ch3.sleepy_done') },
      { id: 'g_break', label: '朝の休憩（10:30）', when: F('ch3.break_done') }
    ],
    exit: { label: '朝の休憩へ（10:25以降）', requires: ALL(BR, F('ch3.sleepy_done'), T('>=', hm(10, 25))), goto: 'ch3.breakfast' }
  });

  // ---- 夜明け（5:14） ----
  line('ch3.sunrise', [
    '五時十四分。ちゃり、と金属の音がした。静かすぎて、やけに大きい。',
    '駅舎の入口で、杉浦助役が鍵束を揃えていた。誰もいないはずの時間に。',
    ['sugiura', '空を見ろ。三十秒で変わる。'],
    '藍色が端から剥がれ、橙がにじむ。窓ガラスの中で、非常灯の緑と重なった。'
  ], 'ch3.hub', { effects: [log('夜明けの青嶺中央駅', 'work')], view: v3('plaza', '5:14 駅前 夜明け') });

  // ---- 点呼と夜勤からの引継ぎ（5:30）----
  line('ch3.brief', [
    '五時三十分。杉浦の鍵束が机に置かれ、ちゃり、と鳴った。',
    ['sugiura', '責任者の杉浦だ。久保田と、新人。よろしく。', 'normal'],
    ['sugiura', '十時半に休憩だ。'],
    ['kubota', '夜間の異常は一件。二番線の照明が一灯切れ。交換は昼、立入注意です。'],
    ['sugiura', '新人。今のを、あとで復唱しろ。']
  ], 'ch3.brief_note', { view: OF(['sugiura', 'kubota'], '5:30 駅事務室 点呼') });

  // 第2章の選択と、その後の出来事を、杉浦の一言で読み分ける
  branch('ch3.brief_note', [
    [F('ch2.idea_selfpost'), 'ch3.bn_self'],
    [F('ch2.idea_boss'), 'ch3.bn_boss'],
    [F('ch2.idea_consult'), 'ch3.bn_cons'],
    [F('ch2.idea_skip'), 'ch3.bn_skip']], 'ch3.bn_none');
  line('ch3.bn_self', [['sugiura', '駅長のメモだ。貼り紙の件。'], ['sugiura', '久保田が、頭を下げたそうだな。']], 'ch3.bn_self_b', { view: OF(['sugiura', 'kubota']) });
  branch('ch3.bn_self_b', [[F('ch2.owned_up'), 'ch3.bn_s_own'], [F('ch2.repaired'), 'ch3.bn_s_rep'], [F('ch2.defended'), 'ch3.bn_s_def'], [F('ch2.kubota_covered'), 'ch3.bn_s_cov']], 'ch3.focus');
  line('ch3.bn_s_own', [['sugiura', '駅長室に、自分で行ったそうだな。'], ['sugiura', '……それだけだ。']], 'ch3.focus', { effects: [rel('sugiura', 1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_s_rep', [['sugiura', '払い戻しの客に、電話したのは誰だ。'], ['player', '私です。'], ['sugiura', '……そうか。']], 'ch3.focus', { effects: [rel('sugiura', 1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_s_def', [['sugiura', '「宇野さんは買えた」と言ったそうだな。久保田の前で。'], '久保田は、書類から目を上げなかった。'], 'ch3.focus', { effects: [rel('sugiura', -1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_s_cov', [['sugiura', '久保田が、一人で持ったそうだな。'], '誰も、それ以上は言わなかった。'], 'ch3.focus', { effects: [rel('sugiura', -1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_boss', [['sugiura', '駅長に、直接か。'], ['kubota', '……']], 'ch3.bn_boss_b', { view: OF(['sugiura', 'kubota']) });
  branch('ch3.bn_boss_b', [[F('ch2.kubota_hurt'), 'ch3.bn_b_h']], 'ch3.focus');
  line('ch3.bn_b_h', [['sugiura', '久保田は、あの日から、口数が減った。'], ['sugiura', 'お前のせいとは、言わん。']], 'ch3.focus', { effects: [rel('sugiura', 0, -1)], view: OF(['sugiura', 'kubota']) });
  branch('ch3.bn_cons', [[ALL(F('ch2.proposal_sent'), F('ch2.proposal_fast')), 'ch3.bn_posted'], [F('ch2.proposal_sent'), 'ch3.bn_pending']], 'ch3.bn_redo');
  line('ch3.bn_posted', [['sugiura', '券売機の案内、今朝から貼ってある。見たか。'], ['sugiura', '……悪くない。仕事のあとで見てこい。', 'smile']], 'ch3.focus', { effects: [rel('sugiura', 1, 1)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_pending', [['sugiura', '提案書は、本社の返事待ちだそうだな。'], ['sugiura', '券売機の前で、まだ迷う客がいる。……待つのも、仕事だ。']], 'ch3.focus', { effects: [rel('sugiura', 1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_redo', [['sugiura', '提案書は、出し直しだそうだな。'], ['sugiura', '出し直せる分、まだいい。']], 'ch3.focus', { view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_skip', [['sugiura', '駅長のメモだ。「気づいたことは声にしろ」。']], 'ch3.bn_skip_b', { view: OF(['sugiura', 'kubota']) });
  branch('ch3.bn_skip_b', [[GONE('uno'), 'ch3.bn_gone']], 'ch3.focus');
  line('ch3.bn_gone', [['sugiura', '券売機の前にいた客が、一人、来なくなったそうだ。'], ['sugiura', '窓口に回した、あの人だな。']], 'ch3.focus', { view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_none', [['sugiura', '駅長のメモは、今日は白紙だ。'], ['sugiura', '白紙の日は、自分で書け。']], 'ch3.focus', { view: OF(['sugiura', 'kubota']) });

  // 第2章の研修枠が、今朝の持ち物になる
  branch('ch3.focus', [[F('next.focus_accuracy'), 'ch3.fc_acc'], [F('next.focus_team'), 'ch3.fc_team'], [F('next.focus_service'), 'ch3.fc_svc']], 'ch3.handover_task');
  line('ch3.fc_acc', [['sugiura', '指差しの型が、揃ってる。誰に教わった。'], ['player', '先週の稽古で。'], ['sugiura', '……崩すな。']], 'ch3.handover_task', { effects: [set('ch3.drilled')], view: OF(['sugiura']) });
  line('ch3.fc_team', [['kubota', '困ったら、私か助役に。先に言う相手は、決めてありますね。']], 'ch3.handover_task', { effects: [set('ch3.has_buddy')], view: OF(['kubota']) });
  line('ch3.fc_svc', [['sugiura', '五時五十二分の客がいる。顔を見て、挨拶しろ。']], 'ch3.handover_task', { effects: [set('ch3.svc_ready')], view: OF(['sugiura']) });

  N['ch3.handover_task'] = { id: 'ch3.handover_task', type: 'task', kind: 'memory', title: '夜勤からの引継ぎを復唱する', intro: '引継ぎの要点を見て覚え、同じ順に選んでください。見返しはできません。',
    config: { sequence: ['2番線ホーム', '照明が1灯切れ', '交換は昼間', '立入に注意'], pool: ['1番線ホーム', '券売機3号機', '2番線ホーム', '照明が1灯切れ', '紙幣が詰まる', '交換は昼間', '立入に注意', '交換済み'], showMs: 4800, showLabel: '夜勤からの引継ぎ' },
    results: res3('ch3.ho_done', 'ch3.ho_done', 'ch3.ho_done', [ev('reporting', 3), ev('accuracy', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]), view: OF(['sugiura'], '5:35 駅事務室 引継ぎ') };
  line('ch3.ho_done', [['sugiura', '復唱は、聞いた。']], 'ch3.brief_end', { view: OF(['sugiura']) });
  fx('ch3.brief_end', [set('ch3.briefed'), time(5), tr('station_basic', 5), log('早番の点呼と夜勤からの引継ぎ', 'work')], 'ch3.hub');

  // ---- 共通の業務。所要時間は、全部を合わせると始発から眠気の時刻（8:40）までに収まらない ----
  mini({ ch: 'ch3', key: 'unlock', req: BR, who: 'kubota', object: 'gate_wide', from: [5, 36], to: [6, 40], label: 'シャッターを開錠して、改札を開ける', goal: '（業務）シャッターと改札の開錠', title: 'シャッター開錠の手順', cam: 'gate_back',
    hint: '動くゲージが緑の範囲に入った瞬間にボタンを押して、三つの工程を行います。', kind: 'timing',
    intro: ['回す、巻く、確かめる。三つ目を忘れる人が多いです。'],
    config: { rounds: [{ label: '鍵を回す' }, { label: '巻き上げる' }, { label: '固定を確かめる' }], width: 0.17, speed: 0.8, button: '今！' },
    good: 'その鍵の音、覚えておいて。', mid: '固定だけは、音でなく目で。', bad: '固定が甘いと、途中で降りてきます。', ge: [ev('safety', 3), sk('patrol', 2)], log: '始発前のシャッターを開錠', min: 40 });

  mini({ ch: 'ch3', key: 'first_check', req: BR, who: 'kubota', object: 'elevator', from: [5, 36], to: [6, 20], label: '始発前に、暗い構内の安全を点検する', goal: '（業務）始発前の安全点検', title: '始発前のコンコース点検', cam: 'follow',
    hint: '夜間の暗がりの中で、足元や設備の異常を探してタップします。', kind: 'find',
    intro: ['暗いと、いつもの床が他人の顔をします。足元から。'],
    config: { scene: 'concourse', seconds: 38, props: [P(0.04, 0.1, 0.22, 0.3, '#2b3a55', '案内板'), P(0.34, 0.1, 0.22, 0.3, '#25374f', '時刻表'), P(0.64, 0.1, 0.3, 0.3, '#2f4a3f', '掲示板'), P(0.1, 0.7, 0.8, 0.12, '#4a5568', '通路')], spots: [
      { id: 'lamp', x: 0.3, y: 0.74, label: '足元灯が一つ消えている' }, { id: 'door', x: 0.8, y: 0.8, label: '自動ドアの下に小石が挟まっている' }, { id: 'sign', x: 0.14, y: 0.2, label: '案内板の前に、台車が置きっぱなし' }, { id: 'ok', x: 0.5, y: 0.22, real: false, label: '時刻表は最新です' }] },
    good: '暗いところで見える人は、貴重です。', mid: '足元から順に。上は最後です。', bad: '暗がりの見落としは、始発の人の転倒です。', ge: [ev('safety', 3), ev('accuracy', 1)], log: '始発前の構内を点検', min: 35 });

  mini({ ch: 'ch3', key: 'commute', req: ALL(BR, F('ch3.first_done')), who: 'kubota', object: 'emergency_btn', from: [7, 20], to: [9, 30], label: '通勤・通学の波を見守る', goal: '（業務）朝の人の流れの見守り', title: '朝の人の流れの見守り', cam: 'follow',
    hint: '黄色い線へ近づく人をタップして声をかけます。立ち止まっている人は見守るだけです。', kind: 'watch', config: { total: 8 },
    intro: ['七時を過ぎると、足音が変わります。まだ、顔が見える時間です。'],
    good: '顔を見て声をかけると、受け取る側も構えません。', mid: '何人か、線を越えさせました。', bad: '朝は焦っている人が多い。全体を見て。', ge: [ev('safety', 3), ev('service', 1)], be: [ev('safety', -2)], log: '朝の人の流れを見守り', min: 60 });

  // ---- 津村さん（始発を待つ常連）：5:38〜5:55 の間だけ会える。長い業務を先に始めると、会えない ----
  N['ch3.hub'].interactions.push({ id: 'tsumura', object: 'gate_wide', label: '始発を待つお客様に挨拶する', goto: 'ch3.ts_1', requires: ALL(BR, T('>=', hm(5, 38)), T('<', hm(5, 55))), once: true, icon: '👋' });
  N['ch3.hub'].goals.push({ id: 'g_ts', label: '（任意）始発を待つお客様に挨拶する', when: F('ch3.ts_done'), optional: true, showWhen: T('>=', hm(5, 38)) });
  line('ch3.ts_1', [
    '改札越しに、缶が一本、差し出された。まだ温かい。',
    ['tsumura', 'ほれ、杉浦さん。いつもの。', 'smile'],
    ['sugiura', '……どうも。'],
    ['tsumura', '二十五年、断られたことがない。……そっちは新顔か。'],
    ['player', '{player}です。'],
    ['tsumura', '覚えた。五時五十二分の客だ。']
  ], 'ch3.ts_branch', { view: OF(['tsumura', 'sugiura'], '5:42 改札口 始発前') });
  branch('ch3.ts_branch', [[ANY(F('legacy.helped_kajiwara'), F('ch2.shiraishi_motto')), 'ch3.ts_memory']], 'ch3.ts_2');
  line('ch3.ts_memory', [
    ['tsumura', '昼の駅長は「顔を覚えろ」と言うそうだな。'],
    ['player', '券売機の前の、年配の方の顔を、覚えています。'],
    ['tsumura', 'ほう。なら、この駅は当分大丈夫だ。', 'smile']
  ], 'ch3.ts_2', { view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_2', [
    '指令の電話が鳴った。杉浦が、事務室へ入っていく。',
    ['tsumura', '兄ちゃん。今日が最後だ。'],
    ['tsumura', '女房が、また入院してな。向こうの病院の近くに、間借りする。来週からは、乗らん。'],
    ['tsumura', '杉浦さんには、言うな。二十五年、湿っぽいのは性に合わん。'],
    '津村は、缶をもう一本、こちらの手に置いた。'
  ], 'ch3.ts_end', { view: OF(['tsumura'], '5:46 改札口') });
  fx('ch3.ts_end', [set('ch3.ts_done'), time(12), log('始発の常連・津村さんと挨拶', 'work')], 'ch3.hub');

  // ---- 始発（5:55）：杉浦の問い。時限選択 ----
  line('ch3.first', ['五時五十五分。レールが先に、かすかに鳴いた。', '前照灯が、ホームの端から白く伸びてくる。'], 'ch3.first_b', { view: v3('platform', '5:55 ホーム 始発列車') });
  branch('ch3.first_b', [[F('ch3.ts_done'), 'ch3.first_a']], 'ch3.first_c');
  line('ch3.first_a', [
    '杉浦が、ホームの端に立っていた。窓の列を、一つずつ見ている。',
    ['sugiura', '津村さん、何か言っていたか。']
  ], 'ch3.ts_choice', { view: v3('platform', '5:55 ホーム 始発列車') });
  line('ch3.first_c', [
    ['sugiura', '今日は挨拶しそびれたな。明日、また言えばいい。'],
    ['player', '（二十五年、毎日。明日、僕の声は出るだろうか）']
  ], 'ch3.first_end', { view: v3('platform', '5:55 ホーム 始発列車') });
  choice('ch3.ts_choice', '列車が、ホームに入ってくる。杉浦は、前を向いたままだ。', [
    opt('tell', '「今日が最後だと、仰っていました」', 'ch3.ts_tell', { tone: 'honest', effects: [set('ch3.ts_told'), rel('sugiura', 1, 1), rel('tsumura', -1, 0)] }),
    opt('keep', '「いえ。特には」', 'ch3.ts_keep', { tone: 'careful', effects: [set('ch3.ts_kept'), rel('tsumura', 1, 1), lock('sugiura_goodbye', '杉浦助役は、津村さんに別れを言えなかった')] }),
    opt('silent', '……何も言わない', 'ch3.ts_sil', { effects: [set('ch3.ts_silent'), lock('sugiura_goodbye', '杉浦助役は、津村さんに別れを言えなかった')] })
  ], { important: true, timeLimit: 12, defaultOption: 'silent', who: 'sugiura', view: v3('platform', '5:55 ホーム 始発列車') });
  line('ch3.ts_tell', [
    ['sugiura', '……そうか。'],
    '列車が止まった。三両目の窓で、帆布のカバンが立ち上がる。'
  ], 'ch3.ts_tell_b', { view: v3('platform', '5:56 ホーム 始発列車') });
  branch('ch3.ts_tell_b', [[F('ch3.svc_ready'), 'ch3.ts_tell_s']], 'ch3.ts_tell_p');
  line('ch3.ts_tell_s', [['player', '津村さん。二十五年、お疲れさまでした。'], ['tsumura', '……言うなと、言ったろう。', 'smile']], 'ch3.ts_tell_e', { view: v3('platform', '5:56 ホーム 始発列車') });
  line('ch3.ts_tell_p', ['窓の中で、津村がこちらを見た。肩を、少しだけすくめた。'], 'ch3.ts_tell_e', { view: v3('platform', '5:56 ホーム 始発列車') });
  line('ch3.ts_tell_e', ['杉浦は、帽子を取った。発車ベルが鳴り終わるまで、頭を上げなかった。'], 'ch3.first_end', { view: v3('platform', '5:57 ホーム 始発列車') });
  line('ch3.ts_keep', [
    ['player', 'いえ。特には。'],
    ['sugiura', '……そうか。'],
    '杉浦は、いつものように、帽子のつばに指を添えた。窓の中で、帆布のカバンが、小さく手を挙げた。',
    '杉浦は、それが最後だとは、知らない。'
  ], 'ch3.first_end', { view: v3('platform', '5:56 ホーム 始発列車') });
  line('ch3.ts_sil', [
    '口が、動かなかった。',
    ['sugiura', '……聞かんでおく。'],
    '前照灯が、ホームを白く洗って、通り過ぎた。'
  ], 'ch3.first_end', { view: v3('platform', '5:56 ホーム 始発列車') });
  fx('ch3.first_end', [set('ch3.first_done'), time(6), tr('station_basic', 5), log('始発列車を見送る', 'work')], 'ch3.hub');

  // =====================================================================
  // 持ち場別の午前（6:10〜9:30）：別の人物・別の業務形式
  // =====================================================================
  // --- 接客ルート：売店・窓口 ---
  mini({ ch: 'ch3', key: 'svc_window', req: ALL(BR, SVC), who: 'kubota', object: 'ticket_office', from: [6, 30], to: [9, 30], label: '開いたばかりの窓口で、朝の用件をさばく', goal: '（接客）早朝の窓口対応', title: '早朝の窓口対応', cam: 'follow',
    hint: '用件を聞いて、急ぎ・窓口で丁寧に・後で、の三つに振り分けます。', kind: 'sort',
    intro: ['急ぐ人には結論を、迷う人には時間を。'],
    config: { perItem: 7, bins: [{ id: 'fast', label: '急ぎ（列車優先で案内）' }, { id: 'calm', label: '窓口で丁寧に' }, { id: 'later', label: '後で・別の担当へ' }], items: [
      { id: 'a', label: '「六時十七分に乗りたい。ICカードの残高が足りない」', bin: 'fast', why: '時間が迫っています。精算機の場所と手順を、すぐ案内します。' },
      { id: 'b', label: '「通院の予約が九時。何番のホームから行けばいいか、地図で教えてほしい」', bin: 'calm', why: '時間は少し余裕があります。案内図を見ながら、ゆっくり説明します。' },
      { id: 'c', label: '「昨日の夜、電車に傘を置き忘れた」', bin: 'later', why: '遺失物の取扱いは、台帳と担当の確認が必要です。確認して、折り返します。' },
      { id: 'd', label: '「定期券の払い戻しを、今すぐしたい」', bin: 'calm', why: '払い戻しは手続きが多いので、窓口でお待ちいただき、丁寧に進めます。' },
      { id: 'e', label: '「次の電車、何番線から出ますか」', bin: 'fast', why: '一言で済む案内です。すぐ答えます。' },
      { id: 'f', label: '「近くに、朝から開いているパン屋はありますか」', bin: 'later', why: '駅の業務の範囲外です。案内所や地図の掲示をご案内します。' }] },
    good: '急ぐ人も、ゆっくりの人も、顔が緩んでいました。', mid: '順番が少し入れ替わりました。', bad: '急ぐ人を、待たせましたね。', ge: [ev('service', 3), ev('accuracy', 1), sk('ticket', 2)], log: '早朝の窓口を対応', min: 90 });
  N['ch3.hub'].interactions.push({ id: 'svc_sakai', object: 'sakai', label: '開店準備中の売店の坂井さんに、挨拶する', goto: 'ch3.svc_sakai_1', requires: ALL(BR, SVC, T('>=', hm(6, 10)), T('<', hm(8, 30))), once: true, icon: '🛍' });
  N['ch3.hub'].goals.push({ id: 'g_svc_sakai', label: '（接客）売店の坂井さんに挨拶する', when: F('ch3.svc_sakai_done'), optional: true, showWhen: ALL(SVC, T('>=', hm(6, 10))) });
  line('ch3.svc_sakai_1', [
    'パンの箱を開ける音がした。売店のシャッターは、半分だけ上がっている。',
    ['sakai', '早番デビュー？ パンは五時十分に届くの。あたしも、十年同じ時間よ。', 'smile'],
    ['sakai', '時間で、顔が決まるの。五時五十二分は津村さん。六時四十分は新聞の兄ちゃん。'],
    ['sakai', '……ねえ、あなた、続くの？ 三か月で消える子も見たから。'],
    ['player', '続けます。たぶん。'],
    ['sakai', '「たぶん」は、売店じゃ値引き対象よ。', 'smile']
  ], 'ch3.svc_sakai_b', { view: OF(['sakai', 'kubota'], '6:35 売店前') });
  // rel を読む場面：坂井との距離で、津村の話を聞けるか、聞けないか
  branch('ch3.svc_sakai_b', [[ALL(NF('ch3.ts_done'), REL('sakai', 'rapport', '>=', 1)), 'ch3.svc_sakai_ts'], [ALL(NF('ch2.coins_done'), REL('sakai', 'rapport', '<=', 1)), 'ch3.svc_sakai_cold']], 'ch3.svc_sakai_end');
  line('ch3.svc_sakai_ts', [['sakai', '津村さん、今日が最後だって。さっき聞いたの。……会えなかったのね。']], 'ch3.svc_sakai_end', { effects: [set('ch3.ts_late_known')], view: OF(['sakai']) });
  line('ch3.svc_sakai_cold', [['sakai', '……昨日の両替のことは、もういいの。忙しかったでしょうし。']], 'ch3.svc_sakai_end', { view: OF(['sakai']) });
  fx('ch3.svc_sakai_end', [set('ch3.svc_sakai_done'), rel('sakai', 1, 1), time(20), log('売店の坂井さんから、早朝の常連の話を聞く', 'work')], 'ch3.hub');

  // --- ホームルート：ホームの巡回と指令との連絡 ---
  mini({ ch: 'ch3', key: 'plat_round', req: ALL(BR, PLAT), who: 'kubota', object: 'tactile', from: [6, 15], to: [9, 30], label: 'ホームを、決まった順路で巡回する', goal: '（ホーム）早朝のホーム巡回', title: '早朝のホーム巡回経路', cam: 'follow',
    hint: '起点から着点まで、A（階段下）・B（非常停止ボタン）・C（ホーム端）の三か所を必ず通る、短い道をつなぎます。', kind: 'route',
    intro: ['朝の風は、落ち葉を点字ブロックの上に運びます。三か所、順番を決めて。'],
    config: { grid: ['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], must: ['A', 'B', 'C'], best: bestRoute(['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], ['A', 'B', 'C']), legend: { '#': '壁・柱（通れない）', '~': '清掃中で滑りやすい（遅い）', A: '階段下', B: '非常停止ボタン', C: 'ホーム端', S: '起点', G: '事務室側の出口' } },
    good: '毎朝この順で回れますね。', mid: '少し遠回りでした。', bad: '一か所、見落としです。', ge: [ev('safety', 3), ev('accuracy', 1), sk('patrol', 3)], log: '早朝のホームを巡回', min: 70 });
  N['ch3.hub'].interactions.push({ id: 'plat_phone', object: 'phone', label: '指令直通電話に、巡回結果を報告する', goto: 'ch3.plat_phone_1', requires: ALL(BR, PLAT, T('>=', hm(6, 10)), T('<', hm(8, 30))), once: true, icon: '📞' });
  N['ch3.hub'].goals.push({ id: 'g_plat_phone', label: '（ホーム）指令へ、巡回結果を報告する', when: F('ch3.plat_phone_done'), optional: true, showWhen: ALL(PLAT, T('>=', hm(6, 10))) });
  line('ch3.plat_phone_1', [
    '直通電話が、一度だけ短く鳴った。杉浦が目で「出ろ」と言う。',
    ['hamaguchi', '指令の浜口。巡回結果を。', 'normal'],
    ['player', '二番線の照明が一灯、それから風で落ち葉が……'],
    ['hamaguchi', '待った。結論から。異常あり、なし。', 'serious'],
    ['player', '異常あり。二番線ホーム、照明一灯。運行への影響なし。'],
    ['hamaguchi', 'それだ。結論、場所、影響。十八年、それしか言ってない。'],
    ['sugiura', '紙でいい。俺は今でも、手帳に書いている。']
  ], 'ch3.plat_phone_end', { view: OF(['sugiura'], '6:40 駅事務室 指令直通電話') });
  fx('ch3.plat_phone_end', [set('ch3.plat_phone_done'), rel('hamaguchi', 1, 0), rel('sugiura', 1, 0), time(20), log('指令へ、ホーム巡回の結果を報告', 'work')], 'ch3.hub');

  // --- 事務ルート：日報と古い引継ぎ帳 ---
  N['ch3.hub'].interactions.push({ id: 'off_log', object: 'terminal', label: '朝の日報の下書きを、確認する', goto: 'ch3.off_log_1', requires: ALL(BR, OFFC, T('>=', hm(6, 15)), T('<', hm(9, 30))), once: true, icon: '🖥' });
  N['ch3.hub'].goals.push({ id: 'g_off_log', label: '（事務）朝の日報の下書きを確認する', when: F('ch3.off_log_done'), optional: true, showWhen: ALL(OFFC, T('>=', hm(6, 15))) });
  line('ch3.off_log_1', [
    ['kubota', '夜勤の日報の下書きです。事実と推測、どちらが混ざっているか。'],
    ['sugiura', '赤を入れるな。まず、読め。']
  ], 'ch3.off_log_task', { view: v3('npc:terminal', '駅事務室 業務端末') });
  chk('ch3.off_log_task', '日報の下書きの確認', '下書きの記述が、日報の書き方として適切か、不適切かを判断してください。', [
    { id: 'a', label: '「二番線ホームの照明が一灯切れていた。昼間に交換予定」（事実と予定を、分けて書いている）', truth: 'ok', why: '見たことと、予定を分けています。' },
    { id: 'b', label: '「券売機3号機は、たぶん壊れかけている」', truth: 'ng', why: '根拠のない推測です。症状と時刻を書いて、確認を依頼します。' },
    { id: 'c', label: '「01:12 改札機2番が停止。01:14 夜勤係員が再起動し、復帰を確認」', truth: 'ok', why: '時刻と対応が、順番に書かれています。' },
    { id: 'd', label: '「夜はお客様が少なく、特に問題はなかった」', truth: 'ng', why: '「特に問題なし」は、具体的に何を確認したか分かりません。確認した項目を書きます。' },
    { id: 'e', label: '「異常あり。二番線ホーム照明。運行への影響なし。」（結論から書き始めている）', truth: 'ok', why: '結論、場所、影響が、すぐに読み取れます。' }
  ], res3('ch3.off_log_ok', 'ch3.off_log_ok', 'ch3.off_log_ok', [ev('reporting', 3), ev('accuracy', 3)], [ev('accuracy', 1)], [ev('accuracy', -2)]), ['適切', '不適切']);
  N['ch3.off_log_task'].view = v3('npc:terminal', '駅事務室 業務端末');
  line('ch3.off_log_ok', [['kubota', '日報は、確認できました。']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done'), time(25)] });
  line('ch3.off_book_1', [
    '棚の隅に、背表紙の剥げた黒い綴りがあった。「引継ぎ帳」。',
    ['sugiura', '開業からの手書きだ。読むのはいい。書くなら、日付と名前。ペンでだ。'],
    '「ホーム時計 三分遅れ」「雪のため始発 十五分遅れ」。小さな事実が、墨のように積もっている。',
    ['player', '誰が書いたかが、残るんですね。'],
    ['sugiura', '紙は燃えるか、無くなるか。名前だけは、最後まで残る。']
  ], 'ch3.off_book_c', { view: OF(['sugiura'], '7:20 駅事務室 古い引継ぎ帳') });
  branch('ch3.off_book_c', [[F('legacy.notebook_missing'), 'ch3.off_book_m']], 'ch3.off_book_end');
  line('ch3.off_book_m', [
    ['player', '去年の秋の頁だけ、切り取られています。'],
    ['sugiura', '………見なかったことにしろ。駅長が、いつか話す。', 'worry']
  ], 'ch3.off_book_end', { effects: [rel('sugiura', 1, 0)], view: OF(['sugiura']) });
  fx('ch3.off_book_end', [time(25), log('古い引継ぎ帳を読ませてもらう', 'work')], 'ch3.hub');

  // =====================================================================
  // 眠気（8:40）：時限選択。言えば、誰かが立つ。言わなければ、誰かが困る。何も言えなくても、結果は残る
  // =====================================================================
  branch('ch3.sleepy', [[F('ch3.slept_well'), 'ch3.sleepy_a']], 'ch3.sleepy_b', { view: OF(['sugiura', 'kubota'], '8:40 駅事務室') });
  line('ch3.sleepy_a', [
    '八時四十分。蛍光灯の唸りが、やけに耳に近い。',
    ['kubota', '券売機の履歴、読み上げをお願いします。']
  ], 'ch3.sleepy_choice', { view: OF(['kubota'], '8:40 駅事務室') });
  line('ch3.sleepy_b', [
    '八時四十分。画面の文字が、二重になって揺れた。',
    ['kubota', '読み上げをお願いします。……どうかしました？', 'worry']
  ], 'ch3.sleepy_choice', { view: OF(['kubota'], '8:40 駅事務室') });

  choice('ch3.sleepy_choice', '数字が、二重に見える。', [
    opt('honest', '「眠気が強くて、確認が不安です。十五分、休ませてください」', 'ch3.hn_1', { tone: 'honest', effects: [set('ch3.honest'), ev('reporting', 3), ev('safety', 3), rel('sugiura', 1, 1), rel('kubota', 1, 1)] }),
    opt('kubota', '久保田にだけ、小声で言う。「読み上げ、代わってもらえますか」', 'ch3.kb_1', { tone: 'careful', requires: ANY(F('ch3.has_buddy'), REL('kubota', 'trust', '>=', 3)), effects: [set('ch3.told_kubota'), rel('kubota', 1, 1)] }),
    opt('push', '「大丈夫です」と答えて、そのまま続ける', 'ch3.pu_1', { tone: 'risky', effects: [set('ch3.pushed'), ev('safety', -2), ev('reporting', -2)] }),
    opt('coffee', '席を外して、濃いコーヒーを飲んで戻る', 'ch3.pu_c', { tone: 'quick', effects: [set('ch3.pushed'), ev('safety', -1), ev('reporting', -2)] }),
    opt('silent', '何も言わず、読み上げを始める', 'ch3.pu_s', { effects: [set('ch3.pushed'), ev('safety', -2)] })
  ], { important: true, timeLimit: 15, defaultOption: 'silent', who: 'kubota', view: OF(['sugiura', 'kubota']) });

  // --- 正直に言う：杉浦が立つ（杉浦の休憩が消える）。信頼があれば、鍵を一つ預けられる ---
  line('ch3.hn_1', [
    ['kubota', 'まず座ってください。立っていなくていいです。'],
    '杉浦が、ペンを置いた。',
    ['sugiura', '……言ったか。'],
    ['sugiura', '休むなら、その間は俺が立つ。十五分だ。']
  ], 'ch3.hn_stand', { view: OF(['sugiura', 'kubota'], '8:42 駅事務室') });
  line('ch3.hn_stand', ['杉浦が、窓口の椅子に座り直した。', '十時半の休憩は、その分、削れる。本人は、何も言わなかった。'], 'ch3.hn_key', { view: OF(['sugiura']) });
  // rel を読む場面：杉浦への信頼があると、鍵を一つ預けてくれる
  branch('ch3.hn_key', [[REL('sugiura', 'trust', '>=', 2), 'ch3.hn_key_y']], 'ch3.hn_key_n');
  line('ch3.hn_key_y', [
    '杉浦は、鍵束から、小さな鍵を一つ外した。',
    ['sugiura', '更衣室の予備だ。預ける。……失くすな。'],
    '手のひらに、冷たい金属が一つ、乗った。'
  ], 'ch3.hn_rest', { effects: [set('ch3.got_key')], view: OF(['sugiura']) });
  line('ch3.hn_key_n', [['sugiura', '十五分で戻れ。']], 'ch3.hn_rest', { view: OF(['sugiura']) });
  line('ch3.hn_rest', [
    '湯呑みの麦茶は、思ったより熱かった。',
    ['kubota', '私も、新人のときに聞かれました。「眠いか」って。泣きそうでした。', 'smile']
  ], 'ch3.hn_end', { effects: [time(15)], view: HR(['kubota'], '8:50 休憩室') });
  fx('ch3.hn_end', [set('ch3.sleepy_done'), log('眠気を申告し、休憩を取る。その間、杉浦が窓口に立った', 'work'), tl('4月19日 眠気を申告し、十五分休んだ')], 'ch3.mid_merge');

  // --- 久保田にだけ言う：誰にも知られず済むが、杉浦は見ていた ---
  line('ch3.kb_1', [
    ['player', '（小声で）久保田さん。読み上げ、代わってもらえますか。数字が、二重に見えて。'],
    ['kubota', '……分かりました。あちらで座っていてください。'],
    '杉浦は、机の向こうで、こちらを見ていた。何も言わなかった。'
  ], 'ch3.kb_2', { view: OF(['kubota', 'sugiura']) });
  line('ch3.kb_2', [
    '十五分後。机の端に、付箋が一枚。細い字で、「眠いときは先に言う　杉浦」。',
    ['sugiura', '言う相手は、俺でもいい。'],
    '久保田が、小さく咳をした。'
  ], 'ch3.kb_end', { effects: [rel('sugiura', -1, 0), time(15)], view: OF(['sugiura', 'kubota'], '9:00 駅事務室') });
  fx('ch3.kb_end', [set('ch3.sleepy_done'), log('眠気を久保田にだけ伝え、読み上げを代わってもらう', 'work'), tl('4月19日 眠気を久保田にだけ伝えた')], 'ch3.hub');

  // --- 続ける／コーヒー／声が出ない：持ち場ごとに、誰かが困る誤りが出る ---
  line('ch3.pu_1', [
    ['player', '大丈夫です。少しぼうっとしただけで。', 'normal'],
    ['kubota', '顔色が、あまり。', 'worry'],
    '杉浦は黙って、{player}の手元を見ていた。'
  ], 'ch3.pu_slip', { view: OF(['sugiura', 'kubota']) });
  line('ch3.pu_c', [
    '缶コーヒーを一息に飲んだ。苦みが、舌の奥に居座る。',
    ['kubota', '手が、少し落ち着きませんね。', 'worry'],
    ['player', '何でもありません。続けます。']
  ], 'ch3.pu_slip', { view: OF(['kubota']) });
  line('ch3.pu_s', [
    ['kubota', '……始めてください。'],
    '声が、出なかった。そのまま、読み上げを始めた。数字が、一つずつ、ずれていく。'
  ], 'ch3.pu_slip', { view: OF(['kubota']) });
  N['ch3.pu_slip'] = { id: 'ch3.pu_slip', type: 'branch', cases: [{ when: F('ch3.drilled'), goto: 'ch3.pu_caught' }, { when: PLAT, goto: 'ch3.pu_slip_plat' }, { when: OFFC, goto: 'ch3.pu_slip_off' }], else: 'ch3.pu_slip_svc' };
  line('ch3.pu_caught', [
    '九時十分。確認の途中で、手が止まった。指差しの型が先に動いて、自分の誤りに気づいた。',
    '自分で線を引いて、書き直した。',
    ['sugiura', '……見ていた。言わずに直したな。', 'normal']
  ], 'ch3.pu_talk', { view: OF(['sugiura'], '9:10 駅事務室') });
  line('ch3.pu_slip_svc', [
    '九時十分。千円札を崩す指が、百円玉の山から五百円玉をつまんでいた。',
    ['kubota', 'いま、五百円玉を混ぜていませんか。', 'surprise'],
    ['player', 'え。……二枚、混ざってました。'],
    '一枚は、もう客の手の中だった。改札の向こうで、会社員の背中が小さくなっていく。',
    ['kubota', 'レジは、私が合わせておきます。今日だけです。']
  ], 'ch3.pu_talk', { effects: [ev('accuracy', -2), rel('kubota', -1, 0)], view: OF(['kubota'], '9:10 窓口') });
  line('ch3.pu_slip_plat', [
    '九時十分。記録簿の日付欄に、昨日の日付を書いていた。',
    ['sugiura', '日付。もう一度見ろ。', 'serious'],
    ['player', '……十八日。昨日です。'],
    '記録は、指令に一度、読み上げられたあとだった。',
    ['sugiura', '（受話器）浜口さん、訂正を。……いや、こっちの誤りだ。']
  ], 'ch3.pu_talk', { effects: [ev('accuracy', -2), rel('hamaguchi', -1, 0)], view: OF(['sugiura'], '9:10 駅事務室') });
  line('ch3.pu_slip_off', [
    '九時十分。送信の数秒前、「二番線照明」が「異常なし」になっていた。',
    ['kubota', 'そこ、「異常あり」です。', 'surprise'],
    '送信は、一件、済んでいた。',
    ['kubota', '訂正は出しておきます。照明の交換は、明日になります。']
  ], 'ch3.pu_talk', { effects: [ev('accuracy', -2), rel('kubota', -1, 0)], view: OF(['kubota'], '9:10 駅事務室') });
  line('ch3.pu_talk', [
    ['sugiura', '休憩。今すぐだ。', 'serious'],
    '麦茶が、無言で机に置かれた。鍵束の音が、遠ざかっていく。',
    ['sugiura', '二十五年前、俺も黙った。放送で、行先を取り違えた。'],
    ['sugiura', '誰も乗り間違えなかった。運だ。'],
    ['sugiura', '先輩は言った。「言えない空気を作った、俺たちが悪い」と。'],
    ['kubota', '私も、聞かれました。「眠いか」って。', 'smile'],
    ['sugiura', '次は、お前が聞け。']
  ], 'ch3.pu_end', { effects: [set('ch3.sugiura_story'), rel('sugiura', 1, 2), time(15)], view: HR(['sugiura', 'kubota'], '9:15 休憩室') });
  fx('ch3.pu_end', [set('ch3.sleepy_done'), log('眠気を言い出せず、誤りを出す', 'work'), tl('4月19日 眠気を言い出せず、誤りを出した')], 'ch3.mid_merge');

  // --- 合流 ---
  branch('ch3.mid_merge', [[F('ch3.honest'), 'ch3.merge_h']], 'ch3.merge_p');
  line('ch3.merge_h', [
    '机の上に、湯気の立つおしぼりが置いてあった。',
    ['kubota', '助役が、あなたの分も。', 'smile'],
    ['sugiura', '午後も来る。来たら、先に言え。']
  ], 'ch3.hub', { view: OF(['sugiura', 'kubota'], '9:00 駅事務室') });
  line('ch3.merge_p', [
    '机の端に、付箋が一枚。細い字で、「眠いときは先に言う　杉浦」。',
    ['kubota', 'それ、私も貼られました。三年、持っていました。', 'smile'],
    ['sugiura', '剥がしてもいい。貼られたことは、忘れるな。']
  ], 'ch3.hub', { view: OF(['sugiura', 'kubota'], '9:30 駅事務室') });

  // =====================================================================
  // 朝の休憩（10:30）：津村のその後、そして杉浦の後継者の話（時限選択）
  // =====================================================================
  line('ch3.breakfast', [
    '味噌汁の湯気が、窓の光の中で、ゆっくり傾いた。',
    ['kubota', '長い朝でしたね。', 'smile']
  ], 'ch3.bf_branch', { effects: [{ clock: { minute: hm(10, 30) } }], view: HR(['sugiura', 'kubota'], '10:30 休憩室 朝食') });
  branch('ch3.bf_branch', [[F('ch3.honest'), 'ch3.bf_h'], [F('ch3.told_kubota'), 'ch3.bf_k']], 'ch3.bf_p');
  line('ch3.bf_h', [
    '杉浦が、一番最後に座った。飯は、冷めていた。',
    ['kubota', 'あなたの十五分、助役は立ちっぱなしでした。'],
    ['sugiura', '余計なことを言うな。']
  ], 'ch3.bf_ts', { view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_k', [
    ['sugiura', '久保田に言ったそうだな。'],
    ['sugiura', '……次は、俺にも言え。']
  ], 'ch3.bf_ts', { view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_p', [
    ['sugiura', '責めん。付箋の意味だけ覚えろ。明日から毎朝聞く。「眠いか」と。'],
    ['kubota', '私は「眠れましたか」と送ります。', 'smile']
  ], 'ch3.bf_ts', { view: HR(['sugiura', 'kubota']) });

  // 津村の最後の朝が、杉浦の表情に残る
  branch('ch3.bf_ts', [[F('ch3.ts_told'), 'ch3.bf_ts_t'], [F('ch3.ts_kept'), 'ch3.bf_ts_k'], [F('ch3.ts_silent'), 'ch3.bf_ts_s'], [F('ch3.ts_late_known'), 'ch3.bf_ts_l']], 'ch3.bf_ts_m');
  line('ch3.bf_ts_t', ['机の上に、缶が一本。まだ、開いていない。', ['sugiura', '二十五年、断らなかった。今日は、飲めなかった。']], 'ch3.bf_dawn_0', { view: HR(['sugiura']) });
  line('ch3.bf_ts_k', [
    ['sugiura', '津村さん、今日が最後だったそうだ。さっき、坂井から聞いた。'],
    ['sugiura', '……知っていたな。'],
    ['player', '……はい。'],
    ['sugiura', '言うなと、言われたか。'],
    ['player', 'はい。'],
    ['sugiura', 'そうか。']
  ], 'ch3.bf_dawn_0', { effects: [rel('sugiura', 0, -1)], view: HR(['sugiura']) });
  line('ch3.bf_ts_s', [
    ['sugiura', '津村さんが最後だったと、坂井から聞いた。'],
    ['sugiura', 'あの時、お前は黙った。……分かってた。聞かんでおいた。']
  ], 'ch3.bf_dawn_0', { effects: [rel('sugiura', 0, 1)], view: HR(['sugiura']) });
  line('ch3.bf_ts_l', [
    ['sugiura', '坂井から聞いたか。お前も。'],
    ['sugiura', '津村さんは、今日が最後だったそうだ。……缶は、受け取った。それだけだ。']
  ], 'ch3.bf_dawn_0', { effects: [lock('sugiura_goodbye', '杉浦助役は、津村さんに別れを言えなかった')], view: HR(['sugiura']) });
  line('ch3.bf_ts_m', [
    ['sugiura', '津村さんは、今日が最後だったそうだ。聞いたのは、さっきだ。'],
    ['sugiura', '二十五年。……缶を、もう一本、受け取っておけばよかった。']
  ], 'ch3.bf_dawn_0', { effects: [lock('sugiura_goodbye', '杉浦助役は、津村さんに別れを言えなかった')], view: HR(['sugiura']) });

  // 杉浦の後継者の話：全員に示す。どう答えるかは、選ぶ
  line('ch3.bf_dawn_0', [
    ['sugiura', '来年の三月、俺は定年だ。'],
    ['sugiura', 'この鍵束を預ける奴を、探している。'],
    ['kubota', '助役、その話は……。', 'worry']
  ], 'ch3.bf_da', { view: HR(['sugiura', 'kubota']) });
  branch('ch3.bf_da', [[F('ch3.got_key'), 'ch3.bf_da_k']], 'ch3.bf_db');
  line('ch3.bf_da_k', [['sugiura', '預けた鍵は、持っているな。'], ['player', '……はい。']], 'ch3.bf_db', { view: HR(['sugiura']) });
  branch('ch3.bf_db', [[F('ch3.sugiura_story'), 'ch3.bf_db_s']], 'ch3.bf_dc');
  line('ch3.bf_db_s', [['sugiura', '二十五年前の話を、聞かせた。恥を知っている奴の方が、鍵は預けやすい。']], 'ch3.bf_dc', { view: HR(['sugiura']) });
  branch('ch3.bf_dc', [[F('ch2.knows_key_story'), 'ch3.bf_dc_k']], 'ch3.bf_q');
  line('ch3.bf_dc_k', [['player', '駅長から、助役は鍵を誰にも預けたことがない、と聞きました。'], ['sugiura', '白石め。余計なことを。', 'smile']], 'ch3.bf_q', { view: HR(['sugiura']) });
  line('ch3.bf_q', [['sugiura', '言っておくだけだ。……お前は、早番を続ける気があるか。']], 'ch3.bf_dawn', { view: HR(['sugiura', 'kubota']) });
  choice('ch3.bf_dawn', '杉浦は、窓を見たまま、待っている。', [
    opt('accept', '「受け取りたいです。まだ、足りませんが」', 'ch3.bf_acc', { tone: 'caring', requires: REL('sugiura', 'trust', '>=', 2), effects: [set('ch3.successor_yes'), rel('sugiura', 2, 2), lock('late_shift_pref', '早番の後任候補になった。来年度の勤務表で、遅番や他部署の希望は通りにくくなる')] }),
    opt('wait', '「三月まで、返事を待ってもらえませんか」', 'ch3.bf_wait', { tone: 'careful', effects: [set('ch3.successor_wait'), rel('sugiura', 0, 1)] }),
    opt('decline', '「早番を続ける自信がありません。お預かりできません」', 'ch3.bf_dec', { tone: 'honest', effects: [set('ch3.successor_no'), rel('sugiura', 1, 0), lock('sugiura_key', '杉浦助役の鍵束を預かる道は、閉じた')] }),
    opt('mute', '……答えない', 'ch3.bf_mute', { effects: [set('ch3.successor_mute'), rel('sugiura', 0, -1)] })
  ], { important: true, timeLimit: 20, defaultOption: 'mute', who: 'sugiura', view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_acc', [
    ['sugiura', '……そうか。'],
    '杉浦は、鍵束を、一度だけ揺らした。ちゃり、と鳴った。'
  ], 'ch3.bf_acc_b', { view: HR(['sugiura']) });
  branch('ch3.bf_acc_b', [[F('ch3.got_key'), 'ch3.bf_acc_k']], 'ch3.bf_acc_n');
  line('ch3.bf_acc_k', [['sugiura', '更衣室の鍵は、もう、お前のものだ。残りは、三月までに、一本ずつ。']], 'ch3.bf_acc_e', { view: HR(['sugiura']) });
  line('ch3.bf_acc_n', [['sugiura', '鍵は、すぐには渡さん。まず、来週から、毎朝、俺の隣だ。']], 'ch3.bf_acc_e', { view: HR(['sugiura']) });
  line('ch3.bf_acc_e', [['kubota', '（小声で）……私は、三年前に、断りました。', 'worry']], 'ch3.bf_end', { view: HR(['kubota']) });
  line('ch3.bf_wait', [['sugiura', '三月までだ。待つのは。'], ['sugiura', '待っている間、他は探す。それでもいいか。']], 'ch3.bf_end', { view: HR(['sugiura']) });
  line('ch3.bf_dec', [['sugiura', 'そうか。'], ['sugiura', '言えるなら、それでいい。別の者を探す。'], '杉浦は、鍵束を、ポケットにしまった。'], 'ch3.bf_end', { view: HR(['sugiura']) });
  line('ch3.bf_mute', ['何か言おうとした。言葉が、先に消えた。', ['sugiura', '……急がん。']], 'ch3.bf_end', { view: HR(['sugiura']) });
  fx('ch3.bf_end', [set('ch3.break_done'), time(30), tr('station_basic', 10), log('早番の休憩。杉浦の後継者の話を聞く', 'work')], 'ch3.wrap');

  // =====================================================================
  // 午後と、余韻
  // =====================================================================
  branch('ch3.wrap', [[PLAT, 'ch3.wrap_plat'], [OFFC, 'ch3.wrap_off']], 'ch3.wrap_svc');
  line('ch3.wrap_svc', [['sakai', '（売店の前で）明日の五時五十二分は、空いちゃうわね。', 'normal']], 'ch3.wrap_end', { view: OF(['sakai'], '11:20 売店前') });
  line('ch3.wrap_plat', [['hamaguchi', '（電話）今朝の報告、受けました。順序が、きれいでした。']], 'ch3.wrap_end', { view: OF(['sugiura'], '11:20 駅事務室') });
  line('ch3.wrap_off', [['sugiura', '日報の末尾に、日付と名前。ペンでだ。……よし。頁が一枚、増えた。', 'smile']], 'ch3.wrap_end', { view: OF(['sugiura'], '11:20 駅事務室') });
  line('ch3.wrap_end', ['午後は券売機の補充を手伝い、十四時十五分に、定刻で上がった。'], 'ch3.coda_y', { view: HR([], '4月19日（月） 14:15 社員寮') });
  // 山科からのメッセージ（前夜の選択の余韻）
  branch('ch3.coda_y', [[F('ch3.helped_yama'), 'ch3.cy_h'], [F('ch3.yama_unanswered'), 'ch3.cy_r'], [F('ch3.slept_well'), 'ch3.cy_s']], 'ch3.cy_p');
  line('ch3.cy_h', [['yamashina', '（メッセージ）志望書、出した。昨日の三行が、頭に残ってる。……枠は一名だ。恨むなよ。']], 'ch3.coda_dream', { view: HR(['yamashina']) });
  line('ch3.cy_r', [['yamashina', '（メッセージ）昨日、電話した。……いや、いい。自分で書いた。']], 'ch3.coda_dream', { view: HR(['yamashina']) });
  line('ch3.cy_s', [['yamashina', '（メッセージ）返信、見た。寝たならいい。俺は、まだ書いてる。']], 'ch3.coda_dream', { view: HR(['yamashina']) });
  line('ch3.cy_p', [['yamashina', '（メッセージ）電話、出なかったな。……いい。出なくていい。']], 'ch3.coda_dream', { view: HR(['yamashina']) });
  // 最後の一点：鍵束の音（杉浦への答えで、聞こえ方が変わる）
  branch('ch3.coda_dream', [[F('ch3.successor_yes'), 'ch3.cd_y'], [F('ch3.successor_no'), 'ch3.cd_n'], [F('ch3.successor_wait'), 'ch3.cd_w'], [F('ch3.successor_mute'), 'ch3.cd_m']], 'ch3.cd_m');
  line('ch3.cd_y', ['寮で夕方まで眠った。夢の中で、鍵束が、ちゃり、と鳴った。', '音は、自分の手元からも、聞こえていた。'], 'ch3.coda_depart', { view: HR([], '4月19日（月） 17:00 社員寮') });
  line('ch3.cd_n', ['寮で夕方まで眠った。夢の中で、鍵束が、ちゃり、と鳴った。', '音は、廊下の向こうへ、遠ざかっていった。追いかけなかった。'], 'ch3.coda_depart', { view: HR([], '4月19日（月） 17:00 社員寮') });
  line('ch3.cd_w', ['寮で夕方まで眠った。夢の中で、鍵束が、ちゃり、と鳴った。', '三月まで、あと十一か月。数えて、やめた。'], 'ch3.coda_depart', { view: HR([], '4月19日（月） 17:00 社員寮') });
  line('ch3.cd_m', ['寮で夕方まで眠った。夢の中で、鍵束が、ちゃり、と鳴った。', '誰の手の音か、分からなかった。'], 'ch3.coda_depart', { view: HR([], '4月19日（月） 17:00 社員寮') });
  fx('ch3.coda_depart', [depart('tsumura', '4月19日 津村さんは、この日を最後に始発に乗らなくなった')], 'ch3.end');

  N['ch3.end'] = { id: 'ch3.end', type: 'end', chapter: 'ch3', title: '第3章 はじめての早番', nextChapter: 'ch4',
    summary: '夜明け前から十時半までの、静かな一日。前の晩に誰の電話に出たか。眠気を、誰に、どう伝えたか。津村さんの最後の朝を、杉浦に何と言ったか。鍵束の音は、聞こえ方を変えて、これからの勤務に残っていく。',
    effects: [tl('4月19日 初めての早番を終える'), log('第3章を終了', 'chapter')] };
}
