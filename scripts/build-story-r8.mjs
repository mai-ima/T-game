// R8「消えた引継ぎ帳」第1章「白紙の一頁」をJSONへ書き出すビルダー（原本）。
// 使い方: node scripts/build-story-r8.mjs  →  src/data/r8/story.json
// ホラー・殺人・失踪・怪異・暴力的脅迫は使わない。緊張は「文書の版の食い違い」「記憶のあいまいさ」「期限」から生む。
// 条件はフラグ（flag / notFlag / all / any）だけを使う（到達性テストが状態を厳密に列挙できるように）。
import { writeFileSync, mkdirSync } from 'node:fs';

const N = {};
const rel = (char, trust = 0, rapport = 0, note) => ({ rel: { char, trust, rapport, ...(note ? { note } : {}) } });
const ev = (key, add) => ({ eval: { key, add } });
const set = f => ({ set: f });
const log = (text, tag) => ({ log: { text, tag } });
const tl = text => ({ timeline: { text } });
const F = flag => ({ flag }), NF = notFlag => ({ notFlag });
const ALL = (...all) => ({ all }), ANY = (...any) => ({ any });
const hm = (h, m) => h * 60 + m;

const L = a => (typeof a === 'string' ? { text: a, narration: true } : { who: a[0], text: a[1], mood: a[2] });
const line = (id, lines, next, o = {}) => (N[id] = { id, type: 'line', lines: lines.map(L), next, ...o });
const choice = (id, prompt, options, o = {}) => (N[id] = { id, type: 'choice', prompt, options, ...o });
const branch = (id, cases, els, o = {}) => (N[id] = { id, type: 'branch', cases: cases.map(([when, goto]) => ({ when, goto })), else: els, ...o });
const opt = (id, label, goto, o = {}) => ({ id, label, goto, ...o });
const end = (id, o) => (N[id] = { id, type: 'end', chapter: 'ch1', ...o });

const v25 = (bg, focus, caption) => ({ mode: '25d', bg, focus, caption });
const CAP = {
  off1: '4月12日（水） 09:00 本社 改善推進室',
  rec: '4月12日（水） 14:00 総務部 文書管理室',
  off2: '4月13日（木） 09:30 本社 改善推進室',
  tg: '4月13日（木） 10:30 設備課',
  ot: '4月13日（木） 13:30 青浜検修庫',
  mt: '4月13日（木） 16:00 本社 小会議室',
  off3: '4月14日（金） 10:00 本社 改善推進室',
  rep: '4月17日（月） 16:00 本社 改善推進室',
  fin: '4月18日（火） 10:00 青浜検修庫',
  meet: '4月18日（火） 14:00 関係部署への説明会'
};

// ============ 人物（すべて架空） ============
const characters = {
  kawai: { id: 'kawai', name: '河合 理沙', kana: 'かわい りさ', role: '改善推進室 室長', dept: 'planning', age: 46, years: 22, uniform: '#3a4a5e', hair: '#2a2a2e', skin: '#f0cfae', gender: 'f', accessory: 'none', trait: '結論より経緯を重んじる。誰の責任かより、何が分かっていないかを先に聞く。', bio: '社内の業務改善を横断で支える改善推進室の室長。部署間の行き違いを、資料と対話でほどくのが得意。' },
  taniguchi: { id: 'taniguchi', name: '谷口 直樹', kana: 'たにぐち なおき', role: '設備課 係長', dept: 'facility', age: 36, years: 13, uniform: '#2f4f6a', hair: '#1c1c28', skin: '#efc9a6', gender: 'm', accessory: 'glasses', trait: '几帳面。説明資料は一字一句に責任を持つが、見えない範囲の話は断言しない。', bio: '設備更新の現行説明資料（Ver.1.2）の作成者。共有フォルダの資料を土台に、正確さを重んじて書いた。' },
  otsuki: { id: 'otsuki', name: '大槻 剛', kana: 'おおつき つよし', role: '青浜検修区 検修長', dept: 'depot', age: 61, years: 40, uniform: '#2f4f6a', hair: '#b8b8b4', skin: '#dcb48c', gender: 'm', accessory: 'cap', trait: '口数は少ないが、現場の流れをよく覚えている。「書類より先に現場は動く」が口ぐせ。', bio: '検修庫の運用を長く支えてきた検修長。旧版の引継ぎ帳（第3版）の綴じを検修区で預かっていた。' },
  matsuoka: { id: 'matsuoka', name: '松岡 沙織', kana: 'まつおか さおり', role: '営業企画課（前任の設備更新担当）', dept: 'pr', age: 39, years: 15, uniform: '#4a5a6e', hair: '#3a2a22', skin: '#f2d2b4', gender: 'f', accessory: 'none', trait: '誠実で、自分の手落ちを先に認める。ただし記憶には限りがあると断ってから話す。', bio: '2023年春まで設備更新を担当し、現場の聞き取りをまとめて第3版を綴じた。異動の引継ぎは短い期間だった。' },
  segawa: { id: 'segawa', name: '瀬川 実', kana: 'せがわ みのる', role: '総務部 文書管理係', dept: 'hr', age: 29, years: 6, uniform: '#3a4a5e', hair: '#2a2118', skin: '#efc9a6', gender: 'm', accessory: 'none', trait: '手順に忠実で、相手を責めない。台帳に載っていることと載っていないことを、はっきり分けて話す。', bio: '文書管理台帳の担当。閲覧申請や版の登録状況を、規程にしたがって案内する。' }
};

// ============ 第1章：プロローグ（改善推進室） ============
line('ch1.o1', [
  '4月12日、水曜日の朝。{player}が所属する改善推進室は、本社ビル5階の窓際にある。',
  '社内の業務改善を、部署をまたいで支える小さな部署。{player}の肩書きは「改善プロジェクト担当」。今月から、車両基地の設備更新プロジェクトを任された。',
  ['kawai', 'おはようございます。改善推進室の河合です。設備更新プロジェクトの担当、よろしくお願いしますね。', 'smile'],
  ['kawai', '対象は青浜検修庫のB棟。古いピット照明盤を新しいLED照明盤へ切り替えて、旧盤を撤去する工事です。'],
  ['kawai', '工事そのものは、設備課と検修区が進めます。私たちの仕事は、関係者が同じ資料を見て、同じ理解で動けるようにすること。'],
  ['kawai', '来週火曜、18日の14時に、関係部署への説明会があります。その前に、資料の中身を一度、きちんと読み込んでおいてください。']
], 'ch1.o2', {
  effects: [{ clock: { addDay: 11, minute: hm(9, 0) } }, { assign: { dept: 'planning', role: '改善プロジェクト担当', site: '本社 改善推進室' } }, tl('4月12日 設備更新プロジェクトの担当に着任'), log('着任：青浜検修庫B棟の設備更新プロジェクト。説明会は4月18日14時', 'work')],
  view: v25('office', ['kawai'], CAP.off1)
});

line('ch1.o2', [
  ['player', 'はい。まず、現行の説明資料と、過去の引継ぎ資料を読みます。'],
  ['kawai', '現行の説明資料は、設備課の谷口さんが、4月3日付のVer.1.2として出しています。関係部署の確認も済んでいます。'],
  ['kawai', '古い方は、検修区の大槻さんから預かった「引継ぎ帳」の写しです。表紙に第3版とあります。参考程度に、と言われていますけれど。'],
  ['kawai', '私は午前中、別件の会議で席を外します。気づいたことがあれば、メモにしておいてください。']
], 'ch1.o3', { view: v25('office', ['kawai'], CAP.off1) });

line('ch1.o3', [
  '昼前、{player}は2つの資料を机に並べた。',
  '現行の説明資料は、整った書式のPDF。旧版の引継ぎ帳は、手書きの付箋が貼られた、紙の綴じ込みの写しだ。',
  '対象設備、方針、工期。読み進めると、同じ言葉が並んでいる。ところが、旧版の「但し書き」の欄で、{player}の手が止まった。',
  '『PL-3は、B棟の作業灯系統と共用のため、B棟の移設工事の完了を確認するまで撤去しないこと』',
  '現行の説明資料の同じ位置には、この一文がない。「旧ピット照明盤は、切替後に撤去する」とだけ書かれている。',
  ['player', '（PL-3だけは撤去しない、と旧版は言っている。現行の資料には、その一言がない……）', 'worry']
], 'ch1.o4', { effects: [tl('4月12日 旧版と現行資料で、PL-3の但し書きが食い違うことに気づく'), log('【気づき】旧版（第3版）にはPL-3の但し書きがあり、現行（Ver.1.2）にはない。理由は不明', 'note')], view: v25('office', [], CAP.off1) });

line('ch1.o4', [
  '午後、河合が席へ戻ってきた。{player}は2つの資料を見せ、但し書きの違いを説明した。',
  ['kawai', '……本当ですね。旧版にだけ、但し書きがある。', 'serious'],
  ['kawai', 'ただの転記漏れかもしれません。逆に、現場にとって大事な条件が、どこかで落ちたのかもしれない。今の時点では、どちらとも言えません。'],
  ['kawai', '説明会は6日後です。{player}さんは、この食い違いをどう扱いますか。順番は任せます。ただし、規程の範囲で。']
], 'ch1.ic1', { view: v25('office', ['kawai'], CAP.off1) });

