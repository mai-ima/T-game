// R7「配属先は、明日変わる」第1章「新しい名札」＋第2章冒頭（体験版）をJSONへ書き出すビルダー。
// 台詞・分岐はここ（データ）に集約し、エンジン側にはストーリーを一切書かない。
import { writeFileSync, mkdirSync } from 'node:fs';

const N = {};
const rel = (char, trust = 0, rapport = 0, note) => ({ rel: { char, trust, rapport, ...(note ? { note } : {}) } });
const ev = (key, add) => ({ eval: { key, add } });
const set = f => ({ set: f });
const time = m => ({ time: m });
const log = (text, tag) => ({ log: { text, tag } });
const tl = text => ({ timeline: { text } });
const tr = (id, progress) => ({ training: { id, progress } });
const sk = (key, add) => ({ skill: { key, add } });
const F = flag => ({ flag }), NF = notFlag => ({ notFlag });
const ALL = (...all) => ({ all }), ANY = (...any) => ({ any });
const T = (op, val) => ({ time: { op, val } });
const hm = (h, m) => h * 60 + m;

const L = a => (typeof a === 'string' ? { text: a, narration: true } : { who: a[0], text: a[1], mood: a[2] });
const line = (id, lines, next, o = {}) => (N[id] = { id, type: 'line', lines: lines.map(L), next, ...o });
const choice = (id, prompt, options, o = {}) => (N[id] = { id, type: 'choice', prompt, options, ...o });
const branch = (id, cases, els, o = {}) => (N[id] = { id, type: 'branch', cases: cases.map(([when, goto]) => ({ when, goto })), else: els, ...o });
const fx = (id, effects, next) => (N[id] = { id, type: 'effect', effects, next });
const opt = (id, label, goto, o = {}) => ({ id, label, goto, ...o });

const v3 = (cam, caption, extra = {}) => ({ mode: '3d', cam, caption, ...extra });
const v25 = (bg, focus, caption) => ({ mode: '25d', bg, focus, caption });

// ============ 人物 ============
const characters = {
  shiraishi: { id: 'shiraishi', name: '白石 清', kana: 'しらいし きよし', role: '駅長', dept: 'station', age: 52, years: 30, uniform: '#1d2a44', hair: '#4a4a4a', skin: '#e8c29c', trait: '安全第一。迷ったら止まって確認、報告は早く。', bio: '現場上がりの駅長。若手には必ず「なぜそう判断したか」を聞く。', gender: 'm', accessory: 'cap' },
  kubota: { id: 'kubota', name: '久保田 彩', kana: 'くぼた あや', role: '駅務係員（指導担当）', dept: 'station', age: 28, years: 5, uniform: '#1d2a44', hair: '#2b2118', skin: '#f0cfae', trait: '実務派。手順の理由まで教える。曖昧な返事が嫌い。', bio: '入社5年目。去年まで新人だった感覚を覚えている。', gender: 'f', accessory: 'cap' },
  yamashina: { id: 'yamashina', name: '山科 蓮', kana: 'やましな れん', role: '同期入社（駅務）', dept: 'station', age: 23, years: 0, uniform: '#1d2a44', hair: '#1c1c28', skin: '#efc9a6', trait: '車両と設備に強い関心。負けず嫌いだが面倒見は良い。', bio: '工業高専出身。いつかは車両基地の仕事をしたい。', gender: 'm', accessory: 'none' },
  morishita: { id: 'morishita', name: '森下 恵', kana: 'もりした めぐみ', role: '総務部 人事課', dept: 'hr', age: 35, years: 12, uniform: '#3a4a5e', hair: '#3a2a22', skin: '#f2d2b4', trait: '丁寧で率直。希望と会社の事情の両方を説明する。', bio: '新入社員の配属面談を担当。', gender: 'f', accessory: 'glasses' },
  kajiwara: { id: 'kajiwara', name: '梶原 トミ', kana: 'かじわら とみ', role: '利用者（常連）', dept: 'none', age: 78, years: 0, uniform: '#7a5a78', hair: '#d8d8d8', skin: '#ecc8a8', trait: '週に二度、通院で海浜口へ。機械は少し苦手。', bio: '青嶺中央駅の古い常連。駅員の顔をよく覚えている。', gender: 'f', accessory: 'bag' },
  hamaguchi: { id: 'hamaguchi', name: '浜口', kana: 'はまぐち', role: '輸送指令員（電話）', dept: 'dispatch', age: 41, years: 18, uniform: '#2a3d52', hair: '#222', skin: '#e9c7a2', trait: '電話口で簡潔。確定情報と見込みを必ず分けて伝える。', bio: '青海本線担当の輸送指令。', gender: 'm', accessory: 'none' },
  traveler: { id: 'traveler', name: '旅行客', kana: 'りょこうきゃく', role: '利用者', dept: 'none', age: 34, years: 0, uniform: '#3a6a5a', hair: '#5a3a2a', skin: '#f0d0b0', trait: '空港連絡線への乗り換えを急いでいる。', bio: '大きなスーツケースを持つ旅行者。', gender: 'f', accessory: 'bag' }
};

// ============ 第1章 プロローグ：配属面談（2.5D） ============
line('ch1.p1', [
  '4月1日。入社式を終えた午後、{player}は人事課の面談室に呼ばれた。',
  ['morishita', '入社おめでとうございます。人事課の森下です。今日は配属先のお話と、これからの希望をうかがいます。', 'smile'],
  ['morishita', '最初の配属は、全員がまず現場からです。{player}さんは、青嶺中央駅の駅営業に決まりました。'],
  ['morishita', 'ただ、将来どんな仕事に関心があるかは、先に聞いておきたいのです。希望がそのまま通るとは限りませんが、面談記録として大切に残します。']
], 'ch1.p_wish', { view: v25('hr', ['morishita'], '4月1日（木） 13:00 本社 人事課') });

choice('ch1.p_wish', 'これからの仕事で、いちばん関心のある分野は？', [
  opt('station', '「まずは駅で、お客様と直接関わる仕事を極めたいです」', 'ch1.p_r_station', { tone: 'caring', effects: [set('legacy.wish_station'), ev('service', 3), rel('morishita', 1, 0), log('配属面談：駅の接客を極めたいと申告', 'career')] }),
  opt('depot', '「車両や設備を支える現場にも興味があります」', 'ch1.p_r_depot', { tone: 'careful', effects: [set('legacy.wish_depot'), ev('safety', 3), sk('depot', 2), rel('morishita', 1, 0), log('配属面談：車両・設備への関心を申告', 'career')] }),
  opt('planning', '「ダイヤや計画など、全体を考える仕事にも関心があります」', 'ch1.p_r_planning', { tone: 'quick', effects: [set('legacy.wish_planning'), ev('reporting', 3), rel('morishita', 1, 0), log('配属面談：輸送計画への関心を申告', 'career')] }),
  opt('open', '「まだ決められません。いろいろ経験してから考えたいです」', 'ch1.p_r_open', { tone: 'neutral', effects: [set('legacy.wish_open'), ev('teamwork', 3), rel('morishita', 0, 1), log('配属面談：希望は経験を積んでから決めると申告', 'career')] })
], { important: true, who: 'morishita', view: v25('hr', ['morishita']) });

