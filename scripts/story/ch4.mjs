// R7 第4章「同期の距離」（4月26日(月)〜5月5日(水)・GW）。
// 構造：2.5D（山科視点を交える）→ 5月3日の3Dハブ（券売機室で「数える／押す」）→ 取り違え → 重要選択（庇う／一緒に／一人で）
//       → 3経路（それぞれ4ノード以上）→ 夕方の3Dハブ（現場検証）→ 5月5日に合流（人物の記憶で台詞が変わる）。
// 賭け金：基地入門研修の推薦枠（駅から一名・志望書は5/14 17:00・条件は研修開始時点で在籍12か月）／評価の赤印／日計の400円／同期との信頼。
// 取り返しのつかない変化：lock slot_self（見送る）／lock clean_record（報告で赤印）／lock ledger_may3（沈黙のまま日計が閉じる）。
// モチーフ：山科の口癖「問題ない」と、五百円玉。
// 引継ぎ：docs/analysis/handoff-ch4-6.md に flag 一覧。
export default function ch4(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tl, log, time, F, NF, ALL, T, hm, v3, v25, res3, hub } = k;

  characters.kiryu = { id: 'kiryu', name: '桐生 玲', kana: 'きりゅう れい', role: '駅務助役（出納担当）', dept: 'station', age: 41, years: 18, uniform: '#1d2a44', hair: '#2b2118', skin: '#f0cfae', trait: '現金と記録に厳しい。ただし、正直に話した人には、必ず次の機会を作る。', bio: '日勤の出納を預かる助役。「間違いは、隠した時に事故になる」が口癖。', gender: 'f', accessory: 'glasses' };

  const SERV = ALL(NF('route.platform'), NF('route.office'));
  const PLAT = F('route.platform'), OFFC = F('route.office');
  const RG = (char, op, val, key = 'trust') => ({ rel: { char, key, op, val } });
  const OF = (who, cap) => v25('office', who, cap), HR = (who, cap) => v25('hr', who, cap), DP = (who, cap) => v25('depot', who, cap);
  const go = (id, lines, next, effects, view) => (effects && !Array.isArray(effects) ? line(id, lines, next, { view: OF([]), ...effects }) : line(id, lines, next, { ...(effects ? { effects } : {}), view: view ?? OF([]) }));
  const lockE = (id, note) => ({ lock: { id, note } });
  const bestRoute = (grid, must) => { const H = grid.length, W = grid[0].length; let s; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) { q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi; const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); } } }
    return 20; };

  // =====================================================================
  // 4月26日(月)：ch3 の選択が、朝の空気を分ける
  // =====================================================================
  branch('ch4.open', [[F('ch3.honest'), 'ch4.in_h']], 'ch4.in_p', { effects: [{ clock: { addDay: 7, minute: hm(8, 20) } }, tl('4月26日 勤務5週目。ゴールデンウィークの前週'), log('第4章 同期の距離', 'chapter')] });

  go('ch4.in_h', [
    ['kubota', '杉浦助役から伝言です。「あの子とまた組みたい」。', 'smile'],
    ['yamashina', '（入ってきて）来週、俺が早番だ。コツ、あるか。'],
    ['player', '前の晩は寝る。眠いときは先に言う。'],
    ['yamashina', '先に言う、か。……問題ない。やる。', 'normal'],
    '久保田が、予定表の山科の欄に、鉛筆で小さな丸をつけた。'
  ], 'ch4.mon_notice', [rel('kubota', 1, 1), rel('yamashina', 0, 1)], OF(['kubota', 'yamashina'], '4月26日（月） 8:20 駅事務室'));
  go('ch4.in_p', [
    ['kubota', '連絡事項、聞こえていましたか。', 'normal'],
    ['player', 'え。……もう一度、お願いします。'],
    ['yamashina', '（小声で）臨時掲示、午前中。三番ホーム工事は十時。メモ。', 'smile'],
    ['yamashina', '借り一つな。問題ない、気にするな。'],
    '久保田は何も言わず、{player}の手帳の端に付箋を一枚貼った。「先に言う」。'
  ], 'ch4.mon_notice', [rel('yamashina', 1, 1), rel('kubota', 0, 0)], OF(['kubota', 'yamashina'], '4月26日（月） 8:20 駅事務室'));

  go('ch4.mon_notice', [
    ['shiraishi', '連絡は二つ。一つ目、五月三日が連休の山だ。'],
    ['shiraishi', '二つ目。基地入門研修、来年度の候補者。駅から出すのは一名。'],
    ['shiraishi', '志望書は五月十四日の十七時まで。条件は、研修が始まる時点で在籍十二か月。今年の新人も出せる。'],
    ['shiraishi', '決めるのは私だ。志望書と、日々の扱いを見る。'],
    '山科の手の中で、ペンが一度、カチと鳴った。'
  ], 'ch4.slot_talk', null, OF(['shiraishi', 'kubota', 'yamashina'], '8:45 駅事務室 朝礼'));

  go('ch4.slot_talk', [
    '休憩室の隅。公募の紙が、きっちり角を揃えて置かれていた。',
    ['yamashina', '出すよ、志望書。', 'normal'],
    ['yamashina', '一名だ。同期で一番手強いのは、お前だと思ってる。'],
    ['yamashina', 'ここで外れたら、基地は来年まで遠い。……お前は、出すのか。']
  ], 'ch4.slot_choice', null, HR(['yamashina'], '12:10 休憩室'));
  choice('ch4.slot_choice', '山科に、どう答える？', [
    opt('apply', '「出すよ。正々堂々、競おう」', 'ch4.sa_1', { tone: 'honest', effects: [set('ch4.slot_apply'), rel('yamashina', 0, 1), ev('teamwork', 1)] }),
    opt('pass', '「今回は見送る。駅で、もう少し力をつけたい」', 'ch4.sp_1', { tone: 'careful', effects: [set('ch4.slot_pass'), lockE('slot_self', '今年度の基地推薦に、自分は出さないと決めた'), rel('yamashina', 1, 1), ev('accuracy', 1)] }),
    opt('wait', '「まだ決めない。お前の志望書を、先に読ませて」', 'ch4.sw_1', { tone: 'caring', effects: [set('ch4.slot_wait'), rel('yamashina', 1, 2), ev('teamwork', 2)] })
  ], { important: true, who: 'yamashina', view: HR(['yamashina']) });

  // ---- 「出す」：自分も書く夜 ----
  go('ch4.sa_1', [
    ['yamashina', '手を抜くなよ。抜かれたら、勝っても嬉しくない。', 'smile'],
    ['yamashina', '……俺は、締切の十四日まで書き直す。']
  ], 'ch4.sa_y', null, HR(['yamashina']));
  go('ch4.sa_y', [
    '「問題ない」。山科は、誰もいない部屋で声に出して言った。',
    '白い原稿用紙には、題名しかない。八歳の工場見学。台車が外される電車の景色。',
    '紙の端に「勝つ」と書いて、消した。消しゴムのカスだけが残った。'
  ], 'ch4.sa_me', [{ clock: { addDay: 1, minute: hm(20, 30) } }], DP([], '4月27日（火） 20:30 社員寮'));
  go('ch4.sa_me', [
    '同じ時刻。{player}の机にも、白い志望書。',
    '一行目が書けない。書けた一行は、山科が読んだら笑う気がして消した。',
    '午前一時。二時間、同じ行にいた。'
  ], 'ch4.sa_morn', [{ clock: { addDay: 1, minute: hm(1, 10) } }], HR([], '4月28日（水） 1:10 社員寮'));
  go('ch4.sa_morn', [
    ['kubota', '目が赤いです。……書いていたんですね。', 'normal'],
    '久保田は、湯気の立つお茶を机に置いて、それ以上は聞かなかった。'
  ], 'ch4.review_1', [{ clock: { minute: hm(8, 20) } }, rel('kubota', 1, 0)], OF(['kubota'], '4月28日（水） 8:20 駅事務室'));

  // ---- 「見送る」：締切表に線を引く ----
  go('ch4.sp_1', [
    ['yamashina', '俺に気を遣ってないよな。', 'worry'],
    ['player', '遣ってない。駅の仕事を、覚えきってないだけ。'],
    ['yamashina', '……そうか。（ペンを回す手が、止まった）']
  ], 'ch4.sp_y', null, HR(['yamashina']));
  go('ch4.sp_y', [
    '（見送る、と言った。気を遣われたなら、勝っても嬉しくない）',
    '山科は一行目を書いた。八歳の景色から。ペンが、やっと動いた。'
  ], 'ch4.sp_me', [{ clock: { addDay: 1, minute: hm(20, 30) } }], DP([], '4月27日（火） 20:30 社員寮'));
  go('ch4.sp_me', [
    '{player}は、締切表の五月十四日に、赤鉛筆で線を引いた。',
    '消しゴムは、使わなかった。もう、出せない。'
  ], 'ch4.sp_morn', null, HR([], '4月27日（火） 22:00 社員寮'));
  go('ch4.sp_morn', [
    ['kubota', '見送ったと聞きました。', 'normal'],
    ['kubota', '駅で何を積むかは、今日の窓口で決まります。', 'smile']
  ], 'ch4.review_1', [{ clock: { addDay: 1, minute: hm(8, 20) } }], OF(['kubota'], '4月28日（水） 8:20 駅事務室'));

  // ---- 「読ませて」：人の原稿を先に読む ----
  go('ch4.sw_1', [
    ['yamashina', '読んでくれるのか。一人で書くの、怖くてさ。', 'smile'],
    ['player', '遠慮なく言うよ。'],
    ['yamashina', '……お前が出すなら、それも聞かせろ。']
  ], 'ch4.sw_y', null, HR(['yamashina']));
  go('ch4.sw_y', [
    '（頼んでよかったのか。同じ枠を狙うかもしれない相手に）',
    '頼ることは弱さじゃない。そう言い聞かせている時点で、弱いと思っている。'
  ], 'ch4.sw_me', [{ clock: { addDay: 1, minute: hm(20, 30) } }], DP([], '4月27日（火） 20:30 社員寮'));
  go('ch4.sw_me', [
    '{player}の机には、白い志望書が一枚。「出す」とも「出さない」とも、まだ書いていない。',
    '十四日の十七時。それまでに決めればいい。決めなければ、決まる。'
  ], 'ch4.sw_morn', null, HR([], '4月27日（火） 22:00 社員寮'));
  go('ch4.sw_morn', [
    ['kubota', '決める日は、締切の朝ではなく、書く日です。', 'normal'],
    '久保田は、そう言って、予定表の十四日に鉛筆で小さな四角を描いた。'
  ], 'ch4.review_1', [{ clock: { addDay: 1, minute: hm(8, 20) } }], OF(['kubota'], '4月28日（水） 8:20 駅事務室'));

  // =====================================================================
  // 志望書を読む（4月28日 昼）
  // =====================================================================
  go('ch4.review_1', [
    ['yamashina', '笑うなよ。半分も書けてない。', 'worry'],
    '右に傾いた手書きの文字。最後の一行だけ、やけに力強い。',
    ['yamashina', '正直に言ってくれ。']
  ], 'ch4.review_task', [{ clock: { minute: hm(12, 10) } }], HR(['yamashina'], '4月28日（水） 12:10 休憩室'));
  N['ch4.review_task'] = { id: 'ch4.review_task', type: 'task', kind: 'compose', title: '志望書への助言を組み立てる', intro: '山科の志望書に、何を、どう伝えるか。「良い点」「直す点」「伝え方」を選んでください。',
    slots: [
      { id: 'good', label: '良い点', options: [
        { id: 'g1', text: '全体的に、すごくいいと思う。どこも直さなくていいくらい。', good: false, why: '曖昧で、本人が何を残すべきか分かりません。' },
        { id: 'g2', text: '最初の景色と、最後の一行がつながっている。そこは、あなたの言葉だと思う。', good: true, why: 'どこが良いかを、具体的に伝えています。' },
        { id: 'g3', text: '文章の技術なら、正直、僕のほうが上手く書けると思う。', good: false, why: '助言ではなく、競争心の表明です。' }] },
      { id: 'fix', label: '直す点', options: [
        { id: 'f1', text: '直す点は、ないと思う。直したら、お前の勢いが消えそうで。', good: false, why: '競争相手への遠慮で、助言を避けています。' },
        { id: 'f2', text: '真ん中の二段落は、設備の用語が並びすぎている。駅で見たお客様の話を一つ入れたい。', good: true, why: '直す箇所と方向を示しています。' },
        { id: 'f3', text: '最初から全部、書き直したほうがいい。時間はないけど、そのほうが通る。', good: false, why: '大雑把で、相手の気持ちを折ります。' }] },
      { id: 'how', label: '伝え方', options: [
        { id: 'h1', text: '気を悪くしないでね、と何度も前置きしながら、少しずつ伝える。', good: false, why: '前置きが多すぎて、本題がぼやけます。' },
        { id: 'h2', text: '一言だけ言って、あとは本人に任せる。こちらから、追わない。', good: false, why: '突き放した伝え方です。' },
        { id: 'h3', text: '同期として、本気でいいと思うから言う。厳しいことも、遠慮はしない。', good: true, why: '率直な伝え方です。' }] }
    ],
    results: [{ min: 66, goto: 'ch4.rv_good', effects: [ev('teamwork', 3), ev('reporting', 1)] }, { min: 34, goto: 'ch4.rv_mid', effects: [ev('teamwork', 1)] }, { min: 0, goto: 'ch4.rv_bad', effects: [ev('teamwork', -1)] }], view: HR(['yamashina'], '12:15 休憩室') };
  go('ch4.rv_good', [
    ['yamashina', '真ん中が薄いのは、自分でも分かってた。', 'smile'],
    '山科は、鉛筆を借りて、二段落目の頭に大きく印をつけた。'
  ], 'ch4.y2', [set('ch4.review_good'), rel('yamashina', 2, 2)], HR(['yamashina']));
  go('ch4.rv_mid', [['yamashina', '言いたいことは分かった。慎重に言ってくれたのも。', 'normal']], 'ch4.y2', [rel('yamashina', 1, 1)], HR(['yamashina']));
  go('ch4.rv_bad', [['yamashina', '……全然、足りてないな、俺。一人で読み直す。', 'worry'], '山科は、原稿を二つに折って、胸ポケットに入れた。'], 'ch4.y2', [rel('yamashina', 0, -1)], HR(['yamashina']));

  go('ch4.y2', [
    '「問題ない」。昼の指摘を、その一言で流せなかった。',
    '焦ると、手が速くなる。確認が、雑になる。昔、言われた。',
    '赤で囲んだ五月三日。釣銭の補充は、俺の担当だ。間違えられない。'
  ], 'ch4.gw_open', null, DP([], '4月28日（水） 22:00 社員寮'));

  // =====================================================================
  // 5月3日(月・祝)：3Dハブ。券売機室で「数える／押す」
  // =====================================================================
  go('ch4.gw_open', [
    '券売機の前の行列。キャリーケースが、床をごろごろ鳴らしている。',
    ['kiryu', '釣銭補充は、二人で数えて、二人で印。判子は、数えたあとです。', 'serious'],
    '桐生が、記録簿と判子を一組ずつ配った。山科の分は、他より少し遅れて、渡された。',
    ['yamashina', '3号機の百円カセットは、俺だ。昼前に、二人目を頼む。']
  ], 'ch4.hub', [{ clock: { addDay: 5, minute: hm(8, 20) } }, tl('5月3日 ゴールデンウィークの最繁忙日')], OF(['shiraishi', 'kiryu', 'yamashina', 'kubota'], '5月3日（月・祝） 8:20 駅事務室 朝礼'));

  hub('ch4', {
    title: '青嶺中央駅 勤務（5月3日・連休の山）', hint: '午前は持ち場の仕事を。昼前に、山科から二人目を頼まれます。',
    timed: [{ id: 'noon', at: hm(12, 0), goto: 'ch4.y3' }],
    goals: [
      { id: 'g_bags', label: '（任意）両替袋の置き場を見る', when: F('ch4.saw_bags'), optional: true },
      { id: 'g_work', label: '持ち場の仕事を一つ進める', when: F('ch4.work_done') },
      { id: 'g_second', label: '山科の補充の二人目を務める（10:30以降）', when: F('ch4.hc_done') }
    ],
    exit: { label: '券売機室へ向かう（山科の補充・11:50ごろ）', requires: ALL(F('ch4.hc_done'), T('>=', hm(11, 40))), goto: 'ch4.y3' }
  });
  N['ch4.hub'].interactions.push(
    { id: 'bags', object: 'roster_board', label: '両替袋の置き場を見る', goto: 'ch4.bags', once: true, minutes: 3, icon: '👛' },
    { id: 'w_svc', object: 'ticket_office', label: '窓口に入る（臨時列車の問い合わせ）', goto: 'ch4.gs_1', requires: SERV, once: true, icon: '🎫' },
    { id: 'w_plat', object: 'tactile', label: 'ホームの乗車列を整える', goto: 'ch4.gp_1', requires: PLAT, once: true, icon: '🚉' },
    { id: 'w_off', object: 'terminal', label: '臨時列車の情報を発車標へ入力する', goto: 'ch4.go_1', requires: OFFC, once: true, icon: '💻' },
    { id: 'second', object: 'vend3', label: '3号機の前：山科の「二人目」を引き受ける', goto: 'ch4.hc_ask', requires: T('>=', hm(10, 30)), once: true, icon: '🪙' },
    { id: 'tour', object: 'tourist2', label: '外国の旅行客に臨時列車の乗り場を伝える', goto: 'ch4.tourist', once: true, icon: '💬' }
  );

  go('ch4.bags', [
    '台の上に、両替袋が二つ並んでいる。青は百円。黄は五百円。',
    '口の結び方が、同じだ。袋の端が、重なっている。',
    '{player}は、手帳に小さく書いた。「青・黄、隣」。'
  ], 'ch4.bags_end', null, v3('npc:vend3', '券売機室 袋の置き場'));
  fx('ch4.bags_end', [set('ch4.saw_bags'), log('両替袋（青＝百円・黄＝五百円）が隣り合っている', 'work')], 'ch4.hub');

  go('ch4.tourist', [
    ['tourist2', 'Excuse me. 臨時の、train。どこ？', 'worry'],
    ['player', '二番線です。自由席は予約不要です。'],
    ['tourist2', 'Thank you. ……ありがとう。', 'smile']
  ], 'ch4.tourist_end', null, v3('npc:tourist2', '改札前'));
  fx('ch4.tourist_end', [ev('service', 1), time(5)], 'ch4.hub');

  // ---- 持ち場の仕事（どれか一つ。結果は、列と人に残る） ----
  go('ch4.gs_1', [
    '窓口の前に、列。バスの乗り場、払い戻し、落とし物。声が重なる。',
    ['kubota', '聞いてから分ける。急ぐほど、ここです。']
  ], 'ch4.gs_task', null, OF(['kubota'], '9:00 きっぷうりば'));
  N['ch4.gs_task'] = { id: 'ch4.gs_task', type: 'task', kind: 'sort', title: '窓口の用件を振り分ける', intro: 'お客様の用件を「その場で案内」「窓口で手続き」「別の係へ」に振り分けます。制限時間があります。',
    config: { perItem: 6, bins: [{ id: 'now', label: 'その場で案内' }, { id: 'desk', label: '窓口で手続き' }, { id: 'other', label: '別の係・他社へ' }], items: [
      { id: 'a', label: '「臨時列車の乗り場を教えて」', bin: 'now', why: '掲示と地図で案内できます。' },
      { id: 'b', label: '「特急券を、人数を間違えて買った（未使用）」', bin: 'desk', why: '払い戻しは窓口の手続きです。' },
      { id: 'c', label: '「バスの乗り場と時刻を教えて」', bin: 'other', why: 'バスはバス会社の案内です。場所だけ案内します。' },
      { id: 'd', label: '「ベビーカーで、エレベーターはどこ？」', bin: 'now', why: '場所の案内で済みます。' },
      { id: 'e', label: '「観光案内所は、どこですか」', bin: 'now', why: '案内図で案内できます。' },
      { id: 'f', label: '「落とし物をした。台帳を確認して」', bin: 'desk', why: '台帳は窓口で、控えを取りながら見ます。' }] },
    results: res3('ch4.work_a', 'ch4.work_b', 'ch4.work_c', [ev('service', 3), ev('accuracy', 1), sk('ticket', 2)], [ev('service', 1)], [ev('service', -1)]), view: OF(['kubota'], '9:30 きっぷうりば') };
  go('ch4.gp_1', [
    '二番ホーム。臨時列車を待つ列が、階段のほうへ伸びている。',
    ['hamaguchi', '（電話）結論から。列を階段に出さないこと。方法は現場で。', 'normal']
  ], 'ch4.gp_task', null, OF(['kubota'], '9:00 ホーム 乗車列'));
  N['ch4.gp_task'] = { id: 'ch4.gp_task', type: 'task', kind: 'route', title: '乗車列の折り返し動線', intro: '起点から着点まで、A（階段付近）・B（点字ブロックの要所）・C（ホーム先頭）を必ず通る動線をつなぎます。混んだ通路は遅くなります。',
    config: { grid: ['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], must: ['A', 'B', 'C'], best: bestRoute(['S.#.....G', '..#.###..', '.A....B..', '.##.#.##.', 'C...~....'], ['A', 'B', 'C']), legend: { '#': '柱・壁（通れない）', '~': '混雑した通路（遅い）', A: '階段付近', B: '点字ブロックの要所', C: 'ホーム先頭', S: '起点', G: '事務室側の出口' } },
    results: res3('ch4.work_a', 'ch4.work_b', 'ch4.work_c', [ev('safety', 3), ev('service', 1), sk('patrol', 2)], [ev('safety', 1)], [ev('safety', -2)]), view: OF(['kubota'], '9:30 ホーム') };
  go('ch4.go_1', [
    '事務室の端末が、臨時列車の予定を更新し続けている。',
    ['kiryu', '出納簿も見ます。数字と時刻のずれは、すぐ。', 'normal']
  ], 'ch4.go_task', null, OF(['kubota', 'kiryu'], '9:00 駅事務室'));
  N['ch4.go_task'] = { id: 'ch4.go_task', type: 'task', kind: 'memory', title: '臨時列車の案内を、発車標に入力する', intro: '臨時列車の情報を見て覚え、同じ順に入力します。見返しはできません。',
    config: { sequence: ['臨時列車', '9:40発', '2番線', '海浜行'], pool: ['定期列車', '9:04発', '9:40発', '1番線', '2番線', '3番線', '海浜行', '北嶺行'], showMs: 4600, showLabel: '臨時列車の情報' },
    results: res3('ch4.work_a', 'ch4.work_b', 'ch4.work_c', [ev('accuracy', 3), ev('reporting', 1), sk('ops', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]), view: OF(['kubota'], '9:30 駅事務室') };
  // 結果は、評価でなく、現場の変化として返す
  go('ch4.work_a', [['kubota', '列が、階段に出ていません。', 'smile']], 'ch4.work_end', null, OF(['kubota']));
  go('ch4.work_b', [['kubota', '一件、案内し直しました。列は、保てています。']], 'ch4.work_end', null, OF(['kubota']));
  go('ch4.work_c', [['kubota', '私が入ります。呼吸、ひとつ。', 'serious']], 'ch4.work_end', [], OF(['kubota']));
  fx('ch4.work_end', [set('ch4.work_done'), time(20), log('連休の持ち場の仕事を一つこなす', 'work')], 'ch4.hub');

  // ---- 重要な場面：二人目を引き受ける（時限・既定は「先に押す」） ----
  go('ch4.hc_ask', [
    '券売機室の前。山科が、袋と記録簿を抱えて待っていた。後ろで、列が伸びている。',
    ['yamashina', '悪い。百円カセットの確認、頼む。数えるなら、五分かかる。', 'worry'],
    ['yamashina', '先に判子だけ押してくれたら、数えるのは、あとで俺がやる。順番が前後するだけだ。']
  ], 'ch4.hc_choice', null, v3('npc:vend3', '11:40 券売機室 前'));
  choice('ch4.hc_choice', '判子を、どうする？', [
    opt('count', '「数えてから押す。五分で済む」', 'ch4.hc_c', { tone: 'careful', effects: [set('ch4.counted'), ev('accuracy', 2), rel('yamashina', 0, -1)] }),
    opt('sign', '「分かった。あとで見直そう」と、先に押す', 'ch4.hc_s', { tone: 'quick', effects: [set('ch4.signed_blind'), ev('accuracy', -2), rel('yamashina', 1, 1)] })
  ], { timeLimit: 20, defaultOption: 'sign', who: 'yamashina', view: v3('npc:vend3', '11:40 券売機室 前') });
  go('ch4.hc_c', [
    '百円玉を、十枚ずつ、並べる。三十五枚。三十五枚。三十四枚の列で、手が止まった。',
    ['yamashina', '……数え直す。', 'worry'],
    '終わったとき、窓口の列は、階段の手前まで伸びていた。',
    '記録簿の印欄に、{player}は、十一時四十七分と書いて、判子を押した。'
  ], 'ch4.hc_end', [set('ch4.queue_long'), time(7)], v3('npc:vend3', '11:47 券売機室'));
  go('ch4.hc_s', [
    ['player', '見直す約束だよ。'],
    '押した印だけが、指先に妙に残った。',
    '判子の跡は、まだ数えていない数字の上に、きれいに乗っている。'
  ], 'ch4.hc_end', [time(2)], v3('npc:vend3', '11:42 券売機室'));
  fx('ch4.hc_end', [set('ch4.hc_done')], 'ch4.hub');

  // =====================================================================
  // 山科視点：券売機室での取り違え（12:00ごろ）
  // =====================================================================
  go('ch4.y3', [
    '「問題ない」。袋を持ち上げながら、山科は三回、言い聞かせた。',
    '青い袋が百円、黄色い袋が五百円。隣り合わせに積んである。',
    '十一時五十八分。旅行客が、千円札で九百円のきっぷを買った。三号機が返した釣銭は、重い、銀色の一枚だった。',
    '客は、礼を言って、ホームへ上がっていった。山科は、まだ、それを知らない。',
    '十二時八分。試験払出し。百円玉が三枚、受け皿に落ちる。三枚目の音だけ、重かった。',
    '百円カセットに、五百円玉を十二枚。気づいて、一人で開けて、一枚ずつ戻した。再試験。三枚とも百円。十二時十分。',
    '誰にも見られていない。ただ、一人を除いて。'
  ], 'ch4.learn', [{ clock: { minute: hm(12, 10) } }, set('ch4.incident'), tl('5月3日 山科が、釣銭の袋を取り違える')], DP([], '5月3日（月・祝） 12:00 券売機室'));
  branch('ch4.learn', [[PLAT, 'ch4.ln_plat'], [OFFC, 'ch4.ln_off']], 'ch4.ln_svc');
  go('ch4.ln_svc', [
    '券売機室の扉の内側で、山科が青い顔で立っていた。',
    ['yamashina', 'さっきの印、記録簿のここに押したよな。', 'worry'],
    ['yamashina', '休憩、一緒に。人のいない所で。']
  ], 'ch4.confess', [{ clock: { minute: hm(12, 25) } }], OF(['yamashina'], '12:25 券売機室 前'));
  go('ch4.ln_plat', [
    '階段の途中で、山科が息を切らして止まっていた。',
    ['yamashina', '手短に……いや、ここじゃ無理だ。', 'worry'],
    ['yamashina', '昼休憩、人のいない所で。']
  ], 'ch4.confess', [{ clock: { minute: hm(12, 25) } }], OF(['yamashina'], '12:25 ホーム 階段'));
  go('ch4.ln_off', [
    '山科が、机にヒヤリハット報告票を広げていた。',
    ['yamashina', '書き方を教えてくれ。仮の話だ。', 'worry'],
    ['player', '実害ゼロで、本人が気づいて直した場合、ですか。'],
    ['yamashina', '……そう。それでも書くのか。'],
    '用紙の角が、指で何度も折られていた。仮の話では、なかった。'
  ], 'ch4.confess', [{ clock: { minute: hm(12, 25) } }], OF(['yamashina'], '12:25 駅事務室 隅の机'));

  go('ch4.confess', [
    ['yamashina', '百円カセットに、五百円玉を十二枚入れた。', 'worry'],
    '休憩室の奥。山科は、紙コップを両手で包んでいる。',
    ['player', '一人でカセットを開けたの？ 二人でって。'],
    ['yamashina', '客には一枚も出てない。再試験も通った。'],
    ['yamashina', '票を書けば、評価に赤い印が付く。推薦は評価で決まる。'],
    ['yamashina', '知ってるのは、俺とお前だけだ。……黙っててくれないか。この枠、本当に欲しいんだ。']
  ], 'ch4.confess_b', null, HR(['yamashina'], '12:40 休憩室 奥'));
  branch('ch4.confess_b', [[F('ch4.signed_blind'), 'ch4.confess_s'], [F('ch4.counted'), 'ch4.confess_c']], 'ch4.ch_choice');
  go('ch4.confess_s', [
    ['yamashina', 'それに、お前の印も、あの記録簿にある。', 'worry'],
    ['player', '（あの印は、僕のものでもある。数える前の数字の上に、押した）']
  ], 'ch4.ch_choice', [], HR(['yamashina']));
  go('ch4.confess_c', [
    ['player', '十一時四十七分には、三十五枚ずつ合っていた。印は、その時刻のものだ。'],
    ['yamashina', '……数えてくれたのは、お前だけだ。だから、困る。', 'worry']
  ], 'ch4.ch_choice', null, HR(['yamashina']));

  choice('ch4.ch_choice', '山科の頼みを、どう受け止める？', [
    opt('cover', '「分かった。誰にも言わない。次は必ず二人で開ける」', 'ch4.cv_1', { tone: 'caring', effects: [set('ch4.covered_yama'), set('ch4.secret_kept'), rel('yamashina', 2, 2), ev('reporting', -4), ev('safety', -2)] }),
    opt('together', '「報告しよう。僕も一緒に行く」', 'ch4.tg_1', { tone: 'honest', requires: F('ch4.incident'), effects: [set('ch4.told_truth'), set('ch4.told_together'), ev('reporting', 5), ev('safety', 2)] }),
    opt('alone', '「ごめん。僕から、桐生助役に伝える」', 'ch4.al_1', { tone: 'risky', effects: [set('ch4.told_truth'), set('ch4.told_alone'), rel('yamashina', -2, -2), ev('reporting', 4), ev('teamwork', -2)] })
  ], { important: true, who: 'yamashina', view: HR(['yamashina']) });

  // ---------------------------------------------------------------
  // 庇う：午後。直ったはず、の数字が、閉まる前に、もう一度来る
  // ---------------------------------------------------------------
  go('ch4.cv_1', [
    ['player', '誰にも言わない。次は必ず二人で開ける。約束して。'],
    ['yamashina', '約束する。……ありがとう。', 'smile'],
    ['player', '（これでいい。そう思おうとしている自分に、気づく）']
  ], 'ch4.cv_help', [tl('5月3日 山科の取り違えを、報告しなかった'), { clock: { minute: hm(14, 50) } }], HR(['yamashina'], '12:55 休憩室 奥'));
  choice('ch4.cv_help', '十五時。山科は、何度も券売機室のほうを見ている。どうする？', [
    opt('recount', '空き時間に、二人で3号機のカセットを数え直す', 'ch4.cv_recount', { tone: 'careful', effects: [set('ch4.helped_yama'), rel('yamashina', 1, 1), ev('accuracy', 2)] }),
    opt('leave', '「直ったんだから大丈夫」と言って、持ち場に戻る', 'ch4.cv_leave', { tone: 'quick', effects: [rel('yamashina', 0, -1)] })
  ], { timeLimit: 25, defaultOption: 'leave', view: OF(['yamashina'], '14:50 券売機室 前') });
  go('ch4.cv_recount', [
    '十五時。二人で3号機のカセットを開け、百円玉を十枚ずつ並べた。',
    ['yamashina', '二人で開けるの、これで二回目だな。一回目は、遅かった。', 'smile'],
    '五百円玉は、一枚もない。袋の口を閉じる音だけが、残った。',
    '受け皿の端に、細い傷がある。誰も、それを見なかった。'
  ], 'ch4.cv_ledger', [time(25)], OF(['yamashina'], '15:00 券売機室'));
  go('ch4.cv_leave', [
    ['player', '直ったんだし、大丈夫。持ち場に戻る。'],
    '山科の笑顔は、少し硬かった。背中に、視線を感じた。'
  ], 'ch4.cv_ledger', [time(20)], OF(['yamashina'], '14:55 券売機室 前'));
  // 17:10 日計：400円の過不足
  go('ch4.cv_ledger', [
    '十七時十分。出納机の灯りの下で、桐生が日計表を指で押さえていた。',
    ['kiryu', '3号機。現金が、四百円足りません。', 'serious'],
    ['kiryu', '機械の不具合なら、保守に出します。人の扱いなら、今のうちに、理由を書き足せます。'],
    ['kiryu', '閉じます。十七時十五分に。知っている人は、いま。'],
    '山科は、紙コップを持ったまま、動かない。ペンが、一度も、鳴らなかった。'
  ], 'ch4.cv_ledger_c', [{ clock: { minute: hm(17, 10) } }], OF(['kiryu', 'yamashina'], '17:10 駅事務室 出納机'));
  choice('ch4.cv_ledger_c', '桐生は、{player}を見ている。', [
    opt('speak', '「3号機の件です。袋の取り違えで……山科さんは、一度、直しました」', 'ch4.cl_speak', { tone: 'honest', effects: [set('ch4.told_late'), set('ch4.red_mark'), rel('yamashina', -1, -1), rel('kiryu', 1, 0), ev('reporting', 2), lockE('clean_record', '5月3日の取り違えが、評価記録に赤印で残る')] }),
    opt('nudge', '山科を見る。「話したいことが、あるんじゃないですか」', 'ch4.cl_nudge', { tone: 'caring', effects: [set('ch4.yama_spoke'), set('ch4.red_mark'), lockE('clean_record', '5月3日の取り違えが、評価記録に赤印で残る'), ev('teamwork', 1)] }),
    opt('silent', '何も言わない', 'ch4.cl_silent', { tone: 'neutral', effects: [set('ch4.ledger_unknown'), lockE('ledger_may3', '5月3日の過不足の原因を、あの日の記録に書き足す機会が閉じた'), ev('reporting', -2)] })
  ], { timeLimit: 15, defaultOption: 'silent', who: 'kiryu', view: OF(['kiryu', 'yamashina']) });
  go('ch4.cl_speak', [
    ['kiryu', '遅いです。けれど、日付が変わる前だ。', 'serious'],
    ['kiryu', 'ログを見ます。……十一時五十八分に、払出しが一件。五百円玉。お客様の分は、掲示を出します。'],
    ['yamashina', '客に……出てたのか。', 'worry'],
    '山科は、{player}を、見なかった。'
  ], 'ch4.cv_after', null, OF(['kiryu', 'yamashina'], '17:15 駅事務室'));
  go('ch4.cl_nudge', [
    '山科が、一歩、前に出た。喉が、一度、鳴った。',
    ['yamashina', '……俺が、袋を、間違えました。', 'worry'],
    ['kiryu', '最後まで聞きます。', 'serious'],
    ['kiryu', '十一時五十八分に、払出し一件。……お客様は、いました。掲示を出します。'],
    ['yamashina', '知らなかった。……本当に、知らなかったんです。']
  ], 'ch4.cv_after', [rel('kiryu', 1, 1)], OF(['kiryu', 'yamashina'], '17:15 駅事務室'));
  go('ch4.cl_silent', [
    '十七時十五分。桐生は、日計表の端に、短く書いた。',
    ['kiryu', '「3号機 過不足 −400円 原因不明」。', 'normal'],
    '判子が、紙の上に降りた。山科の肩が、わずかに落ちた。',
    ['kiryu', '月末の監査まで、残ります。……もう、書き足せません。']
  ], 'ch4.cv_after', null, OF(['kiryu', 'yamashina'], '17:15 駅事務室'));
  go('ch4.cv_after', [
    ['kiryu', '今日は、ここまで。'],
    '扉が静かに閉まった。二人の間に、薄い膜ができていた。'
  ], 'ch4.hub2', [{ clock: { minute: hm(17, 40) } }], OF(['yamashina'], '17:40 駅事務室'));

  // ---------------------------------------------------------------
  // 一緒に報告：赤印は付く。それでも、次の人の安全が残る
  // ---------------------------------------------------------------
  go('ch4.tg_1', [
    ['player', '報告しよう。一緒に行く。'],
    ['yamashina', '……怖いんだ。評価より、見る目が変わるのが。', 'worry'],
    ['player', '黙っていても、3号機がログを残す。あとで見つかるほうが、見る目は変わる。'],
    ['yamashina', '……俺から話す。横にいてくれ。', 'normal']
  ], 'ch4.tg_kiryu', [tl('5月3日 山科と一緒に、取り違えを報告することにした'), { clock: { minute: hm(12, 55) } }], HR(['yamashina'], '12:55 休憩室 奥'));
  go('ch4.tg_kiryu', [
    ['kiryu', '最後まで聞きます。続けて。', 'serious'],
    ['yamashina', '百円カセットに五百円玉を十二枚。気づいて全部戻しました。開封は、一人で。'],
    ['kiryu', '気づいて一時間以内に、自分から来た。……{player}さんは、なぜご一緒に。']
  ], 'ch4.tg_k_b', [{ clock: { minute: hm(13, 10) } }], OF(['kiryu', 'yamashina'], '13:10 駅事務室 打ち合わせ'));
  branch('ch4.tg_k_b', [[F('ch4.signed_blind'), 'ch4.own_ask']], 'ch4.tg_log');
  // 自分の印を、言うか（時限・既定は沈黙）
  go('ch4.own_ask', [
    ['kiryu', '二人の判子が、記録簿にあります。……時刻は、いつの数字の上ですか。']
  ], 'ch4.own_choice', null, OF(['kiryu']));
  choice('ch4.own_choice', '桐生は、{player}の判子の欄を見ている。', [
    opt('say', '「数える前に押しました。僕の印も、同じです」', 'ch4.own_say', { tone: 'honest', effects: [ev('reporting', 3), rel('kiryu', 2, 1), set('ch4.red_self')] }),
    opt('quiet', '何も言わない', 'ch4.own_quiet', { tone: 'neutral', effects: [set('ch4.own_part_hidden')] })
  ], { timeLimit: 15, defaultOption: 'quiet', who: 'kiryu', view: OF(['kiryu']) });
  go('ch4.own_say', [
    ['kiryu', '二人とも、手順を一つ飛ばしました。私の配り方も、遅かった。', 'normal'],
    ['kiryu', '赤印は、お二人に。扱いのほうは、別に書きます。']
  ], 'ch4.own_ret', null, OF(['kiryu']));
  go('ch4.own_quiet', [
    ['kiryu', '印の件は、記録で見ます。', 'normal'],
    '桐生は、判子の欄を、もう一度だけ見た。何も書かなかった。'
  ], 'ch4.own_ret', null, OF(['kiryu']));
  branch('ch4.own_ret', [[F('ch4.told_alone'), 'ch4.al_log']], 'ch4.tg_log');
  go('ch4.tg_log', [
    ['kiryu', '3号機のログを開きます。', 'normal'],
    ['kiryu', '……十一時五十八分、払出しが一件。五百円玉。', 'serious'],
    ['yamashina', '客に……出てたのか。', 'worry'],
    ['kiryu', '掲示を出します。四百円は、過払いで処理。あなたたちが来なければ、今夜の日計が、原因不明になるところでした。'],
    ['kiryu', '赤印は付きます。もう決まりました。どう読むかは、駅長が決めます。']
  ], 'ch4.tg_task', [set('ch4.red_mark'), lockE('clean_record', '5月3日の取り違えが、評価記録に赤印で残る'), set('ch4.trust_built'), rel('kiryu', 1, 1)], OF(['kiryu', 'yamashina'], '13:25 駅事務室'));
  N['ch4.tg_task'] = { id: 'ch4.tg_task', type: 'task', kind: 'compose', title: 'ヒヤリハット票を、組み立てる', intro: '「事実」「原因」「再発防止」を、どう書くか選びます。誰が読んでも、同じ状況が分かること。',
    slots: [
      { id: 'fact', label: '事実', options: [
        { id: 'f1', text: '大したミスではないが、一応、報告する。お客様への影響は、ほぼない。', good: false, why: '評価の言葉が先で、事実が書かれていません。' },
        { id: 'f2', text: '機械の調子が悪く、硬貨が混ざった。再試験で正常に戻った。', good: false, why: '原因を機械に押しつけていて、事実と異なります。' },
        { id: 'f3', text: '12時8分、3号機の百円カセットに五百円玉12枚を誤って補充。11時58分に払出し1件（五百円玉）。試験払出しで気づき、全数を回収した。', good: true, why: '時刻・内容・対応・影響が、事実として書かれています。' }] },
      { id: 'cause', label: '原因', options: [
        { id: 'c1', text: '青（百円）と黄（五百円）の両替袋が隣り合わせで、混雑の焦りもあり、確認が不足した。二人確認も省略した。', good: true, why: '環境と行動の両面を、正直に書いています。' },
        { id: 'c2', text: '山科個人の不注意。次からは、本人が気をつける。', good: false, why: '個人のせいにすると、再発防止につながりません。' },
        { id: 'c3', text: '原因は、特に分からない。混雑日だったので仕方がない面もある。', good: false, why: '分かる範囲を、書く必要があります。' }] },
      { id: 'fix', label: '再発防止', options: [
        { id: 'x1', text: '次から、気をつけます。確認も、できるだけ二人でやります。', good: false, why: '気持ちだけでは再発を防げません。' },
        { id: 'x2', text: '混雑日は、補充そのものをやめる。人手が足りないときは、翌日に回す。', good: false, why: '業務が回らなくなります。' },
        { id: 'x3', text: '両替袋の置き場を分け、袋に大きな数字を付ける。開封は必ず二人で、印は数えたあとに押す。', good: true, why: '具体的で、実行できます。' }] }
    ],
    results: [{ min: 66, goto: 'ch4.tg_good', effects: [ev('reporting', 4), ev('accuracy', 2)] }, { min: 34, goto: 'ch4.tg_mid', effects: [ev('reporting', 2)] }, { min: 0, goto: 'ch4.tg_bad', effects: [ev('reporting', 0)] }], view: OF(['kiryu', 'yamashina'], '13:40 駅事務室 票の記入') };
  go('ch4.tg_good', [['kiryu', '袋の置き場は、駅全体の手順に回します。'], '桐生は、票の控えに、自分の判子を押した。'], 'ch4.tg_help', [set('ch4.report_good'), rel('kiryu', 2, 2)], OF(['kiryu', 'yamashina']));
  go('ch4.tg_mid', [['kiryu', '方向は合っています。推測と事実を、分けて書き直して。']], 'ch4.tg_help', [rel('kiryu', 1, 1)], OF(['kiryu', 'yamashina']));
  go('ch4.tg_bad', [['kiryu', '書き直しです。書こうとしたことは、受け取りました。', 'normal']], 'ch4.tg_help', null, OF(['kiryu', 'yamashina']));
  choice('ch4.tg_help', '桐生が言った。「袋の置き場を、実際に直しなさい」。山科は、少しふらついている。', [
    opt('stay', '「僕も手伝う。二人で直そう」', 'ch4.tg_stay', { tone: 'caring', effects: [set('ch4.helped_yama'), rel('yamashina', 2, 2), ev('teamwork', 2)] }),
    opt('let', '「自分で直したほうが、覚えるよ。見てる」', 'ch4.tg_let', { tone: 'careful', effects: [rel('yamashina', 1, 0), ev('accuracy', 1)] })
  ], { view: OF(['yamashina']) });
  go('ch4.tg_stay', [
    '青と黄の袋を離して置き、黒いマジックで「百」「五百」と書いた。',
    ['yamashina', '怖かったのに、胸が軽い。……お前が、横にいたからだ。']
  ], 'ch4.hub2', [time(25), { clock: { minute: hm(16, 40) } }], OF(['yamashina'], '16:40 券売機室'));
  go('ch4.tg_let', [
    '不器用で、丁寧な字で、袋に「百」と書かれた。',
    ['yamashina', '読めるか。', 'smile'],
    ['player', '読める。次の人は、間違えない。']
  ], 'ch4.hub2', [time(20), { clock: { minute: hm(16, 40) } }], OF(['yamashina'], '16:40 券売機室'));

  // ---------------------------------------------------------------
  // 一人で報告：ほろ苦い距離
  // ---------------------------------------------------------------
  go('ch4.al_1', [
    ['player', 'ごめん。黙ってられない。僕から、桐生助役に言う。', 'serious'],
    ['yamashina', '……頼む、って言ったのに。', 'worry'],
    ['yamashina', '友達、か。', 'normal'],
    '山科は目を合わせないまま、倉庫のほうへ歩いていった。'
  ], 'ch4.al_2', [tl('5月3日 山科の取り違えを、桐生助役に報告した'), { clock: { minute: hm(12, 55) } }], HR(['yamashina'], '12:55 休憩室 奥'));
  go('ch4.al_2', [
    ['player', '3号機の百円カセットに、五百円玉が十二枚。担当者が気づいて全数戻しました。'],
    ['kiryu', '誰が。', 'serious'],
    ['player', '山科さんです。本人は、報告しないつもりでした。'],
    ['kiryu', '……報告、ありがとう。あなた自身は。']
  ], 'ch4.al_3', [{ clock: { minute: hm(13, 5) } }, rel('kiryu', 2, 0)], OF(['kiryu'], '13:05 駅事務室'));
  branch('ch4.al_3', [[F('ch4.signed_blind'), 'ch4.own_ask']], 'ch4.al_log');
  // 自分の印の件は own_ask 経由で、同じ分岐に戻る（al_log が終点）
  go('ch4.al_log', [
    ['kiryu', '3号機のログを開きます。……十一時五十八分、払出しが一件。五百円玉。', 'serious'],
    ['player', '客に、出ていたんですか。'],
    ['kiryu', '山科さんは、知らなかった。あなたが先に来たから、今夜の日計が、原因不明になりません。'],
    ['kiryu', '赤印は付きます。もう決まりました。どう読むかは、駅長が決めます。'],
    ['kiryu', '先に本人へ勧めて、一緒に来る道もありました。早さは正しい。伝え方には、別の道があった。']
  ], 'ch4.al_4', [set('ch4.red_mark'), lockE('clean_record', '5月3日の取り違えが、評価記録に赤印で残る'), { clock: { minute: hm(13, 15) } }], OF(['kiryu'], '13:15 駅事務室'));
  go('ch4.al_4', [
    '十分後、山科が入ってきた。{player}を、一度だけ見た。',
    ['yamashina', '事実は、全部そのとおりです。すみません。', 'worry'],
    ['kiryu', '座ってください。票は、別々に。']
  ], 'ch4.al_5', [time(10)], OF(['kiryu', 'yamashina'], '13:30 駅事務室'));
  go('ch4.al_5', [
    '二人は、別々の用紙に、互いに見せず書いた。',
    ['yamashina', '……正しいと思う。でも、今は、うまく笑えない。', 'normal'],
    ['yamashina', '謝るのは、俺だ。まだ、言えないだけで。']
  ], 'ch4.hub2', [{ clock: { minute: hm(16, 40) } }], OF(['yamashina'], '16:40 廊下'));

  // =====================================================================
  // 夕方の3Dハブ：現場検証と、帰り支度（17:00〜19:00）
  // =====================================================================
  N['ch4.hub2'] = { id: 'ch4.hub2', type: 'hub', scene: 'station', title: '券売機室（5月3日・夕方）', hint: '3号機の周りを歩いて、今日のことを確かめます。', view: v3('follow', '券売機室 5月3日 夕方'), interactions: [], timed: [{ id: 'close', at: hm(19, 0), goto: 'ch4.night' }], goals: [
    { id: 'g_tray', label: '（任意）3号機の受け皿を見る', when: F('ch4.h2_tray'), optional: true },
    { id: 'g_log', label: '（任意）払出しログを開く', when: F('ch4.h2_log'), optional: true },
    { id: 'g_yama', label: '山科と話す', when: F('ch4.h2_yama') }
  ], exit: { label: '帰り支度をする', requires: F('ch4.h2_yama'), goto: 'ch4.night' } };
  N['ch4.hub2'].interactions.push(
    { id: 'tray', object: 'vend3', label: '3号機の受け皿を確かめる', goto: 'ch4.h2_tray', once: true, icon: '🪙' },
    { id: 'log', object: 'terminal', label: '3号機の払出しログを開く', goto: 'ch4.h2_log', once: true, icon: '💻' },
    { id: 'yama', object: 'yamashina', label: '山科と話す', goto: 'ch4.h2_y', once: true, icon: '💬' },
    { id: 'kub', object: 'kubota', label: '久保田さんに今日の列の話を聞く', goto: 'ch4.h2_k', once: true, icon: '💬' }
  );
  go('ch4.h2_tray', [
    '受け皿の端に、細い傷。五百円玉の縁が、一度だけ、ここを擦った跡だ。',
    '夕方の光が、傷の筋だけを、白く浮かせている。'
  ], 'ch4.h2_tray_end', null, v3('npc:vend3', '17:50 券売機室'));
  fx('ch4.h2_tray_end', [set('ch4.h2_tray'), time(5)], 'ch4.hub2');
  go('ch4.h2_log', [
    '端末に、3号機の払出しログ。',
    '11:58 払出し 500円×1。　12:08 試験払出し 100円×2、500円×1。　12:10 再試験 100円×3。',
    '一行ずつ、時刻が並んでいる。誰も、嘘を書いていない。'
  ], 'ch4.h2_log_end', null, v3('npc:terminal', '17:55 業務端末'));
  branch('ch4.h2_log_end', [[F('ch4.ledger_unknown'), 'ch4.h2_log_gap']], 'ch4.h2_log_fin');
  go('ch4.h2_log_gap', [
    '{player}は、日計表の「−400円 原因不明」と、ログの「11:58」を、並べた。',
    '一つの数字が、もう一つの数字の理由だった。でも、書き足す欄は、もう閉じている。'
  ], 'ch4.h2_log_fin', [], v3('npc:terminal', '17:56 業務端末'));
  fx('ch4.h2_log_fin', [set('ch4.h2_log'), time(5)], 'ch4.hub2');
  go('ch4.h2_k', [
    ['kubota', '今日の列は、午後に二回、階段まで来ました。'],
    ['kubota', '連休は、毎年そうです。……山科さん、午後ずっと、袋を見ていましたね。']
  ], 'ch4.h2_k_b', null, v3('npc:kubota', '18:00 コンコース'));
  branch('ch4.h2_k_b', [[F('ch4.queue_long'), 'ch4.h2_k_q'], [RG('kubota', '>=', 3), 'ch4.h2_k_close']], 'ch4.h2_k_end');
  go('ch4.h2_k_q', [['kubota', '午前の五分は、窓口の十分でした。苦情は、一件。……謝っておきました。必要でしたから。']], 'ch4.h2_k_end', null, v3('npc:kubota'));
  go('ch4.h2_k_close', [['kubota', '今日、何かあったなら、いつでも。私は、口が堅いほうです。', 'smile']], 'ch4.h2_k_end', [], v3('npc:kubota'));
  fx('ch4.h2_k_end', [time(5)], 'ch4.hub2');
  // 山科との会話：経路と、関係値で分かれる
  branch('ch4.h2_y', [[F('ch4.covered_yama'), 'ch4.h2_y_cv'], [F('ch4.told_alone'), 'ch4.h2_y_al']], 'ch4.h2_y_tg');
  branch('ch4.h2_y_cv', [[F('ch4.ledger_unknown'), 'ch4.h2_y_cv_u'], [RG('yamashina', '>=', 9), 'ch4.h2_y_cv_c']], 'ch4.h2_y_cv_f');
  go('ch4.h2_y_cv_u', [
    ['yamashina', '「原因不明」。……あの四百円は、俺の四百円だ。', 'worry'],
    ['yamashina', 'お前に黙らせて、俺は、口を閉じた。二人で、あの数字を閉じた。'],
    ['player', '月末まで、残る。'],
    ['yamashina', '……分かってる。']
  ], 'ch4.h2_y_end', null, v3('npc:yamashina', '18:20 券売機室'));
  go('ch4.h2_y_cv_c', [
    ['yamashina', '約束、守る。次は二人で開ける。……今日は、助かった。', 'smile'],
    '山科は、袋を一つずつ、台の端と端に離して置いた。何も、言わずに。'
  ], 'ch4.h2_y_end', [], v3('npc:yamashina', '18:20 券売機室'));
  go('ch4.h2_y_cv_f', [
    ['yamashina', '……ありがとう。でも、顔、見られない。', 'worry'],
    ['yamashina', '約束は守る。だから、少し、話しかけないでくれ。']
  ], 'ch4.h2_y_end', null, v3('npc:yamashina', '18:20 券売機室'));
  branch('ch4.h2_y_al', [[RG('yamashina', '>=', 5), 'ch4.h2_y_al_a']], 'ch4.h2_y_al_b');
  go('ch4.h2_y_al_a', [
    ['yamashina', '先に、礼を言いに来た。……言えてない礼を。', 'normal'],
    ['yamashina', '棚の袋、離しておいた。お前の顔を見ると、まだ喉が詰まる。それでも。']
  ], 'ch4.h2_y_end', null, v3('npc:yamashina', '18:20 券売機室'));
  go('ch4.h2_y_al_b', [
    ['yamashina', '話すことは、ない。……今日は。', 'normal'],
    '山科は、{player}の横を、判子の音だけ立てて、通り過ぎた。'
  ], 'ch4.h2_y_end', null, v3('npc:yamashina', '18:20 券売機室'));
  go('ch4.h2_y_tg', [
    ['yamashina', '赤印、付いたな。……不思議と、息がしやすい。', 'smile'],
    ['yamashina', '駅長に、五日の柏餅の会で、頭を下げる。お前は、横にいてくれ。']
  ], 'ch4.h2_y_end', null, v3('npc:yamashina', '18:20 券売機室'));
  fx('ch4.h2_y_end', [set('ch4.h2_yama'), time(10)], 'ch4.hub2');

  fx('ch4.night', [{ clock: { minute: hm(22, 30) } }], 'ch4.night_b');
  branch('ch4.night_b', [[F('ch4.covered_yama'), 'ch4.cv_night'], [F('ch4.told_alone'), 'ch4.al_night']], 'ch4.tg_night');
  go('ch4.cv_night', [
    '「問題ない」が、今日は一度も言えなかった。',
    '目を閉じると、受け皿の五百円玉の鈍い光が浮かぶ。',
    '友達だから、黙ってくれた。友達に、黙らせた。その重さを、いつまで持つのだろう。'
  ], 'ch4.gw_end', null, DP([], '5月3日（月・祝） 22:30 社員寮'));
  go('ch4.tg_night', [
    '志望書に、一行足した。「報告は、自分を守るためでなく、次の人を守るためにある」。',
    '赤印は、消えない。けれど、{player}がいなかったら、行けなかった。貸しじゃない。返せないものだ。'
  ], 'ch4.gw_end', null, DP([], '5月3日（月・祝） 22:30 社員寮'));
  go('ch4.al_night', [
    '「問題ない」と、言えなかった。言えば、嘘になる。',
    '逆なら、俺は庇った。そして、あいつを苦しめたかもしれない。',
    '志望書の端に、小さく書いた。「ありがとう、と、いつか言う」。'
  ], 'ch4.gw_end', null, DP([], '5月3日（月・祝） 22:30 社員寮'));

  // =====================================================================
  // 5月5日(水)：合流。選んだ道は、ここでも、人の態度に見える
  // =====================================================================
  go('ch4.gw_end', [
    '机の上に、柏餅の箱があった。誰が置いたのか、まだ誰も言わない。',
    ['shiraishi', '五日間、持った。夕方で臨時体制は終わりだ。']
  ], 'ch4.merge', [{ clock: { addDay: 2, minute: hm(14, 30) } }, tl('5月5日 ゴールデンウィーク最終日')], OF(['shiraishi'], '5月5日（水・祝） 14:30 駅事務室'));
  branch('ch4.merge', [[F('ch4.covered_yama'), 'ch4.mg_cover'], [F('ch4.told_together'), 'ch4.mg_tg']], 'ch4.mg_al');
  branch('ch4.mg_cover', [[F('ch4.ledger_unknown'), 'ch4.mg_cv_u'], [F('ch4.told_late'), 'ch4.mg_cv_l']], 'ch4.mg_cv_y');
  go('ch4.mg_cv_u', [
    ['yamashina', '柏餅、桐生助役から。みんなで、って。', 'normal'],
    ['yamashina', '日計の四百円、月末まで残るってさ。……誰も、俺に聞かない。それが、きつい。', 'worry'],
    '目が合って、同時にそらした。柏餅の葉の匂いが、少し苦い。'
  ], 'ch4.close', null, OF(['yamashina'], '14:40 休憩室 入口'));
  go('ch4.mg_cv_l', [
    ['yamashina', '赤印、付いた。お前の分も。……あのとき、先に言ったのは、お前だったな。', 'normal'],
    ['yamashina', '怒ってない。ただ、借りを返す相手が、増えた。']
  ], 'ch4.close', [rel('yamashina', 0, 1)], OF(['yamashina'], '14:40 休憩室 入口'));
  go('ch4.mg_cv_y', [
    ['yamashina', '「話してくれて、ありがとう」って、桐生助役が。……俺に、だぞ。', 'smile'],
    ['yamashina', 'お前が目を向けてくれなかったら、口が開かなかった。']
  ], 'ch4.close', [rel('yamashina', 1, 1)], OF(['yamashina'], '14:40 休憩室 入口'));
  go('ch4.mg_tg', [
    ['yamashina', '「報告をした二人に」だって。桐生助役。', 'smile'],
    ['yamashina', '袋の置き場、駅の手順になるらしい。俺のミスが、人の役に立つ。変な気分だ。']
  ], 'ch4.mg_tg_b', null, OF(['yamashina'], '14:40 休憩室 入口'));
  branch('ch4.mg_tg_b', [[F('ch4.review_good'), 'ch4.mg_tg_r'], [RG('yamashina', '>=', 4), 'ch4.mg_tg_c']], 'ch4.close');
  go('ch4.mg_tg_r', [['yamashina', '志望書、お前が言った二段落目、書き換えた。駅のお客様の話を入れた。……悪くない。', 'smile']], 'ch4.close', [rel('yamashina', 1, 1)], OF(['yamashina']));
  go('ch4.mg_tg_c', [['yamashina', '……お前と同期で、よかった。言うの、今だけだぞ。', 'smile']], 'ch4.close', [rel('yamashina', 1, 2)], OF(['yamashina']));
  go('ch4.mg_al', [
    ['yamashina', '「報告をした二人に」。俺も、貰った。', 'normal'],
    ['yamashina', 'あのとき先に言ってくれて、ありがとう。まだ完全には思えてない。でも、先に言いたかった。']
  ], 'ch4.close', [rel('yamashina', 1, 1)], OF(['yamashina'], '14:40 休憩室 入口'));

  // 結び：五百円玉の渡し方が、経路で変わる（選択ではなく、積み重ねの結果）
  branch('ch4.close', [[F('ch4.covered_yama'), 'ch4.cl_cv'], [F('ch4.told_alone'), 'ch4.cl_al']], 'ch4.cl_tg');
  go('ch4.cl_cv', [
    '山科は、五百円玉を、机の端に置いた。何も言わずに。',
    '柏餅の代金には、多すぎる。{player}は、釣銭を渡せなかった。',
    '夕焼けが、街路樹を橙に染めていた。'
  ], 'ch4.end', null, OF(['yamashina'], '5月5日（水・祝） 17:30 駅事務室'));
  go('ch4.cl_tg', [
    ['yamashina', '柏餅の礼だ。五百円玉。今度は、間違えてない。', 'smile'],
    '笑って渡された硬貨は、少し温かかった。',
    '夕焼けが、街路樹を橙に染めていた。'
  ], 'ch4.end', null, OF(['yamashina', 'shiraishi'], '5月5日（水・祝） 17:30 駅事務室'));
  go('ch4.cl_al', [
    '山科は、五百円玉を、机の上に置いた。目は、合わなかった。',
    ['yamashina', '今は、これだけ。……来週、話す。', 'normal'],
    '夕焼けが、街路樹を橙に染めていた。手のひらの硬貨は、冷たかった。'
  ], 'ch4.end', null, OF(['yamashina'], '5月5日（水・祝） 17:30 駅事務室'));

  N['ch4.end'] = { id: 'ch4.end', type: 'end', chapter: 'ch4', title: '第4章 同期の距離', nextChapter: 'ch5',
    summary: '山科の取り違えを、庇うか、報告するか。選んだ道は、友情の形と、評価の記録と、基地入門の推薦枠に、それぞれ違う跡を残した。推薦の結果は、五月十四日の締切のあとに出る。',
    effects: [tl('5月5日 ゴールデンウィークを終える'), log('第4章を終了', 'chapter')] };
}