// ---- 重要な選択1：最初の動き ----
choice('ch1.ic1', 'この食い違いに、まず、どう動く？', [
  opt('verify', '「まず、2つの文書の版・日付・出どころを確かめ、並べて比べます」', 'ch1.v1', { tone: 'careful', effects: [set('r8.docs_first'), ev('accuracy', 3), rel('kawai', 1, 0), log('方針：文書の版・日付・出どころの確認を先に行う', 'choice')] }),
  opt('ask', '「検修区の大槻検修長へ電話して、当時の様子を先に聞きます」', 'ch1.a1', { tone: 'quick', effects: [set('r8.phone_otsuki'), ev('teamwork', 2), rel('otsuki', 0, 1), log('方針：検修区へ電話で当時の様子を先に聞く', 'choice')] }),
  opt('assert', '「現行資料の誤りです、と室長へすぐ報告します」', 'ch1.s1', { tone: 'risky', effects: [set('r8.early_assert'), ev('accuracy', -3), rel('kawai', -1, 0), log('方針：根拠を確かめる前に「現行資料の誤り」と報告した', 'choice')] })
], { important: true, who: 'kawai', view: v25('office', ['kawai']) });

line('ch1.v1', [
  ['player', 'まず、2つの資料の版と日付、出どころを確かめます。内容を比べるのは、それからにします。'],
  ['kawai', 'いいですね。「いつの、誰の、どの版か」が分かれば、食い違いの意味も見えてきます。', 'smile'],
  ['kawai', '文書の正式な登録状況は、総務の文書管理係の瀬川さんが、台帳で見られます。他部署の資料の閲覧は、手順どおりに申請してくださいね。']
], 'ch1.rec1', { view: v25('office', ['kawai']) });

line('ch1.a1', [
  '{player}は先に、検修区の大槻検修長へ電話をかけた。',
  ['player', '改善推進室の{player}です。設備更新の資料のことで、少しお時間をいただけますか。'],
  ['otsuki', '……ああ、河合さんのところの、新しい担当か。手短にな。今、庫内に出ている。'],
  ['player', '旧版の引継ぎ帳に、PL-3についての但し書きがありました。ご存じですか。'],
  ['otsuki', 'PL-3か。B棟の作業灯と、同じ系統でな。だから「撤去は待て」と書いた。……はずだ。'],
  ['otsuki', 'ただ、書いたのは俺じゃない。前の担当が綴じていった。細かいことは、書類を見ないと、はっきりは言えんよ。'],
  '電話口の声は落ち着いていたが、断言はしなかった。{player}は、聞いた内容を「証言」として別にメモした。',
  '記憶は貴重な手がかりだ。ただ、書類の確認とは、別に扱わなければならない。'
], 'ch1.rec1', { effects: [log('【証言・電話】大槻検修長：PL-3はB棟の作業灯と同系統だったと記憶。綴じたのは前担当。書類での裏づけは未確認', 'note')], view: v25('shed', ['otsuki'], '4月12日（水） 14:00 電話：青浜検修庫') });

line('ch1.s1', [
  ['player', '室長、現行の説明資料の誤りです。但し書きが抜けています。差し替えを検討してください。'],
  ['kawai', '……待ってください。「誤り」と言い切る根拠は、何ですか。', 'serious'],
  ['player', '旧版にはあって、現行にはないので……。', 'worry'],
  ['kawai', 'それは「食い違い」の事実です。どちらが正しいのか、いつ抜けたのか、まだ何も確認できていません。'],
  ['kawai', '言い切ってしまうと、資料を作った人の信用にも、あなたの報告の信用にも傷がつきます。まず、確かめましょう。'],
  '室長の声は穏やかだった。それでも{player}は、報告の言葉の重さを思い知らされた。'
], 'ch1.rec1', { effects: [log('【反省】根拠を確かめる前に断定して報告し、室長から確認を促された', 'note')], view: v25('office', ['kawai']) });

// ============ 文書の確認（総務部 文書管理室） ============
line('ch1.rec1', [
  '総務部の文書管理室。壁一面の棚に、背表紙の揃ったバインダーが並んでいる。',
  ['segawa', 'こんにちは、文書管理係の瀬川です。改善推進室の方ですね。河合さんから連絡をいただいています。', 'smile'],
  ['player', '設備更新の説明資料と、旧版の引継ぎ帳の登録状況を、確認したいんです。'],
  ['segawa', '承知しました。ただ、台帳の閲覧と、他部署が保管する綴じの写しの取り扱いには、手順があります。先に、確認をさせてください。']
], 'ch1.rules_task', { effects: [{ clock: { minute: hm(14, 0) } }], view: v25('records', ['segawa'], CAP.rec) });

N['ch1.rules_task'] = {
  id: 'ch1.rules_task', type: 'task', kind: 'checklist', title: '文書の取扱い確認（文書管理規程・抜粋）', intro: '各項目を「適切」「不適切」で判定します。規程を破らずに調べるための確認です。',
  items: [
    { id: 'k1', label: '他部署が保管する綴じ込みは、閲覧申請をして、保管部署の許可を得てから見る。', truth: 'ok', why: '保管部署の承認が必要です。申請すれば、写しの提供を受けられます。' },
    { id: 'k2', label: '台帳で「確認中」の版は、中身を読みやすく書き直して整えてよい。', truth: 'ng', why: '版の訂正は、作成者・承認者の手続きを経て行います。勝手に書き換えると、どの版か分からなくなります。' },
    { id: 'k3', label: '関係者への聞き取りは、目的を伝えたうえで行い、録音や記録は同意を得てとる。', truth: 'ok', why: '目的と記録の方法を先に伝えるのが、信頼のもとです。' },
    { id: 'k4', label: '共有フォルダに旧版が見つからないときは、他部署の書棚を探して持ち出してよい。', truth: 'ng', why: '無断の持出しは禁止です。保管部署へ依頼して提供を受けます。' },
    { id: 'k5', label: '確認できていないことは、「未確認」と明記して共有する。', truth: 'ok', why: '推定や未確認を、確認済みと混ぜないことが、説明責任の基本です。' }
  ],
  config: { labels: ['適切', '不適切'] },
  results: [{ min: 80, goto: 'ch1.rec2', effects: [set('r8.rules_ok'), ev('accuracy', 2)], label: '手順を押さえている' }, { min: 0, goto: 'ch1.rec1w', effects: [set('r8.rules_warned')], label: '手順を再確認' }],
  view: v25('records', ['segawa'], CAP.rec)
};

line('ch1.rec1w', [
  ['segawa', 'いくつか、手順の確認をさせてください。他部署の綴じは、閲覧申請と許可が先。版は、勝手に直さない。確認できないことは、確認できないと書く。この三つです。'],
  ['segawa', '規程は、記録を守るためのものです。覚えておけば、むしろ動きやすくなりますよ。', 'smile'],
  ['player', 'ありがとうございます。気をつけます。']
], 'ch1.rec2', { view: v25('records', ['segawa'], CAP.rec) });

line('ch1.rec2', [
  ['segawa', '台帳を引きますね。……現行の説明資料、Ver.1.2は「承認済み」。4月3日付で、設備課の谷口さんの登録です。'],
  ['segawa', 'もう一方の「引継ぎ帳 第3版」は……あれ、「確認中（未登録）」になっています。受付の記録だけがあって、承認も登録もされていない状態ですね。'],
  ['player', '第3版の綴じは、ここにはないんですね。'],
  ['segawa', '台帳に載っているのは、第2版（2021年10月）までです。第3版の綴じは、検修区にあるはず。閲覧申請の承認が出ましたので、写しをご覧ください。'],
  '{player}は、2つの文書を机に並べた。版、日付、出どころ、確認状況。それぞれを、一行ずつ照らし合わせていく。'
], 'ch1.docs_task', { effects: [set('r8.ledger_known'), tl('4月12日 台帳確認：第3版は「確認中（未登録）」、現行Ver.1.2は「承認済み」'), log('【確認済み】文書管理台帳：第3版は未登録・未承認。登録済みは第2版（2021年10月）まで、現行Ver.1.2は承認済み', 'evidence')], view: v25('records', ['segawa'], CAP.rec) });