line('ch1.p_r_station', [['morishita', '接客は、鉄道の顔になる仕事です。駅で得た経験は、どの部署に行っても生きますよ。', 'smile']], 'ch1.p2', { view: v25('hr', ['morishita']) });
line('ch1.p_r_depot', [['morishita', '基地や設備の仕事は、現場を知っている人が強いです。ただ、異動には資格と研修が必要になります。それも後でご説明しますね。']], 'ch1.p2', { view: v25('hr', ['morishita']) });
line('ch1.p_r_planning', [['morishita', '計画は、現場の事情を知らないと机上の空論になりがちです。まずは駅で、お客様の動きを肌で感じてください。']], 'ch1.p2', { view: v25('hr', ['morishita']) });
line('ch1.p_r_open', [['morishita', 'それも誠実な答えです。迷うなら、たくさん見て、聞いて、記録してください。', 'smile']], 'ch1.p2', { view: v25('hr', ['morishita']) });

line('ch1.p2', [
  ['morishita', '異動は、希望だけでなく、資格・研修・評価・受け入れ側の事情で決まります。希望どおりにならない年もあります。'],
  ['morishita', '勤務は交替制です。勤務表は毎月作られ、休みや勤務間のインターバルは社内規程で守られています。困ったら、遠慮なく相談してください。'],
  ['morishita', '最初の一歩は駅務の基礎です。明日、青嶺中央駅で白石駅長に挨拶してください。']
], 'ch1.arrive', {
  effects: [{ assign: { dept: 'station', role: '駅務係員（見習い）', site: '青嶺中央駅' } }, tr('new_hire', 100), tl('4月1日 入社。青嶺中央駅（駅営業）に配属'), log('入社式・配属面談を終える', 'career')],
  view: v25('hr', ['morishita'])
});

line('ch1.arrive', ['4月2日（金）。早朝の青嶺中央駅。橋上駅舎の大きな窓に、朝の光が反射している。', '始業は8時30分。まず駅事務室へ向かい、白石駅長に挨拶をする。'], 'ch1.hub', {
  effects: [{ clock: { addDay: 1, minute: hm(8, 20) } }, log('勤務初日。青嶺中央駅に出勤', 'work')],
  view: v3('plaza', '4月2日（金） 08:20 青嶺中央駅 駅前')
});

// ============ ハブ：青嶺中央駅（3D） ============
N['ch1.hub'] = {
  id: 'ch1.hub', type: 'hub', scene: 'station', title: '青嶺中央駅 勤務', hint: '歩いて設備や人物に近づき、「調べる」で仕事を進めます。',
  view: v3('follow', '青嶺中央駅'),
  interactions: [
    { id: 'tenko', object: 'shiraishi', label: '駅長に挨拶し、点呼を受ける', goto: 'ch1.tenko', once: true, icon: '🧑‍✈️' },
    { id: 'roster', object: 'roster_board', label: '勤務表を確認する', goto: 'ch1.roster_task', once: true, icon: '📋' },
    { id: 'terminal', object: 'terminal', label: '業務端末で運行情報を確認する', goto: 'ch1.term_task', requires: F('ch1.tenko'), once: true, icon: '💻' },
    { id: 'vend', object: 'vend2', label: '券売機を点検する', goto: 'ch1.vend_intro', requires: F('ch1.tenko'), once: true, icon: '🎫' },
    { id: 'kajiwara', object: 'kajiwara', label: '券売機の前で困っている方に声をかける', goto: 'ch1.kaji_1', requires: F('ch1.tenko'), once: true, icon: '🙋' },
    { id: 'platform', object: 'tactile', label: 'ホームを巡回点検する', goto: 'ch1.plat_intro', requires: ALL(F('ch1.tenko'), F('ch1.roster')), once: true, icon: '🔍' },
    { id: 'kubota', object: 'kubota', label: '久保田さんに話しかける', goto: 'ch1.kubota_talk', requires: F('ch1.tenko'), once: true, icon: '💬' },
    { id: 'yamashina', object: 'yamashina', label: '山科さんに話しかける', goto: 'ch1.yama_talk', requires: F('ch1.tenko'), once: true, icon: '💬' },
    { id: 'lost', object: 'lost_item', label: 'ベンチの忘れ物を確認する', goto: 'ch1.lost_1', requires: F('ch1.platform'), once: true, icon: '☂️' }
  ],
  goals: [
    { id: 'g_tenko', label: '駅長に挨拶し、点呼を受ける', when: F('ch1.tenko') },
    { id: 'g_roster', label: '勤務表を確認する', when: F('ch1.roster') },
    { id: 'g_vend', label: '券売機を点検する', when: F('ch1.vend') },
    { id: 'g_platform', label: 'ホームを巡回点検する', when: F('ch1.platform') },
    { id: 'g_term', label: '運行情報を確認する', when: F('ch1.opinfo') },
    { id: 'g_delay', label: '遅れが出たときの旅客対応（10:40ごろ）', when: F('ch1.delay_done') },
    { id: 'g_lunch', label: '昼休憩（12:00）', when: F('ch1.lunch_done') },
    { id: 'g_kaji', label: '（任意）困っているお客様に声をかける', when: F('ch1.kajiwara_done'), optional: true },
    { id: 'g_lost', label: '（任意）忘れ物の取扱い', when: F('ch1.lost_done'), optional: true }
  ],
  timed: [
    { id: 'delay', at: hm(10, 40), goto: 'ch1.delay_gate' },
    { id: 'lunch', at: hm(12, 0), goto: 'ch1.lunch' },
    { id: 'yama_ask', at: hm(14, 0), goto: 'ch1.yama_ask' },
    { id: 'close', at: hm(17, 0), goto: 'ch1.closing' }
  ],
  exit: { label: '勤務を終えて面談へ（16:00以降）', requires: ALL(F('ch1.tenko'), F('ch1.roster'), F('ch1.vend'), F('ch1.platform'), F('ch1.opinfo'), F('ch1.delay_done'), F('ch1.lunch_done'), T('>=', hm(16, 0))), goto: 'ch1.closing' }
};

