// R7 第9章「はじめての評価」（11月4日）。回想と評価が交差する章。モチーフ：手帳の付箋（四月のオレンジ → 十一月の青）。
// 構造：朝（剥がれかけた付箋）→ ルート別の評価者 → 手帳の回想（ルート別＋共通の頁）→ 自己評価（重要選択＋作文）
//       → 同僚コメント（ルート別）→ 同期 → 評価面談（ルート別の観点）→ 過去の傷への向き合い → 推薦者を選ぶ（重要選択）。
// ルート（ch6.wish_station|depot|dispatch|planning）は永続。無ければ station を既定にする。
export default function ch9(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, tl, log, F, NF, ANY, ALL, hm, v25, res3 } = k;

  characters.sawada ??= { id: 'sawada', name: '沢田 良平', kana: 'さわだ りょうへい', role: '車両基地 検修技術員', dept: 'depot', age: 31, years: 9, uniform: '#2f4f6a', hair: '#2a2a2a', skin: '#e8c29c', trait: '丁寧で手が早い。説明は短く、図で見せる。', bio: '橘検修長の下で九年。見習いの質問には、一度考えさせてから答える。', gender: 'm', accessory: 'none' };
  characters.minase ??= { id: 'minase', name: '水無瀬 美咲', kana: 'みなせ みさき', role: '輸送指令員', dept: 'dispatch', age: 34, years: 12, uniform: '#2a3d52', hair: '#2b2118', skin: '#f0cfae', trait: '落ち着いた声。復唱を欠かさない。', bio: '浜口と同じ指令所の当番員。新人の電話記録を丁寧に読む。', gender: 'f', accessory: 'glasses' };
  characters.toda ??= { id: 'toda', name: '戸田 玲子', kana: 'とだ れいこ', role: '本社 輸送計画課 課長補佐', dept: 'planning', age: 42, years: 19, uniform: '#3a4a5e', hair: '#2a2024', skin: '#f0cfae', trait: '数字を見て、人の事情も見る。会議では最後まで聞く。', bio: 'ダイヤ案の取りまとめ役。現場の声を資料に落とす仕事を大事にしている。', gender: 'f', accessory: 'glasses' };
  characters.kuroda ??= { id: 'kuroda', name: '黒田 拓海', kana: 'くろだ たくみ', role: '輸送計画課 係員', dept: 'planning', age: 27, years: 4, uniform: '#3a4a5e', hair: '#1c1c28', skin: '#efc9a6', trait: '資料の体裁にうるさい。教えるのは早口。', bio: '入社四年目。数字の置き方に、いつも一言ある。', gender: 'm', accessory: 'none' };

  const ROUTES = ['station', 'depot', 'dispatch', 'planning'];
  const rbranch = (id, prefix) => branch(id, [[F('ch6.wish_depot'), prefix + 'depot'], [F('ch6.wish_dispatch'), prefix + 'dispatch'], [F('ch6.wish_planning'), prefix + 'planning']], prefix + 'station');
  const E = (key, op, val) => ({ eval: { key, op, val } });
  const V = (key, op, val) => ({ var: { key, op, val } });

  const M = {
    station: { ev: 'shiraishi', ev2: 'kubota', bg: 'office', cast: ['shiraishi', 'kubota', 'morishita'], place: '青嶺中央駅 駅事務室' },
    depot: { ev: 'tachibana', ev2: 'sawada', bg: 'depot', cast: ['tachibana', 'sawada', 'morishita'], place: '青浜総合車両センター 検修長室' },
    dispatch: { ev: 'hamaguchi', ev2: 'minase', bg: 'office', cast: ['hamaguchi', 'minase', 'morishita'], place: '輸送指令所 面談室' },
    planning: { ev: 'toda', ev2: 'kuroda', bg: 'hr', cast: ['toda', 'kuroda', 'morishita'], place: '本社 輸送計画課 小会議室' }
  };
  const VM = (r, cap) => v25(M[r].bg, M[r].cast, cap ?? M[r].place);
  const MEM = (cap = '（手帳）') => v25('office', [], cap);

  // ============ 1. 朝：剥がれかけた付箋 ============
  line('ch9.open', [
    'ロッカーの内側で、付箋が一枚、剥がれかけていた。四月の字だ。「分からないと言う」。',
    ['yamashina', '貼り直せよ。取れそうな目標は、だいたい取れる。', 'smile'],
    ['shiraishi', '11月4日。半年の評価面談だ。点より、言葉を見る。'],
    ['morishita', '来月、三日間の実習枠があります。面談で、推薦者を一人。'],
    ['yamashina', '午後に呼ばれてる。…腹が痛い。気のせいだ。', 'worry'],
    ['shiraishi', '先に評価者へ顔を出してこい。会って話すのが礼儀だ。']
  ], 'ch9.route', {
    effects: [{ clock: { addDay: 50, minute: hm(7, 50) } }, set('ch9.started'), tl('11月4日 半年の評価面談の日を迎える'), log('第9章 はじめての評価', 'chapter')],
    view: v25('office', ['shiraishi', 'morishita', 'yamashina'], '11月4日（木） 7:50 駅事務室')
  });
  rbranch('ch9.route', 'ch9.in_');

  line('ch9.in_station', [
    '机に、久保田の指導ノートが七冊。どれも付箋だらけで、背が膨らんでいる。',
    ['kubota', '最初の頁は「分からないと言えない」。最新は「質問が多い」です。', 'smile'],
    ['shiraishi', '質問が多いのは、悪くない。黙る客のほうが怖い。'],
    ['kubota', 'いい話も直す話も、同じ温度で話します。冷めても同じです。']
  ], 'ch9.rc7_station', { effects: [set('ch9.route_station')], view: VM('station', '9:00 駅事務室') });
  line('ch9.in_depot', [
    'ゴン、と鉄を叩く音。検修長室の湯呑みが、一拍遅れて震えた。',
    ['tachibana', '駅の面談に、基地が口を出す。筋違いだ。…書いてきた。'],
    ['sawada', '十回以上、床下の記録を一緒に見ました。見たのは、手の止め方です。'],
    ['tachibana', '安全に。記録を残して。報告する。揃わん奴に、床下は預けん。']
  ], 'ch9.rc7_depot', { effects: [set('ch9.route_depot')], view: VM('depot', '9:00 検修長室') });
  line('ch9.in_dispatch', [
    '壁の向こうで、電話が鳴る。三回目の前に、誰かが取った。',
    ['hamaguchi', '扉の外で聞いた回数、四十超え。数えていた。俺がな。'],
    ['minase', '電話記録は誤字が少ない。見ていたのは、聞き返す回数です。', 'smile'],
    ['hamaguchi', '評価の芯は一つ。分からないと言えるか。それだけだ。']
  ], 'ch9.rc7_dispatch', { effects: [set('ch9.route_dispatch')], view: VM('dispatch', '9:00 輸送指令所') });
  line('ch9.in_planning', [
    '会議机の上に、付箋だらけの時刻表。紙とトナーの匂いがする。',
    ['toda', '評価は資料で見ます。読んだ人が何を決められたか、です。'],
    ['kuroda', '先月の集計表、列を直してもらって会議が十分縮みました。…礼は言いました。言ったはずです。', 'smile'],
    ['toda', '数字に顔のある人だ。ただ、顔を数字に直すのは、まだ練習中ね。']
  ], 'ch9.rc7_planning', { effects: [set('ch9.route_planning')], view: VM('planning', '9:00 輸送計画課') });

  // ============ 2. 手帳の回想：ルート別（ch7 / ch8 の中盤）============
  const RC = {
    station: {
      a: { cap: '（回想）夏の臨時列車 青嶺中央駅', cast: ['kubota', 'shiraishi'], bg: 'office', lines: [
        '七月の頁。「改札、一度閉める」。字が走っている。',
        ['kubota', '（回想）階段の下で詰まってます。閉めるなら、先に守るものを。'],
        ['player', '（回想）車いすの経路だけ、先に確保します。'],
        ['kubota', '（回想）…正解です。悔しいくらい。', 'smile']] },
      b: { cap: '（回想）九月 改札の外 青嶺中央駅', cast: ['kubota'], bg: 'office', lines: [
        '九月の頁。改札の外に立ち、通る足取りだけ観察した日。',
        ['kubota', '（回想）迷う前の人にも、先に一歩出る。…断られても死にません。'],
        ['player', '（回想）あの、階段の手前の方に、声をかけます。'],
        '付箋は青。一行だけ。「今日は、先に声が出た」。'] }
    },
    depot: {
      a: { cap: '（回想）夏の検修庫', cast: ['sawada', 'tachibana'], bg: 'depot', lines: [
        '七月の頁に、油の染みが丸くついている。猛暑の検修庫の日だ。',
        ['sawada', '（回想）数字は、読んで、書いて、もう一度読む。'],
        ['player', '（回想）…検査日と期限が、一日ずれて見えます。'],
        ['tachibana', '（回想）誤記は、人を責める道具じゃない。次の人の命綱だ。']] },
      b: { cap: '（回想）九月 入出区の立会い', cast: ['sawada'], bg: 'depot', lines: [
        '九月の頁。「合図　三回」。黄色い線の外から見た日。',
        ['sawada', '（回想）ここから先は線の内側。見習いは、見て、聞くだけです。'],
        ['player', '（回想）乗務員さんと検修側、同じ言葉を同時に言うんですね。'],
        ['sawada', '（回想）一人の確信より、二人の一致。そう教わりました。']] }
    },
    dispatch: {
      a: { cap: '（回想）夏の臨時列車 輸送指令所', cast: ['hamaguchi', 'minase'], bg: 'office', lines: [
        '七月の頁。縦に並ぶ時刻と短い言葉。扉の外で書き取った日だ。',
        ['hamaguchi', '（回想・電話）臨九、八分遅れ。再開見込み、五分。見込みだ。'],
        ['hamaguchi', '（回想）{player}、今のは何が確定で、何が見込みだ。'],
        ['player', '（回想）八分が確定。五分は、見込みです。']] },
      b: { cap: '（回想）九月 一報の下書き', cast: ['minase'], bg: 'office', lines: [
        '九月の頁。一報の下書きが、消した跡だらけで残っている。',
        ['minase', '（回想）「調査中」と書く勇気も要ります。次の連絡の時刻つきで。'],
        ['player', '（回想）三回書き直して、一行だけ残りました。'],
        ['minase', '（回想）その一行が、一番高いんです。', 'smile']] }
    },
    planning: {
      a: { cap: '（回想）夏の臨時列車 需要の集計', cast: ['toda', 'kuroda'], bg: 'hr', lines: [
        '七月の頁に、集計表の下書きが貼ってある。',
        ['player', '（回想）18時台は、ホームで待つ人が数えられていません。'],
        ['toda', '（回想）なら表の端に注記を。決める人は、注記から読み始めます。', 'smile'],
        ['kuroda', '（回想）その一行、会議の議題になりましたよ。']] },
      b: { cap: '（回想）九月 秋ダイヤの読み合わせ', cast: ['toda'], bg: 'hr', lines: [
        '九月の頁は、赤ペンの丸だらけ。',
        ['player', '（回想）この折返し、清掃の五分が足りません。現場の限界です。'],
        ['toda', '（回想）限界をそのまま資料に書ける人は少ない。直しましょう。'],
        '付箋は青。「ダイヤは、人の約束の束」。'] }
    }
  };
  for (const r of ROUTES) {
    branch('ch9.rc7_' + r, [[F('ch7.route_done_' + r), 'ch9.rc7_' + r + '_y']], 'ch9.rc_none7');
    line('ch9.rc7_' + r + '_y', RC[r].a.lines, 'ch9.rc8_' + r, { effects: [{ var: { key: 'ch9.pages', add: 1 } }], view: v25(RC[r].a.bg, RC[r].a.cast, RC[r].a.cap) });
    branch('ch9.rc8_' + r, [[F('ch8.route_done_' + r), 'ch9.rc8_' + r + '_y']], 'ch9.rc_none8');
    line('ch9.rc8_' + r + '_y', RC[r].b.lines, 'ch9.pages', { effects: [{ var: { key: 'ch9.pages', add: 1 } }], view: v25(RC[r].b.bg, RC[r].b.cast, RC[r].b.cap) });
  }
  line('ch9.rc_none7', [
    '七月の頁は、ほとんど白い。忙しかったからではない。書かなかったのだ。',
    ['player', '（白は、次に書く人のための場所だ。…そう思うことにする）']
  ], 'ch9.rc8route', { view: MEM('（七月の頁）') });
  rbranch('ch9.rc8route', 'ch9.rc8_');
  line('ch9.rc_none8', [
    '九月の頁にも余白。一行だけ。「次は、その場で書く」。',
    ['player', '（足りない分は、今日、口で言おう）']
  ], 'ch9.pages', { view: MEM('（九月の頁）') });

  // ============ 3. 手帳の頁：共通の回収 ============
  line('ch9.pages', ['頁をめくる。付箋の色は、オレンジから青へ。色の変わり目が、判断の変わり目だった。'], 'ch9.pgA', { view: MEM() });
  branch('ch9.pgA', [[F('ch3.honest'), 'ch9.pgA_h'], [F('ch3.pushed'), 'ch9.pgA_p']], 'ch9.pgB');
  line('ch9.pgA_h', ['五月。「体調が悪い。申告した」。久保田の赤字。「申告は、勤務表を守る」。'], 'ch9.pgB', { view: MEM('（五月の頁）') });
  line('ch9.pgA_p', ['五月。「無理して出た」。後から足した字。「見えていなかった。休む判断も仕事」。'], 'ch9.pgB', { view: MEM('（五月の頁）') });
  branch('ch9.pgB', [[F('ch4.secret_kept'), 'ch9.pgB_s'], [F('ch4.trust_built'), 'ch9.pgB_t']], 'ch9.pgC');
  line('ch9.pgB_s', ['六月。「山科の話は、誰にも言わなかった」。インクが滲んでいる。一人で持つと、紙まで重くなる。'], 'ch9.pgC', { view: MEM('（六月の頁）') });
  line('ch9.pgB_t', ['六月。「山科と、苦手を言い合った」。下には、笑ったことだけ書いてある。'], 'ch9.pgC', { view: MEM('（六月の頁）') });
  branch('ch9.pgC', [[F('ch5.late_report'), 'ch9.pgC_l']], 'ch9.pgC2');
  line('ch9.pgC_l', ['七月。「報告が遅れた」。赤い下線が三本。今は、不完全でも先に第一報を出す。'], 'ch9.pgC2', { view: MEM('（七月の頁）') });
  branch('ch9.pgC2', [[F('ch5.root_found'), 'ch9.pgC_r']], 'ch9.pgD');
  line('ch9.pgC_r', ['七月の別の行。「原因は手順でなく置き場所」。矢印が三本、図の端まで伸びている。'], 'ch9.pgD', { view: MEM('（七月の頁）') });
  branch('ch9.pgD', [[F('ch2.idea_selfpost'), 'ch9.pgD_s'], [F('ch2.proposal_sent'), 'ch9.pgD_p'], [F('ch2.idea_consult'), 'ch9.pgD_c'], [F('ch2.idea_skip'), 'ch9.pgD_k']], 'ch9.pgE');
  line('ch9.pgD_s', ['四月五日。券売機の横に貼った手書きの絵。久保田の字。「着眼は良。順番が逆」。'], 'ch9.pgE', { view: MEM('（四月五日の頁）') });
  line('ch9.pgD_p', ['四月五日。提案書の写し。三段構成。赤丸が一つ。「通った」。'], 'ch9.pgE', { view: MEM('（四月五日の頁）') });
  line('ch9.pgD_c', ['四月五日。久保田との相談メモ。「事実から書く」。提案書には届かなかった。順番だけ残った。'], 'ch9.pgE', { view: MEM('（四月五日の頁）') });
  line('ch9.pgD_k', ['四月五日。何も書いていない。券売機の前の男性の顔だけ、覚えている。'], 'ch9.pgE', { view: MEM('（四月五日の頁）') });
  branch('ch9.pgE', [[F('legacy.concealed'), 'ch9.pgE_c']], 'ch9.pgF');
  line('ch9.pgE_c', ['四月二日の隅。小さな字。「運行情報の誤りに、触れなかった」。', ['player', '（初日の私は、認めるより、やり過ごした）']], 'ch9.pgF', { view: MEM('（四月二日の頁）') });
  branch('ch9.pgF', [[F('legacy.rule_break'), 'ch9.pgF_r']], 'ch9.pg_end');
  line('ch9.pgF_r', ['見返しに、定規で引いた太い線。「決まりを飛ばして動いた日」。消さない。消さずに、次の頁へ。'], 'ch9.pg_end', { view: MEM('（見返し）') });
  branch('ch9.pg_end', [[V('ch9.pages', '>=', 2), 'ch9.pg_full']], 'ch9.pg_thin');
  line('ch9.pg_full', ['書き込みの多い手帳は、言い訳の隙がない。自己評価シートを広げた。'], 'ch9.self_stance', { view: MEM() });
  line('ch9.pg_thin', ['余白の多い手帳は、「これから書く」の別名でもある。自己評価シートを広げた。'], 'ch9.self_stance', { view: MEM() });

  // ============ 4. 自己評価 ============
  choice('ch9.self_stance', '自己評価シート。何から書きますか？', [
    opt('fact', '事実と数字から', 'ch9.self_route', { tone: 'careful', effects: [set('ch9.self_fact'), ev('accuracy', 2)] }),
    opt('fail', '失敗と、変えたことから', 'ch9.self_route', { tone: 'honest', effects: [set('ch9.self_fail'), ev('reporting', 2)] }),
    opt('others', '助けてくれた人と、自分の役割から', 'ch9.self_route', { tone: 'caring', effects: [set('ch9.self_others'), ev('teamwork', 2)] })
  ], { important: true, view: MEM('（自己評価シート）') });
  rbranch('ch9.self_route', 'ch9.self_');
  const sl = (id, label, o) => ({ id, label, options: o.map(([t, g, w], i) => ({ id: id + i, text: t, good: g, why: w })) });
  const SELF = {
    station: [sl('s1', '半年で、いちばん力を入れたこと', [['迷う方に先に声をかけ、回数を記録しました。', true, '行動と記録がそろっています。'], ['いつも一生懸命やりました。', false, '具体的な行動が見えません。'], ['同期より速く覚えました。', false, '比較は評価の観点とずれます。']]),
      sl('s2', '課題', [['忙しいと報告が後回しになります。第一報の時間を決めます。', true, '課題と対策のセットです。'], ['特にありません。', false, '課題が見えないと、伸びしろも見えません。'], ['指示が分かりにくいことがありました。', false, '他責に聞こえます。']]),
      sl('s3', '次の半年', [['接客の記録を続け、後輩に渡せる形にします。', true, '継続と共有の一歩です。'], ['もっと頑張ります。', false, '確認できません。'], ['異動できるよう努力します。', false, '異動は結果です。']])],
    depot: [sl('s1', '基地で、いちばん力を入れたこと', [['記録票の数字を、読む・書く・読み直すの三回で確認しました。', true, '手順と回数が具体的です。'], ['床下の作業を早く覚えました。', false, '見習いは速さより手順です。'], ['先輩の作業に積極的に入りました。', false, '資格のない作業に入るのは、安全上、評価されません。']]),
      sl('s2', '課題', [['聞くのをためらうことがあります。聞く時間を計画に入れます。', true, '安全に直結する課題を認めています。'], ['特にありません。', false, '基地ではごまかしが一番危険です。'], ['工具の名前が多すぎます。', false, '対策がありません。']]),
      sl('s3', '次の半年', [['検修作業補助の研修計画を立て、駅の勤務との両立を人事と相談します。', true, '資格と勤務条件の両方を見ています。'], ['すぐ基地へ異動したいです。', false, '要件と順序を飛ばしています。'], ['体力をつけます。', false, '大切ですが中心ではありません。']])],
    dispatch: [sl('s1', '指令所で、いちばん力を入れたこと', [['電話の内容を確定と見込みに分けて書き、復唱を欠かしませんでした。', true, '指令の基本姿勢と一致しています。'], ['指令員の動きをたくさん見ました。', false, '見学の量では測れません。'], ['回線に出る練習を頼みました。', false, '見習いは回線に触れません。']]),
      sl('s2', '課題', [['分からないとき黙ります。「確認します」を一言目にします。', true, '指令でいちばん大切な言葉です。'], ['課題はありません。', false, '振り返りがありません。'], ['電話が苦手です。', false, '感想で終わっています。']]),
      sl('s3', '次の半年', [['ダイヤ図の読み方を、週一回、駅で練習します。', true, '研修に備える具体策です。'], ['早く指令員になります。', false, '資格と研修の順序を無視しています。'], ['当番表を覚えます。', false, '本質から外れています。']])],
    planning: [sl('s1', '計画課の補助で、いちばん力を入れたこと', [['改札通過数と現場の感触を突き合わせ、表に注記を足しました。', true, '数字と現場の橋渡しです。'], ['資料をきれいに仕上げました。', false, '見た目だけでは決められません。'], ['会議で積極的に発言しました。', false, '量より中身です。']]),
      sl('s2', '課題', [['結論を先に言う癖があります。根拠を先に置きます。', true, '課題と対策のセットです。'], ['特にありません。', false, '資料は見直しで上がります。'], ['データが少なかったです。', false, '自分の行動に落ちていません。']]),
      sl('s3', '次の半年', [['現場と計画課の資料を往復し、違いを一枚にまとめます。', true, '現場を知る人の役割です。'], ['課長補佐の仕事を覚えます。', false, '段階を飛ばしています。'], ['残業して資料を増やします。', false, '労働条件を守る観点で評価されません。']])]
  };
  for (const r of ROUTES) {
    N['ch9.self_' + r] = { id: 'ch9.self_' + r, type: 'task', kind: 'compose', title: '自己評価シートの記入', intro: '三つの欄を、事実と行動で埋めます。', slots: SELF[r],
      results: res3('ch9.self_rg', 'ch9.self_rm', 'ch9.self_rb', [set('ch9.self_strong'), ev('reporting', 2)], [ev('reporting', 1)], [ev('reporting', -1), set('ch9.self_weak')]), view: v25('office', [], '自己評価シート') };
  }
  line('ch9.self_rg', ['ペンを置く。七か月前の自分には、書けなかった文章だった。'], 'ch9.peer_route', { view: MEM('（自己評価シート）') });
  line('ch9.self_rm', ['半分は自分の言葉。残り半分は「頑張ります」の顔をしていた。そこだけ、消しゴムをかけた。'], 'ch9.peer_route', { view: MEM('（自己評価シート）') });
  line('ch9.self_rb', ['読み返すと、誰にでも当てはまる文章だった。付箋が、少しだけ、こちらを見ている。'], 'ch9.peer_route', { view: MEM('（自己評価シート）') });

  // ============ 5. 同僚コメント → 同期 ============
  rbranch('ch9.peer_route', 'ch9.peer_');
  line('ch9.peer_station', [
    ['kubota', '同僚コメントは本人に見せない決まりです。読み上げます。決まりの外で。', 'smile'],
    ['kubota', '「最初の一声が上手になった。忙しいほど、周りへの声が遅れる」。'],
    ['player', '最初の一声は、久保田さんの教えです。'],
    ['kubota', '教えただけでは身につきません。…優しい人は、一人で抱えて後で爆発します。早めに回して。']
  ], 'ch9.peer_station_t', { view: v25('hr', ['kubota'], '13:00 休憩室') });
  line('ch9.peer_depot', [
    ['sawada', '同僚評価は短く書く決まりです。一行だけ、長く書きました。'],
    ['sawada', '「数字を声に出して確認する。ただ、床下が気になると線に近づく」。'],
    ['player', '…図星です。身を乗り出してました。'],
    ['sawada', '私は九年前、橘さんに襟をつかまれました。好奇心は、足元を見てから使え、と。', 'smile']
  ], 'ch9.peer_depot_t', { view: v25('depot', ['sawada'], '13:00 詰所') });
  line('ch9.peer_dispatch', [
    ['minase', '読みます。「記録が丁寧。聞き返しを恐れない。ただ、聞く前に一度整理を」。'],
    ['player', 'つい、すぐ聞いてしまいます。'],
    ['minase', '「八分遅れですか」より、「八分遅れ、原因確認中、見込み未定で、よろしいですか」。復唱に、自分の理解を一行混ぜる。', 'smile'],
    ['minase', '私も三年、毎日聞き返しました。']
  ], 'ch9.peer_dispatch_t', { view: v25('office', ['minase'], '13:00 指令所 通路') });
  line('ch9.peer_planning', [
    ['kuroda', '僕、褒めるの苦手で。事実だけ書きました。読みます。'],
    ['kuroda', '「注記を足す習慣が資料を上げた。ただ、結論の前に背景を一枚」。'],
    ['player', '説明を先に置く、ということですね。'],
    ['kuroda', '…それと個人的感想です。あなたの資料は、駅の音がします。', 'smile']
  ], 'ch9.peer_planning_t', { view: v25('hr', ['kuroda'], '13:00 輸送計画課') });
  for (const r of ROUTES) {
    const who = M[r].ev2;
    branch('ch9.peer_' + r + '_t', [[F('ch3.honest'), 'ch9.peer_' + r + '_h'], [F('ch3.pushed'), 'ch9.peer_' + r + '_p']], 'ch9.yama');
    line('ch9.peer_' + r + '_h', [[who, '体調を自分から申告した日、みんな覚えています。無理しない人は、長持ちします。']], 'ch9.yama', { view: v25(M[r].bg, [who], '13:30') });
    line('ch9.peer_' + r + '_p', [[who, '無理を押して出た日、顔色が悪かった。休む判断も、仕事です。', 'worry']], 'ch9.yama', { view: v25(M[r].bg, [who], '13:30') });
  }

  const YV = v25('hr', ['yamashina'], '14:30 休憩室');
  line('ch9.yama', [
    '自販機の前。山科が、開けていない缶コーヒーを両手で握っている。',
    ['yamashina', '「同期との関係」って欄があるんだよ。俺、何て書かれてる？', 'worry']
  ], 'ch9.yama_b', { view: YV });
  branch('ch9.yama_b', [[F('ch4.secret_kept'), 'ch9.yama_s'], [F('ch4.covered_yama'), 'ch9.yama_c'], [F('ch4.told_truth'), 'ch9.yama_tt'], [F('ch4.helped_yama'), 'ch9.yama_h'], [F('ch4.trust_built'), 'ch9.yama_t']], 'ch9.yama_n');
  line('ch9.yama_s', [['yamashina', '…あれ、本当に誰にも言わなかったよな。気づいてた。', 'worry'], ['yamashina', '助かった。でもお前、一人で重かったろ。次は半分持たせろ。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 1)], view: YV });
  line('ch9.yama_c', [['yamashina', '庇われた側ってのは、情けなくて、嬉しくて、最悪だ。', 'smile'], ['player', '次は私が庇われる側で試す。'], ['yamashina', 'いい度胸だ。覚えとく。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 2)], view: YV });
  line('ch9.yama_tt', [['yamashina', 'お前が駅長に話した日、三日、口を利かなかった。', 'serious'], ['yamashina', 'でも俺のミスは、手順書の一行になった。…三日が俺の限界だ。']], 'ch9.yama_after', { effects: [rel('yamashina', 2, 0)], view: YV });
  line('ch9.yama_h', [['yamashina', '礼を言い損ねてた。あの日、手が回ってなかった。', 'worry'], ['yamashina', '…ありがとな。それだけだ。', 'smile']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 2)], view: YV });
  line('ch9.yama_t', [['yamashina', 'お互い苦手を言い合って以来、紙の評価がどうでもよくなった。', 'smile'], ['yamashina', '…いや、嘘。腹は痛い。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 1)], view: YV });
  line('ch9.yama_n', [['yamashina', '同期って、近いのに話さないよな。…面談の後、飯でも。', 'smile']], 'ch9.yama_after', { effects: [rel('yamashina', 0, 1)], view: YV });
  rbranch('ch9.yama_after', 'ch9.ya_');
  line('ch9.ya_station', [['yamashina', '俺は基地、お前は駅。基地の人間には、駅に信頼できる奴がいるのが、地味にでかい。']], 'ch9.iv_route', { view: YV });
  line('ch9.ya_depot', [['yamashina', 'お前が基地に通ってるの、正直悔しい。…来月、一緒に落ちたら飲もう。', 'smile']], 'ch9.iv_route', { view: YV });
  line('ch9.ya_dispatch', [['yamashina', '指令か。基地と指令は犬猿って噂だが、お前なら話が通じそうだ。']], 'ch9.iv_route', { view: YV });
  line('ch9.ya_planning', [['yamashina', '計画に行くなら一つ頼む。入出区の五分を、資料に書いてくれ。']], 'ch9.iv_route', { view: YV });

  // ============ 6. 評価面談：一枚の紙・一言の指摘から始める ============
  rbranch('ch9.iv_route', 'ch9.iv_');
  const IV = {
    station: [['shiraishi', '机の上の紙を、指で叩いた。「券売機の前、三十秒」。', 'normal'], ['shiraishi', '久保田が測っていた。迷う客の前に立つまでの秒数だ。四月は二分だった。']],
    depot: [['tachibana', '紙は一枚。「確認印、欠落、一」。', 'normal'], ['tachibana', '七月、お前が見つけた。印の欠けを。あの一個で、俺はお前を見る目が変わった。']],
    dispatch: [['hamaguchi', '紙に、赤丸が一つ。八月の復唱記録の、ある一語だ。', 'normal'], ['hamaguchi', '「見込み」を、お前は「確定」と書かなかった。それだけで、ここに座らせる価値がある。']],
    planning: [['toda', '一枚の表を、机の中央に置いた。端に小さな注記。', 'normal'], ['toda', 'この一行を、課内の五人が読みました。あなたの字です。']]
  };
  for (const r of ROUTES) line('ch9.iv_' + r, [...IV[r].map(([w, t, m]) => [w, t, m]), ['morishita', '今日の観点は三つ。順に、具体的な場面でお話しします。']], 'ch9.iv_stance', { effects: [{ clock: { minute: hm(16, 0) } }, { var: { key: 'ch9.strong', set: 0 } }], view: VM(r, '16:00 ' + M[r].place + ' 評価面談') });
  branch('ch9.iv_stance', [[F('ch9.self_fact'), 'ch9.iv_sf'], [F('ch9.self_fail'), 'ch9.iv_sl']], 'ch9.iv_so');
  const IVV = v25('hr', ['morishita'], '16:10 評価面談');
  line('ch9.iv_sf', [['morishita', '自己評価は数字の筋が通っています。数字に出ない所は、評価者の言葉で。']], 'ch9.dm_route', { view: IVV });
  line('ch9.iv_sl', [['morishita', '失敗から書く人は、伸びます。見せたくなかったでしょうに。']], 'ch9.dm_route', { view: IVV });
  line('ch9.iv_so', [['morishita', '感謝から書き始める人は少数です。評価のためでなく、癖なんでしょうね。']], 'ch9.dm_route', { view: IVV });

  const DM = {
    station: [
      { k: 'service', hi: [['kubota', '券売機の男性。あなたの名前を覚えて、また来ました。', 'smile']], mid: [['kubota', '声かけの間合いは、まだ迷ってますね。迷うのは悪くないです。']], lo: [['shiraishi', '客の顔を見る時間が短い。手順を追うと、顔を見失う。']] },
      { k: 'accuracy', hi: [['kubota', '引継ぎ帳に、抜けがほとんどない。探したんですけどね。']], mid: [['kubota', '確認が三回目で止まる日がある。四回目が、あなたの課題。']], lo: [['shiraishi', '記録の抜けが目立つ。習慣は、才能でなく反復だ。']] },
      { k: 'teamwork', hi: [['shiraishi', '忙しい時間帯に、隣の持ち場まで目が届いていた。駅は一人で回らん。', 'smile']], mid: [['kubota', '自分の持ち場に集中しすぎる日があります。隣を見て。']], lo: [['shiraishi', '助けを呼ぶのは弱さじゃない。宿題にしよう。']] }
    ],
    depot: [
      { k: 'safety', hi: [['tachibana', '線の外から見る、という約束を一度も破らなかった。それが全部だ。']], mid: [['sawada', '線の近くに寄りすぎた場面が数回。直せます。']], lo: [['tachibana', '好奇心と安全は別物だ。基地では、後者が先だ。', 'serious']] },
      { k: 'accuracy', hi: [['sawada', '誤記を見つけた数、他の見習いの倍でした。']], mid: [['tachibana', '桁を間違えた数字は見つけにくい。三回読めと言う理由だ。']], lo: [['tachibana', '手順は、飛ばす奴から事故る。信じて、守れ。']] },
      { k: 'teamwork', hi: [['sawada', '工具の受け渡し、声が自然に出ていました。']], mid: [['tachibana', '報告が遅い奴は、床下で一番嫌われる。早く、短く。']], lo: [['tachibana', '質問しない見習いは、見習いのまま終わる。聞け。']] }
    ],
    dispatch: [
      { k: 'reporting', hi: [['minase', '聞き返しの質が上がりました。復唱に、自分の理解が混ざってる。', 'smile']], mid: [['hamaguchi', '分からないとき、黙る時間が長い。三秒で「確認します」だ。']], lo: [['hamaguchi', '報告が遅れる日があった。指令では、一言の遅れが運転整理の遅れだ。', 'serious']] },
      { k: 'accuracy', hi: [['minase', '時刻、列車番号、原因、見込み。全部そろっていました。']], mid: [['hamaguchi', '時刻の書き方が日によって揺れた。指令は、読まれる仕事だ。']], lo: [['minase', '列車番号の誤りが複数。数字だけ別の紙に書く癖を。']] },
      { k: 'safety', hi: [['hamaguchi', '回線に触れない、という線を一度も越えなかった。']], mid: [['minase', '早く覚えたい気持ちは分かります。でも資格の順番は守って。']], lo: [['hamaguchi', '資格のない作業に近づきすぎた。見習いの線は、お前を守る線だ。', 'serious']] }
    ],
    planning: [
      { k: 'reporting', hi: [['kuroda', '報告の順番が、いつも整ってる。僕が教わりたいくらいです。', 'smile']], mid: [['toda', '結論を後ろに置く癖があります。先に出すと、会議が五分縮む。']], lo: [['toda', '途中経過の共有が足りません。午後三時に一行、から始めましょう。']] },
      { k: 'accuracy', hi: [['toda', '出典のない数字は意見です。あなたは、全部に出典を付けた。']], mid: [['kuroda', '単位の揺れがありました。細かいところに、信頼は宿ります。']], lo: [['kuroda', '数字の誤りが複数。提出前の読み合わせを習慣に。']] },
      { k: 'teamwork', hi: [['kuroda', '僕が詰まったとき、さりげなく助けてくれた。', 'smile']], mid: [['toda', '意見を出す前に引く場面がありました。遠慮は、情報の欠落です。']], lo: [['toda', '他の人の仕事を知る時間を取りましょう。昼休みの雑談でいい。']] }
    ]
  };
  const HI = { service: 66, accuracy: 70, reporting: 60, teamwork: 56, safety: 62 };
  const LO = { service: 58, accuracy: 62, reporting: 52, teamwork: 50, safety: 54 };
  rbranch('ch9.dm_route', 'ch9.dm_');
  for (const r of ROUTES) {
    DM[r].forEach((d, i) => {
      const id = `ch9.dm_${r}_${i}`; const nxt = i < 2 ? `ch9.dm_${r}_${i + 1}` : `ch9.sum_${r}`;
      if (i === 0) N[`ch9.dm_${r}`] = { id: `ch9.dm_${r}`, type: 'effect', effects: [], next: id };
      branch(id, [[ALL(E(d.k, '>=', HI[d.k]), NF('ch9.self_weak')), id + '_hi'], [ANY(E(d.k, '<', LO[d.k]), F('ch9.self_weak')), id + '_lo']], id + '_mid');
      line(id + '_hi', d.hi, nxt, { effects: [{ var: { key: 'ch9.strong', add: 1 } }], view: VM(r, '評価の言葉') });
      line(id + '_mid', d.mid, nxt, { view: VM(r, '評価の言葉') });
      line(id + '_lo', d.lo, nxt, { effects: [{ var: { key: 'ch9.weak', add: 1 } }], view: VM(r, '評価の言葉') });
    });
    const e = M[r].ev;
    branch(`ch9.sum_${r}`, [[V('ch9.strong', '>=', 3), `ch9.sum_${r}_a`], [V('ch9.strong', '>=', 1), `ch9.sum_${r}_b`]], `ch9.sum_${r}_c`);
    const SUM = {
      station: ['三つとも期待以上だ。次の半年は、教える側に回れ。', '期待どおりだ。得意を伸ばして、弱い所は仲間に頼れ。', '今は土台の時期だ。焦るな。だが毎日は、問われる。'],
      depot: ['三本柱が揃っている。資格の話をしていい段階だ。', '見習いとしては悪くない。弱い面を、半年で潰せ。', '今のままでは床下は預けん。直せる。直す気があるか、だ。'],
      dispatch: ['基礎は身についている。来年の基礎研修に推せる水準だ。', '標準だ。弱い面は、復唱の練習で補える。', '指令の前に、基礎を固める時期だ。焦るな。遅れるな。'],
      planning: ['基礎が、よくできています。次は主担当で一本、資料を。', '標準的です。得意と不得意を、自分の言葉で。', '今は型を作る時期です。型ができれば、あとは速い。']
    }[r];
    line(`ch9.sum_${r}_a`, [[e, SUM[0], 'smile'], ['morishita', '「期待を上回る」と記録。駅務基礎の修了も認定します。']], 'ch9.redeem', { effects: [set('ch9.rate_high'), { cert: 'station_basic' }, tl('11月4日 駅務基礎の修了を認定される')], view: VM(r) });
    line(`ch9.sum_${r}_b`, [[e, SUM[1]], ['morishita', '「期待どおり」と記録。駅務基礎の修了は、認定します。']], 'ch9.redeem', { effects: [set('ch9.rate_mid'), { cert: 'station_basic' }, tl('11月4日 駅務基礎の修了を認定される')], view: VM(r) });
    line(`ch9.sum_${r}_c`, [[e, SUM[2], 'serious'], ['morishita', '「要育成」と記録。終点ではなく、出発点です。']], 'ch9.redeem', { effects: [set('ch9.rate_low')], view: VM(r) });
  }

  // ============ 7. 傷のある過去 ============
  branch('ch9.redeem', [[ANY(F('legacy.rule_break'), F('legacy.concealed')), 'ch9.rd_route']], 'ch9.rec_route');
  rbranch('ch9.rd_route', 'ch9.rd_');
  const RD = {
    station: ['shiraishi', '紙には、君の失敗も載っている。消せん。だが、最後の一行じゃない。'],
    depot: ['tachibana', '紙に、あの件が書いてある。基地では、隠す奴から消える。話すなら今だ。'],
    dispatch: ['hamaguchi', '紙に、あの件がある。過ぎた事を隠すと、次の誤りが見えなくなる。'],
    planning: ['toda', '紙に、あの件が。数字を伏せる会議は、信用を失います。人も同じです。']
  };
  for (const r of ROUTES) line('ch9.rd_' + r, [RD[r], ['morishita', '過去は「不利」ではなく「材料」です。何を直したかで、次が決まります。']], 'ch9.rd_a', { view: VM(r, '16:40 ' + M[r].place) });
  branch('ch9.rd_a', [[F('legacy.rule_break'), 'ch9.rd_rb']], 'ch9.rd_b');
  branch('ch9.rd_rb', [[F('ch2.idea_selfpost'), 'ch9.rd_rb_post']], 'ch9.rd_rb_line');
  line('ch9.rd_rb_post', [['morishita', '許可なく貼った掲示の件。意図は良。順番は、別問題です。']], 'ch9.rd_b', { view: v25('hr', ['morishita'], '評価票') });
  line('ch9.rd_rb_line', [['morishita', '線路に降りかけた件。善意より、決まりが先です。気持ちは、記録に残しました。']], 'ch9.rd_b', { view: v25('hr', ['morishita'], '評価票') });
  branch('ch9.rd_b', [[F('legacy.concealed'), 'ch9.rd_cc']], 'ch9.rd_choice');
  line('ch9.rd_cc', [['morishita', '初日、運行情報の誤りに触れなかった件。すぐ認められる人は少数です。']], 'ch9.rd_choice', { view: v25('hr', ['morishita'], '評価票') });
  choice('ch9.rd_choice', '記録に残る過去と、どう向き合いますか？', [
    opt('plan', '再発防止の手順を自分で書いて出す', 'ch9.rd_plan', { tone: 'careful', effects: [set('ch9.redeem_plan'), ev('safety', 3), ev('reporting', 2)] }),
    opt('act', '言い訳せず、行動で示す', 'ch9.rd_act', { tone: 'honest', effects: [set('ch9.redeem_act'), ev('safety', 2), ev('teamwork', 1)] }),
    opt('explain', '事情を説明し、誤解は正したい', 'ch9.rd_explain', { tone: 'quick', effects: [set('ch9.redeem_explain'), ev('reporting', 1)] })
  ], { important: true, who: 'morishita', view: v25('hr', ['morishita'], '16:50 評価票') });
  line('ch9.rd_plan', [
    ['player', '「いつ、誰に、何を言うか」を、一枚にします。'],
    ['morishita', '一番重くて、一番信頼される選び方です。', 'smile'],
    ['morishita', '来週、読み合わせを。記録に一行足します。「自ら作成」と。']
  ], 'ch9.rec_route', { effects: [tl('11月4日 過去の指摘に、再発防止策を自ら作ると宣言')], view: v25('hr', ['morishita'], '評価票') });
  line('ch9.rd_act', [
    ['player', '毎週の振り返りを、提出します。見てもらえるように。'],
    ['morishita', '行動は、見られていないと伝わりません。いい手です。', 'smile']
  ], 'ch9.rec_route', { effects: [tl('11月4日 過去の指摘に、行動で示すと誓う')], view: v25('hr', ['morishita'], '評価票') });
  line('ch9.rd_explain', [
    ['player', '事実だけ話します。直す所は直します。'],
    ['morishita', '聞きました。説明は、そのまま添えます。事実は事実のまま、残します。']
  ], 'ch9.rec_route', { effects: [tl('11月4日 過去の指摘について、事情を説明する')], view: v25('hr', ['morishita'], '評価票') });

  // ============ 8. 推薦者を選ぶ（重要選択：ルートで相手が違う）============
  rbranch('ch9.rec_route', 'ch9.rec_in_');
  const RECIN = {
    station: ['shiraishi', '推薦書は、褒め状じゃない。書く側の、責任だ。誰に預ける。'],
    depot: ['tachibana', '推薦は、俺の名で床下を預けるのと同じだ。誰の名を書く。'],
    dispatch: ['hamaguchi', '推薦は、確定した事実しか書かん。誰に書かせる。'],
    planning: ['toda', '推薦書は、数字より重い紙です。誰に頼みますか。']
  };
  const RECOPT = {
    station: [['kubota', '久保田さん（毎日を見た人）', 'careful'], ['shiraishi', '白石駅長（駅を預かる人）', 'quick'], ['yamashina', '山科さん（同じ時間を歩いた同期）', 'caring']],
    depot: [['tachibana', '橘検修長（厳しいが、見る目は確か）', 'careful'], ['sawada', '沢田さん（毎日、手本を見せた人）', 'caring'], ['yamashina', '山科さん（同じ基地を目指す同期）', 'neutral']],
    dispatch: [['hamaguchi', '浜口さん（基準を教えた人）', 'careful'], ['minase', '水無瀬さん（記録を見てくれた人）', 'caring'], ['shiraishi', '白石駅長（駅から送り出した人）', 'neutral']],
    planning: [['toda', '戸田さん（企画の責任者）', 'careful'], ['shiraishi', '白石駅長（現場から見た人）', 'quick'], ['kubota', '久保田さん（現場の目線を教えた人）', 'caring']]
  };
  for (const r of ROUTES) {
    line('ch9.rec_in_' + r, [RECIN[r], ['morishita', '署名で実習に申し込みます。良い点も、直す点も、そのまま書かれます。']], 'ch9.rec_' + r, { view: VM(r, '17:00 ' + M[r].place) });
    choice('ch9.rec_' + r, '誰に推薦を頼みますか？', RECOPT[r].map(([w, label, tone]) => opt(w, label, 'ch9.rs_' + r + '_' + w, { tone, effects: [set('ch9.rec_' + w), set('ch9.rec_done')] })), { important: true, who: 'morishita', view: VM(r, '17:00 推薦者の選択') });
  }
  const RS = (r, who, lines, effects, cap) => line('ch9.rs_' + r + '_' + who, lines, 'ch9.closing', { effects: [...effects, tl('11月4日 実習の推薦者を決める')], view: v25(who === 'yamashina' ? 'hr' : M[r].bg, [who], cap) });
  RS('station', 'kubota', [
    ['kubota', '私ですか。…推薦者は連帯責任ですが。', 'surprise'],
    ['player', '毎日の仕事を見てくれたのは、久保田さんです。'],
    ['kubota', 'なら、いい話を七割、直す話を三割。三割ない推薦書は、嘘です。'],
    ['kubota', '付箋を一枚、貸します。青いの。私の字は、読みにくいですよ。', 'smile']
  ], [rel('kubota', 2, 2), ev('teamwork', 1)], '17:10 駅事務室');
  RS('station', 'shiraishi', [
    ['shiraishi', '私か。普通は年の近い指導役を選ぶ。', 'surprise'],
    ['player', '駅の全部を見ている人に、全部を書いてほしいんです。四月の失敗も。'],
    ['shiraishi', 'いいだろう。書いたら、君にも読ませる。私なりの礼儀だ。', 'smile']
  ], [rel('shiraishi', 2, 1), ev('reporting', 1)], '17:10 駅事務室');
  RS('station', 'yamashina', [
    ['yamashina', '同期に頼むのかよ。普通は上司だろ。', 'surprise'],
    ['player', '山科の言葉は、嘘が少ない。'],
    ['yamashina', '褒めてんのか、それ。…盛らないぞ。見たままだ。', 'smile'],
    ['yamashina', 'その代わり、俺のも書け。条件だ。']
  ], [rel('yamashina', 2, 2), ev('teamwork', 1)], '17:10 休憩室');
  RS('depot', 'tachibana', [
    ['tachibana', '俺か。基地の人間が、駅の新人に書く例は少ない。', 'surprise'],
    ['player', '一番厳しく見たのは、橘さんです。'],
    ['tachibana', '期待でなく事実で書く。事実は重いぞ。…書いたことは、実習で確かめる。', 'smile']
  ], [rel('tachibana', 2, 1), ev('safety', 1)], '17:10 検修長室');
  RS('depot', 'sawada', [
    ['sawada', '私が？ 橘さんのほうが重みがありますよ。', 'surprise'],
    ['player', '記録の読み方を教えたのは、沢田さんです。'],
    ['sawada', '場面で書きます。手の動き、声の出し方。ただし約束を。実習で、分からない事は、その場で聞くこと。', 'smile']
  ], [rel('sawada', 2, 2), ev('accuracy', 1)], '17:10 詰所');
  RS('depot', 'yamashina', [
    ['yamashina', '同じ実習を狙う奴に頼むか。ライバルだぞ。', 'surprise'],
    ['player', 'ライバルなら、足りない所も見逃さない。'],
    ['yamashina', '…断れない言い方しやがって。条件、俺の分も書け。', 'smile']
  ], [rel('yamashina', 2, 2), ev('teamwork', 1)], '17:10 休憩室');
  RS('dispatch', 'hamaguchi', [
    ['hamaguchi', '俺が駅の新人に書くのか。珍しいな。', 'surprise'],
    ['player', '指令の基準を教えたのは、浜口さんです。'],
    ['hamaguchi', '「見込み」は書かん。確定した事だけ書く。それで足りる。', 'smile']
  ], [rel('hamaguchi', 2, 1), ev('reporting', 1)], '17:10 面談室');
  RS('dispatch', 'minase', [
    ['minase', '私ですか。浜口さんのほうが、重いですよ。', 'surprise'],
    ['player', '毎日の復唱に、付き合ってくださいました。'],
    ['minase', '復唱を一つずつ、場面で書きます。分からないときは「確認します」を一言目に。それが実習の宿題。', 'smile']
  ], [rel('minase', 2, 2), ev('accuracy', 1)], '17:10 通路');
  RS('dispatch', 'shiraishi', [
    ['shiraishi', '駅長が、指令の見習いの推薦を書く。面白い。', 'smile'],
    ['player', '送り出してくださったのは、駅長です。'],
    ['shiraishi', '「駅は、この人を指令に貸している」と書こう。貸した者は、育って戻る。']
  ], [rel('shiraishi', 2, 1), ev('teamwork', 1)], '17:10 駅事務室');
  RS('planning', 'toda', [
    ['toda', '書きます。ただ、最初の一行は、あなたの数字で始めたい。', 'smile'],
    ['player', '数字、ですか。'],
    ['toda', '七か月で、何を、どれだけ変えたか。月曜までに、自分で探してきて。']
  ], [rel('toda', 2, 1), ev('reporting', 1)], '17:10 小会議室');
  RS('planning', 'shiraishi', [
    ['shiraishi', '企画の推薦を、駅長が。変わった取り合わせだ。', 'surprise'],
    ['player', '現場から資料へ、橋を架けたいんです。'],
    ['shiraishi', '「ホームの音を、資料に持ち込める人」と書く。帰ったら朝礼で話せ。', 'smile']
  ], [rel('shiraishi', 2, 1), ev('service', 1)], '17:10 駅事務室');
  RS('planning', 'kubota', [
    ['kubota', '駅の係員の推薦書は、企画では軽いですよ。', 'surprise'],
    ['player', '現場の目線で書いた紙が、企画に要ると思います。'],
    ['kubota', '遠慮なく書きます。…企画に行っても、券売機の前は忘れないで。', 'smile']
  ], [rel('kubota', 2, 2), ev('service', 1)], '17:10 駅事務室');

  // ============ 9. 終わり（ルート別）→ 終了 ============
  rbranch('ch9.closing', 'ch9.cl_');
  const CL = {
    station: ['ロッカーの付箋を、貼り直した。「分からないと言う」。青い付箋の上に、オレンジを重ねた。'],
    depot: ['手帳に青い付箋を一枚。「床下は、逃げない。逃げるのは人」。橘の口癖を、そのまま写した。'],
    dispatch: ['手帳に青い付箋を一枚。「確認します」。声に出してみると、思ったより短い。'],
    planning: ['手帳に青い付箋を一枚。「数字に、顔を」。駅のホームの音が、頭の隅で鳴った。']
  };
  for (const r of ROUTES) line('ch9.cl_' + r, CL[r], 'ch9.after_' + r, { effects: [{ clock: { minute: hm(17, 30) } }], view: VM(r, '17:30 ' + M[r].place) });
  const AFT = {
    station: [[F('ch9.rec_kubota'), ['kubota', '推薦書の直す三割、書きにくいです。…成長した証拠ですね。', 'smile']], [F('ch9.rec_shiraishi'), ['shiraishi', '推薦書は一晩寝かす。明日、読ませる。']]],
    depot: [[F('ch9.rec_tachibana'), ['tachibana', '推薦書は事実だけだ。足りん所は、実習で足せ。']], [F('ch9.rec_sawada'), ['sawada', '下書き、場面ごとです。「記録票の一日」が一番長い。', 'smile']]],
    dispatch: [[F('ch9.rec_hamaguchi'), ['hamaguchi', '「見込み」は、実習で確かめてから足す。']], [F('ch9.rec_minase'), ['minase', '復唱の記録を並べて書きます。数字で、語らせます。', 'smile']]],
    planning: [[F('ch9.rec_toda'), ['toda', '数字、月曜までに。遅れた理由も、数字でね。']], [F('ch9.rec_shiraishi'), ['shiraishi', '「ホームの音」を、どう書くか。考えている。', 'smile']]]
  };
  for (const r of ROUTES) {
    const cases = AFT[r].map(([c], i) => [c, `ch9.after_${r}_${i}`]);
    branch('ch9.after_' + r, cases, 'ch9.after_' + r + '_x');
    AFT[r].forEach(([, l], i) => line(`ch9.after_${r}_${i}`, [l], 'ch9.end', { view: VM(r, '17:40 ' + M[r].place) }));
    line('ch9.after_' + r + '_x', [['yamashina', '推薦、頼めたか。…俺もだ。腹、治った。', 'smile']], 'ch9.end', { view: v25('hr', ['yamashina'], '17:40 休憩室') });
  }

  N['ch9.end'] = { id: 'ch9.end', type: 'end', chapter: 'ch9', title: '第9章 はじめての評価', nextChapter: 'ch10',
    summary: '半年の評価面談が終わった。手帳の付箋は、七か月の選択を一枚ずつ言葉に戻した。傷も、誇りも、記録に残る。そのうえで、推薦者を選んだ。来月、三日間の実習が始まる。',
    effects: [tl('11月4日 半年の評価面談を終える'), log('第9章を終了', 'chapter')] };
}
