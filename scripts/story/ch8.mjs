// R7 第8章「ホームの声」（9月中旬の水曜）。
// 構造：穏やかな群像。小学生の社会科見学（または説明会）の受入れと、高齢の常連の小さな異変が重なる一日。会話中心でハブは軽い。
// モチーフ：「かん、かん」と床を叩く杖の音。前ぶれ → 見つける → 拾えたか拾えなかったかで、帰り際の景色が変わる。
// 志望ルート（第6章の ch6.wish_*）で中盤が別物：station=駅の見学受入れ／depot=基地の見学案内／dispatch=指令室の見学対応／planning=地域向け説明会。
// 後の章へ渡すフラグ：ch8.tour_done / ch8.elder_helped / ch8.route_done_station|depot|dispatch|planning
export default function ch8(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tl, log, time, F, NF, ANY, ALL, T, hm, v3, v25, mini, hub, P, res3 } = k;

  characters.wakabayashi = characters.wakabayashi ?? { id: 'wakabayashi', name: '若林 里奈', kana: 'わかばやし りな', role: '小学校の教諭（3年2組）', dept: 'none', age: 33, years: 0, uniform: '#5a7a6a', hair: '#2b2118', skin: '#f0cfae', trait: '子どもの「間」を待てる。段取りには厳しい。', bio: '青浜第二小学校の3年担任。今日の社会科見学の引率。', gender: 'f', accessory: 'bag' };
  characters.daichi = characters.daichi ?? { id: 'daichi', name: '大地', kana: 'だいち', role: '小学3年生', dept: 'none', age: 8, years: 0, uniform: '#3a6a9a', hair: '#1c1c28', skin: '#efc9a6', trait: '質問が止まらない。声が大きい。', bio: '電車が好きで、何でも「なんで？」と聞く。', gender: 'm', accessory: 'bag' };
  characters.mio = characters.mio ?? { id: 'mio', name: '美緒', kana: 'みお', role: '小学3年生', dept: 'none', age: 8, years: 0, uniform: '#b0607a', hair: '#3a2a22', skin: '#f2d3b8', trait: 'とても小さな声で話す。よく見ている。', bio: '人前で話すのが苦手だが、気づく力が強い。', gender: 'f', accessory: 'none' };
  characters.sawada = characters.sawada ?? { id: 'sawada', name: '沢田 慎一', kana: 'さわだ しんいち', role: '輸送計画課 課長補佐', dept: 'planning', age: 44, years: 20, uniform: '#3a4a5e', hair: '#2a2a2a', skin: '#e8c8a4', trait: '数字で語る。去年の失敗を、まだ引きずっている。', bio: 'ダイヤと需要予測を担当。', gender: 'm', accessory: 'glasses' };

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
  const task3 = (id, o) => {
    N[id] = { id, type: 'task', kind: o.kind, title: o.title, intro: o.hint, config: o.config, results: res3(id + '_good', id + '_mid', id + '_bad', o.ge ?? [ev('accuracy', 3)], o.me ?? [ev('accuracy', 1)], o.be ?? [ev('accuracy', -1)]), view: o.view };
    line(id + '_good', [[o.who, o.good, 'smile']], o.next, { view: o.view });
    line(id + '_mid', [[o.who, o.mid]], o.next, { view: o.view });
    line(id + '_bad', [[o.who, o.bad, 'serious']], o.next, { view: o.view });
  };
  const OV = (who, cap) => v25('office', who, cap);
  const DV = (who, cap) => v25('depot', who, cap);
  const XV = (who, cap) => v25('office', who, cap ?? '輸送指令室');
  const PV = (who, cap) => v25('office', who, cap ?? '地区センター 会議室');

  const RL = (char, key, op, val) => ({ rel: { char, key, op, val } });
  const chain = (pre, next, items, view) => items.forEach(([cond, lines], i) => { const nx = i + 1 < items.length ? pre + (i + 1) : next; branch(pre + i, [[cond, pre + i + 'y']], nx); line(pre + i + 'y', lines, nx, { view }); });
  // 第7章の夏の判断を、朝の場面で拾う（ルートごとに話し手が違う）。結果は、その夜に起きたことで語る。
  const ref = (pre, who, view, next) => {
    branch(pre, [[F('ch7.hesitated'), pre + '_h'], [F('ch7.limited'), pre + '_l'], [F('ch7.flowed'), pre + '_f']], next);
    line(pre + '_h', [[who, '夏の夜、君は、決められなかったな。…今日は、決める場面が来る。先に腹を決めておけ。']], next, { view });
    line(pre + '_l', [[who, '夏の花火、止めたな。待たされた人の顔は、君も見ただろう。…あの顔を、今日も、思い出せ。']], next, { view });
    line(pre + '_f', [[who, '夏の花火、止めずに運んだな。紙一重だった。今日は、確かめてから、動け。']], next, { view });
  };

  branch('ch8.open', [[F('ch6.wish_depot'), 'ch8.d_open'], [F('ch6.wish_dispatch'), 'ch8.x_open'], [F('ch6.wish_planning'), 'ch8.p_open']], 'ch8.s_open', { effects: [{ clock: { addDay: 32, minute: hm(8, 30) } }, log('第8章 ホームの声', 'chapter')] });

  // ======================================================================
  // 【駅ルート】 軽いハブ → 見学（ホーム）→ 高齢の方の異変
  // ======================================================================
  line('ch8.s_open', [
    '事務室の机に、黄色い帽子が二十七個。ぜんぶ、小さい。',
    ['shiraishi', '今朝十時、小学3年生が来る。帽子は先生の忘れ物ではない。予備だ。'],
    ['kubota', 'B班は{player}さんです。二十七人のうち、七人は走ります。'],
    ['shiraishi', '水曜は、通院の常連さんも来る日だ。野村さんと梶原さん。'],
    ['kubota', '今日の標語は「声を拾う」。大きな声より、小さい声のほうを。'],
    ['shiraishi', '二つが重なったら、どちらを取るか自分で決めろ。その決め方が、駅員の形になる。']
  ], 'ch8.s_ref', { effects: [tl('9月15日 社会科見学の受入れ。B班を担当')], view: OV(['shiraishi', 'kubota'], '9月15日（水） 8:30 駅事務室') });
  ref('ch8.s_ref', 'shiraishi', OV(['shiraishi']), 'ch8.s_ev0');
  // 夏の夜の続き：はがき・物・噂（客演の再登場）
  chain('ch8.s_ev', 'ch8.brief', [
    [F('ch7.ogawa_thanks'), [['kubota', '小川さんから、はがきです。娘さんの字で、「えきいんさんへ」。青いワンピースの絵が、描いてあります。', 'smile']]],
    [F('ch7.ogawa_unheard'), [['kubota', '小川さんのお嬢さんが、先月、定期を作りに来ました。お父さんは、改札の外で、待っていたそうです。…こちらを見ずに。']]],
    [ANY(F('ch7.ogawa_hurry'), F('ch7.ogawa_rule')), [['kubota', '小川さんは、あの夜のことは、何も。…「間に合う」と言われた側は、案外、覚えているものです。']]],
    [F('ch7.inc_plaza'), [['shiraishi', '広場の遊軍の件、警備会社に、人員の見直しを出しておいた。筒井さんの膝は、診断書つきで通った。']]],
    [F('ch7.mizuki_helped'), [['shiraishi', '水城が、先週、駅に来た。耳栓を一つ、置いていった。「ベルの日に、誰かが使えるように」と。']]],
    [F('ch7.haha_helped'), [['kubota', '階段の母親、今朝、ベビーカーで来ていました。エレベーターの場所を、迷わず。…声をかけると、深く、頭を下げて。']]]
  ], OV(['shiraishi', 'kubota'], '8:40 駅事務室'));
  fx('ch8.brief', [set('ch8.brief'), log('社会科見学の受入れ準備が始まる', 'work')], 'ch8.hub');
  hub('ch8', {
    title: '青嶺中央駅 社会科見学の朝（9月15日・水）',
    hint: '10時の見学までの準備の時間です。経路を決め、安全を点検し、ホームの「音」に耳を慣らし、常連の方々とも話しておきましょう。',
    timed: [{ id: 'tour', at: hm(10, 0), goto: 'ch8.s_tour_1' }],
    goals: [
      { id: 'g_plan', label: '（準備）見学の経路を決める', when: F('ch8.plan_done'), optional: true },
      { id: 'g_listen', label: '（準備）ホームの音に耳を慣らす', when: F('ch8.listen_done'), optional: true },
      { id: 'g_check', label: '（準備）見学の安全を点検する', when: F('ch8.check_done'), optional: true },
      { id: 'g_kaji', label: '（会話）常連の梶原さんに挨拶する', when: F('ch8.kaji_met'), optional: true },
      { id: 'g_tour', label: '見学の開始（10:00）', when: F('ch8.tour_started') }
    ],
    exit: { label: '準備を終えて、見学を迎える（9:30以降）', requires: ALL(F('ch8.brief'), T('>=', hm(9, 30))), goto: 'ch8.s_tour_1' }
  });
  const R8 = F('ch8.brief');
  const GRID_PLAN = ['S...#....', '.##.A.##.', '..~...B..', '.#####.#G', '.........'];
  mini({ ch: 'ch8', key: 'plan', req: R8, who: 'shiraishi', object: 'terminal', from: [8, 40], to: [9, 50], label: '子どもたちの見学経路を組む', goal: '（準備）見学の経路', title: '見学の経路', cam: 'npc:shiraishi',
    hint: '起点から着点まで、券売機の見学地点（A）と、安全な待機位置（B）を必ず通る道をつなぎます。階段・壁（黒）は通れません。しま模様は混雑で遅い道です。', kind: 'route',
    intro: ['二十七人が歩く。詰まらず、危なくなく、全員の目が届く道を。'],
    config: { grid: GRID_PLAN, must: ['A', 'B'], best: bestRoute(GRID_PLAN, ['A', 'B']), legend: { '#': '階段・壁（通れない）', '~': '混雑する通路（遅い）', A: '券売機の見学地点', B: '安全な待機位置', S: '起点（改札）', G: 'ホーム' } },
    good: '…いい道だ。子どもの足の遅さを、よく見ている。', mid: '着けるが遠い。子どもは、大人の三倍、寄り道する。', bad: '待機位置がない。組み直しだ。', ge: [ev('accuracy', 2), ev('safety', 2), set('ch8.route_ok')], be: [ev('safety', -1)], log: '見学の経路を組む', min: 20 });
  mini({ ch: 'ch8', key: 'listen', req: R8, who: 'kubota', object: 'tactile', from: [8, 50], to: [9, 50], label: 'ホームで、耳をすます練習をする', goal: '（準備）ホームの音を聞く', title: 'ホームの音を聞く', cam: 'follow',
    hint: 'ホームで聞こえた音の順番を覚え、同じ順に入力します。', kind: 'memory',
    intro: ['目を閉じてください。順番に、音が流れます。杖の音は、最後に。'],
    config: { sequence: ['ブレーキの音', 'ドアチャイム', '発車メロディ', '杖が床を叩く音'], pool: ['ブレーキの音', 'ドアチャイム', '発車メロディ', '警笛', '杖が床を叩く音', '足音', '放送', '傘の音'], showMs: 5200, showLabel: 'ホームで聞こえた音（順番）' },
    good: '最後の小さな音まで拾えました。…今日は、それが大事です。', mid: '大きな音は拾えました。小さい音のほうに、大事なことが。', bad: 'もう一度、目を閉じて。一つずつ。', ge: [ev('service', 2), ev('safety', 1), set('ch8.listen_ok')], log: 'ホームの音を聞き分ける', min: 15 });
  mini({ ch: 'ch8', key: 'check', req: R8, who: 'kubota', object: 'elevator', from: [9, 0], to: [9, 55], label: '子どもたちが歩く場所の安全を点検する', goal: '（準備）見学の安全点検', title: '見学の安全点検', cam: 'follow',
    hint: '子どもの目線で、危ない場所を3つ見つけてタップします。', kind: 'find',
    intro: ['背を低くして見てください。子どもは、足元と手の高さを見ます。'],
    config: { scene: 'platform', seconds: 36, props: [P(0.05, 0.4, 0.14, 0.2, '#6b7280', 'ベンチ'), P(0.7, 0.35, 0.12, 0.25, '#7a8aa0', '柱'), P(0, 0.62, 1, 0.07, '#e5b800')], spots: [
      { id: 'cord', x: 0.3, y: 0.74, label: '自動販売機の電源コードが通路にはみ出している' }, { id: 'rope', x: 0.56, y: 0.46, label: '立入禁止のロープが片側外れかかっている' }, { id: 'step', x: 0.84, y: 0.7, label: '床の段差に色の目印がない' }, { id: 'ok', x: 0.14, y: 0.52, real: false, label: 'ベンチは通行の妨げになっていません' }] },
    good: '全部ですか。…腰が痛くなった甲斐が、ありました。', mid: '一つ残りました。私が戻って、背をかがめます。', bad: '足元が残ってます。もう一周、一緒に。', ge: [ev('safety', 3)], be: [ev('safety', -2)], log: '見学の安全を点検', min: 15 });

  N['ch8.hub'].interactions.push({ id: 'kaji', object: 'kajiwara', label: '常連の梶原さんに挨拶する', goto: 'ch8.s_kaji', requires: ALL(R8, T('>=', hm(8, 50)), T('<', hm(9, 55))), once: true, icon: '👵' });
  line('ch8.s_kaji', [
    ['kajiwara', 'あら、駅員さん。水曜は、お医者さんの日。時間どおりよ。', 'smile'],
    ['kajiwara', 'ところで、野村さんは？ 昨日の電話で、朝は食べない主義だって。薬は食後なのに。'],
    ['player', '頑固な方なんですね。'],
    ['kajiwara', '困っていても、「いいよ」としか言わない人なの。…顔色と、杖の音を見ててあげて。年寄りの勝手なお願いだけど。', 'worry']
  ], 'ch8.s_kaji_e', { view: OV(['kajiwara'], '9:00 コンコース') });
  fx('ch8.s_kaji_e', [set('ch8.kaji_told'), set('ch8.kaji_met'), rel('kajiwara', 1, 2), time(10), log('梶原さんから、野村さんの様子を聞く', 'work')], 'ch8.hub');
  N['ch8.hub'].interactions.push({ id: 'sakai', object: 'sakai', label: '売店の坂井さんに挨拶する', goto: 'ch8.s_sakai', requires: ALL(R8, T('>=', hm(9, 0)), T('<', hm(9, 55))), once: true, icon: '🍬' });
  line('ch8.s_sakai', [
    ['sakai', 'ラムネ、箱で仕入れたのよ。見学のごほうび。', 'smile'],
    ['sakai', 'ここだけの話、気分の悪い人にも効くの。糖分がすぐ入るから。'],
    ['player', '野村さん、朝は食べないらしいです。'],
    ['sakai', 'なら、冷蔵庫の手前に一本、別にしておく。いざという時、声をかけて。']
  ], 'ch8.s_sakai_w', { view: OV(['sakai'], '9:15 売店前') });
  branch('ch8.s_sakai_w', [[F('ch7.nomura_water'), 'ch8.s_sakai_w1']], 'ch8.s_sakai_e');
  line('ch8.s_sakai_w1', [['sakai', '花火の夜も、野村さんに水を渡したのよ。「いいよ」って言いながら、全部、飲んだの。…今日は、水じゃなくて、ラムネね。', 'smile']], 'ch8.s_sakai_e', { view: OV(['sakai'], '9:16 売店前') });
  fx('ch8.s_sakai_e', [set('ch8.sakai_ramune'), rel('sakai', 1, 1), time(10), log('坂井さんに、ラムネを取っておいてもらう', 'work')], 'ch8.hub');

  line('ch8.s_tour_1', [
    '10時。改札の向こうから、黄色い帽子の波が来る。',
    ['daichi', 'おねがいしまーす！ ぼく、うんてんしになる！ あと、しつもん、三十こある！', 'smile'],
    ['wakabayashi', '大地くん、順番。先生の旗を見て。'],
    '最後尾の女の子の団扇に、油性ペンで「ひなた」。'
  ], 'ch8.s_hinata_b', { effects: [{ clock: { minute: hm(10, 0) } }, set('ch8.tour_started'), log('10時 社会科見学の受入れ開始', 'work')], view: v3('concourse', '10:00 コンコース') });
  branch('ch8.s_hinata_b', [[F('ch7.hinata_seed'), 'ch8.s_hinata_y']], 'ch8.s_qa1_in');
  line('ch8.s_hinata_y', [
    ['hinata', 'あっ！ 花火の日の、えきいんさん！', 'smile'],
    ['hinata', 'みんなに言ったの。だれも、しんじてくれなかった。'],
    ['player', 'じゃあ、今日、本物の駅員の仕事を見せよう。']
  ], 'ch8.s_hinata_u', { effects: [rel('hinata', 1, 2)], view: v3('concourse', '10:02 コンコース') });
  branch('ch8.s_hinata_u', [[F('ch7.found_uchiwa'), 'ch8.s_hinata_u1']], 'ch8.s_qa1_in');
  line('ch8.s_hinata_u1', [
    ['player', 'これ、広場に落ちてたんだ。…君のだよね。裏に、名前。'],
    ['hinata', 'あっ！ なくしたと思ってた！ …えきいんさん、まほうつかい？', 'smile'],
    '団扇の端に、ひと夏ぶんの汗の跡。それでも、女の子は、胸にぎゅっと抱いた。'
  ], 'ch8.s_qa1_in', { effects: [set('ch8.uchiwa_back'), rel('hinata', 1, 3)], view: v3('concourse', '10:03 コンコース') });
  line('ch8.s_qa1_in', [
    '券売機の前。大地が、いちばん前に飛び出した。',
    ['daichi', 'えきいんさんって、きっぷを切る人でしょ！ おじいちゃんが言ってた！']
  ], 'ch8.s_qa1', { view: v3('vend_close', '10:05 券売機') });
  choice('ch8.s_qa1', '大地くんの質問に、どう答える？', [
    opt('ask', '「昔はね。今はどんな仕事だと思う？ 探してみよう」と問い返す', 'ch8.s_qa1_a', { tone: 'caring', effects: [{ var: { key: 'ch8.listen', add: 2 } }] }),
    opt('tell', '「今は自動改札で、ICカードという仕組みで…」と説明する', 'ch8.s_qa1_b', { tone: 'careful', effects: [{ var: { key: 'ch8.listen', add: 1 } }] }),
    opt('defer', '「大人になったら分かるよ」と切り上げる', 'ch8.s_qa1_c', { tone: 'quick' })
  ], { view: v3('vend_close', '10:05 券売機') });
  line('ch8.s_qa1_a', [
    ['daichi', 'えーと…あっ、あの人、おばあさんに、きっぷ教えてる！'],
    ['player', '正解。「困ってる人を見つける」のが、いちばんの仕事。'],
    ['mio', '（小声で）…ベビーカーの人も、さがしてた。気づいてた。'],
    ['player', '美緒さん、よく見てる。みんなの探したものが、答えだよ。', 'smile']
  ], 'ch8.s_focus', { effects: [ev('service', 2), rel('hinata', 0, 1)], view: v3('concourse', '10:10 コンコース') });
  line('ch8.s_qa1_b', [
    ['player', 'ICカードで、改札機が自動で読むから、切らなくていいんだ。'],
    ['daichi', 'じゃあ、えきいんさんは、なにしてるの？'],
    ['player', 'えーと、お手伝いや、安全のこと…。'],
    ['daichi', 'よくわかんない。', 'worry']
  ], 'ch8.s_focus', { effects: [ev('accuracy', 1)], view: v3('concourse', '10:10 コンコース') });
  line('ch8.s_qa1_c', [
    ['daichi', 'えー！ いま、おしえてよ！ ぼく、いま知りたいの！', 'surprise'],
    ['wakabayashi', '（そっと）子どもの「いま」は、本当に「いま」なんですよ。'],
    '「後で」と言った自分の声が、床に落ちて、ころりと転がった。'
  ], 'ch8.s_focus', { effects: [ev('service', -1)], view: v3('concourse', '10:10 コンコース') });
  choice('ch8.s_focus', '子どもたちに、いちばん伝えたいことは？', [
    opt('safety', '黄色い線の内側が、なぜ大事か（安全）', 'ch8.s_tour_2', { tone: 'careful', effects: [set('ch8.focus_safety'), ev('safety', 1)] }),
    opt('people', '駅員は、困っている人を探す仕事（人）', 'ch8.s_tour_2', { tone: 'caring', effects: [set('ch8.focus_people'), ev('service', 1)] }),
    opt('machine', '電車や設備が、どう動いているか（仕組み）', 'ch8.s_tour_2', { tone: 'neutral', effects: [set('ch8.focus_machine'), ev('accuracy', 1)] })
  ], { important: true, view: v3('concourse', '10:15 コンコース') });
  line('ch8.s_tour_2', [
    '10時35分。ホーム。ブレーキの音に、子どもたちが耳を押さえた。',
    ['daichi', 'うるさーい！ でも、かっこいい！', 'smile'],
    ['mio', '（袖を、小さく引く）…あのおじいさん、ずっと同じところ。電車、のらないのに。'],
    '指の先。ホームの端のベンチで、杖を握った背中が丸まっている。野村さんだ。'
  ], 'ch8.s_find_in', { effects: [{ clock: { minute: hm(10, 35) } }], view: v3('platform', '10:35 ホーム') });
  line('ch8.s_find_in', [
    ['kubota', '（無線）B班、手一杯でしょう。でも、ホームの端の気配に、少しだけ耳を。'],
    '耳を澄ます。ブレーキ、チャイム。その奥で、乾いた小さな音。かん、かん。'
  ], 'ch8.s_find', { view: v3('platform', '10:36 ホーム') });
  N['ch8.s_find'] = { id: 'ch8.s_find', type: 'task', kind: 'find', title: 'ホームで、気配に気づく', intro: 'ホームの絵の中で、いつもと違うところを探してタップします。',
    config: { scene: 'platform', seconds: 30, props: [P(0.05, 0.4, 0.2, 0.22, '#6b7280', 'ベンチ'), P(0.7, 0.35, 0.12, 0.25, '#7a8aa0', '柱'), P(0, 0.62, 1, 0.07, '#e5b800')], spots: [
      { id: 'cane', x: 0.12, y: 0.62, label: 'ベンチの下で、杖が小刻みに床を叩いている' }, { id: 'sweat', x: 0.14, y: 0.46, label: '野村さんの額に汗。外は涼しいのに' }, { id: 'train', x: 0.3, y: 0.52, label: '二本の電車を見送って、同じ位置から動かない' }, { id: 'kids', x: 0.78, y: 0.62, real: false, label: '子どもたちはきちんと整列しています' }] },
    results: res3('ch8.s_find_good', 'ch8.s_find_mid', 'ch8.s_find_bad', [ev('service', 2), ev('safety', 2), set('ch8.noticed_full')], [ev('service', 1)], [ev('service', -1)]), view: v3('platform', '10:36 ホーム') };
  line('ch8.s_find_good', [['player', '（杖の音、額の汗、見送った二本。三つとも、同じことを静かに言っている）']], 'ch8.s_elder_in', { view: v3('platform', '10:38 ホーム') });
  line('ch8.s_find_mid', [['player', '（何かが違う。何かまでは、言葉にならない。でも、気になる）']], 'ch8.s_elder_in', { view: v3('platform', '10:38 ホーム') });
  line('ch8.s_find_bad', [['kubota', '（無線）…野村さん、少し気になります。私はA班で手が離せません。']], 'ch8.s_elder_in', { view: v3('platform', '10:38 ホーム') });
  line('ch8.s_elder_in', [
    ['wakabayashi', '次は先頭車両の運転台です。11時の特急の前に、移動したいです。'],
    '電車に歓声があがる。その陰で、野村さんの手から、杖がかたんと落ちた。拾わない。拾えない。',
    '止めれば、先生の段取りも、子どもたちの楽しみも崩れる。でも、あの手は、杖に届いていない。'
  ], 'ch8.s_el0', { view: v3('platform', '10:42 ホーム') });
  chain('ch8.s_el', 'ch8.s_elder', [
    [F('ch8.kaji_told'), [['player', '（梶原さんの言葉が、耳に戻る。「顔色と、杖の音を、見ててあげて」）']]],
    [F('ch8.noticed_full'), [['player', '（杖の音、額の汗、見送った二本の電車。手がかりは、三つ、揃っていた。見ていた者として、知らなかったとは、言えない）']]]
  ], v3('platform', '10:43 ホーム'));
  choice('ch8.s_elder', '見学の途中で、野村さんの様子が気になる。どうする？', [
    opt('pause', '見学をいったん止めて、野村さんのところへ行く', 'ch8.s_pause_1', { tone: 'caring', effects: [set('ch8.elder_helped')] }),
    opt('keep', '段取りを保ち、後で様子を見に戻ると決める', 'ch8.s_keep_1', { tone: 'careful', effects: [set('ch8.elder_missed')] }),
    opt('silent', '（どうすべきか決められず、声が出ない）', 'ch8.s_sil_1', { tone: 'neutral' })
  ], { important: true, timeLimit: 40, defaultOption: 'silent', view: v3('platform', '10:42 ホーム') });
  line('ch8.s_sil_1', [
    ['player', '（止めるべきか。続けるべきか。杖の音は、まだ、鳴っている）'],
    ['wakabayashi', '（子どもたちの背後で）…あの、杖の方、お加減が。…駅員さん？'],
    '先生の声で、ようやく、足が動く。その間に、杖は、二度、床を叩いて、止まった。'
  ], 'ch8.s_sil_2', { view: v3('platform', '10:44 ホーム') });
  line('ch8.s_sil_2', [
    '隣にしゃがむ。顔色は、さっきより、悪い。',
    ['nomura', '…いいよ、いいよ。…少し、遅かったな。', 'worry'],
    ['shiraishi', '（駆けつけて）医院に連絡する。タクシーも。…{player}。次は、声を、先に出せ。']
  ], 'ch8.s_sil_3', { effects: [rel('nomura', 0, -1), rel('shiraishi', -1, 0)], view: v3('platform', '10:50 ホーム・ベンチ') });
  line('ch8.s_sil_3', [
    ['wakabayashi', '予定が押しました。運転台は、見送ります。バスの時間があるので。'],
    ['daichi', 'えー！ うんてんだい、見たかったのに！', 'surprise'],
    '決めなかった時間の分だけ、誰かの楽しみが、削れた。'
  ], 'ch8.s_tour_end', { effects: [set('ch8.elder_late'), set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '運転台の見学は、今年は叶わなかった' } }, set('ch8.cab_locked')], view: v3('platform', '11:05 ホーム') });
  line('ch8.s_pause_1', [
    ['player', '若林先生、数分ください。ベンチの方の具合が。久保田さんに補助を頼みます。'],
    ['wakabayashi', '（一瞬、眉が動く。子どもたちを見て）…行ってあげてください。'],
    '走らずに、できるだけ早く。杖を拾って、隣にしゃがむ。',
    ['nomura', '…ああ、駅員さん。大丈夫、大丈夫。休んでいただけで。', 'worry'],
    ['player', '汗が出てます。お水を。座ったまま、待っていてください。'],
    ['nomura', '…迷惑を、かけたくないんだ。']
  ], 'ch8.s_pause_b', { view: v3('platform', '10:44 ホーム・ベンチ') });
  branch('ch8.s_pause_b', [[F('ch8.sakai_ramune'), 'ch8.s_pause_r']], 'ch8.s_pause_w');
  line('ch8.s_pause_r', [
    ['sakai', '（走ってきて）取っておいたラムネ。まず、ひと口、ゆっくり。', 'smile'],
    ['nomura', '…甘い。朝、食べてなくてな。薬だけ飲んじまって。'],
    '数分で、野村さんの顔に色が戻った。杖の先の、かりかりという音が、止まった。'
  ], 'ch8.s_pause_c', { effects: [ev('service', 3), rel('nomura', 2, 3), rel('sakai', 1, 1)], view: v3('platform', '10:50 ホーム・ベンチ') });
  line('ch8.s_pause_w', [
    ['player', '（自販機で水を買って戻る）少しずつ、どうぞ。'],
    ['nomura', '…朝、食べてなくてな。薬だけ飲んじまって。'],
    '水だけでは、顔色の戻りが遅い。普段より長い数分を、並んで待った。'
  ], 'ch8.s_pause_c', { effects: [ev('service', 2), rel('nomura', 1, 2)], view: v3('platform', '10:52 ホーム・ベンチ') });
  line('ch8.s_pause_c', [
    ['shiraishi', '（駆けつけて）念のため、近くの医院に連絡します。タクシーも。'],
    ['nomura', '大げさな…。', 'worry'],
    ['player', '野村さんが元気でいてくださることが、私たちの安心です。'],
    ['daichi', '（水筒を、そっと差し出す）おじいちゃん、ぼくの。ちょっとのんで。'],
    ['nomura', '…ありがとうな、坊や。', 'smile'],
    ['wakabayashi', '（子どもたちへ）今日見たのは、電車だけじゃないね。人を、見てるの。']
  ], 'ch8.s_resume_b', { effects: [rel('shiraishi', 1, 2), ev('teamwork', 2)], view: v3('platform', '10:58 ホーム') });
  branch('ch8.s_resume_b', [[F('ch8.route_ok'), 'ch8.s_resume_y']], 'ch8.s_resume_n');
  line('ch8.s_resume_y', [['wakabayashi', '予定は押しましたが、経路を短く組んであったので、運転台は間に合います。'], ['player', '経路を、組んでおいてよかった。']], 'ch8.s_tour_end', { effects: [set('ch8.tour_done'), ev('accuracy', 1)], view: v3('platform', '11:05 ホーム') });
  line('ch8.s_resume_n', [
    ['wakabayashi', '予定が押しました。運転台は、見送ります。バスの時間があるので。'],
    ['daichi', 'えー！ うんてんだい、見たかったのに！', 'surprise'],
    ['mio', '（小声で）…でも、おじいちゃんが元気になったから、いい。']
  ], 'ch8.s_tour_end', { effects: [set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '運転台の見学は、今年は叶わなかった' } }, set('ch8.cab_locked')], view: v3('platform', '11:05 ホーム') });
  line('ch8.s_keep_1', [
    ['player', '（後で、必ず戻る。今は、二十七人が先だ）'],
    ['wakabayashi', '時間どおりで、助かります。運転台へ。'],
    ['daichi', 'うわー、せまい！ ここにすわりたい！'],
    '歓声が、ホームに跳ね返る。その音に、もう一つの音が、かき消される。かん、かん、という、小さな音が。'
  ], 'ch8.s_keep_2', { effects: [{ clock: { minute: hm(10, 55) } }, ev('accuracy', 1), set('ch8.tour_done')], view: v3('platform', '10:55 先頭車両') });
  line('ch8.s_keep_2', [
    '11時05分。見学が終わり、子どもたちがコンコースへ降りていく。',
    ['player', '（急いでホームの端へ。ベンチは、空だった）'],
    ['kubota', '（無線）野村さん、次の電車で。足取りは確かでした。たぶん、大丈夫です。', 'worry'],
    '何もなかったのかもしれない。ただ、あの一歩を踏み出せなかったことが、小石のように残った。ベンチの下に、帽子。'
  ], 'ch8.s_keep_3', { effects: [set('ch8.hat_left')], view: v3('platform', '11:08 ホーム') });
  line('ch8.s_keep_3', [
    '帽子を拾う。内側に、色あせた糸で、「野村」と縫い取りがある。',
    ['kubota', '（無線）券売機の前を通るとき、野村さん、駅員に会釈もしないで。…あの人らしくないです。'],
    '改札の向こうに、杖の背中が、小さくなる。呼び止める言葉を、探している間に、見えなくなった。'
  ], 'ch8.s_tour_end', { effects: [set('ch8.nomura_gone'), { depart: { char: 'nomura', note: '野村さんは、水曜の通院を、別の駅に変えた。帽子だけが残った' } }], view: v3('platform', '11:10 ホーム') });
  line('ch8.s_tour_end', [
    '11時15分。バスの前で、先生が言った。一人だけ、質問していい、と。',
    ['hinata', 'えきいんさんは、「ありがとう」って、いわれる？ いちばんうれしかったのは、なあに？']
  ], 'ch8.s_hi_choice', { effects: [{ clock: { minute: hm(11, 15) } }], view: v3('concourse', '11:15 コンコース') });
  choice('ch8.s_hi_choice', 'ひなたさんに、どう答える？', [
    opt('today', '今日のことを、正直に話す', 'ch8.s_hi_a', { tone: 'honest', effects: [set('ch8.hi_today'), { var: { key: 'ch8.listen', add: 2 } }] }),
    opt('general', '「お客様が、笑って帰ってくれること」と答える', 'ch8.s_hi_b', { tone: 'caring', effects: [set('ch8.hi_general'), { var: { key: 'ch8.listen', add: 1 } }] }),
    opt('ask', '「ひなたさんは、誰に『ありがとう』を言いたい？」と聞き返す', 'ch8.s_hi_c', { tone: 'caring', effects: [set('ch8.hi_ask'), { var: { key: 'ch8.listen', add: 2 } }, rel('hinata', 1, 3)] }),
    opt('silent', '（答えが、見つからない）', 'ch8.s_hi_s', { tone: 'neutral', effects: [set('ch8.hi_silent')] })
  ], { timeLimit: 20, defaultOption: 'silent', view: v3('concourse', '11:15 コンコース') });
  line('ch8.s_hi_s', [['hinata', '…。（うつむいて、団扇の端を、ぎゅっと握る）'], ['wakabayashi', 'ひなたさん、行きましょう。…駅員さん、ありがとうございました。']], 'ch8.s_done', { effects: [rel('hinata', 0, -1)], view: v3('concourse', '11:18 コンコース') });
  line('ch8.s_hi_a', [
    ['player', '今日ね、ベンチに具合の悪いおじいさんがいた。気づいた人と、気づけなかった人がいたかもしれない。'],
    ['player', '「ありがとう」より、気づくことのほうが、大事だと思った。'],
    ['hinata', 'わたし、おばあちゃんが「だいじょうぶ」って言うとき、だいじょうぶじゃないの、わかるよ。', 'smile'],
    ['player', 'それは、駅員の才能だ。']
  ], 'ch8.s_done', { effects: [ev('service', 1)], view: v3('concourse', '11:18 コンコース') });
  line('ch8.s_hi_b', [['player', 'お客様が、笑って帰ってくれること。言われなくても、それがいちばん。'], ['hinata', 'えがお、かっこいい！', 'smile'], ['daichi', 'ぼくも、えきいんさんになる！']], 'ch8.s_done', { view: v3('concourse', '11:18 コンコース') });
  line('ch8.s_hi_c', [
    ['hinata', 'おかあさん。おべんとう、つくってくれるから。…はずかしくて、いえない。'],
    ['player', '言えなくてもいい。気持ちは、顔に出てる。駅員さんは、それを探してる。'],
    ['hinata', 'わたしの顔、みえる？ ほら。', 'smile'],
    ['player', 'うん。ちゃんと見える。']
  ], 'ch8.s_done', { effects: [ev('service', 2)], view: v3('concourse', '11:18 コンコース') });
  fx('ch8.s_done', [set('ch8.route_done_station'), tl('9月15日 駅で、小学生の見学と、常連の方の気配に向き合った'), log('社会科見学の受入れを終える', 'work'), { clock: { minute: hm(12, 20) } }], 'ch8.after');

  // ======================================================================
  // 【基地ルート】 基地の見学案内。OBの野村さんの異変
  // ======================================================================
  line('ch8.d_open', [
    '洗浄線の脇に、ヘルメットが二十八個。いちばん小さいのは、顎ひもがあまっている。',
    ['tachibana', '地元の小学生が来る。案内役は君だ。車両に触れる作業は、させん。'],
    ['tachibana', '手伝いにOBの野村さんが来る。元検修員。七十六。足は悪いが、台車の話をさせたら基地一だ。'],
    ['tachibana', '今日は「声を拾う」日だ。基地の人間は、機械の音ばかり聞く。人の音も聞け。']
  ], 'ch8.d_ref', { effects: [tl('9月15日 基地で、小学生の見学の案内役を担当')], view: DV(['tachibana'], '9月15日（水） 8:30 青浜総合車両センター') });
  ref('ch8.d_ref', 'tachibana', DV(['tachibana']), 'ch8.d_plan_1');
  line('ch8.d_plan_1', [['tachibana', '立入禁止の作業エリアに、一歩も入れるな。洗浄線で止まり、見学窓で台車を見せる。道を組め。']], 'ch8.d_plan', { view: DV(['tachibana']) });
  const GRID_D = ['S...#....', '.##.W.##.', '..~...K..', '.#####.#G', '.........'];
  task3('ch8.d_plan', { kind: 'route', title: '基地の見学経路', hint: '起点から着点まで、洗浄線の見学地点（W）と、検修庫の見学窓（K）を通る経路をつなぎます。作業エリア（黒）は通れません。', who: 'tachibana', next: 'ch8.d_listen_1', view: DV(['tachibana']),
    config: { grid: GRID_D, must: ['W', 'K'], best: bestRoute(GRID_D, ['W', 'K']), legend: { '#': '立入禁止の作業エリア', '~': '台車が通る通路（遅い）', W: '洗浄線の見学地点', K: '検修庫の見学窓', S: '正門', G: '出口' } },
    good: '誰も線を越えん道だ。…ふん、悪くない。', mid: '台車の道を通っている。子どもはそこで立ち止まるぞ。', bad: '見学窓を通らん道は、見学にならん。', ge: [ev('safety', 3), ev('accuracy', 2), set('ch8.route_ok')], be: [ev('safety', -1)] });
  line('ch8.d_listen_1', [['tachibana', '基地には基地の音がある。杖の音は、その日の足の調子を語る。聞け。']], 'ch8.d_listen', { view: DV(['tachibana']) });
  task3('ch8.d_listen', { kind: 'memory', title: '基地の音を聞く', hint: '基地で聞こえた音の順番を覚え、同じ順に入力します。', who: 'tachibana', next: 'ch8.d_check_1', view: DV(['tachibana']),
    config: { sequence: ['空気が抜ける音', 'ハンマーの音', '台車を押す音', '杖が床を打つ音'], pool: ['空気が抜ける音', 'ハンマーの音', '台車を押す音', '杖が床を打つ音', '警笛', '工具箱の音', '放送', '足音'], showMs: 5200, showLabel: '基地で聞こえた音（順番）' },
    good: '耳が育ってきたな。', mid: '大きい音は拾えている。小さいほうに大事なものがある。', bad: '混ざっている。一つずつ聞け。', ge: [ev('service', 2), ev('safety', 1), set('ch8.listen_ok')] });
  line('ch8.d_check_1', [['tachibana', '子どもは、大人が見ん場所を見る。足元を点検しろ。']], 'ch8.d_check', { view: DV(['tachibana']) });
  task3('ch8.d_check', { kind: 'find', title: '見学通路の安全点検', hint: '子どもの目線で、危ない場所を3つ見つけてタップします。', who: 'tachibana', next: 'ch8.d_tour_1', view: DV(['tachibana']),
    config: { scene: 'platform', seconds: 36, props: [P(0.05, 0.4, 0.14, 0.2, '#6b7280', '工具箱'), P(0.7, 0.35, 0.12, 0.25, '#7a8aa0', '柱'), P(0, 0.62, 1, 0.07, '#e5b800')], spots: [
      { id: 'oil', x: 0.3, y: 0.74, label: '通路の床に、油の染みで光る場所がある' }, { id: 'rope', x: 0.56, y: 0.46, label: '立入禁止のチェーンが片側外れている' }, { id: 'edge', x: 0.84, y: 0.7, label: '見学窓の足元の段に、色の目印がない' }, { id: 'ok', x: 0.14, y: 0.52, real: false, label: '工具箱はきちんと片付いています' }] },
    good: '全部見つけた。…子どもの目だ。', mid: '一つ見落とし。もう一周しろ。', bad: '足元が残ってる。直してからだ。', ge: [ev('safety', 3)], be: [ev('safety', -2)] });
  line('ch8.d_tour_1', [
    '10時。正門に、顎ひもを結ぶ小さな手が、二十七組、並んだ。',
    ['daichi', 'これ、でんしゃの、おおきなおふろ！？ すごーい！', 'smile'],
    ['player', '洗浄線だよ。…大地さん、線の内側に。'],
    '列の後ろから、杖の老人が静かに合流する。色あせた作業帽。',
    ['nomura', '…台車の話なら、任せてくれ。昔は毎日、潜ってたからな。']
  ], 'ch8.d_hinata_b', { effects: [{ clock: { minute: hm(10, 0) } }, set('ch8.tour_started'), log('10時 基地の見学受入れ開始', 'work')], view: DV(['daichi', 'nomura'], '10:00 正門') });
  branch('ch8.d_hinata_b', [[F('ch7.hinata_seed'), 'ch8.d_hinata_y']], 'ch8.d_qa1');
  line('ch8.d_hinata_y', [['hinata', '（団扇を振る）あの日の、えきいんさん！ きょうは、きじちの人？', 'smile'], ['player', '覚えててくれたんだ。今日は、駅の裏側を見せるよ。']], 'ch8.d_qa1', { effects: [rel('hinata', 1, 2)], view: DV(['hinata'], '10:02 正門') });
  line('ch8.d_qa1', [
    '洗浄線のガラス越しに、ブラシが回る。',
    ['daichi', 'これ、だれがあらってるの？ ロボット？']
  ], 'ch8.d_qa1_c', { view: DV(['daichi'], '10:10 洗浄線') });
  choice('ch8.d_qa1_c', '大地くんの質問に、どう答える？', [
    opt('ask', '「だれだと思う？ 機械のそばを見てごらん」と問い返す', 'ch8.d_qa1_a', { tone: 'caring', effects: [{ var: { key: 'ch8.listen', add: 2 } }] }),
    opt('tell', '「機械と人の両方。機械を人が見張ってるんだ」と説明する', 'ch8.d_qa1_b', { tone: 'careful', effects: [{ var: { key: 'ch8.listen', add: 1 } }] })
  ], { view: DV(['daichi']) });
  line('ch8.d_qa1_a', [
    ['daichi', 'あっ、スイッチのとこに、ヘルメットの人！'],
    ['mio', '（小声で）…ブラシの音がかわったら、止めるのかな。'],
    ['player', '美緒さん、その通り。基地の人は、音で機械の様子を知るんだ。', 'smile']
  ], 'ch8.d_focus', { effects: [ev('service', 2)], view: DV(['mio'], '10:12 洗浄線') });
  line('ch8.d_qa1_b', [['daichi', 'ふーん。ロボットじゃないんだ。', 'worry'], ['player', '（素っ気なかったかな。問い返してもよかった）']], 'ch8.d_focus', { effects: [ev('accuracy', 1)], view: DV(['daichi'], '10:12 洗浄線') });
  choice('ch8.d_focus', '基地で、いちばん伝えたいことは？', [
    opt('safety', '見えないところで、安全を守る人がいること', 'ch8.d_tour_2', { tone: 'careful', effects: [set('ch8.focus_safety'), ev('safety', 1)] }),
    opt('people', '音や気配で機械の機嫌を聞き分ける、耳と手のこと', 'ch8.d_tour_2', { tone: 'caring', effects: [set('ch8.focus_people'), ev('service', 1)] }),
    opt('machine', '台車やブレーキの仕組み', 'ch8.d_tour_2', { tone: 'neutral', effects: [set('ch8.focus_machine'), ev('accuracy', 1)] })
  ], { important: true, view: DV(['tachibana']) });
  line('ch8.d_tour_2', [
    '10時40分。見学窓の向こうに、台車が一つ。大きな車輪が二組。',
    ['nomura', '電車の足だ。車輪と、バネと、ブレーキ。…昔は、ボルトを一つずつ叩いて。音が鈍いと、…ああ、鈍い音がするとな。', 'smile'],
    '声が、少し細くなる。庫内の暖気で、むっとしている。野村さんの額に汗。',
    ['mio', '（袖を引く）…おじいさんの声、さっきより、ちっちゃい。'],
    '木箱に手をついた。杖の先が、床を、かりかりと掻いている。'
  ], 'ch8.d_elder_in', { effects: [{ clock: { minute: hm(10, 40) } }], view: DV(['nomura', 'mio'], '10:40 検修庫 見学窓') });
  line('ch8.d_elder_in', [
    ['wakabayashi', '11時の出区の見学に、間に合うように移動をお願いします。'],
    ['nomura', '（小声で）…大丈夫。続けるよ。子どもたちが、待ってる。']
  ], 'ch8.d_elder', { view: DV(['nomura', 'wakabayashi'], '10:42 検修庫') });
  choice('ch8.d_elder', '野村さんの様子が気になる。どうする？', [
    opt('pause', '説明をいったん止め、野村さんを涼しい詰所へ連れていく', 'ch8.d_pause_1', { tone: 'caring', effects: [set('ch8.elder_helped')] }),
    opt('chair', '「座って話してください」と、木箱を椅子に差し出す。説明は、野村さんに続けてもらう', 'ch8.d_chair_1', { tone: 'honest', requires: RL('tachibana', 'trust', '>=', 3), effects: [set('ch8.elder_helped'), set('ch8.nomura_honored')] }),
    opt('keep', '説明が終わるまで段取りを保つ。終わり次第、様子を見る', 'ch8.d_keep_1', { tone: 'careful', effects: [set('ch8.elder_missed')] }),
    opt('silent', '（言葉が出ない）', 'ch8.d_sil_1', { tone: 'neutral' })
  ], { important: true, timeLimit: 40, defaultOption: 'silent', view: DV(['nomura']) });
  line('ch8.d_chair_1', [
    ['player', '野村さん、座って話しましょう。…橘さん、木箱を。'],
    ['nomura', '…いや、立って話すのが、俺の仕事で…'],
    ['tachibana', '（黙って木箱を、野村の膝の高さに置く）座れ。OBの席だ。', 'smile']
  ], 'ch8.d_chair_2', { view: DV(['nomura', 'tachibana'], '10:43 検修庫 見学窓') });
  line('ch8.d_chair_2', [
    '野村さんは、杖を持ち替えて、ゆっくり腰を下ろした。子どもたちが、半円に座る。',
    '説明は、さっきより、ずっと、静かに伝わった。杖の先の、かりかりという音が、止まっている。'
  ], 'ch8.d_chair_3', { view: DV(['nomura', 'daichi'], '10:48 検修庫 見学窓') });
  line('ch8.d_chair_3', [
    ['nomura', '…ありがとうな。客扱いは、いやでな。座らせてもらったのは、初めてだ。', 'smile'],
    ['tachibana', '…誰かが、先に、座れと言ってやるべきだった。', 'serious']
  ], 'ch8.d_tachi', { effects: [rel('nomura', 2, 3), rel('tachibana', 1, 2), set('ch8.tour_done'), ev('service', 3)], view: DV(['nomura', 'tachibana'], '10:55 検修庫') });
  line('ch8.d_sil_1', [
    ['player', '（止めるのか。続けさせるのか。野村さんの目が、こちらを見ている）'],
    ['tachibana', '…黙るな。', 'serious']
  ], 'ch8.d_sil_2', { view: DV(['nomura', 'tachibana'], '10:42 検修庫') });
  line('ch8.d_sil_2', [
    ['tachibana', '野村。来い。詰所だ。説明は、私が引き取る。'],
    '橘が、野村の腕を、無言で取った。野村は、抵抗しなかった。…抵抗できないほど、疲れていた。'
  ], 'ch8.d_sil_3', { effects: [rel('tachibana', -1, 0)], view: DV(['nomura', 'tachibana'], '10:46 検修庫') });
  line('ch8.d_sil_3', [
    ['wakabayashi', '出区の見学は、見送らせてください。バスの時間が。'],
    ['daichi', 'えー！ でんしゃが出るとこ、見たかった！', 'surprise'],
    '見送った背中に、「次は、先に、声を」と、言われた気がした。'
  ], 'ch8.d_tachi', { effects: [set('ch8.elder_late'), set('ch8.tachi_stepped'), set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '出区の見学は、今年は叶わなかった' } }, set('ch8.cab_locked')], view: DV(['wakabayashi', 'daichi'], '11:05 検修庫') });
  line('ch8.d_pause_1', [
    ['player', '野村さん、涼しいところへ。続きは、あとで。'],
    ['nomura', '…いや、子どもたちが…。', 'worry'],
    ['tachibana', '（駆けつけて）君は昔から、無理を無理と言わん。詰所へ。氷を。'],
    '詰所の冷房の下で、野村さんが冷たい麦茶を、ゆっくり飲む。',
    ['nomura', '…すまんね。朝、薬だけ飲んで来た。…OBを、客扱いするな。（小声で）'],
    ['tachibana', '馬鹿者。朝飯も食わんでOBが来るか。…よく来てくれた。', 'smile']
  ], 'ch8.d_pause_c', { effects: [ev('service', 3), rel('nomura', 2, 0), rel('tachibana', 1, 2), set('ch8.nomura_stung')], view: DV(['nomura', 'tachibana'], '10:50 詰所') });
  line('ch8.d_pause_c', [
    '窓の向こうで、子どもたちが静かにこちらを見ている。大地が、水筒を握りしめて。',
    ['daichi', 'おじいちゃん、これ、ぼくの。ちょっとのんで。'],
    ['nomura', '…ありがとうな、坊や。もう大丈夫だ。'],
    ['wakabayashi', '（子どもたちへ）基地の人が見せてくれたのは、電車の中身だけじゃなかったね。']
  ], 'ch8.d_resume_b', { effects: [rel('wakabayashi', 1, 1)], view: DV(['wakabayashi', 'daichi'], '10:58 詰所の前') });
  branch('ch8.d_resume_b', [[F('ch8.route_ok'), 'ch8.d_resume_y']], 'ch8.d_resume_n');
  line('ch8.d_resume_y', [['wakabayashi', '予定は押しましたが、経路が詰めてあったので、出区には間に合います。'], ['nomura', '…座ったままで、いいなら、続きを話すよ。']], 'ch8.d_tachi', { effects: [set('ch8.tour_done'), ev('accuracy', 1)], view: DV(['wakabayashi', 'nomura'], '11:05 検修庫') });
  line('ch8.d_resume_n', [['wakabayashi', '出区の見学は、見送らせてください。バスの時間が。'], ['daichi', 'えー！ でんしゃが出るとこ、見たかった！', 'surprise'], ['player', 'ごめんね。人を大事にするところは、見せられたよ。']], 'ch8.d_tachi', { effects: [set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '出区の見学は、今年は叶わなかった' } }, set('ch8.cab_locked')], view: DV(['wakabayashi', 'daichi'], '11:05 検修庫') });
  line('ch8.d_keep_1', [
    ['player', '（説明が終わったら、すぐ様子を見よう）'],
    ['nomura', '…ブレーキはな、…ええと、何を言おうとしたか。'],
    ['daichi', 'おじいちゃん、ブレーキ！'],
    '説明は、途切れ途切れに最後まで続いた。野村さんは、一度も「休みたい」と言わなかった。拍手が庫内に響く。',
    ['tachibana', '…野村さん。今日はもう帰れ。顔色が悪い。'],
    ['nomura', '…ああ。そうさせてもらうよ。']
  ], 'ch8.d_keep_2', { effects: [{ clock: { minute: hm(10, 58) } }, set('ch8.tour_done'), ev('accuracy', 1)], view: DV(['nomura', 'tachibana'], '10:58 検修庫') });
  line('ch8.d_keep_2', [
    ['player', 'もっと早く気づいていれば。'],
    ['nomura', '謝ることはない。私が言えなかっただけだ。じゃあな。', 'worry'],
    '杖の音が、出口へ遠ざかる。木箱の上に、作業帽が置かれたまま。',
    ['tachibana', '…預かっておく。次に来た時、返す。']
  ], 'ch8.d_tachi', { effects: [set('ch8.hat_left'), set('ch8.nomura_gone'), { depart: { char: 'nomura', note: '野村さんは、基地に来なくなった。作業帽だけが残った' } }], view: DV(['nomura', 'tachibana'], '11:05 出口') });
  // 橘の秘密（夏の休憩で聞いた「この秋で降りる」）が、野村さんの前で、静かに明かされる／帽子に約束が付く
  branch('ch8.d_tachi', [[ALL(F('ch7.tachi_secret'), F('ch8.elder_missed')), 'ch8.d_tachi_m'], [ALL(F('ch7.tachi_secret'), NF('ch8.elder_missed')), 'ch8.d_tachi_p']], 'ch8.d_end_in');
  line('ch8.d_tachi_p', [
    ['tachibana', '野村さん。…私も、この秋で降ります。あなたが降りた年と、同じ年だ。'],
    ['nomura', '…そうか。お前は、最後まで、台車を見ていたな。'],
    '二人の老いた背中が、並んだ。口止めされた秘密は、もう、秘密ではなくなっていた。',
    ['tachibana', '…聞かなかったことにしろ。（小声で、{player}へ）', 'smile']
  ], 'ch8.d_end_in', { effects: [set('ch8.tachi_told_nomura'), rel('tachibana', 1, 2)], view: DV(['tachibana', 'nomura'], '11:10 検修庫') });
  line('ch8.d_tachi_m', [
    ['tachibana', '帽子は、預かっておく。次に来た時、返す。…その頃、私は、もう基地にいないかもしれん。'],
    ['player', '降りる前に、返しましょう。住所は、梶原さんが知っているはずです。'],
    ['tachibana', '…降りる前に、返す。それが、最後の仕事の、一つだ。（作業帽を、引き出しにしまう）']
  ], 'ch8.d_end_in', { effects: [set('ch8.tachi_hat_promise'), rel('tachibana', 1, 1)], view: DV(['tachibana'], '11:10 事務所') });
  line('ch8.d_end_in', [
    '11時20分。バスの前。先生が、一人だけ質問していいと言った。',
    ['hinata', 'きちの人は、おきゃくさんの顔、みえないでしょ。さみしくないの？']
  ], 'ch8.d_hi_choice', { effects: [{ clock: { minute: hm(11, 20) } }], view: DV(['hinata'], '11:20 正門') });
  choice('ch8.d_hi_choice', 'ひなたさんに、どう答える？', [
    opt('honest', '「見えないよ。でも、乗る人の顔を想像して働いてるんだ」と答える', 'ch8.d_hi_a', { tone: 'honest', effects: [set('ch8.hi_honest'), { var: { key: 'ch8.listen', add: 2 } }] }),
    opt('ask', '「ひなたさんは、顔が見えなくても、がんばれることある？」と聞き返す', 'ch8.d_hi_b', { tone: 'caring', effects: [set('ch8.hi_ask'), { var: { key: 'ch8.listen', add: 2 } }, rel('hinata', 1, 3)] }),
    opt('silent', '（答えが、見つからない）', 'ch8.d_hi_s', { tone: 'neutral', effects: [set('ch8.hi_silent')] })
  ], { timeLimit: 20, defaultOption: 'silent', view: DV(['hinata']) });
  line('ch8.d_hi_s', [['hinata', '…。（うつむいて、団扇の端を、ぎゅっと握る）'], ['wakabayashi', 'ひなたさん、行きましょう。…駅員さん、ありがとうございました。']], 'ch8.d_done', { effects: [rel('hinata', 0, -1)], view: DV(['hinata'], '11:22 正門') });
  line('ch8.d_hi_a', [['player', '乗る人の顔を、想像して働いてるんだ。だから今日、みんなが来てくれて、うれしい。'], ['hinata', 'わたしが大きく手をふったら、見える？', 'smile'], ['player', '見える。今日の顔は、ずっと覚えてる。']], 'ch8.d_done', { effects: [ev('service', 1)], view: DV(['hinata'], '11:22 正門') });
  line('ch8.d_hi_b', [['hinata', 'かきとりのれんしゅう。だれも見てないけど、あした、ほめてもらえるかなって。'], ['player', '基地の人と、おんなじ気持ちだ。', 'smile'], ['hinata', 'じゃあ、わたし、きちの人だ！']], 'ch8.d_done', { effects: [ev('service', 2)], view: DV(['hinata'], '11:22 正門') });
  fx('ch8.d_done', [set('ch8.route_done_depot'), tl('9月15日 基地で、小学生の見学と、OBの方の気配に向き合った'), log('基地の見学受入れを終える', 'work'), { clock: { minute: hm(12, 20) } }], 'ch8.after');

  // ======================================================================
  // 【指令ルート】 指令室の見学対応。電話越しの「杖の音」
  // ======================================================================
  line('ch8.x_open', [
    '指令室の壁際に、小さな椅子が二十八脚。表示盤の光が、椅子の背で揺れている。',
    ['hamaguchi', '普段は受け入れない。「仕事を知ってほしい」と頼まれた。11時から30分。'],
    ['hamaguchi', 'あなたの役目は、子ども向けの説明と誘導。運転の判断は、しない。'],
    ['hamaguchi', '今日は「声を拾う」日。指令員は、画面じゃなく、声で現場を知る仕事だから。']
  ], 'ch8.x_ref', { effects: [tl('9月15日 指令室で、小学生の見学対応を担当')], view: XV(['hamaguchi'], '9月15日（水） 8:30 輸送指令室') });
  ref('ch8.x_ref', 'hamaguchi', XV(['hamaguchi']), 'ch8.x_cmp_1');
  line('ch8.x_cmp_1', [['hamaguchi', '専門用語は、そのままでは通じない。言い換えを決めておこう。']], 'ch8.x_cmp', { view: XV(['hamaguchi']) });
  N['ch8.x_cmp'] = { id: 'ch8.x_cmp', type: 'task', kind: 'compose', title: '子ども向けの説明の言葉', intro: '三つの要素から、適切な文を一つずつ選びます。',
    slots: [
      { id: 'what', label: '指令室は、何をするところ？', options: [{ id: 'w1', text: 'ここは、電車が安全に、時間どおりに走るように、みんなの電車を見守る場所です。', good: true, why: '目的と、見守るという行動が、子どもの言葉で伝わります。' }, { id: 'w2', text: 'ここは、ダイヤ管理と運転整理を行う指令所です。', good: false, why: '専門用語のままで、子どもには伝わりません。' }, { id: 'w3', text: 'ここは、電車を全部、遠くから動かす場所です。', good: false, why: '事実と違います。動かすのは乗務員さんです。' }] },
      { id: 'how', label: '声の仕事', options: [{ id: 'h1', text: '駅や運転士さんの声を聞いて、「いま何が起きているか」を考えています。', good: true, why: '声を聞くことが仕事の中心だと伝わります。' }, { id: 'h2', text: '画面を見ていれば、全部分かります。', good: false, why: '画面だけでは現場の様子は分かりません。' }, { id: 'h3', text: '難しいので、説明はしません。', good: false, why: '子どもの「知りたい」を閉じてしまいます。' }] },
      { id: 'ask', label: '最後の呼びかけ', options: [{ id: 'a1', text: '見えないところで、たくさんの人が見守っています。気づいたことがあったら、聞いてね。', good: true, why: '質問を歓迎する言い方です。' }, { id: 'a2', text: '静かに見て、帰ってください。', good: false, why: '見学の意味が薄くなります。' }, { id: 'a3', text: '触ると危ないので、絶対に動かないで。', good: false, why: '禁止だけでは、安心が伝わりません。' }] }
    ],
    results: [{ min: 66, goto: 'ch8.x_cmp_good', effects: [ev('service', 3), ev('accuracy', 2), set('ch8.route_ok')] }, { min: 34, goto: 'ch8.x_cmp_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch8.x_cmp_bad', effects: [ev('accuracy', -1)] }], view: XV(['hamaguchi']) };
  line('ch8.x_cmp_good', [['hamaguchi', 'そのまま子どもの口に乗る。新人の教材にもなる。', 'smile']], 'ch8.x_mem_1', { view: XV(['hamaguchi']) });
  line('ch8.x_cmp_mid', [['hamaguchi', '難しい言葉が一つ残ってる。直そう。']], 'ch8.x_mem_1', { view: XV(['hamaguchi']) });
  line('ch8.x_cmp_bad', [['hamaguchi', '子どもは、言葉の温度に敏感。やり直し。', 'serious']], 'ch8.x_mem_1', { view: XV(['hamaguchi']) });
  line('ch8.x_mem_1', [['hamaguchi', '電話の向こうの「音」を聞き分ける訓練。録音を流す。順番を覚えて。']], 'ch8.x_mem', { view: XV(['hamaguchi']) });
  task3('ch8.x_mem', { kind: 'memory', title: '電話の向こうの音を聞く', hint: '電話の向こうで聞こえた音の順番を覚え、同じ順に入力します。', who: 'hamaguchi', next: 'ch8.x_sort_1', view: XV(['hamaguchi']),
    config: { sequence: ['発車メロディ', '放送', '子どもの声', '杖が床を叩く音'], pool: ['発車メロディ', '放送', '子どもの声', '杖が床を叩く音', 'ブレーキの音', '警笛', '足音', '傘の音'], showMs: 5200, showLabel: '電話の向こうの音（順番）' },
    good: '最後の小さい音まで拾った。…助かる人がいるよ、そういう耳に。', mid: '大きい音は拾えた。小さい音を聞き逃さないで。', bad: '混ざってる。もう一度、一つずつ。', ge: [ev('service', 2), ev('safety', 1), set('ch8.listen_ok')] });
  line('ch8.x_sort_1', [['hamaguchi', '学校から質問カード。その場で答えるもの、持ち帰るもの、分けて。']], 'ch8.x_sort', { view: XV(['hamaguchi']) });
  task3('ch8.x_sort', { kind: 'sort', title: '子どもの質問カードを仕分ける', hint: '質問ごとに、答え方を選びます。', who: 'hamaguchi', next: 'ch8.x_tour_1', view: XV(['hamaguchi']),
    config: { perItem: 7, bins: [{ id: 'now', label: 'その場で答える' }, { id: 'show', label: '表示盤を指して見せる' }, { id: 'home', label: '持ち帰って調べる' }], items: [
      { id: 'a', label: '「電車は、どうして時間どおりに来るの？」', bin: 'show', why: '表示盤の線を見せながら説明できます。' },
      { id: 'b', label: '「指令室の人は、トイレはどうするの？」', bin: 'now', why: '素直に、その場で答えられます。' },
      { id: 'c', label: '「事故があった日、いちばんこわかったことは？」', bin: 'home', why: '個人的な体験で、その場で軽く扱えません。' },
      { id: 'd', label: '「指令室は、何人いるの？」', bin: 'now', why: '見えている範囲で答えられます。' },
      { id: 'e', label: '「あの光は、電車なの？」', bin: 'show', why: '表示盤を指しながら答えると伝わります。' },
      { id: 'f', label: '「なんで電車は、ときどき遅れるの？」', bin: 'home', why: '原因は様々で、その場の説明では不十分です。' }] },
    good: '質問の「重さ」を、見分けてる。', mid: '数枚、扱いが違った。軽く答えられない質問もある。', bad: '重い質問を、その場で答えようとしてた。持ち帰るほうが誠実。', ge: [ev('service', 2), ev('accuracy', 2)], be: [ev('accuracy', -1)] });
  line('ch8.x_tour_1', [
    '11時。薄暗い部屋に、黄色い帽子が、一人ずつ入ってくる。',
    ['daichi', '（小声のつもりで大声）うわー、光ってる！ ぜんぶ、でんしゃ！？', 'smile'],
    ['hamaguchi', 'こんにちは。ここは、みんなの電車を見守るところ。{player}さんが、お話しします。']
  ], 'ch8.x_hinata_b', { effects: [{ clock: { minute: hm(11, 0) } }, set('ch8.tour_started'), log('11時 指令室の見学受入れ開始', 'work')], view: XV(['wakabayashi', 'daichi'], '11:00 輸送指令室') });
  branch('ch8.x_hinata_b', [[F('ch7.hinata_seed'), 'ch8.x_hinata_y']], 'ch8.x_qa1');
  line('ch8.x_hinata_y', [['hinata', '（団扇を小さく振る）花火のひ、でんわのおじさんと、はなしてた人？', 'smile'], ['hamaguchi', '（小声で）あの夜の声を、覚えてる子がいるのね。']], 'ch8.x_qa1', { effects: [rel('hinata', 1, 2)], view: XV(['hinata'], '11:02 輸送指令室') });
  line('ch8.x_qa1', [['daichi', 'はい！ しつもん！ でんしゃが見えないのに、どうやってうごかすの！？']], 'ch8.x_qa1_c', { view: XV(['daichi'], '11:08 輸送指令室') });
  choice('ch8.x_qa1_c', '大地くんの質問に、どう答える？', [
    opt('ask', '「見えないのに、どうやって分かると思う？ 耳を澄ましてみて」と問い返す', 'ch8.x_qa1_a', { tone: 'caring', effects: [{ var: { key: 'ch8.listen', add: 2 } }] }),
    opt('tell', '「表示盤と、電話で教えてもらってるんだよ」と説明する', 'ch8.x_qa1_b', { tone: 'careful', effects: [{ var: { key: 'ch8.listen', add: 1 } }] })
  ], { view: XV(['daichi']) });
  line('ch8.x_qa1_a', [
    ['mio', '（とても小さな声で）…でんわの、おと。ピッて、なった。ひとが、はなしてる。'],
    ['player', '正解。電話の声が、指令員さんの「目」になるんだ。'],
    ['hamaguchi', '（そっと）声を拾える子ね。', 'smile']
  ], 'ch8.x_focus', { effects: [ev('service', 2)], view: XV(['mio'], '11:10 輸送指令室') });
  line('ch8.x_qa1_b', [['daichi', 'じゃあ、でんわがならないと、わかんないの？'], ['player', 'そう。だから、鳴らないときほど、耳を澄ませてる。']], 'ch8.x_focus', { effects: [ev('accuracy', 1)], view: XV(['daichi'], '11:10 輸送指令室') });
  choice('ch8.x_focus', '指令室で、いちばん伝えたいことは？', [
    opt('safety', '見えないところで、電車を見守っている人がいること', 'ch8.x_elder_in', { tone: 'careful', effects: [set('ch8.focus_safety'), ev('safety', 1)] }),
    opt('people', '声を聞き逃さないことが、いちばん大事な仕事だということ', 'ch8.x_elder_in', { tone: 'caring', effects: [set('ch8.focus_people'), ev('service', 1)] }),
    opt('machine', '表示盤や電話の仕組み', 'ch8.x_elder_in', { tone: 'neutral', effects: [set('ch8.focus_machine'), ev('accuracy', 1)] })
  ], { important: true, view: XV(['hamaguchi']) });
  line('ch8.x_elder_in', [
    '11時18分。指令室の電話が、静かに鳴った。',
    ['kubota', '（電話）久保田です。ホームのベンチに、常連の野村さん。様子が気になります。私は見学の別班で、離れられず。'],
    ['hamaguchi', '（受話器をふさぎ、小声で）聞いて。ホームの音の奥。杖が床を叩いてる。間隔が乱れてる。'],
    '耳を澄ます。放送。ブレーキ。その向こうに、かん、かん、と、不規則な音。',
    ['hamaguchi', '見学はあと20分。止めるかどうか、あなたの意見を聞く。', 'serious']
  ], 'ch8.x_elder', { effects: [{ clock: { minute: hm(11, 18) } }], view: XV(['hamaguchi', 'kubota'], '11:18 輸送指令室') });
  choice('ch8.x_elder', '電話の向こうの野村さんが、気になる。誰に頼む？', [
    opt('kaji', '梶原さんに頼む。ロビーにいる。野村さんの扱いを知っている人だ', 'ch8.x_kaji_1', { tone: 'caring', effects: [set('ch8.elder_helped'), set('ch8.x_kaji')] }),
    opt('chief', '白石駅長に頼む。医院とタクシーを、手配できる人だ。見学は止める', 'ch8.x_pause_1', { tone: 'careful', effects: [set('ch8.elder_helped'), set('ch8.x_chief'), set('ch8.nomura_stung')] }),
    opt('keep', '駅に任せ、見学を続ける', 'ch8.x_keep_1', { tone: 'quick', effects: [set('ch8.elder_missed')] }),
    opt('silent', '（誰に頼めばいいか、決められない）', 'ch8.x_sil_1', { tone: 'neutral' })
  ], { important: true, timeLimit: 40, defaultOption: 'silent', view: XV(['hamaguchi']) });
  line('ch8.x_kaji_1', [
    ['player', '梶原さんは、ロビーにいますか。野村さんに、「いいよ、じゃないでしょう」と、言ってあげられる人です。'],
    ['hamaguchi', '…久保田さん、ロビーの梶原さんを。指令からの、お願いだと。'],
    ['kubota', '（電話）…！ 今、呼びます。']
  ], 'ch8.x_kaji_2', { view: XV(['hamaguchi', 'kubota'], '11:21 輸送指令室') });
  line('ch8.x_kaji_2', [
    '電話の向こうで、杖の音が、近づく別の足音に、重なる。',
    ['kajiwara', '（遠く）野村さん。…いいよ、じゃ、ないでしょう。座りなさい。薬、飲んだの？'],
    ['nomura', '（遠く）…参ったな。']
  ], 'ch8.x_kaji_3', { view: XV(['hamaguchi'], '11:23 輸送指令室') });
  line('ch8.x_kaji_3', [
    ['kubota', '（電話）野村さんは、梶原さんの隣で、薬を飲まれました。…見学は、続けて大丈夫です。'],
    ['hamaguchi', '電話で、人を動かした。…いい仕事。', 'smile'],
    ['mio', '（小声で）…でんわ、すごい。']
  ], 'ch8.x_end_in', { effects: [rel('nomura', 2, 2), rel('kajiwara', 1, 3), rel('hamaguchi', 1, 2), set('ch8.tour_done'), ev('service', 3)], view: XV(['hamaguchi', 'mio'], '11:30 輸送指令室') });
  line('ch8.x_sil_1', [
    ['hamaguchi', '…時間がない。久保田さんが、待っている。', 'serious'],
    ['player', '（誰に。駅長か。久保田さんか。梶原さんか。…電話は、鳴りっぱなしだ）']
  ], 'ch8.x_sil_2', { view: XV(['hamaguchi', 'kubota'], '11:20 輸送指令室') });
  line('ch8.x_sil_2', [
    ['hamaguchi', '久保田さん、私の判断で、白石駅長へ。見学は、止めない。…{player}、次は、声に出して決めて。'],
    '電話の向こうで、駅員たちの声が、重なっていく。誰も、こちらを責めない。それが、少しだけ、つらかった。'
  ], 'ch8.x_end_in', { effects: [set('ch8.elder_late'), rel('hamaguchi', -1, 0), set('ch8.tour_done')], view: XV(['hamaguchi'], '11:28 輸送指令室') });
  line('ch8.x_pause_1', [
    ['player', '見学を止めてください。駅を支えたい。'],
    ['hamaguchi', '若林先生、少しだけ止めさせてください。'],
    ['wakabayashi', '…分かりました。子どもたちには、静かに待つよう言います。', 'serious'],
    ['hamaguchi', '（電話へ）久保田さん、指令。次の列車の停車位置を、ベンチから遠ざける。付き添いを一人。救護は駅の判断で。'],
    '薄暗い部屋で、子どもたちが静かに待つ。電話の向こうで、駅員たちの声が重なっていく。',
    ['mio', '（小声で）…おじいさん、だいじょうぶ？'],
    ['player', '駅の人たちが、電話で、みんなで助けてるよ。', 'smile']
  ], 'ch8.x_pause_c', { effects: [ev('service', 3), ev('teamwork', 2), rel('hamaguchi', 1, 2)], view: XV(['hamaguchi', 'wakabayashi'], '11:22 輸送指令室') });
  line('ch8.x_pause_c', [
    ['kubota', '（電話）野村さんは、ラムネと水で落ち着かれました。駅長が医院へ案内します。'],
    ['hamaguchi', '了解。報告、ありがとう。', 'smile'],
    ['wakabayashi', '（子どもたちへ）今日見たのは、仕組みだけじゃない。遠くからでも、誰かを助けられる。それが「つなぐ」仕事。'],
    ['daichi', 'ぼく、こまってる人がいたら、おとなにいう！']
  ], 'ch8.x_resume_b', { view: XV(['wakabayashi', 'daichi'], '11:30 輸送指令室') });
  branch('ch8.x_resume_b', [[F('ch8.route_ok'), 'ch8.x_resume_y']], 'ch8.x_resume_n');
  line('ch8.x_resume_y', [['wakabayashi', '時間は押しましたが、説明の言葉が整っていたので、残りを手短に聞けました。']], 'ch8.x_end_in', { effects: [set('ch8.tour_done'), ev('accuracy', 1)], view: XV(['wakabayashi'], '11:35 輸送指令室') });
  line('ch8.x_resume_n', [['wakabayashi', '時間が押しました。残りの質問は、見送らせてください。'], ['player', '説明の言葉を、もう少し整えておけば。']], 'ch8.x_end_in', { effects: [set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '指令室の見学は、今年は途中までだった' } }, set('ch8.cab_locked')], view: XV(['wakabayashi'], '11:35 輸送指令室') });
  line('ch8.x_keep_1', [
    ['player', '見学を続けてください。駅は、駅の人が対応してくれると信じます。'],
    ['hamaguchi', '…分かった。久保田さん、駅の判断で。必要なら、すぐ連絡を。'],
    ['kubota', '（電話）了解。', 'worry'],
    '見学は予定どおり進んだ。子どもたちの目が、表示盤で光っている。耳の奥では、さっきの杖の音が、かん、かん、と鳴り続けていた。',
    ['kubota', '（11時35分、電話）野村さん、次の電車でお帰りに。帽子だけ、駅長が預かりました。', 'worry']
  ], 'ch8.x_end_in', { effects: [{ clock: { minute: hm(11, 35) } }, set('ch8.tour_done'), set('ch8.hat_left'), set('ch8.nomura_gone'), { depart: { char: 'nomura', note: '野村さんは、水曜の通院を、別の駅に変えた。帽子だけが残った' } }, ev('accuracy', 1)], view: XV(['hamaguchi', 'kubota'], '11:35 輸送指令室') });
  line('ch8.x_end_in', [
    '11時45分。出口で、先生が言った。一人だけ、質問していい。',
    ['hinata', 'しれいしつの人は、まい日、いろんな人の声をきくでしょ。つかれない？']
  ], 'ch8.x_hi_choice', { effects: [{ clock: { minute: hm(11, 45) } }], view: XV(['hinata'], '11:45 輸送指令室') });
  choice('ch8.x_hi_choice', 'ひなたさんに、どう答える？', [
    opt('honest', '「疲れる日もある。でも、声を聞いて誰かが助かると、元気が出る」と答える', 'ch8.x_hi_a', { tone: 'honest', effects: [set('ch8.hi_honest'), { var: { key: 'ch8.listen', add: 2 } }] }),
    opt('ask', '「ひなたさんは、人の声を聞くのが好き？」と聞き返す', 'ch8.x_hi_b', { tone: 'caring', effects: [set('ch8.hi_ask'), { var: { key: 'ch8.listen', add: 2 } }, rel('hinata', 1, 3)] }),
    opt('silent', '（答えが、見つからない）', 'ch8.x_hi_s', { tone: 'neutral', effects: [set('ch8.hi_silent')] })
  ], { timeLimit: 20, defaultOption: 'silent', view: XV(['hinata']) });
  line('ch8.x_hi_s', [['hinata', '…。（うつむいて、団扇の端を、ぎゅっと握る）'], ['wakabayashi', 'ひなたさん、行きましょう。…駅員さん、ありがとうございました。']], 'ch8.x_done', { effects: [rel('hinata', 0, -1)], view: XV(['hinata'], '11:48 輸送指令室') });
  line('ch8.x_hi_a', [['hinata', 'ふうん。声をきくのも、おしごとなんだね。', 'smile'], ['hamaguchi', '（隣で、小さくうなずく）']], 'ch8.x_done', { effects: [ev('service', 1)], view: XV(['hinata'], '11:48 輸送指令室') });
  line('ch8.x_hi_b', [['hinata', 'うん。おばあちゃんの話、すき。おなじ話でも、うれしそうだから。'], ['player', 'それが、いちばん大事な力。', 'smile'], ['hamaguchi', '（小声で）もう立派な指令員ね。']], 'ch8.x_done', { effects: [ev('service', 2)], view: XV(['hinata'], '11:48 輸送指令室') });
  fx('ch8.x_done', [set('ch8.route_done_dispatch'), tl('9月15日 指令室で、小学生の見学と、電話越しの気配に向き合った'), log('指令室の見学対応を終える', 'work'), { clock: { minute: hm(12, 20) } }], 'ch8.after');

  // ======================================================================
  // 【計画ルート】 地域向け説明会。聞こえていない野村さん
  // ======================================================================
  line('ch8.p_open', [
    '地区センターの長机に、パンフレットが山になっている。文字が、小さい。',
    ['sawada', '秋の運賃とダイヤの見直し、駅のバリアフリー。地元の高齢の方と、親子が来ます。'],
    ['sawada', '決めたことを、使う人に届ける。説明会は、その一番大事な場所です。'],
    ['sawada', '今日は「声を拾う」日に。質問できない人ほど、一番聞いてほしいことを抱えてる。']
  ], 'ch8.p_ref', { effects: [tl('9月15日 地域向け説明会の準備と進行補助を担当')], view: PV(['sawada'], '9月15日（水） 8:30 地区センター') });
  ref('ch8.p_ref', 'sawada', PV(['sawada']), 'ch8.p_find_1');
  line('ch8.p_find_1', [['sawada', '資料を点検して。字が小さい、用語が説明なし、色だけで区別。三つの視点で。']], 'ch8.p_find', { view: PV(['sawada']) });
  task3('ch8.p_find', { kind: 'find', title: '配布資料の「読みにくさ」を探す', hint: '資料の中から、読みにくい箇所を3つ見つけてタップします。', who: 'sawada', next: 'ch8.p_route_1', view: PV(['sawada']),
    config: { scene: 'concourse', seconds: 38, props: [P(0.05, 0.08, 0.22, 0.3, '#2f5d8a', '運賃表'), P(0.34, 0.08, 0.22, 0.3, '#2f7a56', 'ダイヤ'), P(0.63, 0.08, 0.3, 0.3, '#a35c00', 'バリアフリー'), P(0.08, 0.62, 0.84, 0.25, '#555', '本文')], spots: [
      { id: 'font', x: 0.2, y: 0.25, label: '運賃表の注記の字が極端に小さい' }, { id: 'term', x: 0.48, y: 0.3, label: '「運転整理」という用語が説明なしに出ている' }, { id: 'color', x: 0.8, y: 0.2, label: '赤と緑だけで区別された設備の凡例' }, { id: 'ok', x: 0.2, y: 0.75, real: false, label: '本文は大きな文字で読みやすいです' }] },
    good: '三つとも。毎年、ここを指摘されるの。…あなたが先に見つけた。', mid: '一つ見落とし。作った側は、慣れてしまうから。', bad: '読む人の目で、もう一度。', ge: [ev('accuracy', 3), ev('service', 1)], be: [ev('accuracy', -1)] });
  line('ch8.p_route_1', [['sawada', '会場の動線も。杖、車いす、ベビーカー。受付と前方の座席を、必ず通る道を。']], 'ch8.p_route', { view: PV(['sawada']) });
  const GRID_P = ['S...#....', '.##.R.##.', '..~...Z..', '.#####.#G', '.........'];
  task3('ch8.p_route', { kind: 'route', title: '会場の動線', hint: '起点から着点まで、受付（R）と前方の座席（Z）を通る経路をつなぎます。壁・段差（黒）は通れません。', who: 'sawada', next: 'ch8.p_cmp_1', view: PV(['sawada']),
    config: { grid: GRID_P, must: ['R', 'Z'], best: bestRoute(GRID_P, ['R', 'Z']), legend: { '#': '壁・段差（通れない）', '~': '資料の机の前（混雑する）', R: '受付', Z: '前方の座席', S: '入口', G: '出口' } },
    good: 'いい道。杖の方も、迷わず前まで行ける。', mid: '通れるけど、資料机の前は混みます。', bad: '受付を通らないと、座席の案内ができない。', ge: [ev('service', 3), ev('safety', 1), set('ch8.route_ok')], be: [ev('service', -1)] });
  line('ch8.p_cmp_1', [['sawada', '冒頭の言葉を考えて。数字の前に、「何のための会か」を一言。']], 'ch8.p_cmp', { view: PV(['sawada']) });
  N['ch8.p_cmp'] = { id: 'ch8.p_cmp', type: 'task', kind: 'compose', title: '説明会の冒頭の言葉', intro: '三つの要素から、適切な文を一つずつ選びます。',
    slots: [
      { id: 'hello', label: '冒頭の挨拶', options: [{ id: 'h1', text: '今日は、お忙しいなか、ありがとうございます。難しいところは、何度でもお聞きください。', good: true, why: '聞き返してよい、と先に伝えています。' }, { id: 'h2', text: 'それでは、資料の3ページから説明を始めます。', good: false, why: '入り口がなく、聞く側の準備ができません。' }, { id: 'h3', text: '時間が限られているので、質問は最後にお願いします。', good: false, why: '分からないまま、進んでしまう人が出ます。' }] },
      { id: 'how', label: '話し方', options: [{ id: 'p1', text: '大きな声で、ゆっくり、一文ずつ区切って話します。聞こえにくいときは、手を挙げてください。', good: true, why: '聞こえにくさを言い出しやすくしています。' }, { id: 'p2', text: '資料に書いてあるので、読んでおいてください。', good: false, why: '読みにくい人を置き去りにします。' }, { id: 'p3', text: '早口で、要点だけを説明します。', good: false, why: '聞き取れない人が増えます。' }] },
      { id: 'care', label: '配慮', options: [{ id: 'c1', text: '体調が悪い方は、遠慮なく、お近くの係員にお声がけください。休憩もいつでも取れます。', good: true, why: '声を出しにくい人への、先回りの呼びかけです。' }, { id: 'c2', text: '体調が悪い方は、各自の責任でお願いします。', good: false, why: '突き放す言い方です。' }, { id: 'c3', text: '特に配慮は必要ないでしょう。', good: false, why: '必要な人を見落とします。' }] }
    ],
    results: [{ min: 66, goto: 'ch8.p_cmp_good', effects: [ev('service', 3), ev('accuracy', 2), set('ch8.listen_ok')] }, { min: 34, goto: 'ch8.p_cmp_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch8.p_cmp_bad', effects: [ev('accuracy', -1)] }], view: PV(['sawada']) };
  line('ch8.p_cmp_good', [['sawada', 'これなら「聞こえません」と言える空気ができる。…来ましたよ。', 'smile']], 'ch8.p_tour_1', { view: PV(['sawada']) });
  line('ch8.p_cmp_mid', [['sawada', '「聞こえにくいとき」の一言を、足して。']], 'ch8.p_tour_1', { view: PV(['sawada']) });
  line('ch8.p_cmp_bad', [['sawada', '早さを優先した言い方。説明会は、届くことが先。', 'serious']], 'ch8.p_tour_1', { view: PV(['sawada']) });
  line('ch8.p_tour_1', [
    '10時。前の席に親子。後ろの席に、杖をついた男性。野村さんだ。',
    ['sawada', 'それでは始めます。聞こえにくいときは、遠慮なく手を挙げて。'],
    ['daichi', '（手を挙げる）がっこう、おやすみ！ でんしゃのこと、ききたい！', 'smile']
  ], 'ch8.p_hinata_b', { effects: [{ clock: { minute: hm(10, 0) } }, set('ch8.tour_started'), log('10時 地域向け説明会が始まる', 'work')], view: PV(['sawada', 'daichi'], '10:00 説明会') });
  branch('ch8.p_hinata_b', [[F('ch7.hinata_seed'), 'ch8.p_hinata_y']], 'ch8.p_qa1');
  line('ch8.p_hinata_y', [['hinata', '（前の席で団扇を振る）あの日の、えきいんさんだ！ ことしは、せつめいかいに来たよ。', 'smile'], ['player', '来てくれたんだね。お母さんと？']], 'ch8.p_qa1', { effects: [rel('hinata', 1, 2)], view: PV(['hinata'], '10:02 説明会') });
  line('ch8.p_qa1', [
    '10時20分。前の席で、美緒が母親の袖を引いて、何か言った。',
    ['mio', '（母親の耳もとへ）…あっちのおじいさん、ずっとうなずいてるけど、きいてない、みたい。'],
    ['player', '（その小さな声を、そっと拾う）美緒さん、もう一度、教えてくれる？']
  ], 'ch8.p_ql', { effects: [{ clock: { minute: hm(10, 20) } }], view: PV(['mio'], '10:20 説明会') });
  branch('ch8.p_ql', [[F('ch8.listen_ok'), 'ch8.p_ql_y']], 'ch8.p_qa1_c');
  line('ch8.p_ql_y', [['sawada', '（小声で）冒頭の一言のおかげです。「聞こえにくいときは、言ってください」と、先に言ってあった。…子どもが、先に、声を出せた。', 'smile']], 'ch8.p_qa1_c', { view: PV(['sawada', 'mio'], '10:21 説明会') });
  choice('ch8.p_qa1_c', '美緒さんの小さな声に、どう応える？', [
    opt('ask', '「教えてくれてありがとう。どうして、そう思ったの？」と続きを聞く', 'ch8.p_qa1_a', { tone: 'caring', effects: [{ var: { key: 'ch8.listen', add: 2 } }, rel('hinata', 0, 1), set('ch8.mio_heard')] }),
    opt('note', '「ありがとう。あとで見ておくね」と受け止めて、進行を続ける', 'ch8.p_qa1_b', { tone: 'careful', effects: [{ var: { key: 'ch8.listen', add: 1 } }] })
  ], { view: PV(['mio']) });
  line('ch8.p_qa1_a', [
    ['mio', 'みんながわらったとき、おじいさん、わらわなかったの。あとで、すごくおそく、わらった。'],
    ['player', '（遅れて笑った。つまり、声が少し遅れて届いている）美緒さんは、聞こえ方まで見てるんだね。', 'smile'],
    ['mio', '（うつむいて）…だいじょうぶ、かな。']
  ], 'ch8.p_focus', { effects: [ev('service', 2)], view: PV(['mio'], '10:22 説明会') });
  line('ch8.p_qa1_b', [['mio', '…うん。', 'worry'], ['player', '（頷いたけれど、美緒の目が、少しさみしそうだった。続きを聞けばよかった）']], 'ch8.p_focus', { effects: [ev('accuracy', 1)], view: PV(['mio'], '10:22 説明会') });
  choice('ch8.p_focus', '説明会の後半、いちばん大事にしたいことは？', [
    opt('safety', '駅の使い方と困ったときの連絡先を、全員に確実に伝える（安全）', 'ch8.p_elder_in', { tone: 'careful', effects: [set('ch8.focus_safety'), ev('safety', 1)] }),
    opt('people', '質問できない人の声に気づいて、拾う（人）', 'ch8.p_elder_in', { tone: 'caring', effects: [set('ch8.focus_people'), ev('service', 1)] }),
    opt('machine', '運賃やダイヤの数字を、間違いなく説明しきる（数字）', 'ch8.p_elder_in', { tone: 'neutral', effects: [set('ch8.focus_machine'), ev('accuracy', 1)] })
  ], { important: true, view: PV(['sawada']) });
  line('ch8.p_elder_in', [
    '10時50分。スクリーンに時刻表。後ろの席で、補聴器が、ピー、と小さく鳴った。',
    ['nomura', '（隣の梶原へ、小声で）…いま、何の話だった？ …いや、いい。聞こえてるよ。', 'worry'],
    ['kajiwara', '（小声で）また「いいよ」って言ってる。昔から、そうなの。'],
    ['sawada', '（小声で）このあと運賃の重要箇所です。予定は、少し押してます。']
  ], 'ch8.p_el_b', { effects: [{ clock: { minute: hm(10, 50) } }], view: PV(['nomura', 'kajiwara'], '10:50 説明会 後方') });
  branch('ch8.p_el_b', [[F('ch8.mio_heard'), 'ch8.p_el_e']], 'ch8.p_elder');
  line('ch8.p_el_e', ['美緒の「聞こえていない」という一言が、頭に残っていた。だから、補聴器の小さな「ピー」に、一拍、早く気づけた。'], 'ch8.p_elder', { view: PV(['nomura', 'mio'], '10:50 説明会 後方') });
  choice('ch8.p_elder', '野村さんが、聞こえていないようだ。どうする？', [
    opt('pause', '説明をいったん止めてもらい、野村さんの近くで、聞こえ方を一緒に確かめる', 'ch8.p_pause_1', { tone: 'caring', effects: [set('ch8.elder_helped')] }),
    opt('quiet', '説明は止めない。後ろの席へ歩いて、替えの電池を、そっと手に渡す', 'ch8.p_quiet_1', { tone: 'honest', requires: F('ch8.mio_heard'), effects: [set('ch8.elder_helped'), set('ch8.p_quiet')] }),
    opt('keep', '予定どおり進める。終了後に、個別に伝える', 'ch8.p_keep_1', { tone: 'careful', effects: [set('ch8.elder_missed')] }),
    opt('silent', '（言葉が出ない）', 'ch8.p_sil_1', { tone: 'neutral' })
  ], { important: true, timeLimit: 40, defaultOption: 'silent', view: PV(['nomura']) });
  line('ch8.p_quiet_1', [
    '会場の後ろへ。腰をかがめて、補聴器の電池を、野村さんの掌にのせる。',
    ['nomura', '…ああ。…すまんな。替えは、持ってきてたんだが。'],
    ['kajiwara', '（小声で）忘れてたのよ。いつものこと。']
  ], 'ch8.p_quiet_2', { view: PV(['nomura', 'kajiwara'], '10:53 説明会 後方') });
  line('ch8.p_quiet_2', [
    '電池が替わる。「ピー」が、止まった。野村さんの顔が、ぱっと明るくなる。',
    ['nomura', '…聞こえる。いろんな音が、戻ってきた。'],
    '説明会は、一秒も、止まらなかった。前の席の美緒が、振り返って、小さく親指を立てた。'
  ], 'ch8.p_quiet_3', { effects: [rel('nomura', 2, 2), rel('sawada', 1, 2), rel('hinata', 0, 1)], view: PV(['nomura', 'mio'], '10:56 説明会 後方') });
  line('ch8.p_quiet_3', [
    ['sawada', '（小声で、あとで）…気づいてから動くまでが、速かった。聞いてくれた人の声は、こういう時に、効く。', 'smile']
  ], 'ch8.p_end_in', { effects: [set('ch8.tour_done'), ev('service', 3), ev('teamwork', 1)], view: PV(['sawada'], '11:30 説明会') });
  line('ch8.p_sil_1', [
    ['player', '（止めるか。続けるか。あの電池のことか。…口が、動かない）'],
    ['sawada', '（小声で）…動けますか。動けないなら、私が。']
  ], 'ch8.p_sil_2', { view: PV(['sawada', 'nomura'], '10:52 説明会') });
  line('ch8.p_sil_2', [
    '沢田が、説明を中断して、後ろの席へ歩いていく。会場が、ざわめく。',
    ['sawada', '電池の交換を。少し、休憩にします。…（小声で）次は、あなたが。']
  ], 'ch8.p_sil_3', { effects: [rel('sawada', -1, 0)], view: PV(['sawada', 'nomura'], '10:56 説明会') });
  line('ch8.p_sil_3', [
    ['sawada', '席の入れ替えに手間取りました。後半のバリアフリーの説明は、短縮させてください。'],
    '決めなかった時間の分だけ、誰かの話が、削れた。'
  ], 'ch8.p_end_in', { effects: [set('ch8.elder_late'), set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '後半の説明は、短縮された' } }, set('ch8.cab_locked'), set('ch8.tour_done')], view: PV(['sawada'], '11:10 説明会') });
  line('ch8.p_pause_1', [
    ['player', '沢田さん、五分、休憩を。後ろの席に、聞こえにくい方が。'],
    ['sawada', '…分かった。皆さん、五分休憩です。お茶をどうぞ。'],
    ['player', '野村さん。補聴器の音が、少し気になりまして。'],
    ['nomura', '…いや、調子が悪いだけで。大丈夫、大丈夫。', 'worry'],
    ['kajiwara', 'いい加減にしなさい。聞こえないなら、聞こえないって言っていいの。この人は味方よ。'],
    ['nomura', '…本当は、半分くらい、聞こえてない。電池が、切れかけでな。']
  ], 'ch8.p_pause_c', { view: PV(['nomura', 'kajiwara'], '10:56 説明会 休憩') });
  line('ch8.p_pause_c', [
    ['nomura', '替えの電池は持ってきた。替えるのを、忘れてた。…情けない。'],
    ['player', '言ってくださって、よかったです。'],
    '電池を替えると、野村さんの顔が、ぱっと明るくなった。',
    ['nomura', '…聞こえる。いろんな音が、戻ってきた。ありがとう。'],
    ['sawada', '（近づいて）聞き取れなかった運賃のところを、前でお話ししましょう。', 'smile'],
    ['daichi', 'おじいちゃん、きこえるようになった？ よかったね！']
  ], 'ch8.p_resume_b', { effects: [ev('service', 3), rel('nomura', 2, 3), rel('sawada', 1, 2)], view: PV(['nomura', 'sawada'], '11:02 説明会') });
  branch('ch8.p_resume_b', [[F('ch8.route_ok'), 'ch8.p_resume_y']], 'ch8.p_resume_n');
  line('ch8.p_resume_y', [['sawada', '動線を整えておいたので、休憩中の移動がスムーズでした。残りは詰められます。']], 'ch8.p_end_in', { effects: [set('ch8.tour_done'), ev('accuracy', 1)], view: PV(['sawada'], '11:10 説明会') });
  line('ch8.p_resume_n', [['sawada', '席の入れ替えに手間取りました。後半のバリアフリーの説明は、短縮させてください。']], 'ch8.p_end_in', { effects: [set('ch8.tour_cut'), { lock: { id: 'ch8.cab_visit', note: '後半の説明は、短縮された' } }, set('ch8.cab_locked')], view: PV(['sawada'], '11:10 説明会') });
  line('ch8.p_keep_1', [
    ['player', '（予定どおり。終わったら、個別にお話しすればいい）'],
    '説明は順調に進んだ。質問も出て、答えも返った。後ろの席で、野村さんだけが、同じ姿勢のまま、うなずき続けていた。',
    ['nomura', '（梶原へ）…よく、分かった。ありがとう。', 'worry'],
    '11時25分。拍手の中、野村さんは静かに席を立った。',
    ['player', '運賃のご説明は、いかがでしたか。'],
    ['nomura', '…ああ、よく分かったよ。またな。']
  ], 'ch8.p_keep_2', { effects: [{ clock: { minute: hm(11, 25) } }, set('ch8.tour_done'), ev('accuracy', 1)], view: PV(['nomura', 'kajiwara'], '11:25 説明会 終了') });
  line('ch8.p_keep_2', [
    ['kajiwara', '駅員さん。あの人、半分も聞こえてなかったのよ。補聴器の電池が切れてて。'],
    ['player', '…気づけなくて、すみません。'],
    ['kajiwara', 'あの人が言わなかったの。…でも、気づいてほしかった気持ちも、あったかもね。', 'worry'],
    '空いた席に、運賃表のパンフレット。付箋に「ここ、読んで」と書いたまま、剥がれかけていた。'
  ], 'ch8.p_end_in', { effects: [set('ch8.hat_left'), set('ch8.nomura_gone'), { depart: { char: 'nomura', note: '野村さんは、説明会にも、駅にも、来なくなった。付箋だけが残った' } }], view: PV(['kajiwara'], '11:30 説明会 後方') });
  line('ch8.p_end_in', [
    '11時35分。子どもたちの質問の時間。',
    ['hinata', 'どうして、せつめいは、むずかしい言葉に、するの？']
  ], 'ch8.p_hi_choice', { effects: [{ clock: { minute: hm(11, 35) } }], view: PV(['hinata'], '11:35 説明会') });
  choice('ch8.p_hi_choice', 'ひなたさんに、どう答える？', [
    opt('honest', '「ごめんね。やさしい言葉で言えたらいいんだ。がんばるよ」と答える', 'ch8.p_hi_a', { tone: 'honest', effects: [set('ch8.hi_honest'), { var: { key: 'ch8.listen', add: 2 } }] }),
    opt('ask', '「ひなたさんは、どう言ってもらったら、わかりやすい？」と聞き返す', 'ch8.p_hi_b', { tone: 'caring', effects: [set('ch8.hi_ask'), { var: { key: 'ch8.listen', add: 2 } }, rel('hinata', 1, 3)] }),
    opt('silent', '（答えが、見つからない）', 'ch8.p_hi_s', { tone: 'neutral', effects: [set('ch8.hi_silent')] })
  ], { timeLimit: 20, defaultOption: 'silent', view: PV(['hinata']) });
  line('ch8.p_hi_s', [['hinata', '…。（うつむいて、団扇の端を、ぎゅっと握る）'], ['wakabayashi', 'ひなたさん、行きましょう。…駅員さん、ありがとうございました。']], 'ch8.p_done', { effects: [rel('hinata', 0, -1)], view: PV(['hinata'], '11:38 説明会') });
  line('ch8.p_hi_a', [['player', '大人が、慣れちゃってるだけなんだ。これから、やさしい言葉で言う。'], ['hinata', 'うん！ まってる！', 'smile'], ['sawada', '（そっと）手厳しい先生が、一人増えましたね。']], 'ch8.p_done', { effects: [ev('service', 1)], view: PV(['hinata'], '11:38 説明会') });
  line('ch8.p_hi_b', [['hinata', '「あしたの、あさ、なんじ」って、はっきり言うとわかりやすい。'], ['player', '「いつ」を、はっきり言う。次の説明会で使わせてもらうよ。', 'smile'], ['hinata', 'やくそくだよ！']], 'ch8.p_done', { effects: [ev('service', 2)], view: PV(['hinata'], '11:38 説明会') });
  fx('ch8.p_done', [set('ch8.route_done_planning'), tl('9月15日 地域向け説明会で、聞き取れない人の声に向き合った'), log('地域向け説明会を終える', 'work'), { clock: { minute: hm(12, 20) } }], 'ch8.after');

  // ======================================================================
  // 合流：同じ駅事務室。通ってきたルートと選択の色が、そのまま残る
  // ======================================================================
  line('ch8.after', [
    '12時20分。駅事務室。机の上で、湯呑みが一つ、冷めかけている。',
    ['kubota', 'お疲れさまでした。同時に二つ受けるのは、簡単じゃなかったでしょう。'],
    ['shiraishi', '梶原さんが、ロビーで待っている。報告は、そのあとだ。']
  ], 'ch8.af_e', { view: OV(['shiraishi', 'kubota'], '12:20 駅事務室') });
  branch('ch8.af_e', [[F('ch8.elder_helped'), 'ch8.af_help'], [F('ch8.elder_late'), 'ch8.af_late']], 'ch8.af_miss');
  line('ch8.af_help', [
    ['kajiwara', '野村さん、帰りにうちへ電話くれたのよ。「若い駅員に、助けてもらった」って。', 'smile'],
    ['kajiwara', 'あの人が「助けてもらった」なんて言うの、四十年近く近所にいて、初めて。'],
    ['player', '気になって、足が動いただけです。'],
    ['kajiwara', 'それが一番難しいの。…これ、庭の柿。駅長さん、今日は特別、いいでしょう？'],
    ['shiraishi', '…今日は、いただこう。']
  ], 'ch8.af_kr', { effects: [rel('kajiwara', 2, 3), rel('nomura', 1, 2), tl('9月15日 野村さんが「助けてもらった」と話してくれた')], view: OV(['kajiwara', 'shiraishi'], '12:25 駅事務室') });
  line('ch8.af_late', [
    ['kajiwara', '野村さん、帰りに電話をくれたのよ。「助けてもらった。でも、遅かった」って。', 'worry'],
    ['player', '…遅くて、すみません。'],
    ['kajiwara', 'あの人が、人に「遅かった」と言ったの、初めて。言えるようになったのよ。…次は、早く、ね。']
  ], 'ch8.af_kr', { effects: [rel('kajiwara', 1, 2), tl('9月15日 野村さんの異変に、遅れて気づいた。「遅かった」と言ってもらえた')], view: OV(['kajiwara'], '12:25 駅事務室') });
  line('ch8.af_miss', [
    ['kajiwara', '野村さん、来週から、水曜の通院を、別の駅に変えるんですって。さっき、電話で。それだけ。'],
    ['player', '…気づくのが、遅くて。'],
    ['kajiwara', '責めてないの。「いいよ」の一言で、片づけようとする人だから。…本当は「いいよ、じゃないでしょう」って、誰かに言ってほしい人なのよ。', 'worry'],
    ['kajiwara', '帽子の預かり先は、あの人の家。住所は、聞いてあるわ。送るなら、今のうちよ。'],
    ['player', '…必ず。次は、聞き逃しません。']
  ], 'ch8.af_kr', { effects: [rel('kajiwara', 1, 2), tl('9月15日 野村さんの異変に気づけなかった。野村さんは、通院の駅を変えた')], view: OV(['kajiwara'], '12:25 駅事務室') });
  // 関係値が深いと、梶原さんは、帽子の由来を話す
  branch('ch8.af_kr', [[RL('kajiwara', 'rapport', '>=', 6), 'ch8.af_kr_y']], 'ch8.af_t');
  line('ch8.af_kr_y', [
    ['kajiwara', '…野村さんの作業帽ね。内側の「野村」の糸は、奥さんの字なの。'],
    ['kajiwara', '「いいよ」しか言わなくなったのは、奥さんが亡くなってから。…誰かに頼ると、思い出すんでしょうね。'],
    '湯呑みの湯気が、少しの間、二人の間に立っていた。'
  ], 'ch8.af_t', { effects: [set('ch8.hat_story')], view: OV(['kajiwara'], '12:28 駅事務室') });
  branch('ch8.af_t', [[F('ch8.tour_done'), 'ch8.af_tour']], 'ch8.af_cut');
  line('ch8.af_tour', [
    ['wakabayashi', '（電話）若林です。見学、予定どおりに終えられました。ありがとうございました。'],
    ['player', '…いえ。こちらこそ。']
  ], 'ch8.af_hi0', { effects: [ev('service', 2), rel('wakabayashi', 1, 2)], view: OV(['shiraishi'], '12:35 電話') });
  line('ch8.af_cut', [
    ['wakabayashi', '（電話）若林です。全部は見られませんでしたが、子どもたちは「次は全部見たい」と。'],
    ['player', '…もちろんです。次は、全部、お見せします。']
  ], 'ch8.af_hi0', { effects: [ev('service', 1)], view: OV(['shiraishi'], '12:35 電話') });
  // 子どもたちの帰りのバスと、人々の反応（選んだ答え・伝えたことが、人の口から戻ってくる）
  chain('ch8.af_hi', 'ch8.af_wk', [
    [F('ch8.hi_today'), [['wakabayashi', 'ひなたさんが、バスで「ありがとうより、気づくことが、だいじなんだよ」と。…何か、おっしゃいました？'], ['player', '…いえ。本当のことを、話しただけです。']]],
    [F('ch8.hi_general'), [['wakabayashi', 'ひなたさんが、「えがおって、かっこいい」と、バスでずっと。…大地くんは、「ぼくも駅員になる」と。']]],
    [F('ch8.hi_ask'), [['wakabayashi', 'ひなたさん、帰りのバスで、お母さんへの手紙を、書き始めました。「おべんとう、ありがとう」と。…聞かれたから、書けたそうです。', 'smile']]],
    [F('ch8.hi_honest'), [['wakabayashi', 'ひなたさんが、「うそを言わない人だった」と。…何を、お話しされたんですか。']]],
    [F('ch8.hi_silent'), [['wakabayashi', 'ひなたさん、帰りのバスで、少し静かでした。…何か、聞いてほしかったことが、あったのかもしれません。', 'worry']]],
    [F('ch8.focus_safety'), [['wakabayashi', '子どもたち、「黄色い線の内側」を、帰りのバスで合唱していました。…安全が、歌になりました。']]],
    [F('ch8.focus_people'), [['wakabayashi', '大地くんが、「こまってる人を、さがす仕事」と、何度も。先生より、上手に言いますよ。']]],
    [F('ch8.focus_machine'), [['wakabayashi', '運転台や仕組みの話ばかりで、美緒さんは、うとうとしていましたが…「ブレーキの音」だけは、覚えていました。']]],
    [F('ch8.cab_locked'), [['wakabayashi', '見られなかった場所を、大地くんが、毎日、鉛筆で描いています。…来年は、必ず、伺います。']]],
    [F('ch7.note_proc'), [['shiraishi', '夏の記録に、「手順」と書いたな。今朝の段取りは、あの紙を、写したそうだ。']]],
    [F('ch7.note_limit'), [['shiraishi', '夏の記録に、「目安を数字で」と書いたな。今朝の見学も、「十時、十時半、十一時」と、時刻で切ってあった。']]],
    [F('ch7.note_care'), [['shiraishi', '夏の記録に、「外で待つ人と、働く人の体調」と書いたな。今朝、君が、水を一本、多く持っていたのを見た。']]],
    [F('ch8.nomura_stung'), [['tachibana', '（電話）野村さん、帰りに零していた。「OBを、客扱いするな」と。…分かる奴にだけ、分かる。']]],
    [F('ch8.tachi_stepped'), [['tachibana', '（電話）あの時、黙ったな。…次は、お前の声で止めろ。']]],
    [F('ch8.x_kaji'), [['hamaguchi', '（電話）梶原さんに頼んだ件。本当に、「いいよ、じゃない」と叱ったそうよ。…人選も、判断のうち。']]],
    [F('ch8.x_chief'), [['hamaguchi', '（電話）駅長に頼んだ件。野村さんは、「大げさだ」と怒っていたそうよ。…動かす人は、動かされる人の気持ちも見て。']]],
    [F('ch8.p_quiet'), [['sawada', '（電話）沢田です。止めずに、電池を渡した件。…聞いてくれた人の動きは、速い。次の資料に、「聞こえない人の席」を作ります。']]],
    [F('ch8.mio_heard'), [['sawada', '（電話）美緒さんの一言、拾ってくれてありがとう。あの子は、来年も、小さな声で、正しいことを言います。']]]
  ], OV(['shiraishi'], '12:38 電話'));
  // 関係値で開く話：先生が、来年の約束を持ち出す
  branch('ch8.af_wk', [[RL('wakabayashi', 'trust', '>=', 2), 'ch8.af_wk_y']], 'ch8.af_r');
  line('ch8.af_wk_y', [
    ['wakabayashi', '（電話）それと。来年も、お願いしたいんです。三年生が四年生になった時、「あの駅員さん、まだいる？」と、聞かれる気がして。'],
    ['player', '…います。どこの持ち場にいても、水曜の午前は、空けておきます。', 'smile']
  ], 'ch8.af_r', { effects: [set('ch8.school_invite')], view: OV(['shiraishi'], '12:42 電話') });

  branch('ch8.af_r', [[F('ch8.route_done_depot'), 'ch8.af_rd'], [F('ch8.route_done_dispatch'), 'ch8.af_rx'], [F('ch8.route_done_planning'), 'ch8.af_rp']], 'ch8.af_rs');
  line('ch8.af_rs', [['kubota', '駅は、今日みたいな日の、いちばん前に立つ場所です。声を拾うのは、ここから始まります。']], 'ch8.af_p', { view: OV(['kubota']) });
  line('ch8.af_rd', [['tachibana', '（電話）橘だ。基地の人間は、機械の音ばかり聞く。人の音を忘れがちだ。今日は、君がいて助かった。']], 'ch8.af_p', { effects: [rel('tachibana', 1, 2)], view: DV(['tachibana'], '12:40 電話') });
  line('ch8.af_rx', [['hamaguchi', '（電話）浜口。声の向こうの音を拾える人に、指令室は救われた。それだけ。']], 'ch8.af_p', { effects: [rel('hamaguchi', 1, 2)], view: XV(['hamaguchi'], '12:40 電話') });
  line('ch8.af_rp', [['sawada', '（電話）沢田です。ひなたさんの宿題、次の資料に入れます。「いつ」を、はっきり。']], 'ch8.af_p', { effects: [rel('sawada', 1, 2)], view: PV(['sawada'], '12:40 電話') });
  branch('ch8.af_p', [[F('ch4.secret_kept'), 'ch8.af_sec'], [F('ch4.trust_built'), 'ch8.af_trust']], 'ch8.af_h');
  line('ch8.af_sec', [['shiraishi', '春の「あの件」を、まだ誰にも話していないそうだな。言えない人の声を拾えるのは、言わない苦しさを知っているからだろう。']], 'ch8.af_h', { view: OV(['shiraishi']) });
  line('ch8.af_trust', [['shiraishi', '今日、君が足を止められたのは、春からの信頼があったからだ。周りが、任せてくれた。財産だぞ。']], 'ch8.af_h', { view: OV(['shiraishi']) });
  branch('ch8.af_h', [[F('ch3.honest'), 'ch8.af_hon'], [F('ch3.pushed'), 'ch8.af_push']], 'ch8.fin_choice');
  line('ch8.af_hon', [['kubota', '最初のころ、分からないと正直に言ってくれましたね。今日も、言えない人の分まで聞き返してた。変わってません。', 'smile']], 'ch8.fin_choice', { view: OV(['kubota']) });
  line('ch8.af_push', [['kubota', '前に出る人でしたね。今日は、一歩下がって、耳を澄ませてた。気づいてました？']], 'ch8.fin_choice', { view: OV(['kubota']) });
  choice('ch8.fin_choice', '今日の経験を、どう活かす？', [
    opt('greet', '毎週水曜、通院の常連さんに、必ず自分から声をかける', 'ch8.closing', { tone: 'caring', effects: [set('ch8.vow_greet'), ev('service', 2), rel('kajiwara', 1, 1)] }),
    opt('note', '「声にならない合図」の見分け方を、駅の皆と共有するメモにする', 'ch8.closing', { tone: 'careful', effects: [set('ch8.vow_note'), ev('teamwork', 2), ev('accuracy', 1)] }),
    opt('wait', '無理に踏み込まず、頼られたらすぐ応える準備をしておく', 'ch8.closing', { tone: 'neutral', effects: [set('ch8.vow_wait'), ev('safety', 1)] })
  ], { important: true, view: OV(['shiraishi', 'kubota']) });
  line('ch8.closing', [
    ['shiraishi', '声を拾うのは、一日では身につかん。今日、何を拾い、何を拾えなかったか。覚えておけ。'],
    ['kubota', '昼は、ゆっくり食べましょう。午前中、ずっと耳を使いましたから。', 'smile'],
    '窓の外を、子どもたちのバスが通り過ぎる。ガラスの向こうで、団扇が一つ、小さく揺れていた。'
  ], 'ch8.end', { effects: [{ clock: { minute: hm(12, 50) } }], view: OV(['shiraishi', 'kubota'], '12:50 駅事務室') });

  N['ch8.end'] = { id: 'ch8.end', type: 'end', chapter: 'ch8', title: '第8章 ホームの声', nextChapter: 'ch9',
    summary: '子どもたちの質問と、高齢の常連の小さな異変が重なった一日。足を止めたか、段取りを守ったか。拾えた声と拾えなかった声が、これからの駅員としての形を作っていく。',
    effects: [tl('9月15日 ホームの声を聞く一日を終える'), log('第8章を終了', 'chapter')] };
  k.shuffleCompose('ch8.');
}