// ---- 点呼 ----
line('ch1.tenko', [
  ['shiraishi', 'おはよう。駅長の白石です。昨日までは研修、今日からは現場の一員だ。よろしく頼むよ。', 'smile'],
  ['shiraishi', '点呼を行う。今日は日勤、8時30分から17時15分。指導担当は久保田だ。'],
  ['kubota', '久保田です。分からないことは、分からないと言ってください。分かったふりが一番困ります。', 'serious'],
  ['shiraishi', '駅の仕事で一番大事なのは、安全と正確さ。迷ったら止まって確認、それから報告だ。確認と報告は、遅いより早い方がいい。'],
  ['shiraishi', '今日の流れは掲示板の勤務表に出ている。まず勤務表を確認し、券売機の点検、ホームの巡回、運行情報の確認を一通りやってみなさい。'],
], 'ch1.hub', { effects: [set('ch1.tenko'), rel('shiraishi', 1, 0), rel('kubota', 0, 0), time(15), tr('station_basic', 10), log('点呼。駅長と指導担当に挨拶', 'work')], view: v3('npc:shiraishi', '駅事務室') });

// ---- 勤務表 ----
N['ch1.roster_task'] = {
  id: 'ch1.roster_task', type: 'task', kind: 'roster', title: '勤務表の確認', intro: '4週間の勤務表を読み、指定された日をタップしてください。',
  config: { targets: [{ day: 7, label: '最初の研修日' }, { day: 14, label: '初めての早番（5:30始業）' }] },
  results: [{ min: 100, goto: 'ch1.roster_good', effects: [ev('accuracy', 3)] }, { min: 50, goto: 'ch1.roster_mid', effects: [ev('accuracy', 1)] }, { min: 0, goto: 'ch1.roster_bad', effects: [ev('accuracy', -2)] }],
  view: v3('npc:shiraishi', '勤務表掲示板')
};
line('ch1.roster_good', [['kubota', '勤務表は一度見て終わりではなく、毎日確認します。早番の日は、前日の夜の過ごし方から変わってきますから。']], 'ch1.roster_end', { view: v3('npc:kubota') });
line('ch1.roster_mid', [['kubota', 'うっかりは誰にもあります。ただ、日付の取り違えは、そのまま遅刻につながります。もう一度、声に出して確認する習慣をつけましょう。']], 'ch1.roster_end', { view: v3('npc:kubota') });
line('ch1.roster_bad', [['kubota', '勤務表は仕事の約束事です。読み違えると、あなたも、交代する人も困ります。次は指で追って確認してください。', 'serious']], 'ch1.roster_end', { view: v3('npc:kubota') });
fx('ch1.roster_end', [set('ch1.roster'), time(5), log('勤務表を確認（研修日・初回早番）', 'work')], 'ch1.hub');

// ---- 業務端末（運行情報） ----
N['ch1.term_task'] = {
  id: 'ch1.term_task', type: 'task', kind: 'terminal', title: '駅務端末（架空の業務画面）', intro: '「運行情報」「引継ぎ」「設備状態」を順に開き、内容を確認してください。',
  config: { tabs: ['ops', 'handover', 'equipment'] },
  results: [{ min: 100, goto: 'ch1.term_done', effects: [ev('reporting', 3), ev('accuracy', 2)] }, { min: 0, goto: 'ch1.term_done', effects: [ev('reporting', 0)] }],
  view: v3('npc:terminal', '駅事務室 業務端末')
};
line('ch1.term_done', [['kubota', '運行情報は「確定していること」と「見込み」を分けて読むのが基本です。数字が出ていても、見込みは変わることがあります。']], 'ch1.term_end', { view: v3('npc:kubota') });
fx('ch1.term_end', [set('ch1.opinfo'), time(10), tr('station_basic', 10), log('業務端末で運行情報・引継ぎ・設備状態を確認', 'work')], 'ch1.hub');

// ---- 券売機の点検 ----
N['ch1.vend_intro'] = { id: 'ch1.vend_intro', type: 'line', lines: [L(['kubota', '券売機2号機は、昨日の引継ぎに「紙幣の通りが悪い」とありました。点検項目を一つずつ見て、正常か異常かを判断してください。']), L(['kubota', '判断の理由も大事です。理由が言えないと、報告になりません。'])], next: 'ch1.vend_task', view: v3('npc:vend2', '1階コンコース 券売機') };
N['ch1.vend_task'] = {
  id: 'ch1.vend_task', type: 'task', kind: 'checklist', title: '券売機2号機 点検', intro: '各項目を「正常」「異常」で判定します。',
  items: [
    { id: 'bill', label: '紙幣投入口：千円札を入れると引っ掛かって戻ってくる', truth: 'ng', why: '紙幣が戻るのは異常です。紙幣取扱いを停止し、掲示と報告が必要です。' },
    { id: 'coin', label: '硬貨投入口：百円硬貨を問題なく受け付ける', truth: 'ok', why: '硬貨は正常に受け付けています。' },
    { id: 'change', label: '釣銭の残量表示：十分な量が表示されている', truth: 'ok', why: '残量は十分です。' },
    { id: 'paper', label: '券紙の残量：残り少ない警告が出ている', truth: 'ng', why: '券紙が少ないと発券が止まります。補充を依頼します。' },
    { id: 'lang', label: '画面表示：言語切替ボタンが反応し、案内が表示される', truth: 'ok', why: '画面操作は正常です。' }
  ],
  results: [{ min: 80, goto: 'ch1.vend_good', effects: [ev('accuracy', 4), sk('ticket', 5), tr('station_basic', 10)] }, { min: 50, goto: 'ch1.vend_mid', effects: [ev('accuracy', 1), sk('ticket', 2), tr('station_basic', 5)] }, { min: 0, goto: 'ch1.vend_bad', effects: [ev('accuracy', -3), tr('station_basic', 2)] }],
  view: v3('npc:vend2', '券売機2号機')
};
line('ch1.vend_good', [['kubota', 'いい点検です。異常の判断と理由が合っています。', 'smile']], 'ch1.vend_report', { effects: [set('ch1.vend_ng_found')] });
line('ch1.vend_mid', [['kubota', '見落としがあります。見落としは「なかった」ことになってしまうので、次は指差し確認で一項目ずつ行いましょう。', 'serious']], 'ch1.vend_report', { effects: [set('ch1.vend_ng_found')] });
line('ch1.vend_bad', [['kubota', '異常を見逃すと、お客様の目の前で機械が止まります。一緒にもう一度やりましょう。', 'serious']], 'ch1.vend_report', { effects: [set('ch1.vend_ng_found')] });
choice('ch1.vend_report', '異常が見つかった。どう対応しますか？', [
  opt('report', '「すぐ久保田さんに報告し、使用停止の掲示も依頼します」', 'ch1.vend_r1', { tone: 'honest', effects: [ev('reporting', 4), ev('safety', 1), rel('kubota', 1, 0)] }),
  opt('try', '「まず自分で再起動を試し、直らなければ報告します」', 'ch1.vend_r2', { tone: 'risky', effects: [ev('reporting', -2), ev('accuracy', 1)] }),
  opt('paper', '「とりあえず『故障中』の貼り紙だけ貼ります」', 'ch1.vend_r3', { tone: 'quick', effects: [ev('reporting', -3), ev('service', 1)] })
], { view: v3('npc:vend2') });
line('ch1.vend_r1', [['kubota', 'その順番です。報告が早ければ、委託の保守担当も早く動けます。取扱い停止の掲示は私が見ます。']], 'ch1.vend_end', { effects: [set('ch1.vend_reported')] });
line('ch1.vend_r2', [['kubota', '再起動は、私か助役の許可を得てから。勝手に触って、状態が分からなくなるのが一番困ります。']], 'ch1.vend_end');
line('ch1.vend_r3', [['kubota', '掲示だけでは、保守担当に伝わりません。直すためには報告が必要です。次からは報告を先に。', 'serious']], 'ch1.vend_end');
fx('ch1.vend_end', [set('ch1.vend'), time(15), log('券売機2号機を点検。紙幣不調と券紙不足を確認', 'work')], 'ch1.hub');