N['ch1.docs_task'] = {
  id: 'ch1.docs_task', type: 'task', kind: 'docs', title: '文書の版比較：PL-3の但し書き', intro: '版・日付・出典・確認状況を見比べ、内容が食い違う行に矛盾マーカーを付けてください。',
  config: {
    docs: [
      {
        id: 'old', title: '設備更新（第1期）引継ぎ帳（旧版）', ver: '第3版（綴じ込みの写し）', date: '2023年3月24日', iso: '2023-03-24', source: '青浜検修区 事務室の綴じ（紙）。閲覧申請により写しを受領', check: '文書管理台帳：確認中（未登録・未承認）', tone: 'warn',
        lines: [
          { id: 'a1', text: '【対象】B棟 ピット照明盤・旧ピット照明回路（PL-1〜PL-4）' },
          { id: 'a2', text: '【方針】新LED照明盤への切替後に、旧ピット照明盤を撤去する。' },
          { id: 'a3', text: '【但し書き】PL-3はB棟の作業灯系統と共用のため、B棟の移設工事の完了を確認するまで撤去しないこと。' },
          { id: 'a4', text: '【工期】切替工事は、B棟の移設工事の後に計画する（時期は未定）。' },
          { id: 'a5', text: '【連絡先】青浜検修区 大槻検修長／設備課 担当者' },
          { id: 'a6', text: '【記載日】2023/03/24（旧書式）' }
        ]
      },
      {
        id: 'new', title: '設備更新（第1期）説明資料（現行）', ver: 'Ver.1.2', date: '2028年4月3日', iso: '2028-04-03', source: '共有フォルダ（PDF）。設備課 谷口 係長が作成', check: '文書管理台帳：承認済み（登録済み）', tone: 'ok',
        lines: [
          { id: 'b1', text: '【対象】B棟 ピット照明盤・旧ピット照明回路（PL-1〜PL-4）' },
          { id: 'b2', text: '【方針】新LED照明盤への切替後に、旧ピット照明盤を撤去する。' },
          { id: 'b3', text: '（この位置に、但し書きの記載はありません）', missing: true },
          { id: 'b4', text: '【工期】切替工事 2028年5月〜6月。撤去は切替後。' },
          { id: 'b5', text: '【連絡先】設備課 谷口 係長（検修区との調整窓口を兼ねる）' },
          { id: 'b6', text: '【記載日】2028年4月3日' }
        ]
      }
    ],
    targets: ['a3', 'b3'],
    why: {
      a3: '旧版には「PL-3を撤去しない」条件があります。',
      b3: '現行資料には、その条件の記載が見当たりません。「切替後に撤去する」とだけ読めます。',
      a4: '工期は、計画が具体化して更新されたものです。内容の矛盾ではありません。', b4: '工期は、計画が具体化して更新されたものです。内容の矛盾ではありません。',
      a5: '連絡窓口が設備課へ集約された、という更新です。差異ですが、矛盾ではありません。', b5: '連絡窓口が設備課へ集約された、という更新です。差異ですが、矛盾ではありません。',
      a6: '日付の書式の違い（2023/03/24と2028年4月3日）。表記の揺れです。', b6: '日付の書式の違い。表記の揺れです。'
    }
  },
  results: [
    { min: 75, goto: 'ch1.cmp_sharp', effects: [set('r8.compare_sharp'), ev('accuracy', 4)], label: '食い違いを的確に特定' },
    { min: 40, goto: 'ch1.cmp_ok', effects: [set('r8.compare_ok'), ev('accuracy', 2)], label: '食い違いを特定（過剰なマーカーあり）' },
    { min: 0, goto: 'ch1.cmp_loose', effects: [set('r8.compare_loose'), ev('accuracy', -2)], label: '見落としまたは過剰' }
  ],
  view: v25('records', [], CAP.rec)
};

line('ch1.cmp_sharp', [
  ['segawa', '見事です。内容が変わっているのは、但し書きの有無だけ。ほかの違いは、更新と表記の揺れですね。', 'smile'],
  ['player', 'はい。但し書きの一点が、論点になりそうです。']
], 'ch1.after_cmp', { effects: [log('【確認済み】2文書を照合：内容の食い違いは、PL-3の但し書きの有無のみ（工期・窓口・日付は更新・表記の差）', 'evidence')], view: v25('records', ['segawa'], CAP.rec) });
line('ch1.cmp_ok', [
  ['segawa', '要点は押さえています。ただ、工期や窓口の違いは、「更新」であって「矛盾」ではありません。区別して書いておきましょう。'],
  ['player', '分かりました。違いと矛盾は、別物ですね。']
], 'ch1.after_cmp', { effects: [log('【確認済み】2文書を照合：食い違いはPL-3の但し書き。ほかは更新・表記の差（一部、取り違えを修正）', 'evidence')], view: v25('records', ['segawa'], CAP.rec) });
line('ch1.cmp_loose', [
  ['segawa', 'ずいぶん、印の付け方が慎重すぎたり、逆に足りなかったりしましたね。一緒に見直しましょう。', 'worry'],
  ['segawa', '内容が食い違うのは、但し書きの有無だけです。工期や窓口は更新、日付は書式の違いで、矛盾ではありません。'],
  ['player', '違いがあるから矛盾、とは限らないんですね。ありがとうございます。']
], 'ch1.after_cmp', { effects: [log('【確認済み】瀬川さんと再照合：食い違いはPL-3の但し書きのみ。更新・表記の差は矛盾ではない', 'evidence')], view: v25('records', ['segawa'], CAP.rec) });

line('ch1.after_cmp', [
  '食い違いは、但し書き一点。しかしそれが「単なる転記漏れ」なのか、「意図して外された」のか、「別の版の資料から作られたため」なのかは、文書だけでは分からない。',
  ['player', '（食い違っているのは事実。でも、「なぜ」は、まだ誰にも確かめられていない）'],
  '{player}は、メモの欄を三つに分けた。「確認済み」「推定」「未確認」。',
  ['segawa', '台帳の外のことは、わたしには分かりません。当時を知る方に、聞いてみるのがいいと思います。'],
  ['segawa', 'ただ、お願いがあります。聞き取りは、相手を責める場にしないでくださいね。当時は当時の事情がありますから。']
], 'ch1.int_intro', { view: v25('records', ['segawa'], CAP.rec) });

// ============ 聞き取り（3人から最低2人） ============
line('ch1.int_intro', [
  '翌朝、{player}は河合に、昨日の確認結果を口頭で伝えた。',
  ['kawai', '版の違いが分かっただけで、大きな前進です。次は「なぜ違うのか」を、当時を知る人から聞きましょう。'],
  ['kawai', '相手は、現行の資料を作った設備課の谷口さん、第3版の綴じを預かっていた検修区の大槻検修長、前任の設備更新担当だった松岡さんの三人が考えられます。'],
  ['kawai', '全員に聞く必要はありません。ただ、最低でも二人。立場が違うので、同じ質問でも答えが違うかもしれません。'],
  ['kawai', '聞いた話は「証言」です。書類で確かめた事実と、混ぜないでくださいね。', 'serious']
], 'ch1.int_menu', { effects: [{ clock: { addDay: 1, minute: hm(9, 30) } }], view: v25('office', ['kawai'], CAP.off2) });

const iDone = ['r8.tg_done', 'r8.ot_done', 'r8.mt_done'];
choice('ch1.int_menu', '誰に話を聞きに行く？（最低二人）', [
  opt('tg', '設備課の谷口係長（現行資料の作成者）', 'ch1.tg_intro', { requires: NF('r8.tg_done'), tone: 'careful' }),
  opt('ot', '検修区の大槻検修長（第3版の綴じを預かっていた）', 'ch1.ot_intro', { requires: NF('r8.ot_done'), tone: 'careful' }),
  opt('mt', '営業企画課の松岡さん（前任の設備更新担当）', 'ch1.mt_intro', { requires: NF('r8.mt_done'), tone: 'caring' }),
  opt('enough', '聞き取りを終えて、メモを整理する', 'ch1.int_wrap', { requires: ANY(ALL(F(iDone[0]), F(iDone[1])), ALL(F(iDone[0]), F(iDone[2])), ALL(F(iDone[1]), F(iDone[2]))), tone: 'neutral' })
], { view: v25('office', [], CAP.off2) });

// ---- 谷口 ----
line('ch1.tg_intro', [
  '設備課のフロア。谷口係長は、モニターに向かい、図面の更新履歴を確認していた。',
  ['taniguchi', '改善推進室の方ですね。河合さんから聞いています。……説明資料の件、ですよね。', 'worry'],
  ['player', '現行の説明資料と旧版の引継ぎ帳で、PL-3の但し書きに違いがありました。お話を聞かせてください。責任を問う場ではありません。'],
  ['taniguchi', 'ありがとうございます。実は私も、昨日から資料を見直していました。どこで落ちたのか、気になって。'],
  ['taniguchi', '作成者として申し上げると、私は私が見られた資料の範囲で、できるだけ正確に書いたつもりです。']
], 'ch1.tg_menu', { effects: [{ clock: { minute: hm(10, 30) } }, rel('taniguchi', 0, 1)], view: v25('office', ['taniguchi'], CAP.tg) });

const tgAny = ANY(F('r8.ev_v12_src'), F('r8.ev_completion'), F('r8.ev_shared_note'));
choice('ch1.tg_menu', '谷口係長に、何を尋ねる？', [
  opt('src', '「現行の説明資料は、何をもとに作られましたか」', 'ch1.tg_src', { requires: NF('r8.ev_v12_src') }),
  opt('done', '「B棟の移設工事は、いつ終わりましたか。記録はありますか」', 'ch1.tg_done_q', { requires: NF('r8.ev_completion') }),
  opt('shared', '「PL-3は、いまもB棟の作業灯系統と共用されていますか」', 'ch1.tg_shared', { requires: NF('r8.ev_shared_note') }),
  opt('end', '話を聞き終える', 'ch1.tg_end', { requires: tgAny, tone: 'neutral' })
], { who: 'taniguchi', view: v25('office', ['taniguchi'], CAP.tg) });

