// R7 第3章「はじめての早番」（4月18日(日)夜〜19日(月)朝）。
// 構造：前夜（勤務間隔の確認と夜の過ごし方）→ 夜明け前から10:30までの短いハブ → 眠気の自己申告（重要選択）→ 朝食と夜明けの感想。
// 持ち場（route.service / platform / office）で、午前の中盤の場面・人物・業務の形式が別物になる。
// モチーフ：杉浦助役の「鍵束の音」。夜明け・点呼・開錠・失敗・最後の夢で、少しずつ意味が変わる。
// 欲しいもの／隠していること：杉浦＝鍵を預ける後継者が欲しい／来年定年であること、昔の失敗。津村＝毎朝の「おはよう」／妻の入院の年のこと。
export default function ch3(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, mini, hub, P, res3, chk } = k;

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
  // 前夜（4月18日 日曜 20:30）：勤務間隔の確認 → 夜の過ごし方（重要選択）
  // =====================================================================
  line('ch3.open', [
    '目覚ましは二台。まだ鳴ってもいないのに、胃が先に早起きしている。',
    '日曜の夜八時半。明日は、初めての早番だ。',
    ['kubota', '（メッセージ）勤務間隔の欄、見ましたか。見ていない人ほど「見ました」と返します。'],
    ['player', '（見ました、という返事を、今から本当にしよう）'],
    ['kubota', '（メッセージ）杉浦助役は無口です。返事がなくても、嫌われてはいません。', 'smile']
  ], 'ch3.eve_task', { effects: [{ clock: { addDay: 13, minute: hm(20, 30) } }, tl('4月18日 初めての早番の前夜'), log('第3章 はじめての早番', 'chapter')], view: HR(['kubota'], '4月18日（日） 20:30 社員寮') });

  N['ch3.eve_task'] = { id: 'ch3.eve_task', type: 'task', kind: 'checklist', title: '前夜の確認', intro: '早番の前夜の過ごし方について、正しい記述か、誤りかを判断してください。', config: { labels: ['正しい', '誤り'] },
    items: [
      { id: 'interval', label: '前回の終業は17:15、明日の始業は5:30。勤務間隔は12時間15分あり、社内規程の「11時間以上」を満たしている', truth: 'ok', why: '前の勤務の終わりから次の始業まで、規程で定められた間隔が空いています。' },
      { id: 'walk', label: '寮から駅まで徒歩約12分。4:50に出れば5:05に着き、始業前に身支度を整える余裕がある', truth: 'ok', why: '始発前は電車がありません。徒歩の時間を含めて逆算しておきます。' },
      { id: 'alarm', label: '目覚ましはスマートフォン1台で十分。電池が切れても、朝は自然に起きられるはず', truth: 'ng', why: '早番は遅刻が許されません。目覚ましは複数用意し、電池や音量も前夜に確認します。' },
      { id: 'drink', label: '眠れなくても、栄養ドリンクを飲めば、睡眠の代わりになる', truth: 'ng', why: '睡眠の代わりになるものはありません。眠れない夜は、体を休めること自体が大切です。' },
      { id: 'study', label: '手順書の予習は大切だが、睡眠を大きく削ってまで行うと、翌朝の判断力が落ちる', truth: 'ok', why: '眠気は、見落としや言い間違いの原因になります。予習は、睡眠を削らない範囲で。' },
      { id: 'sick', label: '朝、体調に不安があるときは、始業前でも事務室へ電話して相談してよい', truth: 'ok', why: '体調の相談は、遠慮せず早めに。事前の連絡のほうが、職場の対応も取りやすくなります。' }
    ],
    results: res3('ch3.eve_good', 'ch3.eve_mid', 'ch3.eve_bad', [ev('accuracy', 3), ev('safety', 2), set('ch3.interval_ok')], [ev('accuracy', 1)], [ev('accuracy', -2), ev('safety', -1)]), view: HR(['kubota'], '4月18日（日） 20:45 社員寮') };
  line('ch3.eve_good', [['kubota', '（メッセージ）全問合格です。私は新人の夜、アイロンを二回かけました。', 'smile']], 'ch3.eve_choice', { view: HR(['kubota']) });
  line('ch3.eve_mid', [['kubota', '（メッセージ）目覚ましは三台でも、誰も笑いません。']], 'ch3.eve_choice', { view: HR(['kubota']) });
  line('ch3.eve_bad', [['kubota', '（メッセージ）勤務間隔だけは覚えて。寝坊は取り返せても、間隔は戻りません。', 'serious']], 'ch3.eve_choice', { view: HR(['kubota']) });

  choice('ch3.eve_choice', '消灯まで、あと数時間。どう過ごす？', [
    opt('sleep', '手順書は明日の自分に任せて、早く寝る', 'ch3.eve_sleep', { tone: 'careful', effects: [set('ch3.slept_well'), ev('safety', 1)] }),
    opt('study', '眠くなるまで、手順書を読み込む', 'ch3.eve_study', { tone: 'risky', effects: [set('ch3.slept_short'), ev('accuracy', 1), ev('safety', -1)] }),
    opt('call', '眠れないという山科の電話に、つきあう', 'ch3.eve_call', { tone: 'caring', effects: [set('ch3.slept_short'), set('ch3.called_yama'), rel('yamashina', 1, 2)] })
  ], { important: true, who: 'kubota', view: HR(['kubota']) });

  line('ch3.eve_sleep', [
    '二台の目覚ましを、わざと別の音にした。並べると、小さな合唱団だ。',
    '二十一時十分、消灯。遠くのトラックの音が、だんだん間遠になる。',
    '眠る前に、ふと思った。始発の最初の客は、どんな顔だろう。'
  ], 'ch3.wake', { effects: [ev('safety', 1), time(30)], view: HR([], '4月18日（日） 21:10 社員寮') });
  line('ch3.eve_study', [
    '手順書の三ページ目で、同じ行を三回読んでいた。',
    ['player', '（照明、改札、券売機、シャッター。……照明、何だっけ）'],
    '二十三時四十分。目を閉じても、手順の文字が天井を流れていく。'
  ], 'ch3.wake', { effects: [time(30)], view: HR([], '4月18日（日） 23:40 社員寮') });
  line('ch3.eve_call', [
    '二十二時四十分。着信は山科。第一声が「まだ起きてるか」だった。',
    ['yamashina', '眠れないわけじゃない。目が冴えてるだけだ。', 'normal'],
    ['yamashina', '基地入門研修の公募、駅から推薦は一名だけらしい。出す。一行も書けてないけど、問題ない。'],
    ['player', '問題ない人は、夜十時に電話してこない。'],
    '切ったあとも、目だけが冴えていた。天井が、やけに近い。'
  ], 'ch3.wake', { effects: [set('ch3.yama_slot_hint'), time(30)], view: HR(['yamashina'], '4月18日（日） 22:40 社員寮') });

  branch('ch3.wake', [[F('ch3.slept_well'), 'ch3.wake_a']], 'ch3.wake_b', {});
  line('ch3.wake_a', [
    '四時十分。二台の合唱で、きちんと起きた。',
    '窓を開けると、空気が冷たくて、少し甘い。',
  ], 'ch3.arrive', { effects: [{ clock: { addDay: 1, minute: hm(4, 10) } }, tl('4月19日 初めての早番の朝')], view: HR([], '4月19日（月） 4:10 社員寮') });
  line('ch3.wake_b', [
    '二台目の目覚ましで目が開いた。一台目は、止めたことすら覚えていない。',
    '窓を開けても、頭の奥の霧は晴れない。',
  ], 'ch3.arrive', { effects: [{ clock: { addDay: 1, minute: hm(4, 10) } }, tl('4月19日 初めての早番の朝')], view: HR([], '4月19日（月） 4:10 社員寮') });

  line('ch3.arrive', [
    'シャッターの降りた改札の奥で、非常灯の緑だけが起きている。',
    '午前五時五分。始業まで、二十五分。この時間は、自分のものだ。'
  ], 'ch3.hub', { effects: [{ clock: { minute: hm(5, 5) } }, set('ch3.arrived')], view: v3('plaza', '4月19日（月） 5:05 青嶺中央駅 駅前') });

  // =====================================================================
  // 早番のハブ（5:05〜10:30）
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

  // ---- 夜明け（5:14）：静けさの中の小さな異常（誰もいないはずの場所の金属音） ----
  line('ch3.sunrise', [
    '五時十四分。ちゃり、と金属の音がした。静かすぎて、やけに大きい。',
    '駅舎の入口で、杉浦助役が鍵束を揃えていた。誰もいないはずの時間に。',
    ['sugiura', '空を見ろ。三十秒で変わる。'],
    '藍色が端から剥がれ、橙がにじむ。窓ガラスの中で、非常灯の緑と重なった。',
  ], 'ch3.hub', { effects: [set('ch3.saw_dawn'), log('夜明けの青嶺中央駅', 'work')], view: v3('plaza', '5:14 駅前 夜明け') });

  // ---- 点呼と夜勤からの引継ぎ（5:30） ----
  line('ch3.brief', [
    '五時三十分。杉浦の鍵束が机に置かれ、ちゃり、と鳴った。',
    ['sugiura', '責任者の杉浦だ。久保田と、新人。よろしく。', 'normal'],
    ['sugiura', '十時半に休憩。眠かったら、その場で言え。我慢は道具にならん。'],
    ['kubota', '夜間の異常は一件。二番線の照明が一灯切れ。交換は昼、立入注意です。'],
    ['sugiura', '新人。今のを、あとで復唱しろ。']
  ], 'ch3.brief_note', { view: OF(['sugiura', 'kubota'], '5:30 駅事務室 点呼') });

  // 第2章の選択を、杉浦の態度と机上のメモで読み分ける
  branch('ch3.brief_note', [
    [F('ch2.idea_selfpost'), 'ch3.bn_self'],
    [F('ch2.proposal_sent'), 'ch3.bn_prop'],
    [F('ch2.idea_consult'), 'ch3.bn_cons']], 'ch3.bn_skip');
  line('ch3.bn_self', [
    ['sugiura', '駅長のメモだ。「手順を飛ばさない新人に」。'],
    ['sugiura', '今日は全部、指差しだ。省略なし。', 'serious']
  ], 'ch3.handover_task', { effects: [set('ch3.strict_check'), rel('sugiura', -1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_prop', [
    ['sugiura', '券売機の案内、今朝から貼ってある。見たか。'],
    ['sugiura', '……悪くない。仕事のあとで見てこい。', 'smile']
  ], 'ch3.handover_task', { effects: [rel('sugiura', 1, 1)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_cons', [
    ['sugiura', '駅長のメモだ。「相談できる新人。伸ばせ」。'],
    ['sugiura', '今日は一度だけ、相談する前に自分で考えろ。']
  ], 'ch3.handover_task', { effects: [rel('sugiura', 1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_skip', [
    ['sugiura', '駅長のメモだ。「気づいたことは声にしろ」。'],
    ['sugiura', '静かな朝ほど、声は通る。使え。']
  ], 'ch3.handover_task', { effects: [rel('sugiura', 0, 1)], view: OF(['sugiura', 'kubota']) });

  N['ch3.handover_task'] = { id: 'ch3.handover_task', type: 'task', kind: 'memory', title: '夜勤からの引継ぎを復唱する', intro: '引継ぎの要点を見て覚え、同じ順に選んでください。見返しはできません。',
    config: { sequence: ['2番線ホーム', '照明が1灯切れ', '交換は昼間', '立入に注意'], pool: ['1番線ホーム', '券売機3号機', '2番線ホーム', '照明が1灯切れ', '紙幣が詰まる', '交換は昼間', '立入に注意', '交換済み'], showMs: 4800, showLabel: '夜勤からの引継ぎ' },
    results: res3('ch3.ho_good', 'ch3.ho_mid', 'ch3.ho_bad', [ev('reporting', 3), ev('accuracy', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]), view: OF(['sugiura'], '5:35 駅事務室 引継ぎ') };
  line('ch3.ho_good', [['sugiura', '耳が開いてるな。鍵と同じだ。開けておけば、入れる。', 'smile']], 'ch3.brief_end', { view: OF(['sugiura']) });
  line('ch3.ho_mid', [['sugiura', '八割か。残りの二割で、人は転ぶ。']], 'ch3.brief_end', { view: OF(['sugiura']) });
  line('ch3.ho_bad', [['sugiura', '朝は聞き直せん。耳は最初から開けておけ。', 'serious']], 'ch3.brief_end', { view: OF(['sugiura']) });
  fx('ch3.brief_end', [set('ch3.briefed'), time(5), tr('station_basic', 5), log('早番の点呼と夜勤からの引継ぎ', 'work')], 'ch3.hub');

  // ---- 共通の業務（シャッター開錠・始発前の点検・通勤の波） ----
  mini({ ch: 'ch3', key: 'unlock', req: BR, who: 'kubota', object: 'gate_wide', from: [5, 36], to: [6, 40], label: 'シャッターを開錠して、改札を開ける', goal: '（業務）シャッターと改札の開錠', title: 'シャッター開錠の手順', cam: 'gate_back',
    hint: '動くゲージが緑の範囲に入った瞬間にボタンを押して、三つの工程を行います。', kind: 'timing',
    intro: ['回す、巻く、確かめる。三つ目を忘れる人が多いです。'],
    config: { rounds: [{ label: '鍵を回す' }, { label: '巻き上げる' }, { label: '固定を確かめる' }], width: 0.17, speed: 0.8, button: '今！' },
    good: 'ぴたりです。今の鍵の音、覚えておいて。', mid: '固定だけは、音でなく目で。', bad: '固定が甘いと、途中で降りてきます。もう一度。', ge: [ev('safety', 3), sk('patrol', 2)], log: '始発前のシャッターを開錠', min: 15 });

  mini({ ch: 'ch3', key: 'first_check', req: BR, who: 'kubota', object: 'elevator', from: [5, 36], to: [6, 20], label: '始発前に、暗い構内の安全を点検する', goal: '（業務）始発前の安全点検', title: '始発前のコンコース点検', cam: 'follow',
    hint: '夜間の暗がりの中で、足元や設備の異常を探してタップします。', kind: 'find',
    intro: ['暗いと、いつもの床が他人の顔をします。足元から。'],
    config: { scene: 'concourse', seconds: 38, props: [P(0.04, 0.1, 0.22, 0.3, '#2b3a55', '案内板'), P(0.34, 0.1, 0.22, 0.3, '#25374f', '時刻表'), P(0.64, 0.1, 0.3, 0.3, '#2f4a3f', '掲示板'), P(0.1, 0.7, 0.8, 0.12, '#4a5568', '通路')], spots: [
      { id: 'lamp', x: 0.3, y: 0.74, label: '足元灯が一つ消えている' }, { id: 'door', x: 0.8, y: 0.8, label: '自動ドアの下に小石が挟まっている' }, { id: 'sign', x: 0.14, y: 0.2, label: '案内板の前に、台車が置きっぱなし' }, { id: 'ok', x: 0.5, y: 0.22, real: false, label: '時刻表は最新です' }] },
    good: '暗いところで見える人は、貴重です。', mid: '足元から順に。上は最後です。', bad: '暗がりの見落としは、始発の人の転倒です。やり直しましょう。', ge: [ev('safety', 3), ev('accuracy', 1)], log: '始発前の構内を点検', min: 15 });

  mini({ ch: 'ch3', key: 'commute', req: ALL(BR, F('ch3.first_done')), who: 'kubota', object: 'emergency_btn', from: [7, 20], to: [9, 30], label: '通勤・通学の波を見守る', goal: '（業務）朝の人の流れの見守り', title: '朝の人の流れの見守り', cam: 'follow',
    hint: '黄色い線へ近づく人をタップして声をかけます。立ち止まっている人は見守るだけです。', kind: 'watch', config: { total: 8 },
    intro: ['七時を過ぎると、足音が変わります。まだ、顔が見える時間です。'],
    good: '顔を見て声をかけると、受け取る側も構えません。', mid: '何人か、線を越えさせました。視線を広く。', bad: '朝は焦っている人が多い。まず全体を見る練習を。', ge: [ev('safety', 3), ev('service', 1)], be: [ev('safety', -2)], log: '朝の人の流れを見守り', min: 20 });

  // ---- 津村さん（始発を待つ常連）：2D ----
  N['ch3.hub'].interactions.push({ id: 'tsumura', object: 'gate_wide', label: '始発を待つお客様に挨拶する', goto: 'ch3.ts_1', requires: ALL(BR, T('>=', hm(5, 38)), T('<', hm(5, 55))), once: true, icon: '👋' });
  N['ch3.hub'].goals.push({ id: 'g_ts', label: '（任意）始発を待つお客様に挨拶する', when: F('ch3.ts_done'), optional: true, showWhen: T('>=', hm(5, 38)) });
  line('ch3.ts_1', [
    '改札越しに、缶が一本、差し出された。まだ温かい。',
    ['tsumura', 'ほれ、杉浦さん。いつもの。', 'smile'],
    ['tsumura', '二十五年、断られたことがない。……そっちは新顔か。'],
    ['player', '{player}です。'],
    ['tsumura', '覚えた。五時五十二分の客だ。女房が入院した年も、この電車に乗った。'],
    ['sugiura', '……津村さん。', 'worry'],
    ['tsumura', '昔話だ、昔話。']
  ], 'ch3.ts_branch', { view: OF(['tsumura', 'sugiura'], '5:42 改札口 始発前') });
  branch('ch3.ts_branch', [[ANY(F('legacy.helped_kajiwara'), F('ch2.shiraishi_motto')), 'ch3.ts_memory']], 'ch3.ts_choice');
  line('ch3.ts_memory', [
    ['tsumura', '昼の駅長は「顔を覚えろ」と言うそうだな。'],
    ['player', '梶原さんの顔も、まだ覚えています。'],
    ['tsumura', 'ほう。なら、この駅は当分大丈夫だ。', 'smile']
  ], 'ch3.ts_choice', { effects: [set('ch3.ts_remembered'), rel('tsumura', 1, 1)], view: OF(['tsumura', 'sugiura']) });
  choice('ch3.ts_choice', '津村が、ふと聞いた。「あんた、早番は好きになれそうかい」', [
    opt('quiet', '「静かで心細いです。でも、夜明けの色には驚きました」', 'ch3.ts_a', { tone: 'honest', effects: [rel('tsumura', 1, 1), set('ch3.ts_honest_feel')] }),
    opt('try', '「まだ分かりません。一か月、続けてみます」', 'ch3.ts_b', { tone: 'careful', effects: [rel('tsumura', 1, 0), ev('accuracy', 1)] }),
    opt('ask', '「津村さんは、なぜ二十五年も続けられたんですか」', 'ch3.ts_c', { tone: 'caring', effects: [rel('tsumura', 1, 2), set('ch3.ts_asked')] })
  ], { who: 'tsumura', view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_a', [
    ['tsumura', '心細いうちは、気が張ってる。事故は、慣れた頃に来る。'],
  ], 'ch3.ts_end', { view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_b', [
    ['tsumura', '一か月か。一日で分かった顔をする奴より、信用できる。'],
    ['sugiura', '足りなければ三か月。焦るな。', 'smile']
  ], 'ch3.ts_end', { view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_c', [
    ['tsumura', '簡単だ。毎朝、改札に同じ顔があった。'],
    ['sugiura', '……', 'worry'],
    ['tsumura', '照れるな、事実だ。茶を黙って受け取ってくれる、それだけで乗れた朝がある。']
  ], 'ch3.ts_end', { effects: [ev('service', 2)], view: OF(['tsumura', 'sugiura']) });
  fx('ch3.ts_end', [set('ch3.ts_done'), set('ch3.tsumura_met'), time(8), log('始発の常連・津村さんと挨拶', 'work')], 'ch3.hub');

  // ---- 始発（5:55） ----
  line('ch3.first', [
    '五時五十五分。レールが先に、かすかに鳴いた。',
    '前照灯が、ホームの端から白く伸びてくる。',
  ], 'ch3.first_b', { view: v3('platform', '5:55 ホーム 始発列車') });
  branch('ch3.first_b', [[F('ch3.ts_done'), 'ch3.first_a']], 'ch3.first_c');
  line('ch3.first_a', [
    '窓の中で、帆布のカバンが、小さく手を挙げた。',
    '杉浦は無言で、帽子のつばに指を添えていた。'
  ], 'ch3.first_end', { view: v3('platform', '5:55 ホーム 始発列車') });
  line('ch3.first_c', [
    ['sugiura', '今日は挨拶しそびれたな。明日、また言えばいい。'],
    ['player', '（二十五年、毎日。明日、僕の声は出るだろうか）']
  ], 'ch3.first_end', { view: v3('platform', '5:55 ホーム 始発列車') });
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
    good: '切り替えが自然でした。急ぐ人も、ゆっくりの人も、顔が緩んでいましたよ。', mid: '順番が少し入れ替わりました。まず「急ぎですか」を。', bad: '急ぐ人を待たせましたね。最初の一言で、時間を聞きましょう。', ge: [ev('service', 3), ev('accuracy', 1), sk('ticket', 2)], log: '早朝の窓口を対応', min: 25 });
  N['ch3.hub'].interactions.push({ id: 'svc_sakai', object: 'sakai', label: '開店準備中の売店の坂井さんに、挨拶する', goto: 'ch3.svc_sakai_1', requires: ALL(BR, SVC, T('>=', hm(6, 10)), T('<', hm(8, 30))), once: true, icon: '🛍' });
  N['ch3.hub'].goals.push({ id: 'g_svc_sakai', label: '（接客）売店の坂井さんに挨拶する', when: F('ch3.svc_sakai_done'), optional: true, showWhen: ALL(SVC, T('>=', hm(6, 10))) });
  line('ch3.svc_sakai_1', [
    'パンの箱を開ける音がした。売店のシャッターは、半分だけ上がっている。',
    ['sakai', '早番デビュー？ パンは五時十分に届くの。あたしも、十年同じ時間よ。', 'smile'],
    ['sakai', '時間で、顔が決まるの。五時五十二分は津村さん。六時四十分は新聞の兄ちゃん。'],
    ['sakai', '失礼ね。……ねえ、あなた、続くの？ 三か月で消える子も見たから。'],
    ['player', '続けます。たぶん。'],
    ['sakai', '「たぶん」は、売店じゃ値引き対象よ。', 'smile']
  ], 'ch3.svc_sakai_end', { view: OF(['sakai', 'kubota'], '6:35 売店前') });
  fx('ch3.svc_sakai_end', [set('ch3.svc_sakai_done'), set('ch3.svc_regulars'), rel('sakai', 1, 1), ev('service', 2), time(15), log('売店の坂井さんから、早朝の常連の話を聞く', 'work')], 'ch3.hub');

  // --- ホームルート：ホームの巡回と指令との連絡 ---
  mini({ ch: 'ch3', key: 'plat_round', req: ALL(BR, PLAT), who: 'kubota', object: 'tactile', from: [6, 15], to: [9, 30], label: 'ホームを、決まった順路で巡回する', goal: '（ホーム）早朝のホーム巡回', title: '早朝のホーム巡回経路', cam: 'follow',
    hint: '起点から着点まで、A（階段下）・B（非常停止ボタン）・C（ホーム端）の三か所を必ず通る、短い道をつなぎます。', kind: 'route',
    intro: ['朝の風は、落ち葉を点字ブロックの上に運びます。三か所、順番を決めて。'],
    config: { grid: ['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], must: ['A', 'B', 'C'], best: bestRoute(['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], ['A', 'B', 'C']), legend: { '#': '壁・柱（通れない）', '~': '清掃中で滑りやすい（遅い）', A: '階段下', B: '非常停止ボタン', C: 'ホーム端', S: '起点', G: '事務室側の出口' } },
    good: '無駄がない。毎朝この順で回れますね。', mid: '回れていますが、少し遠回りでした。', bad: '一か所、見落としです。巡回は、抜けが一番怖い。', ge: [ev('safety', 3), ev('accuracy', 1), sk('patrol', 3)], log: '早朝のホームを巡回', min: 25 });
  N['ch3.hub'].interactions.push({ id: 'plat_phone', object: 'phone', label: '指令直通電話に、巡回結果を報告する', goto: 'ch3.plat_phone_1', requires: ALL(BR, PLAT, T('>=', hm(6, 10)), T('<', hm(8, 30))), once: true, icon: '📞' });
  N['ch3.hub'].goals.push({ id: 'g_plat_phone', label: '（ホーム）指令へ、巡回結果を報告する', when: F('ch3.plat_phone_done'), optional: true, showWhen: ALL(PLAT, T('>=', hm(6, 10))) });
  line('ch3.plat_phone_1', [
    '直通電話が、一度だけ短く鳴った。杉浦が目で「出ろ」と言う。',
    ['hamaguchi', '指令の浜口。巡回結果を。', 'normal'],
    ['player', '二番線の照明が一灯、それから風で落ち葉が……'],
    ['hamaguchi', '待った。結論から。異常あり、なし。', 'serious'],
    ['player', '異常あり。二番線ホーム、照明一灯。運行への影響なし。'],
    ['hamaguchi', 'それだ。結論、場所、影響。十八年、それしか言ってない。'],
  ], 'ch3.plat_phone_c', { view: OF(['sugiura'], '6:40 駅事務室 指令直通電話') });
  choice('ch3.plat_phone_c', '電話を切ると、杉浦が見ていた。報告を、どう振り返る？', [
    opt('fix', '「結論が出せませんでした。順序を紙に書いておきます」', 'ch3.plat_phone_a', { tone: 'honest', effects: [ev('reporting', 3), rel('sugiura', 1, 0)] }),
    opt('pass', '「何とか伝わりました。慣れればできます」', 'ch3.plat_phone_b', { tone: 'quick', effects: [ev('reporting', 0)] })
  ], { who: 'sugiura', view: OF(['sugiura']) });
  line('ch3.plat_phone_a', [['sugiura', '紙でいい。俺は今でも、手帳に書いている。', 'smile']], 'ch3.plat_phone_end', { view: OF(['sugiura']) });
  line('ch3.plat_phone_b', [['sugiura', '慣れる前に、一度間違える。順序は今のうちに書いておけ。']], 'ch3.plat_phone_end', { view: OF(['sugiura']) });
  fx('ch3.plat_phone_end', [set('ch3.plat_phone_done'), set('ch3.plat_report_order'), rel('hamaguchi', 1, 0), time(15), log('指令へ、ホーム巡回の結果を報告', 'work')], 'ch3.hub');

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
  ], res3('ch3.off_log_good', 'ch3.off_log_mid', 'ch3.off_log_bad', [ev('reporting', 3), ev('accuracy', 3)], [ev('accuracy', 1)], [ev('accuracy', -2)]), ['適切', '不適切']);
  N['ch3.off_log_task'].view = v3('npc:terminal', '駅事務室 業務端末');
  line('ch3.off_log_good', [['kubota', '「たぶん」を全部見抜きましたね。日報が怖くなくなる頃です。', 'smile']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done')] });
  line('ch3.off_log_mid', [['kubota', '「たぶん」が出たら、一度手を止めて事実を探しましょう。']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done')] });
  line('ch3.off_log_bad', [['kubota', '推測は、事実の顔をして後の人を迷わせます。一緒に読み直しましょう。', 'serious']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done')] });
  line('ch3.off_book_1', [
    '棚の隅に、背表紙の剥げた黒い綴りがあった。「引継ぎ帳」。',
    ['sugiura', '開業からの手書きだ。読むのはいい。書くなら、日付と名前。ペンでだ。'],
    '「ホーム時計 三分遅れ」「雪のため始発 十五分遅れ」。小さな事実が、墨のように積もっている。',
    ['player', '誰が書いたかが、残るんですね。'],
    ['sugiura', '紙は燃えるか、無くなるか。名前だけは、最後まで残る。']
  ], 'ch3.off_book_c', { effects: [set('ch3.off_book_seen')], view: OF(['sugiura'], '7:20 駅事務室 古い引継ぎ帳') });
  branch('ch3.off_book_c', [[F('legacy.notebook_missing'), 'ch3.off_book_m']], 'ch3.off_book_end');
  line('ch3.off_book_m', [
    ['player', '去年の秋の頁だけ、切り取られています。'],
    ['sugiura', '………見なかったことにしろ。駅長が、いつか話す。', 'worry']
  ], 'ch3.off_book_end', { effects: [set('ch3.off_book_cut'), rel('sugiura', 1, 0)], view: OF(['sugiura']) });
  fx('ch3.off_book_end', [set('ch3.off_book_done'), time(20), log('古い引継ぎ帳を読ませてもらう', 'work')], 'ch3.hub');

  // =====================================================================
  // 眠気の自己申告（8:40）：重要選択
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

  choice('ch3.sleepy_choice', '眠気が、はっきりしてきた。ここで、どうする？', [
    opt('honest', '「眠気が強くて、確認が不安です。少し休ませてください」と言う', 'ch3.hn_1', { tone: 'honest', effects: [set('ch3.honest'), ev('reporting', 3), ev('safety', 3), rel('sugiura', 2, 1), rel('kubota', 1, 1)] }),
    opt('push', '「大丈夫です」と答えて、そのまま続ける', 'ch3.pu_1', { tone: 'risky', effects: [set('ch3.pushed'), ev('safety', -2), ev('reporting', -2)] }),
    opt('coffee', '席を外して濃いコーヒーを飲み、何も言わずに戻る', 'ch3.pu_c', { tone: 'quick', effects: [set('ch3.pushed'), set('ch3.coffee'), ev('safety', -1), ev('reporting', -2)] })
  ], { important: true, who: 'kubota', view: OF(['sugiura', 'kubota']) });

  // --- 正直に申告 ---
  line('ch3.hn_1', [
    ['kubota', 'まず座ってください。立っていなくていいです。'],
    '杉浦が、珍しくペンを置いた。',
    ['sugiura', '……言ったか。黙って続けて取り返しがつかん方が、よほど迷惑だ。'],
    ['sugiura', '迷惑には、軽いのと重いのがある。今のは軽い方だ。'],
    ['sugiura', '状態を言葉にしろ。報告の稽古だ。']
  ], 'ch3.hn_task', { view: OF(['sugiura', 'kubota'], '8:42 駅事務室') });

  N['ch3.hn_task'] = { id: 'ch3.hn_task', type: 'task', kind: 'compose', title: '体調の申告を、組み立てる', intro: '「状態」「業務への影響」「お願いしたいこと」を、伝わる言葉で組み立ててください。',
    slots: [
      { id: 'state', label: '状態', options: [
        { id: 's1', text: '八時過ぎから、画面の文字が二重に見えて、確認の途中で、何度か意識が遠のきそうになります。', good: true, why: 'いつから、どんな状態か、具体的に伝わります。' },
        { id: 's2', text: '少し眠いだけです。', good: false, why: '程度が分かりません。具体的な状態を伝えます。' },
        { id: 's3', text: '昨夜、遅くまで起きていた自分が悪いです。', good: false, why: '原因の追及より、いまの状態の共有が先です。' }] },
      { id: 'effect', label: '業務への影響', options: [
        { id: 'e1', text: 'この状態で、券売機の履歴の確認や、放送を行うと、見落としや言い間違いが出る恐れがあります。', good: true, why: '業務への具体的な影響が、示されています。' },
        { id: 'e2', text: '仕事には、まったく影響ありません。', good: false, why: '申告の意味が、なくなってしまいます。' },
        { id: 'e3', text: 'みなさんに迷惑がかかるので、本当は、言いたくありません。', good: false, why: '気持ちの説明で、状態も影響も伝わっていません。' }] },
      { id: 'ask', label: 'お願いしたいこと', options: [
        { id: 'r1', text: '十五分ほど休憩をいただき、戻ったら、その間の確認を、どなたかに見てもらえませんか。', good: true, why: '休憩で様子を見て、確認を二重化する、現実的な依頼です。' },
        { id: 'r2', text: '何もしなくていいので、放っておいてください。', good: false, why: '業務の穴ができます。代替を相談する姿勢が必要です。' },
        { id: 'r3', text: '今日は、もう、帰らせてください。', good: false, why: '程度に対して過大な申し出です。まず休憩で様子を見る依頼が、適切です。' }] }
    ],
    results: [{ min: 66, goto: 'ch3.hn_good', effects: [ev('reporting', 4)] }, { min: 34, goto: 'ch3.hn_mid', effects: [ev('reporting', 1)] }, { min: 0, goto: 'ch3.hn_bad', effects: [ev('reporting', -1)] }],
    view: OF(['sugiura', 'kubota'], '8:44 駅事務室 申告') };
  line('ch3.hn_good', [['sugiura', '状態、影響、依頼。これなら誰でも動ける。', 'smile'], ['kubota', '私の新人のときと、一字一句同じです。']], 'ch3.hn_rest', { effects: [set('ch3.report_good'), rel('sugiura', 1, 1)], view: OF(['sugiura', 'kubota']) });
  line('ch3.hn_mid', [['sugiura', '大筋は伝わった。「いつから」が欲しい。次はそこだ。']], 'ch3.hn_rest', { view: OF(['sugiura', 'kubota']) });
  line('ch3.hn_bad', [['sugiura', '言いにくいのは分かる。あとで一緒に直そう。', 'normal']], 'ch3.hn_rest', { view: OF(['sugiura', 'kubota']) });

  line('ch3.hn_rest', [
    '湯呑みの麦茶は、思ったより熱かった。',
    ['sugiura', '十五分、目を閉じろ。眠らなくていい。'],
    ['sugiura', '二十五年前、俺は黙った。放送で行先を取り違えた。誰も乗り間違えなかった。運だ。'],
    ['sugiura', '先輩は言った。「言えない空気を作った俺たちが悪い」と。'],
    ['kubota', '私も聞かれました。「眠いか」って。泣きそうでした。', 'smile'],
    ['sugiura', '次は、お前が聞け。']
  ], 'ch3.hn_end', { effects: [rel('sugiura', 1, 2), set('ch3.sugiura_story'), time(15)], view: HR(['sugiura', 'kubota'], '8:50 休憩室') });
  fx('ch3.hn_end', [set('ch3.sleepy_done'), log('眠気を正直に申告し、休憩を取る', 'work'), tl('4月19日 眠気を正直に申告した')], 'ch3.mid_merge');

  // --- 無理して続ける ---
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
  N['ch3.pu_slip'] = { id: 'ch3.pu_slip', type: 'branch', cases: [{ when: PLAT, goto: 'ch3.pu_slip_plat' }, { when: OFFC, goto: 'ch3.pu_slip_off' }], else: 'ch3.pu_slip_svc' };
  line('ch3.pu_slip_svc', [
    '九時十分。千円札を崩す指が、百円玉の山から五百円玉をつまんでいた。',
    ['kubota', 'いま、五百円玉を混ぜていませんか。', 'surprise'],
    ['player', 'え。……二枚、混ざってました。'],
    ['kubota', '二重確認は、運を当てにしないための仕組みです。', 'serious']
  ], 'ch3.pu_talk', { effects: [set('ch3.slip_cash'), ev('accuracy', -2)], view: OF(['kubota'], '9:10 窓口') });
  line('ch3.pu_slip_plat', [
    '九時十分。記録簿の日付欄に、昨日の日付を書いていた。',
    ['sugiura', '日付。もう一度見ろ。', 'serious'],
    ['player', '……十八日。昨日です。'],
    ['sugiura', '間違いを見つけたのが、書いた本人じゃない。そこが問題だ。']
  ], 'ch3.pu_talk', { effects: [set('ch3.slip_date'), ev('accuracy', -2)], view: OF(['sugiura'], '9:10 駅事務室') });
  line('ch3.pu_slip_off', [
    '九時十分。送信ボタンの数秒前、「二番線照明」が「異常なし」になっていた。',
    ['kubota', 'そこ、「異常あり」です。', 'surprise'],
    ['kubota', '読み合わせは、こういう時のためです。', 'serious']
  ], 'ch3.pu_talk', { effects: [set('ch3.slip_log'), ev('accuracy', -2)], view: OF(['kubota'], '9:10 駅事務室') });
  line('ch3.pu_talk', [
    ['sugiura', '休憩。今すぐだ。', 'serious'],
    '麦茶が、無言で机に置かれた。鍵束の音が、遠ざかっていく。',
    ['sugiura', '「大丈夫です」と言った時、大丈夫だったか。'],
    ['player', '……眠かったです。'],
    ['sugiura', '言えん空気を作ったのも、こっちだ。だが「できない」と言うのも、仕事だ。'],
    ['kubota', '私も同じ失敗をしました。責めません。次は先に。', 'smile']
  ], 'ch3.pu_end', { effects: [rel('sugiura', 0, 1), time(15)], view: HR(['sugiura', 'kubota'], '9:15 休憩室') });
  fx('ch3.pu_end', [set('ch3.sleepy_done'), log('眠気を言い出せず、小さな誤りを出す', 'work'), tl('4月19日 眠気を言い出せず、小さな誤りを出した')], 'ch3.mid_merge');

  // --- 合流：どちらの選択も、ここで再び、見える ---
  branch('ch3.mid_merge', [[F('ch3.honest'), 'ch3.merge_h']], 'ch3.merge_p');
  line('ch3.merge_h', [
    '机の上に、湯気の立つおしぼりが置いてあった。',
    ['kubota', '助役が、あなたの分も。私の新人のときも同じでした。', 'smile'],
    ['sugiura', '午後も来る。来たら、先に言え。']
  ], 'ch3.hub', { effects: [set('ch3.merge_seen')], view: OF(['sugiura', 'kubota'], '9:00 駅事務室') });
  line('ch3.merge_p', [
    '机の端に、付箋が一枚。細い字で、「眠いときは先に言う　杉浦」。',
    ['kubota', 'それ、私も貼られました。三年、持っていました。', 'smile'],
    ['sugiura', '剥がしてもいい。貼られたことは、忘れるな。']
  ], 'ch3.hub', { effects: [set('ch3.merge_seen')], view: OF(['sugiura', 'kubota'], '9:30 駅事務室') });

  // =====================================================================
  // 朝の休憩（10:30）：夜明けの感想（重要選択）
  // =====================================================================
  line('ch3.breakfast', [
    '味噌汁の湯気が、窓の光の中で、ゆっくり傾いた。',
    ['kubota', '長い朝でしたね。', 'smile'],
    ['sugiura', '慣れると一瞬だ。それが怖い。……夜明けは見たか。五時十四分。']
  ], 'ch3.bf_branch', { effects: [{ clock: { minute: hm(10, 30) } }], view: HR(['sugiura', 'kubota'], '10:30 休憩室 朝食') });
  branch('ch3.bf_branch', [[F('ch3.honest'), 'ch3.bf_h']], 'ch3.bf_p');
  line('ch3.bf_h', [
    ['sugiura', '眠いと言ったのが、今日いちばんの働きだ。'],
    ['kubota', '助役が人を褒めるの、珍しいですよ。', 'smile'],
    ['sugiura', '余計なことを言うな。']
  ], 'ch3.bf_dawn', { view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_p', [
    ['sugiura', '責めん。付箋の意味だけ覚えろ。明日から毎朝聞く。「眠いか」と。'],
    ['kubota', '私は「眠れましたか」と送ります。', 'smile'],
    ['player', '次は、先に言います。']
  ], 'ch3.bf_dawn', { view: HR(['sugiura', 'kubota']) });
  choice('ch3.bf_dawn', '杉浦が窓を見たまま聞いた。「今日の夜明け、どうだった」', [
    opt('like', '「静かで、きれいでした。また見たいです」', 'ch3.bf_like', { tone: 'caring', effects: [set('ch3.dawn_like'), rel('sugiura', 1, 2), ev('service', 1)] }),
    opt('hard', '「正直、つらかったです。体が追いつきません」', 'ch3.bf_hard', { tone: 'honest', effects: [set('ch3.dawn_hard'), rel('sugiura', 1, 1), ev('reporting', 2)] }),
    opt('unsure', '「まだ分かりません。もう何回か見てから決めます」', 'ch3.bf_unsure', { tone: 'careful', effects: [set('ch3.dawn_unsure'), rel('sugiura', 0, 1), ev('accuracy', 1)] })
  ], { important: true, who: 'sugiura', view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_like', [
    ['sugiura', '向く奴は、夜明けで足が止まる。'],
    ['sugiura', '来年の三月、俺は定年だ。この鍵を誰に渡すか、考えている。'],
    ['kubota', '助役、その話はまだ……。', 'worry'],
    ['sugiura', '言っておくだけだ。']
  ], 'ch3.bf_end', { effects: [set('ch3.sugiura_retire_hint'), rel('sugiura', 1, 1)], view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_hard', [
    ['sugiura', 'つらいと言えるなら、続く。'],
    ['kubota', '三か月は、みんな寮で泣いてます。私もです。', 'smile'],
    ['sugiura', '壊れるな。続く範囲で続けろ。']
  ], 'ch3.bf_end', { effects: [set('ch3.early_hard'), rel('kubota', 1, 1)], view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_unsure', [
    ['sugiura', '分からんでいい。何回か見ろ。答えは向こうから来る。'],
    ['kubota', '私は三回目で分かって、五回目でまた分からなくなりました。', 'smile'],
    ['sugiura', 'それも込みで、早番だ。']
  ], 'ch3.bf_end', { view: HR(['sugiura', 'kubota']) });
  fx('ch3.bf_end', [set('ch3.break_done'), time(30), tr('station_basic', 10), log('早番の休憩。夜明けの感想を話す', 'work')], 'ch3.wrap');

  // 持ち場別の、ひとこと（章の終わりでも、持ち場の違いを残す）
  branch('ch3.wrap', [[PLAT, 'ch3.wrap_plat'], [OFFC, 'ch3.wrap_off']], 'ch3.wrap_svc');
  line('ch3.wrap_svc', [['sakai', '（売店の前で）津村さんには会えた？ 明日も同じ時間に来るわよ。', 'smile']], 'ch3.wrap_end', { view: OF(['sakai'], '11:20 売店前') });
  line('ch3.wrap_plat', [['hamaguchi', '（電話）今朝の巡回報告、きれいでした。杉浦さんから聞いてます。', 'smile']], 'ch3.wrap_end', { view: OF(['sugiura'], '11:20 駅事務室') });
  line('ch3.wrap_off', [['sugiura', '日報の末尾に、日付と名前。ペンでだ。……よし。頁が一枚、増えた。', 'smile']], 'ch3.wrap_end', { view: OF(['sugiura'], '11:20 駅事務室') });
  line('ch3.wrap_end', [
    '午後は券売機の補充を手伝い、十四時十五分に、定刻で上がった。',
    '寮で夕方まで眠った。夢の中で、鍵束が、ちゃり、と鳴った。'
  ], 'ch3.end', { view: HR([], '4月19日（月） 15:00 社員寮') });

  N['ch3.end'] = { id: 'ch3.end', type: 'end', chapter: 'ch3', title: '第3章 はじめての早番', nextChapter: 'ch4',
    summary: '夜明け前から十時半までの、静かな一日。眠気を申告するか、無理をするか。その選択は、先輩の信頼と、自分の働き方の癖として、これからの勤務に残っていく。',
    effects: [tl('4月19日 初めての早番を終える'), log('第3章を終了', 'chapter')] };
}