// ---- 梶原さん ----
line('ch1.kaji_1', [
  ['kajiwara', 'あらあら、これね、お札を入れても出てきちゃってね。海浜口までの切符が買えなくて…', 'worry'],
  ['kajiwara', '今日は病院の日なのよ。9時半の予約に間に合うかしら。'],
  ['kubota', '（少し離れた場所から、様子を見守っている）']
], 'ch1.kaji_choice', { view: v3('npc:kajiwara', '1階コンコース 券売機前') });
choice('ch1.kaji_choice', '梶原さんに、どう対応しますか？', [
  opt('caring', '「きっぷうりばまでご一緒して、購入まで付き添います」', 'ch1.kaji_caring', { tone: 'caring', effects: [time(15), ev('service', 4), rel('kajiwara', 3, 2), set('legacy.helped_kajiwara'), sk('service', 3)] }),
  opt('light', '「1番の券売機をご案内して、操作を口頭でご説明します」', 'ch1.kaji_light', { tone: 'quick', effects: [time(5), ev('service', 2), rel('kajiwara', 1, 0), set('ch1.kaji_light')] }),
  opt('handoff', '「久保田さんに代わってもらいます」', 'ch1.kaji_hand', { tone: 'neutral', effects: [time(3), ev('service', -1), ev('reporting', 1), rel('kubota', 0, 0), set('ch1.kaji_handoff')] })
], { view: v3('npc:kajiwara') });
line('ch1.kaji_caring', [['kajiwara', 'ありがとうね。お兄さん、いえ、あなたのお名前は？ また来週もこの時間に来るから、顔を見せてちょうだいね。', 'smile'], ['kubota', '券売機の操作に慣れていない方には、窓口へ誘導するのも立派な案内です。時間の使い方は難しいですが、今の判断は間違いではありません。']], 'ch1.kaji_end');
line('ch1.kaji_light', [['kajiwara', 'ああ、これね、分かったわ。ありがとう。', 'normal']], 'ch1.kaji_end');
line('ch1.kaji_hand', [['kubota', '（梶原さんの前に立ち）お待たせしました。こちらへどうぞ。'], ['kubota', 'あとで、どうして私に任せたのか、聞かせてください。責めているのではなく、あなたの判断が知りたいので。']], 'ch1.kaji_end');
fx('ch1.kaji_end', [set('ch1.kajiwara_done'), log('券売機前で梶原さんを案内', 'work')], 'ch1.hub');

// ---- ホーム巡回 ----
line('ch1.plat_intro', [
  ['yamashina', '巡回、俺も一緒にいいですか？ 同期だし、見るポイントは一緒に確認したいので。', 'smile'],
  ['kubota', '二人で見てください。ただし判断は一人ずつ。後で答え合わせをします。'],
  ['yamashina', 'ホームは、お客様と列車が最も近づく場所です。足元と案内表示から見ましょう。']
], 'ch1.plat_task', { view: v3('npc:yamashina', '2階 島式ホーム') });
N['ch1.plat_task'] = {
  id: 'ch1.plat_task', type: 'task', kind: 'checklist', title: 'ホーム巡回点検', intro: '各項目を「正常」「異常」で判定します。',
  items: [
    { id: 'tactile', label: '内方線付き点状ブロック：一部が剥がれて浮いている', truth: 'ng', why: '視覚障害のあるお客様が頼りにする設備です。剥がれは転倒の原因にもなります。' },
    { id: 'stop', label: '列車非常停止ボタン：カバーが閉じ、表示灯が点いている', truth: 'ok', why: '非常停止ボタンは正常です。' },
    { id: 'board', label: '発車標：次の列車の行先・時刻が正しく表示されている', truth: 'ok', why: '表示は正常です。' },
    { id: 'timetable', label: '時刻表の掲示：先月のダイヤ改正前の版が貼られている', truth: 'ng', why: '古い時刻表は誤案内の原因になります。最新版への差替えを依頼します。' },
    { id: 'line', label: '黄色い線（ホーム縁端）：はっきり見え、剥離はない', truth: 'ok', why: '縁端警告の表示は十分です。' },
    { id: 'bench', label: 'ベンチ：座面がぐらつく', truth: 'ng', why: 'ぐらつきは転倒・けがの原因です。使用を止めて修繕を依頼します。' }
  ],
  results: [{ min: 80, goto: 'ch1.plat_good', effects: [ev('safety', 4), ev('accuracy', 2), tr('station_basic', 15), sk('patrol', 5)] }, { min: 50, goto: 'ch1.plat_mid', effects: [ev('safety', 1), tr('station_basic', 8), sk('patrol', 2)] }, { min: 0, goto: 'ch1.plat_bad', effects: [ev('safety', -3), tr('station_basic', 3)] }],
  view: v3('npc:yamashina', '島式ホーム')
};
line('ch1.plat_good', [['yamashina', 'さすが。三つ目のベンチ、俺は見落としかけた。', 'surprise'], ['kubota', '巡回は、危険を先に見つける仕事です。見つけた順に報告して、記録を残してください。']], 'ch1.plat_end');
line('ch1.plat_mid', [['yamashina', '惜しい。まあ、最初はこんなものだよ。もう一周しよう。'], ['kubota', '見落としは、次回に残さないことが大事。次は優先順位を付けて見ましょう。']], 'ch1.plat_end');
line('ch1.plat_bad', [['yamashina', '…大丈夫か？ 午後にもう一周、付き合うよ。'], ['kubota', '巡回の見落としは、お客様の安全に直結します。後で、確認の手順を一緒に練習しましょう。', 'serious']], 'ch1.plat_end');
fx('ch1.plat_end', [set('ch1.platform'), time(25), log('ホーム巡回点検。点字ブロック・時刻表・ベンチを確認', 'work')], 'ch1.hub');