line('ch1.tg_src', [
  ['player', '現行の説明資料は、何をもとに作られましたか。'],
  ['taniguchi', '共有フォルダにあった、2021年の第2版のファイルが土台です。ファイルの更新履歴も、ここに残っています。'],
  ['taniguchi', '第3版という綴じがあることは、昨日まで知りませんでした。台帳にも出ていませんし、共有フォルダにもありません。'],
  ['player', 'では、但し書きを意図して外したわけではない……。'],
  ['taniguchi', '外したつもりはありません。ただ、「そう言い切れる証拠」を、私が出せるわけでもない。ファイルの履歴は、第2版から複製した、という事実を示しているだけです。', 'serious'],
  '{player}は、メモに書き添えた。『現行資料は第2版のファイルから作成（更新履歴で確認）。第3版は、作成時に参照されていない』'
], 'ch1.tg_menu', { effects: [set('r8.ev_v12_src'), rel('taniguchi', 1, 1), log('【確認済み】谷口さんの説明と更新履歴：現行Ver.1.2は第2版のファイルから作成。第3版は参照されていない', 'evidence')], view: v25('office', ['taniguchi'], CAP.tg) });

line('ch1.tg_done_q', [
  ['player', 'B棟の移設工事は、いつ終わりましたか。記録は残っていますか。'],
  ['taniguchi', '2025年11月です。完了報告書があります。……写しをお渡しできます。検修区の確認印も入っています。'],
  '報告書には、2025年11月27日付で、B棟の作業灯系統の移設が完了したことが書かれていた。ただし、旧ピット照明回路との接続について触れた箇所は、見当たらない。',
  ['taniguchi', '移設が終わったのは確かです。でも、旧回路との切り離しまで書いてあるかというと……図面と照らさないと、断言できません。'],
  ['player', '移設の完了は「確認済み」。切り離しまで終わったかは、別の話ですね。']
], 'ch1.tg_menu', { effects: [set('r8.ev_completion'), rel('taniguchi', 1, 0), log('【確認済み】完了報告書の写し：B棟の作業灯系統の移設は2025年11月27日に完了。旧回路との切り離しの記載は確認できない', 'evidence')], view: v25('office', ['taniguchi'], CAP.tg) });

line('ch1.tg_shared', [
  ['player', 'PL-3は、いまもB棟の作業灯系統と共用されているのでしょうか。'],
  ['taniguchi', '最新の系統図を見ると、PL-3の先に「L-7経路　要現場確認」という注記が残っています。前任の誰かが付けたものです。'],
  ['taniguchi', '図面上は切り離されたはずでも、現場で確かめた記録がない。私から「共用は続いていない」とは、言えません。'],
  ['player', '「共用が続いている」とも、言えないわけですね。'],
  ['taniguchi', 'はい。分からない、が正確です。', 'serious']
], 'ch1.tg_menu', { effects: [set('r8.ev_shared_note'), rel('taniguchi', 1, 0), log('【未確認】系統図の注記「L-7経路 要現場確認」：PL-3の現在の共用状況は、どの資料でも確認されていない', 'evidence')], view: v25('office', ['taniguchi'], CAP.tg) });

line('ch1.tg_end', [
  ['taniguchi', '私に分かる範囲は、これくらいです。必要なら、現場での確認に、私も同行します。'],
  ['player', 'ありがとうございました。聞いた内容は、確認済みと証言を分けて記録します。']
], 'ch1.int_menu', { effects: [set('r8.tg_done'), { clock: { minute: hm(11, 30) } }], view: v25('office', ['taniguchi'], CAP.tg) });

// ---- 大槻 ----
branch('ch1.ot_intro', [[F('r8.phone_otsuki'), 'ch1.ot_intro_b']], 'ch1.ot_intro_a', { effects: [{ clock: { minute: hm(13, 30) } }], view: v25('shed', ['otsuki'], CAP.ot) });
line('ch1.ot_intro_a', [
  '青浜検修庫。庫内には、油とゴムのにおいが、かすかに漂っている。',
  ['otsuki', '改善推進室か。ヘルメットは、そこの棚だ。庫内を歩くときは、必ず着けてくれ。'],
  ['player', 'お借りします。'],
  '黄色い線の内側を歩いて、事務所の前で、大槻検修長に会った。',
  ['otsuki', '話を聞きたい、とは河合さんから聞いた。立ち話で、いいか。']
], 'ch1.ot_menu', { effects: [rel('otsuki', 0, 1)], view: v25('shed', ['otsuki'], CAP.ot) });
line('ch1.ot_intro_b', [
  '青浜検修庫。庫内には、油とゴムのにおいが、かすかに漂っている。',
  ['otsuki', '昨日の電話のやつか。現物を見ながら話したほうが、早い。ヘルメットは、そこの棚だ。'],
  ['player', 'お借りします。昨日は、お忙しいところ、ありがとうございました。'],
  ['otsuki', '電話では、はっきり言えんこともあったからな。分かる範囲で、話そう。']
], 'ch1.ot_menu', { effects: [rel('otsuki', 1, 0)], view: v25('shed', ['otsuki'], CAP.ot) });

choice('ch1.ot_menu', '大槻検修長に、何を尋ねる？', [
  opt('why', '「PL-3の但し書きは、なぜ必要になったのですか」', 'ch1.ot_why', { requires: NF('r8.ev_outage_memory') }),
  opt('origin', '「第3版の綴じは、いつ、誰が作ったのですか」', 'ch1.ot_origin', { requires: NF('r8.ev_v3_origin') }),
  opt('end', '話を聞き終える', 'ch1.ot_end', { requires: ANY(F('r8.ev_outage_memory'), F('r8.ev_v3_origin')), tone: 'neutral' })
], { who: 'otsuki', view: v25('shed', ['otsuki'], CAP.ot) });

line('ch1.ot_why', [
  ['player', 'PL-3の但し書きは、なぜ必要になったのですか。'],
  ['otsuki', '昔の話だ。庫内の作業灯が、一度に落ちてな。点検の作業が、四十分ほど止まったことがある。'],
  ['otsuki', '原因は、B棟の灯りと旧ピットの回路が、同じ系統でつながっていたことだった。……と、俺は記憶している。'],
  ['player', 'その件の記録は、ありますか。'],
  ['otsuki', '作業日誌に書いたはずだが、いつの日誌だったかまでは、思い出せん。'],
  '貴重な証言だが、記録が見つかるまでは「推定」。{player}は、メモにそう書き込んだ。'
], 'ch1.ot_menu', { effects: [set('r8.ev_outage_memory'), log('【推定】大槻検修長の記憶：作業灯が一度に落ち、点検が約40分止まったことが但し書きの発端。作業日誌は未確認', 'evidence')], view: v25('shed', ['otsuki'], CAP.ot) });

line('ch1.ot_origin', [
  ['player', '第3版の綴じは、いつ、誰が作ったのですか。'],
  ['otsuki', '2023年の春だ。当時の設備更新担当だった松岡さんが、現場の聞き取りをまとめて、こうして綴じてくれた。'],
  ['otsuki', '綴じは、検修区のキャビネットに置いたまま。本社の台帳には、出さなかった。出す、出さんの話は、誰も俺に言わなかったからな。……責めているんじゃない。うちも、確認しなかった。'],
  ['player', '台帳に出さなかったのは、誰かの判断だったのでしょうか。'],
  ['otsuki', 'さあな。判断というより、手続きの抜けじゃないか。人が代わると、よくある話だ。']
], 'ch1.ot_menu', { effects: [set('r8.ev_v3_origin'), rel('otsuki', 1, 0), log('【推定】大槻検修長の説明：第3版は2023年春に松岡さんが綴じ、検修区に置いたまま台帳へ出されなかった（手続きの抜け）', 'evidence')], view: v25('shed', ['otsuki'], CAP.ot) });

line('ch1.ot_end', [
  ['otsuki', '現場は、書類より先に動く。だが書類が違えば、現場が困る。うちからも、出すものは出す。'],
  ['player', 'ありがとうございました。聞いたお話は、証言として記録します。']
], 'ch1.int_menu', { effects: [set('r8.ot_done'), { clock: { minute: hm(15, 0) } }], view: v25('shed', ['otsuki'], CAP.ot) });

// ---- 松岡 ----
line('ch1.mt_intro', [
  '本社の小会議室。松岡さんは、いまは営業企画課に所属している。',
  ['matsuoka', '設備更新の資料の件ですね。手元に控えが少し残っています。引継ぎがきちんとできていたら、と思っていました。', 'worry'],
  ['player', 'お話をうかがうだけです。責める意図はありません。'],
  ['matsuoka', 'ありがとうございます。思い出せる範囲で、お話しします。記憶ですから、間違っているところも、あるかもしれません。']
], 'ch1.mt_menu', { effects: [{ clock: { minute: hm(16, 0) } }, rel('matsuoka', 0, 1)], view: v25('hr', ['matsuoka'], CAP.mt) });

