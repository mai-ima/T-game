// R7 第6章「三か月目の面談」（6月下旬）。対話中心。「異動の現実」を人数・資格・評価・時間・実績の壁として見せる。
// 面談で決める希望（ch6.wish_*）は本作の最大の分岐点。選んだ1つだけを永続フラグとして設定し、他の3つは設定しない。
// 章の終盤は希望ごとに別の人物・別の舞台の2D場面（最初の一歩）に分かれ、合流後もルート別フラグを読む。
// モチーフ：森下のペンの「カチ」（事実を告げる前の癖）／山科が折り直す希望調書／橘の「待て」。
export default function ch6(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, F, NF, ALL, ANY, hm, v25, res3, P } = k;

  characters.jikka = { id: 'jikka', name: '母（実家）', kana: 'はは', role: '家族（遠方の実家）', dept: 'none', age: 56, years: 0, uniform: '#7a5a78', hair: '#6a6a6a', skin: '#ecc8a8', trait: '心配は口にせず、食事のことばかり聞く。本当は帰ってきてほしい。', bio: '北の港町で小さな店を営む。弟と二人暮らし。', gender: 'f' };
  characters.hoshino = { id: 'hoshino', name: '星野 沙織', kana: 'ほしの さおり', role: '駅務区 教育担当（上級駅務）', dept: 'station', age: 39, years: 17, uniform: '#1d2a44', hair: '#2b2118', skin: '#f0cfae', trait: '穏やか。「お客様の顔を覚えているか」を必ず聞く。', bio: '窓口・ホーム・事務室の全てを経験した上級駅務員。', gender: 'f', accessory: 'glasses' };
  characters.sekiya = { id: 'sekiya', name: '関谷 周平', kana: 'せきや しゅうへい', role: '輸送指令主任', dept: 'dispatch', age: 47, years: 24, uniform: '#2a3d52', hair: '#3a3a3a', skin: '#e9c7a2', trait: '声が低く、短く言い切る。復唱を絶対に省かない。', bio: '運転士・駅・計画を経て指令へ。', gender: 'm', accessory: 'none' };
  characters.togashi = { id: 'togashi', name: '富樫 玲', kana: 'とがし れい', role: '輸送計画課 係長', dept: 'planning', age: 36, years: 13, uniform: '#3a4a5e', hair: '#2a2a2a', skin: '#f0cfae', trait: '資料の「版」と「根拠」にうるさい。聞き上手。', bio: 'ダイヤ資料室の責任者。元・駅の助役補佐。', gender: 'f', accessory: 'glasses' };

  const HR = (who, cap) => v25('hr', who, cap);
  const OF = (who, cap) => v25('office', who, cap);
  const DP = (who, cap) => v25('depot', who, cap);
  const task = (id, kind, title, intro, extra, results, view) => (N[id] = { id, type: 'task', kind, title, intro, ...extra, results, view });
  const go = (id, lines, next, effects, view) => line(id, lines, next, { ...(effects ? { effects } : {}), view: view ?? HR([]) });
  const bestRoute = (grid, must) => { const Hh = grid.length, W = grid[0].length; let s; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (grid[y][x] === 'S') s = [x, y];
    const mk = [...new Set(must)]; const key = (x, y, m) => `${x},${y},${m}`; const dist = new Map([[key(s[0], s[1], 0), 1]]); const q = [[s[0], s[1], 0, 1]];
    while (q.length) { q.sort((a, b) => a[3] - b[3]); const [x, y, m, d] = q.shift(); if (d > dist.get(key(x, y, m))) continue; if (grid[y][x] === 'G' && m === (1 << mk.length) - 1) return d;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const c = grid[ny]?.[nx]; if (!c || c === '#') continue; let nm = m; const mi = mk.indexOf(c); if (mi >= 0) nm |= 1 << mi; const nd = d + (c === '~' ? 3 : 1); const kk = key(nx, ny, nm); if (nd < (dist.get(kk) ?? 1e9)) { dist.set(kk, nd); q.push([nx, ny, nm, nd]); } } }
    return 20; };
  const E = (key, op, val) => ({ eval: { key, op, val } });

  // ================= 6月21日（月）：面談の前に、現実を知る =================
  line('ch6.open', [
    'カチ。森下のボールペンが鳴った。彼女が事実を告げる前の癖だ。',
    ['morishita', '先に言います。三か月目の面談で、異動は決まりません。', 'normal'],
    ['player', '…決まらないのに、希望を出すんですか。'],
    ['morishita', '来年4月の異動の検討は、秋に始まります。その前に、あなたが何を準備してきたかを知りたい。'],
    ['morishita', '基地は在籍12か月、駅務基礎、基地入門。枠は2、希望は全社で7。計画は24か月で枠1。指令に新人の直通はありません。'],
    ['player', '希望すれば行ける、わけじゃないんですね。'],
    ['morishita', '希望は出発点です。期待させる方が、不誠実ですから。']
  ], 'ch6.sort_intro', { effects: [{ clock: { addDay: 31, minute: hm(8, 40) } }, set('ch6.open'), tl('6月21日 三か月目の面談の準備。異動の条件と枠を知る'), log('第6章開始。異動の条件と枠の説明', 'career')], view: HR(['morishita'], '6月21日（月） 8:40 本社 人事課') });
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
  go('ch6.sort_good', [['morishita', '正確です。…ただ「在籍期間」だけは、努力で縮まりません。', 'smile']], 'ch6.path_intro', null, HR(['morishita']));
  go('ch6.sort_mid', [['morishita', '資格は「もらう」、研修は「受ける」。そこだけ覚えて。']], 'ch6.path_intro', null, HR(['morishita']));
  go('ch6.sort_bad', [['morishita', 'カチ。持ち帰って構いません。種類が分かれば、順番が見えます。']], 'ch6.path_intro', null, HR(['morishita']));
  go('ch6.path_intro', [['morishita', '道のりも描きましょう。関所は二つ。駅務基礎の考査と、基地入門。混む時期は待たされます。']], 'ch6.path_task', null, HR(['morishita']));
  { const grid = ['S..#.....', '.#.#.###.', '.#A...B~.', '.####.#..', '.......~G']; const must = ['A', 'B'];
    task('ch6.path_task', 'route', '異動までの道のり', '起点（いま）から着点（候補）まで、A（駅務基礎の修了考査）・B（基地入門研修）を必ず通ります。混んだ研修期は遅くなります。', {
      config: { grid, must, best: bestRoute(grid, must), legend: { '#': '条件が足りず通れない', '~': '待ちの長い時期（遅い）', A: '駅務基礎の修了考査', B: '基地入門研修', S: 'いま（入社3か月）', G: '来年4月の候補' } }
    }, res3('ch6.path_good', 'ch6.path_mid', 'ch6.path_bad', [ev('reporting', 1)], [], []), HR(['morishita'], '異動までの道のり')); }
  go('ch6.path_good', [['morishita', '待ちの時期まで避けましたね。計画を立てる側の素質かもしれない。', 'smile']], 'ch6.form_intro', null, HR(['morishita']));
  go('ch6.path_mid', [['morishita', '遠回りでも、関所は通っています。道は一本ではないので。']], 'ch6.form_intro', null, HR(['morishita']));
  go('ch6.path_bad', [['morishita', '関所のない道は、地図にありません。木曜までに見直しを。']], 'ch6.form_intro', null, HR(['morishita']));
  go('ch6.form_intro', [['morishita', '最後に、希望調書を一枚。何を書き、何を書かないか。']], 'ch6.form_task', null, HR(['morishita']));
  task('ch6.form_task', 'checklist', '希望調書の下書き', '調書に、書くべきか、書かないほうがよいかを判定します。', {
    config: { labels: ['書く', '書かない'] }, items: [
      { id: 'a', label: '希望の理由を、この三か月の具体的な経験で書く', truth: 'ok', why: '経験に根ざした理由は、面談で話が深まります。' },
      { id: 'b', label: '今の自分に足りない条件を、正直に書く', truth: 'ok', why: '足りないものを知る人は、準備の計画を立てられます。' },
      { id: 'c', label: '遠方勤務や家族の事情など、勤務地についての希望や制約', truth: 'ok', why: '任意ですが、書けば配慮を検討できます。' },
      { id: 'd', label: '「同期の誰々より評価が高い」という比較', truth: 'ng', why: '他人との比較は、調書の目的ではありません。' },
      { id: 'e', label: '「希望が通らなければ辞めたい」という一文', truth: 'ng', why: '脅しに読まれます。気持ちは面談で話しましょう。' },
      { id: 'f', label: '取り組む予定の資格・研修', truth: 'ok', why: '準備の方向が見えると、会社も支援しやすくなります。' }]
  }, res3('ch6.form_good', 'ch6.form_mid', 'ch6.form_bad', [set('ch6.form_ok'), ev('reporting', 1)], [], []), HR(['morishita'], '希望調書の下書き'));
  go('ch6.form_good', [['morishita', 'いい下書きです。木曜に机へ置いて。', 'smile']], 'ch6.s2_open', null, HR(['morishita']));
  go('ch6.form_mid', [['morishita', '惜しい所は、一緒に直します。']], 'ch6.s2_open', null, HR(['morishita']));
  go('ch6.form_bad', [['morishita', 'カチ。本心と書き方は別です。見直しを。']], 'ch6.s2_open', null, HR(['morishita']));

  // ================= 6月22日（火）：基地の検修長 =================
  line('ch6.s2_open', [
    '検修庫の床に、ぽつんと油の染み。ここへ来るたび、新品の靴の自分が浮く。',
    ['yamashina', '来たな。…背筋、伸びるだろ。', 'smile'],
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
    ['player', '…まだ分かりません。ただ、止まっている電車の方が気になります。'],
    ['tachibana', '止まっている電車、か。悪くない。'],
    ['tachibana', '検修は「見る・触る・記録する」だ。夜勤もある。体を壊すのは睡眠を削る奴だ。'],
    ['yamashina', '橘さんは、なぜこの仕事を？'],
    ['tachibana', '行く場所がなかった。三十八年で、今はここしか無い。…あと二年だがな。', 'smile']
  ], 'ch6.s2_branch', { view: DP(['tachibana', 'yamashina'], '検修庫 事務所') });
  branch('ch6.s2_branch', [[ANY(F('ch5.recorded'), F('ch5.root_found')), 'ch6.tc_heard']], 'ch6.tc_plain');
  line('ch6.tc_heard', [
    ['tachibana', '券売機の件は白石から聞いた。手順の抜けを自分で突き止めた、とな。'],
    ['tachibana', '基地は人を選ばん。記録が選ぶ。お前の記録は読めた。'],
    ['tachibana', 'だが今は駅にいろ。基地は逃げん。待て。']
  ], 'ch6.tc_sort', { effects: [rel('tachibana', 2, 1), set('ch6.tc_praised')], view: DP(['tachibana']) });
  line('ch6.tc_plain', [
    ['tachibana', '基地は人を選ばん。記録が選ぶ。駅で何を残した。一つ言え。'],
    ['player', '…胸を張れるものは、まだ少ないです。'],
    ['tachibana', '少ないと言えるなら伸びる。誤魔化す奴は伸びん。待て。']
  ], 'ch6.tc_sort', { effects: [rel('tachibana', 1, 0)], view: DP(['tachibana']) });
  go('ch6.tc_sort', [['tachibana', '線の内側から見ろ。触るな。資格の壁を、分けて覚えろ。']], 'ch6.depot_task', null, DP(['tachibana'], '検修庫 見学通路'));
  task('ch6.depot_task', 'sort', '検修の作業と資格', '各作業が、資格なしで見学できるのか、認定後に補助できるのか、有資格者のみなのかを選びます。', {
    config: { perItem: 12, bins: [{ id: 'view', label: '見学のみ（資格不要）' }, { id: 'assist', label: '検修作業補助の認定後' }, { id: 'only', label: '有資格の検修員のみ' }], items: [
      { id: 'a', label: '黄色い線の内側から、床下を見学する', bin: 'view', why: '見学者は、線の内側から見るだけです。' },
      { id: 'b', label: '工具・部品の運搬の補助', bin: 'assist', why: '認定を受けた補助員が行います。' },
      { id: 'c', label: 'ブレーキ装置の分解と検査', bin: 'only', why: '安全に直結する作業は、有資格の検修員だけです。' },
      { id: 'd', label: '検査記録票への転記の補助', bin: 'assist', why: '記録の補助は、認定後に任されます。' },
      { id: 'e', label: '編成の入出区の誘導', bin: 'only', why: '入出区は、有資格者が担います。' },
      { id: 'f', label: '台車まわりの清掃の補助', bin: 'assist', why: '認定後に、監督のもとで行います。' }] }
  }, res3('ch6.dt_good', 'ch6.dt_mid', 'ch6.dt_bad', [ev('safety', 2), sk('depot', 2)], [sk('depot', 1)], []), DP(['tachibana'], '検修の作業と資格'));
  go('ch6.dt_good', [['tachibana', '…よく分けた。資格の壁は意地悪じゃない。人を守る壁だ。', 'smile']], 'ch6.s2_end', null, DP(['tachibana']));
  go('ch6.dt_mid', [['tachibana', '惜しい。「触る」仕事ほど厳しい。']], 'ch6.s2_end', null, DP(['tachibana']));
  go('ch6.dt_bad', [['tachibana', '線の内と外。まずそれを頭に入れろ。', 'serious']], 'ch6.s2_end', null, DP(['tachibana']));
  go('ch6.s2_end', [
    ['tachibana', '枠は少ない。希望者は毎年いる。ここに来たいなら、待てる奴になれ。'],
    ['yamashina', '俺は待ちます。', 'normal'],
    ['tachibana', '返事が早い。…{player}は迷っていていい。自分の目で見ている証拠だ。']
  ], 'ch6.s3_open', [rel('yamashina', 0, 1), set('ch6.saw_tachibana'), tl('6月22日 検修長から、資格の壁と「待つ」ことを教わる')], DP(['tachibana', 'yamashina']));

  // ================= 6月23日（水）：同期とのすれ違い／実家の電話 =================
  line('ch6.s3_open', [
    '事務室の机で、山科が希望調書を折っては開き、折っては開いていた。紙がもう柔らかい。',
    ['yamashina', '昼に先に面談だった。「枠は2、候補は7」だとよ。', 'worry'],
    ['yamashina', '条件は、まだ何も満たしてない。それでも希望は変わらない。変わらないから困ってる。'],
    ['player', '外れたときの落差、か。']
  ], 'ch6.s3_branch', { effects: [{ clock: { addDay: 1, minute: hm(17, 40) } }, tl('6月23日 山科さんと、希望と現実の話をする')], view: OF(['yamashina'], '6月23日（水） 17:40 駅事務室') });
  branch('ch6.s3_branch', [[F('ch2.saw_depot'), 'ch6.s3_depot']], 'ch6.s3_plain');
  line('ch6.s3_depot', [
    ['yamashina', '四月の見学、一緒に行っただろ。お前も同じ道に来ると勝手に思ってた。', 'smile'],
    ['yamashina', 'でも枠は2つ。お前が来たら、どっちかが落ちる。そう計算してる自分が、嫌なんだよ。', 'worry']
  ], 'ch6.s3_ask', { view: OF(['yamashina']) });
  line('ch6.s3_plain', [
    ['yamashina', 'お前がどの道を選ぶか、ずっと気になってた。', 'normal'],
    ['yamashina', '同期の道がばらばらになるのは普通だ。普通なのに、少し寂しい。']
  ], 'ch6.s3_ask', { view: OF(['yamashina']) });
  go('ch6.s3_ask', [['yamashina', '明日、何て言う。']], 'ch6.told_choice', null, OF(['yamashina']));
  choice('ch6.told_choice', '山科さんに、どう答えますか？', [
    opt('depot', '「私も、基地を目指すかもしれない」', 'ch6.told_a', { tone: 'honest', effects: [set('ch6.told_depot')] }),
    opt('other', '「私は、別の道に進むかもしれない」', 'ch6.told_b', { tone: 'careful', effects: [set('ch6.told_other')] }),
    opt('open', '「まだ決められない。面談で話してから決める」', 'ch6.told_c', { tone: 'neutral', effects: [set('ch6.told_open')] })
  ], { view: OF(['yamashina']) });
  go('ch6.told_a', [['yamashina', '…そうか。嬉しいのと困るのが半分ずつだ。'], ['yamashina', '競争になる。でも相手がお前なら、悪くない。', 'smile']], 'ch6.s4_open', [rel('yamashina', 1, 1)], OF(['yamashina']));
  go('ch6.told_b', [['yamashina', '…そうなのか。ほっとしたのと、置いていかれる気がするのと、両方だ。', 'surprise'], ['yamashina', '決めたら変えるなよ。']], 'ch6.s4_open', [rel('yamashina', 1, 0)], OF(['yamashina']));
  go('ch6.told_c', [['yamashina', '決めてる俺でも怖い。お前が決められないのは、悪くない。']], 'ch6.s4_open', [rel('yamashina', 0, 1)], OF(['yamashina']));
  line('ch6.s4_open', [
    '夜9時半。寮の自室。携帯が震えた。画面に「母」。',
    ['jikka', 'ごはん食べてる？ …面談、あるんだって？'],
    ['player', 'なんで知ってるの。'],
    ['jikka', '先週、あなたが言ったでしょう。覚えてるわよ。'],
    ['jikka', '遠くへ行くことになるの？ 店は弟がいるから、平気。…お盆は、帰れる？', 'worry']
  ], 'ch6.fam_choice', { effects: [{ clock: { minute: hm(21, 30) } }], view: HR(['jikka'], '21:30 社員寮の自室（電話）') });
  choice('ch6.fam_choice', '母に、どう話しますか？', [
    opt('open', '「異動で、遠くの職場になるかもしれない。行くとしても、まだ先だけど」と正直に話す', 'ch6.fam_a', { tone: 'honest', effects: [set('ch6.family_open'), rel('jikka', 1, 2)] }),
    opt('quiet', '「心配しないで。まだ何も決まってないから」とだけ答える', 'ch6.fam_b', { tone: 'neutral', effects: [set('ch6.family_quiet'), rel('jikka', 0, 1)] }),
    opt('promise', '「お盆は、帰れるように、勤務を調整してもらうよ」と約束する', 'ch6.fam_c', { tone: 'caring', effects: [set('ch6.family_promise'), rel('jikka', 1, 2), ev('teamwork', 1)] })
  ], { view: HR(['jikka']) });
  go('ch6.fam_a', [['jikka', '…そう。遠く、ねえ。反対はしないわ。', 'normal'], ['jikka', '冬には顔を見せなさい。電話じゃ顔色が分からないから。', 'smile']], 'ch6.s5_open', null, HR(['jikka']));
  go('ch6.fam_b', [['jikka', 'そう。…決まったら、先に教えてね。後から聞くとびっくりするから。'], ['player', '…うん。先に言う。']], 'ch6.s5_open', null, HR(['jikka']));
  go('ch6.fam_c', [['jikka', '無理しなくていいのに。…弟は喜ぶけど。', 'smile'], ['jikka', 'お願いするなら、わがままじゃなく、お願いの仕方でね。']], 'ch6.s5_open', null, HR(['jikka']));

  // ================= 6月24日（木）：三者面談 =================
  line('ch6.s5_open', [
    '面談室の机に、希望調書と評価の控え。折り目のついた調書は、もう{player}のものだ。',
    ['morishita', 'カチ。では、始めます。白石駅長、久保田さんも同席です。'],
    ['shiraishi', '評価を言い渡す場じゃない。君が自分の道を、自分の言葉で話す場だ。'],
    ['kubota', '褒めることも、言いにくいことも、あります。']
  ], 'ch6.concern_gate', { effects: [{ clock: { addDay: 1, minute: hm(13, 30) } }, set('ch6.s5'), tl('6月24日 三か月目の面談。白石・久保田・森下の三者'), log('三か月目の面談が始まる', 'career')], view: HR(['morishita', 'shiraishi', 'kubota'], '6月24日（木） 13:30 面談室') });
  branch('ch6.concern_gate', [[ANY(F('ch5.late_report'), F('ch4.secret_kept'), F('ch2.idea_selfpost'), F('legacy.rule_break')), 'ch6.concern_set']], 'ch6.rv_gate');
  fx('ch6.concern_set', [set('ch6.concern')], 'ch6.concern_pick');
  branch('ch6.concern_pick', [[F('ch4.secret_kept'), 'ch6.cn_secret'], [F('ch5.late_report'), 'ch6.cn_late'], [F('ch2.idea_selfpost'), 'ch6.cn_self']], 'ch6.cn_rule');
  go('ch6.cn_late', [
    ['shiraishi', '言いにくい方から。券売機の件。原因は君が突き止めた。だが報告が届くまでが、長かった。', 'serious'],
    ['kubota', '内容ではなく「いつ、誰に」です。異動先で一番問われます。'],
    ['morishita', '記録には残っています。ただ、挽回できる。次にどう動いたかを見ます。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_secret', [
    ['shiraishi', '連休中の山科の件。君は一度、報告しなかった。後で向き合ったことも聞いている。', 'serious'],
    ['kubota', '同期をかばう気持ちは分かります。でも、かばいが成長を止めることもある。'],
    ['morishita', 'カチ。記録には事実として残しました。異動先は「困ったとき、すぐ言える人か」を見ます。']
  ], 'ch6.rv_gate', [ev('reporting', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_self', [
    ['shiraishi', '四月に、許可なく券売機へ掲示した件。善意だったのは分かっている。'],
    ['kubota', '「いい考えでも手順を飛ばせば、信頼が減る」。今も同じです。'],
    ['morishita', 'その後の改善提案も書いてあります。ただ異動先は、まず「手順を守る人」を探します。']
  ], 'ch6.rv_gate', [ev('safety', -1)], HR(['shiraishi', 'kubota', 'morishita']));
  go('ch6.cn_rule', [
    ['shiraishi', '入社早々の、規則を飛ばした件。以来、確認を先にするようになった。そこは評価している。'],
    ['morishita', '一度のミスより、その後の姿勢が残ります。異動先に説明するとき、避けて通れない事実でもあります。']
  ], 'ch6.rv_gate', [ev('safety', -1)], HR(['shiraishi', 'morishita']));

  branch('ch6.rv_gate', [[ALL(E('safety', '>=', 60), E('accuracy', '>=', 58), E('reporting', '>=', 56)), 'ch6.rv_high'], [ALL(E('safety', '>=', 55), E('accuracy', '>=', 52)), 'ch6.rv_mid']], 'ch6.rv_low');
  go('ch6.rv_high', [
    ['morishita', '安全、正確性、報連相。三つとも各部署の目安に届いています。三か月で、立派です。', 'smile'],
    ['morishita', 'ただし入口に立てただけ。在籍期間と資格は、数字で前借りできません。']
  ], 'ch6.cr_gate', null, HR(['morishita', 'kubota']));
  go('ch6.rv_mid', [
    ['morishita', '安全と正確性は、目安にあと一歩。報連相は場面で差があります。'],
    ['kubota', '「できた日」と「できなかった日」の差が大きい。安定が課題です。'],
    ['shiraishi', '伸びしろがある、が一番正確だ。止まるな。']
  ], 'ch6.cr_gate', null, HR(['morishita', 'kubota', 'shiraishi']));
  go('ch6.rv_low', [
    ['morishita', 'カチ。正直に言います。いくつかの項目が、目安に届いていません。', 'serious'],
    ['kubota', '失敗が多いのではなく、基本の確認が抜ける日がある。そこを埋めないと進めません。'],
    ['shiraishi', '三か月目は、そういう時期だ。現実を現実のまま受け取れ。']
  ], 'ch6.cr_gate', null, HR(['morishita', 'kubota', 'shiraishi']));
  branch('ch6.cr_gate', [[F('ch5.recorded'), 'ch6.cr_rec'], [F('ch5.root_found'), 'ch6.cr_root']], 'ch6.cr_none');
  go('ch6.cr_rec', [
    ['morishita', '実績として一つ。五月の券売機。原因を自力で追い、全過程を出典つきで残した。', 'smile'],
    ['morishita', '異動は最後、記録で決まります。これは「実績の壁」の一枚目になりえます。']
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
    opt('station', '「駅の専門職として、現場を極めたいです（上級駅務を目指します）」', 'ch6.wr_station', { tone: 'caring', hint: '上級駅務の選考は在籍18か月以降／三つの持ち場の経験が必要', effects: [set('ch6.wish_station'), ev('service', 2), rel('morishita', 1, 1), rel('shiraishi', 1, 1), tl('6月24日 面談：駅の専門職（上級駅務）を希望'), log('異動希望：駅の専門職（上級駅務）', 'career')] }),
    opt('depot', '「車両基地で、検修の仕事を目指したいです」', 'ch6.wr_depot', { tone: 'careful', hint: '在籍12か月・駅務基礎・基地入門が必要／枠2に候補7名', effects: [set('ch6.wish_depot'), sk('depot', 3), tr('depot_intro', 5), { apply: { dept: 'depot', note: '三か月目面談で希望（来年度の候補検討の対象）' } }, rel('morishita', 1, 1), rel('tachibana', 1, 0), tl('6月24日 面談：車両基地・検修を希望'), log('異動希望：車両基地・検修', 'career')] }),
    opt('dispatch', '「輸送指令の仕事を目指したいです」', 'ch6.wr_dispatch', { tone: 'quick', hint: '新人から直接の道はない／現場3年以上と年1回の選考', effects: [set('ch6.wish_dispatch'), ev('reporting', 2), sk('ops', 3), { apply: { dept: 'planning', note: '輸送指令を見据えた輸送計画経由の希望' } }, rel('morishita', 1, 1), rel('hamaguchi', 1, 0), tl('6月24日 面談：輸送指令を希望'), log('異動希望：輸送指令（現場経験と計画経由の道）', 'career')] }),
    opt('planning', '「輸送計画（ダイヤ）の仕事を目指したいです」', 'ch6.wr_planning', { tone: 'careful', hint: '在籍24か月・駅務基礎／枠1・文書力が問われる', effects: [set('ch6.wish_planning'), sk('ops', 3), ev('reporting', 2), { apply: { dept: 'planning', note: '三か月目面談で希望（在籍24か月が目安）' } }, rel('morishita', 1, 1), tl('6月24日 面談：輸送計画を希望'), log('異動希望：輸送計画', 'career')] })
  ], { important: true, who: 'morishita', view: HR(['morishita', 'shiraishi', 'kubota'], '14:25 面談室 希望の選択') });

  // ---- 希望ごとの「異動の現実」（言い方も条件も別）----
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
    ['morishita', '条件は在籍12か月、駅務基礎、基地入門。評価は安全58・正確性56。いまは在籍3か月、研修は未受講です。'],
    ['shiraishi', '基地は、駅を任せられる人から出す。「行きたい」より先に「駅が回る」が来る。'],
    ['kubota', '山科さんも基地希望です。励みにもなるし、比べられもします。'],
    ['morishita', '7人中の2人。条件だけでは足りない。駅長が「送りたい」と書ける実績が要ります。']
  ], 'ch6.wr_depot_ev', { view: HR(['morishita', 'shiraishi', 'kubota']) });
  branch('ch6.wr_depot_ev', [[ALL(E('safety', '>=', 58), E('accuracy', '>=', 56)), 'ch6.wr_depot_hi']], 'ch6.wr_depot_lo');
  go('ch6.wr_depot_hi', [['morishita', '安全も正確性も目安に届いています。ほかの候補と並ぶ最低ラインには、もう立っている。', 'smile']], 'ch6.wr_depot_c', null, HR(['morishita']));
  go('ch6.wr_depot_lo', [['morishita', '安全か正確性が、まだ目安に届いていません。基地では数字ではっきり見られます。', 'serious']], 'ch6.wr_depot_c', null, HR(['morishita']));
  branch('ch6.wr_depot_c', [[F('ch6.concern'), 'ch6.wr_depot_cc']], 'ch6.plan_depot');
  go('ch6.wr_depot_cc', [['shiraishi', '基地は手順を一つ飛ばせば、人が死にうる現場だ。「飛ばした」「遅れた」の記録は、他より重く読まれる。', 'serious'], ['kubota', '厳しいですが、先に知っておいた方がいい。']], 'ch6.plan_depot', null, HR(['shiraishi', 'kubota']));
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
    ['morishita', 'カチ。…私も、昔ここを志望しました。通りませんでした。文書が甘かったんです。', 'normal'],
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
    opt('cert_low', certLowL, `ch6.pl_${r}_cert`, { tone: 'careful', requires: E('accuracy', '<', 52), effects: [set('ch6.plan_cert'), set('next.plan_cert'), set('ch6.basics_first'), tr('station_basic', 15), ev('accuracy', 3), tl('6月24日 研修計画：基礎の補習から資格の準備へ')] }),
    opt('ojt', ojtL, `ch6.pl_${r}_ojt`, { tone: 'caring', requires: NF('ch6.concern'), effects: [set('ch6.plan_ojt'), set('next.plan_ojt'), ev('teamwork', 2), ev('service', 1), tl('6月24日 研修計画：現場経験を優先')] }),
    opt('ojt_c', ojtCL, `ch6.pl_${r}_ojt`, { tone: 'honest', requires: F('ch6.concern'), effects: [set('ch6.plan_ojt'), set('next.plan_ojt'), set('ch6.rebuild_trust'), ev('reporting', 2), ev('teamwork', 1), rel('shiraishi', 1, 1), tl('6月24日 研修計画：報告の信頼を積み直しながら現場経験を優先')] })
  ], { important: true, who: 'morishita', view: HR(['morishita', 'shiraishi', 'kubota'], '14:50 面談室 研修計画') });
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
  R('ch6.pl_station_cert', [['morishita', '駅務基礎の考査は九月と十二月。九月に間に合えば、上級の要件を早く満たせます。'], ['kubota', '勉強は勤務の外です。睡眠は削らないで。成績に一番響く。', 'smile'], ['shiraishi', '資格を取ると、資格に見合う仕事をする。両方を半年で見せろ。']]);
  R('ch6.pl_station_ojt', [['shiraishi', '窓口が得意な者ほど、ホームで一から学ぶ。そのたびに景色が変わる。'], ['kubota', '三つ回るのはきついです。でも「聞いてから動く」を積めば形になります。', 'smile'], ['morishita', '勤務表は私が調整します。休みは確保します。']]);
  R('ch6.pl_depot_cert', [['morishita', '基地入門は、駅務基礎の修了が前提。順番を飛ばせないのが基地の道です。'], ['shiraishi', '認定は、基地の研修のあと。今は触れない。焦らず待てるかだ。'], ['kubota', '体調は、遠慮なく言ってください。', 'smile']]);
  R('ch6.pl_depot_ojt', [['shiraishi', '見学枠は研修日を使え。駅の勤務を削って行くな。'], ['morishita', '基地側の枠は月に数名。取れない月もあります。落ち込まないで。'], ['kubota', '見たことは、必ず記録に。橘さんは、そこを見ています。', 'smile']]);
  R('ch6.pl_dispatch_cert', [['morishita', '運行管理の基礎講座は社内の通信講座です。勤務の合間に進められます。'], ['shiraishi', '習ったことは、駅の運行情報で必ず試せ。現場で使って本物になる。'], ['kubota', '復唱と記録が習慣になるまで、ですね。']]);
  R('ch6.pl_dispatch_ojt', [['shiraishi', '指令との連絡は運行情報の担当が一番多い。遅延の日の電話役を引き受けろ。'], ['kubota', '確定と見込みを分けて話す。第一章で苦労した所を、慣れに変えましょう。'], ['morishita', '遅番を意識して入れます。休みも同時に確保します。']]);
  R('ch6.pl_planning_cert', [['morishita', 'ダイヤの基礎検定は年二回。駅務基礎と合わせて受けられます。'], ['shiraishi', '検定は手段だ。取ったら、ダイヤを「読む」現場へすぐ戻れ。'], ['kubota', '資料の読み方は、一緒に練習しましょう。', 'smile']]);
  R('ch6.pl_planning_ojt', [['morishita', '計画課からの集計依頼を、駅が受ける形が少数あります。窓口は私がつなぎます。'], ['shiraishi', '駅の混雑は駅の人間が一番知っている。数字にして出せ。'], ['kubota', '出典と日付を。券売機で身についたはずです。', 'smile']]);

  // ================= 6月25日（金）：希望ごとの「最初の一歩」=================
  branch('ch6.fs_gate', [[F('ch6.wish_depot'), 'ch6.fs_depot'], [F('ch6.wish_dispatch'), 'ch6.fs_dispatch'], [F('ch6.wish_planning'), 'ch6.fs_planning']], 'ch6.fs_station');

  // -- 駅の専門職：上級駅務の研修申込（駅務区の教育室・星野）--
  line('ch6.fs_station', [
    '教育室の壁一面に、業務手順の色分けの紙。端の一枚だけ、誰かの手書きで書き足されている。',
    ['hoshino', '星野です。…それ、私が十年前に書き足したの。まだ誰も直さない。', 'smile'],
    ['hoshino', '最初に聞くのは、いつも同じ。この三か月で、お客様の顔をいくつ覚えてる？'],
    ['player', '券売機で迷っていた男性。常連のおばあさん。遅延の日の旅行客。'],
    ['hoshino', '十分。数じゃないの。覚えている顔が根っこ。'],
    ['hoshino', '申込書は三欄。コース、実績、そして「一番苦手な場面」。']
  ], 'ch6.fs_station_br', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }, set('ch6.fs_station')], view: OF(['hoshino'], '6月25日（金） 10:00 駅務区 教育室') });
  branch('ch6.fs_station_br', [[F('legacy.helped_kajiwara'), 'ch6.fs_st_kaji']], 'ch6.fs_st_task');
  go('ch6.fs_st_kaji', [
    ['hoshino', '実績欄に使えるものが、もうあるかも。梶原さんが窓口であなたの名前を尋ねた記録。'],
    ['hoshino', 'お客様が覚えている。推薦書より強いの。', 'smile']
  ], 'ch6.fs_st_task', [set('ch6.st_kaji_voice')], OF(['hoshino']));
  task('ch6.fs_st_task', 'checklist', '上級駅務 研修申込書の確認', '申込書に書く内容として、適切かどうかを判定します。', {
    config: { labels: ['書く', '書かない'] }, items: [
      { id: 'a', label: '現場で自分が経験した場面と、そのとき考えたことを、具体的に書く', truth: 'ok', why: '具体的な場面が、現場の目を示します。' },
      { id: 'b', label: '自分が一番苦手だと思う場面を、避けずに書く', truth: 'ok', why: '苦手を知る人には、教える側が手を差し伸べられます。' },
      { id: 'c', label: '同期の誰かの失敗を引き合いに、自分の優位を書く', truth: 'ng', why: '他人の失敗は、あなたの実績ではありません。' },
      { id: 'd', label: 'お客様から頂いた声を、日付と窓口の記録の出典つきで書く', truth: 'ok', why: '出典があれば、他の人が確かめられます。' },
      { id: 'e', label: '「何でもやります」とだけ書く', truth: 'ng', why: '意欲は伝わりますが、判断材料になりません。' },
      { id: 'f', label: '勤務の希望（休みや研修の日程）の相談事項', truth: 'ok', why: '申込の時点で相談しておく方が、お互いのためです。' }]
  }, res3('ch6.fs_st_good', 'ch6.fs_st_mid', 'ch6.fs_st_bad', [ev('service', 2), set('ch6.fs_st_strong')], [ev('service', 1)], []), OF(['hoshino'], '申込書の確認'));
  go('ch6.fs_st_good', [['hoshino', '…正直、私の十年前より上手。悔しいくらい。', 'smile']], 'ch6.fs_st_choice', null, OF(['hoshino']));
  go('ch6.fs_st_mid', [['hoshino', '「何を見て、どう考えたか」を一行足して。それだけで読み手が変わる。']], 'ch6.fs_st_choice', null, OF(['hoshino']));
  go('ch6.fs_st_bad', [['hoshino', '宿題にしましょう。来週、一緒に。大丈夫、私も最初は白紙だった。']], 'ch6.fs_st_choice', null, OF(['hoshino']));
  choice('ch6.fs_st_choice', 'どの研修コースを、第一希望にしますか？', [
    opt('guide', '接遇・案内コース（お客様対応と、困っている方への支援）', 'ch6.fs_st_end', { tone: 'caring', effects: [set('ch6.st_course_guide'), ev('service', 2), sk('service', 3)] }),
    opt('safety', '安全・異常時対応コース（遅延や事故の際の判断と連携）', 'ch6.fs_st_end', { tone: 'careful', effects: [set('ch6.st_course_safety'), ev('safety', 2), sk('patrol', 3)] })
  ], { view: OF(['hoshino']) });
  go('ch6.fs_st_end', [
    ['hoshino', '承りました。研修は秋から。それまでに、持ち場をあと二つ。'],
    ['hoshino', '派手な異動じゃない。十年後に「あの人に聞こう」と言われる人になる道。', 'smile'],
    '窓の外、ホームに立つ誰かの背中が見えた。三か月前の自分も、あんなふうに緊張していた。'
  ], 'ch6.after', [set('ch6.step_station'), tl('6月25日 上級駅務の研修申込。星野さんと面談'), log('最初の一歩：上級駅務の研修申込', 'career')], OF(['hoshino']));

  // -- 車両基地：検修長の下で見習い申請（検修庫・橘）--
  line('ch6.fs_depot', [
    '朝の入出区が一段落した検修庫。機械油と、冷えた鉄の匂い。',
    ['tachibana', '駅長から連絡は受けた。見習いの申請だな。', 'normal'],
    ['tachibana', '先に言う。触らせん。見学枠の延長だ。研修日に、月二度。', 'serious'],
    ['tachibana', '推薦欄には署名する。何を書くかは、お前が決める。'],
    ['tachibana', '見せるのは「見る目」だ。線の内側から、危ないところを探せ。'],
    ['yamashina', '（少し離れた所で、背中を見ている。目が合うと小さく頷いた）']
  ], 'ch6.depot_find', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }, set('ch6.fs_depot')], view: DP(['tachibana', 'yamashina'], '6月25日（金） 10:00 青浜総合車両センター 検修庫') });
  task('ch6.depot_find', 'find', '床下の観察（見学線の内側から）', '台車まわりの絵から、危ない箇所を、線の内側から探してタップします。触らず、見るだけです。', {
    config: { scene: 'gate', seconds: 45, props: [P(0.04, 0.15, 0.28, 0.35, '#4a5568', '台車'), P(0.36, 0.15, 0.28, 0.35, '#2f5d8a', '主電動機'), P(0.68, 0.15, 0.28, 0.35, '#2f7a56', 'ブレーキ装置'), P(0.04, 0.6, 0.5, 0.25, '#8a8f96', '検査記録票'), P(0, 0.9, 1, 0.08, '#e5b800', '黄色い線')], spots: [
      { id: 'oil', x: 0.2, y: 0.38, label: '台車のばね部に、油がにじんだ跡がある（記録して検修員へ報告）' }, { id: 'bolt', x: 0.82, y: 0.3, label: 'ブレーキ装置の締結部の合マークが、ずれて見える' }, { id: 'log', x: 0.28, y: 0.72, label: '検査記録票の日付の欄が、一行、空白になっている' }, { id: 'ok', x: 0.5, y: 0.35, real: false, label: '主電動機は、異常ありません' }] }
  }, res3('ch6.dp_good', 'ch6.dp_mid', 'ch6.dp_bad', [ev('safety', 2), sk('depot', 3), set('ch6.fs_dp_strong')], [sk('depot', 1)], []), DP(['tachibana'], '床下の観察'));
  go('ch6.dp_good', [['tachibana', '…三つ。触らなかったのもいい。', 'smile'], ['tachibana', '記録票の空白に気づいたな。駅で積んだもんだ。']], 'ch6.dp_choice', null, DP(['tachibana']));
  go('ch6.dp_mid', [['tachibana', '半分か。見る目は年単位で育つ。待て。']], 'ch6.dp_choice', null, DP(['tachibana']));
  go('ch6.dp_bad', [['tachibana', '見えていないな。だが、見えていないと分かったのは収穫だ。', 'serious']], 'ch6.dp_choice', null, DP(['tachibana']));
  choice('ch6.dp_choice', '橘さんに、ひとつだけ質問できます。何を聞きますか？', [
    opt('night', '「夜勤や宿直は、実際、どのくらいありますか」', 'ch6.dp_q1', { tone: 'careful', effects: [set('ch6.dp_q_night')] }),
    opt('first', '「最初の一年で、何を任されるのでしょうか」', 'ch6.dp_q2', { tone: 'caring', effects: [set('ch6.dp_q_first')] }),
    opt('miss', '「失敗したとき、ここでは、どう報告するのですか」', 'ch6.dp_q3', { tone: 'honest', effects: [set('ch6.dp_q_miss'), ev('reporting', 1)] })
  ], { view: DP(['tachibana']) });
  go('ch6.dp_q1', [['tachibana', '月に四、五回。宿直明けは必ず休み。連続は組まん。'], ['tachibana', '眠れん日は言え。言わん方が危ない。']], 'ch6.dp_end', null, DP(['tachibana']));
  go('ch6.dp_q2', [['tachibana', '一年目は見るだけ。二年目に認定、運搬と記録の補助。触るのは三年目だ。'], ['tachibana', '長いか。電車が走り続けるための長さだ。']], 'ch6.dp_end', null, DP(['tachibana']));
  go('ch6.dp_q3', [['tachibana', '失敗はその場で言え。言い訳は後でいい。「どこを、いつ、何を」だけだ。', 'serious'], ['tachibana', '隠す奴が一番、人を危うくする。すぐ言った奴を責めた覚えはない。']], 'ch6.dp_end', [rel('tachibana', 1, 0)], DP(['tachibana']));
  go('ch6.dp_end', [
    '橘が引き出しから申請書を出した。推薦欄は空白のまま。',
    ['tachibana', '「駅で記録を残す習慣のある者」。それだけ書く。残りは半年で埋めろ。'],
    ['tachibana', '枠は2。希望は7。入ると約束はせん。だが、資格のある奴には席を空ける。'],
    ['yamashina', '（帰り際）俺も出した。同じ紙だな。', 'smile']
  ], 'ch6.after', [set('ch6.step_depot'), rel('tachibana', 1, 0), tl('6月25日 検修長に見習い（見学枠）の申請書を出す'), log('最初の一歩：基地見習い（見学枠）の申請', 'career')], DP(['tachibana', 'yamashina']));

  // -- 輸送指令：指令見学の申込（輸送指令所・浜口と関谷）--
  line('ch6.fs_dispatch', [
    'ガラス越しに、壁一面の運行表示盤。音はほとんどないのに、空気だけが張りつめている。',
    ['hamaguchi', '電話でしか名乗ってなかったな。実物はこの顔だ。', 'smile'],
    ['sekiya', '主任の関谷だ。ここで見聞きしたことは外に出さない。三十分。座らせない。', 'serious'],
    ['hamaguchi', '指令の仕事は一言で「復唱」だ。一日何百回やっても、省けない。']
  ], 'ch6.dispatch_task', { effects: [{ clock: { addDay: 1, minute: hm(10, 30) } }, set('ch6.fs_dispatch')], view: OF(['hamaguchi', 'sekiya'], '6月25日（金） 10:30 輸送指令所 見学受付') });
  task('ch6.dispatch_task', 'memory', '指令の復唱', '表示された連絡の手順を覚えて、同じ順に選んでください。指令の仕事は、順番が命です。', {
    config: { sequence: ['運転状況を確認', '指令番号を復唱', '時刻を記録', '関係箇所へ報告'], pool: ['運転状況を確認', '指令番号を復唱', '時刻を記録', '関係箇所へ報告', '見込みで先に伝える', '記録は後回し', '復唱を省く'], showMs: 5000, showLabel: '指令の連絡手順（見学用の模擬）', inputLabel: '手順を同じ順に選んでください' }
  }, res3('ch6.dc_good', 'ch6.dc_mid', 'ch6.dc_bad', [ev('reporting', 2), sk('ops', 3), set('ch6.fs_dc_strong')], [sk('ops', 1)], []), OF(['sekiya'], '指令の復唱'));
  go('ch6.dc_good', [['sekiya', '順序が崩れなかった。記録を後回しにしなかったのもいい。'], ['hamaguchi', '意味まで分かってる顔だな。']], 'ch6.dc_choice', null, OF(['sekiya', 'hamaguchi']));
  go('ch6.dc_mid', [['sekiya', '一か所、入れ替わった。実際なら、その一か所が列車を止める。']], 'ch6.dc_choice', null, OF(['sekiya']));
  go('ch6.dc_bad', [['hamaguchi', '最初は噛む。俺も半年噛んだ。'], ['sekiya', '噛むのはいい。省くのは許さん。']], 'ch6.dc_choice', null, OF(['sekiya', 'hamaguchi']));
  choice('ch6.dc_choice', '関谷主任に、どの場面の見学を、第一希望にしますか？', [
    opt('normal', '平常ダイヤの運用（時刻通りに回す仕事）の見学', 'ch6.dc_end', { tone: 'careful', effects: [set('ch6.dc_view_normal'), ev('accuracy', 1)] }),
    opt('trouble', 'ダイヤが乱れたときの対応（現場との連絡）の見学', 'ch6.dc_end', { tone: 'risky', effects: [set('ch6.dc_view_trouble'), ev('reporting', 1)] })
  ], { view: OF(['sekiya']) });
  go('ch6.dc_end', [
    ['sekiya', '乱れた場面は抽選だ。外れても文句は言うな。'],
    ['hamaguchi', '電話の向こうが慌てた声だと、こっちも慌てる。落ち着いた声なら、状況が見える。'],
    ['hamaguchi', 'お前は今日、電話の「こちら側」を見た。指令になってもならなくても役に立つ。', 'smile'],
    ['sekiya', '指令は遠い。駅で三年。そこで何を積むかが問われる。']
  ], 'ch6.after', [set('ch6.step_dispatch'), rel('hamaguchi', 1, 1), tl('6月25日 輸送指令所の見学を申込む'), log('最初の一歩：指令見学の申込', 'career')], OF(['hamaguchi', 'sekiya']));

  // -- 輸送計画：ダイヤ資料室の手伝い（本社・富樫）--
  line('ch6.fs_planning', [
    '書架の間に、赤鉛筆の削りかすが落ちている。拾うと、まだ温かかった。',
    ['togashi', '富樫です。…それ、私のです。ダイヤ資料室へようこそ。', 'smile'],
    ['togashi', '元は駅の助役補佐。現場から来る人の気持ちは、少し分かります。'],
    ['togashi', '計画は「約束を数字にする」仕事。今日は入口だけ。資料を仕分けて。']
  ], 'ch6.planning_task', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }, set('ch6.fs_planning')], view: HR(['togashi'], '6月25日（金） 10:00 本社 輸送計画課 ダイヤ資料室') });
  task('ch6.planning_task', 'sort', 'ダイヤ資料の仕分け', '資料を、「現行ダイヤ」「改正案」「会議資料」「他部署への照会」のどれに当たるかで分けます。', {
    config: { perItem: 12, bins: [{ id: 'now', label: '現行ダイヤ（運用中）' }, { id: 'draft', label: '改正案（検討中）' }, { id: 'meet', label: '会議資料' }, { id: 'ask', label: '他部署への照会' }], items: [
      { id: 'a', label: '「2027年3月改正 平日ダイヤ（確定版）」', bin: 'now', why: '確定版で、すでに運用されています。' },
      { id: 'b', label: '「秋のダイヤ改正案 第2版（朱書きあり）」', bin: 'draft', why: '検討中の案です。' },
      { id: 'c', label: '「第12回 ダイヤ調整会議 議事メモ」', bin: 'meet', why: '会議の記録です。決定事項は別に確認が必要です。' },
      { id: 'd', label: '「車両基地への入出区時刻の確認依頼（回答待ち）」', bin: 'ask', why: '他部署に回答を求めている文書です。' },
      { id: 'e', label: '「通勤時間帯の混雑集計（4月〜6月）」', bin: 'meet', why: '会議で使う根拠資料です。' },
      { id: 'f', label: '「臨時列車の運転計画案（夏季）」', bin: 'draft', why: '検討中の案で、運用前の資料です。' }] }
  }, res3('ch6.pt_good', 'ch6.pt_mid', 'ch6.pt_bad', [ev('accuracy', 2), sk('ops', 3), set('ch6.fs_pt_strong')], [sk('ops', 1)], []), HR(['togashi'], 'ダイヤ資料の仕分け'));
  go('ch6.pt_good', [['togashi', '全部、正しい箱。「版」を見てから分けましたね。それが計画の第一歩です。', 'smile']], 'ch6.pt_choice', null, HR(['togashi']));
  go('ch6.pt_mid', [['togashi', '「確定版」と「案」は、版の表記と日付で。それだけ守って。']], 'ch6.pt_choice', null, HR(['togashi']));
  go('ch6.pt_bad', [['togashi', '案を確定だと思い込むのが一番こわい間違い。次は版から読みましょう。']], 'ch6.pt_choice', null, HR(['togashi']));
  choice('ch6.pt_choice', '資料室で、次に手伝いたい仕事は？', [
    opt('count', '混雑の集計（駅の現場の数字を、表にまとめる）', 'ch6.pt_end', { tone: 'careful', effects: [set('ch6.pt_count'), ev('accuracy', 1), sk('ops', 1)] }),
    opt('minutes', '会議の議事メモの清書（決定事項と未決事項を分けて書く）', 'ch6.pt_end', { tone: 'honest', effects: [set('ch6.pt_minutes'), ev('reporting', 2)] }),
    opt('ask', '他部署への照会文の下書き（誰に何を、どう聞くか）', 'ch6.pt_end', { tone: 'caring', effects: [set('ch6.pt_ask'), ev('teamwork', 1)] })
  ], { view: HR(['togashi']) });
  go('ch6.pt_end', [
    ['togashi', '手伝いは月一度、半日。勤務に無理のない形で。'],
    ['togashi', '計画は「誰かの一日を数字で預かる」仕事。一つ違えば、ホームで誰かが待たされる。'],
    ['togashi', 'だから現場に降りるのをやめない。駅で見たものが、いつか図の一本の線になる。', 'smile'],
    '書架の向こうで、誰かが赤鉛筆を走らせる音だけが、静かに続いていた。'
  ], 'ch6.after', [set('ch6.step_planning'), tl('6月25日 ダイヤ資料室の手伝いを申込む'), log('最初の一歩：ダイヤ資料室の手伝い', 'career')], HR(['togashi']));

  // ================= 合流：同じ駅の夕方。ただし、選んだ道は消えない =================
  go('ch6.after', [
    '夕方の事務室。窓の外を、帰宅する人の流れが通り過ぎていく。',
    ['kubota', 'お帰りなさい。駅長から聞きました。', 'normal']
  ], 'ch6.af_gate', [{ clock: { minute: hm(17, 30) } }], OF(['kubota'], '17:30 駅事務室'));
  branch('ch6.af_gate', [[F('ch6.wish_depot'), 'ch6.af_depot'], [F('ch6.wish_dispatch'), 'ch6.af_dispatch'], [F('ch6.wish_planning'), 'ch6.af_planning']], 'ch6.af_station');
  go('ch6.af_station', [
    ['kubota', '駅に残る道。実は、嬉しかったです。同じ地面を歩く人が増えるので。', 'smile'],
    ['kubota', '地味ですよ。誰も大げさには褒めません。梶原さんの一言が給料です。'],
    ['kubota', '来週から持ち場を回ります。窓口だけの人から、駅を見る人へ。']
  ], 'ch6.af_yama', [rel('kubota', 1, 2)], OF(['kubota']));
  go('ch6.af_depot', [
    ['kubota', '基地。驚きません。機械の中でなく手順を見ていた人ですから。', 'smile'],
    ['kubota', '覚悟を。基地は「待つ」道です。待つあいだ、駅の仕事は減りません。'],
    ['kubota', '駅長が推薦を書くとき見るのは「いなくなったら駅が困るか」。困るくらいになって。']
  ], 'ch6.af_yama', [rel('kubota', 1, 1)], OF(['kubota']));
  go('ch6.af_dispatch', [
    ['kubota', '指令。遠い道です。三年は駅にいます。', 'normal'],
    ['kubota', 'あの旅行客の日に「確定と見込み」を分けられなかった人が、その仕事を目指す。道筋は見えます。'],
    ['kubota', 'この三年は準備じゃない。駅の電話一本一本が、指令の仕事の最初の三年です。']
  ], 'ch6.af_yama', [rel('kubota', 1, 1)], OF(['kubota']));
  go('ch6.af_planning', [
    ['kubota', '計画。券売機の記録を並べていた人が、図面を引く人になる。想像できます。', 'smile'],
    ['kubota', '二年は駅です。「数字になる前の話」を全部聞いてきて。それを知る計画は強い。'],
    ['kubota', '出典と日付。それだけ守れば、入口には立てます。']
  ], 'ch6.af_yama', [rel('kubota', 1, 1)], OF(['kubota']));

  // -- 山科との、希望のすれ違い --
  branch('ch6.af_yama', [
    [ALL(F('ch6.wish_depot'), F('ch6.told_depot')), 'ch6.yy_rival'],
    [ALL(F('ch6.wish_depot'), NF('ch6.told_depot')), 'ch6.yy_surprise'],
    [F('ch6.told_depot'), 'ch6.yy_changed']
  ], 'ch6.yy_relief');
  go('ch6.yy_rival', [
    ['yamashina', '…同じ紙、出したな。', 'normal'],
    ['yamashina', '7人中の2人。俺かお前か、落ちるかもしれない。怖いよ。'],
    ['player', '決まってない。今日から半年、同じ条件で始めよう。'],
    ['yamashina', '競争するなら、お前とがいい。互いの記録を読み合おう。', 'smile']
  ], 'ch6.fam_end', [rel('yamashina', 2, 2), set('ch6.yama_rival')], OF(['yamashina']));
  go('ch6.yy_surprise', [
    ['yamashina', '…基地、選んだのか。「別の道かも」って言ってたのに。', 'surprise'],
    ['player', '面談で聞いて、変わった。先に言えなくてごめん。'],
    ['yamashina', '…お前が別の道だと思って、勝手に安心してた。勝手な話だ。'],
    ['yamashina', '同じ道なら、負けられないな。', 'normal']
  ], 'ch6.fam_end', [rel('yamashina', 0, 1), set('ch6.yama_surprised')], OF(['yamashina']));
  go('ch6.yy_changed', [
    ['yamashina', '基地じゃなかったんだな。「私も基地を目指すかも」って言ってたのに。', 'normal'],
    ['player', '面談で変わった。先に言うべきだった。ごめん。'],
    ['yamashina', '責めてない。ほっとした。…けど、少し寂しい。同じ道を歩く奴が、いなくなった。'],
    ['yamashina', '決めたなら貫けよ。半年後、また会おう。', 'smile']
  ], 'ch6.fam_end', [rel('yamashina', 1, 1), set('ch6.yama_changed')], OF(['yamashina']));
  go('ch6.yy_relief', [
    ['yamashina', '決めたんだな。基地じゃない道。…正直ほっとしてる。嫌な言い方でごめん。', 'normal'],
    ['yamashina', '同期が違う道に行くのはいい。何年か後に、話せることが増える。'],
    ['player', '山科も、基地が取れるといい。'],
    ['yamashina', '取る。取れなくても、積んだものは残る。橘さんに教わった。', 'smile']
  ], 'ch6.fam_end', [rel('yamashina', 1, 2), set('ch6.yama_parted')], OF(['yamashina']));

  // -- 家族への一通 --
  branch('ch6.fam_end', [[F('ch6.family_open'), 'ch6.fe_open'], [F('ch6.family_promise'), 'ch6.fe_promise']], 'ch6.fe_quiet');
  go('ch6.fe_open', [
    '夜。母から短いメッセージが届いていた。',
    ['jikka', '決めたのね。どこで働いても、体だけは大事に。冬に顔を見せてね。', 'smile'],
    '返信を打つ指に、ペンのカチ、という音がよみがえった。今度は、自分で鳴らす番だ。'
  ], 'ch6.end', null, HR(['jikka'], '夜 社員寮の自室'));
  go('ch6.fe_promise', [
    '夜。勤務表のお盆の週に、休暇申請の空欄がある。',
    ['jikka', '（メッセージ）お盆、本当に帰れる？ 弟が楽しみにしてるわ。', 'smile'],
    '「お願いの仕方で」。森下宛ての休暇相談の下書きを、書きはじめた。'
  ], 'ch6.end', [set('ch6.obon_request')], HR(['jikka'], '夜 社員寮の自室'));
  go('ch6.fe_quiet', [
    '夜。母から「ちゃんと食べてる？」とだけ届いた。',
    '「今日、面談で」と打っては消し、結局「食べてる。元気」とだけ送った。窓の外で、雨が降りはじめた。'
  ], 'ch6.end', null, HR([], '夜 社員寮の自室'));

  N['ch6.end'] = { id: 'ch6.end', type: 'end', chapter: 'ch6', title: '第6章 三か月目の面談', nextChapter: 'ch7',
    summary: '三か月目の面談で、異動は「希望すれば行ける」ものではないと知った。人数、資格、評価、時間、実績の壁。それでも一つの道を選び、最初の一歩を踏み出した。選んだ道は、これから先の章を、別々の景色にしていく。',
    effects: [tl('6月25日 三か月目の面談を終える。進む道を一つ選ぶ'), log('第6章を終了', 'chapter')] };
}