// ---- 雑談（久保田／山科） ----
branch('ch1.kubota_talk', [[F('ch1.vend_reported'), 'ch1.kubota_talk_a']], 'ch1.kubota_talk_b', { view: v3('npc:kubota') });
line('ch1.kubota_talk_a', [['kubota', '券売機の件、報告が早かったのが助かりました。技術的な判断より、まず「誰に何を伝えるか」が肝心です。', 'smile'], ['kubota', '異動の話も、実は同じなんです。希望を出すだけでなく、資格や研修で「準備」を示す人が信頼されます。']], 'ch1.kubota_talk_end', { effects: [rel('kubota', 1, 1)] });
line('ch1.kubota_talk_b', [['kubota', '最初は、何でも自分でやろうとしがちです。でも、現場は一人で守るものではありません。', 'normal'], ['kubota', '異動の話も同じで、希望を出すだけでは足りません。資格や研修、評価という「準備」を積んでおくと、話が早くなります。']], 'ch1.kubota_talk_end', { effects: [rel('kubota', 0, 1)] });
fx('ch1.kubota_talk_end', [time(5)], 'ch1.hub');
line('ch1.yama_talk', [
  ['yamashina', '正直に言うと、俺は将来、車両基地で働きたいんだ。電車の床下を見るのが好きで。', 'smile'],
  ['yamashina', 'でも異動には資格と研修が要るって、さっき人事で聞いた。駅で評価を取らないと、そもそも土俵に乗れない。'],
  ['yamashina', 'だから今日は、負けないつもりでやる。同期だからこそ、な。']
], 'ch1.yama_talk_end', { effects: [rel('yamashina', 1, 1), set('ch1.yama_goal_known')], view: v3('npc:yamashina') });
fx('ch1.yama_talk_end', [time(5)], 'ch1.hub');

// ---- 忘れ物 ----
line('ch1.lost_1', [['kubota', '（ホームのベンチに、名前入りの折りたたみ傘が置かれている）'], ['kubota', 'お客様の忘れ物ですね。次の列車が来る前に、取扱いを決めてください。']], 'ch1.lost_choice', { view: v3('npc:lost_item', '島式ホーム ベンチ') });
choice('ch1.lost_choice', '忘れ物を、どう取り扱いますか？', [
  opt('record', '「預かって遺失物台帳に記録し、保管場所を事務室に引き継ぐ」', 'ch1.lost_r1', { tone: 'honest', effects: [ev('accuracy', 3), ev('reporting', 2), time(10)] }),
  opt('announce', '「放送で持ち主に呼びかけ、その場で待つ」', 'ch1.lost_r2', { tone: 'caring', effects: [ev('service', 2), ev('reporting', -1), time(10)] }),
  opt('chase', '「手がかりを探して、駅を出た持ち主を追いかける」', 'ch1.lost_r3', { tone: 'risky', effects: [ev('safety', -3), ev('service', 1), time(15)] })
], { view: v3('npc:lost_item') });
line('ch1.lost_r1', [['kubota', 'その通りです。台帳に残せば、誰が見ても分かります。持ち主が来たときも、別の担当者が対応できます。', 'smile']], 'ch1.lost_end');
line('ch1.lost_r2', [['kubota', '放送も一つの方法ですが、ホームに残って待つと、他の業務が止まります。台帳に記録して、事務室で預かる形が基本です。']], 'ch1.lost_end');
line('ch1.lost_r3', [['kubota', '駅を離れるのは危険ですし、その間の業務が滞ります。持ち主を探すことと、業務を守ることを分けて考えましょう。', 'serious']], 'ch1.lost_end');
fx('ch1.lost_end', [set('ch1.lost_done'), log('忘れ物（折りたたみ傘）の取扱い', 'work')], 'ch1.hub');