choice('ch1.mt_menu', '松岡さんに、何を尋ねる？', [
  opt('minutes', '「但し書きは、何を根拠に書き足したのですか」', 'ch1.mt_minutes', { requires: NF('r8.ev_minutes_memory') }),
  opt('reg', '「第3版を台帳へ登録しなかった事情は、ありますか」', 'ch1.mt_reg', { requires: NF('r8.ev_not_registered') }),
  opt('end', '話を聞き終える', 'ch1.mt_end', { requires: ANY(F('r8.ev_minutes_memory'), F('r8.ev_not_registered')), tone: 'neutral' })
], { who: 'matsuoka', view: v25('hr', ['matsuoka'], CAP.mt) });

line('ch1.mt_minutes', [
  ['player', '但し書きは、何を根拠に書き足したのですか。'],
  ['matsuoka', '2023年2月の調整会議だったと思います。検修区と設備課が、PL-3の扱いで一度、意見が分かれて。結局「B棟が終わるまで撤去しない」で合意した、と記憶しています。'],
  ['player', '議事録は、残っていますか。'],
  ['matsuoka', '議事録は取っていたはずですが、どこに保存したか……共有フォルダの旧い階層かもしれません。いま確実にある、とは言えないです。'],
  '合意の存在を示す、重要な証言。ただし、議事録という裏づけは、まだ手元にない。'
], 'ch1.mt_menu', { effects: [set('r8.ev_minutes_memory'), log('【推定】松岡さんの記憶：2023年2月の調整会議で「B棟完了まで撤去しない」と合意。議事録の所在は不明', 'evidence')], view: v25('hr', ['matsuoka'], CAP.mt) });

line('ch1.mt_reg', [
  ['player', '第3版を台帳へ登録しなかった事情は、ありますか。'],
  ['matsuoka', '3月末に異動が決まって、引継ぎの時間がほとんどなかったんです。綴じは検修区に預けて、登録は後任にお願いするつもりで……そのままに、なってしまいました。'],
  ['matsuoka', '私の確認不足です。ただ、登録を後任へ頼んだという記録も、残していなくて。それが、いちばん悔やまれます。', 'worry'],
  ['player', '一人の失敗というより、引継ぎの仕組みの穴、と言えそうですね。'],
  ['matsuoka', 'そう言っていただけると、救われます。でも、結果は結果ですから。']
], 'ch1.mt_menu', { effects: [set('r8.ev_not_registered'), rel('matsuoka', 1, 1), log('【推定】松岡さんの説明：異動の引継ぎが短く、第3版の台帳登録を後任へ頼んだ記録も残っていない', 'evidence')], view: v25('hr', ['matsuoka'], CAP.mt) });

line('ch1.mt_end', [
  ['matsuoka', '私にできることがあれば、言ってください。議事録は、探してみます。', 'smile'],
  ['player', 'ありがとうございます。見つかった場合は、保管場所と日付も、あわせて教えてください。']
], 'ch1.int_menu', { effects: [set('r8.mt_done'), { clock: { minute: hm(17, 0) } }], view: v25('hr', ['matsuoka'], CAP.mt) });

// ---- 整理：証言の扱い ----
line('ch1.int_wrap', [
  '夕方、{player}は、聞き取りの内容と二つの文書を、机の上に並べた。',
  '話は、ところどころ重なっている。けれど、重なっているからといって、書類で確かめられたわけではない。',
  ['kawai', '今日の聞き取り、お疲れさまでした。……メモは、どうまとめますか。']
], 'ch1.note_how', { effects: [{ clock: { minute: hm(17, 30) } }, tl('4月13日 関係者への聞き取り（2名以上）を実施')], view: v25('office', ['kawai'], '4月13日（木） 17:30 本社 改善推進室') });

choice('ch1.note_how', '食い違う記憶と資料を、メモにどう書く？', [
  opt('separate', '「書類で見たものは『確認済み』、聞いた話は『証言』と、欄を分けて書く」', 'ch1.note_a', { tone: 'careful', effects: [set('r8.note_separate'), ev('accuracy', 3), rel('kawai', 1, 0)] }),
  opt('merge', '「皆の話が重なっているので、『事実』の欄にまとめて書く」', 'ch1.note_b', { tone: 'quick', effects: [set('r8.note_merged'), ev('accuracy', -3), rel('kawai', -1, 0)] }),
  opt('ask', '「合わない点は、本人へ確認し直し、返事を待ってから書く」', 'ch1.note_c', { tone: 'caring', effects: [set('r8.note_recheck'), ev('teamwork', 2), ev('reporting', 1)] })
], { who: 'kawai', view: v25('office', ['kawai']) });

line('ch1.note_a', [
  ['kawai', '分けて書くのは、手間ですが、あとで効いてきます。「誰が、何を見て言ったのか」が追えるので。', 'smile'],
  ['kawai', '証言は、嘘という意味ではありません。裏づけがまだない、というだけです。']
], 'ch1.plan_intro', { view: v25('office', ['kawai']) });
line('ch1.note_b', [
  ['kawai', '……「事実」の欄に、証言が入っていますね。皆の話が重なっていても、記憶が重なっているだけかもしれません。', 'serious'],
  ['kawai', '今回は私が直しておきます。次からは、書類で確かめたものだけを、事実の欄に。']
], 'ch1.plan_intro', { view: v25('office', ['kawai']) });
line('ch1.note_c', [
  ['kawai', '本人へ確認し直す。丁寧なやり方です。ただ、確認を待つ間も、期限は進みます。', 'normal'],
  ['kawai', '返事が来るまでの時間も、計画に入れておきましょう。']
], 'ch1.plan_intro', { effects: [log('【記録】食い違う点は本人に確認し直す方針（返信待ちの時間を計画に含める）', 'note')], view: v25('office', ['kawai']) });

// ============ 重要な選択2：現在の系統をどう確かめるか ============
line('ch1.plan_intro', [
  ['kawai', 'ここまでで、見えてきたことを整理しましょう。'],
  ['kawai', '旧版には、PL-3の但し書きがある。現行資料には、ない。理由は、文書だけでは分からない。'],
  ['kawai', '撤去してよいかを決めるには、「いまの系統」が分からないといけません。でも、いまの系統を直接確かめた人は、どうやらいない。'],
  ['kawai', '説明会は火曜、報告の期限は月曜の夕方です。確かめ方は、いくつかあります。どれを選ぶか、私は口を出しません。ただ、理由は説明できるようにしておいてください。']
], 'ch1.plan', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }, tl('4月14日 PL-3の現在の系統をどう確かめるか検討')], view: v25('office', ['kawai'], CAP.off3) });

choice('ch1.plan', 'PL-3が今も共用されているかを、どう確かめる？', [
  opt('site', '「検修区と設備課へ、現地での系統確認の同行を、正式に依頼します（立入りの手続きと日程調整が必要です）」', 'ch1.plan_site', { tone: 'careful', effects: [set('r8.plan_site'), log('方針：現地での系統確認を正式に依頼（立入り手続き・立会い付き）', 'choice')] }),
  opt('drawing', '「設備課に図面と完了報告書の再確認を依頼し、書類の範囲で結論を出します」', 'ch1.plan_drawing', { tone: 'quick', effects: [set('r8.plan_drawing'), log('方針：図面と完了報告書の再確認（書類の範囲で結論を出す）', 'choice')] }),
  opt('memory', '「三人の記憶が合っているので、それを根拠に進めます」', 'ch1.plan_memory', { tone: 'risky', effects: [set('r8.plan_memory'), ev('accuracy', -2), log('方針：関係者の記憶の一致を根拠にする', 'choice')] })
], { important: true, who: 'kawai', view: v25('office', ['kawai'], CAP.off3) });

line('ch1.plan_site', [
  '{player}は、設備課と検修区へ「現地での系統確認の同行依頼」を、正式な文書で出した。立入りの手続き、作業のない時間帯、立会い者の調整が必要になる。',
  ['taniguchi', '承知しました。火曜の午前10時に、検修区の立会いのもとで確認できるよう、調整します。ただし、あくまで当日の状況次第です。'],
  ['otsuki', '立入りの手順さえ踏めば、いつでもいい。ヘルメットを忘れんようにな。'],
  ['kawai', '現地確認の結果が出るのは、報告の後になりますね。月曜の報告には、「何が分かっていて、何が分かっていないか」を、はっきり書かなければなりません。']
], 'ch1.grade_intro', { view: v25('office', ['kawai', 'taniguchi'], CAP.off3) });

line('ch1.plan_drawing', [
  '{player}は、設備課へ「図面と完了報告書の再確認」を依頼した。書類の範囲なら、すぐに結果が出る。',
  ['taniguchi', '分かりました。ただ、先ほどの「要現場確認」の注記は、書類だけでは消せません。そこは、そのまま残して報告します。'],
  ['kawai', '書類で言えることと、言えないこと。分けて書く必要がありますね。']
], 'ch1.grade_intro', { view: v25('office', ['kawai', 'taniguchi'], CAP.off3) });

