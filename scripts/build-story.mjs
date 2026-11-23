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
  kajiwara: { id: 'kajiwara', name: '梶原 トミ', kana: 'かじわら とみ', role: '利用者（常連）', dept: 'none', age: 78, years: 0, uniform: '#7a5a78', hair: '#d8d8d8', skin: '#ecc8a8', trait: '週に二度、通院で海浜口へ。機械は少し苦手。', bio: '青嶺中央駅の古い常連。駅員の顔をよく覚えている。', gender: 'f', accessory: 'cane', height: 0.94, visibleWhen: { any: [{ notFlag: 'ch1.kajiwara_done' }, { all: [{ time: { op: '>=', val: 810 } }, { time: { op: '<', val: 900 } }, { flag: 'legacy.helped_kajiwara' }, { notFlag: 'ch1.kaji2' }] }] } },
  hamaguchi: { id: 'hamaguchi', name: '浜口', kana: 'はまぐち', role: '輸送指令員（電話）', dept: 'dispatch', age: 41, years: 18, uniform: '#2a3d52', hair: '#222', skin: '#e9c7a2', trait: '電話口で簡潔。確定情報と見込みを必ず分けて伝える。', bio: '青海本線担当の輸送指令。', gender: 'm', accessory: 'none' },
  sakai: { id: 'sakai', name: '坂井 陽子', kana: 'さかい ようこ', role: '売店（委託）店員', dept: 'none', age: 46, years: 0, uniform: '#b8352c', hair: '#3a2a22', skin: '#f0cfae', trait: '明るく世話好き。駅の変化をよく見ている。', bio: '改札内の売店を10年担当。常連の顔を覚えている。', gender: 'f' },
  hinata: { id: 'hinata', name: 'ひなた', kana: 'ひなた', role: '迷子の小学生', dept: 'none', age: 8, years: 0, uniform: '#f2b134', hair: '#1c1c28', skin: '#f2d3b8', trait: '泣きそうなのを我慢している。', bio: '母親とはぐれた小学2年生。', gender: 'x', height: 0.66, visibleWhen: { all: [{ time: { op: '>=', val: 585 } }, { time: { op: '<', val: 650 } }, { notFlag: 'ch1.child_done' }] } },
  nomura: { id: 'nomura', name: '野村 清次', kana: 'のむら せいじ', role: '利用者（杖をつく高齢の方）', dept: 'none', age: 76, years: 0, uniform: '#6a5a4a', hair: '#d8d8d8', skin: '#e8c4a0', trait: '遠慮がちで、頼るのが苦手。', bio: '週に一度、海浜口の友人宅へ通う。', gender: 'm', accessory: 'cane', height: 0.96, visibleWhen: { all: [{ time: { op: '>=', val: 560 } }, { time: { op: '<', val: 640 } }, { notFlag: 'ch1.assist_done' }] } },
  haha: { id: 'haha', name: '母親（ベビーカー）', kana: 'ははおや', role: '利用者', dept: 'none', age: 31, years: 0, uniform: '#5c7a8a', hair: '#3a2a22', skin: '#f2d3b8', trait: '荷物が多く、時間に追われている。', bio: '生後半年の子を連れて通院する。', gender: 'f', accessory: 'bag', visibleWhen: { all: [{ time: { op: '>=', val: 860 } }, { time: { op: '<', val: 920 } }, { notFlag: 'ch1.stroller_done' }] } },
  tourist2: { id: 'tourist2', name: '外国の旅行客', kana: 'がいこくのりょこうきゃく', role: '利用者', dept: 'none', age: 28, years: 0, uniform: '#3a5a8a', hair: '#8a6a3a', skin: '#f3d6bd', trait: '日本語は少し。地図を見ながら困っている。', bio: '星峰線の観光列車に乗りたい。', gender: 'm', accessory: 'suitcase', visibleWhen: { all: [{ time: { op: '>=', val: 800 } }, { time: { op: '<', val: 860 } }, { notFlag: 'ch1.guide_done' }] } },
  ogawa: { id: 'ogawa', name: '小川 誠', kana: 'おがわ まこと', role: '利用者（会社員）', dept: 'none', age: 52, years: 0, uniform: '#4a4a52', hair: '#2a2a2a', skin: '#e8c29c', trait: '大事な会議の前で、気が立っている。', bio: '地域の再開発に関わる仕事をしている。', gender: 'm', accessory: 'bag', visibleWhen: { all: [{ time: { op: '>=', val: 840 } }, { time: { op: '<', val: 930 } }, { flag: 'route.service' }, { notFlag: 'ch1.angry_done' }] } },
  riku: { id: 'riku', name: '高校生', kana: 'こうこうせい', role: '利用者（高校2年生）', dept: 'none', age: 17, years: 0, uniform: '#3a4a6a', hair: '#1c1c28', skin: '#efc9a6', trait: '焦っていて、つい無茶をしそうになる。', bio: '通学で毎朝この駅を使う。', gender: 'm', visibleWhen: { all: [{ time: { op: '>=', val: 840 } }, { time: { op: '<', val: 930 } }, { flag: 'route.platform' }, { notFlag: 'ch1.cable_done' }] } },
  tachibana: { id: 'tachibana', name: '橘 源三', kana: 'たちばな げんぞう', role: '車両基地 検修長', dept: 'depot', age: 58, years: 38, uniform: '#2f4f6a', hair: '#9a9a96', skin: '#dcb48c', trait: '口数は少ないが、床下を見る目は確か。', bio: '青浜総合車両センターの検修長。新人を厳しく、そして温かく育てる。', gender: 'm', accessory: 'cap' },
  traveler: { id: 'traveler', name: '旅行客', kana: 'りょこうきゃく', role: '利用者', dept: 'none', age: 34, years: 0, uniform: '#3a6a5a', hair: '#5a3a2a', skin: '#f0d0b0', trait: '空港連絡線への乗り換えを急いでいる。', bio: '大きなスーツケースを持つ旅行者。', gender: 'f', accessory: 'suitcase', visibleWhen: { all: [{ any: [{ nodePrefix: 'ch1.delay' }, { nodePrefix: 'ch1.dq' }, { nodePrefix: 'ch1.announce' }, { nodePrefix: 'ch1.ann_' }] }, { notFlag: 'ch1.delay_done' }] } }
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
    { id: 'lost', object: 'lost_item', label: 'ベンチの忘れ物を確認する', goto: 'ch1.lost_1', requires: F('ch1.platform'), once: true, icon: '☂️' },
    { id: 'jam', object: 'vend3', label: '券売機3号機：券詰まりの対応', goto: 'ch1.jam_1', requires: ALL(F('ch1.tenko'), T('>=', hm(9, 0))), once: true },
    { id: 'assist', object: 'nomura', label: '杖をついた野村さんの乗車を手伝う', goto: 'ch1.assist_1', requires: ALL(F('ch1.tenko'), T('>=', hm(9, 20)), T('<', hm(10, 40))), once: true },
    { id: 'child', object: 'hinata', label: '泣いている子どもに声をかける', goto: 'ch1.child_1', requires: ALL(F('ch1.tenko'), T('>=', hm(9, 45)), T('<', hm(10, 50))), once: true },
    { id: 'refund', object: 'ticket_office', label: 'きっぷうりば：払い戻しの受付', goto: 'ch1.refund_1', requires: ALL(F('ch1.tenko'), T('>=', hm(10, 10))), once: true },
    { id: 'shopnote', object: 'sakai', label: '売店の坂井さんから届け物の相談', goto: 'ch1.shop_1', requires: ALL(F('ch1.tenko'), T('>=', hm(11, 20))), once: true },
    { id: 'toilet', object: 'toilet', label: 'トイレの定期点検', goto: 'ch1.wc_1', requires: ALL(F('ch1.tenko'), T('>=', hm(11, 40))), once: true },
    { id: 'phone', object: 'phone', label: '指令直通電話に応答する', goto: 'ch1.phone_1', requires: ALL(F('ch1.tenko'), T('>=', hm(13, 0)), F('ch1.delay_done')), once: true },
    { id: 'guide', object: 'tourist2', label: '外国の旅行客を案内する', goto: 'ch1.guide_1', requires: ALL(F('ch1.tenko'), T('>=', hm(13, 20)), T('<', hm(14, 20))), once: true },
    { id: 'kaji2', object: 'kajiwara', label: '梶原さんと再会する', goto: 'ch1.kaji2_1', requires: ALL(F('ch1.tenko'), F('legacy.helped_kajiwara'), T('>=', hm(13, 30)), T('<', hm(15, 0))), once: true },
    { id: 'patrol2', object: 'emergency_btn', label: '午後のホーム巡回（非常停止ボタン等）', goto: 'ch1.patrol2_1', requires: ALL(F('ch1.platform'), T('>=', hm(13, 30))), once: true },
    { id: 'stroller', object: 'haha', label: 'ベビーカーのお客様の乗降を見守る', goto: 'ch1.stroller_1', requires: ALL(F('ch1.tenko'), T('>=', hm(14, 20)), T('<', hm(15, 20))), once: true },
    { id: 'gatecheck', object: 'gate_wide', label: '改札機の動作点検', goto: 'ch1.gate_1', requires: ALL(F('ch1.tenko'), T('>=', hm(14, 45))), once: true },
    { id: 'announce2', object: 'mic', label: '定時のホーム安全放送を作る', goto: 'ch1.ann2_task', requires: ALL(F('ch1.tenko'), T('>=', hm(15, 10))), once: true },
    { id: 'refill', object: 'vend1', label: '券売機1号機：券紙の補充', goto: 'ch1.refill_1', requires: ALL(F('ch1.tenko'), T('>=', hm(15, 30))), once: true },
    { id: 'finalcheck', object: 'elevator', label: '終業前の施設点検（エレベーター・AED）', goto: 'ch1.final_1', requires: ALL(F('ch1.tenko'), T('>=', hm(15, 50))), once: true }
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
    { id: 'g_lost', label: '（任意）忘れ物の取扱い', when: F('ch1.lost_done'), optional: true },
    { id: 'g_jam', label: '（依頼）券売機3号機の券詰まり', when: F('ch1.jam_done'), optional: true, showWhen: T('>=', hm(9, 0)) },
    { id: 'g_assist', label: '（依頼）杖のお客様の乗車の手伝い', when: F('ch1.assist_done'), optional: true, showWhen: T('>=', hm(9, 20)) },
    { id: 'g_child', label: '（依頼）泣いている子どもへの対応', when: F('ch1.child_done'), optional: true, showWhen: T('>=', hm(9, 45)) },
    { id: 'g_refund', label: '（依頼）払い戻しの受付', when: F('ch1.refund_done'), optional: true, showWhen: T('>=', hm(10, 10)) },
    { id: 'g_shop', label: '（依頼）売店からの届け物', when: F('ch1.shop_done'), optional: true, showWhen: T('>=', hm(11, 20)) },
    { id: 'g_wc', label: '（定期）トイレ点検', when: F('ch1.wc_done'), optional: true, showWhen: T('>=', hm(11, 40)) },
    { id: 'g_phone', label: '（依頼）指令からの電話', when: F('ch1.phone_done'), optional: true, showWhen: T('>=', hm(13, 0)) },
    { id: 'g_guide', label: '（依頼）外国の旅行客の案内', when: F('ch1.guide_done'), optional: true, showWhen: T('>=', hm(13, 20)) },
    { id: 'g_patrol2', label: '（定期）午後のホーム巡回', when: F('ch1.patrol2_done'), optional: true, showWhen: T('>=', hm(13, 30)) },
    { id: 'g_stroller', label: '（依頼）ベビーカーのお客様の見守り', when: F('ch1.stroller_done'), optional: true, showWhen: T('>=', hm(14, 20)) },
    { id: 'g_gate', label: '（定期）改札機の動作点検', when: F('ch1.gate_done'), optional: true, showWhen: T('>=', hm(14, 45)) },
    { id: 'g_ann2', label: '（定時）ホーム安全放送', when: F('ch1.ann2_done'), optional: true, showWhen: T('>=', hm(15, 10)) },
    { id: 'g_refill', label: '（定期）券紙の補充', when: F('ch1.refill_done'), optional: true, showWhen: T('>=', hm(15, 30)) },
    { id: 'g_final', label: '（終業前）施設の最終点検', when: F('ch1.final_done'), optional: true, showWhen: T('>=', hm(15, 50)) }
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


