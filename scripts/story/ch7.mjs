// R7 第7章「夏の臨時列車」（8月第2土曜）。
// 構造：時間に追われる一日。花火の帰りの「波」に向けて、指令・警備・乗務員・売店と情報を持ち寄るタイムライン型。
// 志望ルート（第6章の ch6.wish_*）で中盤が別物：station=3Dハブ／depot=基地の2D／dispatch=指令室の2D／planning=計画の資料室と会議。章末の引継ぎで合流する。
// モチーフ：「手を横に振る」合図（止めて）。駅長・警備・基地・指令・計画のそれぞれの場面で、小さく回収する。
// 後の章へ渡すフラグ：ch7.limited / ch7.flowed（どちらか一方）、ch7.coordinated、ch7.hinata_seed、ch7.route_done_station|depot|dispatch|planning
export default function ch7(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, mini, hub, P, res3, chk } = k;

  characters.tsutsui = characters.tsutsui ?? { id: 'tsutsui', name: '筒井 昭', kana: 'つつい あきら', role: '雑踏警備（警備会社）', dept: 'none', age: 49, years: 22, uniform: '#2d3a4a', hair: '#3a3a3a', skin: '#e3bd96', trait: '短く話す。膝が悪いのを隠している。', bio: '花火や初詣の雑踏警備を二十年以上。人の流れを水の流れのように読む。', gender: 'm', accessory: 'cap' };
  characters.mizuki = characters.mizuki ?? { id: 'mizuki', name: '水城 凪', kana: 'みずき なぎ', role: '乗務員（車掌）', dept: 'crew', age: 31, years: 9, uniform: '#1f3b57', hair: '#2b2118', skin: '#f0cfae', trait: 'ドアを閉める前に、必ずもう一度ホームを見る。非常ベルの音が苦手。', bio: '今夜の臨時快速に乗務する車掌。乗務前に駅のホームを見に来た。', gender: 'f', accessory: 'cap' };
  characters.sawada = characters.sawada ?? { id: 'sawada', name: '沢田 慎一', kana: 'さわだ しんいち', role: '輸送計画課 課長補佐', dept: 'planning', age: 44, years: 20, uniform: '#3a4a5e', hair: '#2a2a2a', skin: '#e8c8a4', trait: '数字で語る。去年の失敗を、まだ引きずっている。', bio: 'ダイヤと需要予測を担当。今夜の案は、去年の反省から作り直した。', gender: 'm', accessory: 'glasses' };

  const bestRoute = (grid, must) => {
    const H = grid.length, W = grid[0].length; let s;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) {
      q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi;
        const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); }
      }
    }
    return 20;
  };
  const OV = (who, cap) => v25('office', who, cap);
  const DV = (who, cap) => v25('depot', who, cap);

  // 章の入口：第6章で選んだ志望ルートで、中盤がまるごと別の体験になる（既定は station）
  branch('ch7.open', [[F('ch6.wish_depot'), 'ch7.d_open'], [F('ch6.wish_dispatch'), 'ch7.x_open'], [F('ch6.wish_planning'), 'ch7.p_open']], 'ch7.s_open', { effects: [{ clock: { addDay: 50, minute: hm(15, 0) } }, log('第7章 夏の臨時列車', 'chapter')] });

  // ================= 【駅ルート】 開幕 =================
  line('ch7.s_open', [
    '事務室の床が、三角コーンとロープと団扇の箱で埋まっている。8月14日、午後三時。',
    ['shiraishi', '去年は二万八千人。今夜は三万と読んでいる。'],
    ['kubota', '駅の定員は、たしか、そのうちの一割です。', 'smile'],
    ['shiraishi', '残りは、気合いだ。…冗談だ。今夜は{player}、君が「つなぎ」だ。'],
    ['player', '持ち場は、どこですか。'],
    ['shiraishi', '持ち場はない。指令、警備、車掌、売店。みんな自分の窓からしか見えん。それを一枚の絵にしろ。'],
    ['shiraishi', '止める合図はこれだ。（右手を、ぱたぱたと横に振る）無線より早い。'],
    ['shiraishi', '休憩は17時半から45分。取らなければ、私が引きずって行く。']
  ], 'ch7.open_focus', { effects: [tl('8月14日 花火大会の臨時列車対応。駅の連絡役として入る')], view: OV(['shiraishi', 'kubota'], '8月14日（土） 15:00 駅事務室') });
  choice('ch7.open_focus', '今夜、いちばん守りたいのは？', [
    opt('info', '確かな情報を、早く回すこと', 'ch7.brief', { tone: 'careful', effects: [set('ch7.focus_info'), ev('accuracy', 1)] }),
    opt('people', 'お客様の不安を、先に減らすこと', 'ch7.brief', { tone: 'caring', effects: [set('ch7.focus_people'), ev('service', 1)] }),
    opt('safety', '危ない芽を、小さいうちに摘むこと', 'ch7.brief', { tone: 'careful', effects: [set('ch7.focus_safety'), ev('safety', 1)] })
  ], { view: OV(['shiraishi', 'kubota']) });
  fx('ch7.brief', [set('ch7.brief'), log('15時、花火大会の対応が始まる', 'work')], 'ch7.hub');

  hub('ch7', {
    title: '青嶺中央駅 花火大会の夜（8月14日・土）',
    hint: '15時から22時15分まで。時刻が進むと波が来て、依頼が同時に増えます。先に連携先（指令・警備・乗務員・売店）を回ると、夜の判断が変わります。',
    timed: [
      { id: 'w1', at: hm(16, 30), goto: 'ch7.w1' }, { id: 'brk', at: hm(17, 30), goto: 'ch7.break' }, { id: 'w2', at: hm(18, 30), goto: 'ch7.w2' },
      { id: 'w3', at: hm(19, 30), goto: 'ch7.w3' }, { id: 'peak', at: hm(20, 40), goto: 'ch7.peak' }, { id: 'close', at: hm(22, 0), when: F('ch7.peak_done'), goto: 'ch7.review' }
    ],
    goals: [
      { id: 'g_dispatch', label: '（連携）指令に、臨時列車の予定を確認する', when: F('ch7.co_dispatch'), optional: true },
      { id: 'g_guard', label: '（連携）警備の筒井さんと、動線を打ち合わせる', when: F('ch7.co_guard'), optional: true },
      { id: 'g_crew', label: '（連携）車掌の水城さんと、ホームの使い方を確認する', when: F('ch7.co_crew'), optional: true, showWhen: T('>=', hm(16, 0)) },
      { id: 'g_shop', label: '（連携）売店の坂井さんと、通路の使い方を決める', when: F('ch7.co_shop'), optional: true },
      { id: 'g_ann', label: '（業務）帰りの波に向けた案内放送の文面を作る', when: F('ch7.ann_done'), optional: true, showWhen: T('>=', hm(18, 30)) },
      { id: 'g_peak', label: '（夜）帰りの波（20:40ごろ）', when: F('ch7.peak_done'), showWhen: T('>=', hm(19, 30)) }
    ],
    exit: { label: '波が引いた。引継ぎへ（21:30以降）', requires: ALL(F('ch7.brief'), F('ch7.peak_done'), T('>=', hm(21, 30))), goto: 'ch7.review' }
  });
  const R = F('ch7.brief'); const HUB = N['ch7.hub'];
  const win = (f, t) => ALL(R, T('>=', hm(...f)), ...(t ? [T('<', hm(...t))] : []));

  mini({ ch: 'ch7', key: 'preview', req: R, who: 'kubota', object: 'tactile', from: [15, 10], to: [17, 10], label: '開場前のホームを点検する', goal: '（業務）混雑前のホーム点検', title: '混雑前のホーム点検', cam: 'follow',
    hint: '人が増える前に、ホームの危険を3か所見つけてタップします。', kind: 'find',
    intro: ['今のうちです。人が来たら、片づけられません。'],
    config: { scene: 'platform', seconds: 38, props: [P(0.05, 0.4, 0.14, 0.2, '#6b7280', 'ベンチ'), P(0.7, 0.35, 0.12, 0.25, '#7a8aa0', '柱'), P(0, 0.62, 1, 0.07, '#e5b800')], spots: [
      { id: 'cart', x: 0.32, y: 0.66, label: '点字ブロックの上の、荷物用カート' }, { id: 'stand', x: 0.58, y: 0.44, label: '階段の降り口に出た置き看板の足' }, { id: 'water', x: 0.84, y: 0.7, label: '給水機の足元の水たまり' }, { id: 'bench', x: 0.12, y: 0.5, real: false, label: 'ベンチは通行の妨げになっていません' }] },
    good: '全部ですか。…今夜、私の仕事が一つ減りました。', mid: '二つ。残りは私が転がします。カートだけに。', bad: 'もう一周します。付き合ってください。', ge: [ev('safety', 3)], be: [ev('safety', -1)], log: '混雑前のホームを点検', min: 15 });
  mini({ ch: 'ch7', key: 'queue', req: R, who: 'yamashina', object: 'gate_wide', from: [16, 30], to: [19, 0], label: '改札前のお客様を振り分ける', goal: '（依頼）早く来た見物客の振り分け', title: '改札前の振り分け', cam: 'gate_back',
    hint: '用件を聞いて、正しい案内先へ仕分けます。', kind: 'sort',
    intro: ['{player}、助けてくれ。俺、一人でも平気だけど、二人のほうが平気だ。'],
    config: { perItem: 6, bins: [{ id: 'express', label: '臨時快速（ホーム階段へ）' }, { id: 'local', label: '普通列車（通常の乗り場）' }, { id: 'wait', label: '改札外で待機・案内' }, { id: 'assist', label: '係員が付き添う' }], items: [
      { id: 'a', label: '「20時50分の臨時快速に乗る。きっぷは持っている」', bin: 'express', why: '臨時快速の利用です。時刻が近づいたら階段へご案内します。' },
      { id: 'b', label: '「花火は関係ない。普通列車で隣の駅へ（通勤）」', bin: 'local', why: '通常の乗り場へ、通常どおりご案内します。' },
      { id: 'c', label: '「家族で今来たところ。花火はまだだよね」', bin: 'wait', why: 'ホームは帰りの時間まで空けます。待機場所を案内します。' },
      { id: 'd', label: '「車いすです。混む前に臨時快速で帰りたい」', bin: 'assist', why: 'エレベーターと係員で、先にご案内します。' },
      { id: 'e', label: '「友だちを待つ。ここで場所を取っておきたい」', bin: 'wait', why: 'ホームや通路での場所取りはできません。' },
      { id: 'f', label: '「祖母が杖で、階段がつらい」', bin: 'assist', why: '階段の代わりに、エレベーターへお連れします。' }] },
    good: '迷わなかったな。…今の、ちょっとかっこよかったぞ。俺の次に。', mid: '数件ずれた。付き添いの人を先に探せ。', bad: 'まあ、俺も最初はこうだった。…嘘だ、もうちょっとマシだった。', ge: [ev('service', 3), ev('teamwork', 1), sk('ops', 2)], log: '改札前のお客様を振り分け', min: 20 });
  mini({ ch: 'ch7', key: 'wheel', req: R, who: 'kubota', object: 'elevator', from: [18, 30], to: [19, 25], label: '配慮が必要な方の待機動線を組む', goal: '（依頼）配慮が必要な方の動線', title: '配慮が必要な方の動線', cam: 'follow',
    hint: '起点から着点まで、階段（黒）を避け、警備員の立つ地点（K）を通る道をつなぎます。しま模様は混雑で遅い道です。', kind: 'route',
    intro: ['波の中で一緒に動くと危ない。先に、静かな場所へ。'],
    config: { grid: ['S...#...G', '.##.#.##.', '..K...~..', '.#####.#.', '.........'], must: ['K'], best: bestRoute(['S...#...G', '.##.#.##.', '..K...~..', '.#####.#.', '.........'], ['K']), legend: { '#': '階段・壁（通れない）', '~': '混雑した通路（遅い）', K: '警備員の立ち位置（立ち寄る）', S: '起点', G: '待機場所' } },
    good: 'いい道です。…お客様、ほっとした顔をされていました。', mid: '着けました。ただ、遠回りの分、お子さんが眠そうです。', bad: '警備さんの前を通らないと、合図が届きません。', ge: [ev('safety', 2), ev('service', 3)], log: '配慮が必要な方の待機動線を組む', min: 15 });
  mini({ ch: 'ch7', key: 'platwatch', req: R, who: 'yamashina', object: 'emergency_btn', from: [18, 35], to: [19, 25], label: '混み始めたホームを見守る', goal: '（依頼）ホームの見守り', title: '混み始めたホームの見守り', cam: 'follow',
    hint: '黄色い線に近づく人をタップして声をかけます。立ち止まる人は見守るだけです。', kind: 'watch', config: { total: 12 },
    intro: ['下駄の音がやばい。滑るぞ。写真を撮りながら歩く人もだ。'],
    good: '全員に届いた。…俺の声より、{player}の声のほうが通るの、悔しいな。', mid: '二、三人、線を越えた。視線をもっと遠くに。', bad: '怖かったな、今の。波の前に練習できてよかった、と思うことにする。', ge: [ev('safety', 4), sk('patrol', 3)], be: [ev('safety', -3)], log: '混み始めたホームを見守り', min: 20 });

  // ---- 連携：指令（電話・記憶課題）----
  HUB.interactions.push({ id: 'c_dispatch', object: 'phone', label: '指令直通電話で、臨時列車の予定を確認する', goto: 'ch7.cd_1', requires: win([15, 5]), hideWhen: F('ch7.co_dispatch'), icon: '☎' });
  line('ch7.cd_1', [
    ['hamaguchi', '指令、浜口。臨時の件ね。確定から行く。'],
    ['hamaguchi', '20時50分、21時02分、21時14分。2番線。ここまで確定。'],
    ['hamaguchi', 'ここから見込み。花火が押せば一本目が数分遅れる。確定じゃない。放送でも分けて言って。'],
    ['hamaguchi', '駅が詰まっても、こっちからは見えない。「ホーム満員」と数字をくれれば、停車を延ばせる。決められる範囲は、ここまで。'],
    ['player', '復唱します。確認のため、時刻をもう一度お願いします。'],
    ['hamaguchi', '聞き返せる人は、信用できる。一回だけ言うよ。メモなし。']
  ], 'ch7.cd_task', { view: OV(['hamaguchi'], '指令直通電話') });
  N['ch7.cd_task'] = { id: 'ch7.cd_task', type: 'task', kind: 'memory', title: '臨時快速の時刻を復唱', intro: '示された順に覚え、同じ順に入力します（見返しはできません）。',
    config: { sequence: ['2番線', '20:50', '21:02', '21:14'], pool: ['1番線', '2番線', '20:15', '20:50', '21:02', '21:14', '21:20', '21:30'], showMs: 4500, showLabel: '臨時快速の予定（確定）' },
    results: res3('ch7.cd_good', 'ch7.cd_mid', 'ch7.cd_bad', [ev('accuracy', 3), set('ch7.dispatch_exact')], [ev('accuracy', 1)], [ev('accuracy', -1)]), view: v3('npc:hamaguchi', '指令直通電話') };
  line('ch7.cd_good', [['hamaguchi', '完璧。今夜、10分おきに数字をください。待ってる。', 'smile']], 'ch7.cd_end', { effects: [rel('hamaguchi', 2, 2)], view: OV(['hamaguchi']) });
  line('ch7.cd_mid', [['hamaguchi', '21時02分の次が14分。…まあ、聞き直せる分、合格。']], 'ch7.cd_end', { effects: [rel('hamaguchi', 1, 1)], view: OV(['hamaguchi']) });
  line('ch7.cd_bad', [['hamaguchi', '入れ替わってる。本番でやると、お客様が別のホームへ走る。一度切る。かけ直して。', 'serious']], 'ch7.cd_retry', { view: OV(['hamaguchi']) });
  fx('ch7.cd_retry', [time(10), log('指令への確認をやり直すことにした', 'work')], 'ch7.hub');
  fx('ch7.cd_end', [set('ch7.co_dispatch'), time(10), rel('hamaguchi', 1, 1), tl('8月14日 指令と、臨時列車の予定・連絡方法を共有した'), log('指令と情報を共有', 'work')], 'ch7.hub');

  // ---- 連携：警備（重要選択）----
  HUB.interactions.push({ id: 'c_guard', object: 'gate_wide', label: '警備の筒井さんと、動線を打ち合わせる', goto: 'ch7.cg_1', requires: win([15, 20]), hideWhen: F('ch7.co_guard'), icon: '🦺' });
  line('ch7.cg_1', [
    '駅前広場。反射ベストの男性が、アスファルトに白いテープを貼っている。左膝を、かばう歩き方。',
    ['tsutsui', '警備の筒井。連絡役？ …若いな。'],
    ['tsutsui', '十人出す。外に八人。遊軍が二人。置き場は、駅が決めろ。'],
    ['player', '膝、大丈夫ですか。'],
    ['tsutsui', '…気のせいだ。話を戻す。人は「止められる」と、後ろから押される。止める前に、下がる場所を作れ。'],
    ['tsutsui', '止めてほしい時は、手を横に振れ。（ぱたぱた）笛より静かだ。']
  ], 'ch7.cg_choice', { view: OV(['tsutsui'], '駅前広場 警備の打合せ') });
  choice('ch7.cg_choice', '遊軍の二人を、どこに置いてもらう？', [
    opt('stairs', '構内のホーム階段の下（階段の渋滞を防ぐ）', 'ch7.cg_stairs', { tone: 'careful', effects: [set('ch7.guard_stairs')], hint: '階段の下は厚くなる。広場は薄くなる' }),
    opt('plaza', '駅前広場（外で待つ人の安全と熱中症対策）', 'ch7.cg_plaza', { tone: 'caring', effects: [set('ch7.guard_plaza')], hint: '広場は厚くなる。階段の下は駅員だけで支える' })
  ], { important: true, view: OV(['tsutsui']) });
  line('ch7.cg_stairs', [['tsutsui', '階段か。広場は薄くなる。待たせた客は、駅の責任だぞ。'], ['tsutsui', '…合図は同じでいい。上が詰まったら、手を横に。']], 'ch7.cg_end', { view: OV(['tsutsui']) });
  line('ch7.cg_plaza', [['tsutsui', '広場か。蒸し暑い夜は、外のほうが倒れる。分かってるじゃないか。'], ['tsutsui', '階段は駅で持て。合図は同じだ。']], 'ch7.cg_end', { view: OV(['tsutsui']) });
  fx('ch7.cg_end', [set('ch7.co_guard'), time(15), rel('shiraishi', 1, 1), ev('teamwork', 2), tl('8月14日 警備と、人の流れと合図を共有した'), log('警備と動線を打合せ', 'work')], 'ch7.hub');

  // ---- 連携：乗務員 ----
  HUB.interactions.push({ id: 'c_crew', object: 'emergency_btn', label: '乗務前の車掌・水城さんと、ホームを確認する', goto: 'ch7.cc_1', requires: win([16, 0]), hideWhen: F('ch7.co_crew'), icon: '🚃' });
  line('ch7.cc_1', [
    'ホームの端で、車掌が耳を片方ふさいで立っていた。構内の非常ベルの試験音だ。',
    ['mizuki', '水城です。…あの音、いつまでも慣れなくて。'],
    ['mizuki', '二つ、気になります。真ん中の車両だけが満員になる。ドア扱いが、60秒でも足りなくなる。'],
    ['player', '何があれば、人は動きますか。'],
    ['mizuki', '「後ろが空いています」。車内とホームで、同じ一文を。人は二度聞くと信じます。']
  ], 'ch7.cc_choice', { view: OV(['mizuki'], '2番線ホーム 乗務前の確認') });
  choice('ch7.cc_choice', '乗務員と、どう言葉を合わせる？', [
    opt('rear', '「後ろの車両が空いています。奥までお進みください」を駅と車内でそろえる', 'ch7.cc_rear', { tone: 'caring', effects: [set('ch7.crew_announce')] }),
    opt('lead', '階段に近い車両は降車優先にして、後ろへ誘導する運用を指令へ提案する', 'ch7.cc_lead', { tone: 'risky', effects: [set('ch7.crew_ops')] }),
    opt('leave', '車内のことは、乗務員さんにお任せする', 'ch7.cc_leave', { tone: 'quick' })
  ], { view: OV(['mizuki']) });
  line('ch7.cc_rear', [['mizuki', '決まり。同じ一文を、二回。…ありがとう。', 'smile']], 'ch7.cc_end', { effects: [rel('mizuki', 2, 2)], view: OV(['mizuki']) });
  line('ch7.cc_lead', [['mizuki', '運用は私の一存では決められません。指令へ上げて。決まれば従います。']], 'ch7.cc_end', { effects: [rel('mizuki', 1, 1), ev('accuracy', 1)], view: OV(['mizuki']) });
  line('ch7.cc_leave', [['mizuki', '分かりました。…ただ、車内と駅の言葉がずれると、お客様はどちらも信じなくなります。']], 'ch7.cc_end', { view: OV(['mizuki']) });
  fx('ch7.cc_end', [set('ch7.co_crew'), time(15), tl('8月14日 乗務員と、ホームの使い方と放送の言葉をそろえた'), log('車掌と打合せ', 'work')], 'ch7.hub');

  // ---- 連携：売店（重要選択）----
  HUB.interactions.push({ id: 'c_shop', object: 'sakai', label: '売店の坂井さんと、通路と飲み物を相談する', goto: 'ch7.cs_1', requires: win([15, 15]), hideWhen: F('ch7.co_shop'), icon: '🛍' });
  line('ch7.cs_1', [
    ['sakai', '氷が、飛ぶように売れてるのよ。見て、この袋の重さ。', 'smile'],
    ['sakai', '今月、赤字すれすれでね。今夜が勝負なの。でも去年、ワゴンで通路を詰まらせて、怒られた。'],
    ['player', '今年はどうされますか。'],
    ['sakai', 'うちにできるのは一つだけ。20時にワゴンを引っ込めて通路を空けるか、凍らせた水を帰りの列に配るか。人手は私一人。']
  ], 'ch7.cs_choice', { view: OV(['sakai'], '売店前') });
  choice('ch7.cs_choice', '坂井さんに、どちらをお願いする？', [
    opt('clear', '20時にワゴンを引っ込め、通路を空けてもらう', 'ch7.cs_clear', { tone: 'careful', effects: [set('ch7.shop_clear')], hint: '通路は広がる。待つ人に水は配れない' }),
    opt('water', '帰りの列に、冷やした水を配ってもらう', 'ch7.cs_water', { tone: 'caring', effects: [set('ch7.shop_water')], hint: '待つ人を助けられる。通路は狭いまま' })
  ], { important: true, view: OV(['sakai']) });
  line('ch7.cs_clear', [['sakai', '了解。ワゴンも、ゴミ箱も、全部中へ。…売り損ねる氷の分は、見ないふりする。']], 'ch7.cs_end', { view: OV(['sakai']) });
  line('ch7.cs_water', [['sakai', '任せて。代金は私持ち。店長には「駅の宣伝」って言うわ。', 'smile'], ['sakai', '通路は狭いままよ。そこは、駅の人が上手にさばいて。']], 'ch7.cs_end', { view: OV(['sakai']) });
  fx('ch7.cs_end', [set('ch7.co_shop'), time(10), rel('sakai', 1, 2), ev('teamwork', 1), tl('8月14日 売店と、通路と飲み物の置き場を相談した'), log('売店と打合せ', 'work')], 'ch7.hub');

  // ---- 第1波・休憩 ----
  line('ch7.w1', [
    '16時30分。下駄の音が、ホームの床を叩きはじめた。',
    ['shiraishi', '（無線）第一波。早い連中だ。まだ余裕がある。今のうちに手を打て。'],
    ['yamashina', '（無線）改札前、俺一人だ。手が空いたら来い。…急がなくていいぞ。急げ。']
  ], 'ch7.w1_r', { effects: [log('16時30分 第一波。見物客の入場が始まる', 'work')], view: v3('concourse', '16:30 コンコース') });
  branch('ch7.w1_r', [[F('route.service'), 'ch7.w1_rs'], [F('route.platform'), 'ch7.w1_rp'], [F('route.office'), 'ch7.w1_ro']], 'ch7.hub');
  line('ch7.w1_rs', [['kubota', '窓口の目が役に立つ夜です。顔色を、階段でも読んでください。']], 'ch7.hub', { view: v3('concourse', '16:35 コンコース') });
  line('ch7.w1_rp', [['yamashina', '春からホームは二人でやってきた。今夜は、お前が全体、俺が足元だ。']], 'ch7.hub', { view: v3('platform', '16:35 ホーム') });
  line('ch7.w1_ro', [['kubota', '事務の目で、人数と時刻を数字で記録してください。あとで効きます。']], 'ch7.hub', { view: v3('concourse', '16:35 コンコース') });

  const LV = who => v25('hr', who, '17:30 休憩室');
  line('ch7.break', [
    '17時30分。休憩室で、麦茶の氷が、からん、と鳴った。',
    ['kubota', '休憩です。45分。無線は私が預かります。', 'smile'],
    ['kubota', '仕事の話は禁止。破ったら、私が弁当を食べます。']
  ], 'ch7.break_choice', { effects: [log('17時30分 休憩（45分）に入る', 'work')], view: LV(['kubota']) });
  choice('ch7.break_choice', '45分を、どう過ごす？', [
    opt('kubota', '久保田さんの、去年の花火の話を聞く', 'ch7.brk_k', { tone: 'caring', effects: [set('ch7.brk_kubota'), rel('kubota', 1, 2)] }),
    opt('yamashina', '山科さんと、ホームの話をする', 'ch7.brk_y', { tone: 'caring', effects: [set('ch7.brk_yamashina'), rel('yamashina', 1, 2)] }),
    opt('rest', '何も考えずに目を閉じる', 'ch7.brk_r', { tone: 'careful', effects: [set('ch7.rested'), ev('safety', 1)] })
  ], { view: LV(['kubota', 'yamashina']) });
  line('ch7.brk_k', [
    ['kubota', '去年、迷子の男の子の帯を、三回結び直しました。'],
    ['kubota', '一回目はきつすぎて「痛い」。二回目はゆるすぎて解けた。'],
    ['player', '三回目は？'],
    ['kubota', '成功しました。お母さんが見つかった瞬間、私の足が震えて。…これは内緒です。'],
    ['kubota', '緊張しっぱなしだと、肝心なところで動けない。だから休む。麦茶、おかわりどうぞ。', 'smile']
  ], 'ch7.brk_end', { view: LV(['kubota']) });
  line('ch7.brk_y', [
    ['yamashina', '弁当、半分くれ。…クリッカーで階段の人数を数えてるんだけどさ。'],
    ['yamashina', 'カチカチ押してると、数字が面白くなる。でも、数字になった瞬間、顔が見えなくなる人がいる。'],
    ['player', '足を引きずってた人とか。'],
    ['yamashina', '…お前も見てたのか。悔しいな。困ったら呼べ。遠慮したら怒る。', 'smile']
  ], 'ch7.brk_end', { effects: [set('ch2.yama_help')], view: LV(['yamashina']) });
  line('ch7.brk_r', [
    '壁にもたれて目を閉じる。氷が溶ける音。遠くの太鼓。',
    ['kubota', '（小声で）30分過ぎました。もう少し、どうぞ。'],
    '目を開けると、頭の中の砂が、すっかり沈んでいた。'
  ], 'ch7.brk_end', { view: LV(['kubota']) });
  fx('ch7.brk_end', [time(45), set('ch7.break_taken'), log('休憩を取った（45分）', 'work')], 'ch7.hub');

  // ---- 第2波：同時に複数の依頼 ----
  line('ch7.w2', [
    '18時30分。無線が、同時に三本鳴った。',
    ['kubota', '（無線）配慮が必要な方の動線を。19時25分まで。'],
    ['yamashina', '（無線）ホームの見守り、手が足りない。'],
    ['shiraishi', '（無線）放送文が未決だ。19時40分までに固めろ。全部は無理だ。選べ。選ばなかったものは、誰かに頼め。']
  ], 'ch7.hub', { effects: [log('18時30分 第二波。同時に複数の依頼が発生', 'work')], view: v3('platform', '18:30 ホーム') });

  HUB.interactions.push({ id: 'ann', object: 'mic', label: '帰りの波に向けた案内放送の文面を作る', goto: 'ch7.ann_1', requires: win([18, 30], [20, 0]), hideWhen: F('ch7.ann_done'), icon: '📢' });
  line('ch7.ann_1', [
    ['kubota', '放送文をお願いします。押す前が勝負です。'],
    ['kubota', '「走らないで」だけでは、人は動きません。どこへ、どうするか。'],
    ['shiraishi', '書いたら声に出せ。口が詰まる文は、耳にも詰まる。']
  ], 'ch7.ann_task', { view: OV(['kubota', 'shiraishi'], '放送室 文面づくり') });
  N['ch7.ann_task'] = { id: 'ch7.ann_task', type: 'task', kind: 'compose', title: '帰りの波に向けた案内放送', intro: '四つの要素から、適切な文を一つずつ選びます。',
    slots: [
      { id: 'fact', label: '運行の事実と見込み', options: [{ id: 'f1', text: '本日は花火大会のため、20時50分から2番線で臨時快速を3本運転します。ご利用が集中し、改札内への入場をお待ちいただく場合があります。', good: true, why: '確定した事実と、見込みが分けられています。' }, { id: 'f2', text: '臨時列車は、すべて時刻どおりに出ます。ご安心ください。', good: false, why: '断定は危険です。遅れたとき、信用を失います。' }, { id: 'f3', text: '本日は大変混雑します。', good: false, why: '具体的な情報がなく、行動につながりません。' }] },
      { id: 'ask', label: '行動のお願い', options: [{ id: 'a1', text: 'ホームでは、後ろの車両のほうが空いています。奥までお進みください。階段では立ち止まらないでください。', good: true, why: '何を、どこへ、どうするかが具体的です。' }, { id: 'a2', text: '走らないでください。', good: false, why: '禁止だけで、代わりにどうするかが分かりません。' }, { id: 'a3', text: '早く乗ってください。', good: false, why: '急がせる言い方は、押し合いのもとです。' }] },
      { id: 'care', label: '配慮が必要な方へ', options: [{ id: 'c1', text: 'お子さま連れ、車いすの方は、係員がご案内します。お近くの係員にお声がけください。', good: true, why: '声をかけやすい手段を示しています。' }, { id: 'c2', text: '係員は忙しいので、各自でご判断ください。', good: false, why: '助けを求める人を突き放します。' }, { id: 'c3', text: '特に配慮は必要ありません。', good: false, why: '必要な人を見落とします。' }] },
      { id: 'close', label: '締めの言葉', options: [{ id: 'e1', text: 'ご迷惑をおかけしますが、係員の誘導にご協力をお願いします。最新の運行状況は、駅の表示と放送でお知らせします。', good: true, why: 'お願いの形で、情報の入手先も示しています。' }, { id: 'e2', text: '指示に従わない方は、乗車をお断りします。', good: false, why: '威圧は、かえって混乱を招きます。' }, { id: 'e3', text: '以上です。', good: false, why: '次に何を見ればよいか分かりません。' }] }
    ],
    results: [{ min: 66, goto: 'ch7.ann_good', effects: [ev('service', 3), ev('accuracy', 2), set('ch7.ann_good')] }, { min: 34, goto: 'ch7.ann_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch7.ann_bad', effects: [ev('accuracy', -1)] }], view: OV(['kubota']) };
  line('ch7.ann_good', [['kubota', '声に出しても、舌が転びませんでした。…私の放送より上手いのが、悔しいです。', 'smile'], ['shiraishi', '録音しろ。再生は私が許可する。']], 'ch7.ann_end', { effects: [rel('kubota', 1, 1)], view: OV(['kubota', 'shiraishi']) });
  line('ch7.ann_mid', [['kubota', '「どこへ」が抜けています。直しましょう。一緒に。']], 'ch7.ann_end', { view: OV(['kubota']) });
  line('ch7.ann_bad', [['kubota', '少し、怒って聞こえます。疲れたお客様は、声の温度に敏感です。やり直しましょう。', 'serious']], 'ch7.ann_end', { view: OV(['kubota']) });
  fx('ch7.ann_end', [set('ch7.ann_done'), time(15), log('帰りの波に向けた案内放送を準備', 'work')], 'ch7.hub');

  // ---- 第3波：花火の始まり＝束の間の静けさ ----
  line('ch7.w3', [
    '19時30分。空気が割れる音。ホームの屋根の隙間が、赤く染まった。',
    ['yamashina', '（無線）始まった。ホームの端から、ちょっとだけ見える。…ちょっとだけ。'],
    ['hamaguchi', '（無線）終了予定20時45分。一本目は現時点で定刻見込み。確定ではない。'],
    ['shiraishi', '（無線）この75分は休みじゃない。波の準備の時間だ。']
  ], 'ch7.hub', { effects: [log('19時30分 花火大会が始まる。帰りの波の準備時間', 'work')], view: v3('platform_high', '19:30 花火の音のなかのホーム') });
  HUB.interactions.push({ id: 'hinata', object: 'hinata', label: '改札の外から空を見上げている女の子に気づく', goto: 'ch7.hi_1', requires: win([19, 30], [20, 30]), once: true, icon: '🎆' });
  line('ch7.hi_1', [
    '改札の外。浴衣の女の子が、団扇を持って、空の赤い光のほうを向いている。',
    ['player', 'ここからだと、少ししか見えないよ。'],
    ['hinata', 'しってる。おかあさんが、ここでまってて、って。はぐれるから。'],
    ['hinata', 'えきいんさんは、花火、見ないの？'],
    ['player', '見たいよ。でも今日は、帰る人の道を守る日なんだ。'],
    ['hinata', 'ふうん。…わたし、ひなた。あきに、クラスでけんがくに来るから！', 'smile'],
    '団扇の裏に、油性ペンで「ひなた」。母親の呼ぶ声に、女の子は人混みへ消えた。'
  ], 'ch7.hi_end', { view: OV(['hinata'], '19:45 改札の外') });
  fx('ch7.hi_end', [set('ch7.hinata_seed'), rel('hinata', 1, 2), time(10), tl('8月14日 花火の夜、ひなたと出会う。「秋に駅へ見学に来る」と聞く'), log('改札の外の女の子と話した', 'work')], 'ch7.hub');

  HUB.interactions.push({ id: 'prep', object: 'roster_board', label: '帰りの波の最終確認をする', goto: 'ch7.prep_1', requires: win([19, 30], [20, 40]), hideWhen: F('ch7.prep_done'), icon: '✅' });
  line('ch7.prep_1', [['kubota', '最後の確認です。「省いていいかも」と思った項目ほど、あとで効きます。']], 'ch7.prep_task', { view: OV(['kubota'], '駅事務室 ホワイトボード') });
  chk('ch7.prep_task', '帰りの波の最終確認', '各項目が、適切か不適切かを判断してください。', [
    { id: 'a', label: 'ホーム階段の下に人数を数える係員を置き、10分おきに指令へ数字で伝える', truth: 'ok', why: '数字なら、指令が後続列車を判断できます。' },
    { id: 'b', label: '録音の放送を流し続けるので、係員は階段から引き上げる', truth: 'ng', why: '録音だけでは、状況の変化に対応できません。' },
    { id: 'c', label: '「ホーム満員」の連絡文言を、係員全員で共有した', truth: 'ok', why: '誰が言っても同じ言葉で伝わります。' },
    { id: 'd', label: '売店前のワゴンが通路に出たままだが、夜まで放置する', truth: 'ng', why: '波の前に、通路を空けておきます。' },
    { id: 'e', label: '改札外の列の折り返し位置を、警備員と無線で確認した', truth: 'ok', why: '駅と警備が同じ絵を見ていれば、同じ形で動けます。' },
    { id: 'f', label: '持ち場を離れる係員は、後任に口頭で引き継ぐ', truth: 'ok', why: '引継ぎの抜けは、見えない穴になります。' },
    { id: 'g', label: '疲れているので、非常停止ボタンの位置の確認は省略する', truth: 'ng', why: '非常時にすぐ押せるよう、位置は全員が把握します。' }
  ], res3('ch7.prep_good', 'ch7.prep_mid', 'ch7.prep_bad', [ev('accuracy', 3), ev('safety', 2), set('ch7.prep_ok')], [ev('accuracy', 1)], [ev('safety', -2)]), ['適切', '不適切']);
  line('ch7.prep_good', [['kubota', '抜けなし。…肩の荷が、半分になりました。', 'smile']], 'ch7.prep_end', { view: OV(['kubota']) });
  line('ch7.prep_mid', [['kubota', '惜しい。一、二か所、私が拾っておきます。']], 'ch7.prep_end', { view: OV(['kubota']) });
  line('ch7.prep_bad', [['kubota', '「省いた」ところが、一番大事でした。今から一緒に直します。時間はあります。', 'serious']], 'ch7.prep_end', { view: OV(['kubota']) });
  fx('ch7.prep_end', [set('ch7.prep_done'), time(15), log('帰りの波の最終確認', 'work')], 'ch7.hub');

  // ---- 第4波：限界の判断 ----
  line('ch7.peak', [
    '20時40分。最後の大輪。拍手のようなざわめきが、波になって近づいてくる。',
    ['kubota', '（無線）ホーム階段の上、詰まり始めました。'],
    ['hamaguchi', '（無線）一本目、定刻見込み。二本目は二分遅れ見込み。確定じゃない。'],
    ['yamashina', '（無線）階段で、子どもが泣いてる。前に進めない人が出てる。'],
    ['shiraishi', '（無線）{player}。答えは短く。駅の方針を、一つ。', 'serious']
  ], 'ch7.peak_choice', { effects: [log('20時40分 帰りの波。限界の判断を迫られる', 'work')], view: v3('platform_high', '20:40 ホーム階段') });
  choice('ch7.peak_choice', '階段の上が詰まりはじめた。どう判断する？', [
    opt('limit', '入場規制をかける。階段の手前で止め、安全を優先する', 'ch7.lim_1', { tone: 'careful', effects: [set('ch7.limited')], hint: '押し合いは防げる。外で待つ人の時間と不満は増える' }),
    opt('flowed', '規制はせず、放送と声かけで流れを保つ', 'ch7.flo_1', { tone: 'risky', effects: [set('ch7.flowed')], hint: '電車には乗りやすい。ホームの密度が上がり、一歩間違えると危ない' })
  ], { important: true, timeLimit: 45, defaultOption: 'limit', view: v3('platform_high', '20:40 ホーム階段') });

  const echo = (id, next) => {
    branch(id, [[F('ch7.ann_good'), id + '_y']], id + '_n');
    line(id + '_y', [['kubota', '（無線）放送、効いてます。「奥まで」の一言で、階段が動く。', 'smile']], next, { view: v3('platform', '20:45 ホーム') });
    line(id + '_n', [['kubota', '（無線）放送が届いてません。声かけで補います。']], next, { view: v3('platform', '20:45 ホーム') });
  };

  // 入場規制
  line('ch7.lim_1', [
    ['player', '指令へ、青嶺中央。ホーム階段の混雑のため、入場規制を開始します。'],
    ['hamaguchi', '了解。開始時刻、記録。案内は確定と見込みを分けて。', 'serious'],
    ['kubota', '（無線）ロープ張ります。階段の手前で止めます。'],
    ['tsutsui', '（無線）広場、了解。止める前に、下がる場所を作る。']
  ], 'ch7.lim_b', { view: v3('gate_back', '20:42 改札前') });
  branch('ch7.lim_b', [[ALL(F('ch7.co_dispatch'), F('ch7.co_guard')), 'ch7.lim_good']], 'ch7.lim_rough');
  line('ch7.lim_good', [
    ['hamaguchi', '連絡文言、事前にもらってたから速い。停車、30秒延ばす。'],
    ['tsutsui', '（無線）手を横に振る合図、全員に通した。下で止める。押させない。'],
    ['shiraishi', '（無線）…いい判断だ。文言を先に決めていたからだ。'],
    '規制の列が、駅前広場へ折り返していく。疲れた顔。それでも、怒鳴る人はいない。'
  ], 'ch7.lim_wait', { effects: [ev('safety', 3), ev('teamwork', 2)], view: v3('gate_back', '20:45 改札前') });
  line('ch7.lim_rough', [
    ['kubota', '（無線）広場側と合図が噛み合ってません。ロープがずれて、列の端が逆に狭い。'],
    ['hamaguchi', '数字がない。列車を調整できない。もう一度、数字で。', 'serious'],
    ['shiraishi', '（無線）共有が足りなかった。だが止めたこと自体は、間違いじゃない。広場の端を見に行け。'],
    '列の外側で、押し合いのざわめき。小さな悲鳴が一つ。'
  ], 'ch7.lim_wait', { effects: [ev('safety', 1), ev('teamwork', -1)], view: v3('gate_back', '20:45 改札前') });
  branch('ch7.lim_wait', [[F('ch7.shop_water'), 'ch7.lim_w_water']], 'ch7.lim_w_dry');
  line('ch7.lim_w_water', [
    ['sakai', '駅員さん、広場に水、配ってるわよ。凍らせたやつ。みんな、ありがとうって。', 'smile'],
    '止められた列に、冷たいペットボトルが回る。「待つのは嫌だけど、これなら」。'
  ], 'ch7.lim_ogawa', { effects: [ev('service', 2), rel('sakai', 1, 1)], view: v3('concourse', '20:50 駅前広場') });
  line('ch7.lim_w_dry', [
    ['kubota', '（無線）広場で、気分の悪い方が。日陰へ移動してます。水が足りません。'],
    ['sakai', '…ごめんなさい。私が配れていれば。売店、もう閉めちゃった。', 'worry'],
    '規制は、一つの安全を守る。同時に、別の安全を、少しずつ削る。'
  ], 'ch7.lim_ogawa', { effects: [ev('safety', -1), ev('service', -1)], view: v3('concourse', '20:50 駅前広場') });
  line('ch7.lim_ogawa', [
    '列の先頭近く。スーツ姿の男性が、ロープを握りしめている。',
    ['ogawa', 'いつまで待たせる。娘が、ホームにいるんだ。電話に出ない。', 'serious'],
    ['ogawa', '先に帰らせたのは、私だ。']
  ], 'ch7.lim_reply', { view: OV(['ogawa'], '20:52 改札前') });
  choice('ch7.lim_reply', 'お客様に、どう答える？', [
    opt('empathy', 'ご心配を受け止め、娘さんの確認と見込みを伝える（「確定ではありませんが」）', 'ch7.lim_r_e', { tone: 'caring', effects: [ev('service', 2)] }),
    opt('rule', '安全のため、規制中は例外なく待ってもらうと説明する', 'ch7.lim_r_r', { tone: 'careful' }),
    opt('hurry', '「次の電車に間に合わせます」と言い切る', 'ch7.lim_r_h', { tone: 'risky' })
  ], { view: OV(['ogawa']) });
  line('ch7.lim_r_e', [
    ['player', 'お嬢さんの特徴を教えてください。ホームの係員に確認させます。規制は10分前後の見込みです。確定ではありません。'],
    ['ogawa', '…青いワンピース。ホームの端のベンチだ。'],
    ['kubota', '（無線）青いワンピース、ベンチに座っています。無事です。'],
    ['ogawa', '…怒鳴って、悪かった。', 'smile']
  ], 'ch7.lim_task', { effects: [rel('kubota', 1, 1), set('ch7.ogawa_calmed')], view: OV(['ogawa']) });
  line('ch7.lim_r_r', [
    ['player', '安全のため、規制中は、どなたも例外なくお待ちいただいています。'],
    ['ogawa', '決まり、決まりって。私が聞いてるのは娘のことだ。'],
    ['kubota', '（割り込んで）お嬢さんは、どちらに。私が確認します。', 'serious'],
    '決まりは正しい。でも、相手の不安には、何も渡せなかった。'
  ], 'ch7.lim_task', { effects: [ev('service', -1)], view: OV(['ogawa']) });
  line('ch7.lim_r_h', [
    ['player', '次の電車には、必ず間に合わせます。'],
    ['ogawa', '本当だな。信じるぞ。'],
    ['hamaguchi', '（無線）二本目、二分遅れ見込み。間に合うかは確定できない。'],
    '言い切った言葉が、胸にのしかかる。「確定ではありません」が、なぜ必要か、体で分かった。'
  ], 'ch7.lim_task', { effects: [ev('accuracy', -2), ev('service', -1)], view: OV(['ogawa']) });
  N['ch7.lim_task'] = { id: 'ch7.lim_task', type: 'task', kind: 'route', title: '規制の列の折り返し経路', intro: '起点から着点まで、日陰（W）と警備員の合図点（K）の二か所を通る経路をつなぎます。壁・柵（黒）は通れません。',
    config: { grid: ['S....#...', '.###.#.#.', '.#W..K.#G', '.#.###.#.', '...~...~.'], must: ['W', 'K'], best: bestRoute(['S....#...', '.###.#.#.', '.#W..K.#G', '.#.###.#.', '...~...~.'], ['W', 'K']), legend: { '#': '壁・柵（通れない）', '~': '人が滞留する通路（遅い）', W: '日陰・給水所', K: '合図点（警備員）', S: '列の最後尾', G: 'ホーム階段' } },
    results: res3('ch7.lim_r_good', 'ch7.lim_r_mid', 'ch7.lim_r_bad', [ev('safety', 3), ev('service', 2)], [ev('safety', 1)], [ev('safety', -2)]), view: v3('concourse', '20:55 規制の列') };
  line('ch7.lim_r_good', [['tsutsui', '（無線）日陰を通って、合図点で止まる。倒れにくい列だ。…膝が、少し楽になった。', 'smile']], 'ch7.lim_fin', { view: v3('concourse', '21:00 規制の列') });
  line('ch7.lim_r_mid', [['tsutsui', '（無線）日陰を通らない区間がある。そこは俺が歩く。']], 'ch7.lim_fin', { view: v3('concourse', '21:00 規制の列') });
  line('ch7.lim_r_bad', [['tsutsui', '（無線）合図点を通らないと、後ろに合図が届かない。組み直す。少し待たせる。', 'serious']], 'ch7.lim_fin', { view: v3('concourse', '21:00 規制の列') });
  echo('ch7.lim_fin', 'ch7.lim_end');
  line('ch7.lim_end', [
    ['hamaguchi', '（無線）一本目、1分遅れで発車。階段の渋滞、解消。規制を段階的に解除して。', 'smile'],
    ['shiraishi', '（無線）一気に外すな。止めるのも、外すのも、同じ丁寧さで。'],
    '空席の目立つ臨時快速が、ホームを離れていく。安全と引き換えに、少し遠回りをした夜。'
  ], 'ch7.peak_end', { effects: [tl('8月14日 帰りの波で入場規制を選んだ'), log('入場規制で、波をしのぐ', 'work')], view: v3('platform', '21:05 ホーム') });

  // 流れを止めない誘導
  line('ch7.flo_1', [
    ['player', '指令へ、青嶺中央。規制はせず、誘導で流します。階段は八割。乗降時間の延長を、要請するかもしれません。'],
    ['hamaguchi', '了解。一本目なら30秒まで延ばせる。', 'serious'],
    ['kubota', '（無線）「奥までお進みください」を、とにかく繰り返します。'],
    ['yamashina', '（無線）足を止めさせない。走らせもしない。…難しいな、これ。']
  ], 'ch7.flo_b', { view: v3('platform_high', '20:42 ホーム階段') });
  branch('ch7.flo_b', [[ALL(F('ch7.co_guard'), F('ch7.co_crew')), 'ch7.flo_good']], 'ch7.flo_rough');
  line('ch7.flo_good', [
    ['mizuki', '（車内放送がホームへ漏れる）後ろの車両が空いています。奥までお進みください。', 'smile'],
    ['tsutsui', '（無線）手を横に振る合図、階段下で通した。上が詰まれば、すぐ分かる。'],
    ['kubota', '（無線）真ん中だけの詰まりが、崩れてます。後ろへ流れてる。'],
    ['shiraishi', '（無線）駅と車内が同じ言葉だ。いい形だ。'],
    '階段の途中で、人が、ゆるやかに分かれていく。止まらず、押されず、ぎりぎりの密度で。'
  ], 'ch7.flo_task', { effects: [ev('teamwork', 3), ev('safety', 1)], view: v3('platform_high', '20:46 ホーム') });
  line('ch7.flo_rough', [
    ['kubota', '（無線）真ん中の車両の位置だけ詰まってます。車内放送と、駅の言い方が食い違ってる。'],
    ['yamashina', '（無線）警備さんと合図が通ってない。下から「止めて」が、届かない。'],
    ['kubota', '（無線）階段の途中で、女性が一人、立ちすくんでます。後ろから押されて。'],
    ['shiraishi', '（無線）{player}。切り替える勇気を持て。階段の入口で絞れ。止めるんじゃない。絞る。', 'serious'],
    ['player', '（無線）了解。「ゆっくり、一列ずつ」に切り替えます。'],
    '途中で流れを曲げる。負けじゃない。目の前の一人の足を守る判断だ。'
  ], 'ch7.flo_task', { effects: [ev('teamwork', -1), set('ch7.flo_paused')], view: v3('platform_high', '20:46 ホーム階段') });
  N['ch7.flo_task'] = { id: 'ch7.flo_task', type: 'task', kind: 'watch', title: '階段とホームの密度を見守る', intro: '線に近づく人・階段で立ち止まる人をタップして声をかけます。立ち止まっている人は見守るだけです。',
    config: { total: 14 }, results: res3('ch7.flo_r_good', 'ch7.flo_r_mid', 'ch7.flo_r_bad', [ev('safety', 4), sk('patrol', 3), ev('service', 2)], [ev('safety', 1)], [ev('safety', -3)]), view: v3('platform_high', '20:50 ホーム') };
  line('ch7.flo_r_good', [['yamashina', '（無線）全員に届いた。取りこぼしゼロ。…俺、今、鳥肌立ってる。', 'smile']], 'ch7.flo_fin', { view: v3('platform', '20:58 ホーム') });
  line('ch7.flo_r_mid', [['yamashina', '（無線）何人か、線を越えかけた。ぎりぎり。心臓に悪い。']], 'ch7.flo_fin', { view: v3('platform', '20:58 ホーム') });
  line('ch7.flo_r_bad', [['yamashina', '（無線）線を越えた人が出た。手を伸ばして戻した。怪我はない。…危なかった。', 'serious']], 'ch7.flo_fin', { view: v3('platform', '20:58 ホーム') });
  echo('ch7.flo_fin', 'ch7.flo_end');
  line('ch7.flo_end', [
    ['hamaguchi', '（無線）一本目、ほぼ定刻。二本目も一分以内。三本目、定刻見込み。', 'smile'],
    ['shiraishi', '（無線）止めずに流すのは、人の目と手があって、できることだ。今夜は、あった。'],
    '満員の臨時快速が、ホームを離れていく。窓に並ぶ、笑顔と疲れた顔。全員の肩に、見えない緊張が乗っていた。'
  ], 'ch7.peak_end', { effects: [tl('8月14日 帰りの波で、流れを止めない誘導を選んだ'), log('流れを止めず、誘導で波をしのぐ', 'work')], view: v3('platform', '21:05 ホーム') });

  fx('ch7.peak_end', [set('ch7.peak_done'), set('ch7.route_done_station'), time(30), log('帰りの波が引いた', 'work')], 'ch7.coord_b');
  const co = ['ch7.co_dispatch', 'ch7.co_guard', 'ch7.co_crew', 'ch7.co_shop'].map(F);
  branch('ch7.coord_b', [[ANY(ALL(co[0], co[1], co[2]), ALL(co[0], co[1], co[3]), ALL(co[0], co[2], co[3]), ALL(co[1], co[2], co[3])), 'ch7.coord_yes']], 'ch7.coord_no');
  line('ch7.coord_yes', [
    ['shiraishi', '（無線）どの持ち場も、同じ絵を見ていた。誰かが一枚にまとめたからだ。'],
    ['kubota', '（無線）今夜「聞いてない」と言った人が、一人もいません。', 'smile']
  ], 'ch7.coord_set', { view: v3('platform', '21:30 ホーム') });
  fx('ch7.coord_set', [set('ch7.coordinated'), rel('shiraishi', 2, 2), rel('hamaguchi', 1, 1), ev('teamwork', 4), tl('8月14日 指令・警備・乗務員・売店と連携できた')], 'ch7.hub');
  line('ch7.coord_no', [
    ['shiraishi', '（無線）今夜は、一部、話が回らなかった。誰のせいでもない。回り切らなかっただけだ。'],
    ['kubota', '（無線）次は、あと一か所だけ、先に回りましょう。']
  ], 'ch7.hub', { effects: [ev('teamwork', 1)], view: v3('platform', '21:30 ホーム') });

  // ======================================================================
  // 共通の道具（ルート別の中盤）
  // ======================================================================
  const anyThree = list => ANY(...list.map((_, i) => ALL(...list.filter((__, j) => j !== i).map(F))));
  const task3 = (id, o) => {
    N[id] = { id, type: 'task', kind: o.kind, title: o.title, intro: o.hint, config: o.config, ...(o.items ? { items: o.items } : {}), results: res3(id + '_good', id + '_mid', id + '_bad', o.ge ?? [ev('accuracy', 3)], o.me ?? [ev('accuracy', 1)], o.be ?? [ev('accuracy', -1)]), view: o.view };
    line(id + '_good', [[o.who, o.good, 'smile']], o.next, { view: o.view });
    line(id + '_mid', [[o.who, o.mid]], o.next, { view: o.view });
    line(id + '_bad', [[o.who, o.bad, 'serious']], o.next, { view: o.view });
  };
  /** 連絡先を回る選択ループ。時刻上限までに回れるのは3か所まで（1か所は回れない） */
  const linkLoop = (id, prompt, view, items, goto, limitMin) => choice(id, prompt, [
    ...items.map(([key, label, to, flag]) => opt(key, label, to, { tone: 'careful', requires: ALL(NF(flag), T('<', limitMin)) })),
    opt('go', '回るのはここまで。判断の時間に備える', goto, { tone: 'quick' })
  ], { view });

  // ======================================================================
  // 【基地ルート】 ch6.wish_depot（2D・bg depot）
  // ======================================================================
  line('ch7.d_open', [
    '検修庫の屋根に、陽炎が立っている。留置線に、同じ顔の電車が三本。',
    ['tachibana', '臨時の三編成だ。今夜、駅へ出す。…君は資格がない。車両には触れさせん。'],
    ['tachibana', '君の仕事は三つ。読み上げと記録票を照らす。報告を仕分ける。出区の時刻を、駅と指令へつなぐ。'],
    ['player', '基地の目と、動かす人の目を、つなぐんですね。'],
    ['tachibana', '勤務は22時15分まで。17時半に45分休め。倒れる奴が毎年出る。水を飲め。'],
    ['tachibana', '出区は19時50分、20時35分、20時55分。時刻は動かせん。だが安全は、時刻より先だ。', 'serious']
  ], 'ch7.d_sort_1', { effects: [tl('8月14日 臨時列車を支える基地側に入る（検査資格のない者として、確認と連絡を担当）')], view: DV(['tachibana'], '8月14日（土） 15:00 青浜総合車両センター') });
  line('ch7.d_sort_1', [['tachibana', '報告が来ている。迷ったら重いほうへ倒せ。報告が多くて叱られた奴は、基地にはいない。']], 'ch7.d_sort', { view: DV(['tachibana']) });
  task3('ch7.d_sort', { kind: 'sort', title: '編成の報告を仕分ける', hint: '報告ごとに、正しい扱いを選びます。', who: 'tachibana', next: 'ch7.d_brk_0', view: DV(['tachibana'], '15:40 検修庫の詰所'),
    config: { perItem: 7, bins: [{ id: 'ok', label: '支障なし（記録のみ）' }, { id: 're', label: '出区前に再点検' }, { id: 'rep', label: '検修長へ即報告' }], items: [
      { id: 'a', label: '乗務員：「室内灯が1灯、ちらつく」', bin: 'ok', why: '運行に直結しません。記録して後日交換します。' },
      { id: 'b', label: '検修員：「2号編成、ドアの閉まる音が少し長い」', bin: 're', why: 'ドアは乗降に直結します。再点検します。' },
      { id: 'c', label: '検修員：「2号編成、ブレーキ試験で圧力の戻りが遅い気がする」', bin: 'rep', why: 'ブレーキの疑いは、検修長へ即報告です。' },
      { id: 'd', label: '乗務員：「1号編成の運転席に、メモ帳が落ちていた」', bin: 'ok', why: '忘れ物として記録します。' },
      { id: 'e', label: '検修員：「3号編成、車内放送のスピーカーが片側だけ小さい」', bin: 're', why: '混雑時の案内に必要です。再点検します。' },
      { id: 'f', label: '検修員：「1号編成の床下から、焦げたような匂い」', bin: 'rep', why: '安全に関わる異常の疑いです。即、検修長へ。' }] },
    good: 'どちらの重い報告も、重いまま拾ったな。…基地の目だ。', mid: '大体合っている。重いほど、早く拾え。', bad: '軽いほうに倒した報告があった。基地では、疑わしきは重く、だ。',
    ge: [ev('accuracy', 3), ev('safety', 2), set('ch7.d_sorted')], me: [ev('accuracy', 1)], be: [ev('safety', -2)] });
  fx('ch7.d_brk_0', [{ clock: { minute: hm(17, 30) } }, log('基地で休憩（45分）に入る', 'work')], 'ch7.d_brk');
  line('ch7.d_brk', [
    '詰所の壁に、色あせた編成写真。ヘッドマークが、段ボールの手作りだ。',
    ['tachibana', '私の初めての臨時だ。夜勤明けに、段ボールを切った。'],
    ['player', '誰に見せたんですか。'],
    ['tachibana', '誰にも。…駅の人間が、泣いた。「列車が祭りの顔になってる」と。'],
    ['tachibana', 'この秋で、私は基地を降りる。まだ誰にも言うな。麦茶を飲め。', 'smile']
  ], 'ch7.d_brk_e', { view: DV(['tachibana'], '17:30 詰所') });
  fx('ch7.d_brk_e', [{ clock: { minute: hm(18, 15) } }, ev('safety', 1), rel('tachibana', 1, 2)], 'ch7.d_check_1');
  line('ch7.d_check_1', [['tachibana', '読み上げと記録票を照らせ。聞こえなければ聞き直せ。聞き直すのは、恥じゃない。', 'serious']], 'ch7.d_check', { view: DV(['tachibana']) });
  N['ch7.d_check'] = { id: 'ch7.d_check', type: 'task', kind: 'checklist', title: '読み上げと記録票の照合', intro: '各項目が、手順として適切か不適切かを判断してください。', config: { labels: ['適切', '不適切'] },
    items: [
      { id: 'a', label: '読み上げと記録票の数値が一致しているか、一項目ずつ照合する', truth: 'ok', why: '一致の確認が、記録の意味です。' },
      { id: 'b', label: '声が小さく聞き取れなくても、基準内のはずなので丸をつける', truth: 'ng', why: '聞き取れない項目は、必ず聞き直します。' },
      { id: 'c', label: '聞き取れなかった項目は、その場で検査員に聞き直す', truth: 'ok', why: '聞き直しは、正確さのための手順です。' },
      { id: 'd', label: '資格のない自分が、気づいた不具合を、工具で調整する', truth: 'ng', why: '資格のない者は、検査・調整をしません。報告します。' },
      { id: 'e', label: '気になる点は、検査者本人と検修長に口頭で伝える', truth: 'ok', why: '記録と口頭の両方で残します。' },
      { id: 'f', label: '出区が迫っているので、未照合の項目は後で記入する', truth: 'ng', why: '後回しは、記録の抜けのもとです。' }],
    results: res3('ch7.d_check_good', 'ch7.d_check_mid', 'ch7.d_check_bad', [ev('accuracy', 3), ev('safety', 2)], [ev('accuracy', 1)], [ev('safety', -2)]), view: DV(['tachibana']) };
  line('ch7.d_check_good', [['tachibana', '…抜けも思い込みもない。乗務員が、安心して座れる記録だ。', 'smile']], 'ch7.d_mem_1', { view: DV(['tachibana']) });
  line('ch7.d_check_mid', [['tachibana', '甘いところは私が見る。次は、聞き直す勇気を持て。']], 'ch7.d_mem_1', { view: DV(['tachibana']) });
  line('ch7.d_check_bad', [['tachibana', '省いたのが、重要な項目だった。この一枚は、乗務員の命綱だ。', 'serious']], 'ch7.d_mem_1', { view: DV(['tachibana']) });
  line('ch7.d_mem_1', [['tachibana', '出区の予定は数字で伝える。紙を見ていては遅い。頭に入れろ。']], 'ch7.d_mem', { view: DV(['tachibana']) });
  task3('ch7.d_mem', { kind: 'memory', title: '出区予定の暗唱', hint: '示された順に覚え、同じ順に入力します（見返しはできません）。', who: 'tachibana', next: 'ch7.d_link_0', view: DV(['tachibana']),
    config: { sequence: ['1号', '19:50', '20:35', '20:55'], pool: ['1号', '2号', '19:35', '19:50', '20:35', '20:55', '21:05', '21:20'], showMs: 4500, showLabel: '出区予定（確定）' },
    good: '数字が、人を動かす。…いい頭だ。', mid: '一字違いが事故になる。惜しい。', bad: '入れ替わっている。復唱の癖をつけろ。', ge: [ev('accuracy', 3)], be: [ev('accuracy', -1)] });
  fx('ch7.d_link_0', [{ clock: { minute: hm(18, 30) } }], 'ch7.d_link');
  linkLoop('ch7.d_link', '出区の前に、つないでおきたい相手は？（時間の都合で三か所まで）', DV(['tachibana']), [
    ['tach', '検修長に、2号編成の判断の基準を聞く', 'ch7.d_l_tach', 'ch7.d_co_tach'],
    ['crew', '乗務前の車掌・水城さんに、編成の状態を伝える', 'ch7.d_l_crew', 'ch7.d_co_crew'],
    ['disp', '指令の浜口さんに、出区の見込みを数字で伝える', 'ch7.d_l_disp', 'ch7.d_co_disp'],
    ['stat', '駅の白石駅長に、回送の見込みを伝える', 'ch7.d_l_stat', 'ch7.d_co_stat']
  ], 'ch7.d_peak', hm(19, 30));
  line('ch7.d_l_tach', [
    ['player', '2号のブレーキの件、出す・出さないの基準は。'],
    ['tachibana', '再試験を二回。両方基準内で、戻りが安定すれば出す。外れたら、予備の4号を立てる。'],
    ['tachibana', 'その場合、2号は欠区。臨時は二本になる。…君の意見も、聞く。最終判断は私と指令だ。']
  ], 'ch7.d_l_tach_e', { view: DV(['tachibana']) });
  fx('ch7.d_l_tach_e', [set('ch7.d_co_tach'), time(25), ev('teamwork', 1), log('検修長と、2号編成の判断の基準を確認', 'work')], 'ch7.d_link');
  line('ch7.d_l_crew', [
    ['mizuki', '乗る前に編成を見に来ました。…ここは、非常ベルが鳴らないから好きです。'],
    ['player', '3号は放送が片側だけ小さいです。肉声で補うことになるかも。'],
    ['mizuki', '走りながら気づくのと、乗る前に知るのは別物です。小さい側を、私が声で埋めます。', 'smile']
  ], 'ch7.d_l_crew_e', { view: DV(['mizuki'], '18:40 留置線の脇') });
  fx('ch7.d_l_crew_e', [set('ch7.d_co_crew'), time(25), rel('mizuki', 2, 2), log('車掌に、編成の状態を伝えた', 'work')], 'ch7.d_link');
  line('ch7.d_l_disp', [
    ['hamaguchi', '指令。出区、確定？ 見込み？'],
    ['player', '1号19時50分は確定。2号20時35分は再試験次第で、見込みです。'],
    ['hamaguchi', 'それでいい。欠区なら早く。駅の規制判断に効く。']
  ], 'ch7.d_l_disp_e', { view: DV(['hamaguchi'], '18:45 詰所の電話') });
  fx('ch7.d_l_disp_e', [set('ch7.d_co_disp'), time(25), rel('hamaguchi', 1, 1), log('指令に、出区の見込みを伝えた', 'work')], 'ch7.d_link');
  line('ch7.d_l_stat', [
    ['shiraishi', '基地から、とは珍しい。何かあったか。'],
    ['player', '2号に点検が入っています。欠区なら、臨時は二本です。'],
    ['shiraishi', '二本なら、一本あたりが増える。規制の準備を前倒しにしよう。…基地の人間は駅を見ていない、と思っていたが。', 'serious']
  ], 'ch7.d_l_stat_e', { view: DV(['shiraishi'], '18:50 詰所の電話') });
  fx('ch7.d_l_stat_e', [set('ch7.d_co_stat'), time(25), rel('shiraishi', 1, 2), log('駅に、回送の見込みを伝えた', 'work')], 'ch7.d_link');

  line('ch7.d_peak', [
    '20時15分。計器の針が、基準線の、ぎりぎり手前で止まった。',
    ['tachibana', '二回とも基準内。だが、ぎりぎりだ。三回目をやれば、20時35分に間に合わん。'],
    ['tachibana', '定刻で出して折返しで直すか。出さずに、4号を20時58分に立てるか。どちらも決まりの内だ。'],
    ['tachibana', '駅の側から、何を見てきた。聞かせろ。', 'serious']
  ], 'ch7.d_choice', { effects: [{ clock: { minute: hm(20, 15) } }, log('20時15分 2号編成の判断を迫られる', 'work')], view: DV(['tachibana'], '20:15 検修庫') });
  choice('ch7.d_choice', '2号編成について、どう意見を述べる？', [
    opt('limit', '追加点検を優先する。2号は出さず、予備の4号を立てる', 'ch7.d_lim_b', { tone: 'careful', effects: [set('ch7.limited')], hint: '安全の余裕は取れる。駅の混雑が長引く' }),
    opt('flowed', '定刻で出し、折返しで継続点検。状況は乗務員と駅へ共有する', 'ch7.d_flo_b', { tone: 'risky', effects: [set('ch7.flowed')], hint: '定刻で流せる。乗務員と駅の備えが前提' })
  ], { important: true, timeLimit: 45, defaultOption: 'limit', view: DV(['tachibana']) });
  branch('ch7.d_lim_b', [[ALL(F('ch7.d_co_tach'), F('ch7.d_co_disp')), 'ch7.d_lim_good']], 'ch7.d_lim_rough');
  line('ch7.d_lim_good', [
    ['player', '2号は出さず、4号を。'],
    ['tachibana', '分かった。指令へ。2号欠区。4号、20時58分。（右手を、ぱたぱたと横に振る）整備班、止めろ。再試験は終わりだ。', 'serious'],
    ['hamaguchi', '（電話）欠区の見込みは聞いてた。間隔の調整、もう組んである。'],
    ['shiraishi', '（電話）規制を早めに出した。広場には見込みを伝えてある。'],
    '検修員たちが、予備の4号へ散っていく。誰も慌てていない。先に共有されていた、それだけで。'
  ], 'ch7.d_fin', { effects: [ev('safety', 3), ev('teamwork', 2)], view: DV(['tachibana', 'hamaguchi'], '20:25 検修庫') });
  line('ch7.d_lim_rough', [
    ['player', '2号は出さず、4号を。'],
    ['tachibana', '分かった。指令へ。2号欠区。4号、20時58分。', 'serious'],
    ['hamaguchi', '（電話）欠区？ …今、初めて聞いた。間隔を組み直す。待って。'],
    ['shiraishi', '（電話）二本なら早く言え。広場の規制が遅れた。外が詰まる。', 'serious'],
    '判断は間違っていない。連絡が一歩遅れた分、しわ寄せが駅の足元へ行った。検修長が、受話器を握りしめている。'
  ], 'ch7.d_fin', { effects: [ev('safety', 1), ev('teamwork', -1)], view: DV(['tachibana', 'hamaguchi'], '20:25 検修庫') });
  branch('ch7.d_flo_b', [[ALL(F('ch7.d_co_crew'), F('ch7.d_co_stat')), 'ch7.d_flo_good']], 'ch7.d_flo_rough');
  line('ch7.d_flo_good', [
    ['player', '基準内です。定刻で出して、折返しで継続点検を。乗務員と駅へ共有します。'],
    ['tachibana', 'いいだろう。2号、20時35分。', 'serious'],
    ['mizuki', '（無線）ブレーキの感触に注意して、ゆっくり入線します。駅にも伝えてあります。'],
    ['shiraishi', '（電話）停止位置を手前に取る。ゆっくり受ける。'],
    '2号が、静かに構内を出ていく。気がかりを、みんなで分けて持った夜。'
  ], 'ch7.d_fin', { effects: [ev('teamwork', 3), ev('safety', 1)], view: DV(['tachibana', 'mizuki'], '20:35 出区') });
  line('ch7.d_flo_rough', [
    ['player', '基準内です。定刻で出して、折返しで継続点検を。'],
    ['tachibana', 'いいだろう。2号、20時35分。', 'serious'],
    ['mizuki', '（無線）…今、初めて聞きました。乗る前なら、入線の速度を変えられたのに。', 'serious'],
    ['shiraishi', '（電話）2号に事情が？ 聞いてないぞ。']
  ], 'ch7.d_fin', { effects: [ev('teamwork', -1), set('ch7.d_catchup')], view: DV(['tachibana', 'mizuki'], '20:35 出区') });
  line('ch7.d_fin', [
    '20時55分。最後の編成が、検修庫の影から、ゆっくり出ていく。',
    ['tachibana', '見送れ。基地の仕事は、見送ることだ。'],
    ['player', '何もしていないのに、胸がいっぱいです。'],
    ['tachibana', '手を動かす者、つなぐ者、見送る者。全部で一本だ。…（遠い花火に、右手を小さく振る）', 'smile']
  ], 'ch7.d_end', { effects: [{ clock: { minute: hm(20, 55) } }], view: DV(['tachibana'], '20:55 留置線') });
  fx('ch7.d_end', [set('ch7.route_done_depot'), tl('8月14日 基地側から、臨時列車の出区を支えた'), log('基地での勤務を終える', 'work')], 'ch7.d_coord_b');
  branch('ch7.d_coord_b', [[anyThree(['ch7.d_co_tach', 'ch7.d_co_crew', 'ch7.d_co_disp', 'ch7.d_co_stat']), 'ch7.d_coord_yes']], 'ch7.d_back');
  fx('ch7.d_coord_yes', [set('ch7.coordinated'), rel('tachibana', 2, 2), ev('teamwork', 4), tl('8月14日 基地・乗務員・指令・駅の間で、情報をつなげた')], 'ch7.d_back');
  line('ch7.d_back', [['tachibana', '駅へ戻って報告しろ。白石が待ってる。']], 'ch7.back_hi', { effects: [{ clock: { minute: hm(21, 40) } }], view: DV(['tachibana'], '21:30 基地を出る') });

  // ======================================================================
  // 【指令ルート】 ch6.wish_dispatch（2D・輸送指令室）
  // ======================================================================
  const XV = (who, cap) => v25('office', who, cap ?? '輸送指令室');
  line('ch7.x_open', [
    '壁一面の表示盤で、小さな光が、三十本ぶん、一斉に滑っている。電話は、今のところ静かだ。',
    ['hamaguchi', '浜口。今日は見学と手伝い。運転整理は、資格のある指令員の仕事。あなたはしない。'],
    ['hamaguchi', '頼むのは、現場の声を整えること。連絡文の下書き。判断の材料作り。'],
    ['hamaguchi', '「人が多い気がする」と「階段八割」は、同じ声でも、材料の重さが違う。'],
    ['hamaguchi', '勤務は22時15分。17時半に45分休憩。この部屋は暗い。休憩は、外で取って。']
  ], 'ch7.x_sort_1', { effects: [tl('8月14日 輸送指令室で、情報整理と連絡文の下書きを担当（運転整理はしない）')], view: XV(['hamaguchi'], '8月14日（土） 15:00 輸送指令室') });
  line('ch7.x_sort_1', [['hamaguchi', '現場の声を仕分けて。迷ったら「確認の電話」。聞き返すのは、この部屋では普通。']], 'ch7.x_sort', { view: XV(['hamaguchi']) });
  task3('ch7.x_sort', { kind: 'sort', title: '現場の声を仕分ける', hint: '現場から届いた報告を、扱いごとに仕分けます。', who: 'hamaguchi', next: 'ch7.x_brk', view: XV(['hamaguchi']),
    config: { perItem: 7, bins: [{ id: 'train', label: '運転に関わる（指令員へ即）' }, { id: 'cust', label: 'お客様対応（駅へ返す）' }, { id: 'rec', label: '記録して共有' }, { id: 'ask', label: '不明確（確認の電話）' }], items: [
      { id: 'a', label: '乗務員：「前の駅で乗降が長引き、1分遅れ」', bin: 'train', why: '運転間隔に影響します。指令員へ即。' },
      { id: 'b', label: '駅：「改札外で迷子の子を保護」', bin: 'cust', why: '駅が対応する案件です。' },
      { id: 'c', label: '駅：「なんだか、人が多い気がします」', bin: 'ask', why: '数字がなく判断できません。人数・場所を確認します。' },
      { id: 'd', label: '警備：「広場の列が、折り返し位置まで来た」', bin: 'rec', why: '運転には直結しませんが、状況として共有します。' },
      { id: 'e', label: '基地：「2号編成の出区、5分遅れる見込み」', bin: 'train', why: '臨時列車の運行に直結します。' },
      { id: 'f', label: 'お客様：「駅で落とし物をした」', bin: 'cust', why: '落とし物は駅の取扱いです。' }] },
    good: '速い。…今の三番目、「ask」に入れる人は、少ないの。', mid: '数件、箱違い。数字のない声は、確認へ。', bad: '運転に関わる声が、後ろに回ってた。それは遅れになる。',
    ge: [ev('accuracy', 3), ev('teamwork', 1), sk('ops', 3)], me: [ev('accuracy', 1)], be: [ev('accuracy', -2)] });
  line('ch7.x_brk', [
    '17時30分。廊下の窓から、傾いた陽がまっすぐ刺さる。',
    ['hamaguchi', '眩しい。…外の天気は、現場の声で知る癖がついた。'],
    ['hamaguchi', '「雨でブレーキ音が変わった」。誰も天気の話をしてないのに、聞こえてくる。'],
    ['hamaguchi', '本当は、毎晩、夕焼けを見たい。言わないで。指令員は、窓に興味ない顔をする決まり。', 'smile']
  ], 'ch7.x_brk_e', { effects: [{ clock: { minute: hm(17, 30) } }, log('指令室で休憩（45分）', 'work')], view: XV(['hamaguchi'], '17:30 廊下の窓') });
  fx('ch7.x_brk_e', [{ clock: { minute: hm(18, 15) } }, ev('safety', 1), rel('hamaguchi', 1, 2)], 'ch7.x_mem_1');
  line('ch7.x_mem_1', [['hamaguchi', '運行表を頭に入れて。電話が鳴ったとき、表を見る余裕はない。']], 'ch7.x_mem', { view: XV(['hamaguchi']) });
  task3('ch7.x_mem', { kind: 'memory', title: '運行表の暗唱', hint: '示された順に覚え、同じ順に入力します（見返しはできません）。', who: 'hamaguchi', next: 'ch7.x_cmp_1', view: XV(['hamaguchi']),
    config: { sequence: ['2番線', '20:50', '21:02', '21:14'], pool: ['1番線', '2番線', '20:15', '20:50', '21:02', '21:14', '21:20', '21:30'], showMs: 4500, showLabel: '臨時快速の運行表' },
    good: '完璧。…ここに座ってほしくなる。', mid: '惜しい。数字は聞き直していい。', bad: '入れ替わってる。この部屋で一番怖いのは、それ。', ge: [ev('accuracy', 3)], be: [ev('accuracy', -1)] });
  line('ch7.x_cmp_1', [['hamaguchi', '現場への連絡文を下書きして。確定と見込みを分ける。数字を添える。お願いは最後に一つ。']], 'ch7.x_cmp', { view: XV(['hamaguchi']) });
  N['ch7.x_cmp'] = { id: 'ch7.x_cmp', type: 'task', kind: 'compose', title: '現場への連絡文', intro: '三つの要素から、適切な文を一つずつ選びます。',
    slots: [
      { id: 'fact', label: '運行の事実と見込み', options: [{ id: 'f1', text: '臨時快速は20時50分、21時02分、21時14分に2番線から発車予定（確定）。二本目は前駅の混雑で1〜2分遅れる見込み（確定ではありません）。', good: true, why: '確定と見込みが分けられています。' }, { id: 'f2', text: '臨時快速は順調に運転しています。', good: false, why: '数字がなく、現場が判断できません。' }, { id: 'f3', text: '臨時快速は、すべて時刻どおりに出ます。', good: false, why: '断定は危険です。' }] },
      { id: 'num', label: '現場に求める数字', options: [{ id: 'n1', text: 'ホーム階段付近の人数を、10分おきに「おおむね○割」でお知らせください。', good: true, why: '数字の形式を決めると、比較できます。' }, { id: 'n2', text: '混雑したら、すぐ連絡してください。', good: false, why: '「混雑」の基準が人によって違います。' }, { id: 'n3', text: '特に連絡は不要です。', good: false, why: '指令には現場が見えません。' }] },
      { id: 'ask', label: '最後のお願い', options: [{ id: 'a1', text: '「ホーム満員」の判断に迷ったら、迷った時点でお電話ください。', good: true, why: '早い連絡を歓迎する姿勢です。' }, { id: 'a2', text: '判断はそちらでお願いします。', good: false, why: '協力の形になっていません。' }, { id: 'a3', text: '遅れても、こちらの責任ではありません。', good: false, why: '責任の押し付けは連携を壊します。' }] }
    ],
    results: [{ min: 66, goto: 'ch7.x_cmp_good', effects: [ev('accuracy', 3), ev('teamwork', 2), set('ch7.x_msg_good')] }, { min: 34, goto: 'ch7.x_cmp_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch7.x_cmp_bad', effects: [ev('accuracy', -1)] }], view: XV(['hamaguchi']) };
  line('ch7.x_cmp_good', [['hamaguchi', '直すところ、なし。そのまま駅へ流す。', 'smile']], 'ch7.x_link_0', { view: XV(['hamaguchi']) });
  line('ch7.x_cmp_mid', [['hamaguchi', '「混雑」を数字に。一緒に直そう。']], 'ch7.x_link_0', { view: XV(['hamaguchi']) });
  line('ch7.x_cmp_bad', [['hamaguchi', '責任の押し付けが混ざってる。現場には「一緒に」で届けて。', 'serious']], 'ch7.x_link_0', { view: XV(['hamaguchi']) });
  fx('ch7.x_link_0', [{ clock: { minute: hm(18, 40) } }], 'ch7.x_link');
  linkLoop('ch7.x_link', '波の前に、電話で声を聞いておく相手は？（三か所まで）', XV(['hamaguchi']), [
    ['stat', '駅（白石駅長）に、階段の人数の見込みを聞く', 'ch7.x_l_stat', 'ch7.x_co_stat'],
    ['crew', '車掌・水城さんに、乗降時間の見込みを聞く', 'ch7.x_l_crew', 'ch7.x_co_crew'],
    ['depot', '基地の検修長に、予備編成が出せるか聞く', 'ch7.x_l_depot', 'ch7.x_co_depot'],
    ['guard', '警備の筒井さんに、広場の列の長さを聞く', 'ch7.x_l_guard', 'ch7.x_co_guard']
  ], 'ch7.x_peak', hm(19, 40));
  line('ch7.x_l_stat', [
    ['shiraishi', '白石だ。階段、いま四割。20時過ぎから跳ね上がる。'],
    ['player', '八割で「ホーム満員」の連絡を、お願いできますか。'],
    ['shiraishi', '八割で連絡する。その数字を、指令員に渡してくれ。']
  ], 'ch7.x_l_stat_e', { view: XV(['shiraishi'], '18:50 駅との電話') });
  fx('ch7.x_l_stat_e', [set('ch7.x_co_stat'), time(25), rel('shiraishi', 1, 2), log('駅と、満員の基準を数字で決めた', 'work')], 'ch7.x_link');
  line('ch7.x_l_crew', [
    ['mizuki', '乗降は30秒が普通。満員なら60秒でも足りません。'],
    ['player', '指令から延長を頼むなら、何秒まで？'],
    ['mizuki', '一本目は30秒なら後続が吸収できる。それ以上は間隔調整。…線引きを先に聞いてくれて、助かります。', 'smile']
  ], 'ch7.x_l_crew_e', { view: XV(['mizuki'], '18:55 乗務員との無線') });
  fx('ch7.x_l_crew_e', [set('ch7.x_co_crew'), time(25), rel('mizuki', 2, 2), log('乗務員と、延長できる乗降時間を確認', 'work')], 'ch7.x_link');
  line('ch7.x_l_depot', [
    ['tachibana', '4号か。19時に整備を始めれば、20時58分に出せる。始めるか、今決めろ。'],
    ['player', '2号の再試験次第、ですね。指令員に伝えます。'],
    ['tachibana', '決まったら数字で言う。確定と見込みを分けてな。']
  ], 'ch7.x_l_depot_e', { view: XV(['tachibana'], '19:00 基地との電話') });
  fx('ch7.x_l_depot_e', [set('ch7.x_co_depot'), time(25), rel('tachibana', 1, 1), log('基地と、予備編成の出区条件を確認', 'work')], 'ch7.x_link');
  line('ch7.x_l_guard', [
    ['tsutsui', '筒井。広場の列？ まだ短い。…指令室から電話とは。'],
    ['player', '「満員」の連絡と一緒に、広場の様子も見られたら、判断しやすくて。'],
    ['tsutsui', '列の端が白いテープを越えたら、無線で言う。駅経由で流せ。外の景色は、中に届かんからな。', 'serious']
  ], 'ch7.x_l_guard_e', { view: XV(['tsutsui'], '19:05 警備との電話') });
  fx('ch7.x_l_guard_e', [set('ch7.x_co_guard'), time(25), rel('shiraishi', 0, 1), log('警備と、広場の列の合図を決めた', 'work')], 'ch7.x_link');

  line('ch7.x_peak', [
    '20時40分。電話が、同時に三本鳴った。',
    ['shiraishi', '（電話）駅。階段、八割超え。「ホーム満員」。一本目の入線まで10分。'],
    ['hamaguchi', '了解。{player}、表示盤。二本目は前駅で一分半遅れ。後ろに普通が一本。'],
    ['hamaguchi', '方針は二つ。決めるのは私。現場の声を一番聞いたのは、あなた。どっち。', 'serious']
  ], 'ch7.x_choice', { effects: [{ clock: { minute: hm(20, 40) } }, log('20時40分 ホーム満員の連絡が入る', 'work')], view: XV(['hamaguchi'], '20:40 輸送指令室') });
  choice('ch7.x_choice', '指令員に、どちらの方針を勧める？', [
    opt('limit', '後続を手前の駅で一時抑止し、駅の入場規制を促す', 'ch7.x_lim_b', { tone: 'careful', effects: [set('ch7.limited')], hint: '押し合いを防げる。遅れが広がる' }),
    opt('flowed', '乗降時間を延長し、後続の間隔を調整して流す', 'ch7.x_flo_b', { tone: 'risky', effects: [set('ch7.flowed')], hint: '遅れを抑えられる。現場の対応が前提' })
  ], { important: true, timeLimit: 45, defaultOption: 'limit', view: XV(['hamaguchi']) });
  branch('ch7.x_lim_b', [[ALL(F('ch7.x_co_stat'), F('ch7.x_co_guard')), 'ch7.x_lim_good']], 'ch7.x_lim_rough');
  line('ch7.x_lim_good', [
    ['player', '後続を手前で止めて、規制を促してください。階段は八割超えです。'],
    ['hamaguchi', '後続の普通、一つ手前で待機。駅へ、入場規制を。（右手を、ぱたぱたと横に）止めて、の合図。癖なの。', 'serious'],
    ['shiraishi', '（電話）広場の列は、筒井さんから聞いてる。テープの内側。規制しても持つ。'],
    '表示盤の光が、一つ、ゆっくり止まる。止めた先にも、案内が流れている。'
  ], 'ch7.x_fin', { effects: [ev('safety', 3), ev('teamwork', 2)], view: XV(['hamaguchi', 'shiraishi'], '20:46 輸送指令室') });
  line('ch7.x_lim_rough', [
    ['player', '後続を手前で止めて、規制を促してください。'],
    ['hamaguchi', '後続、待機。駅へ、入場規制を。', 'serious'],
    ['shiraishi', '（電話）規制は始める。広場の列が今どうなってるか、こっちも分からん。'],
    ['hamaguchi', '止めた先の景色が、こっちから見えない。…嫌な判断だ。', 'worry'],
    '間違ってはいない。ただ、止めたあとの景色を、誰も確かめていなかった。'
  ], 'ch7.x_fin', { effects: [ev('safety', 1), ev('teamwork', -1)], view: XV(['hamaguchi', 'shiraishi'], '20:46 輸送指令室') });
  branch('ch7.x_flo_b', [[ALL(F('ch7.x_co_crew'), F('ch7.x_co_depot')), 'ch7.x_flo_good']], 'ch7.x_flo_rough');
  line('ch7.x_flo_good', [
    ['player', '一本目、30秒延長で流してください。後続の間隔は確認済みです。'],
    ['hamaguchi', '乗務員へ。一本目、30秒延長。', 'serious'],
    ['mizuki', '（無線）了解。30秒まで。以上は放送でお願いします。'],
    ['tachibana', '（電話）4号の整備は始めてある。必要なら20時58分。'],
    '表示盤の光の間隔が、きれいに保たれたまま流れていく。聞いていた、だから、できる綱渡り。'
  ], 'ch7.x_fin', { effects: [ev('teamwork', 3), ev('safety', 1)], view: XV(['hamaguchi', 'mizuki'], '20:46 輸送指令室') });
  line('ch7.x_flo_rough', [
    ['player', '一本目、乗降時間を延長して流してください。'],
    ['hamaguchi', '乗務員へ。一本目、延長。', 'serious'],
    ['mizuki', '（無線）何秒ですか。後続への影響が、私には分かりません。', 'serious'],
    ['tachibana', '（電話）4号？ 今、初めて聞いたぞ。整備はまだだ。'],
    '決まりの内の判断だった。相手の条件を、先に聞けていなかった。指令員が、一人ずつ電話で聞き直している。'
  ], 'ch7.x_fin', { effects: [ev('teamwork', -1), set('ch7.x_catchup')], view: XV(['hamaguchi', 'mizuki'], '20:46 輸送指令室') });
  line('ch7.x_fin', [
    '21時15分。三本目が、定刻の近くで発車した。表示盤の光が、落ち着いていく。',
    ['hamaguchi', '判断は疲れる。でも、材料を整えてくれる人がいると、少し軽い。', 'smile'],
    ['player', '今夜、いろんな声を聞きました。みんな、それぞれの場所で全力でした。'],
    ['hamaguchi', '全部の声を聞いても、全部の景色は見えない。だから、声の裏を想像する。…今日は、手伝ってくれた。']
  ], 'ch7.x_end', { effects: [{ clock: { minute: hm(21, 15) } }], view: XV(['hamaguchi'], '21:15 輸送指令室') });
  fx('ch7.x_end', [set('ch7.route_done_dispatch'), tl('8月14日 指令室から、臨時列車の運行を支えた'), log('指令室での勤務を終える', 'work')], 'ch7.x_coord_b');
  branch('ch7.x_coord_b', [[anyThree(['ch7.x_co_stat', 'ch7.x_co_crew', 'ch7.x_co_depot', 'ch7.x_co_guard']), 'ch7.x_coord_yes']], 'ch7.x_back');
  fx('ch7.x_coord_yes', [set('ch7.coordinated'), rel('hamaguchi', 2, 2), ev('teamwork', 4), tl('8月14日 駅・乗務員・基地・警備の声を、指令室で一枚にした')], 'ch7.x_back');
  line('ch7.x_back', [['hamaguchi', '勤務はここまで。駅へ戻って報告を。白石さんが待ってる。']], 'ch7.back_hi', { effects: [{ clock: { minute: hm(21, 40) } }], view: XV(['hamaguchi'], '21:40 指令室を出る') });

  // ======================================================================
  // 【計画ルート】 ch6.wish_planning（2D・輸送計画の資料室と会議）
  // ======================================================================
  const PV = (who, cap) => v25('office', who, cap ?? '輸送計画課 資料室');
  line('ch7.p_open', [
    '壁一面の時刻図表に、今夜の臨時の線が、赤で一本。去年の赤線は、途中で、黒く塗りつぶされている。',
    ['sawada', '沢田です。今日は「ダイヤ当番」。作った側が、当日、現場に説明できないと、ダイヤはただの数字になる。'],
    ['player', 'その黒い線は。'],
    ['sawada', '去年の私の案です。あれは、見なかったことに。…さて、仕事。'],
    ['sawada', 'あなたの仕事は、案を読み解き、各部署への資料を作り、会議で懸念を聞き取ること。判断は私と現場。'],
    ['sawada', '勤務は22時15分。17時半に45分休憩。案は、臨時3本、12分間隔、一本およそ千二百人。']
  ], 'ch7.p_mem_1', { effects: [tl('8月14日 輸送計画課で、臨時ダイヤの説明と、部署間の聞き取りを担当（判断はしない）')], view: PV(['sawada'], '8月14日（土） 15:00 輸送計画課') });
  line('ch7.p_mem_1', [['sawada', '案の数字を、頭に入れて。会議で資料を見ていると、人の目が見られない。']], 'ch7.p_mem', { view: PV(['sawada']) });
  task3('ch7.p_mem', { kind: 'memory', title: '臨時ダイヤ案の数字', hint: '示された順に覚え、同じ順に入力します（見返しはできません）。', who: 'sawada', next: 'ch7.p_sort_1', view: PV(['sawada']),
    config: { sequence: ['3本', '12分間隔', '1200人', '折返し8分'], pool: ['2本', '3本', '4本', '8分間隔', '12分間隔', '800人', '1200人', '折返し8分'], showMs: 4800, showLabel: '臨時ダイヤ案（当初）' },
    good: '数字がすっと出る。…去年の私に、欲しかった人材です。', mid: '一つ違い。会議で数字を間違えると、議論が止まる。', bad: '入れ替わってます。案の数字は、一番最初に覚えるもの。', ge: [ev('accuracy', 3)], be: [ev('accuracy', -1)] });
  line('ch7.p_sort_1', [['sawada', '各部署から質問が届いてる。答えを知らない人が答えるのが、一番危ない。']], 'ch7.p_sort', { view: PV(['sawada']) });
  task3('ch7.p_sort', { kind: 'sort', title: '各部署からの質問を仕分ける', hint: '質問ごとに、答える先を選びます。', who: 'sawada', next: 'ch7.p_cmp_1', view: PV(['sawada']),
    config: { perItem: 7, bins: [{ id: 'plan', label: '計画課が答える' }, { id: 'stat', label: '駅の責任者に聞く' }, { id: 'disp', label: '指令へ回す' }, { id: 'dep', label: '基地へ回す' }], items: [
      { id: 'a', label: '「なぜ間隔が12分なのか。10分では駄目か」', bin: 'plan', why: '間隔の根拠はダイヤの設計です。' },
      { id: 'b', label: '「階段が詰まったら、駅はどこで入場を止めるのか」', bin: 'stat', why: '入場規制の基準は、駅の運用です。' },
      { id: 'c', label: '「遅れが出たとき、後続の運転整理はどうなるのか」', bin: 'disp', why: '運転整理は、指令員の判断です。' },
      { id: 'd', label: '「予備の編成は、何時までに出せるのか」', bin: 'dep', why: '編成の整備と出区は、基地の判断です。' },
      { id: 'e', label: '「想定の千二百人は、どう出したのか」', bin: 'plan', why: '需要予測は、計画課の担当です。' },
      { id: 'f', label: '「ホームの停止位置を、後ろに寄せられるか」', bin: 'stat', why: 'ホームの実際の使い方は、駅が決めます。' }] },
    good: '全部、答えを知ってる人に届いた。助かる。', mid: '数件ずれた。迷ったら「聞いておきます」で持ち帰る。', bad: '答えを知らない人が答える形になってた。それが一番危ない。',
    ge: [ev('accuracy', 3), ev('teamwork', 2)], me: [ev('accuracy', 1)], be: [ev('accuracy', -2)] });
  line('ch7.p_cmp_1', [['sawada', '会議で配る説明資料を。全員に同じ資料より、「あなたのこと」と書いた資料のほうが読まれる。']], 'ch7.p_cmp', { view: PV(['sawada']) });
  N['ch7.p_cmp'] = { id: 'ch7.p_cmp', type: 'task', kind: 'compose', title: '各部署への説明資料', intro: '三つの要素から、適切な文を一つずつ選びます。',
    slots: [
      { id: 'head', label: '冒頭の一文', options: [{ id: 'h1', text: '今夜の臨時快速は3本、12分間隔の案です。各部署に関わる点を、先にお伝えします。', good: true, why: '全体を一文で示し、各自に関わる点を先に述べます。' }, { id: 'h2', text: '以下の案のとおり運行します。', good: false, why: '決定の通知で、聞き取りの姿勢が見えません。' }, { id: 'h3', text: '細かい数字は、会議で話します。', good: false, why: '先に数字がないと、議論が始まりません。' }] },
      { id: 'risk', label: '懸念の扱い', options: [{ id: 'r1', text: '想定を超える混雑の可能性があります。判断基準を、本日の会議で各部署と決めたいと考えています。', good: true, why: '不確かさを正直に示し、一緒に決める姿勢です。' }, { id: 'r2', text: '想定内の混雑に収まる見込みです。', good: false, why: '断定は、外れたとき信用を失います。' }, { id: 'r3', text: '混雑への対応は、各部署の責任でお願いします。', good: false, why: '責任の押し付けは連携を壊します。' }] },
      { id: 'ask', label: 'お願い', options: [{ id: 'a1', text: '数字で聞かせてください。人数、時刻、あと何分、の形で。', good: true, why: '共通の形を求めると、判断しやすくなります。' }, { id: 'a2', text: '気づいたことがあれば、いつでも。', good: false, why: '漠然として、動き出しにくい依頼です。' }, { id: 'a3', text: '特にお願いはありません。', good: false, why: '連携のきっかけを閉じています。' }] }
    ],
    results: [{ min: 66, goto: 'ch7.p_cmp_good', effects: [ev('accuracy', 3), ev('teamwork', 2), set('ch7.p_doc_good')] }, { min: 34, goto: 'ch7.p_cmp_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch7.p_cmp_bad', effects: [ev('accuracy', -1)] }], view: PV(['sawada']) };
  line('ch7.p_cmp_good', [['sawada', 'これなら会議が、承認の場じゃなく相談の場になる。去年に欲しかった。', 'smile']], 'ch7.p_brk', { view: PV(['sawada']) });
  line('ch7.p_cmp_mid', [['sawada', '断定は避けて。「見込み」を正直に書くのが、計画の誠実さ。']], 'ch7.p_brk', { view: PV(['sawada']) });
  line('ch7.p_cmp_bad', [['sawada', '強く出すぎ。計画は、現場に頼まれて動かすものよ。書き直し。', 'serious']], 'ch7.p_brk', { view: PV(['sawada']) });
  line('ch7.p_brk', [
    '17時30分。休憩室の窓の向こうで、湾の空が薄い橙になる。',
    ['sawada', '駅に八年いました。ホームで満員を見送りながら、「このダイヤを作った奴は、この景色を見てるのか」と思ってた。'],
    ['player', '今は、作る側ですね。'],
    ['sawada', '去年、その景色を私が作った。黒い線は、私の悔しさです。…お茶、冷めますよ。', 'smile']
  ], 'ch7.p_brk_e', { effects: [{ clock: { minute: hm(17, 30) } }, log('計画課で休憩（45分）', 'work')], view: PV(['sawada'], '17:30 休憩室') });
  fx('ch7.p_brk_e', [{ clock: { minute: hm(18, 15) } }, ev('safety', 1), rel('sawada', 1, 2)], 'ch7.p_mtg');
  line('ch7.p_mtg', [
    '会議室。壁のスクリーンで、赤い線が、四つの部署の視線を浴びている。',
    ['shiraishi', '駅から一つ。入場規制の基準を、数字で。'],
    ['hamaguchi', '指令から。遅れたとき、後続をどうするか。'],
    ['tachibana', '基地。予備は一本。出す条件がある。早く言え。'],
    ['sawada', '全部は時間が足りない。{player}さん、先に答える順を。']
  ], 'ch7.p_link_0', { view: v25('office', ['sawada', 'shiraishi', 'hamaguchi', 'tachibana'], '18:15 会議室') });
  fx('ch7.p_link_0', [{ clock: { minute: hm(18, 40) } }], 'ch7.p_link');
  linkLoop('ch7.p_link', '会議で、先に答えを出す懸念は？（三つまで）', PV(['sawada']), [
    ['stat', '駅の懸念：入場規制の基準を数字で決める', 'ch7.p_l_stat', 'ch7.p_co_stat'],
    ['disp', '指令の懸念：遅れたときの後続の扱いを決める', 'ch7.p_l_disp', 'ch7.p_co_disp'],
    ['depot', '基地の懸念：予備編成を出す条件と期限を決める', 'ch7.p_l_depot', 'ch7.p_co_depot'],
    ['guard', '警備の懸念：広場の列の長さと合図を決める', 'ch7.p_l_guard', 'ch7.p_co_guard']
  ], 'ch7.p_peak', hm(19, 40));
  line('ch7.p_l_stat', [
    ['shiraishi', '八割で準備、九割で規制。数字で決まれば、現場は迷わない。'],
    ['sawada', '案に書きます。指令にも同じ数字を。'],
    ['shiraishi', '去年は、この数字がなかった。…覚えている顔が、何人かいる。']
  ], 'ch7.p_l_stat_e', { view: v25('office', ['sawada', 'shiraishi'], '18:50 会議室') });
  fx('ch7.p_l_stat_e', [set('ch7.p_co_stat'), time(25), rel('shiraishi', 1, 2), log('入場規制の基準を、駅と数字で決めた', 'work')], 'ch7.p_link');
  line('ch7.p_l_disp', [
    ['hamaguchi', '二分遅れまでは乗降で吸収。三分超えたら、後続を手前で待機。線引きを案に。'],
    ['sawada', '入れます。二分と三分。'],
    ['hamaguchi', '線があれば、一人で背負わなくて済む。']
  ], 'ch7.p_l_disp_e', { view: v25('office', ['sawada', 'hamaguchi'], '18:55 会議室') });
  fx('ch7.p_l_disp_e', [set('ch7.p_co_disp'), time(25), rel('hamaguchi', 1, 1), log('遅れたときの後続の扱いを、指令と決めた', 'work')], 'ch7.p_link');
  line('ch7.p_l_depot', [
    ['tachibana', '20時までに「出す」と言え。過ぎたら整備が間に合わん。'],
    ['sawada', '20時を期限に入れます。'],
    ['tachibana', '情報の流れる向きを、一つに決めろ。無駄が減る。']
  ], 'ch7.p_l_depot_e', { view: v25('office', ['sawada', 'tachibana'], '19:00 会議室') });
  fx('ch7.p_l_depot_e', [set('ch7.p_co_depot'), time(25), rel('tachibana', 1, 1), log('予備編成の判断期限を、基地と決めた', 'work')], 'ch7.p_link');
  line('ch7.p_l_guard', [
    ['tsutsui', '会議に呼ばれたのは初めてだ。…列の端がテープを越えたら、無線を入れる。止めてほしい時は、手を横に振る。'],
    ['sawada', 'その合図も案に書きます。駅と計画課へ、同時に。'],
    ['tsutsui', '足りないところを言える場所に、呼ばれた。悪くない。', 'smile']
  ], 'ch7.p_l_guard_e', { view: v25('office', ['sawada', 'tsutsui'], '19:05 会議室') });
  fx('ch7.p_l_guard_e', [set('ch7.p_co_guard'), time(25), rel('sawada', 1, 1), log('警備の合図を、案の判断材料に加えた', 'work')], 'ch7.p_link');

  line('ch7.p_peak', [
    '20時30分。電話の数字が、案の線を、追い越した。',
    ['shiraishi', '（電話）階段、八割超え。想定では、今は六割のはずだ。人の出が、早い。'],
    ['sawada', '…想定を超えた。判断会議を。{player}さん、意見を。'],
    ['sawada', '三本のまま間隔を守り、規制で運ぶか。四本目を増発して、詰めて流すか。']
  ], 'ch7.p_choice', { effects: [{ clock: { minute: hm(20, 30) } }, log('20時30分 人の出が想定を超える', 'work')], view: PV(['sawada'], '20:30 判断会議') });
  choice('ch7.p_choice', 'ダイヤについて、どう意見を述べる？', [
    opt('limit', '三本のまま間隔を守る。入場規制を前提に、安全の余裕を取る', 'ch7.p_lim_b', { tone: 'careful', effects: [set('ch7.limited')], hint: '間隔は守れる。外の待ち時間が延びる' }),
    opt('flowed', '四本目を増発し、間隔を詰めて、人の流れを止めずに運ぶ', 'ch7.p_flo_b', { tone: 'risky', effects: [set('ch7.flowed')], hint: '待ちを減らせる。基地・指令・乗務員の備えが前提' })
  ], { important: true, timeLimit: 45, defaultOption: 'limit', view: PV(['sawada']) });
  branch('ch7.p_lim_b', [[ALL(F('ch7.p_co_stat'), F('ch7.p_co_guard')), 'ch7.p_lim_good']], 'ch7.p_lim_rough');
  line('ch7.p_lim_good', [
    ['player', '三本のまま、規制で。基準は八割と九割で決まっています。'],
    ['sawada', '駅へ。九割で規制、基準どおり。', 'serious'],
    ['shiraishi', '（電話）準備は八割から始めてる。広場はテープの内側だ。'],
    ['tsutsui', '（電話）水も配ってる。待たされても、荒れてない。'],
    '案が、現場の数字と同じ言葉でつながった。判断会議は五分で終わった。誰も一人で背負わなかった。'
  ], 'ch7.p_fin', { effects: [ev('safety', 3), ev('teamwork', 2)], view: PV(['sawada', 'shiraishi'], '20:36 判断会議') });
  line('ch7.p_lim_rough', [
    ['player', '三本のまま、規制で。'],
    ['sawada', '駅へ。入場規制を。', 'serious'],
    ['shiraishi', '（電話）基準の数字が、駅に届いてない。八割か九割か、現場が迷ってる。', 'serious'],
    ['sawada', '…会議で決めきれてなかった。私の落ち度だ。すぐ伝える。', 'worry'],
    '判断は間違っていない。数字で決めてなかった一点が、現場の足元で迷いになる。計画の重さを、体で知った。'
  ], 'ch7.p_fin', { effects: [ev('safety', 1), ev('teamwork', -1)], view: PV(['sawada', 'shiraishi'], '20:36 判断会議') });
  branch('ch7.p_flo_b', [[ALL(F('ch7.p_co_depot'), F('ch7.p_co_disp')), 'ch7.p_flo_good']], 'ch7.p_flo_rough');
  line('ch7.p_flo_good', [
    ['player', '四本目を増発して流しましょう。基地の期限と、指令の線引きは決まっています。'],
    ['sawada', '指令へ。四本目、21時26分で追加。基地へ。予備、出せますか。', 'serious'],
    ['hamaguchi', '（電話）二分と三分の線引きがある。四本目、受けられる。'],
    ['tachibana', '（電話）20時までに言われてた。整備は済んでる。21時20分に出す。'],
    '決めておいた数字と、約束した時刻が、一本の線になる。四本目が、時刻図表に、すっと加わった。'
  ], 'ch7.p_fin', { effects: [ev('teamwork', 3), ev('safety', 1)], view: PV(['sawada', 'hamaguchi'], '20:36 判断会議') });
  line('ch7.p_flo_rough', [
    ['player', '四本目を増発して、流しましょう。'],
    ['sawada', '基地へ。予備、出せますか。', 'serious'],
    ['tachibana', '（電話）20時までに言えと言ったはずだ。整備してない。間に合わん。', 'serious'],
    ['hamaguchi', '（電話）線引きも未決。増発は受けられない。'],
    '案が、現場の約束に追いついていなかった。増発は見送り、三本のまま、駅が流して耐えることになった。'
  ], 'ch7.p_fin', { effects: [ev('teamwork', -1), set('ch7.p_catchup')], view: PV(['sawada', 'tachibana'], '20:36 判断会議') });
  line('ch7.p_fin', [
    '21時30分。時刻図表の赤い案の線に、実績の線が、重なっていく。',
    ['sawada', '案が現場で形になった夜は、ほんの少しだけ誇らしい。ほんの少し。', 'smile'],
    ['player', '去年の黒い線は、消さないんですね。'],
    ['sawada', '消さない。あれがないと、今夜の数字は、決まらなかったから。']
  ], 'ch7.p_end', { effects: [{ clock: { minute: hm(21, 30) } }], view: PV(['sawada'], '21:30 資料室') });
  fx('ch7.p_end', [set('ch7.route_done_planning'), tl('8月14日 輸送計画課から、臨時ダイヤの説明と合意づくりを支えた'), log('輸送計画課での勤務を終える', 'work')], 'ch7.p_coord_b');
  branch('ch7.p_coord_b', [[anyThree(['ch7.p_co_stat', 'ch7.p_co_disp', 'ch7.p_co_depot', 'ch7.p_co_guard']), 'ch7.p_coord_yes']], 'ch7.p_back');
  fx('ch7.p_coord_yes', [set('ch7.coordinated'), rel('sawada', 2, 2), ev('teamwork', 4), tl('8月14日 駅・指令・基地・警備の懸念を、数字で合意できた')], 'ch7.p_back');
  line('ch7.p_back', [['sawada', '勤務はここまで。駅へ戻って、白石さんに直接、聞いておいで。']], 'ch7.back_hi', { effects: [{ clock: { minute: hm(21, 40) } }], view: PV(['sawada'], '21:40 資料室を出る') });

  // 駅へ戻る夜道：どのルートでも、ひなたと短く出会う（第8章へ渡す約束）
  line('ch7.back_hi', [
    '夜の青嶺中央駅。人の熱が、まだ床に残っている。',
    ['hinata', '（母親の手をつないだまま、団扇を振る）えきいんさん！ まだ、おしごと？'],
    ['player', 'あと少し。…君は、もう寝る時間だよ。'],
    ['hinata', 'わたし、ひなた。あきに、クラスでけんがくに来るから、そのとき、ね！', 'smile'],
    '団扇の裏に、油性ペンで「ひなた」。女の子は、眠そうな目で、手を横に振って行った。'
  ], 'ch7.back_hi_e', { view: v3('concourse', '21:45 コンコース') });
  fx('ch7.back_hi_e', [set('ch7.hinata_seed'), rel('hinata', 1, 1), tl('8月14日 夜の駅で、ひなたと約束した')], 'ch7.review');

  // ================= 合流：引継ぎ（どのルートでも同じ駅事務室）=================
  line('ch7.review', [
    '22時。最後の臨時が去って、ホームの照明が、半分落ちた。',
    ['shiraishi', '座れ。一日の最後に、一つだけ聞く。今夜の判断を、自分の言葉で。'],
    ['kubota', '記録は私が整理します。…麦茶、まだ氷が残ってます。']
  ], 'ch7.rv_b', { view: OV(['shiraishi', 'kubota'], '22:00 駅事務室 引継ぎ'), effects: [time(5)] });
  branch('ch7.rv_b', [[F('ch7.limited'), 'ch7.rv_lim']], 'ch7.rv_flo');
  line('ch7.rv_lim', [
    ['shiraishi', '止める判断は、恨まれる判断だ。待たされた人は、君を恨んだかもしれん。'],
    ['player', '押し合いが起きる前に、止めたかったんです。'],
    ['shiraishi', 'その理由が言えるなら、間違いじゃない。止めたあとの、待つ人のケアまで含めて規制だ。'],
    ['shiraishi', '止める時は、こう。（右手をぱたぱたと横に振る）笛より静かで、よく届く。']
  ], 'ch7.rv_c', { view: OV(['shiraishi', 'kubota']) });
  line('ch7.rv_flo', [
    ['shiraishi', '止めない判断は、勇気がいる。止めたほうが責任は軽く見えるからだ。'],
    ['player', '一瞬、危ない場面もありました。'],
    ['shiraishi', 'その「危なかった」を書け。成功の裏の紙一重を残さんと、次の奴が同じ綱渡りをする。'],
    ['shiraishi', '止める、も、止めない、も使える駅員になれ。止める時は、こう。（右手をぱたぱたと横に）']
  ], 'ch7.rv_c', { view: OV(['shiraishi', 'kubota']) });
  branch('ch7.rv_c', [[F('ch7.coordinated'), 'ch7.rv_co']], 'ch7.rv_nco');
  line('ch7.rv_co', [
    ['hamaguchi', '（電話）浜口。今夜は、数字が早く届いた。おかげで、列車の調整がしやすかった。'],
    ['hamaguchi', '確定と見込みを分けてくれる人は、貴重。また。', 'smile'],
    ['shiraishi', '連絡役が、一枚の絵を作った。今夜の成果は、それだ。']
  ], 'ch7.rv_p1', { view: OV(['hamaguchi', 'shiraishi']) });
  line('ch7.rv_nco', [
    ['hamaguchi', '（電話）浜口。今夜、一部、連絡に抜けがあった。責めない。次は、先に聞いて。'],
    ['shiraishi', '回るだけでは足りん。聞いたことを、別の持ち場に渡す。そこまでが仕事だ。']
  ], 'ch7.rv_p1', { view: OV(['hamaguchi', 'shiraishi']) });
  // 合流後：前章までの選択と、今夜通ったルートを読む短い場面
  branch('ch7.rv_p1', [[F('ch4.secret_kept'), 'ch7.rv_sec'], [F('ch4.trust_built'), 'ch7.rv_trust']], 'ch7.rv_p2');
  line('ch7.rv_sec', [['kubota', '春に預かった「あの件」、まだ誰にも話してませんね。重くなったら、半分持ちます。', 'smile']], 'ch7.rv_p2', { view: OV(['kubota']) });
  line('ch7.rv_trust', [['kubota', '今夜、誰も「この人は誰だ」と言いませんでした。春からの信頼が、電話の向こうで効いたんです。', 'smile']], 'ch7.rv_p2', { view: OV(['kubota']) });
  branch('ch7.rv_p2', [[F('ch3.honest'), 'ch7.rv_hon'], [F('ch3.pushed'), 'ch7.rv_push']], 'ch7.rv_route');
  line('ch7.rv_hon', [['shiraishi', '三月、君は「分からない」と正直に言った。今夜も、聞き返すことを恥じなかったな。']], 'ch7.rv_route', { view: OV(['shiraishi']) });
  line('ch7.rv_push', [['shiraishi', '君は前に出る力がある。長所だ。だが今夜みたいな日は、つなぐほうが効くこともある。']], 'ch7.rv_route', { view: OV(['shiraishi']) });
  branch('ch7.rv_route', [[F('ch7.route_done_depot'), 'ch7.rv_r_d'], [F('ch7.route_done_dispatch'), 'ch7.rv_r_x'], [F('ch7.route_done_planning'), 'ch7.rv_r_p']], 'ch7.rv_r_s');
  line('ch7.rv_r_s', [['shiraishi', '今夜の君は、いちばん前に立っていた。駅の最前線の重さと誇りを、一晩で見たはずだ。']], 'ch7.rv_choice', { view: OV(['shiraishi']) });
  line('ch7.rv_r_d', [['shiraishi', '検修長から電話があった。「あいつは、見送る目を持っている」。…あの人が人を褒めるのは、珍しい。']], 'ch7.rv_choice', { view: OV(['shiraishi']) });
  line('ch7.rv_r_x', [['shiraishi', '浜口さんの声が、今夜は落ち着いていた。誰かが、材料を整えていたからだ。']], 'ch7.rv_choice', { view: OV(['shiraishi']) });
  line('ch7.rv_r_p', [['shiraishi', '沢田さんの数字に、今夜は何度も救われた。ダイヤを作る人が、現場の声を聞いてくれると、助かる。']], 'ch7.rv_choice', { view: OV(['shiraishi']) });
  choice('ch7.rv_choice', '今夜の記録に、いちばん残したいことは？', [
    opt('proc', '連携先ごとの「聞くこと・伝えること」を、手順にまとめる', 'ch7.closing', { tone: 'careful', effects: [set('ch7.note_proc'), ev('accuracy', 2)] }),
    opt('limit', '規制を判断する目安（人数・時刻・合図）を、数字で決めておく', 'ch7.closing', { tone: 'careful', effects: [set('ch7.note_limit'), ev('safety', 2)] }),
    opt('care', '外で待つ人と働く人の体調を守る手立て（水・休憩・交代）を残す', 'ch7.closing', { tone: 'caring', effects: [set('ch7.note_care'), ev('service', 2)] })
  ], { view: OV(['shiraishi', 'kubota']) });
  line('ch7.closing', [
    ['shiraishi', '22時15分。帰れ。明日は明け休みだ。'],
    ['kubota', '休憩を取って、よかったですよね。あの45分が、夜の判断を作りました。', 'smile'],
    ['shiraishi', '花火は、来年も来る。その時は、君が後輩に今夜の話をする番だ。']
  ], 'ch7.cl_b', { view: OV(['shiraishi', 'kubota'], '22:10 駅事務室') });
  branch('ch7.cl_b', [[F('ch7.route_done_station'), 'ch7.cl_hi'], [F('ch7.route_done_depot'), 'ch7.cl_d'], [F('ch7.route_done_dispatch'), 'ch7.cl_x'], [F('ch7.route_done_planning'), 'ch7.cl_p']], 'ch7.end');
  line('ch7.cl_hi', ['事務室を出ると、広場に団扇が一つ、落ちていた。裏に「ひなた」。拾い上げると、まだ少し、湿った熱が残っていた。'], 'ch7.end', { effects: [set('ch7.found_uchiwa')] });
  line('ch7.cl_d', ['駅を出ると、基地の方角の空に、ほのかな灯り。見送った三本の、最後の光に見えた。'], 'ch7.end');
  line('ch7.cl_x', ['駅を出ても、耳の奥で、呼び出し音が鳴っている気がした。声の向こうの顔が、浮かんでは消えた。'], 'ch7.end');
  line('ch7.cl_p', ['駅を出る。手の中の時刻図表のコピーが、汗で柔らかくなっていた。線の一本一本が、誰かの帰り道だった。'], 'ch7.end');

  N['ch7.end'] = { id: 'ch7.end', type: 'end', chapter: 'ch7', title: '第7章 夏の臨時列車', nextChapter: 'ch8',
    summary: '花火の夜、限界の場面で、止める判断か、流す判断かを選んだ。駅・基地・指令・計画のどの場所に立っても、持ち寄った情報が、その夜の安全と待つ人の時間を変えた。選んだ判断は、以降の章に残る。',
    effects: [tl('8月14日 花火の夜の勤務を終える'), log('第7章を終了', 'chapter')] };
}
