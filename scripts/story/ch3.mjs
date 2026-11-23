// R7 第3章「はじめての早番」（4月18日(日)夜〜19日(月)朝）。
// 構造：前夜（勤務間隔の確認と夜の過ごし方）→ 夜明け前から10:30までの短いハブ → 眠気の自己申告（重要選択）→ 朝食と夜明けの感想。
// 持ち場（route.service / platform / office）で、午前の中盤の場面・人物・業務の形式が別物になる。
export default function ch3(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, mini, hub, P, res3, chk } = k;

  // ---- 人物 ----
  characters.sugiura = { id: 'sugiura', name: '杉浦 恒夫', kana: 'すぎうら つねお', role: '駅務助役（早番担当）', dept: 'station', age: 57, years: 35, uniform: '#1d2a44', hair: '#8a8a86', skin: '#dcb48c', trait: '口数は少ないが、朝の駅のことは何でも知っている。無理をしている人をすぐ見抜く。', bio: '早番を二十五年担当してきた助役。久保田が新人の頃、早番を教えた人。', gender: 'm', accessory: 'cap' };
  characters.tsumura = { id: 'tsumura', name: '津村 和夫', kana: 'つむら かずお', role: '利用者（始発の常連）', dept: 'none', age: 67, years: 0, uniform: '#5a6a5a', hair: '#c8c8c8', skin: '#dcb48c', trait: '海浜口の食堂の仕込みのため、二十五年、毎朝この始発に乗っている。', bio: '杉浦助役とは、改札越しの「おはよう」だけで二十五年の付き合い。', gender: 'm', accessory: 'bag' };

  // ---- 持ち場の判定（route.* が無ければ接客ルートを既定とする） ----
  const PLAT = F('route.platform'), OFFC = F('route.office'), SVC = ALL(NF('route.platform'), NF('route.office'));
  const BR = F('ch3.briefed');
  const HR = (who, cap) => v25('hr', who, cap), OF = (who, cap) => v25('office', who, cap);

  // 最短経路コスト（経路課題の「最短」算出用。build-story.mjs のものと同じ考え方）
  const bestRoute = (grid, must) => { const H = grid.length, W = grid[0].length; let s; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) { q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi; const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); } } }
    return 20; };

  // =====================================================================
  // 前夜（4月18日 日曜 20:30）：勤務間隔の確認 → 夜の過ごし方（重要選択）
  // =====================================================================
  line('ch3.open', [
    '4月18日（日）、午後八時半。社員寮の六畳間のハンガーに、アイロンをかけたばかりの制服のシャツが吊るされている。',
    '明日は、初めての早番。始業は五時三十分。公休だった今日は、一日かけて、体を朝に向けて慣らしてきたつもりだった。',
    '携帯の画面が点いた。',
    ['kubota', '（メッセージ）お疲れさまです。明日の早番、杉浦助役が見てくださいます。私も同じ早番で入ります。', 'smile'],
    ['kubota', '（メッセージ）杉浦さんは、私が新人のとき、早番を教えてくれた人です。口数は少ないけれど、朝のことなら何でも知っています。'],
    ['kubota', '（メッセージ）出勤前に、勤務表の「勤務間隔」の欄を、必ず自分の目で確認してください。早番は、前の晩から始まっています。'],
    ['player', '（前の晩から、か。…確認してみよう）']
  ], 'ch3.eve_task', { effects: [{ clock: { addDay: 13, minute: hm(20, 30) } }, tl('4月18日 初めての早番の前夜'), log('第3章 はじめての早番', 'chapter')], view: HR(['kubota'], '4月18日（日） 20:30 社員寮') });

  N['ch3.eve_task'] = { id: 'ch3.eve_task', type: 'task', kind: 'checklist', title: '前夜の確認', intro: '早番の前夜の過ごし方について、正しい記述か、誤りかを判断してください。', config: { labels: ['正しい', '誤り'] },
    items: [
      { id: 'interval', label: '前回の終業は17:15、明日の始業は5:30。勤務間隔は12時間15分で、社内規程の「11時間以上」を満たしている', truth: 'ok', why: '前の勤務の終わりから次の始業まで、規程で定められた間隔が空いています。' },
      { id: 'walk', label: '寮から駅まで徒歩約12分。4:50に出れば5:05に着き、始業前に身支度を整える余裕がある', truth: 'ok', why: '始発前は電車がありません。徒歩の時間を含めて逆算しておきます。' },
      { id: 'alarm', label: '目覚ましはスマートフォン1台で十分。電池が切れても、朝は自然に起きられるはず', truth: 'ng', why: '早番は遅刻が許されません。目覚ましは複数用意し、電池や音量も前夜に確認します。' },
      { id: 'drink', label: '眠れなくても、栄養ドリンクを飲めば、睡眠の代わりになる', truth: 'ng', why: '睡眠の代わりになるものはありません。眠れない夜は、体を休めること自体が大切です。' },
      { id: 'study', label: '手順書の予習は大切だが、睡眠を大きく削ってまで行うと、翌朝の判断力が落ちる', truth: 'ok', why: '眠気は、見落としや言い間違いの原因になります。予習は、睡眠を削らない範囲で。' },
      { id: 'sick', label: '朝、体調に不安があるときは、始業前でも事務室へ電話して相談してよい', truth: 'ok', why: '体調の相談は、遠慮せず早めに。事前の連絡のほうが、職場の対応も取りやすくなります。' }
    ],
    results: res3('ch3.eve_good', 'ch3.eve_mid', 'ch3.eve_bad', [ev('accuracy', 3), ev('safety', 2), set('ch3.interval_ok')], [ev('accuracy', 1)], [ev('accuracy', -2), ev('safety', -1)]), view: HR(['kubota'], '4月18日（日） 20:45 社員寮') };
  line('ch3.eve_good', [['kubota', '（メッセージ）確認できましたか。間隔も、起きる時間も、体調の連絡先も。そこまで見られていれば、もう半分は大丈夫です。', 'smile']], 'ch3.eve_choice', { view: HR(['kubota']) });
  line('ch3.eve_mid', [['kubota', '（メッセージ）惜しいところもありましたね。でも、見直したこと自体が大事です。目覚ましは必ず二台、にしてくださいね。']], 'ch3.eve_choice', { view: HR(['kubota']) });
  line('ch3.eve_bad', [['kubota', '（メッセージ）勤務間隔と体調の連絡先だけは、必ず頭に入れておいてください。後で、一緒に確認しましょう。', 'serious']], 'ch3.eve_choice', { view: HR(['kubota']) });

  choice('ch3.eve_choice', '消灯までの数時間を、どう過ごしますか？', [
    opt('sleep', '手順書は明日の朝に任せて、早めに床につく', 'ch3.eve_sleep', { tone: 'careful', effects: [set('ch3.slept_well'), ev('safety', 1)] }),
    opt('study', '眠くなるまで、手順書と配置図を読み込む', 'ch3.eve_study', { tone: 'risky', effects: [set('ch3.slept_short'), ev('accuracy', 1), ev('safety', -1)] }),
    opt('call', '眠れないと言う山科さんからの電話に、つきあう', 'ch3.eve_call', { tone: 'caring', effects: [set('ch3.slept_short'), set('ch3.called_yama'), rel('yamashina', 1, 2)] })
  ], { important: true, who: 'kubota', view: HR(['kubota']) });

  line('ch3.eve_sleep', [
    '風呂で体を温め、洗濯物を畳み、目覚ましを二台、別々の音にして枕元に置いた。',
    ['player', '（手順書は、朝に見ても間に合う。今は、眠ることが仕事だ）'],
    '窓の外では、国道を走るトラックの音が、少しずつ間遠になっていく。',
    '二十一時十分。電気を消す。目を閉じると、昼間の券売機の前で迷っていた、年配の男性の顔がふと浮かんで、消えた。',
    '眠りに落ちる前、{player}はなぜか、始発電車の最初の一人は、どんな顔をしているのだろう、と考えていた。'
  ], 'ch3.wake', { effects: [ev('safety', 1), time(30)], view: HR([], '4月18日（日） 21:10 社員寮') });
  line('ch3.eve_study', [
    '机にノートと手順書を広げ、開錠の順番を、声に出さずに口だけ動かして読み込んだ。',
    ['player', '（照明、改札機、券売機、シャッター…。順番が頭に入れば、明日は慌てずに済む）'],
    '気づくと、日付が変わる直前だった。肩が重い。目の奥が、ずんと熱い。',
    ['player', '（もう一回だけ。…いや、これ以上は逆効果かもしれない）'],
    '二十三時四十分。慌てて電気を消したが、頭の中を、手順書の文字が流れ続けて、なかなか眠れない。',
    '暗い天井を見つめているうちに、時計の針が、一回、二回、小さな音を立てて進んだ。'
  ], 'ch3.wake', { effects: [time(30)], view: HR([], '4月18日（日） 23:40 社員寮') });
  line('ch3.eve_call', [
    '二十二時四十分。枕元の携帯が震えた。山科だった。',
    ['yamashina', '悪い、起きてたか。…明日の早番、緊張して眠れなくてさ。', 'worry'],
    ['player', '実は、こっちも同じだよ。五時半の点呼なんて、想像がつかない。'],
    ['yamashina', '俺は来週が早番なんだ。その前に、お前の話を聞いておきたくて。それと…ちょっと、別のことも。'],
    ['yamashina', '基地入門研修の社内公募、あるだろ。駅から推薦される枠が、一つだけだって聞いた。…俺、出したいんだ。志望書、まだ一行も書けてないけど。'],
    ['player', '一つだけの枠か。それは、緊張するね。'],
    ['yamashina', 'うん。同期の中で、駅の評価がいちばん高い人が選ばれるんだと思うと、お前の顔が浮かぶ。変な意味じゃなくて。', 'smile'],
    ['yamashina', '…ごめん、寝る前にする話じゃなかったな。ただ、早番の話を聞くつもりが、結局自分の話になった。'],
    ['player', 'いいよ。今度、志望書を一緒に読ませて。僕でよければ。'],
    ['yamashina', '本当か。助かる。じゃあ、おやすみ。…明日、がんばれ。', 'smile'],
    '電話を切ったときには、日付が変わろうとしていた。部屋の暗がりで、目だけが冴えている。'
  ], 'ch3.wake', { effects: [set('ch3.yama_slot_hint'), time(30)], view: HR(['yamashina'], '4月18日（日） 22:40 社員寮') });

  branch('ch3.wake', [[F('ch3.slept_well'), 'ch3.wake_a']], 'ch3.wake_b', {});
  line('ch3.wake_a', [
    '午前四時十分。二台の目覚ましが、別々の音で鳴った。',
    '暗い部屋の窓を開けると、冷たい空気が、まだ眠っている街の匂いを運んでくる。',
    ['player', '（寒い。…でも、頭は、ちゃんと動いている）'],
    '顔を洗い、制服に袖を通す。ネクタイを締める手が、昨日より、少しだけ落ち着いていた。'
  ], 'ch3.arrive', { effects: [{ clock: { addDay: 1, minute: hm(4, 10) } }, tl('4月19日 初めての早番の朝')], view: HR([], '4月19日（月） 4:10 社員寮') });
  line('ch3.wake_b', [
    '午前四時十分。二台の目覚ましが、別々の音で鳴った。一台目は、気づかないまま止めていた。',
    ['player', '（…眠い。まぶたが、重い）'],
    '暗い部屋の窓を開けると、冷たい空気が頬を刺す。目は覚めたが、頭の奥に、霧のようなものが残っている。',
    ['player', '（今日は、いつもより、自分の体を見ておいたほうがよさそうだ）'],
    '顔を洗い、制服に袖を通す。ネクタイを締める指先が、少しだけ鈍い。'
  ], 'ch3.arrive', { effects: [{ clock: { addDay: 1, minute: hm(4, 10) } }, tl('4月19日 初めての早番の朝')], view: HR([], '4月19日（月） 4:10 社員寮') });

  line('ch3.arrive', [
    '午前五時五分。青嶺中央駅の橋上駅舎は、まだ、夜の色をしていた。',
    '駅前の街灯が、濡れたようなアスファルトを照らしている。シャッターの降りた改札口の奥で、非常灯だけが、ぽつんと緑に光っていた。',
    '始業は五時三十分。それまでの二十五分は、出勤前の、自分の時間だ。'
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

  // ---- 夜明け（5:14） ----
  line('ch3.sunrise', [
    '午前五時十四分。ふと、東の空を見上げた。',
    '駅前のビルの向こうで、濃い藍色の空が、端から、ゆっくりと薄くなっていく。最初は、紙の縁のような白。それが、淡い橙に変わる。',
    '改札口の上の大きな窓ガラスに、その色が、うっすらと映り込んだ。駅舎の中の非常灯の緑と、空の橙が、重なる。',
    ['player', '（…こんな色の朝を、ちゃんと見たのは、初めてかもしれない）'],
    'どこかで、鳥が一声だけ鳴いた。まだ、人の声は、ひとつもしない。',
    '腕時計を見る。始業まで、あと十六分。深呼吸をひとつして、事務室へ向かった。'
  ], 'ch3.hub', { effects: [set('ch3.saw_dawn'), log('夜明けの青嶺中央駅', 'work')], view: v3('plaza', '5:14 駅前 夜明け') });

  // ---- 点呼と夜勤からの引継ぎ（5:30） ----
  line('ch3.brief', [
    '五時三十分。駅事務室の蛍光灯が、白々と点いている。夜勤の係員が、コーヒーの紙コップを置いて、立ち上がった。',
    ['sugiura', '早番の杉浦だ。今日の責任者は私。久保田と、新人の{player}が一緒に入る。よろしく。', 'normal'],
    ['kubota', 'おはようございます。今日は、杉浦助役の背中を見て、動いてください。', 'smile'],
    ['sugiura', '背中を見ても、分からないことは、聞け。ただし、五時台は、駅が一日で一番静かだ。声を出す前に、一度、耳を澄ませる癖をつけなさい。'],
    ['sugiura', '労務の確認をする。今日の勤務は五時三十分から十四時十五分。十時半から、休憩が四十五分。体調に不安があれば、遠慮なく、その場で言いなさい。我慢は、仕事の道具にならない。'],
    ['player', '…はい。分かりました。'],
    ['sugiura', 'では、夜勤の引継ぎを聞く。久保田、読め。'],
    ['kubota', '夜間の異常は一件。二番線ホームの照明が一灯切れています。交換は昼間の作業。立入に注意、とのことです。'],
    ['sugiura', '{player}、今の引継ぎ、あとで私に説明できるか。耳で聞いたことを、きちんと覚えておくのも、早番の仕事だ。']
  ], 'ch3.brief_note', { view: OF(['sugiura', 'kubota'], '5:30 駅事務室 点呼') });

  // 第2章の選択を、杉浦の態度と机上のメモで読み分ける
  branch('ch3.brief_note', [
    [F('ch2.idea_selfpost'), 'ch3.bn_self'],
    [F('ch2.proposal_sent'), 'ch3.bn_prop'],
    [F('ch2.idea_consult'), 'ch3.bn_cons']], 'ch3.bn_skip');
  line('ch3.bn_self', [
    ['sugiura', '駅長から、一枚メモを預かっている。「手順を飛ばさない新人に育ててくれ」とだけ書いてある。'],
    ['kubota', '（小声で）…先々週の、掲示の件ですね。私からも、杉浦さんに話しました。'],
    ['sugiura', '責めるつもりはない。ただ、今日は、開錠の手順を一つずつ、声に出して指差し確認してもらう。省略は、無しだ。', 'serious'],
    ['player', '…はい。一つずつ、やります。']
  ], 'ch3.handover_task', { effects: [set('ch3.strict_check'), rel('sugiura', -1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_prop', [
    ['sugiura', '駅長のメモがある。「新人の改善提案書、本社へ回した。結果を待て」。…券売機の案内表示の件か。'],
    ['kubota', '一週間の試行が、今朝から始まっています。券売機の横に、大きな文字の案内が、もう貼られていますよ。'],
    ['sugiura', '朝一番に来る、機械の苦手な客が、あれに助けられるかもしれん。見てきなさい。ただし、まず仕事だ。', 'smile'],
    ['player', '…はい。ありがとうございます。']
  ], 'ch3.handover_task', { effects: [rel('sugiura', 1, 1)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_cons', [
    ['sugiura', '駅長のメモだ。「相談してから動く新人。伸ばせ」。…それだけ書いてある。'],
    ['kubota', '券売機の案内の件、提案書をもう少し磨く、と話していましたね。'],
    ['sugiura', '相談できるのは、強みだ。だが、今日は、相談する前に、一度だけ自分で考える練習もしておけ。', 'normal'],
    ['player', '自分で考えてから、相談する。…やってみます。']
  ], 'ch3.handover_task', { effects: [rel('sugiura', 1, 0)], view: OF(['sugiura', 'kubota']) });
  line('ch3.bn_skip', [
    ['sugiura', '駅長のメモには、「気づいたことは、小さなことでも声にするよう伝えてほしい」とある。'],
    ['kubota', '券売機の前で、迷っていた方のことですね。気づいていたのに、今は見送った、と。'],
    ['sugiura', '見送るのも、判断のうちだ。だが、朝の駅は静かだ。気づいたことは、静かなうちに、声にしなさい。', 'normal'],
    ['player', '…今日、気づいたことは、その場で言います。']
  ], 'ch3.handover_task', { effects: [rel('sugiura', 0, 1)], view: OF(['sugiura', 'kubota']) });

  N['ch3.handover_task'] = { id: 'ch3.handover_task', type: 'task', kind: 'memory', title: '夜勤からの引継ぎを復唱する', intro: '引継ぎの要点を見て覚え、同じ順に選んでください。見返しはできません。',
    config: { sequence: ['2番線ホーム', '照明が1灯切れ', '交換は昼間', '立入に注意'], pool: ['1番線ホーム', '券売機3号機', '2番線ホーム', '照明が1灯切れ', '紙幣が詰まる', '交換は昼間', '立入に注意', '交換済み'], showMs: 4800, showLabel: '夜勤からの引継ぎ' },
    results: res3('ch3.ho_good', 'ch3.ho_mid', 'ch3.ho_bad', [ev('reporting', 3), ev('accuracy', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]), view: OF(['sugiura'], '5:35 駅事務室 引継ぎ') };
  line('ch3.ho_good', [['sugiura', '聞こえていたな。耳で聞いたことを、そのまま持ち歩ける。これは、早番の財産だ。', 'smile']], 'ch3.brief_end', { view: OF(['sugiura']) });
  line('ch3.ho_mid', [['sugiura', '八割、といったところか。残りの二割が、事故になる。もう一度、紙に書いて覚えなさい。']], 'ch3.brief_end', { view: OF(['sugiura']) });
  line('ch3.ho_bad', [['sugiura', '早番の引継ぎは、聞き直せない場面が多い。聞く目的を持って、最初から耳を開いておけ。', 'serious']], 'ch3.brief_end', { view: OF(['sugiura']) });
  fx('ch3.brief_end', [set('ch3.briefed'), time(5), tr('station_basic', 5), log('早番の点呼と夜勤からの引継ぎ', 'work')], 'ch3.hub');

  // ---- 共通の業務（シャッター開錠・始発前の点検・通勤の波） ----
  mini({ ch: 'ch3', key: 'unlock', req: BR, who: 'kubota', object: 'gate_wide', from: [5, 36], to: [6, 40], label: 'シャッターを開錠して、改札を開ける', goal: '（業務）シャッターと改札の開錠', title: 'シャッター開錠の手順', cam: 'gate_back',
    hint: '動くゲージが緑の範囲に入った瞬間にボタンを押して、三つの工程を行います。', kind: 'timing',
    intro: ['開錠は、鍵を回して終わりではありません。「回す」「巻き上げる」「固定を確かめる」の三工程です。', '急ぐと、固定が甘くなって、途中で降りてくることがあります。ゲージの動きに、体を合わせて。'],
    config: { rounds: [{ label: '鍵を回す' }, { label: '巻き上げる' }, { label: '固定を確かめる' }], width: 0.17, speed: 0.8, button: '今！' },
    good: '三つとも、ぴたりと合いました。このリズムを、体に覚えさせてください。', mid: '少しずれた工程がありました。固定の確認だけは、必ず目で見て。', bad: '固定が甘いと、シャッターが途中で降りることがあります。もう一度、落ち着いて。', ge: [ev('safety', 3), sk('patrol', 2)], log: '始発前のシャッターを開錠', min: 15 });

  mini({ ch: 'ch3', key: 'first_check', req: BR, who: 'kubota', object: 'elevator', from: [5, 36], to: [6, 20], label: '始発前に、暗い構内の安全を点検する', goal: '（業務）始発前の安全点検', title: '始発前のコンコース点検', cam: 'follow',
    hint: '夜間の暗がりの中で、足元や設備の異常を探してタップします。', kind: 'find',
    intro: ['始発前は、いつもの景色が、少し違って見えます。足元灯、非常灯、自動ドア。順番に、目を慣らしながら見ましょう。', '見つけたら、すぐ報告です。直すのは、その次。'],
    config: { scene: 'concourse', seconds: 38, props: [P(0.04, 0.1, 0.22, 0.3, '#2b3a55', '案内板'), P(0.34, 0.1, 0.22, 0.3, '#25374f', '時刻表'), P(0.64, 0.1, 0.3, 0.3, '#2f4a3f', '掲示板'), P(0.1, 0.7, 0.8, 0.12, '#4a5568', '通路')], spots: [
      { id: 'lamp', x: 0.3, y: 0.74, label: '足元灯が一つ消えている' }, { id: 'door', x: 0.8, y: 0.8, label: '自動ドアの下に小石が挟まっている' }, { id: 'sign', x: 0.14, y: 0.2, label: '案内板の前に、台車が置きっぱなし' }, { id: 'ok', x: 0.5, y: 0.22, real: false, label: '時刻表は最新です' }] },
    good: '暗いなかで、よく見えていました。報告も、的確です。', mid: '見落としが少しありました。足元から、順に見るのがコツです。', bad: '暗がりの見落としは、始発のお客様の転倒につながります。やり直しましょう。', ge: [ev('safety', 3), ev('accuracy', 1)], log: '始発前の構内を点検', min: 15 });

  mini({ ch: 'ch3', key: 'commute', req: ALL(BR, F('ch3.first_done')), who: 'kubota', object: 'emergency_btn', from: [7, 20], to: [9, 30], label: '通勤・通学の波を見守る', goal: '（業務）朝の人の流れの見守り', title: '朝の人の流れの見守り', cam: 'follow',
    hint: '黄色い線へ近づく人をタップして声をかけます。立ち止まっている人は見守るだけです。', kind: 'watch', config: { total: 8 },
    intro: ['七時を過ぎると、駅の音が変わります。靴音が増えて、ざわめきが戻ってくる。', 'でも、まだ人が少ないうちは、一人ひとりの顔が見えます。声をかけやすい時間です。'],
    good: '全員に、落ち着いて声がかけられました。顔を見て声をかけると、受け取る側も構えませんね。', mid: '何人か、線を越えさせてしまいました。視線を広く。', bad: '朝は、焦っている人が多い時間です。まず全体を見る練習をしましょう。', ge: [ev('safety', 3), ev('service', 1)], be: [ev('safety', -2)], log: '朝の人の流れを見守り', min: 20 });

  // ---- 津村さん（始発を待つ常連）：2D ----
  N['ch3.hub'].interactions.push({ id: 'tsumura', object: 'gate_wide', label: '始発を待つお客様に挨拶する', goto: 'ch3.ts_1', requires: ALL(BR, T('>=', hm(5, 38)), T('<', hm(5, 55))), once: true, icon: '👋' });
  N['ch3.hub'].goals.push({ id: 'g_ts', label: '（任意）始発を待つお客様に挨拶する', when: F('ch3.ts_done'), optional: true, showWhen: T('>=', hm(5, 38)) });
  line('ch3.ts_1', [
    '五時四十二分。シャッターを上げた改札口の外に、一人の男性が、ベンチに腰を下ろしていた。使い込んだ帆布のカバンを、膝の上に抱えている。',
    ['tsumura', 'おう。今日は、見ない顔がいるな。', 'normal'],
    ['sugiura', '津村さん、おはようございます。今日から、うちの新人が早番に入ります。', 'smile'],
    ['tsumura', 'そうかい。杉浦さんの下か。それは、鍛えられるな。…ほれ、いつもの。', 'smile'],
    '津村は、カバンから缶入りの温かい茶を取り出し、改札越しに杉浦へ差し出した。杉浦は、少しだけ頭を下げて、受け取る。',
    ['sugiura', '勤務中は、本当は、いただけないんですがね。これは、二十五年、断れない。'],
    ['tsumura', '二十五年だ。この駅が出来た年から、毎朝、五時五十二分の始発に乗ってる。海浜口の食堂の、仕込みでね。', 'smile'],
    ['player', '二十五年…毎朝、ですか。'],
    ['tsumura', '雨の日も、正月もだ。休みは、年に三日あるかないかだな。だから、この改札の「おはよう」が、うちの一日の始まりなんだよ。'],
    ['tsumura', 'あんた、名前は。…{player}さんか。覚えたぞ。駅の人は、顔と名前を覚えてもらうのが、仕事の半分だろう。'],
    ['sugiura', '津村さんが覚えてくだされば、いい。…津村さんは、駅の古い歴史を、一番よく知っている人だ。'],
    ['tsumura', 'おいおい、褒めても、何も出ないぞ。出るのは、茶だけだ。', 'smile']
  ], 'ch3.ts_branch', { view: OF(['tsumura', 'sugiura'], '5:42 改札口 始発前') });
  branch('ch3.ts_branch', [[ANY(F('legacy.helped_kajiwara'), F('ch2.shiraishi_motto')), 'ch3.ts_memory']], 'ch3.ts_choice');
  line('ch3.ts_memory', [
    ['tsumura', 'そういえば、{player}さん。昼のほうの駅員に、「顔を覚えるのが仕事の始まりだ」と話した人がいたそうだ。駅長さんだったか。'],
    ['player', '駅長に、そう教わりました。…梶原さんや、券売機の前の男性の顔も、まだ、覚えています。'],
    ['tsumura', 'ほう。いい新人だ。顔を覚える駅員がいる間は、この駅は大丈夫だよ。', 'smile']
  ], 'ch3.ts_choice', { effects: [set('ch3.ts_remembered'), rel('tsumura', 1, 1)], view: OF(['tsumura', 'sugiura']) });
  choice('ch3.ts_choice', '津村さんが、ふと、尋ねてきた。「あんた、この早番、好きになれそうかい？」', [
    opt('quiet', '「静かで、少し心細いです。でも、夜明けの色には驚きました」', 'ch3.ts_a', { tone: 'honest', effects: [rel('tsumura', 1, 1), set('ch3.ts_honest_feel')] }),
    opt('try', '「まだ分かりません。まず、一か月、続けてみます」', 'ch3.ts_b', { tone: 'careful', effects: [rel('tsumura', 1, 0), ev('accuracy', 1)] }),
    opt('ask', '「津村さんは、どうして二十五年も続けられたんですか？」', 'ch3.ts_c', { tone: 'caring', effects: [rel('tsumura', 1, 2), set('ch3.ts_asked')] })
  ], { who: 'tsumura', view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_a', [
    ['tsumura', 'そうだろう。心細いのは、悪いことじゃない。心細いうちは、気が張ってる。気が張ってるうちは、事故も起きにくい。'],
    ['tsumura', 'だが、いつか慣れる。慣れたときが、一番危ない。…杉浦さんも、昔、同じことを言ってたな。', 'normal'],
    ['sugiura', '余計なことを、覚えていらっしゃる。']
  ], 'ch3.ts_end', { view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_b', [
    ['tsumura', '一か月か。いい答えだ。一日で分かったような顔をするやつより、ずっと信用できる。'],
    ['sugiura', '一か月で足りなければ、三か月。三か月で足りなければ、一年だ。焦らなくていい。', 'smile']
  ], 'ch3.ts_end', { view: OF(['tsumura', 'sugiura']) });
  line('ch3.ts_c', [
    ['tsumura', 'おっ。そう来たか。…簡単だ。この改札の向こうに、毎朝、同じ顔があったからだよ。'],
    ['tsumura', '行きたくない朝もあった。女房が入院した年は、特にな。でも、杉浦さんが、黙って茶を受け取ってくれる。それだけで、不思議と、乗れた。'],
    ['sugiura', '…津村さん。', 'worry'],
    ['tsumura', '照れるな、照れるな。事実だ。{player}さん、覚えておきなさい。駅の人間は、乗る人の一日の最初の「居場所」になる。'],
    ['player', '居場所、ですか。…心に、留めておきます。']
  ], 'ch3.ts_end', { effects: [ev('service', 2)], view: OF(['tsumura', 'sugiura']) });
  fx('ch3.ts_end', [set('ch3.ts_done'), set('ch3.tsumura_met'), time(8), log('始発の常連・津村さんと挨拶', 'work')], 'ch3.hub');

  // ---- 始発（5:55） ----
  line('ch3.first', [
    '五時五十五分。ホームの端に、前照灯の光が、白く伸びてきた。',
    '電車が、静かに、ホームへ入ってくる。眠っていた駅が、ぱちりと目を開けたようだった。',
    ['kubota', 'ドア扱い、よし。お客様の乗降、見守ります。', 'normal']
  ], 'ch3.first_b', { view: v3('platform', '5:55 ホーム 始発列車') });
  branch('ch3.first_b', [[F('ch3.ts_done'), 'ch3.first_a'], [F('ch3.tsumura_met'), 'ch3.first_a']], 'ch3.first_c');
  line('ch3.first_a', [
    '車内の窓に、帆布のカバンを抱えた津村の姿が見えた。窓越しに、軽く手を挙げる。',
    ['player', '（いってらっしゃい、津村さん）'],
    '小さく会釈を返した。杉浦も、無言で、帽子のつばに指を添えていた。'
  ], 'ch3.first_end', { view: v3('platform', '5:55 ホーム 始発列車') });
  line('ch3.first_c', [
    '数人の乗客が、足早に乗り込んでいく。その中に、津村の姿が見えた気がした。',
    ['sugiura', '今日は、挨拶そびれたな。津村さんは、明日も乗る。…明日、また「おはよう」を言えばいい。'],
    ['player', '（二十五年、毎日…。僕は、明日、ちゃんと声が出るだろうか）']
  ], 'ch3.first_end', { view: v3('platform', '5:55 ホーム 始発列車') });
  fx('ch3.first_end', [set('ch3.first_done'), time(6), tr('station_basic', 5), log('始発列車を見送る', 'work')], 'ch3.hub');

  // =====================================================================
  // 持ち場別の午前（6:10〜9:30）：別の人物・別の業務形式
  // =====================================================================
  // --- 接客ルート：売店・窓口 ---
  mini({ ch: 'ch3', key: 'svc_window', req: ALL(BR, SVC), who: 'kubota', object: 'ticket_office', from: [6, 30], to: [9, 30], label: '開いたばかりの窓口で、朝の用件をさばく', goal: '（接客）早朝の窓口対応', title: '早朝の窓口対応', cam: 'follow',
    hint: '用件を聞いて、急ぎ・窓口で丁寧に・後で、の三つに振り分けます。', kind: 'sort',
    intro: ['早朝の窓口は、列車に間に合わせたい方と、落ち着いて相談したい方が、ほとんど半々です。', '急ぐ人には、まず結論を。迷っている人には、ゆっくり、聞く。この切り替えを覚えてください。'],
    config: { perItem: 7, bins: [{ id: 'fast', label: '急ぎ（列車優先で案内）' }, { id: 'calm', label: '窓口で丁寧に' }, { id: 'later', label: '後で・別の担当へ' }], items: [
      { id: 'a', label: '「六時十七分に乗りたい。ICカードの残高が足りない」', bin: 'fast', why: '時間が迫っています。精算機の場所と手順を、すぐ案内します。' },
      { id: 'b', label: '「通院の予約が九時。何番のホームから行けばいいか、地図で教えてほしい」', bin: 'calm', why: '時間は少し余裕があります。案内図を見ながら、ゆっくり説明します。' },
      { id: 'c', label: '「昨日の夜、電車に傘を置き忘れた」', bin: 'later', why: '遺失物の取扱いは、台帳と担当の確認が必要です。確認して、折り返します。' },
      { id: 'd', label: '「定期券の払い戻しを、今すぐしたい」', bin: 'calm', why: '払い戻しは手続きが多いので、窓口でお待ちいただき、丁寧に進めます。' },
      { id: 'e', label: '「次の電車、何番線から出ますか」', bin: 'fast', why: '一言で済む案内です。すぐ答えます。' },
      { id: 'f', label: '「近くに、朝から開いているパン屋はありますか」', bin: 'later', why: '駅の業務の範囲外です。案内所や地図の掲示をご案内します。' }] },
    good: '切り替えが、とても自然でした。急ぐ人にも、ゆっくりの人にも、安心されたはずです。', mid: '数件、順番が入れ替わりました。まず、「時間が迫っているか」を聞くのがコツです。', bad: '急ぐ人を待たせてしまいました。最初の一言で、時間を確認する癖をつけましょう。', ge: [ev('service', 3), ev('accuracy', 1), sk('ticket', 2)], log: '早朝の窓口を対応', min: 25 });
  N['ch3.hub'].interactions.push({ id: 'svc_sakai', object: 'sakai', label: '開店準備中の売店の坂井さんに、挨拶する', goto: 'ch3.svc_sakai_1', requires: ALL(BR, SVC, T('>=', hm(6, 10)), T('<', hm(8, 30))), once: true, icon: '🛍' });
  N['ch3.hub'].goals.push({ id: 'g_svc_sakai', label: '（接客）売店の坂井さんに挨拶する', when: F('ch3.svc_sakai_done'), optional: true, showWhen: ALL(SVC, T('>=', hm(6, 10))) });
  line('ch3.svc_sakai_1', [
    '売店のシャッターが、半分だけ上がっている。中で、坂井が、パンの箱を台の上に並べていた。',
    ['sakai', 'あら、新人さん。早番デビューだって？ 杉浦さんから、聞いてるよ。', 'smile'],
    ['player', 'おはようございます。…こんな早い時間から、売店は開くんですね。'],
    ['sakai', '開けるのは六時半。でも、仕入れは五時から。パンの箱は、毎朝、五時十分に届くのよ。あたしも、この時間に起きて、十年になる。'],
    ['sakai', '早番の人は、ここに寄ってね。お茶くらいなら、出してあげる。…ほら、そこに椅子がある。座って。'],
    ['player', '勤務中なので、立ったままで。でも、ありがとうございます。'],
    ['sakai', '真面目だね。…そういえば、あなた、津村さんには会った？ 五時五十二分の人。あの人、毎朝、うちでガムを買ってから乗るのよ。今日は、まだ。'],
    ['sakai', '常連さんの顔が、時間で決まってるの。五時五十二分は津村さん。六時四十分は、新聞配達の兄ちゃん。七時十分は、病院に通う看護師さん。その人たちの顔を見ると、「ああ、今日も駅が動き出した」って思うのよ。'],
    ['player', '時間で顔が決まっている、ですか。…覚えておきます。'],
    ['sakai', '覚えるんじゃなくて、気づくのよ。気づいたら、さりげなく「おはよう」。それだけで、大成功。', 'smile'],
    ['kubota', '（通りがかって）坂井さんの「常連の時刻表」は、駅の掲示より、正確です。私も、新人の頃に、教わりました。'],
    ['sakai', '失礼ね。掲示も、ちゃんと見てるわよ。', 'smile']
  ], 'ch3.svc_sakai_end', { view: OF(['sakai', 'kubota'], '6:35 売店前') });
  fx('ch3.svc_sakai_end', [set('ch3.svc_sakai_done'), set('ch3.svc_regulars'), rel('sakai', 1, 1), ev('service', 2), time(15), log('売店の坂井さんから、早朝の常連の話を聞く', 'work')], 'ch3.hub');

  // --- ホームルート：ホームの巡回と指令との連絡 ---
  mini({ ch: 'ch3', key: 'plat_round', req: ALL(BR, PLAT), who: 'kubota', object: 'tactile', from: [6, 15], to: [9, 30], label: 'ホームを、決まった順路で巡回する', goal: '（ホーム）早朝のホーム巡回', title: '早朝のホーム巡回経路', cam: 'follow',
    hint: '起点から着点まで、A（階段下）・B（非常停止ボタン）・C（ホーム端）の三か所を必ず通る、短い道をつなぎます。', kind: 'route',
    intro: ['始発が出たあとの、ホームの巡回です。早朝は、落ち葉やごみが、朝の風で、点字ブロックの上に溜まります。', '三か所を必ず見て回る。順番を決めておくと、見落としが減ります。'],
    config: { grid: ['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], must: ['A', 'B', 'C'], best: bestRoute(['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], ['A', 'B', 'C']), legend: { '#': '壁・柱（通れない）', '~': '清掃中で滑りやすい（遅い）', A: '階段下', B: '非常停止ボタン', C: 'ホーム端', S: '起点', G: '事務室側の出口' } },
    good: '無駄のない順路です。これなら、毎朝、同じ時間で回れますね。', mid: '回れていますが、少し遠回りでした。順番を決めておくと楽になります。', bad: '一か所、見落としがありました。巡回は、抜けが一番怖いです。', ge: [ev('safety', 3), ev('accuracy', 1), sk('patrol', 3)], log: '早朝のホームを巡回', min: 25 });
  N['ch3.hub'].interactions.push({ id: 'plat_phone', object: 'phone', label: '指令直通電話に、巡回結果を報告する', goto: 'ch3.plat_phone_1', requires: ALL(BR, PLAT, T('>=', hm(6, 10)), T('<', hm(8, 30))), once: true, icon: '📞' });
  N['ch3.hub'].goals.push({ id: 'g_plat_phone', label: '（ホーム）指令へ、巡回結果を報告する', when: F('ch3.plat_phone_done'), optional: true, showWhen: ALL(PLAT, T('>=', hm(6, 10))) });
  line('ch3.plat_phone_1', [
    '駅事務室の直通電話が、一度だけ、短く鳴った。杉浦が目で合図して、{player}が受話器を取る。',
    ['hamaguchi', 'こちら輸送指令の浜口です。青嶺中央、早番の巡回結果を、お願いします。', 'normal'],
    ['player', '青嶺中央駅、{player}です。ホームの巡回を終えました。…ええと、二番線の照明が一灯、切れています。それから、風で飛ばされた落ち葉が…'],
    ['hamaguchi', '待ってください。最初に、結論を。「異常あり」か「異常なし」か、を。', 'serious'],
    ['player', '…異常あり、です。二番線ホームの照明が一灯切れています。夜間の引継ぎにも、同じ記載がありました。'],
    ['hamaguchi', 'それでいい。順序は、「結論、場所、内容、対応」。次に、運行への影響があるかどうかを、必ず付けること。'],
    ['player', '運行への影響は、ありません。交換は、昼間の作業の予定です。'],
    ['hamaguchi', '受け取りました。…早番の巡回報告は、一日の最初の記録になります。ここが曖昧だと、後の人が全員、困る。覚えておいてください。'],
    ['sugiura', '（受話器の向こうの声に、小さく頷いて）浜口さんは、もう十八年、この時間の電話を取っている。']
  ], 'ch3.plat_phone_c', { view: OF(['sugiura'], '6:40 駅事務室 指令直通電話') });
  choice('ch3.plat_phone_c', '電話を切ったあと、杉浦がこちらを見ている。報告を、どう振り返りますか？', [
    opt('fix', '「最初に結論を言えず、混乱しました。次は、順序を紙に書いておきます」', 'ch3.plat_phone_a', { tone: 'honest', effects: [ev('reporting', 3), rel('sugiura', 1, 0)] }),
    opt('pass', '「何とか伝わりました。慣れれば、できると思います」', 'ch3.plat_phone_b', { tone: 'quick', effects: [ev('reporting', 0)] })
  ], { who: 'sugiura', view: OF(['sugiura']) });
  line('ch3.plat_phone_a', [['sugiura', 'それが、いい。紙に書くのは、恥ではない。私は、いまだに、手帳に書いている。', 'smile']], 'ch3.plat_phone_end', { view: OF(['sugiura']) });
  line('ch3.plat_phone_b', [['sugiura', '慣れる前に、必ず一度、間違える。そのとき、慌てないように、順序は、今のうちに書いておけ。']], 'ch3.plat_phone_end', { view: OF(['sugiura']) });
  fx('ch3.plat_phone_end', [set('ch3.plat_phone_done'), set('ch3.plat_report_order'), rel('hamaguchi', 1, 0), time(15), log('指令へ、ホーム巡回の結果を報告', 'work')], 'ch3.hub');

  // --- 事務ルート：日報と古い引継ぎ帳 ---
  N['ch3.hub'].interactions.push({ id: 'off_log', object: 'terminal', label: '朝の日報の下書きを、確認する', goto: 'ch3.off_log_1', requires: ALL(BR, OFFC, T('>=', hm(6, 15)), T('<', hm(9, 30))), once: true, icon: '🖥' });
  N['ch3.hub'].goals.push({ id: 'g_off_log', label: '（事務）朝の日報の下書きを確認する', when: F('ch3.off_log_done'), optional: true, showWhen: ALL(OFFC, T('>=', hm(6, 15))) });
  line('ch3.off_log_1', [
    ['sugiura', '事務室に残るなら、日報の下書きをやってみなさい。夜勤が書いた草稿が、端末に残っている。直す点を、判断しろ。'],
    ['kubota', '早番の日報は、「事実」と「推測」を分けて書きます。分けないと、後の人が、推測を事実だと読んでしまう。']
  ], 'ch3.off_log_task', { view: v3('npc:terminal', '駅事務室 業務端末') });
  chk('ch3.off_log_task', '日報の下書きの確認', '下書きの記述が、日報の書き方として適切か、不適切かを判断してください。', [
    { id: 'a', label: '「二番線ホームの照明が一灯切れていた。昼間に交換予定」（事実と予定を、分けて書いている）', truth: 'ok', why: '見たことと、予定を分けています。' },
    { id: 'b', label: '「券売機3号機は、たぶん壊れかけている」', truth: 'ng', why: '根拠のない推測です。症状と時刻を書いて、確認を依頼します。' },
    { id: 'c', label: '「01:12 改札機2番が停止。01:14 夜勤係員が再起動し、復帰を確認」', truth: 'ok', why: '時刻と対応が、順番に書かれています。' },
    { id: 'd', label: '「夜はお客様が少なく、特に問題はなかった」', truth: 'ng', why: '「特に問題なし」は、具体的に何を確認したか分かりません。確認した項目を書きます。' },
    { id: 'e', label: '「異常あり。二番線ホーム照明。運行への影響なし。」（結論から書き始めている）', truth: 'ok', why: '結論、場所、影響が、すぐに読み取れます。' }
  ], res3('ch3.off_log_good', 'ch3.off_log_mid', 'ch3.off_log_bad', [ev('reporting', 3), ev('accuracy', 3)], [ev('accuracy', 1)], [ev('accuracy', -2)]), ['適切', '不適切']);
  N['ch3.off_log_task'].view = v3('npc:terminal', '駅事務室 業務端末');
  line('ch3.off_log_good', [['kubota', '事実と推測を、きちんと分けられています。この感覚が身につけば、日報は怖くありません。', 'smile']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done')] });
  line('ch3.off_log_mid', [['kubota', '惜しいところもありました。「たぶん」「と思う」が出たら、一度手を止めて、事実を探しましょう。']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done')] });
  line('ch3.off_log_bad', [['kubota', '推測を事実のように書くと、後で、人を迷わせます。もう一度、一緒に読み直しましょう。', 'serious']], 'ch3.off_book_1', { effects: [set('ch3.off_log_done')] });
  line('ch3.off_book_1', [
    '日報の確認を終えて、棚の隅に、古い黒い表紙の綴りがあることに気づいた。背表紙に、かすれた字で「引継ぎ帳」とある。',
    ['sugiura', '…気づいたか。それは、この駅が開業した年から、夜勤と早番が書き継いできた、手書きの帳面だ。端末ができても、捨てられなかった。'],
    ['player', '二十年分の、引継ぎ…。ちょっと、見てもいいですか。'],
    ['sugiura', '読むのは、構わん。ただし、書き込みは、日付と名前を入れて、鉛筆でなく、ペンで。昔から、そう決まっている。'],
    '頁を繰ると、さまざまな筆跡が、重なって並んでいた。「ホーム時計 三分遅れ 修正済」「雪のため 始発 十五分遅れ」。小さな事実が、墨のように、淡々と積み重なっている。',
    ['sugiura', '私が新人だった頃の頁も、ある。二十五年前の、杉浦の字だ。…ひどい字だろう。'],
    '指でなぞると、紙は、わずかに、湿った匂いがした。',
    ['sugiura', '端末の記録は、消えることがある。紙は、燃えるか、無くなるかだ。どちらにしても、「誰が書いたか」だけは、最後まで残る。'],
    ['player', '誰が書いたか、が。…だから、日付と名前を、入れるんですね。'],
    ['sugiura', '分かってきたな。']
  ], 'ch3.off_book_c', { effects: [set('ch3.off_book_seen')], view: OF(['sugiura'], '7:20 駅事務室 古い引継ぎ帳') });
  branch('ch3.off_book_c', [[F('legacy.notebook_missing'), 'ch3.off_book_m']], 'ch3.off_book_end');
  line('ch3.off_book_m', [
    ['player', '…あの、一頁、切り取られた跡があります。去年の、秋の頃です。'],
    ['sugiura', '………。気づいたのか。', 'worry'],
    ['sugiura', 'その頁のことは、駅長も知っている。いずれ、話す。今は、見なかったことに、しておきなさい。']
  ], 'ch3.off_book_end', { effects: [set('ch3.off_book_cut'), rel('sugiura', 1, 0)], view: OF(['sugiura']) });
  fx('ch3.off_book_end', [set('ch3.off_book_done'), time(20), log('古い引継ぎ帳を読ませてもらう', 'work')], 'ch3.hub');

  // =====================================================================
  // 眠気の自己申告（8:40）：重要選択
  // =====================================================================
  branch('ch3.sleepy', [[F('ch3.slept_well'), 'ch3.sleepy_a']], 'ch3.sleepy_b', { view: OF(['sugiura', 'kubota'], '8:40 駅事務室') });
  line('ch3.sleepy_a', [
    '八時四十分。三時間以上、立ちっぱなしで動いたあとの、小さな谷間の時間。',
    '窓から差し込む朝の光が、机の上に、斜めの帯を作っている。ふあ、と小さなあくびが出た。',
    ['player', '（…あれ。少し、眠いかもしれない）'],
    '体は、まだ動く。ただ、画面の文字を目で追うと、一行読むごとに、わずかに遅れる感覚がある。',
    ['kubota', '{player}さん、券売機の履歴、読み上げをお願いします。']
  ], 'ch3.sleepy_choice', { view: OF(['kubota'], '8:40 駅事務室') });
  line('ch3.sleepy_b', [
    '八時四十分。三時間以上、立ちっぱなしで動いたあと。体の奥に、鉛のような眠気が、じわりと広がってきた。',
    '窓から差し込む朝の光が、机の上で、揺れて見える。画面の文字が、二重に重なる。',
    ['player', '（まずい。…読んでいるのに、頭に入ってこない）'],
    '耳の中で、冷蔵庫のようなかすかな音が、鳴り続けている。昨夜の自分の選択が、遅れて、肩にのしかかってくる。',
    ['kubota', '{player}さん、券売機の履歴、読み上げをお願いします。…どうかしましたか？']
  ], 'ch3.sleepy_choice', { view: OF(['kubota'], '8:40 駅事務室') });

  choice('ch3.sleepy_choice', '眠気が、はっきりしてきた。…ここで、どうしますか？', [
    opt('honest', '「すみません、眠気が強くて、確認作業が不安です。少し休ませてください」と、正直に伝える', 'ch3.hn_1', { tone: 'honest', effects: [set('ch3.honest'), ev('reporting', 3), ev('safety', 3), rel('sugiura', 2, 1), rel('kubota', 1, 1)] }),
    opt('push', '「大丈夫です、続けられます」と答えて、そのまま作業を続ける', 'ch3.pu_1', { tone: 'risky', effects: [set('ch3.pushed'), ev('safety', -2), ev('reporting', -2)] }),
    opt('coffee', '席を外して、濃いコーヒーで眠気を飛ばし、何も言わずに戻る', 'ch3.pu_c', { tone: 'quick', effects: [set('ch3.pushed'), set('ch3.coffee'), ev('safety', -1), ev('reporting', -2)] })
  ], { important: true, who: 'kubota', view: OF(['sugiura', 'kubota']) });

  // --- 正直に申告 ---
  line('ch3.hn_1', [
    ['kubota', '…分かりました。まず、座ってください。無理に立っていなくていいです。', 'normal'],
    ['sugiura', '（書類から目を上げて）…そうか。言ってくれたか。', 'smile'],
    ['sugiura', '眠気は、恥ではない。早番で眠いのは、当たり前だ。ただ、その眠い頭で、券売機の履歴や、放送や、お客様の誘導をするのは、危ない。それを、自分で止めた。それが、一番の仕事だ。'],
    ['player', '…止めていいのか、迷いました。言わないほうが、迷惑にならないんじゃないかと。'],
    ['sugiura', '迷惑のかけ方に、二種類ある。先に言って、少し業務を回してもらう迷惑と、黙っていて、後で、取り返しのつかない迷惑をかける。前者のほうが、ずっと軽い。'],
    ['sugiura', '私は二十五年前、同じ場面で、黙った。…その話は、休憩のときにする。まず、状態を、自分の言葉で伝えなさい。報告の練習だ。']
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
  line('ch3.hn_good', [['sugiura', '状態、影響、依頼。三つとも、揃っている。これなら、誰が聞いても、動ける。', 'smile'], ['kubota', 'その言い方、私が新人のときに、杉浦さんから教わったのと、同じです。']], 'ch3.hn_rest', { effects: [set('ch3.report_good'), rel('sugiura', 1, 1)], view: OF(['sugiura', 'kubota']) });
  line('ch3.hn_mid', [['sugiura', '大筋は伝わった。ただ、「いつから」と「どのくらい」が、もう少し欲しい。次は、そこを意識しなさい。']], 'ch3.hn_rest', { view: OF(['sugiura', 'kubota']) });
  line('ch3.hn_bad', [['sugiura', '言いにくい気持ちは、分かる。ただ、伝わらなければ、動けない。休憩のあとで、もう一度、一緒に直そう。', 'normal']], 'ch3.hn_rest', { view: OF(['sugiura', 'kubota']) });

  line('ch3.hn_rest', [
    '休憩室は、朝の日差しで、少し暖かかった。杉浦が、温かい麦茶を、湯呑みで差し出した。',
    ['sugiura', 'カフェインより、水分だ。そして、十五分、目を閉じなさい。眠れなくていい。目を閉じるだけで、頭の中が、整理される。'],
    '壁の時計の針が、静かな音を立てていた。目を閉じると、ホームの、始発の光が、まぶたの裏に浮かんだ。',
    ['sugiura', '…私の失敗の話を、しようか。二十五年前の、四月だ。私も、新人の早番で、眠かった。'],
    ['sugiura', '眠いと言えなかった。言えば、「やる気がない」と思われると思ってな。…黙って続けて、その日、ホームの放送で、行き先を取り違えた。「海浜口行き」を、「北嶺行き」と。'],
    ['sugiura', '幸い、訂正が早くて、乗り間違いは、一人も出なかった。だが、あのとき、先輩が、私を叱らなかったのが、一番こたえた。'],
    ['player', '叱られなかったんですか。'],
    ['sugiura', '「眠いのは、お前のせいじゃない。眠いと言えない空気を作った、俺たちのせいだ」と、言われた。…それから私は、新人に、先に「眠いか」と聞くことにしている。'],
    ['kubota', '私も、新人のとき、聞かれました。「眠いか」って。…あのとき、泣きそうになりました。', 'smile'],
    ['sugiura', 'だから、{player}。次に、眠いと言う者がいたら、おまえが、聞いてやれ。']
  ], 'ch3.hn_end', { effects: [rel('sugiura', 1, 2), set('ch3.sugiura_story'), time(15)], view: HR(['sugiura', 'kubota'], '8:50 休憩室') });
  fx('ch3.hn_end', [set('ch3.sleepy_done'), log('眠気を正直に申告し、休憩を取る', 'work'), tl('4月19日 眠気を正直に申告した')], 'ch3.mid_merge');

  // --- 無理して続ける ---
  line('ch3.pu_1', [
    ['player', '大丈夫です。続けられます。…すみません、少しぼうっとしただけです。', 'normal'],
    ['kubota', '…本当ですか。顔色が、あまり良くない気がしますが。', 'worry'],
    ['player', '本当に、大丈夫です。券売機の履歴、読みます。'],
    ['sugiura', '（黙って、{player}の手元を、見ている）']
  ], 'ch3.pu_slip', { view: OF(['sugiura', 'kubota']) });
  line('ch3.pu_c', [
    '自販機の前で、濃い缶コーヒーを一息に飲み干した。苦みが、舌の奥に残る。',
    ['player', '（これで、持つはず。…何も言わなくても、大丈夫）'],
    '席に戻ると、動悸が、ほんの少し速い。眠気は、いったん引いたが、頭の奥に、不自然なざわめきが残っている。',
    ['kubota', '…{player}さん、どうかしました？ 少し、落ち着きがないようですが。', 'worry'],
    ['player', 'いえ、何でもありません。続けます。']
  ], 'ch3.pu_slip', { view: OF(['kubota']) });
  N['ch3.pu_slip'] = { id: 'ch3.pu_slip', type: 'branch', cases: [{ when: PLAT, goto: 'ch3.pu_slip_plat' }, { when: OFFC, goto: 'ch3.pu_slip_off' }], else: 'ch3.pu_slip_svc' };
  line('ch3.pu_slip_svc', [
    '九時十分。窓口で、開いたばかりの両替の依頼を、受けた。',
    '千円札を百円玉に替える。手が、ひとりでに動く。…そのはずだった。',
    ['kubota', '（背後から）{player}さん、いま、五百円玉を、混ぜていませんか？', 'surprise'],
    ['player', 'えっ。…あ。本当だ。百円玉の山に、五百円玉が、二枚…。'],
    '指先が、自分のものではないようだった。お客様に渡す前に、気づいてもらえたのは、運が良かっただけだ。',
    ['kubota', '渡す前の二重確認は、そのためにあります。…その代わり、渡したあとでは、遅いんですよ。', 'serious']
  ], 'ch3.pu_talk', { effects: [set('ch3.slip_cash'), ev('accuracy', -2)], view: OF(['kubota'], '9:10 窓口') });
  line('ch3.pu_slip_plat', [
    '九時十分。巡回の結果を、記録簿に書き込んでいた。',
    '一行ごとに、字が、微妙にずれる。日付の欄に、{player}は、昨日の日付を書いていた。',
    ['sugiura', '…{player}。日付を、もう一度、見なさい。', 'serious'],
    ['player', '…四月十八日。あ、昨日だ。今日は、十九日なのに。'],
    '消しゴムで消した跡が、紙の上に、白く残った。引継ぎ帳の古い頁にも、同じような跡が、いくつもあった気がした。',
    ['sugiura', '記録の日付は、あとで、誰かの判断の根拠になる。間違いを見つけたのが、記入した本人でなく、私だということが、問題だ。']
  ], 'ch3.pu_talk', { effects: [set('ch3.slip_date'), ev('accuracy', -2)], view: OF(['sugiura'], '9:10 駅事務室') });
  line('ch3.pu_slip_off', [
    '九時十分。端末の画面で、日報の下書きの、最終確認をしていた。',
    '一覧の中の、「二番線ホーム照明」の行の、「異常なし」に、うっかり、チェックを入れていた。',
    ['kubota', '…{player}さん、そこ、「異常あり」です。夜勤の引継ぎに、書いてあったはずです。', 'surprise'],
    ['player', 'あ。…本当だ。今朝、自分で、復唱したのに。'],
    '送信ボタンを押す、ほんの数秒前だった。画面の光が、目に痛い。',
    ['kubota', '送信前に、読み合わせをするのは、こういうときのためです。読み合わせの時間が、事故を、止めるんです。', 'serious']
  ], 'ch3.pu_talk', { effects: [set('ch3.slip_log'), ev('accuracy', -2)], view: OF(['kubota'], '9:10 駅事務室') });
  line('ch3.pu_talk', [
    ['sugiura', '…休憩に、入りなさい。いま、すぐだ。', 'serious'],
    ['player', 'でも、まだ、仕事が…。'],
    ['sugiura', '「でも」は、聞かない。今のは、指摘ではなく、指示だ。', 'normal'],
    '休憩室の椅子に座ると、体の力が、一気に抜けた。杉浦が、麦茶の湯呑みを、無言で、机に置いた。',
    ['sugiura', '怒っては、いない。…ただ、一つだけ、聞かせてほしい。「大丈夫です」と言ったとき、本当に、大丈夫だったか。'],
    ['player', '…いいえ。眠かった、です。言い出せなくて。'],
    ['sugiura', 'そうか。言えなかったのは、私たちの側の、空気の問題でもある。だが、{player}。「できない」と言う勇気は、仕事の一部だ。覚えておけ。'],
    ['kubota', '私は、新人のときに「大丈夫です」と言って、失敗しました。あなたと、同じです。…責めません。ただ、次は、先に言いましょう。', 'smile'],
    ['sugiura', '二十五年前、私も、同じ場面で黙った。その話は、また、機会があれば。']
  ], 'ch3.pu_end', { effects: [rel('sugiura', 0, 1), time(15)], view: HR(['sugiura', 'kubota'], '9:15 休憩室') });
  fx('ch3.pu_end', [set('ch3.sleepy_done'), log('眠気を言い出せず、小さな誤りを出す', 'work'), tl('4月19日 眠気を言い出せず、小さな誤りを出した')], 'ch3.mid_merge');

  // --- 合流：どちらの選択も、ここで再び、見える ---
  branch('ch3.mid_merge', [[F('ch3.honest'), 'ch3.merge_h']], 'ch3.merge_p');
  line('ch3.merge_h', [
    '九時。休憩から戻ると、机の上に、ほかほかの熱いおしぼりが、置かれていた。',
    ['kubota', '杉浦さんが、{player}さんの分も、用意してくれました。…私の新人のときも、同じでした。', 'smile'],
    ['sugiura', '午後は、また、眠気が来る。そのときは、先に言え。…今日は、それだけでいい。']
  ], 'ch3.hub', { effects: [set('ch3.merge_seen')], view: OF(['sugiura', 'kubota'], '9:00 駅事務室') });
  line('ch3.merge_p', [
    '九時半。休憩から戻ると、杉浦が、{player}の机の端に、小さな付箋を貼っていた。',
    '「眠いときは、先に言う。 杉浦」。几帳面な、細い字だった。',
    ['kubota', '…それ、私の机にも、昔、貼られました。三年、剥がさずに、持っていたんです。', 'smile'],
    ['sugiura', '剥がしても、構わん。ただ、貼られたことは、忘れるな。']
  ], 'ch3.hub', { effects: [set('ch3.merge_seen')], view: OF(['sugiura', 'kubota'], '9:30 駅事務室') });

  // =====================================================================
  // 朝の休憩（10:30）：夜明けの感想（重要選択）
  // =====================================================================
  line('ch3.breakfast', [
    '十時半。四十五分の休憩。休憩室の窓から、すっかり明るくなった、ホームが見える。',
    '朝食は、売店のおにぎりと、杉浦が淹れてくれた味噌汁だった。湯気が、窓の光の中で、ゆっくり揺れている。',
    ['kubota', '初めての早番、お疲れさまでした。…五時から、今まで、ずいぶん、長い朝でしたね。', 'smile'],
    ['sugiura', '長い朝は、そのうち、短くなる。慣れると、一瞬だ。それが、怖いところでもある。'],
    ['sugiura', '…夜明けは、見たか。五時十四分ごろの。']
  ], 'ch3.bf_branch', { effects: [{ clock: { minute: hm(10, 30) } }], view: HR(['sugiura', 'kubota'], '10:30 休憩室 朝食') });
  branch('ch3.bf_branch', [[F('ch3.honest'), 'ch3.bf_h']], 'ch3.bf_p');
  line('ch3.bf_h', [
    ['sugiura', '眠いと言ったこと、私は、今日いちばんの働きだと思っている。仕事の腕より、先に、そこだ。'],
    ['kubota', '杉浦さんは、人を、褒めないんです。今のは、珍しい。', 'smile'],
    ['sugiura', '余計なことを言うな、久保田。']
  ], 'ch3.bf_dawn', { view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_p', [
    ['sugiura', '言えなかったことを、責めるつもりはない。ただ、今日の付箋の意味は、覚えておけ。…明日から、毎朝、聞く。「眠いか」と。'],
    ['kubota', '私もです。毎朝、メッセージを送ります。「眠れましたか」って。', 'smile'],
    ['player', '…ありがとうございます。次は、先に、言います。']
  ], 'ch3.bf_dawn', { view: HR(['sugiura', 'kubota']) });
  choice('ch3.bf_dawn', '杉浦が、窓の外を見ながら、尋ねた。「今日の夜明けを、どう感じた？」', [
    opt('like', '「静かで、きれいでした。また見たいと思いました」', 'ch3.bf_like', { tone: 'caring', effects: [set('ch3.dawn_like'), rel('sugiura', 1, 2), ev('service', 1)] }),
    opt('hard', '「正直、つらかったです。朝の駅は好きになれそうですが、体が追いつきません」', 'ch3.bf_hard', { tone: 'honest', effects: [set('ch3.dawn_hard'), rel('sugiura', 1, 1), ev('reporting', 2)] }),
    opt('unsure', '「まだ分かりません。もう何回か、見てから決めたいです」', 'ch3.bf_unsure', { tone: 'careful', effects: [set('ch3.dawn_unsure'), rel('sugiura', 0, 1), ev('accuracy', 1)] })
  ], { important: true, who: 'sugiura', view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_like', [
    ['sugiura', 'そうか。…早番に向く者は、夜明けに、何かを感じる。それは、仕事の腕と、別の素質だ。'],
    ['sugiura', '実は、来年の三月で、私は定年になる。早番の「鍵」を、誰に預けるか、そろそろ考えねばならん。…今は、聞き流してくれ。'],
    ['kubota', '杉浦さん、その話は、まだ…。', 'worry'],
    ['sugiura', '言っておくだけだ。今日の{player}を見て、気が変わった。']
  ], 'ch3.bf_end', { effects: [set('ch3.sugiura_retire_hint'), rel('sugiura', 1, 1)], view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_hard', [
    ['sugiura', 'つらい、と言えるのは、いい。つらいと言えない者は、辞めるか、壊れる。…体は、慣れる。慣れるまでは、私たちが、守る。'],
    ['kubota', '三か月は、誰でも、つらいです。私も、毎朝、寮で、泣いていました。', 'smile'],
    ['sugiura', '無理をしない範囲で、続けなさい。それが、一番長く続くやり方だ。']
  ], 'ch3.bf_end', { effects: [set('ch3.early_hard'), rel('kubota', 1, 1)], view: HR(['sugiura', 'kubota']) });
  line('ch3.bf_unsure', [
    ['sugiura', '分からない、で、いい。分からないまま、何回か、見ろ。そのうち、答えが、向こうから来る。'],
    ['kubota', '私は、三回目で、分かりました。…五回目で、また、分からなくなりましたけど。', 'smile'],
    ['sugiura', 'それも、含めて、早番だ。']
  ], 'ch3.bf_end', { view: HR(['sugiura', 'kubota']) });
  fx('ch3.bf_end', [set('ch3.break_done'), time(30), tr('station_basic', 10), log('早番の休憩。夜明けの感想を話す', 'work')], 'ch3.wrap');

  // 持ち場別の、ひとこと（章の終わりでも、持ち場の違いを残す）
  branch('ch3.wrap', [[PLAT, 'ch3.wrap_plat'], [OFFC, 'ch3.wrap_off']], 'ch3.wrap_svc');
  line('ch3.wrap_svc', [['sakai', '（売店の前を通ると）お疲れさま。今日は、津村さんと、ちゃんと会えた？ 明日も、同じ時間に待ってるわよ。', 'smile']], 'ch3.wrap_end', { view: OF(['sakai'], '11:20 売店前') });
  line('ch3.wrap_plat', [['hamaguchi', '（電話口）青嶺中央、早番の巡回報告は、今朝のものが、きれいでした。…そう伝えるように、杉浦さんから、聞いています。', 'smile']], 'ch3.wrap_end', { view: OF(['sugiura'], '11:20 駅事務室') });
  line('ch3.wrap_off', [['sugiura', '日報の末尾に、日付と、名前を、ペンで書け。…よし。それで、今日の頁が、一枚、増えた。', 'smile']], 'ch3.wrap_end', { view: OF(['sugiura'], '11:20 駅事務室') });
  line('ch3.wrap_end', [
    '午後は、窓口で、券売機の補充を手伝った。十四時十五分、定刻に、勤務を終えた。',
    '寮に帰ると、シャワーを浴びて、昼の十五時から、夜の八時まで、泥のように眠った。',
    '夢の中で、{player}は、何度も、始発電車の、前照灯の光を見た。…その光は、少しずつ、近づいてくる。まだ、遠い。でも、確かに、こちらへ向かっていた。'
  ], 'ch3.end', { view: HR([], '4月19日（月） 15:00 社員寮') });

  N['ch3.end'] = { id: 'ch3.end', type: 'end', chapter: 'ch3', title: '第3章 はじめての早番', nextChapter: 'ch4',
    summary: '夜明け前から十時半までの、静かな一日。眠気を申告するか、無理をするか。その選択は、先輩の信頼と、自分の働き方の癖として、これからの勤務に残っていく。',
    effects: [tl('4月19日 初めての早番を終える'), log('第3章を終了', 'chapter')] };
}