line('ch1.plan_memory', [
  ['kawai', '三人の記憶が、そろって「B棟の移設が終われば解消」で一致している、ということですね。'],
  '{player}は、現地にも図面にも当たらず、証言の一致を根拠に進めることにした。',
  ['kawai', '一致しているのは、心強い材料です。ただ、三人とも「当時の話」をしていて、「今の系統」の話ではありません。それで、足りるでしょうか。', 'worry']
], 'ch1.grade_intro', { view: v25('office', ['kawai'], CAP.off3) });

// ============ 確度の整理 ============
line('ch1.grade_intro', [
  '報告の前に、{player}は、集まった材料を一つずつ見直した。「どの話が、どこまで確かか」。',
  ['kawai', '最後に、確度を整理しましょう。確認済み、推定、未確認。この三つを取り違えると、報告そのものが信頼を失います。']
], 'ch1.grade_task', { view: v25('office', ['kawai'], CAP.off3) });

N['ch1.grade_task'] = {
  id: 'ch1.grade_task', type: 'task', kind: 'grade', title: '根拠の確度整理', intro: '集めた材料を、確度で仕分けます。書類や記録で確かめたものは「確認済み」、証言などで裏づけが足りないものは「推定」、まだ確かめていないものは「未確認」です。',
  config: {
    claims: [
      { id: 'g1', label: '現行の説明資料（Ver.1.2）には、PL-3の但し書きの記載がない', source: '2つの文書を並べて照合', truth: 'confirmed', why: '原本を直接照らし合わせて確認しています。' },
      { id: 'g2', label: '旧版（第3版）の綴じには、PL-3を撤去しない旨の但し書きがある', source: '閲覧申請で受領した写し', truth: 'confirmed', why: '写しを自分の目で確認しています。ただし「正式に承認された内容か」は別の話です。' },
      { id: 'g3', label: '第3版は、文書管理台帳で「確認中（未登録）」になっている', source: '瀬川さんと台帳の画面を確認', truth: 'confirmed', why: '台帳という記録で確認できています。' },
      { id: 'g4a', label: '現行資料は、第2版のファイルを土台に作成された', source: '谷口さんの説明と、ファイルの更新履歴', truth: 'confirmed', why: '更新履歴という記録で裏づけがあります。', when: 'r8.ev_v12_src' },
      { id: 'g4b', label: '現行資料は、第2版をもとに作られたのだろう', source: '内容が第2版と一致するため（作成者には未確認）', truth: 'inferred', why: '状況からは自然ですが、作成者に確かめていないため、推定です。', unless: 'r8.ev_v12_src' },
      { id: 'g5', label: '今もPL-3は、B棟の作業灯系統と共用されている', source: 'どの資料にも、現在の状態を確認した記録がない', truth: 'unconfirmed', why: '共用が続いている根拠も、解消された根拠も、まだありません。' },
      { id: 'g6', label: 'B棟の作業灯系統の移設工事は、2025年11月に完了している', source: '完了報告書の写し（検修区の確認印あり）', truth: 'confirmed', why: '記録で確認できています。', when: 'r8.ev_completion' },
      { id: 'g6b', label: '完了報告書で、PL-3との切り離しまで確認できている', source: '報告書の写し（切り離しに触れた記載は見当たらない）', truth: 'unconfirmed', why: '報告書に切り離しの記載がないため、確認できていません。', when: 'r8.ev_completion' },
      { id: 'g7', label: '但し書きは、過去に作業灯が落ちて点検が止まったことが発端だった', source: '大槻検修長の記憶のみ。作業日誌は未確認', truth: 'inferred', why: '証言はありますが、記録による裏づけがないため、推定です。', when: 'r8.ev_outage_memory' },
      { id: 'g8', label: '2023年2月の調整会議で、「B棟完了まで撤去しない」と合意された', source: '松岡さんの記憶のみ。議事録は未発見', truth: 'inferred', why: '合意の存在を示す証言ですが、議事録が見つかるまでは推定です。', when: 'r8.ev_minutes_memory' },
      { id: 'g9', label: '第3版は、2023年春に松岡さんが現場の聞き取りをもとに綴じた', source: '大槻検修長の説明（綴じ自体の記録はない）', truth: 'inferred', why: '一人の説明で、作成記録がないため、推定です。', when: 'r8.ev_v3_origin' },
      { id: 'g10', label: '第3版が台帳に登録されなかったのは、異動時の引継ぎで手順が漏れたため', source: '松岡さんの説明。引継ぎの記録は残っていない', truth: 'inferred', why: '本人の説明としては自然ですが、記録がないため、推定です。', when: 'r8.ev_not_registered' }
    ]
  },
  results: [
    { min: 70, goto: 'ch1.grade_good', effects: [set('r8.grade_good'), ev('accuracy', 3)], label: '確度を適切に区別' },
    { min: 0, goto: 'ch1.grade_loose', effects: [set('r8.grade_loose'), ev('accuracy', -2)], label: '確度の取り違えあり' }
  ],
  view: v25('office', [], CAP.off3)
};

line('ch1.grade_good', [
  ['kawai', '整理表、読みました。確認済みと、そうでないものが、きちんと分かれていますね。', 'smile'],
  ['kawai', '「いちばん言いたいこと」ほど、確度を丁寧に書いてください。']
], 'ch1.report_intro', { effects: [log('【整理】根拠を確認済み／推定／未確認に仕分け（適切）', 'note')], view: v25('office', ['kawai'], CAP.off3) });
line('ch1.grade_loose', [
  ['kawai', 'いくつか、推定を確認済みのように扱っている箇所がありますね。記録で裏づけがあるか、証言だけか。もう一度、見直しましょう。', 'worry'],
  ['kawai', '間違いを責めているのではありません。報告に載せる前に気づけた、ということです。']
], 'ch1.report_intro', { effects: [log('【整理】確度の取り違えを指摘され、見直した', 'note')], view: v25('office', ['kawai'], CAP.off3) });

// ============ 重要な選択3：報告方針 ============
line('ch1.report_intro', [
  '4月17日、月曜の夕方。報告の時間になった。',
  ['kawai', '説明会は明日の14時です。報告は、私から上にも伝えます。あなたの言葉で、聞かせてください。'],
  ['kawai', '結論を急ぐ必要はありません。「何が分かっていて、何が分かっていないのか」を、まず聞きたいです。']
], 'ch1.policy', { effects: [{ clock: { addDay: 3, minute: hm(16, 0) } }, tl('4月17日 室長へ報告')], view: v25('office', ['kawai'], CAP.rep) });

choice('ch1.policy', '室長への報告で、どう伝える？', [
  opt('graded', '「確認済み・推定・未確認を分けて報告し、次に確認する人と日付を添えます」', 'ch1.report_task', { tone: 'careful', effects: [log('報告方針：確度を分け、次の確認の担当と期日を添える', 'choice')] }),
  opt('assert', '「第3版が正しい。現行資料の但し書きの欠落は誤りだ」と明言し、差替えを依頼します', 'ch1.as1', { tone: 'risky', effects: [set('r8.asserted'), log('報告方針：「第3版が正しい」と明言し差替えを依頼', 'choice')] }),
  opt('defer', '「確証が揃うまで、説明会での当該箇所の説明を延期してください」と依頼します', 'ch1.df1', { tone: 'neutral', effects: [set('r8.deferred'), log('報告方針：確証が揃うまで当該箇所の説明の延期を依頼', 'choice')] })
], { important: true, who: 'kawai', view: v25('office', ['kawai'], CAP.rep) });