// ---- 遅延（10:40）：時間依存分岐 ----
branch('ch1.delay_gate', [[T('>=', hm(11, 5)), 'ch1.delay_late']], 'ch1.delay_intro');
line('ch1.delay_intro', [
  '10時40分。構内に接近の案内放送が流れる。発車標の表示が切り替わった。',
  ['kubota', '青海本線下りに、遅れが出ています。運行情報を見ながら、お客様に答えてください。'],
  ['traveler', 'すみません。11時5分の空港連絡線に乗り換えたいんですが、この遅れで間に合いますか？', 'worry'],
  ['kubota', '（端末の第一報には「車両点検のため約10分の遅れ。見込みは変更の可能性あり」と出ている）']
], 'ch1.delay_choice', { view: v3('npc:traveler', '改札口 10:40') });
choice('ch1.delay_choice', '旅行客に、どう答えますか？', [
  opt('careful', '「運行情報と指令に確認してから、正確にお伝えします」', 'ch1.delay_careful', { tone: 'careful', effects: [time(4), ev('accuracy', 5), ev('service', 1), rel('hamaguchi', 1, 0), set('ch1.delay_verified')] }),
  opt('quick', '「第一報では約10分です。たぶん間に合いますよ」', 'ch1.delay_quick', { tone: 'risky', effects: [ev('service', 2), ev('accuracy', -2), set('ch1.guessed_info')] }),
  opt('ask', '「久保田さん、確認をお願いできますか」', 'ch1.delay_asked', { tone: 'neutral', effects: [ev('reporting', 3), ev('service', -1), rel('kubota', 1, 0), set('ch1.delay_asked')] })
], { important: true, timeLimit: 25, defaultOption: 'ask', view: v3('npc:traveler') });
line('ch1.delay_careful', [
  ['hamaguchi', '輸送指令の浜口です。第一報は約10分ですが、点検が長引いています。あくまで見込みですが、12分前後を見ておいてください。'],
  ['traveler', '12分だと、乗り換えは厳しそうですね…', 'worry'],
  ['kubota', '確定ではないと前置きして、次の空港連絡線の発車時刻を案内しましょう。'],
  ['traveler', '正直に言ってもらえて助かります。次の便に変更します。ありがとう。', 'smile']
], 'ch1.announce_task', { effects: [rel('traveler', 1, 0)] });
line('ch1.delay_quick', [
  ['traveler', 'たぶん、ですか。それなら…急ぎます、ありがとう。', 'normal'],
  '旅行客は急ぎ足でホームへ向かった。後ろで、久保田が端末の画面を見つめている。',
  ['kubota', '…見込みが変わりました。いま12分に更新されています。'],
  '11時10分。改札に戻ってきた旅行客は、肩を落としていた。',
  ['traveler', '言われた通り急いだのに、乗り換えに間に合いませんでした。「たぶん」と言われたから信じたのに。', 'worry']
], 'ch1.delay_quick_choice', { effects: [set('ch1.delay_missed_conn'), time(15)] });
choice('ch1.delay_quick_choice', '旅行客に、どう対応しますか？', [
  opt('admit', '「私の案内が不正確でした。申し訳ありません。すぐ次の便をご案内し、上司にも報告します」', 'ch1.dq_admit', { tone: 'honest', effects: [ev('reporting', 6), ev('service', 1), rel('kubota', 2, 1), rel('shiraishi', 1, 0), set('ch1.admitted_error')] }),
  opt('blame', '「第一報がそうだったので…運行情報が変わったのは私のせいではありません」', 'ch1.dq_blame', { tone: 'risky', effects: [ev('reporting', -6), ev('accuracy', -2), ev('service', -2), rel('kubota', -2, 0), set('ch1.blamed'), set('legacy.concealed')] }),
  opt('silent', '「次の便をご案内します」（誤りには触れずに案内）', 'ch1.dq_silent', { tone: 'neutral', effects: [ev('reporting', -4), rel('kubota', -1, 0), set('ch1.silent_error'), set('legacy.concealed')] })
]);
line('ch1.dq_admit', [['traveler', '…分かりました。正直に言ってくれて、少しだけ気が楽になりました。次の便を教えてください。'], ['kubota', 'よく言いました。誤りを認めるのは、報告の第一歩です。あとで駅長にも一緒に話しましょう。']], 'ch1.announce_task');
line('ch1.dq_blame', [['traveler', '責任の話はしていません。誰のせいかではなく、次をどうするかを教えてください。', 'serious'], ['kubota', '（険しい表情で一歩前に出る）お客様、失礼しました。次の便をご案内します。'], ['kubota', 'あとで、あなたと話します。', 'serious']], 'ch1.announce_task');
line('ch1.dq_silent', [['traveler', '次の便…分かりました。', 'normal'], ['kubota', '（あなたの顔をちらりと見たが、何も言わなかった）']], 'ch1.announce_task');
line('ch1.delay_asked', [
  ['kubota', '分かりました。お客様、少しお待ちください。（端末と指令に確認する）'],
  ['hamaguchi', '輸送指令の浜口です。第一報は約10分、実際は12分前後になりそうです。確定ではありません。'],
  ['kubota', 'お客様、見込みでは12分前後です。乗り換えが厳しい可能性があるので、次の便もご案内します。'],
  ['kubota', 'いまのは、確定と見込みを分けて話す手順です。あなたも、次は自分でやってみましょう。']
], 'ch1.announce_task', { effects: [set('ch1.delay_asked_flag')] });
line('ch1.delay_late', [
  '11時を過ぎていた。久保田がすでに改札で旅行客に対応を始めている。',
  ['kubota', '遅れて来たのは仕方ありません。次のお客様の対応をお願いします。放送の文面は、あなたが作ってください。', 'serious'],
  ['kubota', '（手元の端末を見せながら）確定と見込みを分けて、お詫びと案内を含めてください。']
], 'ch1.announce_task', { effects: [ev('teamwork', 1), ev('service', -1), set('ch1.delay_late')] });

N['ch1.announce_task'] = {
  id: 'ch1.announce_task', type: 'task', kind: 'compose', title: '遅延案内放送の作成', intro: '4つの要素から、適切な文を選んでください。',
  slots: [
    { id: 'apology', label: 'お詫び', options: [
      { id: 'a1', text: 'お急ぎのところ、ご迷惑をおかけして申し訳ございません。', good: true, why: '丁寧で簡潔なお詫びです。' },
      { id: 'a2', text: '遅れていますが、ご了承ください。', good: false, why: 'お詫びがなく、お客様への配慮に欠けます。' },
      { id: 'a3', text: '電車の遅れは当駅の責任ではありません。', good: false, why: '責任の所在を放送で述べる必要はありません。' }] },
    { id: 'cause', label: '状況', options: [
      { id: 'c1', text: '車両の点検のため、遅れが生じております。', good: true, why: '確認された情報だけを伝えています。' },
      { id: 'c2', text: '信号機の故障のため、遅れております。', good: false, why: '確認されていない原因を述べるのは誤案内です。' },
      { id: 'c3', text: '原因は分かりません。', good: false, why: '把握している情報（車両点検）を伝えるべきです。' }] },
    { id: 'estimate', label: '見込み', options: [
      { id: 'e1', text: '現在のところ、約10分から15分の遅れが見込まれます。変更があり次第お知らせします。', good: true, why: '見込みと更新の予告を分けて伝えています。' },
      { id: 'e2', text: '5分ほどで運転を再開いたします。', good: false, why: '根拠のない断定です。' },
      { id: 'e3', text: '見込みは一切お答えできません。', good: false, why: '分かる範囲の情報提供が必要です。' }] },
    { id: 'guide', label: 'ご案内', options: [
      { id: 'g1', text: 'お乗り換えのお客様は、駅係員までお尋ねください。', good: true, why: '次の行動を示す案内です。' },
      { id: 'g2', text: 'ご自身で運行情報をお調べください。', good: false, why: '案内を放棄しています。' },
      { id: 'g3', text: '改札付近でお待ちください。', good: false, why: '行き先も理由も示されていません。' }] }
  ],
  results: [
    { min: 75, goto: 'ch1.ann_good', effects: [ev('service', 3), ev('accuracy', 3)] },
    { min: 50, goto: 'ch1.ann_mid', effects: [ev('service', 1), ev('accuracy', 1)] },
    { min: 0, goto: 'ch1.ann_bad', effects: [ev('service', -2), ev('accuracy', -3)] }
  ],
  view: v3('npc:shiraishi', '駅事務室 放送設備')
};
line('ch1.ann_good', [['kubota', 'そのまま流せる放送です。確定・見込み・次の行動が過不足なく入っています。', 'smile']], 'ch1.delay_done');
line('ch1.ann_mid', [['kubota', '惜しいですね。事実と見込みを混ぜないよう、もう少し言葉を選びましょう。']], 'ch1.delay_done');
line('ch1.ann_bad', [['kubota', '放送は、一度流れると取り消せません。次は私が文面を確認します。', 'serious']], 'ch1.delay_done');
fx('ch1.delay_done', [set('ch1.delay_done'), time(10), tr('station_basic', 10), log('列車遅延時の旅客対応と案内放送', 'work')], 'ch1.hub');

