// R7 第2章「最初の週末」：月曜の勤務日（ハブ）。依頼は勤務時間に収まらず、何かを捨てる。
// 設計：docs/DESIGN_PRINCIPLES.md（選択は代償を伴う／必ず後で読む／選択直後に採点しない／沈黙も選択）。
// 重要選択 idea_choice は「相談／貼る／駅長へ直訴／見送る」の4択。どれも誰かの何かを失う。結果は午後（pm_*）と第3章冒頭で返る。
// 後の章が読むフラグ一覧：docs/analysis/handoff-ch2-3.md
export default function ch2(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tl, log, time, F, NF, ALL, ANY, T, hm, v3, v25, mini, hub, P } = k;
  const REL = (char, key, op, val) => ({ rel: { char, key, op, val } });
  const GONE = id => ({ gone: id });
  const lock = (id, note) => ({ lock: { id, note } });
  const depart = (char, note) => ({ depart: { char, note } });

  characters.uno = { id: 'uno', name: '宇野 保', kana: 'うの たもつ', role: '利用者（月曜の常連）', dept: 'none', age: 74, years: 0, uniform: '#5a5f6a', hair: '#d0d0d0', skin: '#e4c09c', trait: '毎週月曜、妻の通院に付き添う。紙の回数券を、いつも二枚買う。', bio: '券売機の画面が変わってから、買い方が分からなくなった。', gender: 'm', accessory: 'cane' };

  // ---- 週末から月曜へ ----
  N['ch2.tail'] = { id: 'ch2.tail', type: 'effect', effects: [], next: 'ch2.brief' };
  line('ch2.brief', [
    '4月5日（月）。雨上がりの朝。ホームの屋根から、水滴が規則正しく落ちている。',
    ['shiraishi', '朝礼を始める。今週は「駅の顔」だ。'],
    ['kubota', '今日の依頼は六件。八時間では、終わりません。', 'serious'],
    ['yamashina', '俺は朝のホームを取る。先に言ったもの勝ちだろ。', 'smile']
  ], 'ch2.brief_rel', {
    effects: [{ clock: { addDay: 2, minute: hm(8, 20) } }, set('ch2.brief'), tl('4月5日 勤務2週目。窓口と券売機まわりを担当'), log('第2週の朝礼。依頼は六件', 'work')],
    view: v25('office', ['shiraishi', 'kubota', 'yamashina'], '4月5日（月） 8:20 駅事務室')
  });
  // rel を読む場面①：久保田への信頼が高いと、優先順位の手がかりをくれる
  branch('ch2.brief_rel', [[REL('kubota', 'trust', '>=', 3), 'ch2.br_close']], 'ch2.br_far');
  line('ch2.br_close', [
    ['kubota', 'ベビーカーの方は十一時です。窓口は、午後に回しても間に合います。'],
    ['kubota', '捨てる順番だけ、先に決めておくと楽ですよ。', 'smile']
  ], 'ch2.hub', { view: v25('office', ['kubota']) });
  line('ch2.br_far', [['kubota', '順番は、自分で決めてください。']], 'ch2.hub', { view: v25('office', ['kubota']) });

  // ---- 月曜のハブ ----
  hub('ch2', {
    title: '青嶺中央駅 勤務（2週目・月曜）',
    timed: [{ id: 'lunch', at: hm(12, 0), goto: 'ch2.lunch' }, { id: 'close', at: hm(17, 15), goto: 'ch2.review' }],
    goals: [
      { id: 'g_idea', label: '券売機の前で気づいたことを、どう扱うか決める', when: F('ch2.idea_done') },
      { id: 'g_lunch', label: '昼休憩（12:00）', when: F('ch2.lunch_done') }
    ],
    exit: { label: '勤務を終えて面談へ（16:00以降）', requires: ALL(F('ch2.brief'), F('ch2.idea_done'), F('ch2.lunch_done'), T('>=', hm(16, 0))), goto: 'ch2.review' }
  });
  const R = F('ch2.brief');

  // 依頼の所要時間は、全部を合わせると勤務時間を超える（約510分／8:20〜16:30の490分）。捨てた依頼の代償は夕方（ch2.out）に出る。
  mini({ ch: 'ch2', key: 'patrol', req: R, who: 'kubota', object: 'tactile', from: [8, 40], to: [11, 0], label: 'コンコースの朝の巡回をする', goal: '（業務）朝のコンコース巡回', title: '朝のコンコース巡回', cam: 'follow',
    hint: '雨上がりの朝です。滑りやすい場所や、壊れている設備を探してタップします。', kind: 'find',
    intro: ['雨の日は、床が滑ります。一周、見てきてください。', '傘の水滴、足元の濡れ、案内板のずれ。目を使って。'],
    config: { scene: 'concourse', seconds: 35, props: [P(0.05, 0.1, 0.22, 0.3, '#2f5d8a', '時刻表'), P(0.4, 0.1, 0.2, 0.3, '#2f7a56', '案内板'), P(0.7, 0.1, 0.25, 0.3, '#a35c00', 'お知らせ'), P(0.1, 0.7, 0.8, 0.12, '#8a8f96', '通路')], spots: [
      { id: 'wet', x: 0.3, y: 0.76, label: '入口近くの床が濡れて滑りやすい' }, { id: 'sign', x: 0.52, y: 0.22, label: '案内板が斜めに傾いている' }, { id: 'lamp', x: 0.82, y: 0.14, label: '蛍光灯が一本切れている' }, { id: 'ok', x: 0.15, y: 0.2, real: false, label: '時刻表は正常です' }] },
    good: '全部拾えていますね。', mid: '入口の水は、先に見てください。', bad: '濡れた床は、朝いちばんです。', ge: [ev('safety', 3)], log: '雨上がりのコンコースを巡回', min: 40 });

  mini({ ch: 'ch2', key: 'rush', req: R, who: 'yamashina', object: 'emergency_btn', from: [8, 40], to: [10, 15], label: '朝のラッシュでホームの安全を見守る', goal: '（業務）朝のホーム見守り', title: '朝のホーム見守り', cam: 'follow',
    hint: '黄色い線に近づく人をタップして声をかけます。', kind: 'watch', config: { total: 10 },
    intro: ['来たか。朝のホームは、スマホを見たまま歩く人が多い。', '線に近づいたら、声。短く、はっきり。「黄色い線の内側へ」だけでいい。'],
    good: '今の声かけなら、誰も嫌な顔をしない。', mid: '何人か、線を越えさせたな。', bad: '朝は特に、危ない時間だ。', ge: [ev('safety', 4)], be: [ev('safety', -2)], log: '朝のラッシュのホームを見守り', min: 60 });

  mini({ ch: 'ch2', key: 'window', req: R, who: 'kubota', object: 'ticket_office', from: [9, 30], to: [15, 0], label: '窓口でお客様の用件をさばく', goal: '（業務）窓口の対応', title: '窓口の対応', cam: 'follow',
    hint: '用件を聞いて、正しい取扱いを選びます。', kind: 'sort',
    intro: ['窓口は、きっぷ以外の相談も来ます。', '迷ったら、「確認します」と言って私に。'],
    config: { perItem: 7, bins: [{ id: 'now', label: 'その場で対応' }, { id: 'ask', label: '先輩・規程を確認' }, { id: 'other', label: '他の窓口へ案内' }], items: [
      { id: 'a', label: '「定期券の有効期限を教えてください」', bin: 'now', why: '券面と端末で確認できる内容は、その場で答えられます。' },
      { id: 'b', label: '「去年の落とし物が出てきたか知りたい」', bin: 'other', why: '落とし物は台帳を扱う担当の窓口です。' },
      { id: 'c', label: '「障害者割引の証明書を忘れた。割引してほしい」', bin: 'ask', why: '割引は規程の確認が必要です。勝手に判断しません。' },
      { id: 'd', label: '「バスの時刻を教えて」', bin: 'other', why: 'バスはバス会社の案内になります。場所だけ案内します。' },
      { id: 'e', label: '「ICカードのチャージはどこでできる？」', bin: 'now', why: '券売機・窓口の場所を案内します。' },
      { id: 'f', label: '「友人の定期券を払い戻したい」', bin: 'ask', why: '本人以外の払い戻しは、確認が必要です。' }] },
    good: '迷ったものを、ちゃんと回せましたね。', mid: '数件、判断が違いました。', bad: '自分で決めると、後で大きくなります。', ge: [ev('service', 3), ev('accuracy', 2), sk('ticket', 3)], log: '窓口で用件を振り分け', min: 120 });

  mini({ ch: 'ch2', key: 'voice', req: R, who: 'shiraishi', object: 'terminal', from: [10, 30], to: [15, 30], label: '「お客様の声ノート」を整理する', goal: '（業務）お客様の声の整理', title: 'お客様の声ノート', cam: 'npc:shiraishi',
    hint: '先月届いた声を読んで覚え、同じ順に入力します。', kind: 'memory',
    intro: ['月に一度、お客様の声を整理して、本社に送る。', '全部は覚えなくていい。要点だけ、自分の言葉で。'],
    config: { sequence: ['券売機', '文字が小さい', '夕方', '年配の方'], pool: ['券売機', '改札', '文字が小さい', '音が大きい', '朝', '夕方', '年配の方', '学生'], showMs: 4800, showLabel: 'お客様の声（先月の最多）' },
    good: '「いつ」「誰が」まで拾えている。', mid: '大筋は合っている。', bad: 'もう一度、原文を。', log: 'お客様の声ノートを整理', min: 90 });

  mini({ ch: 'ch2', key: 'guide', req: R, who: 'kubota', object: 'elevator', from: [11, 0], to: [15, 30], label: 'ベビーカーのお客様をホームまで案内する', goal: '（依頼）ベビーカーのお客様の案内', title: 'ベビーカーの案内経路', cam: 'follow',
    hint: '起点から着点まで、階段（黒）を避け、案内所（I）に立ち寄って行き先を確認する経路をつなぎます。', kind: 'route',
    intro: ['ベビーカーの方が、ホームの先頭車両のあたりへ行きたいそうです。', 'まず案内所で乗り場を確認して、それからエレベーターへ。'],
    config: { grid: ['S...#....', '.##.#.##.', '..I...~.G', '.#####.#.', '.........'], must: ['I'], best: 0, legend: { '#': '階段・壁（通れない）', '~': '混雑した通路（遅い）', I: '案内所（立ち寄る）', S: '起点', G: 'ホーム' } },
    good: '無理のない道でした。', mid: '着きましたが、少し遠回りでした。', bad: '案内所を挟まないと、行き先を間違えます。', ge: [ev('service', 3), ev('safety', 1)], log: 'ベビーカーのお客様を案内', min: 60 });

  mini({ ch: 'ch2', key: 'coins', req: R, who: 'sakai', object: 'vend2', from: [13, 30], to: [16, 0], label: '売店の両替用の釣銭を準備する', goal: '（頼まれごと）売店の釣銭の準備', title: '釣銭の準備', cam: 'follow',
    hint: '動くゲージが緑の範囲に入った瞬間にボタンを押して、硬貨を巻きます。', kind: 'timing',
    intro: ['今日は雨だから、傘を買って千円札を崩す人が多いの。', '手伝ってくれる？ あの機械、慣れないと難しくてね。'],
    config: { rounds: [{ label: '百円' }, { label: '五十円' }, { label: '十円' }], width: 0.15, speed: 0.85, button: '巻く！' },
    good: 'すごいわね、新人さんなのに。', mid: 'ちょっと崩れたけど、使えるわ。', bad: '難しかったわね。やり直せば大丈夫。', log: '売店の釣銭を準備', min: 45 });

  // =====================================================================
  // 券売機の前の気づき（重要選択）：どれを選んでも、誰かの何かを失う
  // =====================================================================
  N['ch2.hub'].interactions.push({ id: 'idea', object: 'vend2', label: '券売機の前で、迷っている方の様子を見る', goto: 'ch2.idea_1', requires: ALL(R, T('>=', hm(9, 50))), once: true, icon: '👀' });
  line('ch2.idea_1', [
    '券売機の前で、年配の男性が立ち止まっている。指が、画面の同じ場所を三度なぞった。',
    '後ろに二人。誰も、何も言わない。',
    ['uno', '……先週は、ここにあったんだが。'],
    ['kubota', '（小声で）先週、画面が変わりました。宇野さん。毎週月曜、奥様の通院に付き添って、紙の回数券を買う方です。'],
    ['kubota', '本社には二度、上げています。返事は、まだ。'],
    ['kubota', '{player}さんなら、どうしますか。']
  ], 'ch2.idea_choice', { view: v3('npc:vend2', '券売機2号機') });
  choice('ch2.idea_choice', '宇野さんの後ろに、列ができはじめている。', [
    opt('consult', '久保田と、提案書を書く。午後が、それでつぶれる', 'ch2.idea_c', { tone: 'careful', effects: [set('ch2.idea_consult'), rel('kubota', 1, 1)] }),
    opt('selfpost', '手書きの案内を作って、今すぐ券売機の横に貼る', 'ch2.idea_s', { tone: 'risky', effects: [set('ch2.idea_selfpost')] }),
    opt('boss', '駅長に直接話す。久保田を通さず、今日のうちに許可を取る', 'ch2.idea_b', { tone: 'quick', effects: [set('ch2.idea_boss'), rel('kubota', -1, 0)] }),
    opt('skip', '今は列を流すのが先。宇野さんを窓口へ案内する', 'ch2.idea_k', { tone: 'neutral', effects: [set('ch2.idea_skip')] })
  ], { important: true, view: v3('npc:vend2', '券売機2号機') });

  // 相談：確かだが遅い。午後がつぶれ、宇野さんは今日も迷う
  line('ch2.idea_c', [
    ['kubota', '……ありがとうございます。まず、見たことを数えましょう。'],
    ['kubota', '何を見て、何回あったか。「分かりにくい」だけでは、本社は動けません。'],
    '午後は、これでつぶれる。窓口の山は、手つかずのまま。'
  ], 'ch2.proposal_task', { view: v25('office', ['kubota'], '駅事務室 改善提案') });
  N['ch2.proposal_task'] = { id: 'ch2.proposal_task', type: 'task', kind: 'compose', title: '改善提案書の作成', intro: '観察した事実と、小さく試せる提案、確認の方法を組み立てます。',
    slots: [
      { id: 'fact', label: '観察した事実', options: [{ id: 'f1', text: '午前中に、年配のお客様が券売機で回数券を探して迷う場面を3回見ました。', good: true, why: '回数と場面が書かれた事実です。' }, { id: 'f2', text: 'お客様はみんな機械が苦手なようです。', good: false, why: '推測や決めつけで、根拠がありません。' }, { id: 'f3', text: '券売機の画面は、とても使いにくいです。', good: false, why: '感想であり、何が問題か分かりません。' }] },
      { id: 'plan', label: '提案', options: [{ id: 'p1', text: '券売機の横に、大きな文字の案内表示を1週間だけ試しに掲示させてください。', good: true, why: '小さく、期間を区切って、許可を求めています。' }, { id: 'p2', text: '画面を全部作り直してください。', good: false, why: '現場だけでは決められず、現実的ではありません。' }, { id: 'p3', text: '私の判断で、すぐ貼ります。', good: false, why: '許可を取らずに掲示するのは、決まりに反します。' }] },
      { id: 'check', label: '効果の確かめ方', options: [{ id: 'c1', text: '掲示の前後で、お客様が迷う場面の回数を数えて比べます。', good: true, why: '数字で効果を確認できます。' }, { id: 'c2', text: '雰囲気が良くなったか感じてみます。', good: false, why: '感覚だけでは確認になりません。' }, { id: 'c3', text: '特に確認はしません。', good: false, why: '確認しないと、改善か分かりません。' }] }
    ],
    results: [{ min: 66, goto: 'ch2.proposal_good', effects: [ev('accuracy', 2), set('ch2.proposal_good'), time(45)] }, { min: 34, goto: 'ch2.proposal_mid', effects: [time(45)] }, { min: 0, goto: 'ch2.proposal_bad', effects: [time(45)] }], view: v25('office', ['kubota'], '駅事務室 改善提案') };
  line('ch2.proposal_good', [['kubota', '数字が入っています。このまま、本社に回します。']], 'ch2.idea_c_end', { effects: [rel('kubota', 1, 1), tl('4月5日 券売機の案内表示について、改善提案書をまとめた')], view: v25('office', ['kubota']) });
  line('ch2.proposal_mid', [['kubota', '根拠を一行、足して出します。']], 'ch2.idea_c_end', { view: v25('office', ['kubota']) });
  line('ch2.proposal_bad', [['kubota', '……夕方、もう一度やりましょう。今日の分は、私が持ちます。']], 'ch2.idea_c_end', { effects: [rel('kubota', 0, 1)], view: v25('office', ['kubota']) });

  line('ch2.idea_c_end', ['提案書は、封筒に入った。窓口の山は、久保田が一人で崩している。'], 'ch2.idea_done', { view: v25('office', ['kubota']) });

  // 貼る：すぐ効く。ただし、効いたことと、誰かが払うことは別
  line('ch2.idea_s', [
    'コピー用紙に、大きく書いた。「回数券は ここ →」。テープで、券売機の横に貼る。',
    '宇野さんは、矢印の通りに指を動かした。ボタンが押され、紙の券が二枚、出てきた。',
    ['uno', 'ああ、これだ。……ありがとう。'],
    '久保田は、窓口で電話に出ていた。こちらは、見ていない。'
  ], 'ch2.idea_done', { effects: [time(10)], view: v3('npc:vend2', '券売機2号機') });

  // 直訴：許可は今日出る。久保田は、最後に知る
  line('ch2.idea_b', [
    '駅事務室。白石は、書類から顔を上げなかった。',
    ['player', '券売機の画面が変わって、迷う方が出ています。今日、案内を貼る許可をください。'],
    ['shiraishi', '久保田は、知っているのか。'],
    ['player', '……いえ。まだ話していません。'],
    ['shiraishi', '許可は出す。印刷は事務員に頼め。久保田には、私から話す。'],
    '判が、ひとつ押された。'
  ], 'ch2.idea_done', { effects: [time(25)], view: v25('office', ['shiraishi'], '駅事務室') });

  // 見送る：列は流れる。宇野さんは、また来る
  line('ch2.idea_k', [
    ['player', '（今は、列を流すのが先だ）'],
    '宇野さんを、窓口へ案内した。久保田が、笑顔で応じている。',
    ['kubota', '……そうですか。分かりました。'],
    '券売機の前の列が、一人ずつ、ほどけていく。'
  ], 'ch2.idea_done', { effects: [time(5)], view: v3('npc:kubota', '窓口前') });
  fx('ch2.idea_done', [set('ch2.idea_done'), { var: { key: 'ch2.extra', add: 1 } }, log('券売機の前の男性について、対応を決める', 'work')], 'ch2.pm_gate');

  // =====================================================================
  // 昼休憩（時限選択）：座れる席は一つ。何も選ばなければ、一人で食べる
  // =====================================================================
  const LV = who => v25('hr', who, '昼休憩 休憩室');
  line('ch2.lunch', [
    '12時。休憩室の窓から、薄い日が差している。',
    '久保田の隣が空いている。山科が、こちらに手を挙げた。駅長は、茶を淹れている。'
  ], 'ch2.lunch_choice', { view: LV(['kubota', 'yamashina', 'shiraishi']) });
  choice('ch2.lunch_choice', 'トレイを持ったまま、立っている。', [
    opt('kubota', '久保田の隣に座る', 'ch2.lunch_k', { tone: 'careful', effects: [rel('kubota', 1, 1), rel('yamashina', 0, -1), set('ch2.lunch_kubota')] }),
    opt('yamashina', '山科の向かいに座る', 'ch2.lunch_y', { tone: 'caring', effects: [rel('yamashina', 1, 2), rel('kubota', 0, -1), set('ch2.lunch_yamashina')] }),
    opt('shiraishi', '駅長の隣に座る', 'ch2.lunch_s', { tone: 'caring', effects: [rel('shiraishi', 2, 1), rel('yamashina', 0, -1), set('ch2.shiraishi_motto')] }),
    opt('alone', '誰にも声をかけず、隅の席で食べる', 'ch2.lunch_a', { effects: [set('ch2.lunch_alone')] })
  ], { timeLimit: 15, defaultOption: 'alone', who: 'kubota', view: LV(['kubota', 'yamashina', 'shiraishi']) });
  line('ch2.lunch_k', [
    ['kubota', '朝のホーム、どうでした。最初の一人に声をかけるのは、勇気がいる。'],
    ['player', '一番緊張しました。でも、意外と普通に聞いてくれて。'],
    ['kubota', '怒られたのは、五年で二回です。一回目は、私が悪かった。'],
    ['kubota', '二回目は、虫の居所の悪い方でした。……どっちか、自分では分からないのが、困りますけど。', 'smile'],
    '向こうの席で、山科が一人で、パンの袋を開けている。'
  ], 'ch2.lunch_end', { view: LV(['kubota']) });
  line('ch2.lunch_y', [
    ['yamashina', '朝のホーム、見てたか。最初の一声まで、五分固まってた。', 'smile'],
    ['player', '全然そう見えなかった。'],
    ['yamashina', '顔に出さないのだけは、得意なんだ。……基地入門研修の公募、駅から推薦は一名だけだ。俺は、出す。'],
    ['yamashina', '書類が一行も書けてないのは、内緒な。'],
    '久保田は、窓際でお茶を飲んでいた。こちらは、見なかった。'
  ], 'ch2.lunch_end', { effects: [set('ch2.yama_confided')], view: LV(['yamashina']) });
  line('ch2.lunch_s', [
    ['shiraishi', '珍しいね。若い人は、私の隣には座らない。', 'smile'],
    ['shiraishi', '初代の駅長は、毎朝、改札の外に立って挨拶していた。「駅の顔は、立っている人の顔だ」と。'],
    ['shiraishi', '{player}、今日、誰かの顔を覚えたか。'],
    ['player', '券売機で迷っていた、年配の男性の顔を。'],
    ['shiraishi', '……そうか。']
  ], 'ch2.lunch_end', { view: LV(['shiraishi']) });
  line('ch2.lunch_a', [
    'トレイを持ったまま、動けなかった。結局、隅の席で、弁当を開けた。',
    '誰も、何も言わない。味噌汁だけが、先に冷めた。',
    ['sakai', '（売店の窓から）あら、お昼、一人？ ……いいのよ。あたしも十年、そうだったもの。', 'smile']
  ], 'ch2.lunch_end', { effects: [rel('sakai', 0, 1)], view: LV(['sakai']) });
  fx('ch2.lunch_end', [set('ch2.lunch_done'), time(45), log('昼休憩', 'work')], 'ch2.pm_gate');

  // =====================================================================
  // 午後：朝の選択の結果が、別の形で返る（昼と券売機の対応が済んだ後に1回だけ）
  // =====================================================================
  branch('ch2.pm_gate', [[ALL(F('ch2.idea_done'), F('ch2.lunch_done'), NF('ch2.pm_done')), 'ch2.pm']], 'ch2.hub');
  branch('ch2.pm', [[F('ch2.idea_selfpost'), 'ch2.pm_self'], [F('ch2.idea_boss'), 'ch2.pm_boss'], [F('ch2.idea_consult'), 'ch2.pm_cons']], 'ch2.pm_skip');
  fx('ch2.pm_end', [set('ch2.pm_done')], 'ch2.hub');

  // 貼った：貼り紙の矢印が、一号機を指していなかった
  line('ch2.pm_self', [
    '午後。貼り紙は、午前じゅう効いていた。',
    '三十分前、久保田が駅長室から戻ってきた。貼り紙の矢印は二号機を指していた。回数券が出るのは、一号機だった。',
    '誤った券で払い戻しになった客が、二人。',
    ['kubota', '駅長には、指導の責任は私にある、と言いました。'],
    '久保田は、こちらを見ない。書類を揃える手だけが、少し速い。'
  ], 'ch2.pm_self_c', { view: v25('office', ['kubota'], '午後 駅事務室') });
  choice('ch2.pm_self_c', '久保田は、書類を揃え続けている。', [
    opt('own', '「私が貼りました。駅長に、話してきます」', 'ch2.ps_own', { tone: 'honest', effects: [set('ch2.owned_up'), rel('kubota', 2, 1), rel('shiraishi', -1, 0)] }),
    opt('repair', '「払い戻しの二人に、電話をかけます」', 'ch2.ps_rep', { tone: 'caring', effects: [set('ch2.repaired'), rel('kubota', 1, 0), time(30)] }),
    opt('defend', '「貼り紙で、宇野さんは買えました」', 'ch2.ps_def', { tone: 'risky', effects: [set('ch2.defended'), rel('kubota', -1, 0)] }),
    opt('silent', '……何も言わない', 'ch2.ps_sil', { effects: [set('ch2.kubota_covered'), rel('kubota', -2, -1)] })
  ], { important: true, timeLimit: 15, defaultOption: 'silent', who: 'kubota', view: v25('office', ['kubota']) });
  line('ch2.ps_own', [
    '駅長室のドアは、ノックの前に開いていた。',
    ['shiraishi', '……久保田から、聞いている。座れ。']
  ], 'ch2.ps_own_b', { view: v25('office', ['shiraishi'], '駅長室') });
  // rel を読む場面：駅長への信頼が高いと、叱責ではなく問いが返る
  branch('ch2.ps_own_b', [[REL('shiraishi', 'trust', '>=', 3), 'ch2.ps_own_g']], 'ch2.ps_own_s');
  line('ch2.ps_own_g', [['shiraishi', '貼る前に、なぜ私のところへ来なかった。'], ['player', '……来ると、間に合わない気がしました。'], ['shiraishi', '間に合わなかったのは、矢印だ。']], 'ch2.ps_own_e', { view: v25('office', ['shiraishi']) });
  line('ch2.ps_own_s', [['shiraishi', '貼り紙は、剥がした。次からは、貼る前に私のところへ来い。']], 'ch2.ps_own_e', { effects: [ev('safety', -1)], view: v25('office', ['shiraishi']) });
  line('ch2.ps_own_e', ['部屋を出ると、久保田が廊下に立っていた。何も言わず、小さく頭を下げた。'], 'ch2.pm_end', { view: v25('office', ['kubota']) });
  line('ch2.ps_rep', [
    '電話は、二件。一人は笑って許してくれた。もう一人は、三分、黙ってから「分かりました」と言った。',
    '受話器を置くと、久保田の手が止まっていた。',
    ['kubota', '……ありがとうございます。', 'normal'],
    '駅長への報告は、久保田の名前のまま残った。'
  ], 'ch2.pm_end', { view: v25('office', ['kubota']) });
  line('ch2.ps_def', [
    ['kubota', '知っています。見ていました。'],
    ['kubota', '払い戻しの二人の連絡先です。お願いします。'],
    '紙を渡す指が、一度も触れなかった。'
  ], 'ch2.pm_end', { effects: [time(30)], view: v25('office', ['kubota']) });
  line('ch2.ps_sil', [
    '何か言おうとした。言葉が、先に消えた。',
    ['kubota', '……何でもありません。', 'normal'],
    '久保田は、貼り紙の件を、最後まで一人で持った。'
  ], 'ch2.pm_end', { view: v25('office', ['kubota']) });

  // 直訴：許可証つきの案内が貼られた。久保田の顔
  line('ch2.pm_boss', [
    '午後。券売機の横に、印刷された案内が貼られた。隅に、駅長の判が押してある。',
    ['uno', 'ああ、これだ。……読みやすいね。'],
    '久保田が、貼り紙の前で足を止めた。'
  ], 'ch2.pm_boss_b', { view: v3('npc:vend2', '券売機2号機') });
  // rel を読む場面②：信頼が高いほど、久保田は本音を一言だけ言う
  branch('ch2.pm_boss_b', [[REL('kubota', 'trust', '>=', 3), 'ch2.pb_close']], 'ch2.pb_far');
  line('ch2.pb_close', [['kubota', '駅長から聞きました。……一言、ほしかったです。'], '貼り紙を、指先で、少しだけ直した。'], 'ch2.pm_end', { effects: [set('ch2.kubota_hurt')], view: v3('npc:kubota', '券売機2号機') });
  line('ch2.pb_far', [['kubota', 'そうですか。'], '久保田は、それ以上、何も言わなかった。'], 'ch2.pm_end', { effects: [set('ch2.kubota_hurt')], view: v3('npc:kubota', '券売機2号機') });

  // 相談：提案書は本社へ。宇野さんは、まだ迷う
  line('ch2.pm_cons', ['午後。提案書は、本社の受付に預けられた。'], 'ch2.pm_cons_b', { view: v25('office', ['kubota'], '午後 駅事務室') });
  branch('ch2.pm_cons_b', [[F('ch2.voice_done'), 'ch2.pc_fast']], 'ch2.pc_slow');
  line('ch2.pc_fast', [['kubota', '先月の「お客様の声」の数字を、添えました。返事は、一週間後です。']], 'ch2.pc_uno', { effects: [set('ch2.proposal_fast')], view: v25('office', ['kubota']) });
  line('ch2.pc_slow', [['kubota', '返事は、三週間後です。それまでは、今のままです。']], 'ch2.pc_uno', { view: v25('office', ['kubota']) });
  line('ch2.pc_uno', [
    '十四時半。宇野さんが、また券売機の前に立った。帰りの切符だ。',
    ['uno', '……先週は、ここにあったんだが。'],
    '二人で、画面を三つ戻って、回数券を見つけた。振り向くと、列は五人になっていた。',
    ['uno', 'まだ、変わってないね。']
  ], 'ch2.pm_end', { effects: [time(15)], view: v3('npc:vend2', '券売機2号機') });

  // 見送った：宇野さんは、窓口へ戻ってくる
  line('ch2.pm_skip', [
    '十四時半。宇野さんが、窓口の前に立った。券売機の列に並ぶのを、やめたらしい。',
    ['uno', '帰りの切符を。回数券を、二枚。'],
    '回数券は、券売機でしか出ない。窓口の前には、四人が並んでいる。'
  ], 'ch2.pm_skip_c', { view: v3('npc:kubota', '窓口前') });
  choice('ch2.pm_skip_c', '宇野さんが、こちらを見ている。', [
    opt('walk', '窓口を離れて、宇野さんを券売機へ連れていく', 'ch2.psk_walk', { tone: 'caring', effects: [set('ch2.uno_helped'), time(20)] }),
    opt('ask', '久保田に、窓口を頼む', 'ch2.psk_ask', { tone: 'careful', requires: REL('kubota', 'trust', '>=', 2), effects: [set('ch2.uno_helped'), rel('kubota', 0, 1), time(15)] }),
    opt('hold', '「少しお待ちください」と言って、窓口の列を先にさばく', 'ch2.psk_hold', { tone: 'careful', effects: [set('ch2.uno_left'), depart('uno', '4月5日 宇野さんは、この駅の券売機を使わなくなった')] }),
    opt('silent', '……何も言わない', 'ch2.psk_sil', { effects: [set('ch2.uno_left'), depart('uno', '4月5日 宇野さんは、この駅の券売機を使わなくなった')] })
  ], { important: true, timeLimit: 15, defaultOption: 'silent', who: 'uno', view: v3('npc:kubota', '窓口前') });
  line('ch2.psk_walk', [
    '券売機の前で、一緒に画面を三つ戻った。回数券が、二枚出た。',
    ['uno', 'ありがとう。……来週も、月曜に来るよ。']
  ], 'ch2.psk_walk_b', { view: v3('npc:vend2', '券売機2号機') });
  branch('ch2.psk_walk_b', [[REL('kubota', 'trust', '>=', 2), 'ch2.psk_w_k']], 'ch2.psk_w_n');
  line('ch2.psk_w_k', ['窓口に戻ると、久保田が、四人を一人でさばき終えていた。', ['kubota', '……行って正解でした。次は、先に目で合図をください。']], 'ch2.psk_w_e', { view: v3('npc:kubota', '窓口前') });
  line('ch2.psk_w_n', ['窓口に戻ると、列の最後の一人は、いなくなっていた。電車を、一本、見送ったらしい。'], 'ch2.psk_w_e', { view: v3('npc:kubota', '窓口前') });
  line('ch2.psk_w_e', ['窓口の椅子に座ると、膝の上で、手が少し震えていた。'], 'ch2.pm_end', { view: v3('npc:kubota', '窓口前') });
  line('ch2.psk_ask', [
    ['kubota', '行ってください。窓口は、持ちます。'],
    '券売機の前で、回数券が二枚、出た。',
    ['uno', 'ありがとう。……来週も、月曜に来るよ。'],
    '久保田は、昼を食べ損ねた顔で、最後の客を見送っていた。'
  ], 'ch2.pm_end', { view: v3('npc:vend2', '券売機2号機') });
  line('ch2.psk_hold', [
    '窓口の列を、四人、さばいた。十二分かかった。',
    '顔を上げると、宇野さんの姿は、もうなかった。',
    '券売機の前に、使われなかった整理券が一枚、落ちていた。'
  ], 'ch2.pm_end', { view: v3('npc:kubota', '窓口前') });
  line('ch2.psk_sil', [
    '何も言えないうちに、宇野さんは、一度だけ頷いた。',
    ['uno', '……もういい。タクシーにする。'],
    '杖の音が、改札の外へ遠ざかっていった。'
  ], 'ch2.pm_end', { view: v3('npc:kubota', '窓口前') });

  // =====================================================================
  // 週次面談：評価ではなく、事実の確認
  // =====================================================================
  line('ch2.review', [
    '16時30分。駅事務室。白石が、来週の勤務表を、机の上でこちらへ向けた。'
  ], 'ch2.review_b', { view: v25('office', ['shiraishi', 'kubota'], '16:30 駅事務室 週次面談'), effects: [{ clock: { minute: hm(16, 30) } }] });
  branch('ch2.review_b', [[F('ch2.idea_selfpost'), 'ch2.rv_s'], [F('ch2.idea_boss'), 'ch2.rv_b'], [F('ch2.idea_consult'), 'ch2.rv_c'], [F('ch2.idea_skip'), 'ch2.rv_k']], 'ch2.rv_rel');
  line('ch2.rv_s', [['shiraishi', '貼り紙は、剥がしておいた。矢印が一か所、違っていた。'], ['shiraishi', '宇野さんの件は、私も気になっていた。出し直すなら、来週だ。']], 'ch2.rv_rel', { view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.rv_b', [['shiraishi', '券売機の件、早かったな。'], ['shiraishi', '久保田は、何も言わなかった。それが、気になっている。']], 'ch2.rv_rel', { view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.rv_c', [['shiraishi', '提案書は、受け取った。']], 'ch2.rv_c_b', { view: v25('office', ['shiraishi', 'kubota']) });
  branch('ch2.rv_c_b', [[F('ch2.proposal_good'), 'ch2.rv_c_ok']], 'ch2.rv_rel');
  fx('ch2.rv_c_ok', [set('ch2.proposal_sent'), tl('4月5日 改善提案書が、本社へ回る')], 'ch2.rv_rel');
  line('ch2.rv_k', [['shiraishi', '今日は、券売機の件には触れなかったそうだな。'], ['shiraishi', '触れない日も、ある。']], 'ch2.rv_rel', { view: v25('office', ['shiraishi', 'kubota']) });
  // rel を読む場面③：駅長への信頼が高いと、来週の杉浦の話を先に聞ける
  branch('ch2.rv_rel', [[REL('shiraishi', 'trust', '>=', 3), 'ch2.rv_t']], 'ch2.rv_choice');
  line('ch2.rv_t', [
    ['shiraishi', '来週の早番は、杉浦助役だ。無口だが、悪い人ではない。'],
    ['shiraishi', '二十五年、早番に立っている。……鍵束を、誰にも預けたことがない。']
  ], 'ch2.rv_choice', { effects: [set('ch2.knows_key_story')], view: v25('office', ['shiraishi']) });

  // 来週の研修枠は一つだけ。選ばなかった枠は、この四半期は戻らない
  choice('ch2.rv_choice', '来週の研修枠は、一つしか空いていない。', [
    opt('service', '接客の稽古。声かけと、お客様の話の聞き方', 'ch2.closing', { tone: 'caring', effects: [set('next.focus_service'), lock('slot_accuracy', '来週の研修枠：「確認の稽古」は、この四半期、空きがない'), lock('slot_team', '来週の研修枠：「連携の稽古」は、この四半期、空きがない')] }),
    opt('accuracy', '確認の稽古。指差しと、二重確認の型', 'ch2.closing', { tone: 'careful', effects: [set('next.focus_accuracy'), lock('slot_service', '来週の研修枠：「接客の稽古」は、この四半期、空きがない'), lock('slot_team', '来週の研修枠：「連携の稽古」は、この四半期、空きがない')] }),
    opt('team', '連携の稽古。先輩への相談と、引継ぎのしかた', 'ch2.rv_t1', { tone: 'caring', effects: [set('next.focus_team'), lock('slot_service', '来週の研修枠：「接客の稽古」は、この四半期、空きがない'), lock('slot_accuracy', '来週の研修枠：「確認の稽古」は、この四半期、空きがない')] })
  ], { important: true, view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.rv_t1', [['shiraishi', '連携は、一人では稽古にならん。山科と組め。'], ['yamashina', '（入口から）……俺か。']], 'ch2.rv_tb', { view: v25('office', ['shiraishi', 'yamashina']) });
  branch('ch2.rv_tb', [[REL('yamashina', 'rapport', '>=', 2), 'ch2.rv_ty']], 'ch2.rv_tn');
  line('ch2.rv_ty', [['yamashina', '分かった。来週の昼は、俺が席を取る。'], '山科は、目を合わせずに言った。'], 'ch2.rv_te', { view: v25('office', ['yamashina']) });
  line('ch2.rv_tn', [['yamashina', '……分かりました。'], '山科の返事は、半分、駅長に向いていた。'], 'ch2.rv_te', { view: v25('office', ['yamashina']) });
  line('ch2.rv_te', [['kubota', '組む相手が決まると、相談の仕方も決まります。']], 'ch2.closing', { view: v25('office', ['kubota']) });
  line('ch2.closing', [
    ['shiraishi', '再来週に、初めての早番が入る。五時半の始業だ。'],
    ['kubota', '前の晩は、いつもより一時間早く寝てください。私は、それを三年かけて覚えました。', 'smile']
  ], 'ch2.out', { view: v25('office', ['shiraishi', 'kubota'], '17:30 駅事務室') });

  // =====================================================================
  // 夕方：捨てた依頼の代償と、昼と午後の余韻（読み場面の連鎖）
  // =====================================================================
  branch('ch2.out', [[NF('ch2.patrol_done'), 'ch2.o_patrol']], 'ch2.out2');
  line('ch2.o_patrol', ['入口の傘立ての前で、女性が足を取られた。買い物袋が、濡れた床に広がった。', '久保田が、黙ってしゃがんで、拾っている。'], 'ch2.out2', { effects: [rel('kubota', -1, 0)], view: v3('npc:kubota', '入口') });
  branch('ch2.out2', [[NF('ch2.coins_done'), 'ch2.o_coins']], 'ch2.out3');
  line('ch2.o_coins', [['sakai', '千円札を崩せなくて、お客さんに頭を下げたの。……いいのよ、新人さんは忙しいもの。'], '売店のシャッターは、いつもより少し早く降りた。'], 'ch2.out3', { effects: [rel('sakai', -1, -1)], view: v25('office', ['sakai'], '17:40 売店前') });
  branch('ch2.out3', [[NF('ch2.guide_done'), 'ch2.o_guide']], 'ch2.out4');
  line('ch2.o_guide', ['ベビーカーの母親は、結局、久保田が案内した。', ['kubota', '……いいんです。行き先は、合っていましたから。', 'normal']], 'ch2.out4', { effects: [rel('kubota', -1, 0)], view: v25('office', ['kubota']) });
  branch('ch2.out4', [[ANY(GONE('uno'), F('ch2.uno_left')), 'ch2.o_gone'], [F('ch2.uno_helped'), 'ch2.o_uhelp']], 'ch2.out5');
  line('ch2.o_gone', ['券売機の前に、宇野さんはいない。来週の月曜も、たぶん。', '画面の「回数券」のボタンは、今日も、同じ場所にある。'], 'ch2.out5', { view: v3('npc:vend2', '券売機2号機') });
  line('ch2.o_uhelp', ['帰り際、宇野さんは、改札の外で帽子を軽く上げた。'], 'ch2.out5', { view: v3('npc:vend2', '改札前') });
  // rel を読む場面④：山科との距離が近いと、帰りに待っている
  branch('ch2.out5', [[REL('yamashina', 'rapport', '>=', 3), 'ch2.o_yama'], [F('ch2.lunch_alone'), 'ch2.o_alone']], 'ch2.after');
  line('ch2.o_yama', [['yamashina', '来週の早番の前の晩、電話するかもしれない。出なくていい。……いや、出てくれ。'], '先に歩いていく背中が、少しだけ、急いでいた。'], 'ch2.after', { effects: [set('ch2.yama_will_call')], view: v25('office', ['yamashina'], '17:50 通用口') });
  line('ch2.o_alone', ['通用口で、靴紐を結び直した。今日、昼に話した人の顔を、思い出せなかった。'], 'ch2.after', { view: v25('office', [], '17:50 通用口') });
  branch('ch2.after', [[F('legacy.depot_tour'), 'ch2.depot']], 'ch2.end');

  // 週末の基地見学（第1章で山科の誘いを受けた場合）：4月10日
  line('ch2.depot', [
    '4月10日（土）。青浜総合車両センターの見学会。整然と並ぶ留置線の向こうで、検修庫のシャッターが開いている。',
    ['yamashina', 'この床下機器、図面で見るのと全然違うな……。', 'smile'],
    ['yamashina', '駅の仕事を覚えるのが先なのは、分かってる。でも、ここで働きたいのは、本物だ。'],
    ['player', '来週の早番も、がんばろう。お互いに。'],
    ['yamashina', 'ああ。']
  ], 'ch2.end', { effects: [set('next.depot_seed'), set('ch2.saw_depot'), rel('yamashina', 1, 1), tl('4月10日 青浜総合車両センターの見学会に参加')], view: v25('depot', ['yamashina'], '4月10日（土） 青浜総合車両センター') });

  N['ch2.end'] = { id: 'ch2.end', type: 'end', chapter: 'ch2', title: '第2章 最初の週末', nextChapter: 'ch3',
    summary: '勤務2週目の月曜が終わった。券売機の前の男性に、何をしたか。何を、しなかったか。誰の隣で昼を食べ、何を捨てたか。選ばなかった道は、戻らない。',
    effects: [tl('4月5日 勤務2週目の月曜を終える'), log('第2章を終了', 'chapter')] };
}
