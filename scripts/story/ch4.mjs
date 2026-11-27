// R7 第4章「同期の距離」（4月26日(月)〜5月5日(水)・GW）。
// 構造：プレイヤー視点と山科視点を交互に描く2D中心の章。ハブは使わない。
// 独自要素は「情報を、誰に、どこまで伝えるか」。山科の券売機の現金の取り違え（損害なし・すぐ気づく）を知り、
// 庇う（ch4.covered_yama）か、事実どおり報告して一緒に是正する（ch4.told_truth）かが、後半を別ルートに分ける。
// モチーフ：山科の口癖「問題ない」と、五百円玉。強がりの言葉が、章の最後で別の意味に変わる。
// 欲しいもの／隠していること：山科＝推薦枠／二番手になる恐れ。桐生＝隠し事のない職場／自分も一度黙ったこと。
export default function ch4(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, res3, P, chk } = k;

  characters.kiryu = { id: 'kiryu', name: '桐生 玲', kana: 'きりゅう れい', role: '駅務助役（出納担当）', dept: 'station', age: 41, years: 18, uniform: '#1d2a44', hair: '#2b2118', skin: '#f0cfae', trait: '現金と記録に厳しい。ただし、正直に話した人には、必ず次の機会を作る。', bio: '日勤の出納を預かる助役。「間違いは、隠した時に事故になる」が口癖。', gender: 'f', accessory: 'glasses' };

  const PLAT = F('route.platform'), OFFC = F('route.office');
  const OF = (who, cap) => v25('office', who, cap), HR = (who, cap) => v25('hr', who, cap), DP = (who, cap) => v25('depot', who, cap);

  const bestRoute = (grid, must) => { const H = grid.length, W = grid[0].length; let s; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) { q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi; const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); } } }
    return 20; };

  // =====================================================================
  // 4月26日(月)：早番の翌週。ch3 の選択が、朝の空気を分ける
  // =====================================================================
  branch('ch4.open', [[F('ch3.honest'), 'ch4.in_h']], 'ch4.in_p', { effects: [{ clock: { addDay: 7, minute: hm(8, 20) } }, tl('4月26日 勤務5週目。ゴールデンウィークの前週'), log('第4章 同期の距離', 'chapter')] });

  line('ch4.in_h', [
    ['kubota', '杉浦助役から伝言です。「あの子とまた組みたい」。人を名指しするのは、年に一度です。', 'smile'],
    ['yamashina', '（入ってきて）来週、俺が早番だ。コツ、あるか。'],
    ['player', '前の晩は寝る。眠いときは先に言う。'],
    ['yamashina', '先に言う、か。……問題ない。やる。', 'normal'],
    ['kubota', '今の「問題ない」は、問題がある人の言い方です。']
  ], 'ch4.mon_notice', { effects: [set('ch4.in_honest'), rel('kubota', 1, 1), rel('yamashina', 0, 1)], view: OF(['kubota', 'yamashina'], '4月26日（月） 8:20 駅事務室') });
  line('ch4.in_p', [
    ['kubota', '連絡事項、聞こえていましたか。', 'normal'],
    ['player', 'え。……もう一度、お願いします。'],
    ['yamashina', '（小声で）臨時掲示、午前中。三番ホーム工事は十時。メモ。', 'smile'],
    ['yamashina', '借り一つな。問題ない、気にするな。'],
    ['kubota', '杉浦助役の付箋、まだ持っていますか。今週は「先に言う」だけでいいです。', 'serious']
  ], 'ch4.mon_notice', { effects: [set('ch4.in_pushed'), set('ch4.owes_yama'), rel('yamashina', 1, 1), rel('kubota', 0, 0)], view: OF(['kubota', 'yamashina'], '4月26日（月） 8:20 駅事務室') });

  line('ch4.mon_notice', [
    ['shiraishi', '連絡は二つ。一つ目、ゴールデンウィーク。五月三日が山だ。'],
    ['shiraishi', '二つ目。基地入門研修の公募。駅から推薦できるのは、一名。志望書は五月十四日まで。'],
    '山科の手の中で、ペンが一度、カチと鳴った。',
  ], 'ch4.slot_talk', { view: OF(['shiraishi', 'kubota', 'yamashina'], '8:45 駅事務室 朝礼') });

  line('ch4.slot_talk', [
    ['yamashina', '出すよ、志望書。', 'normal'],
    '休憩室の隅で、公募の紙が、きっちり角を揃えて置かれていた。',
    ['yamashina', '一名だ。……同期で一番手強いのは、お前だと思ってる。'],
    ['yamashina', 'お前は、出すのか。']
  ], 'ch4.slot_choice', { view: HR(['yamashina'], '12:10 休憩室') });
  choice('ch4.slot_choice', '山科に、どう答える？', [
    opt('apply', '「出すよ。正々堂々、競おう」', 'ch4.slot_a', { tone: 'honest', effects: [set('ch4.slot_apply'), rel('yamashina', 0, 1), ev('teamwork', 1)] }),
    opt('pass', '「今回は見送る。駅で、もう少し力をつけたい」', 'ch4.slot_p', { tone: 'careful', effects: [set('ch4.slot_pass'), rel('yamashina', 1, 0), ev('accuracy', 1)] }),
    opt('wait', '「まだ決めない。お前の志望書を読ませて」', 'ch4.slot_w', { tone: 'caring', effects: [set('ch4.slot_wait'), rel('yamashina', 1, 2), ev('teamwork', 2)] })
  ], { important: true, who: 'yamashina', view: HR(['yamashina']) });
  line('ch4.slot_a', [
    ['yamashina', '手を抜くなよ。抜かれたら、勝っても嬉しくない。', 'smile'],
  ], 'ch4.y1', { view: HR(['yamashina']) });
  line('ch4.slot_p', [
    ['yamashina', '俺に気を遣ってないよな。', 'worry'],
    ['player', '遣ってない。駅の仕事を、覚えきってないだけ。'],
  ], 'ch4.y1', { view: HR(['yamashina']) });
  line('ch4.slot_w', [
    ['yamashina', '読んでくれるのか。一人で書くの、怖くてさ。', 'smile'],
    ['player', '遠慮なく言うよ。'],
  ], 'ch4.y1', { view: HR(['yamashina']) });

  // =====================================================================
  // 山科視点①（4月27日 夜）：強がりの下の焦り
  // =====================================================================
  line('ch4.y1', [
    '「問題ない」。山科は、誰もいない部屋で声に出して言った。',
    '白い原稿用紙には、題名しか書かれていない。',
    '八歳の工場見学。電車が宙づりにされ、台車が外される。あの景色を、どう書く。',
    '（{player}は、聞くべきときに聞ける。俺は、聞くと負ける気がする）'
  ], 'ch4.y1_b', { effects: [{ clock: { addDay: 1, minute: hm(20, 30) } }], view: DP([], '4月27日（火） 20:30 社員寮') });
  branch('ch4.y1_b', [[F('ch2.proposal_sent'), 'ch4.y1_prop'], [F('ch4.slot_apply'), 'ch4.y1_app'], [F('ch4.slot_wait'), 'ch4.y1_wait']], 'ch4.y1_pass');
  line('ch4.y1_prop', [
    '（あいつの提案書は、通ったらしい。祝うより先に、胸がちくりとした。最低だ）'
  ], 'ch4.y1_end', { view: DP([], '4月27日 20:45') });
  line('ch4.y1_app', [
    '（「出す」と言った。笑っていたが、目は本気だった）',
    '紙の端に「勝つ」と書いて、消した。消しゴムのカスだけが、残った。'
  ], 'ch4.y1_end', { view: DP([], '4月27日 20:45') });
  line('ch4.y1_wait', [
    '（頼んでよかったのか。同じ枠を狙うかもしれない相手に）',
    '頼ることは弱さじゃない。そう言い聞かせている時点で、弱さだと思っている。'
  ], 'ch4.y1_end', { view: DP([], '4月27日 20:45') });
  line('ch4.y1_pass', [
    '（見送る、と言った。気を遣われたなら、勝っても嬉しくない）',
    '一行目は、八歳の景色から。ペンが、やっと動いた。'
  ], 'ch4.y1_end', { view: DP([], '4月27日 20:45') });
  fx('ch4.y1_end', [time(10)], 'ch4.review_1');

  // =====================================================================
  // プレイヤー視点：志望書を読む（4月28日 昼）
  // =====================================================================
  line('ch4.review_1', [
    ['yamashina', '笑うなよ。半分も書けてない。', 'worry'],
    '右に傾いた手書きの文字。最後の一行だけ、やけに力強い。',
    ['yamashina', '正直に言ってくれ。']
  ], 'ch4.review_task', { effects: [{ clock: { addDay: 1, minute: hm(12, 10) } }], view: HR(['yamashina'], '4月28日（水） 12:10 休憩室') });
  N['ch4.review_task'] = { id: 'ch4.review_task', type: 'task', kind: 'compose', title: '志望書への助言を組み立てる', intro: '山科の志望書に、何を、どう伝えるか。「良い点」「直す点」「伝え方」を選んでください。',
    slots: [
      { id: 'good', label: '良い点', options: [
        { id: 'g1', text: '最初の景色と、最後の一行がつながっていて、「あなたの言葉」になっているところがいい。', good: true, why: '具体的に、どこが良いかを伝えています。' },
        { id: 'g2', text: '全体的に、すごくいいと思う。', good: false, why: '曖昧で、本人が、何を残すべきか分かりません。' },
        { id: 'g3', text: '正直、僕のほうが、もっと上手に書けると思う。', good: false, why: '助言ではなく、競争心の表明になっています。' }] },
      { id: 'fix', label: '直す点', options: [
        { id: 'f1', text: '真ん中の二段落は、設備の用語が並びすぎている。駅で見たお客様の話を一つ入れたほうが、伝わる。', good: true, why: '直す箇所と、方向性を具体的に示しています。' },
        { id: 'f2', text: '特に、直す点はないと思う。', good: false, why: '競争相手に遠慮して、助言を避けています。誠実ではありません。' },
        { id: 'f3', text: '全部、書き直したほうがいい。', good: false, why: '大雑把で、相手の気持ちを折ります。' }] },
      { id: 'how', label: '伝え方', options: [
        { id: 'h1', text: '同期として、本気でいいと思うから、言う。厳しいことも含めて、遠慮はしない。', good: true, why: '信頼に基づいた、率直な伝え方です。' },
        { id: 'h2', text: '気を悪くしないでね、と何度も前置きして伝える。', good: false, why: '前置きが多すぎて、本題がぼやけます。' },
        { id: 'h3', text: '一言だけ言って、あとは、本人に任せる。', good: false, why: '突き放した伝え方で、相手の役に立ちません。' }] }
    ],
    results: [{ min: 66, goto: 'ch4.rv_good', effects: [ev('teamwork', 3), ev('reporting', 1)] }, { min: 34, goto: 'ch4.rv_mid', effects: [ev('teamwork', 1)] }, { min: 0, goto: 'ch4.rv_bad', effects: [ev('teamwork', -1)] }], view: HR(['yamashina'], '12:15 休憩室') };
  line('ch4.rv_good', [
    ['yamashina', '真ん中が薄いのは、自分でも分かってた。……読ませて、正解だった。', 'smile']
  ], 'ch4.y2', { effects: [set('ch4.review_good'), rel('yamashina', 2, 2)], view: HR(['yamashina']) });
  line('ch4.rv_mid', [
    ['yamashina', '言いたいことは分かった。慎重に言ってくれたのも。', 'normal']
  ], 'ch4.y2', { effects: [rel('yamashina', 1, 1)], view: HR(['yamashina']) });
  line('ch4.rv_bad', [
    ['yamashina', '……全然、足りてないな、俺。一人で読み直す。', 'worry']
  ], 'ch4.y2', { effects: [rel('yamashina', 0, -1)], view: HR(['yamashina']) });

  // =====================================================================
  // 山科視点②（4月28日 夜）
  // =====================================================================
  line('ch4.y2', [
    '「問題ない」。昼の指摘を、その一言で流せなかった。',
    '焦ると、手が速くなる。確認が、雑になる。昔、言われた。',
    '赤で囲んだ、五月三日。釣銭の補充は、俺の担当だ。間違えられない。'
  ], 'ch4.gw_open', { effects: [time(0), set('ch4.y_worry')], view: DP([], '4月28日（水） 22:00 社員寮') });

  // =====================================================================
  // 5月3日(月・祝)：GWの繁忙日。持ち場別の午前
  // =====================================================================
  line('ch4.gw_open', [
    '券売機の前の行列。キャリーケースが、床をごろごろ鳴らしている。',
    ['kiryu', '釣銭補充は二人で数えて、二人で印。省略は、事故の入口です。', 'serious'],
    ['yamashina', '3号機の百円カセットは、俺だ。二人目、頼めるか。']
  ], 'ch4.gw_branch', { effects: [{ clock: { addDay: 5, minute: hm(8, 20) } }, tl('5月3日 ゴールデンウィークの最繁忙日')], view: OF(['shiraishi', 'kiryu', 'yamashina', 'kubota'], '5月3日（月・祝） 8:20 駅事務室 朝礼') });
  branch('ch4.gw_branch', [[PLAT, 'ch4.gp_1'], [OFFC, 'ch4.go_1']], 'ch4.gs_1');

  // ---- 接客ルート：窓口と、釣銭の確認印 ----
  line('ch4.gs_1', [
    ['tourist2', 'Excuse me. 臨時の、train。どこ？', 'worry'],
    ['player', '二番線です。自由席は予約不要です。'],
  ], 'ch4.gs_task', { view: OF(['kubota', 'tourist2'], '9:00 きっぷうりば') });
  N['ch4.gs_task'] = { id: 'ch4.gs_task', type: 'task', kind: 'sort', title: 'GWの窓口対応', intro: 'お客様の用件を、「その場で案内」「窓口で手続き」「別の係へ」に振り分けます。制限時間があります。',
    config: { perItem: 6, bins: [{ id: 'now', label: 'その場で案内' }, { id: 'desk', label: '窓口で手続き' }, { id: 'other', label: '別の係・他社へ' }], items: [
      { id: 'a', label: '「臨時列車の乗り場を教えて」', bin: 'now', why: '掲示と地図で、その場で案内できます。' },
      { id: 'b', label: '「特急券を、人数を間違えて買った（未使用）」', bin: 'desk', why: '払い戻しの手続きは、窓口で行います。' },
      { id: 'c', label: '「バスの乗り場と、時刻を教えて」', bin: 'other', why: 'バスはバス会社の案内です。乗り場の場所だけ案内します。' },
      { id: 'd', label: '「ベビーカーで、エレベーターの場所はどこ？」', bin: 'now', why: '場所の案内で済みます。必要なら、同行します。' },
      { id: 'e', label: '「観光案内所は、どこですか」', bin: 'now', why: '案内図で、すぐに案内できます。' },
      { id: 'f', label: '「落とし物をした。台帳の確認をしてほしい」', bin: 'desk', why: '台帳の確認は、窓口で、控えを取りながら行います。' }] },
    results: res3('ch4.gs_good', 'ch4.gs_mid', 'ch4.gs_bad', [ev('service', 3), ev('accuracy', 2), sk('ticket', 2)], [ev('service', 1)], [ev('service', -1)]), view: OF(['kubota'], '9:30 きっぷうりば') };
  line('ch4.gs_good', [['kubota', '見分けが早い。お客様の顔で、余裕が測れています。', 'smile']], 'ch4.gs_sign', { view: OF(['kubota']) });
  line('ch4.gs_mid', [['kubota', '数件、違いました。混むほど「聞いてから」です。']], 'ch4.gs_sign', { view: OF(['kubota']) });
  line('ch4.gs_bad', [['kubota', '混むと焦りますよね。一度に全部やらなくていい。', 'normal']], 'ch4.gs_sign', { view: OF(['kubota']) });
  line('ch4.gs_sign', [
    '券売機室の前で、山科が、袋と記録簿を抱えて呼び止めた。',
    ['yamashina', '悪い。確認印、先に押してくれ。終わったら、すぐ見直す。', 'worry'],
    ['yamashina', '順番が前後するだけだ。問題ない。'],
    ['player', '（桐生助役は、数えてから押せ、と言った）']
  ], 'ch4.gs_choice', { view: OF(['yamashina'], '11:50 券売機室 前') });
  choice('ch4.gs_choice', '確認印を、どうする？', [
    opt('check', '「数えてから押す。五分で済む」', 'ch4.gs_c', { tone: 'careful', effects: [set('ch4.signed_checked'), ev('accuracy', 2), rel('yamashina', 0, -1)] }),
    opt('sign', '「分かった。あとで見直そう」と、先に押す', 'ch4.gs_s', { tone: 'quick', effects: [set('ch4.signed_blind'), ev('accuracy', -2), rel('yamashina', 1, 1)] })
  ], { who: 'yamashina', view: OF(['yamashina']) });
  line('ch4.gs_c', [
    ['yamashina', '……だよな。', 'worry'],
    ['yamashina', '止めてくれる奴が近くにいると、助かる。', 'smile']
  ], 'ch4.y3', { effects: [time(10)], view: OF(['yamashina'], '11:55 券売機室') });
  line('ch4.gs_s', [
    ['player', '見直す約束だよ。'],
    '押した印だけが、指先に妙に残った。'
  ], 'ch4.y3', { effects: [time(5)], view: OF(['yamashina'], '11:55 券売機室') });

  // ---- ホームルート：臨時列車の乗車列と、動線 ----
  line('ch4.gp_1', [
    '二番ホーム。臨時列車を待つ列が、階段の方へ伸びていた。',
    ['hamaguchi', '（電話）結論から。列を階段に出さないこと。方法は現場で。', 'normal'],
  ], 'ch4.gp_task', { view: OF(['kubota'], '9:00 ホーム 臨時列車の乗車列') });
  N['ch4.gp_task'] = { id: 'ch4.gp_task', type: 'task', kind: 'route', title: '乗車列の折り返し動線', intro: '起点から着点まで、A（階段付近の係員）・B（点字ブロックの要所）・C（ホームの先頭）を必ず通る、短い動線をつなぎます。人の多い通路は、時間がかかります。',
    config: { grid: ['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], must: ['A', 'B', 'C'], best: bestRoute(['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], ['A', 'B', 'C']), legend: { '#': '柱・壁（通れない）', '~': '混雑した通路（遅い）', A: '階段付近', B: '点字ブロックの要所', C: 'ホーム先頭', S: '起点', G: '事務室側の出口' } },
    results: res3('ch4.gp_good', 'ch4.gp_mid', 'ch4.gp_bad', [ev('safety', 3), ev('service', 2), sk('patrol', 2)], [ev('safety', 1)], [ev('safety', -2)]), view: OF(['kubota'], '9:30 ホーム') };
  line('ch4.gp_good', [['kubota', '階段に、誰もはみ出していません。点字ブロックも空いています。', 'smile']], 'ch4.gp_next', { view: OF(['kubota']) });
  line('ch4.gp_mid', [['kubota', '安全は保てました。遠回りだけ、惜しい。']], 'ch4.gp_next', { view: OF(['kubota']) });
  line('ch4.gp_bad', [['kubota', '階段付近に、人がたまりました。私が補いました。', 'serious']], 'ch4.gp_next', { view: OF(['kubota']) });
  line('ch4.gp_next', [
    '十一時。臨時列車が満員で去り、ホームが急に静かになった。',
    '階段を、山科が駆け上がってくる。補充担当のはずの彼が。'
  ], 'ch4.y3', { effects: [time(10)], view: OF(['kubota'], '11:50 ホーム') });

  // ---- 事務ルート：臨時列車の情報と、掲示の差替え ----
  line('ch4.go_1', [
    '事務室の端末が、臨時列車の予定を更新し続けている。',
    ['kiryu', '出納簿も見ます。数字と時刻のずれは、すぐ報告。', 'normal']
  ], 'ch4.go_task', { view: OF(['kubota', 'kiryu'], '9:00 駅事務室') });
  N['ch4.go_task'] = { id: 'ch4.go_task', type: 'task', kind: 'memory', title: '臨時列車の案内を、発車標に入力する', intro: '臨時列車の情報を見て覚え、同じ順に入力します。見返しはできません。',
    config: { sequence: ['臨時列車', '9:40発', '2番線', '海浜行'], pool: ['定期列車', '9:04発', '9:40発', '1番線', '2番線', '3番線', '海浜行', '北嶺行'], showMs: 4600, showLabel: '臨時列車の情報' },
    results: res3('ch4.go_good', 'ch4.go_mid', 'ch4.go_bad', [ev('accuracy', 3), ev('reporting', 2), sk('ops', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]), view: OF(['kubota'], '9:30 駅事務室') };
  line('ch4.go_good', [['kubota', '番線も時刻も行先も、合っています。復唱が効いていますね。', 'smile']], 'ch4.go_next', { view: OF(['kubota']) });
  line('ch4.go_mid', [['kubota', '惜しい。番線の取り違えは、お客様の足に響きます。']], 'ch4.go_next', { view: OF(['kubota']) });
  line('ch4.go_bad', [['kubota', '訂正は済ませました。事務のミスは、人の足にそのまま響きます。', 'serious']], 'ch4.go_next', { view: OF(['kubota']) });
  line('ch4.go_next', [
    ['kiryu', '3号機の補充記録が、まだ。二人の印が揃うまで、有効になりません。'],
    '扉が開いて、山科が入ってきた。顔が白い。',
    ['yamashina', '桐生助役、あとで少し。……まず{player}に。', 'worry'],
  ], 'ch4.y3', { effects: [time(10)], view: OF(['kiryu', 'yamashina'], '11:50 駅事務室') });

  // =====================================================================
  // 山科視点③：券売機室での、取り違え（5月3日 12:00ごろ）
  // =====================================================================
  line('ch4.y3', [
    '「問題ない」。袋を持ち上げながら、山科は三回、言い聞かせた。',
    '青い袋が百円、黄色い袋が五百円。隣り合わせに積んである。',
    '試験払出し。百円玉が三枚、受け皿に落ちる。三枚目の音だけ、重かった。',
    '銀色の五百円玉が、一枚。袋を取り違えた。入れたのは、十二枚。',
    '3号機は、調整中の札を出している。客には、一枚も出ていない。',
    '一人でカセットを開け、指先の震えを押さえて、一枚ずつ戻した。',
    '再試験。三枚とも百円。十二時十分。誰にも見られていない。ただ、一人を除いて。'
  ], 'ch4.learn_branch', { effects: [set('ch4.incident'), tl('5月3日 山科が、釣銭を取り違え、すぐに直す')], view: DP([], '5月3日（月・祝） 12:00 券売機室') });
  branch('ch4.learn_branch', [[PLAT, 'ch4.ln_plat'], [OFFC, 'ch4.ln_off']], 'ch4.ln_svc');

  // 気づく場面：持ち場ごとに、別の形で
  line('ch4.ln_svc', [
    '券売機室の扉の内側で、山科が青い顔で立っていた。',
    ['yamashina', 'さっきの印、記録簿のここに押したよな。', 'worry'],
    ['yamashina', '休憩、一緒に。人のいない所で。']
  ], 'ch4.confess', { effects: [rel('yamashina', 0, 0)], view: OF(['yamashina'], '12:20 券売機室 前') });
  line('ch4.ln_plat', [
    '階段の途中で、山科が息を切らして止まっていた。',
    ['yamashina', '手短に……いや、ここじゃ無理だ。', 'worry'],
    ['yamashina', '昼休憩、人のいない所で。']
  ], 'ch4.confess', { view: OF(['yamashina'], '12:20 ホーム 階段') });
  line('ch4.ln_off', [
    '山科が、机にヒヤリハット報告票を広げていた。',
    ['yamashina', '書き方を教えてくれ。仮の話だ。', 'worry'],
    ['player', '実害ゼロで、本人が気づいて直した場合、ですか。'],
    ['yamashina', '……そう。それでも書くのか。'],
    '用紙の角が、指で何度も折られていた。仮の話では、なかった。'
  ], 'ch4.confess', { view: OF(['yamashina'], '12:20 駅事務室 隅の机') });

  // =====================================================================
  // 告白と、重要選択（情報を、誰に、どこまで）
  // =====================================================================
  line('ch4.confess', [
    ['yamashina', '百円カセットに、五百円玉を十二枚入れた。', 'worry'],
    '休憩室の奥。山科は、紙コップを両手で包んでいる。',
    ['player', '一人でカセットを開けたの？ 二人でって。'],
    ['yamashina', '票を書けば、評価に赤い印が付く。推薦は評価で決まる。'],
    ['yamashina', '知ってるのは、俺とお前だけだ。……黙っててくれないか。この枠、本当に欲しいんだ。']
  ], 'ch4.confess_b', { view: HR(['yamashina'], '12:40 休憩室 奥') });
  branch('ch4.confess_b', [[F('ch4.signed_blind'), 'ch4.confess_s']], 'ch4.ch_choice');
  line('ch4.confess_s', [
    ['yamashina', 'それに、お前の印も、あの記録簿にある。', 'worry'],
    ['player', '（あの印は、僕のものでもある）']
  ], 'ch4.ch_choice', { effects: [set('ch4.own_part')], view: HR(['yamashina']) });

  choice('ch4.ch_choice', '山科の頼みを、どう受け止める？', [
    opt('cover', '「分かった。誰にも言わない。次は必ず二人で開ける」', 'ch4.cv_1', { tone: 'caring', effects: [set('ch4.covered_yama'), set('ch4.secret_kept'), rel('yamashina', 2, 2), ev('reporting', -4), ev('safety', -2)] }),
    opt('together', '「報告しよう。僕も一緒に行く」', 'ch4.tg_1', { tone: 'honest', requires: ALL(F('ch4.incident')), effects: [set('ch4.told_truth'), set('ch4.trust_built'), set('ch4.told_together'), ev('reporting', 5), ev('safety', 2)] }),
    opt('alone', '「ごめん。僕から、桐生助役に伝える」', 'ch4.al_1', { tone: 'risky', effects: [set('ch4.told_truth'), set('ch4.trust_built'), set('ch4.told_alone'), rel('yamashina', -2, -2), ev('reporting', 4), ev('teamwork', -2)] })
  ], { important: true, who: 'yamashina', view: HR(['yamashina']) });

  // ---------------------------------------------------------------
  // 庇うルート：後で発覚する不安と、山科との距離
  // ---------------------------------------------------------------
  line('ch4.cv_1', [
    ['player', '誰にも言わない。次は必ず二人で開ける。約束して。'],
    ['yamashina', '約束する。……ありがとう。', 'smile'],
    ['player', '（これでいい。そう思おうとしている自分に、気づく）']
  ], 'ch4.cv_help', { effects: [tl('5月3日 山科の取り違えを、報告しなかった')], view: HR(['yamashina'], '12:55 休憩室 奥') });
  choice('ch4.cv_help', '午後、山科は何度も券売機室の方を気にしていた。どうする？', [
    opt('recount', '十五時の空き時間に、二人で3号機のカセットを数え直す', 'ch4.cv_recount', { tone: 'careful', effects: [set('ch4.helped_yama'), rel('yamashina', 1, 1), ev('accuracy', 2)] }),
    opt('leave', '「直ったんだから大丈夫」と言って、持ち場に戻る', 'ch4.cv_leave', { tone: 'quick', effects: [rel('yamashina', 0, -1)] })
  ], { view: OF(['yamashina']) });
  line('ch4.cv_recount', [
    '十五時。二人で3号機のカセットを開け、百円玉を十枚ずつ並べた。',
    ['yamashina', '二人で開けるの、これで二回目だな。一回目は、遅かった。', 'smile'],
    '五百円玉は、一枚もない。袋の口を閉じる音だけが、残った。',
  ], 'ch4.cv_kiryu', { effects: [time(25)], view: OF(['yamashina'], '15:00 券売機室') });
  line('ch4.cv_leave', [
    ['player', '直ったんだし、大丈夫。持ち場に戻る。'],
    '山科の笑顔は、少し硬かった。背中に、視線を感じた。'
  ], 'ch4.cv_kiryu', { effects: [time(20)], view: OF(['yamashina'], '14:20 券売機室 前') });
  line('ch4.cv_kiryu', [
    ['kiryu', '記録簿は、全部揃っています。ただ、一件だけ。', 'normal'],
    ['kiryu', '3号機の試験払出しログに、十二時十分の再試験があります。'],
    ['yamashina', '……', 'worry'],
    ['kiryu', '今は何も聞きません。記録は消えない、とだけ。', 'serious'],
    '扉が静かに閉まった。二人の間に、薄い膜ができていた。',
  ], 'ch4.cv_night', { view: OF(['kiryu', 'yamashina'], '17:10 駅事務室') });
  line('ch4.cv_night', [
    '「問題ない」が、今日は一度も言えなかった。',
    '目を閉じると、受け皿の五百円玉の鈍い光が浮かぶ。損害はない。胸だけが冷たい。',
    '友達だから、黙ってくれた。友達に、黙らせた。その重さを、いつまで持つのだろう。'
  ], 'ch4.gw_end', { effects: [time(0)], view: DP([], '5月3日（月・祝） 23:00 社員寮') });

  // ---------------------------------------------------------------
  // 報告ルート（一緒に）：一時の気まずさと、のちの信頼
  // ---------------------------------------------------------------
  line('ch4.tg_1', [
    ['player', '報告しよう。一緒に行く。'],
    ['yamashina', '……怖いんだ。評価より、見る目が変わるのが。', 'worry'],
    ['player', '黙っていても、3号機がログを残す。あとで見つかる方が、よほど変わる。'],
    ['yamashina', '……俺から話す。横にいてくれ。', 'normal']
  ], 'ch4.tg_kiryu', { effects: [tl('5月3日 山科と一緒に、取り違えを報告することにした')], view: HR(['yamashina'], '12:50 休憩室 奥') });
  line('ch4.tg_kiryu', [
    ['kiryu', '最後まで聞きます。続けて。', 'serious'],
    ['yamashina', '百円カセットに五百円玉を十二枚。気づいて全部戻しました。開封は、一人で。'],
    ['kiryu', '気づいて一時間以内に、自分から来た。早い部類です。', 'normal'],
    ['kiryu', '……{player}さんは、なぜご一緒に。']
  ], 'ch4.tg_k_b', { view: OF(['kiryu', 'yamashina'], '13:00 駅事務室 打ち合わせ') });
  branch('ch4.tg_k_b', [[F('ch4.signed_blind'), 'ch4.tg_k_s']], 'ch4.tg_k_c');
  line('ch4.tg_k_s', [
    ['player', '確認印を、数える前に押しました。', 'worry'],
    ['kiryu', '二人とも手順を一つ飛ばした。原因は忙しさ。私にも責任があります。']
  ], 'ch4.tg_k_c', { effects: [set('ch4.own_part_said'), rel('kiryu', 2, 1), ev('reporting', 3)], view: OF(['kiryu', 'player']) });
  line('ch4.tg_k_c', [
    ['kiryu', '「直す」と「報告する」は、別の仕事です。'],
    ['kiryu', '原因は、色違いの袋が隣り合っていたこと。次の人も間違える。あなたの報告は、その人の安全です。'],
    ['yamashina', '次の人の。', 'surprise'],
    ['kiryu', '私も、一度黙った側の人間です。だから分かります。'],
    ['kiryu', '票を書きなさい。評価は、ミスの有無でなく、扱いで付けます。']
  ], 'ch4.tg_task', { view: OF(['kiryu', 'yamashina']) });
  N['ch4.tg_task'] = { id: 'ch4.tg_task', type: 'task', kind: 'compose', title: 'ヒヤリハット票を、組み立てる', intro: '「事実」「原因」「再発防止」を、どう書くか、選んでください。誰に、どこまで伝えるか。事実と推測は、分けて。',
    slots: [
      { id: 'fact', label: '事実', options: [
        { id: 'f1', text: '12時10分、3号機の百円カセットに、五百円玉12枚を誤って補充。試験払出しで自ら気づき、全数を回収・再確認した。お客様への払出しは、なし。', good: true, why: '時刻、内容、対応、影響が、事実として書かれています。' },
        { id: 'f2', text: '大したミスではないが、一応、報告する。', good: false, why: '評価の言葉が先に立っていて、事実が書かれていません。' },
        { id: 'f3', text: '機械の調子が悪く、硬貨が混ざった。', good: false, why: '原因を機械に押しつけていて、事実と異なります。' }] },
      { id: 'cause', label: '原因', options: [
        { id: 'c1', text: '青（百円）と黄（五百円）の両替袋が隣り合わせで、混雑による焦りもあり、確認が不足した。二人確認も、省略した。', good: true, why: '環境と行動の両面を、正直に書いています。' },
        { id: 'c2', text: '山科個人の、不注意です。', good: false, why: '個人のせいにすると、再発防止につながりません。' },
        { id: 'c3', text: '原因は、特に分かりません。', good: false, why: '分かる範囲を、書く必要があります。' }] },
      { id: 'fix', label: '再発防止', options: [
        { id: 'x1', text: '両替袋の置き場を分け、袋に、大きな数字を付ける。カセットの開封は、必ず二人で、記録簿の印は、数を数えたあとに押す。', good: true, why: '具体的で、実行できる、複数の対策です。' },
        { id: 'x2', text: '次から、気をつけます。', good: false, why: '気持ちだけでは、再発を防げません。' },
        { id: 'x3', text: '混雑日は、補充をやめる。', good: false, why: '業務が回らなくなり、現実的ではありません。' }] }
    ],
    results: [{ min: 66, goto: 'ch4.tg_good', effects: [ev('reporting', 4), ev('accuracy', 2)] }, { min: 34, goto: 'ch4.tg_mid', effects: [ev('reporting', 2)] }, { min: 0, goto: 'ch4.tg_bad', effects: [ev('reporting', 0)] }], view: OF(['kiryu', 'yamashina'], '13:20 駅事務室 票の記入') };
  line('ch4.tg_good', [
    ['kiryu', '事実、原因、対策。袋の置き場は、駅全体の手順に反映します。', 'smile'],
  ], 'ch4.tg_help', { effects: [set('ch4.report_good'), rel('kiryu', 2, 2)], view: OF(['kiryu', 'yamashina']) });
  line('ch4.tg_mid', [['kiryu', '方向は合っています。推測と事実を、分けて書き直して。']], 'ch4.tg_help', { effects: [rel('kiryu', 1, 1)], view: OF(['kiryu', 'yamashina']) });
  line('ch4.tg_bad', [['kiryu', '書き直しです。ただ、書こうとしたことは、評価します。', 'normal']], 'ch4.tg_help', { view: OF(['kiryu', 'yamashina']) });
  choice('ch4.tg_help', '桐生が言った。「袋の置き場を、実際に直しなさい」。山科は、少しふらついている。', [
    opt('stay', '「僕も手伝う。二人で直そう」', 'ch4.tg_stay', { tone: 'caring', effects: [set('ch4.helped_yama'), rel('yamashina', 2, 2), ev('teamwork', 2)] }),
    opt('let', '「自分で直した方が、覚えるよ。見てる」', 'ch4.tg_let', { tone: 'careful', effects: [rel('yamashina', 1, 0), ev('accuracy', 1)] })
  ], { view: OF(['yamashina']) });
  line('ch4.tg_stay', [
    '青と黄の袋を離して置き、黒いマジックで「百」「五百」と書いた。',
    ['yamashina', '怖かったのに、胸が軽い。……お前が、横にいたからだ。']
  ], 'ch4.tg_night', { effects: [time(25)], view: OF(['yamashina'], '14:00 券売機室') });
  line('ch4.tg_let', [
    '不器用で、丁寧な字で、袋に「百」と書かれた。',
    ['yamashina', '読めるか。', 'smile'],
    ['player', '読める。次の人は、間違えない。']
  ], 'ch4.tg_night', { effects: [time(20)], view: OF(['yamashina'], '14:00 券売機室') });
  line('ch4.tg_night', [
    '志望書に、一行足した。「報告は、自分を守るためでなく、次の人を守るためにある」。',
    '{player}がいなかったら、行けなかった。貸しじゃない。返せないものだ。'
  ], 'ch4.gw_end', { effects: [time(0)], view: DP([], '5月3日（月・祝） 22:30 社員寮') });

  // ---------------------------------------------------------------
  // 報告ルート（自分一人で）：ほろ苦い距離
  // ---------------------------------------------------------------
  line('ch4.al_1', [
    ['player', 'ごめん。黙ってられない。僕から、桐生助役に言う。', 'serious'],
    ['yamashina', '……頼む、って言ったのに。', 'worry'],
    ['yamashina', '友達、か。', 'normal'],
    '山科は目を合わせないまま、倉庫の方へ歩いていった。'
  ], 'ch4.al_2', { effects: [tl('5月3日 山科の取り違えを、桐生助役に報告した')], view: HR(['yamashina'], '12:50 休憩室 奥') });
  line('ch4.al_2', [
    ['player', '3号機の百円カセットに、五百円玉が十二枚。担当者が気づいて全数戻し、払出しはありません。'],
    ['kiryu', '誰が。', 'serious'],
    ['player', '山科さんです。本人は、報告しないつもりでした。'],
    ['kiryu', '報告、ありがとう。あなた自身は。']
  ], 'ch4.al_3', { effects: [rel('kiryu', 2, 0)], view: OF(['kiryu'], '13:00 駅事務室') });
  branch('ch4.al_3', [[F('ch4.signed_blind'), 'ch4.al_3s']], 'ch4.al_3n');
  line('ch4.al_3s', [['kiryu', '確認印を先に押した件ですね。それも一緒に扱います。', 'normal']], 'ch4.al_4', { effects: [set('ch4.own_part_said'), ev('reporting', 2)], view: OF(['kiryu']) });
  line('ch4.al_3n', [['kiryu', '印の件は、記録で見ます。今は十分です。']], 'ch4.al_4', { view: OF(['kiryu']) });
  line('ch4.al_4', [
    ['kiryu', '先に本人へ勧めて、一緒に来る道もありました。早さは正しい。伝え方には、別の道がありました。'],
    '十分後、山科が入ってきた。{player}を、一度だけ見た。',
    ['yamashina', '事実は、全部そのとおりです。すみません。', 'worry'],
    ['kiryu', 'お礼は、あとでも構いません。']
  ], 'ch4.al_5', { effects: [time(10)], view: OF(['kiryu', 'yamashina'], '13:20 駅事務室') });
  line('ch4.al_5', [
    '二人は、別々の用紙に、互いに見せず書いた。',
    ['yamashina', '……正しいと思う。でも、今は、うまく笑えない。', 'normal'],
    ['yamashina', '謝るのは、俺だ。まだ、言えないだけで。']
  ], 'ch4.al_night', { effects: [set('ch4.yama_hurt')], view: OF(['yamashina'], '13:50 廊下') });
  line('ch4.al_night', [
    '「問題ない」と、言えなかった。言えば、嘘になる。',
    '逆なら、俺は庇った。そして、あいつを苦しめたかもしれない。',
    '志望書の端に、小さく書いた。「ありがとう、と、いつか言う」。'
  ], 'ch4.gw_end', { effects: [time(0)], view: DP([], '5月3日（月・祝） 23:00 社員寮') });

  // =====================================================================
  // 5月5日(水)：合流のあと。選んだ道は、ここでも見える
  // =====================================================================
  line('ch4.gw_end', [
    '机の上に、柏餅の箱があった。誰が置いたのか、まだ誰も言わない。',
    ['shiraishi', '五日間、持った。夕方で臨時体制は終わりだ。']
  ], 'ch4.merge', { effects: [{ clock: { addDay: 2, minute: hm(14, 30) } }, tl('5月5日 ゴールデンウィーク最終日')], view: OF(['shiraishi'], '5月5日（水・祝） 14:30 駅事務室') });
  branch('ch4.merge', [[F('ch4.covered_yama'), 'ch4.mg_cover'], [F('ch4.told_together'), 'ch4.mg_tg']], 'ch4.mg_al');
  line('ch4.mg_cover', [
    ['yamashina', '柏餅、桐生助役から。みんなで、って。', 'normal'],
    ['yamashina', '袋の置き場、勝手に離しておいた。誰にも言ってない。', 'worry'],
    '目が合って、同時にそらした。柏餅の葉の匂いが、少し苦い。'
  ], 'ch4.final_choice', { effects: [set('ch4.merge_seen')], view: OF(['yamashina'], '14:40 休憩室 入口') });
  line('ch4.mg_tg', [
    ['yamashina', '「報告をした二人に」だって。桐生助役。', 'smile'],
    ['yamashina', '袋の置き場、駅の手順になるらしい。俺のミスが、人の役に立つ。変な気分だ。'],
    ['yamashina', '……悪くない。']
  ], 'ch4.final_choice', { effects: [set('ch4.merge_seen'), rel('yamashina', 1, 1)], view: OF(['yamashina'], '14:40 休憩室 入口') });
  line('ch4.mg_al', [
    ['yamashina', '「報告をした二人に」。俺も、貰った。', 'normal'],
    ['yamashina', 'あのとき先に言ってくれて、ありがとう。まだ完全には思えてない。でも、先に言いたかった。'],
    ['yamashina', 'お互い様にしよう。']
  ], 'ch4.final_choice', { effects: [set('ch4.merge_seen'), rel('yamashina', 1, 1)], view: OF(['yamashina'], '14:40 休憩室 入口') });

  choice('ch4.final_choice', '柏餅を食べながら、山科が言った。「俺たち、これからどうなるんだろうな」', [
    opt('rival', '「ライバルでいよう。結果がどうなっても」', 'ch4.fin_r', { tone: 'honest', effects: [set('ch4.rival'), rel('yamashina', 0, 1), ev('teamwork', 1)] }),
    opt('partner', '「競争は競争。でも、同期として助け合おう」', 'ch4.fin_p', { tone: 'caring', effects: [set('ch4.partner'), rel('yamashina', 2, 2), ev('teamwork', 2)] }),
    opt('quiet', '「まだ分からない。でも、この五日間は忘れない」', 'ch4.fin_q', { tone: 'careful', effects: [rel('yamashina', 1, 1)] })
  ], { important: true, who: 'yamashina', view: OF(['yamashina']) });
  line('ch4.fin_r', [
    ['yamashina', '手加減したら、怒るぞ。', 'smile'],
    ['yamashina', '柏餅の礼だ。五百円玉。今度は、間違えてない。']
  ], 'ch4.close', { view: OF(['yamashina']) });
  line('ch4.fin_p', [
    ['yamashina', '助け合い、か。今回で、一番頼りたい言葉だ。', 'smile'],
    ['yamashina', '柏餅の礼だ。五百円玉。今度は、間違えてない。']
  ], 'ch4.close', { view: OF(['yamashina']) });
  line('ch4.fin_q', [
    ['yamashina', '分からない、か。正直な答えだ。俺もだ。', 'normal'],
    ['yamashina', '柏餅の礼だ。五百円玉。今度は、間違えてない。']
  ], 'ch4.close', { view: OF(['yamashina']) });

  line('ch4.close', [
    ['shiraishi', '私が見ていたのは、「間違えたか」ではない。「間違えたあと、何をしたか」だ。'],
    '夕焼けが、街路樹を橙に染めていた。手のひらの五百円玉が、少し温かかった。'
  ], 'ch4.end', { view: OF(['shiraishi', 'kubota'], '5月5日（水・祝） 17:30 駅事務室') });

  N['ch4.end'] = { id: 'ch4.end', type: 'end', chapter: 'ch4', title: '第4章 同期の距離', nextChapter: 'ch5',
    summary: '山科の取り違えを、庇うか、報告するか。選んだ道は、友情の形を変えた。黙った記録は、いつまでも消えず、報告した記録は、少しずつ、信頼に変わっていく。',
    effects: [tl('5月5日 ゴールデンウィークを終える'), log('第4章を終了', 'chapter')] };
}
