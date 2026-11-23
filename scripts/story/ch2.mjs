// R7 第2章「最初の週末」：週末 → 月曜の勤務日（ハブ）→ 改善提案をめぐる意見の衝突（重要選択）→ 昼休憩（2D）→ 評価面談。
// 他の章ファイルの手本。共通キット k から必要なものだけ取り出して使う。
export default function ch2(k) {
  const { N, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, time, F, NF, ALL, T, hm, v3, v25, mini, hub, P, res3 } = k;

  // ---- 週末から月曜へ ----
  N['ch2.tail'] = { id: 'ch2.tail', type: 'effect', effects: [], next: 'ch2.brief' };
  line('ch2.brief', [
    '4月5日（月）。春の雨上がりの朝。ホームの屋根から落ちる水滴が、規則正しい音を立てている。',
    ['shiraishi', '朝礼を始める。今週のテーマは「駅の顔」だ。駅員の仕事は、改札に立っているだけではない。迷っている人に最初に気づくのが、私たちの仕事だ。'],
    ['kubota', '今日は、窓口と券売機の周りを中心に動いてもらいます。時間が空いたら、気づいたことをメモしてください。後で聞きます。'],
    ['yamashina', '俺は朝のラッシュのホーム見守りか。よし、任せてくれ。', 'smile'],
    ['shiraishi', '先週は、慌ただしかったと思う。今週は、慣れてきたところに落とし穴がある。「分かったつもり」を、一つずつ疑いなさい。']
  ], 'ch2.hub', {
    effects: [{ clock: { addDay: 2, minute: hm(8, 20) } }, set('ch2.brief'), tl('4月5日 勤務2週目。窓口と券売機まわりを担当'), log('第2週の朝礼。テーマは「駅の顔」', 'work')],
    view: v25('office', ['shiraishi', 'kubota', 'yamashina'], '4月5日（月） 8:20 駅事務室')
  });

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

  mini({ ch: 'ch2', key: 'patrol', req: R, who: 'kubota', object: 'tactile', from: [8, 40], to: [11, 0], label: 'コンコースの朝の巡回をする', goal: '（業務）朝のコンコース巡回', title: '朝のコンコース巡回', cam: 'follow',
    hint: '雨上がりの朝です。滑りやすい場所や、壊れている設備を探してタップします。', kind: 'find',
    intro: ['雨の日は、床が滑りやすくなります。始発から一番人が通る前に、一周見ておきましょう。', '傘の水滴、足元の濡れ、案内板のずれ。目を使ってください。'],
    config: { scene: 'concourse', seconds: 35, props: [P(0.05, 0.1, 0.22, 0.3, '#2f5d8a', '時刻表'), P(0.4, 0.1, 0.2, 0.3, '#2f7a56', '案内板'), P(0.7, 0.1, 0.25, 0.3, '#a35c00', 'お知らせ'), P(0.1, 0.7, 0.8, 0.12, '#8a8f96', '通路')], spots: [
      { id: 'wet', x: 0.3, y: 0.76, label: '入口近くの床が濡れて滑りやすい' }, { id: 'sign', x: 0.52, y: 0.22, label: '案内板が斜めに傾いている' }, { id: 'lamp', x: 0.82, y: 0.14, label: '蛍光灯が一本切れている' }, { id: 'ok', x: 0.15, y: 0.2, real: false, label: '時刻表は正常です' }] },
    good: '雨の日の見回りは、これだけ見てもらえれば十分です。助かります。', mid: '見落としが少しありました。入口付近は、朝に一番最初に見てください。', bad: '濡れた床は転倒につながります。見回りの順番を決めましょう。', ge: [ev('safety', 3)], log: '雨上がりのコンコースを巡回', min: 15 });

  mini({ ch: 'ch2', key: 'rush', req: R, who: 'yamashina', object: 'emergency_btn', from: [8, 40], to: [10, 15], label: '朝のラッシュでホームの安全を見守る', goal: '（業務）朝のホーム見守り', title: '朝のホーム見守り', cam: 'follow',
    hint: '黄色い線に近づく人をタップして声をかけます。', kind: 'watch', config: { total: 10 },
    intro: ['お、来たか。朝のホームは、スマホを見ながら歩く人が多い。線に近づいたら、すぐ声だ。', '怖がらせないように、短く、はっきり。「黄色い線の内側へ」だけでいい。'],
    good: 'いい声かけだった。あれなら、誰も嫌な顔をしない。', mid: '何人か線を越えさせてしまったな。視線を広く。', bad: '朝は特に危ない時間だ。全体を見る練習をしよう。', ge: [ev('safety', 4)], be: [ev('safety', -2)], log: '朝のラッシュのホームを見守り', min: 20 });

  mini({ ch: 'ch2', key: 'window', req: R, who: 'kubota', object: 'ticket_office', from: [9, 30], to: [15, 0], label: '窓口でお客様の用件をさばく', goal: '（業務）窓口の対応', title: '窓口の対応', cam: 'follow',
    hint: '用件を聞いて、正しい取扱いを選びます。', kind: 'sort',
    intro: ['窓口は、きっぷ以外の相談も来ます。聞いてから分類する癖をつけてください。', '迷ったら、「確認します」と言って私に聞くこと。勝手に判断しないのが鉄則です。'],
    config: { perItem: 7, bins: [{ id: 'now', label: 'その場で対応' }, { id: 'ask', label: '先輩・規程を確認' }, { id: 'other', label: '他の窓口へ案内' }], items: [
      { id: 'a', label: '「定期券の有効期限を教えてください」', bin: 'now', why: '券面と端末で確認できる内容は、その場で答えられます。' },
      { id: 'b', label: '「去年の落とし物が出てきたか知りたい」', bin: 'other', why: '落とし物は台帳を扱う担当の窓口です。' },
      { id: 'c', label: '「障害者割引の証明書を忘れた。割引してほしい」', bin: 'ask', why: '割引は規程の確認が必要です。勝手に判断しません。' },
      { id: 'd', label: '「バスの時刻を教えて」', bin: 'other', why: 'バスはバス会社の案内になります。場所だけ案内します。' },
      { id: 'e', label: '「ICカードのチャージはどこでできる？」', bin: 'now', why: '券売機・窓口の場所を案内します。' },
      { id: 'f', label: '「友人の定期券を払い戻したい」', bin: 'ask', why: '本人以外の払い戻しは、確認が必要です。' }] },
    good: '落ち着いて、迷ったものはちゃんと確認に回せました。それが正解です。', mid: '数件、判断が違いました。迷ったら確認、を思い出してください。', bad: '自分で決めてしまうと、後で大きな問題になることがあります。必ず確認を。', ge: [ev('service', 3), ev('accuracy', 2), sk('ticket', 3)], log: '窓口で用件を振り分け', min: 25 });

  mini({ ch: 'ch2', key: 'voice', req: R, who: 'shiraishi', object: 'terminal', from: [10, 30], to: [15, 30], label: '「お客様の声ノート」を整理する', goal: '（業務）お客様の声の整理', title: 'お客様の声ノート', cam: 'npc:shiraishi',
    hint: '先月届いた声を読んで覚え、同じ順に入力します。', kind: 'memory',
    intro: ['月に一度、お客様の声を整理して、本社に送る。内容は、改善の材料になる。', '全部を覚える必要はない。ただ、要点は自分の言葉で言えるようにしなさい。'],
    config: { sequence: ['券売機', '文字が小さい', '夕方', '年配の方'], pool: ['券売機', '改札', '文字が小さい', '音が大きい', '朝', '夕方', '年配の方', '学生'], showMs: 4800, showLabel: 'お客様の声（先月の最多）' },
    good: 'そうだ。数だけでなく、「いつ」「誰が」まで拾えている。', mid: 'おおむね合っている。細かい点ほど、改善の鍵になる。', bad: 'もう一度、原文を読み直しなさい。要点を取り違えると、改善が的外れになる。', log: 'お客様の声ノートを整理', min: 20 });

  mini({ ch: 'ch2', key: 'guide', req: R, who: 'kubota', object: 'elevator', from: [11, 0], to: [15, 30], label: 'ベビーカーのお客様をホームまで案内する', goal: '（依頼）ベビーカーのお客様の案内', title: 'ベビーカーの案内経路', cam: 'follow',
    hint: '起点から着点まで、階段（黒）を避け、案内所（I）に立ち寄って行き先を確認する経路をつなぎます。', kind: 'route',
    intro: ['ベビーカーの方が、ホームの先頭車両のあたりへ行きたいそうです。', 'まず案内所で、行き先の乗り場を確認してから、エレベーターへ向かいましょう。'],
    config: { grid: ['S...#....', '.##.#.##.', '..I...~.G', '.#####.#.', '.........'], must: ['I'], best: 0, legend: { '#': '階段・壁（通れない）', '~': '混雑した通路（遅い）', I: '案内所（立ち寄る）', S: '起点', G: 'ホーム' } },
    good: '無理のない道でした。お客様も安心されたと思います。', mid: '着きましたが、少し遠回りでした。最短の道も覚えておきましょう。', bad: '案内所に寄らないと、行き先を間違えることがあります。確認が先です。', ge: [ev('service', 3), ev('safety', 1)], log: 'ベビーカーのお客様を案内', min: 20 });

  mini({ ch: 'ch2', key: 'coins', req: R, who: 'sakai', object: 'vend2', from: [13, 30], to: [16, 0], label: '両替用の釣銭を準備する', goal: '（業務）釣銭の準備', title: '釣銭の準備', cam: 'follow',
    hint: '動くゲージが緑の範囲に入った瞬間にボタンを押して、硬貨を巻きます。', kind: 'timing',
    intro: ['今日は雨だから、傘を買いに来て千円札を崩す人が多いんだ。', '手伝ってくれる？ 機械のタイミングが、慣れないと難しくてね。'],
    config: { rounds: [{ label: '百円' }, { label: '五十円' }, { label: '十円' }], width: 0.15, speed: 0.85, button: '巻く！' },
    good: 'すごいね、新人さんなのに。これで夕方まで持ちそう。', mid: 'ちょっと崩れたけど、使えるよ。', bad: '難しかったね。ゆっくりやり直せば大丈夫。', log: '釣銭の準備', min: 15 });

  // ---- 券売機の前での気づき（重要選択）----
  N['ch2.hub'].interactions.push({ id: 'idea', object: 'vend2', label: '券売機の前で、迷っている方の様子を観察する', goto: 'ch2.idea_1', requires: ALL(R, T('>=', hm(9, 50))), once: true, icon: '👀' });
  line('ch2.idea_1', [
    '券売機の前に、年配の男性が立っている。画面を見つめたまま、数十秒が過ぎた。',
    ['player', '（「ご案内」の表示を探している…。ボタンの位置が分かりにくいのかもしれない）'],
    '同じ光景を見るのは、今日で三度目だった。そのたびに、誰かが後ろに並んで、ため息をついていた。',
    ['kubota', '（通りかかって）…気づきましたか。実は、前から言われているんです。でも、券売機の設定は私たちの一存では変えられなくて。'],
    ['player', '何か、できることはないでしょうか。'],
    ['kubota', '私は、できることがあるなら、きちんとした形でやりたいと思っています。{player}さんは、どうしたいですか？']
  ], 'ch2.idea_choice', { view: v3('npc:vend2', '券売機2号機') });
  choice('ch2.idea_choice', '気づいたことを、どう扱いますか？', [
    opt('consult', '久保田さんに相談して、改善提案書にまとめる', 'ch2.idea_c', { tone: 'careful', effects: [set('ch2.idea_consult'), rel('kubota', 1, 1)] }),
    opt('selfpost', '手書きの案内を作って、自分で券売機の横に貼る', 'ch2.idea_s', { tone: 'risky', effects: [set('ch2.idea_selfpost')] }),
    opt('skip', '今は自分の仕事を覚えるのが先。見送る', 'ch2.idea_k', { tone: 'quick', effects: [set('ch2.idea_skip')] })
  ], { important: true, view: v3('npc:vend2', '券売機2号機') });

  // 相談 → 提案書（文章を組み立てる業務）
  line('ch2.idea_c', [
    ['kubota', 'ありがとうございます。それが一番いい形です。ただ、提案書は「気持ち」ではなく「事実」から書きます。'],
    ['kubota', '「分かりにくい」だけでは、本社は動けません。何を見て、何回あって、どうなったか。そこから始めましょう。'],
    ['player', '事実、ですね。観察したことを、順番に書いてみます。'],
    ['kubota', '駅長は、現場の声を一番大事にしてくれる人です。でも、決まりを守る人でもあります。両方に届く書き方をしましょう。', 'smile']
  ], 'ch2.proposal_task', { view: v25('office', ['kubota'], '駅事務室 改善提案') });
  N['ch2.proposal_task'] = { id: 'ch2.proposal_task', type: 'task', kind: 'compose', title: '改善提案書の作成', intro: '観察した事実と、小さく試せる提案、確認の方法を組み立てます。',
    slots: [
      { id: 'fact', label: '観察した事実', options: [{ id: 'f1', text: '午前中に、年配のお客様が券売機の「ご案内」を探して迷う場面を3回見ました。', good: true, why: '回数と場面が書かれた事実です。' }, { id: 'f2', text: 'お客様はみんな機械が苦手なようです。', good: false, why: '推測や決めつけで、根拠がありません。' }, { id: 'f3', text: '券売機の画面は、とても使いにくいです。', good: false, why: '感想であり、何が問題か分かりません。' }] },
      { id: 'plan', label: '提案', options: [{ id: 'p1', text: '券売機の横に、大きな文字の案内表示を1週間だけ試しに掲示させてください。', good: true, why: '小さく、期間を区切って、許可を求めています。' }, { id: 'p2', text: '画面を全部作り直してください。', good: false, why: '現場だけでは決められず、現実的ではありません。' }, { id: 'p3', text: '私の判断で、すぐ貼ります。', good: false, why: '許可を取らずに掲示するのは、決まりに反します。' }] },
      { id: 'check', label: '効果の確かめ方', options: [{ id: 'c1', text: '掲示の前後で、お客様が迷う場面の回数を数えて比べます。', good: true, why: '数字で効果を確認できます。' }, { id: 'c2', text: '雰囲気が良くなったか感じてみます。', good: false, why: '感覚だけでは確認になりません。' }, { id: 'c3', text: '特に確認はしません。', good: false, why: '確認しないと、改善か分かりません。' }] }
    ],
    results: [{ min: 66, goto: 'ch2.proposal_good', effects: [ev('service', 3), ev('accuracy', 2), set('ch2.proposal_good')] }, { min: 34, goto: 'ch2.proposal_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch2.proposal_bad', effects: [ev('accuracy', -1)] }], view: v25('office', ['kubota'], '駅事務室 改善提案') };
  line('ch2.proposal_good', [['kubota', '事実、小さな提案、確かめ方。これは、そのまま駅長に出せます。', 'smile'], ['kubota', '私も、前から思っていました。{player}さんが言葉にしてくれて、助かりました。']], 'ch2.idea_done', { effects: [rel('kubota', 2, 2), tl('4月5日 券売機の案内表示について、改善提案書をまとめた')], view: v25('office', ['kubota']) });
  line('ch2.proposal_mid', [['kubota', '方向は合っています。ただ、根拠の書き方をもう少し丁寧に。私も一緒に直しましょう。']], 'ch2.idea_done', { effects: [rel('kubota', 1, 1)], view: v25('office', ['kubota']) });
  line('ch2.proposal_bad', [['kubota', '気持ちは伝わります。でも、このままでは出せません。まず、見たことを数えるところから、一緒にやり直しましょう。', 'serious']], 'ch2.idea_done', { view: v25('office', ['kubota']) });

  // 自己判断で貼る → 意見の衝突（長い会話）
  line('ch2.idea_s', [
    '手元のコピー用紙に、大きな文字で「ご案内はここを押してください」と書いた。テープで券売機の横に貼る。',
    ['player', '（これで、迷う人が減るはず）'],
    '二十分後。巡回から戻った久保田が、足を止めた。',
    ['kubota', '…これ、いつ貼りましたか。', 'serious'],
    ['player', '先ほどです。迷う方が多かったので、少しでも役に立てばと…。'],
    ['kubota', '気持ちは分かります。本当に。でも、券売機まわりの掲示は、本社の承認が必要です。理由は、二つあります。'],
    ['kubota', '一つは、案内の内容が間違っていた場合、駅全体の責任になること。もう一つは、貼り紙が機械の表示を隠して、かえって混乱を生む場合があること。'],
    ['player', '…すみません。確認せずに、自分で決めてしまいました。'],
    ['kubota', '謝ってほしいのではないんです。ただ、いい考えでも、手順を飛ばすと、周りの信頼を一つずつ減らしていきます。'],
    ['kubota', '貼り紙は、いったん外しましょう。そして、今日のうちに、きちんとした形にしませんか。私も手伝います。', 'smile'],
    '剥がした紙は、少しだけ丸まっていた。手の中で、軽く、でも確かな重さを持っていた。'
  ], 'ch2.idea_done', { effects: [rel('kubota', -1, 1), ev('safety', -2), ev('teamwork', -1), set('legacy.rule_break'), tl('4月5日 許可なく券売機に掲示し、指導を受ける')], view: v25('office', ['kubota'], '駅事務室 指導') });
  line('ch2.idea_k', [
    ['player', '（今は、自分の仕事を覚えるのが先だ…）'],
    '券売機の前の男性は、結局、窓口まで歩いてきた。久保田が、笑顔で対応している。',
    ['kubota', '（戻ってきて）…今の方、またいらっしゃいますよ、きっと。気づいたことがあれば、いつでも言ってくださいね。'],
    ['player', 'はい。もう少し、観察してみます。']
  ], 'ch2.idea_done', { effects: [ev('accuracy', 1)], view: v3('npc:kubota', '窓口前') });
  fx('ch2.idea_done', [set('ch2.idea_done'), { var: { key: 'ch2.extra', add: 1 } }, time(15), log('券売機の案内について、対応を決める', 'work')], 'ch2.hub');

  // ---- 昼休憩（2D・長尺）----
  const LV = who => v25('hr', who, '昼休憩 休憩室');
  line('ch2.lunch', [
    '12時。雨は上がり、休憩室の窓から、薄い日が差し込んでいる。',
    ['kubota', 'お疲れさまです。午前は、よく動きましたね。お茶をどうぞ。', 'smile'],
    '弁当を広げる人、仮眠をとる人。駅の昼は、静かで、少しだけ温かい。'
  ], 'ch2.lunch_choice', { view: LV(['kubota']) });
  choice('ch2.lunch_choice', '昼休憩を、誰と過ごしますか？', [
    opt('kubota', '久保田さんと、午前の振り返りをする', 'ch2.lunch_k', { tone: 'careful', effects: [rel('kubota', 1, 1), set('ch2.lunch_kubota')] }),
    opt('yamashina', '山科さんと、お互いの近況を話す', 'ch2.lunch_y', { tone: 'caring', effects: [rel('yamashina', 1, 2), set('ch2.lunch_yamashina')] }),
    opt('shiraishi', '駅長の隣に座って、駅の話を聞く', 'ch2.lunch_s', { tone: 'caring', effects: [rel('shiraishi', 2, 1), set('ch2.lunch_shiraishi')] })
  ], { view: LV(['kubota', 'yamashina', 'shiraishi']) });
  line('ch2.lunch_k', [
    ['kubota', '朝のラッシュは、どうでしたか。ホームで声をかけるのは、勇気がいるでしょう。'],
    ['player', '最初の一人に声をかけるのが、一番緊張しました。でも、言ってみると、意外と普通に聞いてくれて。'],
    ['kubota', 'そうなんです。こちらが思うほど、お客様は構えていません。構えているのは、いつも私たちのほう。', 'smile'],
    ['kubota', '私も新人の頃は、声をかけて怒られたらどうしよう、と考えてばかりでした。実際に怒られたのは、五年間で二回だけです。'],
    ['player', '二回もあったんですね。'],
    ['kubota', 'ええ。一回目は本当に私が悪かった。二回目は、虫の居所が悪い方だった。どちらも、次の日には忘れました。'],
    ['kubota', '大事なのは、怒られた理由を一度だけ考えること。それ以上は、引きずらないこと。'],
    ['player', '一度だけ考える。…覚えておきます。'],
    ['kubota', 'さて。午後は窓口が混みます。お茶、もう一杯飲んでいってください。']
  ], 'ch2.lunch_end', { view: LV(['kubota']) });
  line('ch2.lunch_y', [
    ['yamashina', '朝のホーム、見ててくれたか？ 実は、最初の一人に声をかけるまで、五分も固まってた。', 'smile'],
    ['player', '全然そうは見えなかったよ。'],
    ['yamashina', 'だろ？ 顔に出さないのだけは、得意なんだ。…正直に言うと、同期のなかで、自分が一番遅れてる気がしてる。'],
    ['player', '遅れてる、って？'],
    ['yamashina', '昨日、人事の森下さんに言われた。「評価は、半年ごとに見ます」って。半年の間に、何を積み上げられるかで、行ける場所が変わる。'],
    ['yamashina', '基地に行きたいのに、そこまでの道が、見えない道みたいで。'],
    ['player', '見えない道でも、一日ずつ歩けば、あとから道になるんじゃないかな。'],
    ['yamashina', '…お前、時々いいこと言うな。', 'smile'],
    ['yamashina', '今日の券売機の件、気づいてたのか。あれを提案書にしたいなら、俺も協力する。同期だからな。']
  ], 'ch2.lunch_end', { effects: [set('ch2.yama_help')], view: LV(['yamashina']) });
  line('ch2.lunch_s', [
    ['shiraishi', '珍しいね。若い人は、事務室のほうへは来ても、私の隣には座らないものだ。', 'smile'],
    ['player', 'すみません。迷惑でしたか。'],
    ['shiraishi', 'いや、嬉しいよ。…この駅は、開業して二十年になる。私は、ここで三代目の駅長だ。'],
    ['shiraishi', '初代の駅長は、毎朝、改札の外に立って、挨拶をしていた。「駅の顔は、立っている人の顔だ」と言ってね。'],
    ['player', '駅の顔は、立っている人の顔…。'],
    ['shiraishi', 'そうだ。設備が新しくなっても、最後に人の印象を決めるのは、最初に声をかけた一人だ。'],
    ['shiraishi', '{player}、今日一日で、誰かの顔を覚えたか。'],
    ['player', '…券売機で迷っていた、年配の男性の顔を、覚えています。'],
    ['shiraishi', '十分だ。それが、仕事の始まりだよ。', 'smile']
  ], 'ch2.lunch_end', { effects: [set('ch2.shiraishi_motto')], view: LV(['shiraishi']) });
  fx('ch2.lunch_end', [set('ch2.lunch_done'), time(45), log('昼休憩', 'work')], 'ch2.hub');

  // ---- 評価面談（2D・長尺）----
  line('ch2.review', [
    '16時30分。駅事務室で、白石駅長と久保田が待っていた。机の上に、一枚の評価シートが置かれている。',
    ['shiraishi', '今日は、初めての「週次の振り返り」だ。評価ではなく、成長のための面談だと思ってほしい。']
  ], 'ch2.review_b', { view: v25('office', ['shiraishi', 'kubota'], '16:30 駅事務室 週次面談'), effects: [{ clock: { minute: hm(16, 30) } }] });
  branch('ch2.review_b', [[F('ch2.idea_selfpost'), 'ch2.rv_s'], [F('ch2.proposal_good'), 'ch2.rv_good'], [F('ch2.idea_consult'), 'ch2.rv_try']], 'ch2.rv_plain');
  line('ch2.rv_s', [
    ['shiraishi', '券売機の件は、久保田から聞いた。いい着眼だと思う。ただ、手順を飛ばした。', 'serious'],
    ['kubota', '責めているわけではありません。ただ、気づいたことは、先に相談してほしかった。'],
    ['shiraishi', '駅は、一人の判断で動くと、必ずどこかにひずみが出る。君の観察は、正しい。だから、正しい形で出し直しなさい。'],
    ['player', 'はい。もう一度、手順を踏んでやり直します。'],
    ['shiraishi', '提案書を書く気があるなら、私も目を通す。出しなさい。']
  ], 'ch2.rv_choice', { view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.rv_good', [
    ['shiraishi', '提案書を読んだ。事実と提案と確認方法が揃っていて、本社にそのまま出せる。', 'smile'],
    ['kubota', '一週間の試行で、許可を取る方向で進めましょう。'],
    ['shiraishi', '新人の提案が採用されることは、珍しい。だが、手順と根拠が揃えば、通る。覚えておきなさい。']
  ], 'ch2.rv_choice', { effects: [set('ch2.proposal_sent'), tl('4月5日 改善提案書が駅長に承認される')], view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.rv_try', [
    ['shiraishi', '相談してから動く、という選択をしてくれたこと自体が、今日の収穫だ。', 'smile'],
    ['kubota', '提案書は、まだ磨く余地があります。明日、もう一度一緒に見ましょう。']
  ], 'ch2.rv_choice', { view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.rv_plain', [
    ['shiraishi', '今日は、与えられた仕事を丁寧にこなしていたと聞いている。基本は、それでいい。'],
    ['kubota', '次の週は、「気づいたことを、形にする」ことも練習してみましょう。']
  ], 'ch2.rv_choice', { view: v25('office', ['shiraishi', 'kubota']) });
  choice('ch2.rv_choice', '来週、いちばん伸ばしたいことは？', [
    opt('service', 'お客様への声かけと、接客', 'ch2.closing', { tone: 'caring', effects: [set('next.focus_service'), ev('service', 2)] }),
    opt('accuracy', '正確さ。手順と確認の徹底', 'ch2.closing', { tone: 'careful', effects: [set('next.focus_accuracy'), ev('accuracy', 2)] }),
    opt('teamwork', '同僚との連携と、相談のしかた', 'ch2.closing', { tone: 'caring', effects: [set('next.focus_team'), ev('teamwork', 2)] })
  ], { important: true, view: v25('office', ['shiraishi', 'kubota']) });
  line('ch2.closing', [
    ['shiraishi', 'よし。来週の勤務表を、渡しておく。再来週には、初めての早番が入る。五時半の始業だ。体を、慣らしておきなさい。'],
    ['kubota', '早番の前の晩は、いつもより一時間早く寝てください。私は、それを三年かけて覚えました。', 'smile'],
    '窓の外は、すっかり日が落ちていた。券売機の前の男性は、もういない。それでも、顔だけは、はっきり覚えていた。'
  ], 'ch2.after', { view: v25('office', ['shiraishi', 'kubota'], '17:30 駅事務室') });
  branch('ch2.after', [[F('legacy.depot_tour'), 'ch2.depot']], 'ch2.end');

  // 週末の基地見学（第1章で山科の誘いを受けた場合）：4月10日
  line('ch2.depot', [
    '4月10日（土）。青浜総合車両センターの見学会。整然と並ぶ留置線の向こうで、検修庫のシャッターが開いている。',
    ['yamashina', 'この床下機器、図面で見るのと全然違うな…。', 'smile'],
    ['yamashina', '駅の仕事を覚えるのが先なのは分かってる。でも、ここで働きたい気持ちは、やっぱり本物だ。'],
    ['player', '来週の早番も、がんばろう。お互いに。'],
    ['yamashina', 'ああ。二人で、見えない道を、歩いていこう。']
  ], 'ch2.end', { effects: [set('next.depot_seed'), set('ch2.saw_depot'), rel('yamashina', 1, 1), tl('4月10日 青浜総合車両センターの見学会に参加')], view: v25('depot', ['yamashina'], '4月10日（土） 青浜総合車両センター') });

  N['ch2.end'] = { id: 'ch2.end', type: 'end', chapter: 'ch2', title: '第2章 最初の週末', nextChapter: 'ch3',
    summary: '勤務2週目の月曜が終わった。気づいたことをどう扱ったか。誰と昼を過ごしたか。その積み重ねが、次の週の勤務表と、人との距離を少しずつ変えていく。',
    effects: [tl('4月5日 勤務2週目の月曜を終える'), log('第2章を終了', 'chapter')] };
}