// ============ 追加の依頼（時間経過で出現）============
const done = (flag, minutes, text, extra = []) => [set(flag), { var: { key: 'ch1.extra', add: 1 } }, time(minutes), log(text, 'work'), ...extra];
const chk = (id, title, intro, items, results, labels) => (N[id] = { id, type: 'task', kind: 'checklist', title, intro, items, results, config: { labels }, view: v3('follow', title) });
const res3 = (goodNext, midNext, badNext, ge = [], me = [], be = []) => [{ min: 80, goto: goodNext, effects: ge }, { min: 50, goto: midNext, effects: me }, { min: 0, goto: badNext, effects: be }];

// 1) 券売機の券詰まり
line('ch1.jam_1', [['kubota', '3号機が「券詰まり」を出しています。お客様が少ない今のうちに復旧しましょう。手順を一つずつ確認します。']], 'ch1.jam_task', { view: v3('npc:vend3', '券売機3号機') });
chk('ch1.jam_task', '券詰まり復旧の手順確認', '各項目が、手順として適切か不適切かを判断してください。', [
  { id: 'a', label: '使用停止にして「調整中」の掲示を出してから作業する', truth: 'ok', why: '稼働中に作業すると、お客様の誤操作や接触事故につながります。' },
  { id: 'b', label: 'お客様が並んでいるので、停止せずに券紙を引き抜く', truth: 'ng', why: '稼働中の機械内部に触れるのは危険です。' },
  { id: 'c', label: '現金部の扉は、担当者の確認なしで開けて点検する', truth: 'ng', why: '現金部は管理が必要です。必ず担当者と一緒に確認します。' },
  { id: 'd', label: '復旧後は試験発券を行い、正常に動作することを確認する', truth: 'ok', why: '復旧したつもりでも、実際に発券して確認しないと再発に気づけません。' },
  { id: 'e', label: '復旧した内容を、時刻とともに端末へ記録する', truth: 'ok', why: '記録があれば、次の担当者や保守担当が状況を把握できます。' }
], res3('ch1.jam_good', 'ch1.jam_mid', 'ch1.jam_bad', [ev('accuracy', 3), sk('ticket', 4), ev('safety', 2)], [ev('accuracy', 1), sk('ticket', 2)], [ev('safety', -2)]), ['適切', '不適切']);
line('ch1.jam_good', [['kubota', 'その順番を守れば、安全に復旧できます。次は一人でやってみましょう。', 'smile']], 'ch1.jam_end'); line('ch1.jam_mid', [['kubota', '惜しいところがあります。危険な手順は理由と一緒に覚えましょう。']], 'ch1.jam_end'); line('ch1.jam_bad', [['kubota', '券詰まりの復旧では、安全が最優先です。もう一度、一緒に手順を確認しましょう。', 'serious']], 'ch1.jam_end');
fx('ch1.jam_end', done('ch1.jam_done', 20, '券売機3号機の券詰まりを復旧'), 'ch1.hub');

// 2) 杖をついたお客様の乗車の手伝い（2段階の選択）
line('ch1.assist_1', [['nomura', 'すまんね、ホームまで階段が続くのは、膝に響いてね。エレベーターはどこにあるのかな。', 'worry']], 'ch1.assist_c1', { view: v3('npc:nomura', 'コンコース') });
choice('ch1.assist_c1', '野村さんに、どう対応しますか？', [
  opt('lead', '「エレベーターまでご案内し、ホームまでご一緒します」', 'ch1.assist_2', { tone: 'caring', effects: [time(12), ev('service', 4), rel('nomura', 2, 2)] }),
  opt('say', '「エレベーターは、入口の右手にあります」と口頭で伝える', 'ch1.assist_2b', { tone: 'quick', effects: [time(3), ev('service', 1)] }),
  opt('arm', '「階段の手すり側で、腕におつかまりください」', 'ch1.assist_2c', { tone: 'risky', effects: [time(8), ev('safety', -2), rel('nomura', 0, 1)] })
], { view: v3('npc:nomura') });
line('ch1.assist_2', [['nomura', 'ありがたいね。ホームでは、どこで待てばいいのかな。']], 'ch1.assist_c2', { effects: [set('ch1.assist_led')] });
line('ch1.assist_2b', [['nomura', 'そうか、ありがとう。…でも、ホームまで一人で行けるか少し不安でね。']], 'ch1.assist_c2');
line('ch1.assist_2c', [['kubota', '（そっと近づいて）階段の昇降はお客様の負担が大きいので、エレベーターの利用をおすすめするほうが安全です。']], 'ch1.assist_c2');
choice('ch1.assist_c2', 'ホームでの乗車について、どうしますか？', [
  opt('report', '「乗務員に連絡して、乗降の介助を依頼します」', 'ch1.assist_3a', { tone: 'honest', effects: [ev('reporting', 4), ev('safety', 2), rel('nomura', 1, 0)] }),
  opt('self', '「私が手を貸して、お乗せします」', 'ch1.assist_3b', { tone: 'risky', effects: [ev('safety', -2), ev('service', 1)] }),
  opt('see', '「ホームの安全な位置までお連れして、見送ります」', 'ch1.assist_3c', { tone: 'neutral', effects: [ev('service', 1), ev('reporting', -1)] })
]);
line('ch1.assist_3a', [['nomura', '乗務員さんも手伝ってくれるのかい。助かるよ。気をつけて行ってくるよ。', 'smile'], ['kubota', '乗務員への連絡は、ためらわずに早めに。介助の準備ができます。']], 'ch1.assist_end');
line('ch1.assist_3b', [['kubota', '乗降のときは、ホームと列車の隙間や段差があります。介助は乗務員と連携して行います。次回は連絡を先に。', 'serious']], 'ch1.assist_end');
line('ch1.assist_3c', [['nomura', 'ありがとう。ここなら、乗り降りも楽そうだ。'], ['kubota', '見送った後でも、次の駅への連絡があると、降りる駅で待ってもらえます。']], 'ch1.assist_end');
fx('ch1.assist_end', done('ch1.assist_done', 5, '杖をついたお客様の乗車を手伝う', [{ skill: { key: 'service', add: 2 } }]), 'ch1.hub');

