// R7 第5章「券売機のむこう側」（5月14日〜5月21日、5月27日の余波）。悪意の犯人はいない、運用の隙間を辿る静かなミステリー。
// 構造：3Dハブ（5/14）→ 志望書の締切 → 記録の照合（失敗・偽の解決あり）→ 木曜夜の張り込み（3D・任意）→ 結果・報告（4択・各4ノード以上）
//       → 宮前への連絡（3D・付箋）→ 推薦者の発表（5/21）。
// 賭け金：基地推薦（志望書5/14 17:00）／本社への信用（lock hq_trust_may・hq_direct）／山科の推薦（y_out）／他駅の停止。
// 取り返しのつかない変化：lock hq_trust_may（部品交換と報告→撤回）／lock hq_direct（本社へ直接）／lock slot_yama（山科の今年度推薦が閉じる）／lock miyamae_note／lock slot_this_year。
// モチーフ：黄色い付箋（久保田の机・宮前のロッカー・最後に{player}が書く場所）。
// 引継ぎ：docs/analysis/handoff-ch4-6.md
export default function ch5(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, mini, hub, P, res3 } = k;

  characters.hiyama = { id: 'hiyama', name: '檜山 圭', kana: 'ひやま けい', role: '券売機メーカー保守員（東和機器サービス）', dept: 'none', age: 38, years: 14, uniform: '#2f5a5a', hair: '#2a2a2a', skin: '#e9c7a2', trait: '淡々と丁寧。「記録が先、推測はあと」。実は自社の周知の不手際を気にしている。', bio: '券売機・改札機の保守を14年。機械より、機械のまわりの手順を見る人。', gender: 'm', accessory: 'bag' };
  characters.miyamae = { id: 'miyamae', name: '宮前 隼人', kana: 'みやまえ はやと', role: '駅務係員（4月に海浜口駅へ異動）', dept: 'station', age: 31, years: 9, uniform: '#1d2a44', hair: '#2b2118', skin: '#efc9a6', trait: '几帳面。自分の工夫を人に伝えるのが苦手。', bio: '前任の釣銭補充担当。4月1日付で海浜口駅へ。', gender: 'm', accessory: 'none' };

  const O = (who, cap) => v25('office', who, cap);
  const RG = (char, op, val, key = 'trust') => ({ rel: { char, key, op, val } });
  const OWN = (op, val) => ({ var: { key: 'ch5.own', op, val } });
  const lockE = (id, note) => ({ lock: { id, note } });
  const clue = () => [{ var: { key: 'ch5.own', add: 1 } }];
  const help = () => [{ var: { key: 'ch5.helped', add: 1 } }];
  const miss = () => [{ var: { key: 'ch5.misled', add: 1 } }];
  const task = (id, kind, title, intro, extra, results, view) => (N[id] = { id, type: 'task', kind, title, intro, ...extra, results, view });
  const bestRoute = (grid, must) => { const Hh = grid.length, W = grid[0].length; let s; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) { q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi; const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); } } }
    return 20; };
  const go = (id, lines, next, effects, view) => (effects && !Array.isArray(effects) ? line(id, lines, next, { view: O([]), ...effects }) : line(id, lines, next, { ...(effects ? { effects } : {}), view: view ?? O([]) }));

  // ================= 第1日 5月14日（金）：券売機の前 =================
  line('ch5.open', [
    '「ピッ。釣銭切れ」。昨夜二十三時すぎ、2号機はそう言って黙った。',
    ['kubota', '六回目です。数えたのは、今朝ですが。', 'serious'],
    ['shiraishi', '現金は足りていた。機械だけが「ない」と言い張る。'],
    '久保田の机の端に、黄色い付箋が三枚。どれも端が丸まっている。',
    ['kubota', '付箋は剥がれます。だから今日からノートです。'],
    ['shiraishi', '今日はメーカーが来る。{player}、立ち会え。志望書の箱は、十七時で閉める。'],
    ['shiraishi', '定時で上がること。調べものは勤務内でやる。']
  ], 'ch5.hub', { effects: [{ clock: { addDay: 9, minute: hm(8, 20) } }, tl('5月14日 券売機2号機の夜間停止の原因調査に立ち会う'), log('第5章開始。券売機の夜間停止の調査', 'work')], view: O(['shiraishi', 'kubota'], '5月14日（金） 8:20 駅事務室 朝礼') });

  hub('ch5', {
    title: '青嶺中央駅 勤務（5月14日・金）', hint: '券売機2号機の前から始めます。十七時で志望書の箱が閉まります。',
    timed: [{ id: 'close', at: hm(17, 0), goto: 'ch5.d1_end' }],
    goals: [
      { id: 'g_meet', label: '券売機2号機の前で保守員を迎える', when: F('ch5.met') },
      { id: 'g_inside', label: '保守員と内部の点検に立ち会う', when: F('ch5.inside_done') },
      { id: 'g_route', label: '自分の持ち場の目線で、記録をたどる', when: F('ch5.route_item') },
      { id: 'g_sakai', label: '（任意）売店の坂井さんに話を聞く', when: F('ch5.sakai_done'), optional: true, showWhen: F('ch5.met') }
    ],
    exit: { label: '調べた内容を整理して、一日を終える', requires: ALL(F('ch5.met'), F('ch5.inside_done'), F('ch5.route_item')), goto: 'ch5.d1_end' }
  });
  N['ch5.hub'].interactions.push(
    { id: 'greet', object: 'vend2', label: '券売機2号機の前で、保守員を迎える', goto: 'ch5.meet', once: true, icon: '🧰' },
    { id: 'sakai', object: 'sakai', label: '売店の坂井さんに、券売機のことを尋ねる', goto: 'ch5.sakai', requires: ALL(F('ch5.met'), T('>=', hm(10, 30))), once: true, icon: '💬' },
    { id: 'r_service', object: 'ticket_office', label: '窓口の応対伝票を見せてもらう（窓口の目線）', goto: 'ch5.rs_1', requires: ALL(F('ch5.met'), F('route.service')), once: true, icon: '🗂️' },
    { id: 'r_platform', object: 'yamashina', label: '山科さんに、遅番のホームの様子を聞く（ホームの目線）', goto: 'ch5.rp_1', requires: ALL(F('ch5.met'), F('route.platform')), once: true, icon: '🚉' },
    { id: 'r_office', object: 'terminal', label: '事務室の綴りと引継ぎを開く（記録の目線）', goto: 'ch5.ro_1', requires: ALL(F('ch5.met'), ANY(F('route.office'), ALL(NF('route.service'), NF('route.platform')))), once: true, icon: '📚' });

  mini({ ch: 'ch5', key: 'inside', req: F('ch5.met'), who: 'hiyama', object: 'vend2', from: [10, 0], to: [16, 0], label: '保守員と一緒に、券売機の内部を点検する', goal: '（立会い）券売機2号機の内部点検', title: '券売機2号機 内部の確認', cam: 'npc:vend2',
    hint: '扉を開けた内部の絵から、気になる箇所をタップします。', kind: 'find',
    intro: ['触るのは私だけ。見て、声に出してください。', '原因かどうかは後で。まず全部拾います。'],
    config: { scene: 'gate', seconds: 40, props: [P(0.04, 0.12, 0.26, 0.34, '#4a5568', '紙幣識別部'), P(0.34, 0.12, 0.28, 0.34, '#2f5d8a', '釣銭カセット（千円）'), P(0.66, 0.12, 0.3, 0.34, '#2f7a56', '釣銭カセット（百円）'), P(0.04, 0.58, 0.3, 0.3, '#8a8f96', '銘板・点検シール'), P(0.4, 0.58, 0.2, 0.3, '#a35c00', '表示灯'), P(0.66, 0.58, 0.3, 0.3, '#555', '制御基板')], spots: [
      { id: 'dust', x: 0.12, y: 0.3, label: '識別部のセンサー窓に、うっすらほこりがある（紙幣が戻る症状の原因になりうる）' }, { id: 'seal', x: 0.48, y: 0.32, label: '千円カセットの封印札に「5/12」と補充日の記入がある' }, { id: 'label', x: 0.14, y: 0.74, label: '銘板のソフト版数は「3.4.0」。貼ってある点検シールは「3.2.1」のまま' }, { id: 'ok', x: 0.82, y: 0.32, real: false, label: '百円カセットは正常です' }] },
    good: '数字と日付の書いてある所に、指が止まった。檜山が、それを手帳に写した。', mid: '檜山が、同じ場所をもう一度、ゆっくり指した。', bad: '檜山は何も言わず、懐中電灯を、少しだけ下に向けた。', ge: [set('ch5.h_inside'), ev('accuracy', 2), rel('hiyama', 1, 1), ...clue()], me: [...help()], be: [...miss()], log: '券売機内部の点検に立会い。ソフト版数と補充日を確認', min: 25 });

  // ---- 保守員との出会い → 重要選択①：どう調べるか ----
  line('ch5.meet', [
    '10時ちょうど。2号機の前に、工具バッグがどすんと置かれた。',
    ['hiyama', '東和機器サービスの檜山です。まず一つ、お願いが。私の話も、記録と突き合わせて聞いてください。'],
    ['player', '部品の交換になりますか？'],
    ['hiyama', '交換は最後です。今は「止まる」ことしか分かっていない。'],
    ['kubota', '復旧して終わり、を六回繰り返しました。'],
    ['hiyama', 'その六回を、全部並べる手もあります。地味ですが。'],
    ['hiyama', '駅は「早く直せ」が本音でしょう。{player}さんは、どう進めたいですか。']
  ], 'ch5.method', { effects: [{ clock: { minute: hm(10, 0) } }, set('ch5.met'), log('保守員の檜山さんと対面', 'work')], view: O(['hiyama', 'kubota'], '10:00 券売機2号機の前') });
  choice('ch5.method', '券売機の不具合を、どう調べたいですか？', [
    opt('parts', '「まず、基板か釣銭ユニットの交換をお願いしたいです」', 'ch5.m_parts', { tone: 'quick', effects: [set('ch5.m_parts')] }),
    opt('records', '「止まった日時を、記録から全部並べて確かめたいです」', 'ch5.m_records', { tone: 'careful', effects: [rel('hiyama', 1, 1)] }),
    opt('leave', '「専門の方にお任せして、通常の業務に戻ります」', 'ch5.m_leave', { tone: 'neutral', effects: [set('ch5.m_leave'), { var: { key: 'ch5.own', add: -1 } }] })
  ], { important: true, who: 'hiyama', view: O(['hiyama', 'kubota'], '10:05 券売機2号機の前') });
  go('ch5.m_parts', [
    ['hiyama', '手配します。ただ、私は勧めません。記録に、そう書いておきます。'],
    ['kubota', '……交換で済むなら、と私も思っていました。'],
    ['hiyama', '決めたのは{player}さんです。責めてはいません。来週の火曜に、持ってきます。']
  ], 'ch5.hub', [], O(['hiyama', 'kubota']));
  go('ch5.m_records', [
    ['hiyama', '一番確実で、一番地味です。覚悟を。', 'smile'],
    ['kubota', '綴りは事務室に全部あります。'],
    ['hiyama', '火曜に監視ログを持ってきます。今日は記録の在りかを。']
  ], 'ch5.hub', null, O(['hiyama', 'kubota']));
  go('ch5.m_leave', [
    ['hiyama', '分かりました。結果は後ほど連絡します。'],
    ['kubota', '任せるのも判断です。でも、何が分かったかは、自分の口で言えるように。', 'serious'],
    ['hiyama', '内部点検は、横で見ていきませんか。見るだけなら邪魔になりません。']
  ], 'ch5.hub', null, O(['hiyama', 'kubota']));

  line('ch5.sakai', [
    ['sakai', 'あの機械、やっぱり調子悪いの？ 木曜の夜はね、千円札を握って泣きそうな顔が来るのよ。', 'worry'],
    ['sakai', 'うちは21時閉店。両替は規則でできないから、断るの。心が痛いわ。'],
    ['player', '木曜……ですか。'],
    ['sakai', '貼り紙は朝には消えてるから、直ったと思ってたの。ほら、コーヒー。']
  ], 'ch5.hub', { effects: [set('ch5.sakai_done'), rel('sakai', 1, 2), { var: { key: 'ch5.own', add: 1 } }, time(15), log('売店の坂井さんから、夜の両替依頼の話を聞く', 'work')], view: v3('npc:sakai', '売店前') });

  // ---- 持ち場ごとの切り口 ----
  line('ch5.rs_1', [
    '窓口の引き出しから、輪ゴムの束が出てきた。「お客様の声」。紙は湿気で波打っている。',
    ['kubota', '月末に本社へ送るだけで、誰も読み返しません。私も。'],
    ['kubota', '窓口は19時閉まり。遅い声は、翌朝の早番が聞いた話で書きます。'],
    ['player', '起きた日と、書かれた日。一日違うと、別の出来事に見えますね。'],
    ['kubota', '一枚ずつ、「いつ」と「誰が書いたか」を。']
  ], 'ch5.rs_end', { view: O(['kubota'], '窓口 応対伝票の束') });
  fx('ch5.rs_end', [set('ch5.route_item'), time(20), log('窓口の応対伝票を読み、書かれた日と起きた日のずれに気づく', 'work')], 'ch5.hub');
  line('ch5.rp_1', [
    ['yamashina', '券売機？ あー、木曜の遅番。最終列車の前に、走ってくる客がいるんだよ。毎週。', 'worry'],
    ['yamashina', 'ホーム日誌に書いた。「改札外 券売機停止の訴え」。誰も開かない日誌だけどな。'],
    ['yamashina', '走る時刻は、毎回ほぼ同じ。そこだけは俺が一番詳しい。', 'smile']
  ], 'ch5.rp_branch', { view: O(['yamashina'], 'ホーム担当の控え') });
  branch('ch5.rp_branch', [[F('ch4.ledger_unknown'), 'ch5.rp_sk'], [F('ch4.covered_yama'), 'ch5.rp_cv'], [ALL(F('ch4.told_alone'), RG('yamashina', '<', 8)), 'ch5.rp_al']], 'ch5.rp_tb');
  line('ch5.rp_sk', [
    ['yamashina', '……三号機の「原因不明」、まだ月末まで残ってる。', 'worry'],
    ['yamashina', '記録を並べたら、俺の四百円も出るかもな。そのときは、お前の判断でいい。'],
    ['player', '今は券売機。出てきたら、出てきたときだ。']
  ], 'ch5.rp_end', { effects: [rel('yamashina', 0, 1)], view: O(['yamashina']) });
  line('ch5.rp_cv', [
    ['yamashina', '日計の件は、閉じた。……借りは、借りのままだ。', 'normal'],
    ['yamashina', '俺のメモが役に立つなら、全部出す。']
  ], 'ch5.rp_end', { effects: [rel('yamashina', 0, 1)], view: O(['yamashina']) });
  line('ch5.rp_al', [
    ['yamashina', '……仕事の話なら、する。', 'normal'],
    '山科は、日誌を開いて、頁の端を、親指で押さえた。時刻の欄だけを、{player}のほうへ向けた。'
  ], 'ch5.rp_end', { effects: [rel('yamashina', 0, 1)], view: O(['yamashina']) });
  line('ch5.rp_tb', [
    ['yamashina', 'あの票を書いてから、日付と時刻は二回見る癖がついた。', 'smile'],
    ['yamashina', '俺のメモが役に立つなら、全部出す。']
  ], 'ch5.rp_end', { effects: [rel('yamashina', 1, 1)], view: O(['yamashina']) });
  fx('ch5.rp_end', [set('ch5.route_item'), { var: { key: 'ch5.own', add: 1 } }, time(20), log('ホーム日誌に、毎週同じ時刻の券売機停止の訴えが残っていることを確認', 'work')], 'ch5.hub');
  line('ch5.ro_1', [
    '書庫の扉を開けると、紙とインクの匂いがした。綴りは四種類。',
    ['shiraishi', '受付簿、補充票、点検票、引継ぎ帳。書く人も場所も違う。'],
    ['shiraishi', '同じ券売機の話が、四か所に散らばっている。並べて読む人は、誰の仕事でもない。', 'serious']
  ], 'ch5.ro_nb', { view: O(['shiraishi'], '事務室 書庫') });
  branch('ch5.ro_nb', [[F('legacy.notebook_missing'), 'ch5.ro_nb_a']], 'ch5.ro_nb_b');
  line('ch5.ro_nb_a', [
    ['shiraishi', '頁を切り取られた引継ぎ帳。あれは紙のせいだと思いたかった。', 'serious'],
    ['shiraishi', '違う。誰が書き、誰が読み、誰が持つか。決めていなかっただけだ。']
  ], 'ch5.ro_end', { view: O(['shiraishi']) });
  line('ch5.ro_nb_b', [
    ['shiraishi', '持ち出しは事務室の中まで。写しが要るなら私に言え。'],
    ['shiraishi', '読むときは、日付、版、書いた人。三つだ。']
  ], 'ch5.ro_end', { view: O(['shiraishi']) });
  fx('ch5.ro_end', [set('ch5.route_item'), { var: { key: 'ch5.own', add: 1 } }, time(20), log('事務室の綴り四種を机に並べる', 'work')], 'ch5.hub');

  // ---- 第1日の終わり：志望書の箱が閉まる ----
  line('ch5.d1_end', [
    '16時50分。2号機の扉が閉まり、「点検済」の札が揺れた。',
    ['hiyama', '今日は点検だけです。火曜、18日にまた来ます。'],
    ['hiyama', '今夜、気づきを書いておくといい。人は三日で細部を忘れる。'],
    '十七時。事務室の隅で、白石が志望書の箱の蓋に、手を置いた。'
  ], 'ch5.sub_gate', { effects: [{ clock: { minute: hm(17, 0) } }], view: O(['hiyama', 'shiraishi'], '17:00 駅事務室') });
  branch('ch5.sub_gate', [[F('ch4.slot_apply'), 'ch5.sub_a'], [F('ch4.slot_wait'), 'ch5.sub_w']], 'ch5.sub_p');
  go('ch5.sub_a', ['箱の中に、志望書が二通。一通は、{player}のもの。もう一通は、角がきっちり揃った山科の封筒。'], 'ch5.memo', [set('ch5.submitted'), tl('5月14日 基地入門研修の志望書を提出した')], O(['shiraishi']));
  go('ch5.sub_p', ['箱の中に、志望書が一通。角がきっちり揃った山科の封筒だけ。', '{player}は、箱の前を、通り過ぎた。'], 'ch5.memo', null, O(['shiraishi']));
  go('ch5.sub_w', [
    '十七時まで、あと三分。{player}の鞄の中に、書きかけの志望書。',
    ['yamashina', '……お前の、まだ、出てないぞ。', 'worry'],
    '白石が、箱の蓋を、少しだけ持ち上げて、止めた。'
  ], 'ch5.sub_wc', null, O(['shiraishi', 'yamashina'], '16:57 駅事務室'));
  choice('ch5.sub_wc', '志望書を、箱に入れますか。', [
    opt('submit', '入れる', 'ch5.sub_w_y', { tone: 'honest', effects: [set('ch5.submitted'), rel('yamashina', 0, 1), tl('5月14日 志望書を締切に間に合わせて提出した')] }),
    opt('no', '入れない（何も言わない）', 'ch5.sub_w_n', { tone: 'neutral', effects: [lockE('slot_self', '志望書を出さないまま、今年度の締切が閉じた')] })
  ], { timeLimit: 15, defaultOption: 'no', view: O(['shiraishi', 'yamashina']) });
  go('ch5.sub_w_y', [['shiraishi', '預かる。'], '蓋が、閉まった。山科の目が、一瞬だけ、動いた。'], 'ch5.memo', null, O(['shiraishi', 'yamashina']));
  go('ch5.sub_w_n', ['白石は、何も言わず、箱の蓋を閉めた。', '鞄の中の紙は、まだ、ただの紙だった。'], 'ch5.memo', null, O(['shiraishi']));

  choice('ch5.memo', '今日の気づきを、どう残しますか？', [
    opt('write', '調査メモに、日付・時刻・出典つきで書く', 'ch5.memo_w', { tone: 'careful', effects: [set('ch5.rec_memo'), ev('reporting', 1)] }),
    opt('head', '頭の中で覚えておく', 'ch5.memo_h', { tone: 'quick', effects: [] })
  ], { view: O(['hiyama']) });
  go('ch5.memo_w', [['hiyama', '「いつ、どこで、誰の記録で」。三つ揃えば、誰でも使える。', 'smile']], 'ch5.d2_gate', [tl('5月14日 調査メモを作成。出典つきで残す')], O(['hiyama']));
  go('ch5.memo_h', [['hiyama', '火曜に、思い出せる分で始めましょう。'], ['kubota', '（小声で）付箋は剥がれますよ。頭も。']], 'ch5.d2_gate', null, O(['hiyama', 'kubota']));
  branch('ch5.d2_gate', [[F('ch5.m_parts'), 'ch5.fp_open']], 'ch5.d2_open');

  // ================= 偽の解決：部品交換 =================
  go('ch5.fp_open', [
    '5月18日（火）。雨。檜山が、白い箱を二つ、台車で運んできた。',
    ['hiyama', '基板と、釣銭ユニット。駅長の承認印が、もう入っています。'],
    '午前中、2号機は幕で覆われた。窓口の前に、列ができた。',
    ['kubota', '1号機と3号機に、振り分けます。', 'serious'],
    '午後一時。幕が外れた。新しい基板の緑が、扉の隙間で光った。'
  ], 'ch5.fp_2', { effects: [{ clock: { addDay: 4, minute: hm(13, 0) } }, tl('5月18日 券売機2号機の基板と釣銭ユニットを交換した')], view: O(['hiyama', 'kubota'], '5月18日（火） 13:00 券売機2号機の前') });
  go('ch5.fp_2', [
    '5月19日（水）、補充の日。久保田が、金庫の鍵を回した。',
    ['kubota', '……画面に、案内が出ました。「補充後、確定を押してください」。', 'surprise'],
    ['hiyama', '新しい基板は、最初の補充で案内を出します。……よく読んで、押してください。'],
    '久保田が、確定を押した。カチ、と小さな音。'
  ], 'ch5.fp_3', { effects: [{ clock: { addDay: 1, minute: hm(14, 30) } }], view: O(['hiyama', 'kubota'], '5月19日（水） 14:30 券売機2号機の前') });
  go('ch5.fp_3', [
    '5月21日（金）。檜山が、監視ログを机に置いた。',
    ['hiyama', '20日の夜は、停止の記録がありません。'],
    ['kubota', '止まらなかった……。直ったんですね。', 'smile'],
    ['hiyama', '……同じ条件か、まだ言い切れません。', 'worry'],
    '白石が、承認印の朱肉を、指で押さえた。'
  ], 'ch5.fp_doubt', { effects: [{ clock: { addDay: 2, minute: hm(8, 40) } }, tl('5月21日 交換後の木曜夜は、停止が起きなかった')], view: O(['hiyama', 'kubota', 'shiraishi'], '5月21日（金） 8:40 駅事務室') });
  choice('ch5.fp_doubt', '停止しなかった。報告を上げますか。', [
    opt('accept', '「直ったと報告します。部品交換の効果です」', 'ch5.fp_acc', { tone: 'quick', effects: [set('ch5.false_report'), ev('reporting', 1)] }),
    opt('doubt', '「待ってください。補充の記録も並べさせてください」', 'ch5.fp_doubt_y', { tone: 'careful', effects: [ev('accuracy', 1), rel('hiyama', 1, 1)] })
  ], { timeLimit: 25, defaultOption: 'accept', important: true, who: 'hiyama', view: O(['hiyama', 'shiraishi']) });
  // 受け入れる：一週間後に、止まる
  go('ch5.fp_acc', [
    ['shiraishi', '本社へ上げる。「部品交換により復旧」。'],
    ['hiyama', '……こちらの記録には、「原因未特定」と書きます。', 'worry'],
    '朱肉の赤が、紙に丸く、乗った。'
  ], 'ch5.fp_relapse', { effects: [lockE('hq_trust_may', '「部品交換で復旧」と本社へ報告した。のちに撤回した'), tl('5月21日 本社へ「部品交換で復旧」と報告した')], view: O(['shiraishi', 'hiyama']) });
  go('ch5.fp_relapse', [
    '5月27日（木）、二十三時十分。駅事務室の電話が鳴った。',
    ['kubota', '……止まりました。2号機が。釣銭切れ。六回目の、次です。', 'worry'],
    '翌朝、売店の坂井が、言いにくそうに言った。',
    ['sakai', '昨夜ね、終電に乗れなかったお客さんがいたのよ。千円札を握ったまま、歩いて帰るって。', 'worry'],
    '交換した基板の最初の補充案内は、一度きりだった。次の補充では、誰も、確定を押さなかった。'
  ], 'ch5.fp_retract', { effects: [{ clock: { minute: hm(8, 30) } }, set('ch5.relapsed'), rel('sakai', 0, 1), tl('5月27日 交換後の最初の木曜に、再び停止。終電を逃したお客様が出た')], view: O(['kubota', 'sakai'], '5月28日（金） 8:30 駅事務室') });
  go('ch5.fp_retract', [
    ['shiraishi', '本社の報告は、取り下げる。取り下げる報告も、書く。'],
    ['hiyama', '補充後の「確定」操作。三月の更新からです。最初の補充で出る案内は、一度きり。'],
    ['hiyama', '基板を替えて、案内がまた出た。だから、止まらなかった。それだけです。'],
    ['kubota', '……見ていませんでした。見る場所を、私たちが持っていなかった。']
  ], 'ch5.report_intro', { effects: [ev('reporting', -1), rel('shiraishi', -1, 0)], view: O(['shiraishi', 'hiyama', 'kubota'], '5月28日（金） 9:00 駅事務室') });
  // 疑う：回収は早いが、実績は残らない
  go('ch5.fp_doubt_y', [
    ['hiyama', '……ありがとうございます。補充のとき、画面に何が出たか、久保田さんに聞きましょう。'],
    ['kubota', '案内が……出ました。一度だけ。「確定を押してください」。'],
    ['hiyama', '三月の更新から、補充後に「確定」が要ります。案内が出るのは、最初の補充だけ。新しい基板は、また最初から。'],
    ['shiraishi', '交換の報告は、出さない。……部品は、悪くなかったわけだ。']
  ], 'ch5.report_intro', { effects: [{ clock: { minute: hm(9, 0) } }, tl('5月21日 交換後に止まらなかった理由を確かめ、部品交換が原因ではないと整理した')], view: O(['hiyama', 'kubota', 'shiraishi'], '5月21日（金） 9:00 駅事務室') });

  // ================= 第2日 5月18日（火）：記録の照合 =================
  line('ch5.d2_open', [
    '5月18日（火）。雨。長机に、四種の綴りと、監視ログの束が広がった。',
    ['hiyama', '午後三時までに区切ります。勤務を妨げない範囲で。'],
    ['kubota', '窓口に出る時間があるので、助かります。']
  ], 'ch5.d2_route', { effects: [{ clock: { addDay: 4, minute: hm(8, 50) } }, tl('5月18日 券売機の記録を並べて照合する')], view: O(['hiyama', 'kubota'], '5月18日（火） 8:50 駅事務室') });
  branch('ch5.d2_route', [[F('ch5.m_leave'), 'ch5.d2_leave']], 'ch5.d2_rt');
  go('ch5.d2_leave', [['kubota', '「お任せ」は悪くない。今日からは一緒に読みましょう。'], ['hiyama', '人が増えると、見落としが減ります。']], 'ch5.d2_rt', [rel('kubota', 0, 1)], O(['hiyama', 'kubota']));
  branch('ch5.d2_rt', [[F('route.service'), 'ch5.rt_service'], [F('route.platform'), 'ch5.rt_platform']], 'ch5.rt_office');

  // -- 窓口：伝票を仕分ける --
  line('ch5.rt_service', [
    ['hiyama', '人の言葉は、機械のログより日付が曖昧です。'],
    ['kubota', '伝票を、三つに。実際の停止、後から書いた記録、別件。'],
    ['player', '紙幣が戻る、紙詰まり。あれは別件ですね。']
  ], 'ch5.dt_service', { view: O(['hiyama', 'kubota'], '窓口伝票の仕分け') });
  task('ch5.dt_service', 'sort', '窓口伝票の仕分け', '各伝票が、実際の停止か、後から書かれた記録か、別件かを選びます。', {
    config: { perItem: 12, bins: [{ id: 'real', label: '実際に停止した時刻' }, { id: 'wrote', label: '後から書かれた記録' }, { id: 'other', label: '今回とは別の件' }], items: [
      { id: 'a', label: '5/6（木）22:48「釣銭切れで切符が買えない」お客様の声', bin: 'real', why: '訴えが出た時刻の記録で、起きた日は木曜です。' },
      { id: 'b', label: '5/7（金）06:10 受付簿「釣銭切れ表示、補充し復旧」', bin: 'wrote', why: '翌朝の早番が書いたもので、起きたのは前夜です。' },
      { id: 'c', label: '4/9（金）08:30「千円札が戻ってくる」→識別部清掃で復旧', bin: 'other', why: '紙幣が戻る症状は、別の障害です。' },
      { id: 'd', label: '4/29（木・祝）22:55 窓口は閉まっていたが、改札で声が上がった', bin: 'real', why: '祝日でも、木曜の夜に起きています。' },
      { id: 'e', label: '5/13（木）23:05 売店の坂井さんの口頭の話を後日メモ', bin: 'wrote', why: '後日書かれたメモで、起きた日と書いた日が違います。' },
      { id: 'f', label: '5/3（月）11:20 紙詰まりで窓口に案内', bin: 'other', why: '釣銭切れの停止ではなく、別の障害です。' }] }
  }, res3('ch5.dt_s_good', 'ch5.dt_s_mid', 'ch5.dt_s_bad', clue(), help(), miss()), O(['hiyama'], '窓口伝票の仕分け'));
  go('ch5.dt_s_good', [['kubota', '……私が毎週書いた受付簿は、「復旧した日」でした。起きた日じゃない。', 'worry'], ['hiyama', '表と裏が合いました。']], 'ch5.date_end', null, O(['hiyama', 'kubota']));
  go('ch5.dt_s_mid', [['hiyama', '本当の停止は木曜の夜です。書かれた日は金曜の朝。私の見立てです。確かめてください。']], 'ch5.date_end', null, O(['hiyama']));
  go('ch5.dt_s_bad', [['kubota', '混ざりますよね。私もそうでした。'], ['hiyama', '……この仕分けは、使えません。私が引き取ります。', 'serious']], 'ch5.date_end', null, O(['hiyama', 'kubota']));

  // -- ホーム：最終列車前の動線 --
  line('ch5.rt_platform', [
    ['yamashina', '最終列車の前に、走ってくる客。道順を描くか。'],
    ['hiyama', '券売機、改札、ホーム日誌の棚。三か所を通る経路で。'],
    ['yamashina', '階段は走ると危ない。混んだ通路は遅い。']
  ], 'ch5.dt_platform', { view: O(['hiyama', 'yamashina'], 'ホーム日誌と券売機の動線') });
  { const grid = ['S..#.....', '.#.#.###.', '.#A...B~.', '.####.#..', 'C......~G']; const must = ['A', 'B', 'C'];
    task('ch5.dt_platform', 'route', '最終列車前の動線をたどる', '起点から着点まで、A（券売機）・B（改札）・C（ホーム日誌の棚）を必ず通ります。混んだ通路は遅くなります。', {
      config: { grid, must, best: bestRoute(grid, must), legend: { '#': '壁・階段（通れない）', '~': '混雑した通路（遅い）', A: '券売機2号機', B: '改札', C: 'ホーム日誌の棚', S: '起点', G: '最終列車のホーム' } }
    }, res3('ch5.dt_p_good', 'ch5.dt_p_mid', 'ch5.dt_p_bad', clue(), help(), miss()), O(['yamashina'], '最終列車前の動線')); }
  go('ch5.dt_p_good', [['yamashina', '木曜の行が毎週並んでる。機械の気まぐれじゃないぞ。', 'surprise'], ['hiyama', '受付簿は金曜の朝。一日ずれています。']], 'ch5.date_end', null, O(['yamashina', 'hiyama']));
  go('ch5.dt_p_mid', [['yamashina', '遠回りだったが、日誌には着いたな。'], ['hiyama', '日誌の日付と、受付簿を、あとで並べておきます。']], 'ch5.date_end', null, O(['yamashina', 'hiyama']));
  go('ch5.dt_p_bad', [['yamashina', '悪い、走る順を間違えた。……日誌、俺が読み上げる。'], ['hiyama', '今日の動線は、記録には使いません。']], 'ch5.date_end', null, O(['yamashina', 'hiyama']));

  // -- 事務室：綴りの日付を突き合わせる --
  line('ch5.rt_office', [
    ['hiyama', '監視ログを「正解の時計」にします。機械は嘘の日付を書きません。'],
    ['kubota', '受付簿は翌朝の早番が書きます。'],
    ['player', 'ログと日付が合わない行を探します。']
  ], 'ch5.dt_office', { view: O(['hiyama', 'kubota'], '事務室 綴りの照合') });
  task('ch5.dt_office', 'find', '受付簿と監視ログの照合', '受付簿の行から、監視ログの日付とずれているものをタップします。別件は「問題なし」です。', {
    config: { scene: 'concourse', seconds: 45, props: [P(0.04, 0.06, 0.92, 0.12, '#4b5563', '受付簿 4/9金 識別部清掃 ／ 4/9金 釣銭切れ 06:10復旧'), P(0.04, 0.22, 0.92, 0.12, '#2f5d8a', '監視ログ 4/8木 22:52 釣銭切れ停止'), P(0.04, 0.4, 0.92, 0.12, '#4b5563', '受付簿 4/16金 釣銭切れ 06:05復旧 ／ 4/30金 釣銭切れ 06:20復旧'), P(0.04, 0.56, 0.92, 0.12, '#2f5d8a', '監視ログ 4/15木 22:49 ／ 4/29木 22:55 停止'), P(0.04, 0.74, 0.92, 0.12, '#4b5563', '受付簿 5/7金 06:10 ／ 5/14金 05:55  監視ログ 5/6木 22:48 ／ 5/13木 23:05')], spots: [
      { id: 'a', x: 0.3, y: 0.28, label: '受付簿の4/9（金）と、ログの4/8（木）は、同じ停止です' }, { id: 'b', x: 0.55, y: 0.46, label: '受付簿の4/16（金）の裏に、ログの4/15（木）がある' }, { id: 'c', x: 0.8, y: 0.8, label: '受付簿の5/14（金）は、ログの5/13（木）と対応している' }, { id: 'ok', x: 0.5, y: 0.12, real: false, label: '4/9（金）の識別部清掃は別件で、日付のずれではありません' }] }
  }, res3('ch5.dt_o_good', 'ch5.dt_o_mid', 'ch5.dt_o_bad', clue(), help(), miss()), O(['hiyama'], '受付簿と監視ログの照合'));
  go('ch5.dt_o_good', [['kubota', '毎週「金曜に直した」と書いて、起きたのは前の晩……。', 'worry'], ['hiyama', '全部拾えました。']], 'ch5.date_end', null, O(['hiyama', 'kubota']));
  go('ch5.dt_o_mid', [['hiyama', '受付簿はいつも金曜。ログはいつも木曜の夜。私の見立てです。']], 'ch5.date_end', null, O(['hiyama']));
  go('ch5.dt_o_bad', [['kubota', '日付追いは根気ですね……。'], ['hiyama', '拾えていない行が多い。これは、使えません。']], 'ch5.date_end', null, O(['hiyama', 'kubota']));

  // -- 合流：停止と補充の関係 --
  line('ch5.date_end', [
    ['hiyama', '毎週、木曜の夜。では、なぜ木曜か。'],
    ['kubota', 'ダイヤも普通です。木曜に特別なことは……。'],
    ['hiyama', '駅側で毎週決まっていること。釣銭の補充は？'],
    ['player', '水曜です。……水曜の、次の日。']
  ], 'ch5.cycle_task', { view: O(['hiyama', 'kubota'], '補充票と停止ログ') });
  task('ch5.cycle_task', 'sort', '停止と補充の関係', '停止ログを一件ずつ、直近の補充日との関係で分類します。', {
    config: { perItem: 14, bins: [{ id: 'next', label: '補充の翌日の夜に停止' }, { id: 'no', label: '補充とは関係なさそう' }], items: [
      { id: 'a', label: '4/8（木）22:52 停止／直近の補充 4/7（水）', bin: 'next', why: '補充の翌日の夜です。' },
      { id: 'b', label: '4/9（金）08:30 紙幣が戻る／直近の補充 4/7（水）', bin: 'no', why: '紙幣が戻る症状は、別の障害です。' },
      { id: 'c', label: '4/22（木）22:51 停止／直近の補充 4/21（水）', bin: 'next', why: '補充の翌日の夜です。' },
      { id: 'd', label: '5/6（木）22:48 停止／直近の補充 5/5（水・祝）', bin: 'next', why: '祝日でも、補充の翌日の夜に起きています。' },
      { id: 'e', label: '5/3（月）11:20 紙詰まり／直近の補充 4/28（水）', bin: 'no', why: '紙詰まりは別件です。' },
      { id: 'f', label: '5/13（木）23:05 停止／直近の補充 5/12（水）', bin: 'next', why: '補充の翌日の夜です。' }] }
  }, res3('ch5.cy_good', 'ch5.cy_mid', 'ch5.cy_bad', clue(), help(), miss()), O(['hiyama'], '停止と補充の関係'));
  go('ch5.cy_good', [['hiyama', '補充の翌日の夜に、現金は十分あるのに止まる。寿命の話ではない。', 'serious']], 'ch5.kubota_conf', null, O(['hiyama']));
  go('ch5.cy_mid', [['hiyama', '補充の翌日の夜。私は、そう読みました。']], 'ch5.kubota_conf', null, O(['hiyama']));
  go('ch5.cy_bad', [['hiyama', '分類が崩れました。この表は、使えません。補充日だけ、もう一度。']], 'ch5.kubota_conf', null, O(['hiyama']));

  // -- 久保田の告白 --
  line('ch5.kubota_conf', [
    ['kubota', '補充票の記入者欄。4/14、4/28、5/12。私の字です。', 'worry'],
    ['kubota', '宮前さんから引き継いだのは、鍵の場所と枚数の数え方だけ。'],
    ['kubota', '私が補充した翌日にも止まった。復旧して、終わりにしました。'],
    ['kubota', '指導担当なのに。「理由まで説明しろ」と言っておいて。'],
    ['hiyama', '枚数は毎回合っています。なぜ気づけない作りだったか、を見ましょう。']
  ], 'ch5.kconf_choice', { view: O(['kubota', 'hiyama'], '12:10 事務室') });
  choice('ch5.kconf_choice', '落ち込んでいる久保田さんに、どう声をかけますか？', [
    opt('say', '「私も毎週受付簿を見ていて、気づけませんでした。一緒に整理しましょう」', 'ch5.kc_a', { tone: 'caring', effects: [rel('kubota', 2, 2), ev('teamwork', 2)] }),
    opt('ask', '「補充のとき、画面に何か表示は出ませんでしたか？」', 'ch5.kc_b', { tone: 'careful', effects: [rel('kubota', 1, 0), ev('accuracy', 1)] }),
    opt('quiet', '何も言わず、次の資料を机に出す', 'ch5.kc_c', { tone: 'neutral', effects: [rel('kubota', 0, -1)] })
  ], { view: O(['kubota', 'hiyama']) });
  go('ch5.kc_a', [['kubota', '教える側が救われました。……続けましょう。', 'smile']], 'ch5.kc_gate', null, O(['kubota']));
  go('ch5.kc_b', [['kubota', '表示……。「完了」の類は、見た覚えがありません。扉を閉めて終わりでした。'], ['hiyama', '貴重な証言です。「何も出なかった」も事実です。']], 'ch5.kc_gate', [...clue()], O(['kubota', 'hiyama']));
  go('ch5.kc_c', [['kubota', '（黙って受け取る）……続けましょう。'], ['hiyama', '（少し間を置いて）では、版の話を。']], 'ch5.kc_gate', null, O(['kubota', 'hiyama']));
  // 久保田との関係が、続きの場面を変える
  branch('ch5.kc_gate', [[RG('kubota', '>=', 6), 'ch5.kc_deep'], [RG('kubota', '<', 3), 'ch5.kc_cool']], 'ch5.ver_intro');
  go('ch5.kc_deep', [
    ['kubota', '……実は、手帳に付箋を一枚、剥がさず貼ってあります。', 'normal'],
    '久保田が、手帳の裏表紙を開いた。端の丸まった黄色い紙。「理由を言う」。',
    ['kubota', '一年目の私が、書いたものです。今日の分を、下に足します。']
  ], 'ch5.ver_intro', [rel('kubota', 1, 1)], O(['kubota']));
  go('ch5.kc_cool', [['kubota', '……仕事の話だけで、いいです。', 'normal'], '久保田は、資料の端を、そろえた。それ以上は、言わなかった。'], 'ch5.ver_intro', null, O(['kubota']));

  // -- 版の食い違い --
  line('ch5.ver_intro', [
    ['hiyama', '同じ名前でも、版が違えば別の約束事です。'],
    ['hiyama', '二つを並べて、一致か食い違いか。']
  ], 'ch5.ver_task', { view: O(['hiyama'], '版と日付の照合') });
  task('ch5.ver_task', 'checklist', '版の照合', '二つの記録を並べて、一致しているか、食い違っているかを判定します。', {
    config: { labels: ['一致している', '食い違っている'] }, items: [
      { id: 'a', label: '事務室に掲示中の補充手順書「2026年10月版」 と 本社の最新版「2027年3月版」', truth: 'ng', why: '掲示が古い版のままです。最新版には「補充確定」の操作が加わっています。' },
      { id: 'b', label: '点検票の型式「TK-8」 と 銘板の型式「TK-8」', truth: 'ok', why: '型式は一致しています。' },
      { id: 'c', label: '釣銭補充票の様式「2026年10月版」 と 手順書（最新版）が指定する様式「2027年3月版」', truth: 'ng', why: '旧様式には「確定操作の時刻」の欄がありません。抜けても気づけません。' },
      { id: 'd', label: '補充票の補充日「毎週水曜」 と 手順書の定める頻度「毎週水曜」', truth: 'ok', why: '補充そのものは毎週きちんと行われています。' },
      { id: 'e', label: '月次点検票（4/16）のソフト版数「3.2.1」 と 機械の本当の版数（3/24更新）「3.4.0」', truth: 'ng', why: '点検票は前回の値を転記していました。' },
      { id: 'f', label: '補充票の補充枚数と、日計表の現金の実在庫', truth: 'ok', why: '現金は帳簿と合っています。お金は消えていません。' }]
  }, res3('ch5.ver_good', 'ch5.ver_mid', 'ch5.ver_bad', clue(), help(), miss()), O(['hiyama'], '版の照合'));
  go('ch5.ver_good', [['hiyama', '合っているものも、確かめられました。お金は消えていない。', 'smile']], 'ch5.addr_intro', null, O(['hiyama']));
  go('ch5.ver_mid', [['hiyama', '古いのは、手順書、様式、転記された版数。私の整理では、三つです。']], 'ch5.addr_intro', null, O(['hiyama']));
  go('ch5.ver_bad', [['hiyama', '混ざってしまいましたね。この照合は、私がやり直します。']], 'ch5.addr_intro', null, O(['hiyama']));

  // -- 周知メールの宛先 --
  line('ch5.addr_intro', [
    ['hiyama', '3月24日の更新で、こちらは「補充後に確定操作を」とお知らせを出しています。'],
    ['kubota', '駅には届いていません。'],
    ['hiyama', '配信ログの写しです。気づいたことを。（紙を置く）']
  ], 'ch5.addr_choice', { view: O(['hiyama', 'kubota'], '配信ログの写し') });
  choice('ch5.addr_choice', '配信ログの写しを見て、気づいたことは？', [
    opt('hour', '「送信時刻が、夜遅い」', 'ch5.addr_ng', { tone: 'quick', effects: [...miss()] }),
    opt('who', '「宛先が、宮前さん個人のアドレスになっている」', 'ch5.addr_ok', { tone: 'careful', effects: clue() }),
    opt('num', '「宛先の数が、少ない」', 'ch5.addr_ng', { tone: 'quick', effects: [...miss()] })
  ], { view: O(['hiyama']) });
  go('ch5.addr_ok', [
    ['hiyama', '駅の共通窓口ではなく、個人宛。……そう登録したのは、うちです。'],
    ['kubota', '宮前さんは4月に異動。その宛先は、誰にも読まれなかった。']
  ], 'ch5.copy', null, O(['hiyama', 'kubota']));
  go('ch5.addr_ng', [
    ['hiyama', '事実ですが、本筋ではありません。宛先欄を。宮前さん個人です。'],
    ['hiyama', '登録したのは、うちの運用です。']
  ], 'ch5.copy', null, O(['hiyama', 'kubota']));

  // -- 記録の写し --
  line('ch5.copy', [
    ['hiyama', '根拠は、あとで説明するときの武器です。駅の綴りの写しは。'],
    ['kubota', '持ち出しは規程違反。写しは駅長の許可が要ります。']
  ], 'ch5.copy_choice', { view: O(['hiyama', 'kubota']) });
  choice('ch5.copy_choice', '根拠となる記録を、どう残しますか？', [
    opt('permit', '駅長に許可をもらい、必要な頁だけ写しを取って、出典を記入する', 'ch5.copy_a', { tone: 'honest', effects: [set('ch5.rec_copy'), ev('reporting', 2), rel('shiraishi', 1, 0)] }),
    opt('photo', '手元のスマートフォンで、綴りを撮影しておく', 'ch5.copy_b', { tone: 'risky', effects: [ev('safety', -2)] }),
    opt('memo', '口頭で覚えておく。必要なら見に来る', 'ch5.copy_c', { tone: 'quick', effects: [] })
  ], { view: O(['hiyama', 'kubota']) });
  go('ch5.copy_a', [['kubota', '許可は私が取ります。「いつ、誰が、どの綴りから」を書き込んで。', 'smile']], 'ch5.stamp_gate', [tl('5月18日 駅長の許可を得て、記録の写しを作成')], O(['kubota', 'hiyama']));
  go('ch5.copy_b', [['kubota', '消してください。個人情報と職員名が載っています。', 'serious'], ['hiyama', '写しは、正式な手順で。']], 'ch5.stamp_gate', null, O(['kubota', 'hiyama']));
  go('ch5.copy_c', [['hiyama', '記憶は頼りない。せめて要点をメモに。']], 'ch5.stamp_gate', null, O(['hiyama']));

  // ================= 第4章の記録が、ここで読まれる =================
  // 数える前に押した印を、黙っていた場合
  branch('ch5.stamp_gate', [[F('ch4.own_part_hidden'), 'ch5.stamp_1']], 'ch5.ch4_gate');
  go('ch5.stamp_1', [
    '補充票の束の中から、桐生が一枚を抜いて、{player}の前に置いた。',
    ['kiryu', '5/3、3号機。確認印、11時42分。数え終わりの記載は、ありません。', 'serious'],
    ['kiryu', 'あの日、言えませんでしたか。'],
    '{player}は、判子の欄から、目を上げられなかった。'
  ], 'ch5.ch4_gate', { effects: [set('ch5.stamp_exposed'), rel('kiryu', -1, 0), ev('reporting', -1)], view: O(['kiryu'], '13:55 事務室') });
  branch('ch5.ch4_gate', [[F('ch4.ledger_unknown'), 'ch5.sk_1'], [ANY(F('ch4.told_together'), F('ch4.told_alone'), F('ch4.told_late'), F('ch4.yama_spoke')), 'ch5.tb_1']], 'ch5.hypo_intro');
  line('ch5.sk_1', [
    '綴りをめくる檜山の指が、一行で止まった。連休中の日付。',
    ['hiyama', '「5/3 3号機 釣銭の過不足 −400円 原因不明（補充担当：山科）」。釣銭補充の取り違えは、他にも起きていませんか。'],
    ['kubota', '……報告は、上がっていません。', 'serious'],
    ['shiraishi', '（入ってきて）いつの件だ。山科の補充で、原因不明。{player}、何か知っているか。', 'serious']
  ], 'ch5.sk_choice', { effects: [], view: O(['shiraishi', 'kubota', 'hiyama'], '14:20 事務室') });
  choice('ch5.sk_choice', '駅長に、どう答えますか？', [
    opt('tell', '「知っています。山科さんをかばって、私が報告しませんでした。申し訳ありません」', 'ch5.sk_tell', { tone: 'honest', effects: [ev('reporting', 2), rel('shiraishi', 1, 0), rel('yamashina', -2, -1), set('ch5.sk_confessed'), set('ch5.late_hidden'), set('ch5.late_report'), set('ch5.y_out'), lockE('slot_yama', '報告が遅れたため、山科の今年度の基地推薦は閉じた')] }),
    opt('deny', '「その件は、今回の券売機の調査には関係ないと思います」', 'ch5.sk_deny', { tone: 'risky', effects: [ev('reporting', -4), rel('shiraishi', -2, 0), rel('yamashina', 1, 0), set('ch5.sk_evaded'), set('ch5.late_hidden'), set('ch5.late_report')] }),
    opt('wait', '「山科さんと先に話をしてから、私たちから報告させてください」', 'ch5.sk_wait', { tone: 'careful', effects: [ev('reporting', -1), rel('yamashina', 1, 1), set('ch5.late_hidden'), set('ch5.late_report')] })
  ], { view: O(['shiraishi', 'kubota', 'hiyama']) });
  go('ch5.sk_tell', [
    ['shiraishi', '……そうか。話してくれたことは受け取る。今日が、発覚の日だ。'],
    ['kubota', '聞き取りには私も同席します。'],
    ['hiyama', '（受付簿を戻す）この件は、私の記録には書きません。'],
    '白石は、山科の志望書の封筒を、机の端へ、一度だけ動かした。'
  ], 'ch5.sk_tell_2', { effects: [tl('5月18日 連休中の取り違えの報告漏れが発覚。自ら申し出る')], view: O(['shiraishi', 'kubota', 'hiyama']) });
  branch('ch5.sk_tell_2', [[RG('yamashina', '>=', 7), 'ch5.sk_t_close']], 'ch5.sk_t_far');
  go('ch5.sk_t_close', [
    ['yamashina', '……聞いた。お前が言ったって。', 'worry'],
    ['yamashina', '怒鳴れたら楽なんだが。……俺が頼んだんだ。お前に、黙れって。'],
    '山科は、{player}の机に、自分の缶コーヒーを置いて、行った。'
  ], 'ch5.hypo_intro', { view: O(['yamashina'], '15:00 廊下') });
  go('ch5.sk_t_far', [
    ['yamashina', '……俺の枠、お前が消した。', 'normal'],
    '山科は、それだけ言って、目を合わせずに通り過ぎた。'
  ], 'ch5.hypo_intro', { view: O(['yamashina'], '15:00 廊下') });
  go('ch5.sk_deny', [
    ['shiraishi', '関係の有無は私が決める。', 'serious'],
    ['kubota', '……それは、駅長の前で言うことではありません。', 'serious'],
    ['shiraishi', '今は券売機の調査だ。だが、覚えておく。']
  ], 'ch5.sk_deny_2', { effects: [tl('5月18日 連休中の取り違えの報告漏れが発覚。経緯の説明を避けた')], view: O(['shiraishi', 'kubota', 'hiyama']) });
  go('ch5.sk_deny_2', [
    ['hiyama', '（咳払い）調査に戻りましょう。'],
    '廊下の向こうで、山科が、一度だけ、こちらを見た。目の中に、礼と、疑いが、半分ずつあった。'
  ], 'ch5.hypo_intro', { view: O(['hiyama', 'yamashina']) });
  go('ch5.sk_wait', [
    ['shiraishi', '話すのは止めない。ただし今日中。報告は二人で来い。'],
    ['kubota', '同席します。間に入る人間が要る。']
  ], 'ch5.sk_wait_2', { effects: [tl('5月18日 連休中の取り違えの報告漏れが発覚。山科と共に今日中に報告することに')], view: O(['shiraishi', 'kubota']) });
  go('ch5.sk_wait_2', [
    '夕方、駅長室。山科は、自分の口で、三号機の件を話した。',
    ['yamashina', '黙っていました。……この枠が、欲しくて。', 'worry'],
    ['shiraishi', '十五日、遅い。赤印は残る。だが、自分の口で来たことも、残す。']
  ], 'ch5.hypo_intro', { effects: [rel('yamashina', 1, 1), { clock: { minute: hm(16, 30) } }], view: O(['shiraishi', 'yamashina'], '16:30 駅長室') });
  line('ch5.tb_1', [
    '綴りをめくる檜山の指が、一行で止まった。連休中。「3号機 補充の取り違え（山科）」。',
    ['hiyama', '別件ですが……横に、票の控えが綴じてある。原因と、再発防止まで。'],
    ['kubota', '先に整理して、出したものです。袋の置き場が、変わっています。', 'smile'],
    ['hiyama', '今日の照合は、この綴りが並べられるから、出来ています。']
  ], 'ch5.tb_2', { effects: [ev('reporting', 2), rel('shiraishi', 1, 1), rel('kubota', 1, 0)], view: O(['kubota', 'hiyama'], '14:20 事務室') });
  branch('ch5.tb_2', [[F('ch4.report_good'), 'ch5.tb_good']], 'ch5.tb_plain');
  go('ch5.tb_good', [
    ['shiraishi', '袋の置き場は、全駅の手順に入った。赤印はあるが、扱いの欄に、私の字で書く。'],
    ['player', '山科さんは、日付を二回確かめていました。'],
    ['shiraishi', '伝えておく。']
  ], 'ch5.hypo_intro', { effects: [tl('5月18日 先に整理した票の控えが、照合の助けになる')], view: O(['shiraishi', 'hiyama']) });
  go('ch5.tb_plain', [
    ['shiraishi', '赤印は付いた。扱いの欄は、まだ空だ。これからの半年で埋めろ。']
  ], 'ch5.hypo_intro', { view: O(['shiraishi', 'hiyama']) });

  // ================= 仮説 =================
  line('ch5.hypo_intro', [
    '15時。長机の上の紙が、一枚ずつ重なっていく。',
    ['hiyama', '整理します。毎週、補充の翌日の夜。お金は合っている。版は古い。お知らせは個人宛。'],
    ['kubota', '補充のあとに、何かが足りない。そんな気がします。'],
    ['hiyama', '{player}さんの仮説を。当たりより、事実と矛盾しないことを見ます。']
  ], 'ch5.hypo_choice', { view: O(['hiyama', 'kubota'], '15:00 事務室') });
  choice('ch5.hypo_choice', '停止の本当の原因について、どう考えますか？', [
    opt('proc', '「補充のあとに必要な操作が、手順として伝わっていなかったのではないでしょうか」', 'ch5.hypo_p', { tone: 'careful', requires: OWN('>=', 2), effects: [set('ch5.hypo_ok')] }),
    opt('part', '「やはり、釣銭ユニットの部品が劣化しているのではないでしょうか」', 'ch5.hypo_q', { tone: 'quick', effects: [] }),
    opt('dust', '「識別部のほこりが、センサーの誤動作を起こしているのでは」', 'ch5.hypo_d', { tone: 'quick', requires: F('ch5.h_inside'), effects: [] }),
    opt('person', '「補充する人の不注意が、続いているのではないでしょうか」', 'ch5.hypo_r', { tone: 'risky', effects: [ev('teamwork', -2), rel('kubota', -1, 0)] })
  ], { view: O(['hiyama']) });
  go('ch5.hypo_p', [['hiyama', '矛盾しません。しかも確かめられます。', 'smile']], 'ch5.verdict', null, O(['hiyama']));
  go('ch5.hypo_q', [['hiyama', '劣化なら、毎週木曜という規則性は残りません。保留にして、手順のほうを疑ってください。']], 'ch5.verdict', null, O(['hiyama']));
  go('ch5.hypo_d', [['hiyama', 'ほこりは、掃除しました。それでも木曜は来ます。'], ['kubota', '……ほこりは、毎日つきます。曜日は、決まりません。']], 'ch5.verdict', null, O(['hiyama', 'kubota']));
  go('ch5.hypo_r', [['kubota', '……それは、私にも向いていますね。', 'worry'], ['hiyama', '手順のほうを、見ましょう。', 'serious']], 'ch5.verdict', null, O(['hiyama', 'kubota']));
  branch('ch5.verdict', [[ALL(F('ch5.hypo_ok'), OWN('>=', 3)), 'ch5.rootA']], 'ch5.rootB');
  go('ch5.rootA', [
    ['hiyama', '私は数回しか口を出していません。'],
    ['hiyama', '3月の更新から、補充後に「補充確定」が要る。押さないと、機械の残枚数は古い数字のまま減る。'],
    ['hiyama', '案内が出るのは、更新後の最初の補充だけ。宮前さんは見て、押していた。']
  ], 'ch5.d2_end', { effects: [set('ch5.root_found'), ev('accuracy', 3), ev('reporting', 1), rel('hiyama', 2, 2), sk('ops', 3), tl('5月18日 券売機の夜間停止の原因（補充確定の操作漏れ）に自力で到達')], view: O(['hiyama'], '15:20 事務室') });
  go('ch5.rootB', [
    ['hiyama', '残りは私から。まだ「見立て」ですが。'],
    ['hiyama', '3月の更新から、補充後に「補充確定」が要る。押さないと、残枚数は古い数字のまま減る。'],
    ['hiyama', '案内は更新後の最初の補充だけ。宮前さんは押し、以降は誰も知らない。明日、確かめます。']
  ], 'ch5.d2_end', { effects: [ev('accuracy', 1), rel('hiyama', 1, 0), tl('5月18日 保守員の見立てで、原因の仮説（補充確定の操作漏れ）が示される')], view: O(['hiyama'], '15:20 事務室') });
  go('ch5.d2_end', [
    ['kubota', '知らなかった、では済まない話に聞こえる。でも、知る手段がなかった。', 'worry'],
    ['hiyama', '水曜の補充で確かめます。最新版どおりに操作して、木曜の夜を見る。夜はログが見ていてくれる。']
  ], 'ch5.d3_open', null, O(['hiyama', 'kubota']));

  // ================= 第3日 5月19日（水）：検証 =================
  line('ch5.d3_open', [
    '5月19日（水）。曇り。金庫の鍵が、カチリと鳴った。',
    ['shiraishi', '今日の補充は檜山さんの指示どおり。久保田と{player}で。最新版に従え。'],
    ['hiyama', '私は見ているだけ。手を動かすのは駅の方です。']
  ], 'ch5.d3_route', { effects: [{ clock: { addDay: 1, minute: hm(14, 30) } }, tl('5月19日 最新版の手順で、釣銭の補充を行う')], view: O(['shiraishi', 'hiyama', 'kubota'], '5月19日（水） 14:30 駅事務室') });
  branch('ch5.d3_route', [[F('route.service'), 'ch5.d3_s'], [F('route.platform'), 'ch5.d3_p']], 'ch5.d3_o');
  go('ch5.d3_s', [['kubota', '窓口の応対メモにも「補充後 確定」と書き足します。'], ['hiyama', '停止時に「どんな表示だったか」を聞くのも、窓口の仕事ですね。']], 'ch5.proc_task', null, O(['kubota', 'hiyama']));
  go('ch5.d3_p', [['yamashina', '俺は夜の遅番だ。木曜の改札外を見ておく。'], ['hiyama', '人の目は、ログより早いことがある。時刻をメモに。']], 'ch5.proc_task', [rel('yamashina', 1, 0)], O(['yamashina', 'hiyama']));
  go('ch5.d3_o', [['shiraishi', '新様式の補充票に書き込め。旧様式は別の箱へ。'], ['hiyama', '捨てずに。古い記録は、これまでの検証材料です。']], 'ch5.proc_task', null, O(['shiraishi', 'hiyama']));
  task('ch5.proc_task', 'memory', '補充の手順（最新版）', '表示された最新版の手順を覚えて、同じ順に選んでください。', {
    config: { sequence: ['扉を開錠', '残枚数を数える', 'カセットへ投入', '扉を施錠', '補充確定'], pool: ['扉を開錠', '残枚数を数える', 'カセットへ投入', '扉を施錠', '補充確定', '機械を再起動', '画面を拭く', '貼り紙を外す'], showMs: 6000, showLabel: '補充手順（2027年3月版）', inputLabel: '手順を同じ順に選んでください' }
  }, res3('ch5.proc_good', 'ch5.proc_mid', 'ch5.proc_bad', [ev('accuracy', 2)], [ev('accuracy', 1)], [ev('accuracy', -1)]), O(['hiyama'], '補充の手順'));
  go('ch5.proc_good', [['kubota', '（画面の残枚数が更新された）……出ました。初めて見ました。', 'surprise']], 'ch5.test_choice', null, O(['kubota', 'hiyama']));
  go('ch5.proc_mid', [['kubota', '手順書を横に置きましょう。最後の「確定」だけは、絶対に。']], 'ch5.test_choice', null, O(['kubota']));
  go('ch5.proc_bad', [['hiyama', '最後の確定が抜けました。読み上げます。一緒に。', 'serious'], '二人で、扉を開け直した。'], 'ch5.test_choice', null, O(['hiyama']));
  choice('ch5.test_choice', '補充を終えて、記録をどう残しますか？', [
    opt('log', '新様式の補充票に、確定操作の時刻まで書き、検証メモにも残す', 'ch5.test_a', { tone: 'careful', effects: [set('ch5.rec_test'), ev('reporting', 1), ev('accuracy', 1)] }),
    opt('simple', '補充票の欄だけ埋めて、確定のことは書かない', 'ch5.test_b', { tone: 'quick', effects: [] })
  ], { view: O(['hiyama']) });
  go('ch5.test_a', [['hiyama', '確定の時刻。この一行で、誰が見ても「やった」と分かる。', 'smile'], ['kubota', '旧様式には書く欄すらなかった。']], 'ch5.d3_wait', [tl('5月19日 確定操作の時刻まで記録し、検証メモを残す')], O(['hiyama', 'kubota']));
  go('ch5.test_b', [['hiyama', '紙の上では、「確定した」ことが分かりませんね。'], ['kubota', '書きましょう。後の自分が助かります。']], 'ch5.d3_wait', null, O(['hiyama', 'kubota']));
  go('ch5.d3_wait', [
    '17時15分。窓の外で、雨が降りはじめた。',
    ['kubota', '今夜と明日の夜は、ログに任せましょう。休むのも仕事です。', 'smile'],
    ['hiyama', '金曜にログを持ってきます。']
  ], 'ch5.night_ask', null, O(['kubota', 'hiyama'], '17:15 駅事務室'));

  // ================= 5月20日（木）夜：見届けるか、ログに任せるか =================
  line('ch5.night_ask', [
    '5月20日（木）、二十一時四十分。退勤の鞄を持ったまま、{player}は券売機の前で足を止めた。',
    ['sakai', '（売店のシャッターを下ろしながら）今夜も、来るかしらね。千円札の人。']
  ], 'ch5.night_choice', { effects: [{ clock: { addDay: 1, minute: hm(21, 40) } }], view: v3('npc:vend2', '5月20日（木） 21:40 券売機2号機の前') });
  choice('ch5.night_choice', '木曜の夜、二十二時を過ぎる。どうする？', [
    opt('stay', '残って、自分の目で見届ける（翌日は眠い）', 'ch5.night_hub', { tone: 'caring', effects: [set('ch5.watch_stay'), ev('safety', 0)] }),
    opt('home', '帰る。ログに任せる', 'ch5.night_home', { tone: 'neutral', effects: [] })
  ], { timeLimit: 20, defaultOption: 'home', view: v3('npc:vend2', '21:40 券売機2号機の前') });
  go('ch5.night_home', ['{player}は、券売機の前を離れた。画面は「いらっしゃいませ」を映していた。'], 'ch5.d4_open', [{ clock: { addDay: 1, minute: hm(8, 40) } }], v3('npc:vend2', '21:50 券売機2号機の前'));
  go('ch5.night_hub', ['二十二時。改札の外は、夜の青。2号機の画面だけが、白く光っている。'], 'ch5.night_hub_enter', [{ clock: { minute: hm(22, 0) } }, tl('5月20日 木曜の夜、2号機の前に残って見届ける')], v3('npc:vend2', '22:00 コンコース'));
  fx('ch5.night_hub_enter', [], 'ch5.night_hub2');
  N['ch5.night_hub2'] = { id: 'ch5.night_hub2', type: 'hub', scene: 'station', title: '青嶺中央駅 夜（5月20日・木）', hint: '2号機の近くで、二十二時から見守ります。', view: v3('follow', '22:00 コンコース'), interactions: [], timed: [{ id: 'late', at: hm(23, 40), goto: 'ch5.n_end' }], goals: [
    { id: 'g_vend', label: '2号機の表示を確かめる', when: F('ch5.n_vend') },
    { id: 'g_cust', label: '終電前のお客様を見守る（22:50以降）', when: F('ch5.n_cust') }
  ], exit: { label: '二十三時半まで見て、引き上げる', requires: ALL(F('ch5.n_cust'), T('>=', hm(23, 20))), goto: 'ch5.n_end' } };
  N['ch5.night_hub2'].interactions.push(
    { id: 'n_vend', object: 'vend2', label: '2号機の表示と残枚数を確かめる', goto: 'ch5.n_vend', once: true, icon: '🪙' },
    { id: 'n_yama', object: 'yamashina', label: '遅番の山科に、ホームの様子を聞く', goto: 'ch5.n_yama', requires: F('route.platform'), once: true, icon: '🚉' },
    { id: 'n_cust', object: 'riku', label: '券売機の前に来た高校生に声をかける', goto: 'ch5.n_cust', requires: T('>=', hm(22, 50)), once: true, icon: '🎫' }
  );
  go('ch5.n_vend', [
    '残枚数の表示。百円、四十一。昨夜より、二枚減っている。',
    '補充票の「確定 15:14」と、画面の数字が、同じ向きに減っていた。',
    '{player}は、手帳に、時刻を一行、足した。'
  ], 'ch5.n_vend_end', null, v3('npc:vend2', '22:10 2号機の前'));
  fx('ch5.n_vend_end', [set('ch5.n_vend'), time(10)], 'ch5.night_hub2');
  go('ch5.n_yama', [
    ['yamashina', '最終列車の前。いつもなら、ここで客が走ってくる。', 'normal'],
    ['yamashina', '……来ない日が、あるんだな。毎週、あったのに。']
  ], 'ch5.n_yama_end', null, v3('npc:yamashina', '22:30 ホーム階段'));
  fx('ch5.n_yama_end', [rel('yamashina', 0, 1), time(10)], 'ch5.night_hub2');
  go('ch5.n_cust', [
    '二十三時五分。高校生が、息を切らして、券売機へ駆けてきた。',
    '千円札。四百六十円。ピッ。きっぷと、釣銭。かたん、と受け皿が鳴った。',
    ['riku', 'あ、出た。……すみません、いつも、ここで止まってて。', 'smile'],
    '改札の向こうへ走っていく背中が、階段の角で見えなくなった。'
  ], 'ch5.n_cust_end', null, v3('npc:riku', '23:05 2号機の前'));
  fx('ch5.n_cust_end', [set('ch5.n_cust'), time(10)], 'ch5.night_hub2');
  go('ch5.n_end', [
    '二十三時半。2号機は、一度も止まらなかった。',
    '立っていた足が、じんと熱い。それでも、画面の「いらっしゃいませ」が、少しだけ、違って見えた。'
  ], 'ch5.d4_open', { effects: [set('ch5.watched'), { clock: { addDay: 1, minute: hm(8, 40) } }, rel('sakai', 0, 1), tl('5月20日 木曜の夜、停止が起きないことを自分の目で確かめた')], view: v3('npc:vend2', '23:30 2号機の前') });

  // ================= 第4日 5月21日（金）：結果・報告 =================
  line('ch5.d4_open', [
    '5月21日（金）。檜山が、監視ログの束を机に置いた。紙の端が、まだ温かい。',
    ['hiyama', '20日（木）の夜。22時から24時。停止の記録は、ありません。'],
    ['kubota', '……止まらなかった。', 'surprise'],
    ['hiyama', '補充は15:12、確定操作は15:14。順序も正しい。'],
    ['shiraishi', '機械でも、一人の担当者でもない。手順が引き継がれていなかった。そうだな。'],
    ['hiyama', '同じ条件で、同じ結果が出ました。']
  ], 'ch5.d4_w', { effects: [tl('5月21日 確定操作を行った夜は、停止が起きなかった'), log('検証の結果。停止なし', 'work')], view: O(['hiyama', 'shiraishi', 'kubota'], '5月21日（金） 8:40 駅事務室') });
  branch('ch5.d4_w', [[F('ch5.watch_stay'), 'ch5.d4_w_s']], 'ch5.report_intro');
  go('ch5.d4_w_s', [
    ['kubota', '目の下、くまがあります。……見に行ったんですね。', 'normal'],
    ['kubota', '二時間、立っていたんですか。次は、私も誘ってください。']
  ], 'ch5.report_intro', [rel('kubota', 1, 1)], O(['kubota']));
  line('ch5.report_intro', [
    ['shiraishi', '報告を形にする。誰に、どこまで、何を根拠に伝えるか。君の案を聞く。'],
    ['kubota', '私は横で見ています。']
  ], 'ch5.report_choice', { view: O(['shiraishi', 'kubota'], '9:00 駅事務室') });
  choice('ch5.report_choice', '原因の報告を、どう上げますか？', [
    opt('chain', '駅長と久保田さんに、時系列と根拠資料を添えて文書で報告。本社設備課とメーカーへは、駅長の名で依頼', 'ch5.rc_1', { tone: 'honest', hint: '範囲：駅内→本社・メーカー ／ 根拠：資料と検証ログ ／ 時間がかかる', effects: [set('ch5.rep_chain'), ev('reporting', 4), ev('accuracy', 2), rel('shiraishi', 2, 1), rel('kubota', 1, 1)] }),
    opt('blame', '本社設備課に、メールで直接報告する。「前任者の引継ぎ漏れが原因」と明記する', 'ch5.rb_1', { tone: 'risky', hint: '範囲：本社へ直接 ／ 根拠：推測を含む ／ 速い', effects: [set('ch5.rep_blame'), set('ch5.late_hq'), set('ch5.late_report'), ev('reporting', -3), ev('teamwork', -3), rel('shiraishi', -2, 0), lockE('hq_direct', '本社へ直接メールした。駅の報告は、駅長の名を通すことになった')] }),
    opt('narrow', '口頭で久保田さんにだけ伝え、手順書は自分で書き直しておく', 'ch5.rn_1', { tone: 'quick', hint: '範囲：担当者のみ ／ 根拠：口頭 ／ 静か', effects: [set('ch5.rep_narrow'), set('ch5.late_oral'), set('ch5.late_report'), ev('reporting', -2), ev('safety', -1), rel('kubota', -1, 0)] }),
    opt('wide', '他の全駅に、「補充後は確定操作を」と、駅長名で今夜のうちに一斉に周知したい', 'ch5.rw_1', { tone: 'caring', hint: '範囲：全駅へ即時 ／ 根拠：この駅の検証のみ ／ 本社を通さない', effects: [set('ch5.rep_wide'), ev('reporting', 1), ev('accuracy', -1), rel('shiraishi', 1, 1)] })
  ], { important: true, who: 'shiraishi', view: O(['shiraishi', 'kubota'], '9:05 駅事務室') });

  // 文書で報告：他駅で、先に止まる
  go('ch5.rc_1', [
    ['shiraishi', '時系列、根拠、依頼先。受け取る側が迷わない。', 'smile'],
    ['hiyama', '弊社にも起票します。周知先は、個人ではなく共通窓口へ。'],
    ['kubota', '最新版の掲示と、旧様式の回収は私が。']
  ], 'ch5.rc_2', { effects: [tl('5月21日 時系列と根拠資料を添えて、文書で報告')], view: O(['shiraishi', 'hiyama', 'kubota']) });
  go('ch5.rc_2', [
    '5月24日（月）。設備課から、受領の返信。',
    '「全駅への周知は、来週水曜の定例で行います」。',
    ['hiyama', '来週の水曜。つまり、その前の木曜は、各駅の補充の翌日です。', 'worry']
  ], 'ch5.rc_3', { effects: [{ clock: { minute: hm(10, 0) } }], view: O(['hiyama'], '5月24日（月） 10:00 駅事務室') });
  go('ch5.rc_3', [
    '5月27日（木）、二十三時。北嶺駅の券売機が、一台、止まった。',
    '翌朝、設備課から入った一報は、短かった。',
    ['kubota', '……北嶺駅も、「補充の翌日の夜」でした。', 'serious'],
    '周知の前の夜だった。{player}の文書は、その二日後の定例で、一枚目に載った。'
  ], 'ch5.rc_4', { effects: [{ clock: { minute: hm(8, 30) } }, set('ch5.other_stop')], view: O(['kubota'], '5月28日（金） 8:30 駅事務室') });
  branch('ch5.rc_4', [[RG('shiraishi', '>=', 4), 'ch5.rc_4a']], 'ch5.rc_4b');
  go('ch5.rc_4a', [
    ['shiraishi', '正しい順番だった。……それでも、北嶺の夜は、私たちの夜だ。'],
    '白石は、文書の控えに、自分の字で、一行を足した。「次は、周知の前の夜を、先に守る」。'
  ], 'ch5.ev_line', { effects: [rel('shiraishi', 1, 1)], view: O(['shiraishi']) });
  go('ch5.rc_4b', [
    ['shiraishi', '手順は守った。結果は、結果として、受け取る。'],
    '控えの余白は、白いままだった。'
  ], 'ch5.ev_line', { view: O(['shiraishi']) });

  // 本社へ直接：速いが、窓口が閉じる
  go('ch5.rb_1', [
    ['shiraishi', '待て。「前任者の漏れ」は、事実の一部だ。個人宛だったのは仕組みの問題。', 'serious'],
    ['shiraishi', '宮前は案内を見て押していた。責められるのは、受け取る人が消える仕組みだ。'],
    '白石は、送信前の画面に、指を伸ばして、止めた。'
  ], 'ch5.rb_2', { effects: [tl('5月21日 本社への直接報告を駅長に止められ、出し直す')], view: O(['shiraishi', 'kubota']) });
  go('ch5.rb_2', [
    '五分後。メールは、すでに、送信済みになっていた。',
    ['kubota', '……送信ボタン、押されていました。下書きの確認画面から。', 'worry'],
    ['shiraishi', '回収の連絡を入れる。設備課の担当が、今ごろ、読んでいる。']
  ], 'ch5.rb_3', { effects: [{ clock: { minute: hm(9, 30) } }], view: O(['shiraishi', 'kubota'], '9:30 駅事務室') });
  go('ch5.rb_3', [
    '午後、設備課から電話。「直接の連絡は、今後、駅長の名義で」。',
    ['shiraishi', '以後、本社へは、私を通す。……送ろうとした判断は、覚えておく。出し直しだ。']
  ], 'ch5.rb_4', { effects: [{ clock: { minute: hm(14, 0) } }], view: O(['shiraishi'], '14:00 駅長室') });
  branch('ch5.rb_4', [[RG('kubota', '>=', 5), 'ch5.rb_4a']], 'ch5.rb_4b');
  go('ch5.rb_4a', [
    ['kubota', 'あなたを守る手順でもあります。私が、横で読み直します。', 'normal'],
    '出し直しの文書の「原因」欄から、個人名が消えた。久保田の赤ペンの跡が、一行だけ、残った。'
  ], 'ch5.ev_line', { effects: [rel('kubota', 1, 1)], view: O(['kubota']) });
  go('ch5.rb_4b', [
    ['kubota', '出し直しは、駅長の下書きに従います。'],
    '赤ペンは、{player}の机には、来なかった。'
  ], 'ch5.ev_line', { view: O(['kubota']) });

  // 口頭のみ：静かに、一人で抱える
  go('ch5.rn_1', [
    ['kubota', '……伝えてくれて、ありがたい。でも私一人で抱える話じゃない。', 'worry'],
    '久保田は、手元の付箋に、一行書いて、剥がして、また貼った。'
  ], 'ch5.rn_2', { effects: [tl('5月21日 口頭の報告にとどめ、駅長への報告が遅れる')], view: O(['kubota']) });
  go('ch5.rn_2', [
    '手順書の書き直しは、夜のうちに、一枚、終わった。',
    '五月二十五日。本社の版管理の担当から、駅に問い合わせが入った。「駅内の手順書が、版の登録と違う」。'
  ], 'ch5.rn_3', { effects: [{ clock: { minute: hm(10, 20) } }], view: O(['kubota'], '5月25日（火） 10:20 駅事務室') });
  go('ch5.rn_3', [
    ['shiraishi', '（遅れて聞いて）私は今日まで知らなかったことになる。', 'serious'],
    ['shiraishi', '版の管理は本社の決まりだ。書き直した紙は、回収する。根拠を、正しい経路に乗せ直せ。']
  ], 'ch5.rn_4', { view: O(['shiraishi', 'kubota']) });
  go('ch5.rn_4', [
    '回収された紙は、封筒に入った。{player}が書いた一行目だけ、残された。',
    ['kubota', '……私も、一度、黙った側です。これで、おあいこ、というわけでも、ないですが。', 'normal']
  ], 'ch5.ev_line', { effects: [rel('kubota', 0, 1)], view: O(['kubota']) });

  // 全駅へ一斉：他駅は救われるが、白石が呼ばれる
  go('ch5.rw_1', [
    ['shiraishi', '気持ちは分かる。だが全駅の手順を変える権限は、駅長にもない。'],
    ['shiraishi', '……注意喚起なら、私の名で出せる。文面は、事実だけ。本社の許可は、事後だ。'],
    ['hiyama', '他駅の更新状況は、私が調べて、設備課に確認します。']
  ], 'ch5.rw_2', { effects: [tl('5月21日 全駅へ、駅長名で注意喚起を出した')], view: O(['shiraishi', 'hiyama']) });
  go('ch5.rw_2', [
    '夜二十時。全駅の共通窓口へ、白石の名前の一枚が、送られた。',
    '翌朝。設備課の部長から、駅長室へ、呼び出し。白石は、帽子をかぶって、出ていった。'
  ], 'ch5.rw_3', { effects: [{ clock: { minute: hm(9, 0) } }], view: O(['shiraishi'], '5月22日（土） 9:00 駅長室') });
  go('ch5.rw_3', [
    '三つの駅から、返信が来た。「助かった」「もう押した」「うちの更新は未適用だった」。',
    '一つの駅からは、「手順書にない操作を周知するな」という返事も、来た。',
    ['hiyama', '……届いた分だけ、止まる夜が、減りました。', 'smile']
  ], 'ch5.rw_4', { effects: [set('ch5.other_saved')], view: O(['hiyama'], '5月23日（日） 事務室') });
  go('ch5.rw_4', [
    '白石は、夕方、戻った。上着の肩に、雨の粒が残っている。',
    ['shiraishi', '本社は、手順を問題にした。中身は、問題にしなかった。……以後、周知は、先に通す。'],
    ['shiraishi', '{player}の案だと、書いておいた。私の名の横に。']
  ], 'ch5.ev_line', { effects: [set('ch5.wide_blamed'), rel('shiraishi', 1, 1)], view: O(['shiraishi']) });

  branch('ch5.ev_line', [[F('route.service'), 'ch5.ev_s'], [F('route.platform'), 'ch5.ev_p']], 'ch5.ev_o');
  go('ch5.ev_s', [['shiraishi', '窓口の伝票が根拠にある。お客様の声は、駅ならではの証拠だ。']], 'ch5.phone_intro', null, O(['shiraishi']));
  go('ch5.ev_p', [['shiraishi', 'ホーム日誌が機械のログと重なる。人の目と機械の目が、同じ時刻を指している。']], 'ch5.phone_intro', null, O(['shiraishi']));
  go('ch5.ev_o', [['shiraishi', '綴り四種が、日付と版で並んだ。事務室の記録が、初めて一本の線になった。']], 'ch5.phone_intro', null, O(['shiraishi']));

  // ---- 宮前さんへの連絡 ----
  line('ch5.phone_intro', [
    '海浜口駅の内線が鳴りはじめた。三回、四回。',
    ['miyamae', 'はい、宮前です。青嶺中央から……何か、不備でしたか。', 'worry'],
    ['kubota', '更新のお知らせは、宮前さん個人宛でした。本人は知らないままです。'],
    ['shiraishi', '伝え方で、彼の受け取り方が変わる。任せる。']
  ], 'ch5.phone_choice', { view: O(['kubota', 'shiraishi'], '9:50 海浜口駅 宮前さんに電話') });
  choice('ch5.phone_choice', '宮前さんに、どう伝えますか？', [
    opt('thank', '「宮前さんの補充の工夫が、手がかりになりました。当時の様子を、教えていただけませんか」', 'ch5.ph_a', { tone: 'caring', effects: [rel('miyamae', 2, 2), ev('teamwork', 2)] }),
    opt('fact', '「お知らせが個人宛になっていた事実を、お伝えします。確認として、手元の手順を教えてください」', 'ch5.ph_b1', { tone: 'careful', effects: [rel('miyamae', 1, 1), ev('reporting', 1)] }),
    opt('skip', '「今日は連絡しません。駅長からの正式な連絡に任せます」', 'ch5.ph_c1', { tone: 'neutral', effects: [set('ch5.miyamae_skipped'), set('ch5.late_miyamae'), set('ch5.late_report'), lockE('miyamae_note', '宮前さんの旧ロッカーの付箋は、月末の整理で、誰にも読まれず処分された')] })
  ], { important: true, who: 'miyamae', view: O(['kubota', 'shiraishi']) });
  // 感謝して、聞く：旧ロッカーを開ける（3D）
  go('ch5.ph_a', [
    ['miyamae', '……ああ。更新の次の補充で、「確定」の案内が出て。押しただけです。'],
    ['miyamae', 'そちらの更衣室、奥の列に、私が使っていたロッカーが、まだ名札つきで残っているはずです。'],
    ['miyamae', '内側に、黄色い付箋を貼ってあります。引継ぎ帳に書くべきでした。', 'worry']
  ], 'ch5.ph_a2', { effects: [tl('5月21日 宮前さんに連絡。旧ロッカーの付箋の話を聞く')], view: O(['kubota', 'shiraishi']) });
  go('ch5.ph_a2', [['kubota', '鍵は、事務室にあります。……行ってきてください。']], 'ch5.hub_lk', { effects: [{ clock: { minute: hm(10, 5) } }], view: O(['kubota']) });
  N['ch5.hub_lk'] = { id: 'ch5.hub_lk', type: 'hub', scene: 'station', title: '更衣室（宮前さんの旧ロッカー）', hint: '更衣室の奥の列へ。事務室の鍵で、名札のついたロッカーを開けます。', view: v3('follow', '10:05 更衣室'), interactions: [], timed: [{ id: 'lk_late', at: hm(10, 30), goto: 'ch5.lk_end' }], goals: [
    { id: 'g_lk', label: '宮前さんの旧ロッカーを開ける', when: F('ch5.note_found') }
  ], exit: { label: '事務室へ戻る', requires: F('ch5.note_found'), goto: 'ch5.lk_end' } };
  N['ch5.hub_lk'].interactions.push(
    { id: 'lk', object: 'roster_board', label: '更衣室の奥、宮前さんの旧ロッカーを開ける', goto: 'ch5.lk_open', once: true, icon: '🗝️' },
    { id: 'lk_k', object: 'kubota', label: '久保田さんに、付箋の文字を見せる', goto: 'ch5.lk_k', requires: F('ch5.note_found'), once: true, icon: '📝' }
  );
  go('ch5.lk_open', [
    '名札の「宮前」は、四月のまま、色あせていた。扉の内側に、黄色い付箋が一枚。',
    '「補充のあと、確定」。角ばった、几帳面な字。',
    'その下に、別のボールペンで、小さく。「引継ぎ帳に書けなかった。次の人へ。」'
  ], 'ch5.lk_open_end', null, v3('npc:roster_board', '10:08 更衣室'));
  fx('ch5.lk_open_end', [set('ch5.note_found'), ev('teamwork', 2), time(5)], 'ch5.hub_lk');
  go('ch5.lk_k', [
    ['kubota', '……こういう字を、書く人でした。', 'normal'],
    '久保田は、付箋を、指の腹で、そっと剥がした。台紙の跡が、ロッカーの内側に、四角く残った。',
    ['kubota', '剥がれます、って、私が言った付箋が、こんなところに、半年。']
  ], 'ch5.lk_k_end', null, v3('npc:kubota', '10:15 更衣室'));
  fx('ch5.lk_k_end', [rel('kubota', 1, 2), set('ch5.note_taken'), time(5)], 'ch5.hub_lk');
  go('ch5.lk_end', [
    '事務室へ戻る途中、ロッカーの鍵を、事務室の鍵箱へ返した。',
    '付箋は、{player}の手帳の最後の頁に、貼られた。'
  ], 'ch5.record_task_intro', { effects: [{ clock: { minute: hm(10, 30) } }], view: O(['kubota'], '10:30 駅事務室') });
  // 事実だけ伝える
  go('ch5.ph_b1', [
    ['miyamae', '個人宛……。異動前後、メールはほとんど開けていませんでした。', 'worry'],
    ['miyamae', '補充は、画面の案内どおりに押していた、それだけです。']
  ], 'ch5.ph_b2', null, O(['kubota', 'shiraishi']));
  go('ch5.ph_b2', [
    ['miyamae', '……すみません。私のせいで。', 'worry'],
    ['kubota', '（受話器へ）宮前さんのせいではありません。仕組みの話です。']
  ], 'ch5.ph_b3', null, O(['kubota']));
  go('ch5.ph_b3', [
    ['miyamae', '更衣室の、私のロッカー。月末の整理で、中身は処分されますよね。……何も、入っていません。'],
    '電話の向こうで、紙をめくる音がした。']
  , 'ch5.ph_b4', null, O(['shiraishi']));
  go('ch5.ph_b4', [
    ['shiraishi', '月末は来週だ。何か、残っていないか、確認しておく。'],
    '白石は、手帳に、短く書いた。「ロッカー、宮前」。'
  ], 'ch5.record_task_intro', { effects: [tl('5月21日 宮前さんに事実を伝え、確認する'), { clock: { minute: hm(10, 30) } }], view: O(['shiraishi']) });
  // 連絡しない：駅長が午後に電話する
  go('ch5.ph_c1', [
    ['shiraishi', '連絡しないのも判断だ。だが彼は、自分が何かしたかと、気にしているかもしれん。', 'normal'],
    ['kubota', '正式な連絡は事実だけが並びます。気持ちは誰かが補わないと。']
  ], 'ch5.ph_c2', { effects: [tl('5月21日 宮前さんへの連絡は駅長に委ねた')], view: O(['kubota', 'shiraishi']) });
  go('ch5.ph_c2', [
    ['shiraishi', '午後、私が電話を入れる。覚えておけ。'],
    '午後三時。白石は、受話器を持ったまま、しばらく、何も言わなかった。'
  ], 'ch5.ph_c3', { effects: [{ clock: { minute: hm(15, 0) } }], view: O(['shiraishi'], '15:00 駅長室') });
  go('ch5.ph_c3', [
    ['shiraishi', '……宮前が、「自分のせいですか」と聞いた。', 'serious'],
    ['shiraishi', '正式な言葉では、答えられなかった。事実は事実のまま、人に届かないことがある。']
  ], 'ch5.ph_c4', null, O(['shiraishi']));
  go('ch5.ph_c4', [
    '月末。更衣室の奥の列のロッカーが、一斉に開けられた。',
    '名札の「宮前」の内側に、何かが貼ってあったことを、知る人は、もういない。'
  ], 'ch5.record_task_intro', { effects: [{ clock: { minute: hm(10, 30) } }], view: O(['kubota']) });

  // ---- 記録の整理 ----
  line('ch5.record_task_intro', [
    ['hiyama', '記録は「何を書くか」と同じくらい「何を書かないか」です。'],
    ['hiyama', '残すか、残さないか。分けてください。']
  ], 'ch5.record_task', { view: O(['hiyama'], '10:30 事務室 記録の整理') });
  task('ch5.record_task', 'checklist', '調査記録の整理', '記録に残すべきか、残さないべきかを判定します。', {
    config: { labels: ['記録に残す', '記録に残さない'] }, items: [
      { id: 'a', label: '「担当者の不注意が原因」と、個人名を挙げて断定的に書く', truth: 'ng', why: '原因は仕組みです。個人の責任として書くと事実とも違います。' },
      { id: 'b', label: '停止日時（木曜夜）と、受付簿に書かれた復旧日（金曜朝）を、別々の欄に書く', truth: 'ok', why: '起きた日と書かれた日を分ければ、誤読されません。' },
      { id: 'c', label: '「たぶん、もう大丈夫だと思う」という感想だけの一文', truth: 'ng', why: '感想は根拠になりません。検証ログの時刻を書きます。' },
      { id: 'd', label: '参照した資料の名前・版・日付を、そのまま引用して書く', truth: 'ok', why: '出典と版が分かれば、誰でも確かめられます。' },
      { id: 'e', label: '確認済みの事実と、推測を、別の見出しに分けて書く', truth: 'ok', why: '推測を事実のように書くと、記録の信用が下がります。' },
      { id: 'f', label: '手順書・様式・点検票の版が古かったという事実', truth: 'ok', why: '再発防止の根拠になります。' }]
  }, res3('ch5.rec_good', 'ch5.rec_mid', 'ch5.rec_bad', [set('ch5.rec_final'), ev('accuracy', 2)], [ev('accuracy', 1)], [ev('accuracy', -1)]), O(['hiyama'], '記録の整理'));
  go('ch5.rec_good', [['hiyama', '迷いがありませんでした。この記録は、次の担当者への引継ぎそのものになります。', 'smile']], 'ch5.rec_check', null, O(['hiyama']));
  go('ch5.rec_mid', [['hiyama', '事実と推測の欄、個人を断定しない欄。あとで、私が直しておきます。']], 'ch5.rec_check', null, O(['hiyama']));
  go('ch5.rec_bad', [['hiyama', '今日の綴りを、見本にしてください。']], 'ch5.rec_check', null, O(['hiyama']));
  branch('ch5.rec_check', [[ALL(F('ch5.rec_memo'), F('ch5.rec_copy'), F('ch5.rec_test'), F('ch5.rec_final')), 'ch5.rec_all']], 'ch5.slot_open');
  fx('ch5.rec_all', [set('ch5.recorded'), ev('reporting', 2), tl('5月21日 調査の全過程を、出典つきで記録に残す')], 'ch5.slot_open');

  // ================= 推薦者の発表（5月21日 16:30）=================
  line('ch5.slot_open', [
    '16時30分。白石が、事務室の隅に、{player}と山科を、並べて呼んだ。',
    ['shiraishi', '基地入門研修の推薦を、今日、決める。志望書は、二通読んだ。', 'normal'],
    '机の上に、箱から出された封筒。山科のものは、角が揃ったまま。',
    ['shiraishi', '決めるのは私だ。ただし、聞く。一度だけ。']
  ], 'ch5.slot_choice', { effects: [{ clock: { minute: hm(16, 30) } }], view: O(['shiraishi', 'yamashina'], '5月21日（金） 16:30 駅事務室') });
  const SELF_OK = ALL({ not: { locked: 'slot_self' } }, F('ch5.submitted'), NF('ch5.sk_evaded'));
  choice('ch5.slot_choice', '白石は、{player}を見ている。', [
    opt('self', '「自分を、推薦してください」', 'ch5.sv_self_1', { tone: 'honest', requires: SELF_OK, effects: [rel('shiraishi', 1, 1)] }),
    opt('yama', '「山科さんを、推薦してください」', 'ch5.sv_yama_1', { tone: 'caring', effects: [rel('yamashina', 1, 1)] }),
    opt('silent', '何も言わない', 'ch5.sv_silent_1', { tone: 'neutral', effects: [rel('shiraishi', -1, -1)] })
  ], { important: true, timeLimit: 20, defaultOption: 'silent', who: 'shiraishi', view: O(['shiraishi', 'yamashina']) });
  // 山科が、推薦から外れているか
  const Y_OUT = F('ch5.y_out');
  go('ch5.sv_self_1', [
    ['player', '志望書は、提出しました。自分で、行きたいです。'],
    ['yamashina', '……俺は、構わない。構わない、って、言わせてくれ。', 'worry'],
    ['shiraishi', '分かった。']
  ], 'ch5.sv_self_2', null, O(['shiraishi', 'yamashina']));
  branch('ch5.sv_self_2', [[RG('shiraishi', '>=', 3), 'ch5.sv_self_3a']], 'ch5.sv_self_3b');
  go('ch5.sv_self_3a', [['shiraishi', '君の扱いは、見た。券売機も、連休も。赤印の有無でなく、そのあとを。推薦は、君だ。']], 'ch5.sv_self_4', { effects: [set('ch5.slot_player'), lockE('slot_this_year', '今年度の駅の推薦は、自分に決まった'), tl('5月21日 基地入門研修の推薦者に選ばれた')], view: O(['shiraishi']) });
  go('ch5.sv_self_3b', [['shiraishi', '志望書は読んだ。……まだ、私が見ていない半年がある。今年は、山科を出す。']], 'ch5.sv_self_4', { effects: [set('ch5.slot_yama'), lockE('slot_this_year', '今年度の駅の推薦は、山科に決まった'), tl('5月21日 基地入門研修の推薦者に山科が選ばれた')], view: O(['shiraishi']) });
  branch('ch5.sv_self_4', [[F('ch5.slot_player'), 'ch5.sv_self_5p']], 'ch5.sv_self_5y');
  go('ch5.sv_self_5p', [['yamashina', '……おめでとう。言えた。', 'worry'], '山科の握った拳の中で、ペンが、鳴らなかった。'], 'ch5.close', { effects: [rel('yamashina', -1, 0)], view: O(['yamashina']) });
  go('ch5.sv_self_5y', [['yamashina', '……自分から、言ったのにな。', 'normal'], '山科は、{player}に、小さく頭を下げた。'], 'ch5.close', { effects: [rel('yamashina', 1, 1)], view: O(['yamashina']) });
  go('ch5.sv_yama_1', [
    ['player', '山科さんを、推薦してください。'],
    ['yamashina', '……お前の志望書は。', 'worry'],
    ['shiraishi', '聞いた。']
  ], 'ch5.sv_yama_2', null, O(['shiraishi', 'yamashina']));
  branch('ch5.sv_yama_2', [[Y_OUT, 'ch5.sv_yama_out']], 'ch5.sv_yama_ok');
  go('ch5.sv_yama_out', [
    ['shiraishi', '気持ちは受け取る。だが、報告が遅れた者は、今年は推薦しない。……誰も、出さない。'],
    '白石は、二通の封筒を、箱へ戻した。蓋が、閉まった。'
  ], 'ch5.sv_yama_3', { effects: [set('ch5.slot_open'), lockE('slot_this_year', '今年度の駅の推薦は、見送られた（空席）'), tl('5月21日 基地入門研修の駅推薦は、今年度は空席となった')], view: O(['shiraishi']) });
  go('ch5.sv_yama_ok', [
    ['shiraishi', '分かった。山科を推す。赤印は、扱いの欄に、私が書く。']
  ], 'ch5.sv_yama_3', { effects: [set('ch5.slot_yama'), lockE('slot_this_year', '今年度の駅の推薦は、山科に決まった'), tl('5月21日 基地入門研修の推薦者に山科が選ばれた')], view: O(['shiraishi']) });
  branch('ch5.sv_yama_3', [[F('ch5.slot_open'), 'ch5.sv_yama_4o']], 'ch5.sv_yama_4y');
  go('ch5.sv_yama_4o', [['yamashina', '……お前は、俺を推した。それは、俺は、忘れない。', 'normal'], '山科は、空になった箱を、しばらく、見ていた。'], 'ch5.close', { effects: [rel('yamashina', 1, 2)], view: O(['yamashina']) });
  go('ch5.sv_yama_4y', [['yamashina', '……借りが、また一つ増えた。必ず、返す。', 'smile'], '山科の手の中で、ペンが、一度だけ、鳴った。'], 'ch5.close', { effects: [rel('yamashina', 1, 2)], view: O(['yamashina']) });
  go('ch5.sv_silent_1', [
    '{player}は、何も言わなかった。',
    ['shiraishi', '……そうか。'],
    '白石は、しばらく、二通の封筒を見比べていた。'
  ], 'ch5.sv_silent_2', null, O(['shiraishi', 'yamashina']));
  branch('ch5.sv_silent_2', [[ALL(Y_OUT, SELF_OK), 'ch5.sv_silent_p'], [Y_OUT, 'ch5.sv_silent_o']], 'ch5.sv_silent_y');
  go('ch5.sv_silent_p', [['shiraishi', '名乗らなかったが、志望書は、読んだ。扱いも、見た。……推薦は、{player}だ。']], 'ch5.sv_silent_3', { effects: [set('ch5.slot_player'), lockE('slot_this_year', '今年度の駅の推薦は、自分に決まった'), tl('5月21日 基地入門研修の推薦者に選ばれた')], view: O(['shiraishi']) });
  go('ch5.sv_silent_o', [['shiraishi', '今年は、出さない。言われなければ、決められない日も、ある。'], '二通の封筒が、箱へ戻った。'], 'ch5.sv_silent_3', { effects: [set('ch5.slot_open'), lockE('slot_this_year', '今年度の駅の推薦は、見送られた（空席）'), tl('5月21日 基地入門研修の駅推薦は、今年度は空席となった')], view: O(['shiraishi']) });
  go('ch5.sv_silent_y', [['shiraishi', '決める。山科を推す。']], 'ch5.sv_silent_3', { effects: [set('ch5.slot_yama'), lockE('slot_this_year', '今年度の駅の推薦は、山科に決まった'), tl('5月21日 基地入門研修の推薦者に山科が選ばれた')], view: O(['shiraishi']) });
  branch('ch5.sv_silent_3', [[F('ch5.slot_player'), 'ch5.sv_silent_4p'], [F('ch5.slot_open'), 'ch5.sv_silent_4o']], 'ch5.sv_silent_4y');
  go('ch5.sv_silent_4p', [['yamashina', '……何も、言わなかったのにな。', 'normal'], '山科は、目をそらして、ペンを、胸ポケットに差した。'], 'ch5.close', { effects: [rel('yamashina', -1, 0)], view: O(['yamashina']) });
  go('ch5.sv_silent_4o', [['yamashina', '……箱、空だ。', 'normal'], '山科は、何も、言わなかった。ペンも、鳴らなかった。'], 'ch5.close', { view: O(['yamashina']) });
  go('ch5.sv_silent_4y', [['yamashina', '……俺が、か。お前は、何も言わなかった。', 'worry'], '山科は、封筒を受け取って、手の中で、一度だけ、握りしめた。'], 'ch5.close', { view: O(['yamashina']) });

  // ---- 章の結び：付箋を書く ----
  line('ch5.close', [
    '17時15分。2号機の画面は、いつもの「いらっしゃいませ」を映している。',
    '久保田の机に、新しい付箋が一枚。「補充後、確定」。その下に、小さく「引継ぎ帳へ」。',
    ['kubota', '旧様式は箱に封をします。付箋は、今日で卒業です。', 'smile']
  ], 'ch5.close_b', { effects: [{ clock: { minute: hm(17, 15) } }], view: O(['shiraishi', 'kubota'], '17:15 駅事務室') });
  branch('ch5.close_b', [[F('ch5.false_report'), 'ch5.cl_false'], [F('ch5.late_report'), 'ch5.cl_late'], [F('ch5.recorded'), 'ch5.cl_rec']], 'ch5.cl_plain');
  go('ch5.cl_false', [
    ['shiraishi', '本社に出した報告は、撤回した。撤回の報告も、本社に残る。', 'serious'],
    '白石は、取り下げ書の控えを、引継ぎ帳の最初の頁に、綴じた。'
  ], 'ch5.end', [ev('reporting', -1)], O(['shiraishi']));
  go('ch5.cl_late', [
    ['shiraishi', '原因は見つけた。だが報告が届くまでの時間は、君の記録に残る。', 'serious'],
    '白石は、引継ぎ帳の余白に、日付を一つ、書いた。五月二十一日。'
  ], 'ch5.end', [ev('reporting', -1)], O(['shiraishi']));
  go('ch5.cl_rec', [
    ['shiraishi', '全部、出典つきで残っている。君がいなくても、次の人が同じ結論に着く。', 'smile'],
    ['kubota', '三か月目の面談の材料になりますよ。']
  ], 'ch5.end', [ev('reporting', 2), rel('shiraishi', 1, 1)], O(['shiraishi', 'kubota']));
  go('ch5.cl_plain', [['shiraishi', '原因は突き止めた。記録の残し方には、まだ余地がある。面談で見よう。']], 'ch5.end', null, O(['shiraishi']));

  N['ch5.end'] = { id: 'ch5.end', type: 'end', chapter: 'ch5', title: '第5章 券売機のむこう側', nextChapter: 'ch6',
    summary: '券売機の夜間停止の原因は、悪意でも故障でもなく、補充後の確定操作が引き継がれていないという「運用の隙間」だった。何を調べ、何を取り逃がし、誰に、どこまで報告したか。推薦の箱は閉まり、その結果は、次の面談に残る。',
    effects: [tl('5月21日 券売機の件の調査を終える'), log('第5章を終了', 'chapter')] };
}