N['ch1.report_task'] = {
  id: 'ch1.report_task', type: 'task', kind: 'compose', title: '室長への報告文の作成', intro: '5つの要素から、適切な文を選んで報告をまとめます。確度を分けること、断定しないこと、次の行動を添えること。',
  config: { asm: '【報告文（案）】', confirm: '報告文を確定する', done: '室長へ報告する', stamp: '推敲済' },
  slots: [
    { id: 'r1', label: '結論の言い方', options: [
      { id: 'good', good: true, text: '現行資料と第3版で、PL-3の但し書きの有無が食い違っていることを確認しました。どちらが正しいかは、現時点で断定できません。', why: '事実と判断を分けています。' },
      { id: 'bad1', good: false, text: '現行の説明資料は誤りです。第3版が正しいと考えます。', why: '根拠なしの断定です。' },
      { id: 'bad2', good: false, text: '大きな問題はなく、転記ミスの範囲だと思います。', why: '確かめていない原因を決めつけています。' }
    ] },
    { id: 'r2', label: '確認済みの事項', options: [
      { id: 'good', good: true, text: '確認済みなのは、2つの文書の記載の違いと、第3版が台帳で「確認中（未登録）」であることです。', why: '記録で確かめた事実だけを挙げています。' },
      { id: 'bad1', good: false, text: '確認済みなのは、第3版の但し書きが正式に合意された内容であることです。', why: '合意は証言のみで、確認済みではありません。' },
      { id: 'bad2', good: false, text: '確認済みなのは、三人の証言が一致していることです。', why: '証言の一致は、記録による確認とは別です。' }
    ] },
    { id: 'r3', label: '推定・未確認の事項', options: [
      { id: 'good', good: true, text: '推定は、当時の経緯（作業灯の件・調整会議の合意）で、証言のみで記録は未発見です。未確認は、PL-3の現在の系統です。', why: '推定と未確認を区別して書いています。' },
      { id: 'bad1', good: false, text: '経緯も系統も、証言が一致しているので、確認済みと考えてよいと思います。', why: '証言を確認済みに格上げしています。' },
      { id: 'bad2', good: false, text: '経緯も系統も、特に報告すべき不確かな点はありません。', why: '不確かな点を伏せています。' }
    ] },
    { id: 'r4', label: '依頼・次の行動', options: [
      { id: 'good', good: true, text: '版の整理（第3版の台帳登録と、現行資料の訂正の要否）と、現在の系統の確認を、担当と期日を決めて進めたいです。', why: '次の行動が具体的です。' },
      { id: 'bad1', good: false, text: '説明会の資料は、明日までに第3版の記載へ差し替えてください。', why: '確認前の差替えを求めています。' },
      { id: 'bad2', good: false, text: '追加の確認は不要なので、このまま説明会に進めてください。', why: '未確認を放置しています。' }
    ] },
    { id: 'r5', label: '関係者への配慮', options: [
      { id: 'good', good: true, text: '食い違いは、個人の責任ではなく、版管理の手続きの問題として扱いたいと思います。', why: '個人を責めず、仕組みに目を向けています。' },
      { id: 'bad1', good: false, text: '前任の担当者が手続きを怠ったことが原因だと思います。', why: '確かめていない原因で個人を名指ししています。' }
    ] }
  ],
  results: [
    { min: 80, goto: 'ch1.rep_sound', effects: [set('r8.report_sound'), ev('reporting', 4), rel('kawai', 1, 0)], label: '確度を分けた明確な報告' },
    { min: 0, goto: 'ch1.rep_muddy', effects: [set('r8.report_muddy'), ev('reporting', -2)], label: '確度の混ざった報告' }
  ],
  view: v25('office', [], CAP.rep)
};

line('ch1.rep_sound', [
  ['kawai', '論点が整理されていて、上にも伝えやすいです。「分かっていること」と「これから確かめること」の境目が、はっきりしている。', 'smile'],
  ['kawai', '説明会は、この整理をもとに進めましょう。']
], 'ch1.final', { view: v25('office', ['kawai'], CAP.rep) });
line('ch1.rep_muddy', [
  ['kawai', 'ここは、確認済みと推定が混ざっているように読めます。上に伝えるには、まだ少し危ういですね。', 'worry'],
  ['kawai', '今回は、私が不確かな点を明記して補います。次は、確度を分けて書いてください。']
], 'ch1.final', { view: v25('office', ['kawai'], CAP.rep) });

branch('ch1.final', [
  [ALL(F('r8.report_sound'), F('r8.grade_good'), F('r8.plan_site'), F('r8.ev_v3_origin')), 'ch1.e1_1'],
  [ALL(F('r8.report_sound'), F('r8.grade_good'), F('r8.plan_drawing'), F('r8.ev_completion')), 'ch1.e2_1']
], 'ch1.e3_1');

// ---- 断定ルート ----
line('ch1.as1', [
  ['player', '第3版が正しいはずです。現行の説明資料の但し書きの欠落は誤りなので、明日までに差し替えてください。'],
  ['kawai', '……「正しいはず」の根拠を、一つずつ聞かせてください。', 'serious'],
  ['player', '旧版に書いてあって、関係者の話も……いえ、証言は一致しています。', 'worry']
], 'ch1.as_br', { view: v25('office', ['kawai'], CAP.rep) });
branch('ch1.as_br', [[F('r8.early_assert'), 'ch1.as_rep']], 'ch1.as2', { view: v25('office', ['kawai'], CAP.rep) });
line('ch1.as_rep', [
  ['kawai', '先日も、確かめる前に「誤り」と言っていましたね。急ぎたい気持ちは分かります。でも、同じことが続くと、報告の言葉そのものが軽く見られてしまいます。', 'serious']
], 'ch1.as2', { effects: [rel('kawai', -1, 0)], view: v25('office', ['kawai'], CAP.rep) });
line('ch1.as2', [
  ['kawai', '第3版は、台帳で「確認中」。証言は、記憶。PL-3の今の系統は、誰も見ていない。それで、設備課の資料を「誤り」と言い切るのですか。'],
  ['kawai', '作成した谷口さんの名前が、報告に載るんです。確かめていないことを、断定で伝えることはできません。'],
  '報告は、差し戻された。'
], 'ch1.e4_1', { effects: [rel('kawai', -2, 0), ev('reporting', -4), ev('accuracy', -3), log('報告が差し戻された：根拠のない断定により信頼が低下', 'note')], view: v25('office', ['kawai'], CAP.rep) });

// ---- 延期ルート ----
line('ch1.df1', [
  ['player', '確証が揃うまで、説明会で当該箇所の説明を、延期していただけませんか。'],
  ['kawai', '延期、ですか。理由は？'],
  ['player', '台帳の状態と、現在の系統が、確認できていないためです。'],
  ['kawai', '理由は、筋が通っています。ただ、「確認できていない」を、いつまでに、誰が、どうするのか。それがないまま延期だけを求めると、現場の計画が止まります。'],
  '室長は、延期ではなく、不確かな点を明記したうえで説明会を進める案を出した。{player}は、その案を受け入れた。'
], 'ch1.e3_1', { effects: [ev('reporting', 1), log('延期の依頼は、不確かな点を明記して説明会を進める案に変更された', 'note')], view: v25('office', ['kawai'], CAP.rep) });

// ============ 結末 ============
// 結末1：版を正す
line('ch1.e1_1', [
  '4月18日、火曜日。午前10時。{player}は、設備課の谷口、検修区の大槻とともに、B棟の庫内にいた。',
  ['otsuki', '系統図の「L-7」は、ここだ。……配線の行き先を、実際に追ってみよう。'],
  ['taniguchi', '現場の端子の表示を、図面と照らして確認します。……確認できました。PL-3の先に、B棟の作業灯への分岐が、一本だけ残っています。', 'surprise'],
  ['otsuki', 'やはりな。移設のとき、この一本だけが切り離されなかったんだ。第3版の但し書きは、いまも生きていたわけだ。'],
  ['taniguchi', '説明資料は、私の作成物です。Ver.1.3として、但し書きを加えて訂正します。経緯も、版の注記に残します。']
], 'ch1.e1_2', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }, tl('4月18日 現地確認：PL-3の先にB棟の作業灯への分岐が残っていることを確認')], view: v25('shed', ['otsuki', 'taniguchi'], CAP.fin) });
line('ch1.e1_2', [
  '午後の説明会。資料には、但し書きと、その確認日、確認方法が書き加えられていた。',
  ['kawai', '食い違いは、誰かの失敗ではなく、版を管理する仕組みの穴でした。今日から、第3版は台帳へ正式に登録します。'],
  ['kawai', '{player}さんの報告は、確認済みと推定を分けていました。だから、現場が動けたんです。', 'smile'],
  'PL-3は、B棟の分岐を移設してから撤去することになり、工事の順序が一部見直された。',
  'こうして、白紙のようだった一頁に、確かな文字が書き加えられた。'
], 'ch1.end_corrected', { effects: [{ clock: { minute: hm(14, 0) } }], view: v25('office', ['kawai'], CAP.meet) });
end('ch1.end_corrected', { title: '版を正す', summary: '現地確認でPL-3の但し書きが今も有効だと分かり、説明資料はVer.1.3へ訂正された。確認済み・推定・未確認を分けた報告が、工事の順序を守った。', effects: [{ ending: 'corrected' }, tl('4月18日 結末：説明資料をVer.1.3へ訂正し、第3版を台帳へ登録'), set('r8.end_corrected')], view: v25('office', ['kawai'], CAP.meet) });