// 3) 迷子（2段階）
line('ch1.child_1', [['hinata', '（うつむいて）…お母さんが、いない。', 'worry'], ['kubota', '券売機の前で、一人でいたそうです。まず落ち着いて、お名前を聞きましょう。']], 'ch1.child_c1', { view: v3('npc:hinata', '券売機前') });
choice('ch1.child_c1', 'ひなたさんに、どう対応しますか？', [
  opt('stay', '目線を合わせて話を聞き、事務室で保護して保護者を待つ', 'ch1.child_2a', { tone: 'caring', effects: [time(10), ev('service', 3), ev('safety', 2), rel('hinata', 2, 2)] }),
  opt('page', '放送で保護者を呼び出し、その場で一緒に待つ', 'ch1.child_2b', { tone: 'careful', effects: [time(8), ev('service', 2), ev('reporting', 1)] }),
  opt('search', '一緒に構内を歩いて、保護者を探して回る', 'ch1.child_2c', { tone: 'risky', effects: [time(15), ev('safety', -2), rel('hinata', 1, 1)] })
], { view: v3('npc:hinata') });
line('ch1.child_2a', [['hinata', 'お兄ちゃん、あのね、お母さんとお買い物に行く約束だったの。'], ['kubota', '放送で保護者の方に事務室へお越しいただくよう案内します。']], 'ch1.child_3');
line('ch1.child_2b', [['kubota', '放送の文面は、お子さんの特徴を伝えすぎず、事務室で保護していることを伝えます。']], 'ch1.child_3');
line('ch1.child_2c', [['kubota', '駅の中を歩き回ると、すれ違いになりやすいです。保護者が探しに来る場所で待つのが基本です。', 'serious']], 'ch1.child_3');
line('ch1.child_3', [['hinata', '（母親が駆け寄り）ひなた！ ごめんね、ごめんね。', 'worry'], ['hinata', 'お母さん！', 'smile'], ['kubota', '落ち着いて対応できましたね。こういうときは、保護者の方の気持ちも受け止めます。']], 'ch1.child_end', { effects: [set('legacy.child_helped')] });
fx('ch1.child_end', done('ch1.child_done', 5, '迷子の対応（保護者へ引き渡し）'), 'ch1.hub');