// ---- 昼休憩 ----
line('ch1.lunch', ['12時。昼休憩の時間になった。'], 'ch1.lunch_choice', { view: v3('npc:kubota', '駅事務室 休憩') });
choice('ch1.lunch_choice', '昼休憩を、誰とどう過ごしますか？', [
  opt('kubota', '久保田さんと一緒に食べる', 'ch1.lunch_k', { tone: 'caring', effects: [rel('kubota', 0, 2), set('ch1.lunch_kubota')] }),
  opt('yamashina', '山科さんと一緒に食べる', 'ch1.lunch_y', { tone: 'caring', effects: [rel('yamashina', 0, 2), set('ch1.lunch_yamashina')] }),
  opt('alone', '事務室で午前の内容を復習する', 'ch1.lunch_a', { tone: 'careful', effects: [ev('accuracy', 2), ev('teamwork', -1), set('ch1.lunch_alone')] })
]);
line('ch1.lunch_k', [['kubota', '私が新人のとき、先輩に言われたんです。「仕事は、聞かれる前に報告するほど楽になる」って。実践すると、本当にそうでした。', 'smile']], 'ch1.lunch_end');
line('ch1.lunch_y', [['yamashina', '来週の土曜、青浜総合車両センターで見学会があるんだ。社員向けの公募で。行きたいけど、一人だと気後れして。'], ['yamashina', '今日の仕事が落ち着いたら、改めて誘うよ。']], 'ch1.lunch_end', { effects: [set('ch1.yama_invite_hint')] });
line('ch1.lunch_a', ['一人でノートを広げ、午前の判断の理由を書き出した。静かな時間が流れた。'], 'ch1.lunch_end');
fx('ch1.lunch_end', [set('ch1.lunch_done'), time(45), log('昼休憩', 'work')], 'ch1.hub');

// ---- 14:00 山科の誘い ----
line('ch1.yama_ask', [['yamashina', '（駅事務室の前で）あのさ、来週の土曜に青浜の車両基地で見学会があるんだ。社員向けで、1日。一緒に行かないか？', 'smile'], ['yamashina', '返事は終業後でいい。久保田さんにも相談してみて。']], 'ch1.hub', { effects: [set('ch1.yama_invite'), rel('yamashina', 0, 1)], view: v3('npc:yamashina', '14:00') });