// 結末2：役目を終えた但し書き
line('ch1.e2_1', [
  '4月18日、火曜日の午前。設備課から、完了報告書と最新の系統図の再確認結果が届いた。',
  ['taniguchi', '完了報告書と最新の系統図を、突き合わせました。B棟の作業灯系統の移設は、2025年11月に完了。図面の上では、PL-3との共用は解消されています。'],
  ['taniguchi', 'ただ、図面の注記「L-7経路 要現場確認」は、書類だけでは消せません。そこは「未確認」のままです。', 'serious'],
  ['kawai', '書類で言えることと、言えないことが、分かれていますね。']
], 'ch1.e2_2', { effects: [{ clock: { addDay: 1, minute: hm(10, 0) } }, tl('4月18日 図面・完了報告書の再確認結果が届く（現場確認は未実施）')], view: v25('office', ['kawai', 'taniguchi'], '4月18日（火） 10:00 本社 改善推進室') });
line('ch1.e2_2', [
  '午後の説明会では、「B棟の移設の完了により、第3版の但し書きは役目を終えた可能性が高い」と、根拠と限界を添えて伝えられた。',
  ['otsuki', '現場としては、撤去の前に一度、自分の目で見る。それは、こちらでやる。'],
  ['kawai', '但し書きは、版の注記として履歴に残します。消したのではなく、役目を終えた、という記録として。'],
  '撤去の工程は予定どおり進み、確認が残る一点は、次の確認の議題として引き継がれた。'
], 'ch1.end_retired', { effects: [{ clock: { minute: hm(14, 0) } }], view: v25('office', ['kawai'], CAP.meet) });
end('ch1.end_retired', { title: '役目を終えた但し書き', summary: '完了報告書と図面から、但し書きは役目を終えた可能性が高いと整理され、工程は予定どおり進んだ。ただし系統図の注記は「未確認」として次の確認へ引き継がれた。', effects: [{ ending: 'retired' }, tl('4月18日 結末：但し書きを「役目を終えた可能性が高い」と記録（現場確認は次の議題）'), set('r8.end_retired')], view: v25('office', ['kawai'], CAP.meet) });

// 結末3：確認中のまま、前へ
line('ch1.e3_1', [
  '4月18日、火曜日。午後2時、関係部署への説明会。',
  '資料の該当ページには「確認中」の印と、確認する人、期日が書き加えられた。',
  ['kawai', '確認できていないことを、確認できていないと書く。地味ですが、これが一番、後で困らないやり方です。'],
  ['taniguchi', '承知しました。第3版の扱いは、台帳上の整理が終わるまで「確認中」のまま、資料に注記します。'],
  ['otsuki', '現場は、確認が済むまで、PL-3には手を付けない。それで、いいな。']
], 'ch1.e3_2', { effects: [{ clock: { addDay: 1, minute: hm(14, 0) } }, tl('4月18日 説明会：PL-3の件は「確認中」と明記して実施')], view: v25('office', ['kawai', 'taniguchi'], CAP.meet) });
line('ch1.e3_2', [
  '説明会は、結論を出さないまま、次の確認の日程を決めて終わった。',
  ['kawai', '白紙のままの頁も、白紙だと分かっていれば、次に書き込めます。'],
  'まだ分からないことは残った。しかし、何が分かっていないかは、全員が共有できた。'
], 'ch1.end_open', { view: v25('office', ['kawai'], CAP.meet) });
end('ch1.end_open', { title: '確認中のまま、前へ', summary: '結論は出さず、不確かな点を「確認中」と明記して説明会を終えた。誰が・いつまでに確認するかが決まり、謎は次の章へ持ち越された。', effects: [{ ending: 'open' }, tl('4月18日 結末：結論を出さず、確認の担当と期日を決めて次へ'), set('r8.end_open')], view: v25('office', ['kawai'], CAP.meet) });

// 結末4：断定の差し戻し
line('ch1.e4_1', [
  '夕方5時40分。報告書は、手元へ戻ってきた。',
  ['kawai', '悪い結果ではありません。ただ、この報告のままでは、説明会に出せません。'],
  ['kawai', '「正しいはず」と「確認した」は、別のことです。……今日は、もう一度、根拠を並べ直してください。'],
  '翌日の説明会では、河合が「資料に食い違いがあり、確認中です」とだけ伝えた。{player}の名前は、報告者として出されなかった。',
  '誰も責められなかった。それが、かえって重かった。',
  ['player', '（確かめていないことを、言い切ってはいけなかった。……次は、根拠を持って話そう）', 'worry']
], 'ch1.end_sent_back', { effects: [{ clock: { minute: hm(17, 40) } }, tl('4月17日 報告が差し戻される')], view: v25('office', ['kawai'], '4月17日（月） 17:40 本社 改善推進室') });
end('ch1.end_sent_back', { title: '断定の差し戻し', summary: '根拠のない断定で報告が差し戻され、説明会では「確認中」とだけ伝えられた。誰も責められなかったが、報告者としての信頼を失った。', effects: [{ ending: 'sent_back' }, tl('4月18日 結末：断定による差し戻し。説明会は「確認中」で実施'), set('r8.end_sent_back')], view: v25('office', ['kawai'], '4月18日（火） 14:00 関係部署への説明会') });

// ============ 章・分岐図・結末 ============
const chapters = [
  { id: 'ch1', title: '白紙の一頁', season: 'S1 白紙の一頁', start: 'ch1.o1', status: 'playable', synopsis: '車両基地の設備更新プロジェクトで、旧版の引継ぎ帳と現行の説明資料の「但し書き」が食い違っていた。版・日付・出典・確認状況を比べ、関係者から話を聞き、確認済み・推定・未確認を分けて上司へ報告する。' },
  { id: 'ch2', title: '初期の証言', season: 'S2 初期の証言', start: '', status: 'planned', synopsis: '（未制作）第1章の「確認中」の項目を引き継ぎ、当時の証言の食い違いを丁寧にたどる。' }
];

const maps = {
  ch1: {
    lanes: [{ id: 'main', label: '主筋', color: '#1a2f55' }, { id: 'docs', label: '文書', color: '#14663f' }, { id: 'people', label: '聞き取り', color: '#a35c00' }, { id: 'end', label: '結末', color: '#c8281e' }],
    nodes: [
      { id: 'm0', lane: 0, x: 0, label: '着任', sub: '設備更新プロジェクト', reveal: ['ch1.o1'] },
      { id: 'm1', lane: 0, x: 1, label: '食い違いに気づく', sub: 'PL-3の但し書き', reveal: ['ch1.o3'] },
      { id: 'm2', lane: 0, x: 2, label: '最初の動き', sub: '大きな分かれ道', star: true, reveal: ['ch1.ic1'], choice: 'ch1.ic1' },
      { id: 'd1', lane: 1, x: 3, label: '文書の取扱い確認', sub: '規程を守って調べる', reveal: ['ch1.rec1'] },
      { id: 'd2', lane: 1, x: 4, label: '版の比較', sub: '矛盾マーカー', reveal: ['ch1.docs_task'] },
      { id: 'p1', lane: 2, x: 5, label: '関係者の聞き取り', sub: '谷口・大槻・松岡から2人以上', reveal: ['ch1.int_menu'] },
      { id: 'p2', lane: 2, x: 6, label: '証言の書き方', sub: '事実と証言を分ける', reveal: ['ch1.note_how'], choice: 'ch1.note_how' },
      { id: 'm3', lane: 0, x: 7, label: '現在の系統の確かめ方', sub: '大きな分かれ道', star: true, reveal: ['ch1.plan'], choice: 'ch1.plan' },
      { id: 'd3', lane: 1, x: 8, label: '確度の整理', sub: '確認済み／推定／未確認', reveal: ['ch1.grade_task'] },
      { id: 'm4', lane: 0, x: 9, label: '報告の方針', sub: '大きな分かれ道', star: true, reveal: ['ch1.policy'], choice: 'ch1.policy' },
      { id: 'e1', lane: 3, x: 10, label: '版を正す', sub: '現地確認でVer.1.3へ', reveal: ['ch1.end_corrected'] },
      { id: 'e2', lane: 3, x: 10, label: '役目を終えた但し書き', sub: '書類で整理・現場確認は次へ', reveal: ['ch1.end_retired'] },
      { id: 'e3', lane: 3, x: 10, label: '確認中のまま、前へ', sub: '不確かな点を明記', reveal: ['ch1.end_open'] },
      { id: 'e4', lane: 3, x: 10, label: '断定の差し戻し', sub: '根拠なしの断定', reveal: ['ch1.end_sent_back'] }
    ],
    edges: [['m0', 'm1'], ['m1', 'm2'], ['m2', 'd1'], ['d1', 'd2'], ['d2', 'p1'], ['p1', 'p2'], ['p2', 'm3'], ['m3', 'd3'], ['d3', 'm4'], ['m4', 'e1'], ['m4', 'e2'], ['m4', 'e3'], ['m4', 'e4']]
  }
};

const endings = {
  corrected: { title: '版を正す', text: '現地確認でPL-3の但し書きが今も有効と分かり、説明資料はVer.1.3へ訂正された。第3版は台帳へ正式に登録された。' },
  retired: { title: '役目を終えた但し書き', text: '完了報告書と図面から、但し書きは役目を終えた可能性が高いと整理された。系統図の注記は「未確認」として次へ引き継がれた。' },
  open: { title: '確認中のまま、前へ', text: '結論は出さず、不確かな点を「確認中」と明記して前へ進んだ。確認の担当と期日が決まった。' },
  sent_back: { title: '断定の差し戻し', text: '根拠のない断定で報告が差し戻された。誰も責められなかったが、報告者としての信頼を失った。' }
};

const story = { storyId: 'r8', mode: 'R8', title: '消えた引継ぎ帳', subtitle: '職場調査サスペンス', startYear: 2028, persistentHud: true, characters, chapters, nodes: N, maps, endings };
mkdirSync('src/data/r8', { recursive: true });
writeFileSync('src/data/r8/story.json', JSON.stringify(story, null, 1));
console.log('nodes:', Object.keys(N).length);