// 4) 払い戻しの受付（確認項目）
line('ch1.refund_1', [['kubota', '窓口でお客様が、使わなかった乗車券の払い戻しを希望しています。取扱いの前に確認することを選んでください。']], 'ch1.refund_task', { view: v3('npc:shiraishi', 'きっぷうりば') });
chk('ch1.refund_task', '払い戻しの確認項目', '払い戻しの取扱いで、確認が必要な項目を選んでください。', [
  { id: 'a', label: '乗車券の有効期間と区間が、払い戻しの対象か', truth: 'ok', why: '期限切れ・使用済みは、払い戻せないことがあります。' },
  { id: 'b', label: 'お客様が急いでいるので、券面は確認せず現金を渡す', truth: 'ng', why: '券面の確認は省けません。誤払いの原因です。' },
  { id: 'c', label: '払い戻し手数料（架空：220円）を説明し、了承を得る', truth: 'ok', why: '手数料を説明せず差し引くと、トラブルになります。' },
  { id: 'd', label: '払い戻した記録を、日時・券種・金額で台帳に残す', truth: 'ok', why: '記録は、後から確認するために必要です。' }
], res3('ch1.refund_good', 'ch1.refund_mid', 'ch1.refund_bad', [ev('accuracy', 3), ev('service', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]), ['確認が必要', '不要・不適切']);
line('ch1.refund_good', [['shiraishi', '窓口は、お金を預かる仕事だ。丁寧さが、そのまま信頼になる。']], 'ch1.refund_end'); line('ch1.refund_mid', [['shiraishi', '確認の抜けは、後で訂正になる。次は声に出して確認しよう。']], 'ch1.refund_end'); line('ch1.refund_bad', [['shiraishi', '現金の取扱いは、特に慎重に。私が確認し直そう。', 'serious']], 'ch1.refund_end');
fx('ch1.refund_end', done('ch1.refund_done', 15, '払い戻しを受け付ける'), 'ch1.hub');

// 5) 売店からの届け物
line('ch1.shop_1', [['sakai', 'ごめんなさい、お客さんの忘れ物かしら。レジの下に、財布が置いてあったの。', 'worry'], ['sakai', '駅員さんに渡せば、持ち主に返せるのよね？']], 'ch1.shop_c', { view: v3('npc:sakai', '売店') });
choice('ch1.shop_c', '財布を、どう取り扱いますか？', [
  opt('book', '「預かって、遺失物台帳に記録し、事務室で保管します」', 'ch1.shop_r1', { tone: 'honest', effects: [ev('accuracy', 3), ev('reporting', 2), rel('sakai', 1, 1)] }),
  opt('look', '「中を見て、持ち主の連絡先を探します」', 'ch1.shop_r2', { tone: 'risky', effects: [ev('accuracy', -2), ev('safety', -1)] }),
  opt('wait', '「しばらく売店で預かってください」', 'ch1.shop_r3', { tone: 'neutral', effects: [ev('reporting', -2)] })
], { view: v3('npc:sakai') });
line('ch1.shop_r1', [['sakai', '台帳に書くのね。分かったわ。持ち主が来たら、駅に聞くよう伝えておく。', 'smile']], 'ch1.shop_end'); line('ch1.shop_r2', [['kubota', '財布の中身を勝手に見るのは、避けます。必ず二人以上で確認し、記録します。', 'serious']], 'ch1.shop_end'); line('ch1.shop_r3', [['kubota', '預かる場所が増えると、管理が曖昧になります。駅で一元管理しましょう。']], 'ch1.shop_end');
fx('ch1.shop_end', done('ch1.shop_done', 10, '売店から届けられた財布の取扱い'), 'ch1.hub');

// 6) トイレ点検
line('ch1.wc_1', [['kubota', '定期点検の時間です。多目的トイレもあるので、見落とさないように。']], 'ch1.wc_task', { view: v3('follow', 'トイレ') });
chk('ch1.wc_task', 'トイレ定期点検', '各項目を「正常」「異常」で判定してください。', [
  { id: 'a', label: '多目的トイレの非常呼出ボタンを押すと、事務室に通知が届く', truth: 'ok', why: '正常です。' },
  { id: 'b', label: '男性用の手洗い場のペーパーが切れている', truth: 'ng', why: '備品の補充が必要です。' },
  { id: 'c', label: 'ベビーシートが、固定されて安全に使える', truth: 'ok', why: '正常です。' },
  { id: 'd', label: '女性用の鏡に、大きなひびがある', truth: 'ng', why: 'けがの原因になります。使用を止めて修繕を依頼します。' },
  { id: 'e', label: '床が濡れていて、滑りやすい箇所がある', truth: 'ng', why: '転倒の原因です。清掃と注意の掲示が必要です。' }
], res3('ch1.wc_good', 'ch1.wc_mid', 'ch1.wc_bad', [ev('safety', 3), ev('accuracy', 2)], [ev('safety', 1)], [ev('safety', -3)]), ['正常', '異常']);
line('ch1.wc_good', [['kubota', 'ひびや濡れ床は、見つけた人が止めるのが大事です。']], 'ch1.wc_end'); line('ch1.wc_mid', [['kubota', '見落としがあります。トイレは利用者の多い場所です。もう一度見てきましょう。']], 'ch1.wc_end'); line('ch1.wc_bad', [['kubota', 'けがにつながる箇所を見逃すと危険です。一緒に確認し直しましょう。', 'serious']], 'ch1.wc_end');
fx('ch1.wc_end', done('ch1.wc_done', 15, 'トイレの定期点検'), 'ch1.hub');

// 7) 指令からの電話
line('ch1.phone_1', [['hamaguchi', '輸送指令の浜口です。先ほどの遅れの件、回復の状況を確認させてください。駅の様子はどうですか。']], 'ch1.phone_c', { view: v3('npc:shiraishi', '駅事務室 電話') });
choice('ch1.phone_c', '指令への報告を、どうしますか？', [
  opt('fact', '「確認できた事実だけを、時刻の順にお伝えします」', 'ch1.phone_r1', { tone: 'honest', effects: [ev('reporting', 4), rel('hamaguchi', 2, 0)] }),
  opt('guess', '「たぶん、もう落ち着いていると思います」', 'ch1.phone_r2', { tone: 'risky', effects: [ev('reporting', -3), ev('accuracy', -2), rel('hamaguchi', -1, 0)] }),
  opt('later', '「今は手が離せないので、あとで折り返します」', 'ch1.phone_r3', { tone: 'neutral', effects: [ev('reporting', -2)] })
], { view: v3('npc:shiraishi') });
line('ch1.phone_r1', [['hamaguchi', '助かります。事実と時刻が分かれば、次の判断ができます。'], ['shiraishi', '電話は短く、事実から。それが指令との信頼になる。', 'smile']], 'ch1.phone_end'); line('ch1.phone_r2', [['hamaguchi', '「たぶん」では判断できません。見たこと、確認したことを教えてください。', 'serious']], 'ch1.phone_end'); line('ch1.phone_r3', [['hamaguchi', '分かりました。ただ、5分以内に折り返してください。']], 'ch1.phone_end');
fx('ch1.phone_end', done('ch1.phone_done', 5, '指令からの電話に応答'), 'ch1.hub');

// 8) 外国の旅行客
line('ch1.guide_1', [['tourist2', 'Excuse me... 星峰線の観光列車に、乗りたいです。どこから乗りますか？', 'worry']], 'ch1.guide_c', { view: v3('npc:tourist2', '観光案内所の前') });
choice('ch1.guide_c', 'どう案内しますか？', [
  opt('map', '路線図を指さしながら、ゆっくり・短い言葉で伝える', 'ch1.guide_r1', { tone: 'careful', effects: [ev('service', 4), sk('guide', 4), rel('tourist2', 1, 1)] }),
  opt('phone', '翻訳アプリを使って、画面を見せながら伝える', 'ch1.guide_r2', { tone: 'quick', effects: [ev('service', 2), sk('guide', 2)] }),
  opt('call', '駅員の久保田を呼んで、対応を代わってもらう', 'ch1.guide_r3', { tone: 'neutral', effects: [ev('service', -1), ev('teamwork', 1)] })
], { view: v3('npc:tourist2') });
line('ch1.guide_r1', [['tourist2', 'Oh, I see! Thank you. あの、乗り換えは、どこですか？'], ['kubota', 'ジェスチャーと短い言葉は、とても効果的です。']], 'ch1.guide_end'); line('ch1.guide_r2', [['tourist2', 'Ah, 分かりました。Thank you.'], ['kubota', 'アプリは便利ですが、誤訳も。路線図と合わせて確認しましょう。']], 'ch1.guide_end'); line('ch1.guide_r3', [['kubota', '呼んでくれてありがとうございます。次は、まず自分で試してみてください。']], 'ch1.guide_end');
fx('ch1.guide_end', done('ch1.guide_done', 12, '外国の旅行客を案内'), 'ch1.hub');

// 9) 梶原さんとの再会（第1章の選択が当日に影響）
line('ch1.kaji2_1', [['kajiwara', 'あら、朝のお兄さん、いえ、あなたね。病院の帰りに寄ってみたのよ。', 'smile'], ['kajiwara', 'おかげさまで、予約に間に合ったわ。これ、お礼の飴だけど、受け取ってちょうだい。']], 'ch1.kaji2_c', { view: v3('npc:kajiwara', '改札前') });
choice('ch1.kaji2_c', '梶原さんの申し出に、どう答えますか？', [
  opt('decline', '「お気持ちだけ、ありがたく頂きます。業務中は受け取れない決まりです」', 'ch1.kaji2_r1', { tone: 'honest', effects: [ev('accuracy', 2), ev('service', 2), rel('kajiwara', 1, 1)] }),
  opt('accept', '「ありがとうございます」と受け取る', 'ch1.kaji2_r2', { tone: 'risky', effects: [ev('accuracy', -2), rel('kajiwara', 1, 2)] }),
  opt('office', '「駅長に確認してから、お返事してもいいですか」', 'ch1.kaji2_r3', { tone: 'careful', effects: [ev('reporting', 3), ev('service', 1)] })
], { view: v3('npc:kajiwara') });
line('ch1.kaji2_r1', [['kajiwara', 'そうなの。真面目ねえ。でも、また来週も来るから、顔を見せてちょうだいね。', 'smile']], 'ch1.kaji2_end', { effects: [set('legacy.kaji_friend')] }); line('ch1.kaji2_r2', [['kubota', '（後で）お客様からの物品は、規則で受け取れません。断り方も、覚えておきましょう。']], 'ch1.kaji2_end'); line('ch1.kaji2_r3', [['kajiwara', '駅長さんに？ ふふ、じゃあお願いするわ。']], 'ch1.kaji2_end', { effects: [set('legacy.kaji_friend')] });
fx('ch1.kaji2_end', done('ch1.kaji2', 8, '梶原さんと再会'), 'ch1.hub');

// 10) 午後のホーム巡回
line('ch1.patrol2_1', [['yamashina', '午後の巡回、行こう。午前の指摘がちゃんと直っているか、確認しよう。']], 'ch1.patrol2_task', { view: v3('npc:yamashina', '島式ホーム') });
chk('ch1.patrol2_task', '午後のホーム巡回', '各項目を「正常」「異常」で判定してください。', [
  { id: 'a', label: '午前に指摘した点字ブロックの浮きが、修繕されている', truth: 'ok', why: '修繕済みであることを確認できました。' },
  { id: 'b', label: 'ホームに、飲みかけの飲み物が置いたままになっている', truth: 'ng', why: 'こぼれると滑ります。回収が必要です。' },
  { id: 'c', label: '列車非常停止ボタンのカバーが閉じている', truth: 'ok', why: '正常です。' },
  { id: 'd', label: 'ホーム端の白線の内側で、お客様が列車を待っている', truth: 'ok', why: '正常です。' },
  { id: 'e', label: '待合室の扉が半開きで、閉まらなくなっている', truth: 'ng', why: '故障の可能性があります。報告が必要です。' }
], res3('ch1.patrol2_good', 'ch1.patrol2_mid', 'ch1.patrol2_bad', [ev('safety', 3), sk('patrol', 3)], [ev('safety', 1)], [ev('safety', -2)]), ['正常', '異常']);
line('ch1.patrol2_good', [['yamashina', '二周目のほうが、気づけるものが多いな。', 'smile']], 'ch1.patrol2_end', { effects: [rel('yamashina', 1, 1)] }); line('ch1.patrol2_mid', [['yamashina', 'ちょっと見落としたな。もう一回、俺と見よう。']], 'ch1.patrol2_end'); line('ch1.patrol2_bad', [['yamashina', '大丈夫か。後で一緒に手順を確認するよ。']], 'ch1.patrol2_end');
fx('ch1.patrol2_end', done('ch1.patrol2_done', 25, '午後のホーム巡回'), 'ch1.hub');

// 11) ベビーカーのお客様
line('ch1.stroller_1', [['haha', 'すみません、この電車に、ベビーカーのまま乗れますか？ 少し段差が気になって。', 'worry']], 'ch1.stroller_c', { view: v3('npc:haha', 'ホーム') });
choice('ch1.stroller_c', 'どう対応しますか？', [
  opt('conductor', '「車掌に声をかけ、ドアの位置と乗降を見守ります」', 'ch1.stroller_r1', { tone: 'careful', effects: [ev('safety', 3), ev('service', 2), ev('reporting', 1)] }),
  opt('lift', '「お持ちします」と、ベビーカーを抱えて乗せる', 'ch1.stroller_r2', { tone: 'risky', effects: [ev('safety', -3), ev('service', 1)] }),
  opt('guide', '「ドアの位置と、段差のあるところだけご案内します」', 'ch1.stroller_r3', { tone: 'neutral', effects: [ev('service', 2), ev('safety', 1)] })
], { view: v3('npc:haha') });
line('ch1.stroller_r1', [['haha', 'ありがとうございます。助かります。', 'smile'], ['kubota', 'ホームと列車の間は、思ったより危険です。見守りは大事な仕事です。']], 'ch1.stroller_end'); line('ch1.stroller_r2', [['kubota', 'ベビーカーを抱えると、足元が不安定になります。お客様の動きに合わせて、安全に見守る方法を選びましょう。', 'serious']], 'ch1.stroller_end'); line('ch1.stroller_r3', [['haha', '分かりやすいです。ありがとう。']], 'ch1.stroller_end');
fx('ch1.stroller_end', done('ch1.stroller_done', 10, 'ベビーカーのお客様の乗降を見守る'), 'ch1.hub');

// 12) 改札機の点検
line('ch1.gate_1', [['kubota', '改札機の動作点検です。通行する人がいない時間に、一台ずつ確認します。']], 'ch1.gate_task', { view: v3('gate_back', '改札機') });
chk('ch1.gate_task', '改札機の動作点検', '各項目を「正常」「異常」で判定してください。', [
  { id: 'a', label: 'ICカードをかざすと、読取音が鳴り、扉が開く', truth: 'ok', why: '正常です。' },
  { id: 'b', label: '5番通路の扉が、通行後も閉まらない', truth: 'ng', why: '通過センサーまたは扉機構の不具合です。使用停止と保守依頼が必要です。' },
  { id: 'c', label: '幅広通路の幅は十分で、車いすが通れる', truth: 'ok', why: '正常です。' },
  { id: 'd', label: '3番通路の進入可表示が、緑と赤で同時に点灯している', truth: 'ng', why: '表示灯の異常です。お客様が迷います。' }
], res3('ch1.gate_good', 'ch1.gate_mid', 'ch1.gate_bad', [ev('accuracy', 3), ev('safety', 2)], [ev('accuracy', 1)], [ev('safety', -2)]), ['正常', '異常']);
line('ch1.gate_good', [['kubota', '改札機は、毎日たくさんの人が通ります。小さな異常も、早く見つけるのが大事です。']], 'ch1.gate_end'); line('ch1.gate_mid', [['kubota', '見落としがあります。もう一度、通路ごとに確認しましょう。']], 'ch1.gate_end'); line('ch1.gate_bad', [['kubota', '改札機の異常は、混雑時に大きな影響が出ます。一緒に確認し直しましょう。', 'serious']], 'ch1.gate_end');
fx('ch1.gate_end', done('ch1.gate_done', 20, '改札機の動作点検'), 'ch1.hub');

// 13) 定時放送（ホーム安全）
N['ch1.ann2_task'] = { id: 'ch1.ann2_task', type: 'task', kind: 'compose', title: 'ホーム安全放送の作成', intro: '帰宅時間帯の前に、ホームでの注意を呼びかける放送を作ります。',
  slots: [
    { id: 'hello', label: '呼びかけ', options: [{ id: 'h1', text: 'ご案内いたします。', good: true, why: '丁寧で簡潔です。' }, { id: 'h2', text: 'おい、そこの人たち。', good: false, why: '不適切な呼びかけです。' }, { id: 'h3', text: 'お急ぎください。', good: false, why: '急ぐように促すのは危険です。' }] },
    { id: 'body', label: '内容', options: [{ id: 'b1', text: '黄色い線の内側で、列車をお待ちください。', good: true, why: '具体的で分かりやすい内容です。' }, { id: 'b2', text: 'ホームでは、走らないでください。', good: false, why: '大事な注意ですが、この放送の主題（線の内側）が抜けています。' }, { id: 'b3', text: '危ないので、あまり近づかないでください。', good: false, why: '「危ない」「あまり」では行動が分かりません。' }] },
    { id: 'ask', label: 'お願い', options: [{ id: 'a1', text: '歩きスマホは、おやめください。ご協力をお願いいたします。', good: true, why: '行動と協力のお願いが入っています。' }, { id: 'a2', text: 'スマホを見ている人は、事故が起きても責任を負いかねます。', good: false, why: '責任を持ち出すのは不適切です。' }, { id: 'a3', text: 'どうぞご自由にお過ごしください。', good: false, why: '注意喚起になりません。' }] }
  ],
  results: [{ min: 66, goto: 'ch1.ann2_good', effects: [ev('service', 2), ev('safety', 3)] }, { min: 34, goto: 'ch1.ann2_mid', effects: [ev('safety', 1)] }, { min: 0, goto: 'ch1.ann2_bad', effects: [ev('safety', -1)] }], view: v3('npc:shiraishi', '駅事務室 放送設備') };
line('ch1.ann2_good', [['shiraishi', '具体的な行動と、お願いの言葉。理想的な放送だ。', 'smile']], 'ch1.ann2_end'); line('ch1.ann2_mid', [['shiraishi', '悪くない。ただ、何をしてほしいのか、もう少し具体的に。']], 'ch1.ann2_end'); line('ch1.ann2_bad', [['shiraishi', '放送は多くの人に届く。言葉は慎重に選びなさい。', 'serious']], 'ch1.ann2_end');
fx('ch1.ann2_end', done('ch1.ann2_done', 10, 'ホーム安全放送'), 'ch1.hub');

// 14) 券紙の補充
line('ch1.refill_1', [['kubota', '1号機の券紙が残り少なくなっています。補充の手順を確認しましょう。']], 'ch1.refill_task', { view: v3('npc:vend1', '券売機1号機') });
chk('ch1.refill_task', '券紙補充の手順', '各項目が、手順として適切か不適切かを判断してください。', [
  { id: 'a', label: '使用停止にしてから、前面の扉を開ける', truth: 'ok', why: '稼働中は開けません。' },
  { id: 'b', label: '券紙の向きと、通し方を確認してから取り付ける', truth: 'ok', why: '逆向きだと詰まりの原因になります。' },
  { id: 'c', label: '時間がないので、補充した後の試験発券は省略する', truth: 'ng', why: '試験発券で、正常に出ることを確認します。' },
  { id: 'd', label: '使用済みの巻芯や紙くずは、その場に置いて帰る', truth: 'ng', why: '片付けまでが作業です。' }
], res3('ch1.refill_good', 'ch1.refill_mid', 'ch1.refill_bad', [ev('accuracy', 3), sk('ticket', 3)], [ev('accuracy', 1)], [ev('accuracy', -2)]), ['適切', '不適切']);
line('ch1.refill_good', [['kubota', '補充は一人でもできます。次回は任せますね。', 'smile']], 'ch1.refill_end'); line('ch1.refill_mid', [['kubota', '手順を一つずつ指差し確認しながら、もう一度。']], 'ch1.refill_end'); line('ch1.refill_bad', [['kubota', '手順を飛ばすと、お客様の前で止まります。手順は必ず守ります。', 'serious']], 'ch1.refill_end');
fx('ch1.refill_end', done('ch1.refill_done', 15, '券紙の補充'), 'ch1.hub');

// 15) 終業前の施設点検
line('ch1.final_1', [['shiraishi', '終業前の施設点検だ。エレベーターとAEDを見てきなさい。']], 'ch1.final_task', { view: v3('follow', '終業前点検') });
chk('ch1.final_task', '終業前の施設点検', '各項目を「正常」「異常」で判定してください。', [
  { id: 'a', label: 'エレベーターの非常呼出ボタンが作動し、事務室につながる', truth: 'ok', why: '正常です。' },
  { id: 'b', label: 'AEDの使用期限表示が、今月で切れる', truth: 'ng', why: '期限が近いものは、交換の手配が必要です。' },
  { id: 'c', label: 'エレベーターの点検表の署名が、今日の分だけ空いている', truth: 'ng', why: '記録の漏れです。確認して記入します。' },
  { id: 'd', label: '案内表示の電球が切れている箇所はない', truth: 'ok', why: '正常です。' }
], res3('ch1.final_good', 'ch1.final_mid', 'ch1.final_bad', [ev('safety', 3), ev('reporting', 2)], [ev('safety', 1)], [ev('safety', -2)]), ['正常', '異常']);
line('ch1.final_good', [['shiraishi', '記録と設備を、両方見る。それができれば、一人前の第一歩だ。', 'smile']], 'ch1.final_end'); line('ch1.final_mid', [['shiraishi', '見落としは、次の勤務の人の負担になる。もう一度。']], 'ch1.final_end'); line('ch1.final_bad', [['shiraishi', '点検は、次の人への引継ぎでもある。丁寧に。', 'serious']], 'ch1.final_end');
fx('ch1.final_end', done('ch1.final_done', 15, '終業前の施設点検'), 'ch1.hub');

// ---- 終業面談：今日の依頼件数に応じた講評 ----
branch('ch1.cl_count', [[{ var: { key: 'ch1.extra', op: '>=', val: 9 } }, 'ch1.cl_busy'], [{ var: { key: 'ch1.extra', op: '>=', val: 4 } }, 'ch1.cl_mid']], 'ch1.cl_few');
line('ch1.cl_busy', [['shiraishi', '今日はずいぶん、依頼をこなしたな。初日でこれだけ動ければ、周りの信頼も上がる。', 'smile'], ['kubota', '一つひとつ、記録も残してくれていました。']], 'ch1.closing2', { effects: [ev('teamwork', 3), ev('service', 2), set('legacy.busy_day')], view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.cl_mid', [['shiraishi', '依頼に応えながら、基本の業務も進められた。バランスは悪くない。']], 'ch1.closing2', { effects: [ev('teamwork', 1)], view: v25('office', ['shiraishi']) });
line('ch1.cl_few', [['shiraishi', '依頼が出ていたのに、対応できなかったものがあったようだ。駅は、次々と仕事が生まれる場所だ。明日は、周りをもっと見てみよう。']], 'ch1.closing2', { effects: [ev('teamwork', -1)], view: v25('office', ['shiraishi']) });
for (const id of ['ch1.cl_admit', 'ch1.cl_blame', 'ch1.cl_silent', 'ch1.cl_careful', 'ch1.cl_generic']) N[id].next = 'ch1.cl_count';


// ============ 午後の持ち場：大きな分岐（接客／ホーム／事務室）============
const lunchEndNode = N['ch1.lunch_end']; lunchEndNode.next = 'ch1.route_intro';
line('ch1.route_intro', [['shiraishi', '午後は、持ち場を分けよう。全部を一度に見る必要はない。今日どこを見たいか、自分で選びなさい。'], ['kubota', '選んだ持ち場で、午後の仕事も、人との関係も変わります。あとで入れ替えることは、今日はできません。', 'serious']], 'ch1.route_choice', { view: v25('office', ['shiraishi', 'kubota'], '12:45 駅事務室') });
choice('ch1.route_choice', '午後の持ち場を選ぶ。', [
  opt('service', '窓口・券売機まわりで、お客様への対応を担当する（久保田さんと）', 'ch1.route_s', { tone: 'caring', effects: [set('route.service'), rel('kubota', 2, 1), sk('service', 3), log('午後の持ち場：窓口・券売機（接客）', 'route')] }),
  opt('platform', 'ホームで、列車の発着と安全の確認を担当する（山科さんと）', 'ch1.route_p', { tone: 'careful', effects: [set('route.platform'), rel('yamashina', 2, 2), sk('patrol', 3), log('午後の持ち場：ホーム（安全確認）', 'route')] }),
  opt('office', '駅事務室で、記録・連絡・放送を担当する（白石駅長と）', 'ch1.route_o', { tone: 'honest', effects: [set('route.office'), rel('shiraishi', 2, 1), ev('reporting', 3), log('午後の持ち場：駅事務室（記録・連絡）', 'route')] })
], { important: true, who: 'shiraishi', view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.route_s', [['kubota', '決まりですね。窓口と券売機は、駅の顔です。お客様の言葉にならない困りごとまで、聞き取れるようになりましょう。', 'smile']], 'ch1.hub', { view: v3('follow', '午後：接客ルート') });
line('ch1.route_p', [['yamashina', 'ホームか！ 一緒だな。列車が近づくとき、足元と周りを見るのが仕事だ。…怖いけど、一番、鉄道が好きな場所だ。', 'smile']], 'ch1.hub', { view: v3('follow', '午後：ホームルート') });
line('ch1.route_o', [['shiraishi', '事務室を選んだか。表に出ない仕事ほど、駅を支えている。記録と連絡を、軽く見ないことだ。']], 'ch1.hub', { view: v3('follow', '午後：事務ルート') });

// ---- 接客ルート専用：怒っているお客様（遅延証明書）----
line('ch1.angry_1', [['ogawa', '遅延証明書を、今すぐ出してくれ。午前の遅れで、大事な会議に遅れたんだ。どうしてくれる。', 'serious'], ['kubota', '落ち着いて対応しましょう。まず、お客様のお話を最後まで聞いてください。']], 'ch1.angry_c1', { view: v3('npc:ogawa', 'きっぷうりば前') });
choice('ch1.angry_c1', '小川さんに、どう答えますか？', [
  opt('calm', '「ご迷惑をおかけしました。事情をうかがい、すぐ証明書をご用意します」', 'ch1.angry_a', { tone: 'caring', effects: [time(5), ev('service', 4), rel('ogawa', 1, 1)] }),
  opt('rebut', '「遅れは車両点検のためで、駅員のせいではありません」', 'ch1.angry_b', { tone: 'risky', effects: [ev('service', -3), rel('ogawa', -2, 0), rel('kubota', -1, 0)] }),
  opt('defer', '「駅長に代わります」とすぐ事務室へ案内する', 'ch1.angry_c', { tone: 'neutral', effects: [ev('reporting', 1), ev('service', -1)] })
], { view: v3('npc:ogawa') });
line('ch1.angry_a', [['ogawa', '…すまない。言い過ぎた。実は今日、地元の再開発の説明会でね。大事な日だったんだ。', 'worry'], ['ogawa', '駅前の話なんだ。この駅が変わるかもしれない。']], 'ch1.angry_c2', { effects: [set('legacy.ogawa_known')] });
line('ch1.angry_b', [['ogawa', '理由なんて聞いていない！ 責任者を呼べ！', 'serious'], ['shiraishi', '（事務室から出てきて）失礼いたしました。ご用件を、あらためて承ります。']], 'ch1.angry_end_b', { effects: [set('legacy.ogawa_angry')] });
line('ch1.angry_c', [['ogawa', '…駅長？ 最初から出てくればいい。', 'serious'], ['shiraishi', '申し訳ありません。（目で合図する）あとで、一緒に振り返ろう。']], 'ch1.angry_end_c');
choice('ch1.angry_c2', '証明書を、どう渡しますか？', [
  opt('print', '「ここで発行します。会議先にも、遅れの理由をお伝えください」', 'ch1.angry_end_a', { tone: 'honest', effects: [ev('accuracy', 3), ev('service', 2), rel('ogawa', 1, 1)] }),
  opt('later', '「事務室で発行しますので、少しお待ちください」', 'ch1.angry_end_a2', { tone: 'neutral', effects: [time(5), ev('accuracy', 1)] })
]);
line('ch1.angry_end_a', [['ogawa', '助かる。…君の名前を、覚えておくよ。', 'smile'], ['kubota', '相手の背景に耳を傾けられた。それが、いちばん大切な対応です。', 'smile']], 'ch1.angry_end'); line('ch1.angry_end_a2', [['ogawa', 'ああ、頼む。']], 'ch1.angry_end');
line('ch1.angry_end_b', [['kubota', '事実を伝えることと、相手の気持ちを受け止めることは、別のことです。お客様が先に求めているのは、たいてい後者です。', 'serious']], 'ch1.angry_end'); line('ch1.angry_end_c', [['kubota', '上司に任せるのは悪くありません。ただ、最初の一言は、あなたが言えたはずです。']], 'ch1.angry_end');
fx('ch1.angry_end', done('ch1.angry_done', 15, '怒っているお客様への対応（遅延証明書）', [set('legacy.route_service_cleared')]), 'ch1.hub');

// ---- ホームルート専用：線路に落ちたスマートフォン ----
line('ch1.cable_1', [['riku', 'すみません、スマホを線路に落としちゃって…！ 次の電車、もうすぐ来ますよね？ 拾ってきます！', 'surprise'], ['yamashina', '待て、降りるな！ それは絶対にだめだ！', 'serious']], 'ch1.cable_c1', { view: v3('npc:riku', '島式ホーム') });
choice('ch1.cable_c1', '高校生と、落とし物に、どう対応しますか？', [
  opt('contact', '「動かないでください」と止め、運転士と指令へ連絡して停止の手配を依頼する', 'ch1.cable_a', { tone: 'careful', effects: [ev('safety', 5), ev('reporting', 3), rel('yamashina', 1, 1)] }),
  opt('pick', '「手を貸すから、すぐに拾おう」と一緒に降りる', 'ch1.cable_b', { tone: 'risky', effects: [ev('safety', -6), rel('yamashina', -2, 0), set('legacy.rule_break')] }),
  opt('stopbtn', '列車非常停止ボタンを押して、まず列車を止める', 'ch1.cable_c', { tone: 'quick', effects: [ev('safety', 1), ev('reporting', -1), set('ch1.train_delayed_by_you')] })
], { view: v3('npc:riku') });
line('ch1.cable_a', [['yamashina', 'よし！ 俺は柵の前で人を止める。指令には、場所と状況を短く！'], ['hamaguchi', '了解。次の列車の運転士に連絡し、停止位置を調整します。保守担当が、後で安全に回収します。'], ['riku', 'すみません…ありがとうございます。', 'worry']], 'ch1.cable_end', { effects: [set('legacy.phone_saved')] });
line('ch1.cable_b', [['shiraishi', '（駆けつけて）何をしている！ 線路には降りない。絶対に。たとえ一瞬でもだ！', 'serious'], ['kubota', '…幸い、列車は来ていません。でも、これは大きな問題です。']], 'ch1.cable_end_b');
line('ch1.cable_c', [['yamashina', '押した！？ …確かに、安全に倒したけど…。次の列車が駅の手前で止まったぞ。', 'surprise'], ['hamaguchi', '駅の非常停止を確認。3分ほど遅れが出ます。状況の説明をお願いします。']], 'ch1.cable_c2');
line('ch1.cable_c2', [['shiraishi', '非常停止ボタンは、人が危険な目にあったときの最後の手段だ。物を落としただけなら、まず連絡と確認だ。次は、順番を覚えなさい。']], 'ch1.cable_end');
line('ch1.cable_end_b', [['shiraishi', '今日の件は、記録に残す。始末書は書かなくていいが、あなたの判断は、評価にも残る。安全は、親切より先にある。', 'serious']], 'ch1.cable_end');
fx('ch1.cable_end', done('ch1.cable_done', 25, '線路に落ちたスマートフォンへの対応', [set('legacy.route_platform_cleared')]), 'ch1.hub');

// ---- 事務ルート専用：発車標の誤表示と、古い引継ぎ帳 ----
line('ch1.board_1', [['hamaguchi', '輸送指令です。発車標に、回復済みの遅れが、まだ表示されているようです。確認をお願いします。']], 'ch1.board_c1', { view: v3('npc:shiraishi', '駅事務室') });
choice('ch1.board_c1', '誤表示を、どう直しますか？', [
  opt('confirm', '指令に現在の運行状況を確認し、表示を訂正して、訂正した時刻を記録する', 'ch1.board_a', { tone: 'honest', effects: [ev('accuracy', 4), ev('reporting', 3), rel('hamaguchi', 1, 0)] }),
  opt('self', '「たぶん回復しているから」と、確認せずに表示を消す', 'ch1.board_b', { tone: 'risky', effects: [ev('accuracy', -4), ev('reporting', -2)] }),
  opt('leave', '次の勤務の人が気づくと思い、後回しにする', 'ch1.board_c', { tone: 'neutral', effects: [ev('reporting', -3)] })
], { view: v3('npc:shiraishi') });
line('ch1.board_a', [['shiraishi', '確認、訂正、記録。三つそろって、一つの仕事だ。']], 'ch1.board_book', { effects: [rel('shiraishi', 1, 0)] });
line('ch1.board_b', [['hamaguchi', '確認なしで表示を消すのは危険です。実際は、まだ12分の遅れが残っていました。', 'serious'], ['shiraishi', '案内は、確認してから変える。覚えなさい。']], 'ch1.board_book');
line('ch1.board_c', [['shiraishi', '後回しにした分だけ、お客様は誤った情報で動く。気づいた人が、動くんだ。', 'serious']], 'ch1.board_book');
line('ch1.board_book', [
  '訂正の履歴を探すうち、棚の奥にある古い「引継ぎ帳」を見つけた。ページを繰ると、一枚だけ、不自然に切り取られている。',
  ['shiraishi', '…それか。古い帳面だ。昔、表示の更新手順が書いてあった。今は端末に移ったから、誰も見ない。', 'worry'], ['shiraishi', '切り取られた頁のことは、私も知らない。…気になるなら、いつか調べればいい。']
], 'ch1.board_c2', { effects: [set('legacy.notebook_missing')] });
choice('ch1.board_c2', '切り取られた頁について、どうしますか？', [
  opt('ask', '「その頁には、何が書いてあったのでしょう」と駅長に尋ねる', 'ch1.board_d1', { tone: 'honest', effects: [set('legacy.notebook_asked'), ev('reporting', 1), rel('shiraishi', 1, 1)] }),
  opt('keep', '気になるが、今日は黙って棚に戻す', 'ch1.board_d2', { tone: 'neutral', effects: [] })
]);
line('ch1.board_d1', [['shiraishi', '…昔、手順を巡って、駅と指令の間で行き違いがあった。それだけだ。詳しくは、いずれ話そう。', 'serious']], 'ch1.board_end'); line('ch1.board_d2', [['shiraishi', '（あなたの手元の帳面を見て、何も言わなかった）']], 'ch1.board_end');
fx('ch1.board_end', done('ch1.board_done', 20, '発車標の誤表示の訂正と、古い引継ぎ帳の発見', [set('legacy.route_office_cleared')]), 'ch1.hub');

// ---- 週末エピローグ（各3〜4場面）----
for (const k of ['mentor', 'depot', 'rest']) N['ch1.cc_' + k].next = 'ch1.epi_' + k;
line('ch1.epi_mentor', [
  '4月3日（土）。誰もいない券売機の前で、久保田と並んで、障害時の案内を繰り返した。',
  ['kubota', '…私も、新人の頃に、誤った案内で、お客様を逆方向の電車に乗せてしまったことがあります。', 'worry'], ['kubota', '泣きそうになりました。そのとき、先輩が言ったんです。「失敗した事実より、どう直したかが、あなたの仕事になる」って。']
], 'ch1.epi_mentor_c', { view: v25('office', ['kubota'], '4月3日（土） 駅構内'), effects: [set('legacy.kubota_story')] });
choice('ch1.epi_mentor_c', '久保田さんの話に、どう答えますか？', [
  opt('thank', '「話してくれて、ありがとうございます。私も、そうありたいです」', 'ch1.epi_mentor_a', { tone: 'honest', effects: [rel('kubota', 2, 2)] }),
  opt('joke', '「久保田さんでも、失敗するんですね」と、笑ってみせる', 'ch1.epi_mentor_b', { tone: 'risky', effects: [rel('kubota', 0, 1)] })
], { view: v25('office', ['kubota']) });
line('ch1.epi_mentor_a', [['kubota', 'ふふ、ありがとう。じゃあ、次は後輩のあなたの番です。いつか、誰かに話してあげてください。', 'smile']], 'ch1.closing3', { view: v25('office', ['kubota']) }); line('ch1.epi_mentor_b', [['kubota', 'しますよ、たくさん。だから、一緒に直すんです。', 'smile']], 'ch1.closing3', { view: v25('office', ['kubota']) });
line('ch1.epi_depot', [
  '4月10日（土）。青浜総合車両センター。整然と並ぶ留置線の向こうで、検修庫のシャッターが開いている。',
  ['tachibana', '見学か。駅の若いのが基地に来るのは、珍しいな。…床下を、見るか。'], ['tachibana', '車両の足元は、嘘をつかない。音と、においと、手の感触だ。毎日見ている人間にしか、分からん違いがある。']
], 'ch1.epi_depot_c', { view: v25('depot', ['tachibana', 'yamashina'], '4月10日（土） 青浜総合車両センター'), effects: [set('legacy.tachibana_met')] });
choice('ch1.epi_depot_c', '橘さんの言葉に、どう答えますか？', [
  opt('ask', '「駅の仕事と、基地の仕事は、どうつながっていますか」と尋ねる', 'ch1.epi_depot_a', { tone: 'careful', effects: [sk('depot', 4), ev('reporting', 1)] }),
  opt('yama', '山科さんに「ここで働きたい理由を、橘さんに話してみたら」とすすめる', 'ch1.epi_depot_b', { tone: 'caring', effects: [rel('yamashina', 2, 2)] })
], { view: v25('depot', ['tachibana', 'yamashina']) });
line('ch1.epi_depot_a', [['tachibana', '駅が正確に案内する。基地が正確に整備する。どちらかが欠けたら、お客様は乗れん。…いい質問だ。', 'smile']], 'ch1.closing3', { view: v25('depot', ['tachibana']) }); line('ch1.epi_depot_b', [['yamashina', '…俺、車両の床下が好きなんです。図面じゃなくて、実物に触れたい。', 'worry'], ['tachibana', '好きなら、資格を取れ。来年、待っている。']], 'ch1.closing3', { view: v25('depot', ['tachibana', 'yamashina']), effects: [set('legacy.yamashina_tachibana')] });
line('ch1.epi_rest', [
  '4月3日（土）。久しぶりに、ゆっくり眠った。昼過ぎ、同期のグループチャットが、通知で鳴り続けている。',
  ['yamashina', '（チャット）初日おつかれ！ 俺、今日は基地の本ばかり読んでる。そっちはどうだった？', 'smile']
], 'ch1.epi_rest_c', { view: v25('hr', [], '4月3日（土）') });
choice('ch1.epi_rest_c', '山科さんに、どう返しますか？', [
  opt('reply', '「初日は大変だったけど、案内がうまくいったとき、うれしかった」と返す', 'ch1.epi_rest_a', { tone: 'caring', effects: [rel('yamashina', 1, 2)] }),
  opt('sleep', '返事はせず、もう少し寝て休む', 'ch1.epi_rest_b', { tone: 'neutral', effects: [ev('safety', 1)] })
], { view: v25('hr', []) });
line('ch1.epi_rest_a', [['yamashina', '（チャット）おお、いいな。俺も、来週は、負けないぞ！']], 'ch1.closing3', { view: v25('hr', []) }); line('ch1.epi_rest_b', ['夕方、窓の外が赤く染まった。月曜が、少しだけ、楽しみだった。'], 'ch1.closing3', { view: v25('hr', []) });

// ---- 終業面談：持ち場ごとの講評 ----
branch('ch1.cl_route', [[F('route.service'), 'ch1.clr_s'], [F('route.platform'), 'ch1.clr_p']], 'ch1.clr_o');
line('ch1.clr_s', [['kubota', '接客は、手順より、相手の気持ちです。今日は、それを見ようとしていました。', 'smile'], ['shiraishi', 'お客様の背景を聞く姿勢は、財産だ。']], 'ch1.closing2', { effects: [ev('service', 2)], view: v25('office', ['shiraishi', 'kubota']) });
line('ch1.clr_p', [['yamashina', '（部屋に顔を出して）ホーム、疲れたけど、楽しかったな。'], ['shiraishi', 'ホームは、一瞬の判断が、人の命につながる。慎重さを、忘れないように。']], 'ch1.closing2', { effects: [ev('safety', 2)], view: v25('office', ['shiraishi', 'yamashina']) });
line('ch1.clr_o', [['shiraishi', '記録と連絡は、地味だが、現場を支える背骨だ。今日の訂正の記録は、明日の誰かを救う。']], 'ch1.closing2', { effects: [ev('reporting', 2)], view: v25('office', ['shiraishi']) });
for (const id of ['ch1.cl_busy', 'ch1.cl_mid', 'ch1.cl_few']) N[id].next = 'ch1.cl_route';

// ---- 第2章：ルートで冒頭が大きく変わる ----
branch('ch2.mon', [[F('legacy.rule_break'), 'ch2.warn'], [F('legacy.concealed'), 'ch2.audit'], [ALL(F('route.office'), F('legacy.notebook_missing')), 'ch2.notebook'], [F('route.platform'), 'ch2.r_platform'], [ALL(F('route.service'), ANY(F('legacy.helped_kajiwara'), F('legacy.ogawa_known'))), 'ch2.kaji'], [F('route.service'), 'ch2.r_service']], 'ch2.plain');
line('ch2.warn', [['shiraishi', '先週の、線路に降りかけた件を、あらためて話そう。あなたを責めたいのではない。安全の線を、一緒に引き直したい。', 'serious'], ['yamashina', '（小声で）俺も、あのとき動けなかった。一緒に聞くよ。']], 'ch2.tail', { effects: [set('next.rule_review')], view: v25('office', ['shiraishi', 'yamashina'], '月曜 8:30') });
line('ch2.notebook', [['shiraishi', '…あの引継ぎ帳のことだ。昔の記録を、少し洗い直してみようと思う。手伝ってくれるか。', 'worry'], ['hamaguchi', '（電話口）指令にも、当時の記録が残っているかもしれません。']], 'ch2.tail', { effects: [set('next.notebook_inquiry')], view: v25('office', ['shiraishi'], '月曜 17:00') });
line('ch2.r_platform', [['yamashina', '来週、早番でホームだ。…俺、一人で立ってみたい。見ててくれ。', 'smile'], ['shiraishi', '駅は、一人では回らん。だが、一人で立てる者が、強い。']], 'ch2.tail', { effects: [set('next.platform_solo')], view: v25('office', ['shiraishi', 'yamashina'], '月曜 8:30') });
line('ch2.r_service', [['kubota', '窓口の応対記録が、先週の分から、きちんと残っていました。今週は、苦情の記録の書き方を、一緒に練習しましょう。']], 'ch2.tail', { effects: [set('next.service_record')], view: v25('office', ['kubota'], '月曜 9:00') });

const chapters = [
  { id: 'ch1', title: '新しい名札', season: 'S1 新しい名札', start: 'ch1.p1', status: 'playable', synopsis: '入社式の翌日、青嶺中央駅での勤務初日。配属面談から終業面談までを実装済み。' },
  { id: 'ch2', title: '最初の週末', season: 'S1 新しい名札', start: 'ch2.open', status: 'teaser', synopsis: '第1章の選択が反映される冒頭のみ実装（体験版）。' },
  ...['はじめての早番', '同期の距離', '券売機のむこう側', '三か月目の面談', '夏の臨時列車', 'ホームの声', 'はじめての評価', '基地実習へ', '研修の最終日', '新しい名札'].map((t, i) => ({ id: 'ch' + (i + 3), title: t, season: 'S1 新しい名札', start: '', status: 'planned', synopsis: '企画のみ（未制作）。' }))
];

const IT = id => N['ch1.hub'].interactions.find(i => i.id === id); const GL = id => N['ch1.hub'].goals.find(g => g.id === id);
const gate = (ids, route) => { for (const id of ids) { const it = IT(id); it.requires = ALL(it.requires, F(route)); const g = GL('g_' + (id === 'shopnote' ? 'shop' : id === 'toilet' ? 'wc' : id)); if (g) g.showWhen = ALL(g.showWhen, F(route)); } };
gate(['phone', 'announce2'], 'route.office'); gate(['guide', 'kaji2', 'gatecheck', 'refill'], 'route.service'); gate(['patrol2', 'stroller'], 'route.platform');
N['ch1.hub'].interactions.push(
  { id: 'angry', object: 'ogawa', label: '怒っているお客様に対応する（遅延証明書）', goto: 'ch1.angry_1', requires: ALL(F('route.service'), T('>=', hm(14, 0)), T('<', hm(15, 30))), once: true },
  { id: 'cable', object: 'riku', label: '線路にスマートフォンを落とした高校生', goto: 'ch1.cable_1', requires: ALL(F('route.platform'), T('>=', hm(14, 0)), T('<', hm(15, 30))), once: true },
  { id: 'board', object: 'departure_board', label: '発車標の表示を確認する（誤表示の連絡）', goto: 'ch1.board_1', requires: ALL(F('route.office'), T('>=', hm(14, 10))), once: true });
N['ch1.hub'].goals.push(
  { id: 'g_angry', label: '（専用）怒っているお客様への対応', when: F('ch1.angry_done'), optional: true, showWhen: ALL(F('route.service'), T('>=', hm(14, 0))) },
  { id: 'g_cable', label: '（専用）線路に落ちた物への対応', when: F('ch1.cable_done'), optional: true, showWhen: ALL(F('route.platform'), T('>=', hm(14, 0))) },
  { id: 'g_board', label: '（専用）発車標の誤表示の訂正', when: F('ch1.board_done'), optional: true, showWhen: ALL(F('route.office'), T('>=', hm(14, 10))) });
const story = { storyId: 'r7', mode: 'R7', title: '配属先は、明日変わる', subtitle: '超リアル社員異動・長編キャリア', startYear: 2027, characters, chapters, nodes: N };
mkdirSync('src/data/r7', { recursive: true });
writeFileSync('src/data/r7/story.json', JSON.stringify(story, null, 1));
console.log('nodes:', Object.keys(N).length);