// ---- 終業面談（2.5D） ----
line('ch1.closing', ['17時。業務の終わりに、駅事務室で白石駅長と久保田が待っていた。'], 'ch1.closing_b1', { view: v25('office', ['shiraishi', 'kubota'], '17:00 駅事務室'), effects: [{ clock: { minute: hm(17, 0) } }] });
branch('ch1.closing_b1', [[F('ch1.admitted_error'), 'ch1.cl_admit'], [F('ch1.blamed'), 'ch1.cl_blame'], [F('ch1.silent_error'), 'ch1.cl_silent'], [F('ch1.delay_verified'), 'ch1.cl_careful']], 'ch1.cl_generic');
line('ch1.cl_admit', [['shiraishi', '久保田から聞いた。案内の誤りは起きる。大事なのは、誤りを自分から報告できたことだ。', 'smile'], ['kubota', '見込みの案内は、次からは「確定ではありません」と一言添えましょう。']], 'ch1.closing2', { view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.cl_blame', [['shiraishi', '今日のことで、一つ話がある。旅行客への対応のことだ。', 'serious'], ['kubota', '運行情報が変わるのは、誰のせいでもありません。でも、その場で責任の話をするのは、お客様の役に立ちません。'], ['shiraishi', '誰かのせいにしたくなる気持ちは分かる。だが、現場では一度の言い訳が信頼を大きく削る。明日から、報告を意識しよう。']], 'ch1.closing2', { view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.cl_silent', [['shiraishi', '案内の件、記録に目を通した。報告がなかった理由を、聞かせてほしい。', 'serious'], ['kubota', '責めるつもりはありません。ただ、記録と現場の様子が合わないと、次に同じ誤りを防げないんです。']], 'ch1.closing2', { view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.cl_careful', [['shiraishi', '遅延時の対応、確認してから答えたと聞いた。見込みと確定を分けた案内は、お客様の信頼につながる。', 'smile'], ['kubota', '今日の判断、私は好きでしたよ。']], 'ch1.closing2', { view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.cl_generic', [['shiraishi', '初日にしては、よく動いた。細かい点は、久保田から追って共有する。'], ['kubota', '今日の記録は、私が確認しておきます。']], 'ch1.closing2', { view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.closing2', [
  ['shiraishi', '評価は、毎日ついて回る。今日の結果は、評価表と勤務記録に残る。異動の話はまだ先だが、評価が土台になる。'],
  ['kubota', 'ところで週末は、公休です。もし良ければ、券売機と窓口の自主練習を一緒にやりませんか。私も新人のときは、先輩に付き合ってもらいました。'],
  ['yamashina', '（部屋に顔を出して）…例の基地見学会、返事を聞いてもいいか？']
], 'ch1.closing_choice', { view: v25('office', ['shiraishi', 'kubota', 'yamashina']) });
choice('ch1.closing_choice', '週末の過ごし方を決めよう。', [
  opt('mentor', '久保田さんの自主練習に参加する', 'ch1.cc_mentor', { tone: 'careful', effects: [set('legacy.mentor_line'), rel('kubota', 2, 1), sk('ticket', 5), tr('station_basic', 25), tl('4月3日 久保田の自主練習に参加')] }),
  opt('depot', '山科さんと車両基地の見学会に参加する', 'ch1.cc_depot', { tone: 'caring', requires: F('ch1.yama_invite'), effects: [set('legacy.depot_tour'), rel('yamashina', 2, 2), sk('depot', 4), tr('depot_intro', 25), tl('4月10日 車両基地の見学会に参加')] }),
  opt('rest', '公休はしっかり休む', 'ch1.cc_rest', { tone: 'neutral', effects: [set('legacy.rested'), ev('safety', 2), rel('kubota', 0, 0)] })
], { important: true, view: v25('office', ['kubota', 'yamashina']) });
line('ch1.cc_mentor', [['kubota', '決まりですね。土曜は券売機の障害対応を実演しましょう。', 'smile'], ['yamashina', '…そっか。じゃあ、見学会の話は聞かせるよ。']], 'ch1.closing3', { view: v25('office', ['kubota', 'yamashina']) });
line('ch1.cc_depot', [['yamashina', '本当か！ 助かる。集合は朝8時、青浜駅の改札前だ。', 'smile'], ['kubota', '見学は良い経験です。ただ、戻ったら必ず、学んだことを駅の仕事にどう生かすか、聞かせてくださいね。']], 'ch1.closing3', { view: v25('office', ['kubota', 'yamashina']) });
line('ch1.cc_rest', [['shiraishi', '休むのも仕事のうちだ。次の勤務に備えなさい。'], ['yamashina', '分かった。見学会は、俺一人で行ってくるよ。']], 'ch1.closing3', { view: v25('office', ['shiraishi', 'yamashina']) });
branch('ch1.closing3', [[F('legacy.wish_depot'), 'ch1.wn_depot'], [F('legacy.wish_station'), 'ch1.wn_station'], [F('legacy.wish_planning'), 'ch1.wn_plan']], 'ch1.wn_open');
line('ch1.wn_depot', [['shiraishi', '面談記録を見たよ。車両や設備への関心があるそうだな。基地への異動には、駅務基礎の修了、基地入門の研修、安全・正確さの評価が必要だ。今日の評価と合わせて、足りない点は人事課と見ておくといい。']], 'ch1.end', { view: v25('office', ['shiraishi']) });
line('ch1.wn_station', [['shiraishi', '駅で接客を極めたいという希望だったな。専門を深める道も立派な進路だ。評価と資格を重ねれば、駅の専門職として任せる仕事も増えていく。']], 'ch1.end', { view: v25('office', ['shiraishi']) });
line('ch1.wn_plan', [['shiraishi', '計画の仕事に関心があるそうだな。企画系の部署は、現場経験と報連相の評価が見られる。まずは駅で、お客様と運行の関係を体で覚えなさい。']], 'ch1.end', { view: v25('office', ['shiraishi']) });
line('ch1.wn_open', [['shiraishi', '希望が決まっていないのは、悪いことではない。経験の中で見えてくる。ただ、動けば道は開ける。小さな実績を積みなさい。']], 'ch1.end', { view: v25('office', ['shiraishi']) });

N['ch1.end'] = {
  id: 'ch1.end', type: 'end', chapter: 'ch1', title: '第1章 新しい名札', nextChapter: 'ch2',
  summary: '勤務初日が終わった。今日の判断は、評価・人物関係・経歴として記録され、次の章に引き継がれる。',
  effects: [tl('4月2日 勤務初日を終える'), log('第1章を終了', 'chapter')]
};

// ============ 第2章 冒頭（体験版）：第1章の選択が後続に影響 ============
branch('ch2.open', [[F('legacy.depot_tour'), 'ch2.depot'], [F('legacy.mentor_line'), 'ch2.mentor']], 'ch2.rest', { effects: [{ clock: { addDay: 2, minute: hm(8, 0) } }] });
line('ch2.depot', [
  '4月10日（土）。青浜総合車両センターの見学会。整然と並ぶ留置線の向こうで、検修庫のシャッターが開いている。',
  ['yamashina', 'この床下機器、図面で見るのと全然違うな…。', 'smile'],
  ['yamashina', '駅の仕事を覚えるのが先なのは分かってる。でも、ここで働きたい気持ちは、やっぱり本物だ。']
], 'ch2.mon', { effects: [set('next.depot_seed'), set('ch2.saw_depot'), rel('yamashina', 1, 1)], view: v25('depot', ['yamashina'], '4月10日（土） 青浜総合車両センター') });
line('ch2.mentor', [
  '4月3日（土）。誰もいない駅の券売機の前で、久保田と並んで操作を繰り返した。',
  ['kubota', '障害時の案内手順、頭に入りましたね。実際に起きたときに、同じ冷静さで動けるといいのですが。', 'smile']
], 'ch2.mon', { effects: [set('next.mentor_seed'), sk('ticket', 3)], view: v25('office', ['kubota'], '4月3日（土）') });
line('ch2.rest', ['週末は、体を休めることに使った。月曜の勤務に備えて、早めに眠った。'], 'ch2.mon', { effects: [set('next.rest_seed'), ev('safety', 1)], view: v25('hr', [], '週末') });
branch('ch2.mon', [[F('legacy.concealed'), 'ch2.audit'], [F('legacy.helped_kajiwara'), 'ch2.kaji']], 'ch2.plain');
line('ch2.audit', [['shiraishi', '先週の旅行客への対応記録と、実際の運行情報の時刻に食い違いがあった。報告が遅れた経緯を、もう一度整理したい。', 'serious'], ['kubota', '私も同席します。責めるためではなく、次に同じことが起きないようにするためです。']], 'ch2.tail', { effects: [set('next.audit'), ev('reporting', -1)], view: v25('office', ['shiraishi', 'kubota'], '月曜 17:00') });
line('ch2.kaji', [['kajiwara', 'こないだはありがとうね。あなたの名前、覚えたわよ。これ、うちの庭で採れた柑橘。みなさんで食べてちょうだい。', 'smile'], ['shiraishi', '利用者さんからの差し入れは、基本的にいただけない決まりだが…ご厚意だ。事務室で記録して、皆で分けよう。']], 'ch2.tail', { effects: [set('next.kajiwara_return'), rel('kajiwara', 1, 1)], view: v25('office', ['kajiwara', 'shiraishi'], '月曜 10:00') });
line('ch2.plain', [['shiraishi', '先週はよく頑張った。今週は、早番の練習から始める。自分の勤務表を、前日の夜に必ず確認するように。']], 'ch2.tail', { effects: [set('next.plain')], view: v25('office', ['shiraishi'], '月曜 8:30') });
N['ch2.tail'] = N['ch2.tail'] ?? { id: 'ch2.tail', type: 'effect', effects: [log('第2章 冒頭を終了（体験版）', 'chapter')], next: 'ch2.end' };
N['ch2.end'] = {
  id: 'ch2.end', type: 'end', chapter: 'ch2', title: '第2章 最初の週末（体験版・冒頭のみ）',
  summary: '第1章の選択が、週末の過ごし方・人物関係・駅長の最初の言葉に影響しました。第2章の続き以降は未実装です。'
};

const chapters = [
  { id: 'ch1', title: '新しい名札', season: 'S1 新しい名札', start: 'ch1.p1', status: 'playable', synopsis: '入社式の翌日、青嶺中央駅での勤務初日。配属面談から終業面談までを実装済み。' },
  { id: 'ch2', title: '最初の週末', season: 'S1 新しい名札', start: 'ch2.open', status: 'teaser', synopsis: '第1章の選択が反映される冒頭のみ実装（体験版）。' },
  ...['はじめての早番', '同期の距離', '券売機のむこう側', '三か月目の面談', '夏の臨時列車', 'ホームの声', 'はじめての評価', '基地実習へ', '研修の最終日', '新しい名札'].map((t, i) => ({ id: 'ch' + (i + 3), title: t, season: 'S1 新しい名札', start: '', status: 'planned', synopsis: '企画のみ（未制作）。' }))
];

const story = { storyId: 'r7', mode: 'R7', title: '配属先は、明日変わる', subtitle: '超リアル社員異動・長編キャリア', startYear: 2027, characters, chapters, nodes: N };
mkdirSync('src/data/r7', { recursive: true });
writeFileSync('src/data/r7/story.json', JSON.stringify(story, null, 1));
console.log('nodes:', Object.keys(N).length);
