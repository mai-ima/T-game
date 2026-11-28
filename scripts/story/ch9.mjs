// R7 第9章「はじめての評価」（11月4日）。回想と評価が交差する章。モチーフ：手帳の付箋（四月のオレンジ → 十一月の青）。
// 構造：朝（剥がれかけた付箋）→ ルート別の評価者 → 手帳の回想（ルート別＋共通の頁）→ 自己評価（重要選択＋作文）
//       → 同僚コメント（ルート別）→ 同期 → 評価面談（ルート別の観点）→ 過去の傷への向き合い → 推薦者を選ぶ（重要選択）。
// ルート（ch6.wish_station|depot|dispatch|planning）は永続。無ければ station を既定にする。
export default function ch9(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, tl, log, time, F, NF, ANY, ALL, T, hm, v3, v25, res3, hub } = k;
  const RL = (char, key, op, val) => ({ rel: { char, key, op, val } });
  const chain = (pre, next, items, view) => items.forEach(([cond, lines], i) => { const nx = i + 1 < items.length ? pre + (i + 1) : next; branch(pre + i, [[cond, pre + i + 'y']], nx); line(pre + i + 'y', lines, nx, { view }); });

  characters.sawada_r = { id: 'sawada_r', name: '沢田 良平', kana: 'さわだ りょうへい', role: '車両基地 検修技術員', dept: 'depot', age: 31, years: 9, uniform: '#2f4f6a', hair: '#2a2a2a', skin: '#e8c29c', trait: '丁寧で手が早い。説明は短く、図で見せる。', bio: '橘検修長の下で九年。見習いの質問には、一度考えさせてから答える。', gender: 'm', accessory: 'none' };
  characters.minase ??= { id: 'minase', name: '水無瀬 美咲', kana: 'みなせ みさき', role: '輸送指令員', dept: 'dispatch', age: 34, years: 12, uniform: '#2a3d52', hair: '#2b2118', skin: '#f0cfae', trait: '落ち着いた声。復唱を欠かさない。', bio: '浜口と同じ指令所の当番員。新人の電話記録を丁寧に読む。', gender: 'f', accessory: 'glasses' };
  characters.toda ??= { id: 'toda', name: '戸田 玲子', kana: 'とだ れいこ', role: '本社 輸送計画課 課長補佐', dept: 'planning', age: 42, years: 19, uniform: '#3a4a5e', hair: '#2a2024', skin: '#f0cfae', trait: '数字を見て、人の事情も見る。会議では最後まで聞く。', bio: 'ダイヤ案の取りまとめ役。現場の声を資料に落とす仕事を大事にしている。', gender: 'f', accessory: 'glasses' };
  characters.kuroda ??= { id: 'kuroda', name: '黒田 拓海', kana: 'くろだ たくみ', role: '輸送計画課 係員', dept: 'planning', age: 27, years: 4, uniform: '#3a4a5e', hair: '#1c1c28', skin: '#efc9a6', trait: '資料の体裁にうるさい。教えるのは早口。', bio: '入社四年目。数字の置き方に、いつも一言ある。', gender: 'm', accessory: 'none' };

  const ROUTES = ['station', 'depot', 'dispatch', 'planning'];
  const rbranch = (id, prefix) => branch(id, [[F('ch6.wish_depot'), prefix + 'depot'], [F('ch6.wish_dispatch'), prefix + 'dispatch'], [F('ch6.wish_planning'), prefix + 'planning']], prefix + 'station');
  const E = (key, op, val) => ({ eval: { key, op, val } });
  const V = (key, op, val) => ({ var: { key, op, val } });

  const M = {
    station: { ev: 'shiraishi', ev2: 'kubota', bg: 'office', cast: ['shiraishi', 'kubota', 'morishita'], place: '青嶺中央駅 駅事務室' },
    depot: { ev: 'tachibana', ev2: 'sawada_r', bg: 'depot', cast: ['tachibana', 'sawada_r', 'morishita'], place: '青浜総合車両センター 検修長室' },
    dispatch: { ev: 'hamaguchi', ev2: 'minase', bg: 'office', cast: ['hamaguchi', 'minase', 'morishita'], place: '輸送指令所 面談室' },
    planning: { ev: 'toda', ev2: 'kuroda', bg: 'hr', cast: ['toda', 'kuroda', 'morishita'], place: '本社 輸送計画課 小会議室' }
  };
  const VM = (r, cap) => v25(M[r].bg, M[r].cast, cap ?? M[r].place);
  const MEM = (cap = '（手帳）') => v25('office', [], cap);

  // ============ 1. 朝：剥がれかけた付箋と、返される紙 ============
  line('ch9.open', [
    'ロッカーの内側で、付箋が一枚、剥がれかけていた。四月の字だ。「分からないと言う」。',
    ['yamashina', '貼り直せよ。取れそうな目標は、だいたい取れる。', 'smile'],
    'ロッカー室の入口に、早番の杉浦助役が、紙を一枚、持って立っていた。',
    ['sugiura', '新人。…ああ、もう、新人ではないか。これを、返す。']
  ], 'ch9.sg_b', {
    effects: [{ clock: { addDay: 50, minute: hm(7, 50) } }, tl('11月4日 半年の評価面談の日を迎える'), log('第9章 はじめての評価', 'chapter')],
    view: v25('office', ['yamashina', 'sugiura'], '11月4日（木） 7:50 駅事務室 ロッカー室')
  });
  branch('ch9.sg_b', [[F('ch3.strict_check'), 'ch9.sg_s']], 'ch9.sg_n');
  line('ch9.sg_s', [
    '五月の早朝。引継ぎで書いた復唱メモだ。赤い丸が、一つ。「全部、指差し」の日の紙。',
    ['sugiura', 'あの日は、厳しくした。すまんとは、言わん。…ただ、復唱は、よかった。'],
    ['sugiura', '駅長が、君を見ていた。私が、見せたかったんだ。']
  ], 'ch9.open2', { effects: [rel('sugiura', 1, 1)], view: v25('office', ['sugiura'], '7:52 ロッカー室') });
  line('ch9.sg_n', [
    '五月の早朝。引継ぎで書いた復唱メモだ。赤い丸が、一つ。',
    ['sugiura', '「相談できる新人。伸ばせ」と、駅長のメモにあった。…もう、一人でも、できるだろう。']
  ], 'ch9.open2', { effects: [rel('sugiura', 1, 0)], view: v25('office', ['sugiura'], '7:52 ロッカー室') });
  line('ch9.open2', [
    ['shiraishi', '11月4日。半年の評価面談だ。先に、評価者へ顔を出してこい。会って話すのが、礼儀だ。'],
    ['morishita', '来月、三日間の実習枠があります。面談で、推薦者を一人、聞きます。'],
    ['yamashina', '午後に呼ばれてる。…腹が痛い。気のせいだ。', 'worry']
  ], 'ch9.route', { view: v25('office', ['shiraishi', 'morishita', 'yamashina'], '7:55 駅事務室') });
  rbranch('ch9.route', 'ch9.in_');

  line('ch9.in_station', [
    '机に、久保田の指導ノートが七冊。どれも付箋だらけで、背が膨らんでいる。',
    ['kubota', '最初の頁は「分からないと言えない」。最新は「質問が多い」です。', 'smile'],
    ['shiraishi', '質問が多いのは、悪くない。黙る客のほうが怖い。'],
    ['kubota', 'いい話も直す話も、同じ温度で話します。冷めても同じです。']
  ], 'ch9.mem', { view: VM('station', '9:00 駅事務室') });
  line('ch9.in_depot', [
    'ゴン、と鉄を叩く音。検修長室の湯呑みが、一拍遅れて震えた。',
    ['tachibana', '駅の面談に、基地が口を出す。筋違いだ。…書いてきた。'],
    ['sawada_r', '十回以上、床下の記録を一緒に見ました。見たのは、手の止め方です。'],
    ['tachibana', '安全に。記録を残して。報告する。揃わん奴に、床下は預けん。']
  ], 'ch9.mem', { view: VM('depot', '9:00 検修長室') });
  line('ch9.in_dispatch', [
    '壁の向こうで、電話が鳴る。三回目の前に、誰かが取った。',
    ['hamaguchi', '扉の外で聞いた回数、四十超え。数えていた。俺がな。'],
    ['minase', '電話記録は誤字が少ない。見ていたのは、聞き返す回数です。', 'smile'],
    ['hamaguchi', '評価の芯は一つ。分からないと言えるか。それだけだ。']
  ], 'ch9.mem', { view: VM('dispatch', '9:00 輸送指令所') });
  line('ch9.in_planning', [
    '会議机の上に、付箋だらけの時刻表。紙とトナーの匂いがする。',
    ['toda', '評価は資料で見ます。読んだ人が何を決められたか、です。'],
    ['kuroda', '先月の集計表、列を直してもらって会議が十分縮みました。…礼は言いました。言ったはずです。', 'smile'],
    ['toda', '数字に顔のある人だ。ただ、顔を数字に直すのは、まだ練習中ね。']
  ], 'ch9.mem', { view: VM('planning', '9:00 輸送計画課') });

  // ============ 2. 手帳の中の二つの日（回想を、場面で）============
  const RV = (bg, who, cap) => v25(bg, who, cap);
  line('ch9.mem', ['手帳を開く。青い付箋の下に、四月の字が透けている。頁の間から、二つの日が、立ち上がった。'], 'ch9.memA', { view: MEM('（手帳）') });
  branch('ch9.memA', [[F('ch2.idea_selfpost'), 'ch9.memA_s'], [F('ch2.proposal_sent'), 'ch9.memA_p'], [F('ch2.idea_consult'), 'ch9.memA_c'], [F('ch2.idea_skip'), 'ch9.memA_k']], 'ch9.memB');
  line('ch9.memA_s', ['四月五日。券売機の横に、手書きの絵を貼った朝。', ['kubota', '（回想）着眼は、いいんです。…順番が、逆。'], ['player', '（回想）許可は、あとで取ろうと…'], ['kubota', '（回想）あとでは、剥がされます。…これ、剥がした紙です。'], '渡された紙は、端が折れていた。男性が描いた矢印が、まだ読める。'], 'ch9.memB', { view: RV('office', ['kubota'], '（回想）4月5日 券売機の前') });
  line('ch9.memA_p', ['四月五日。提案書の写しに、赤丸が一つ。', ['kubota', '（回想）通ったのは、書き方じゃありません。あの男性の顔を見て、書いたからです。'], '紙の端に、久保田の字。「次は、現場の人にも、見せて」。'], 'ch9.memB', { view: RV('office', ['kubota'], '（回想）4月5日 事務室') });
  line('ch9.memA_c', ['四月五日。久保田に相談した朝。', ['kubota', '（回想）事実から、書きましょう。…提案書には、届かなかったけれど。'], '順番だけが、手帳に残った。'], 'ch9.memB', { view: RV('office', ['kubota'], '（回想）4月5日 事務室') });
  line('ch9.memA_k', ['四月五日。何も書かなかった日。', '券売機の前で、迷っていた男性の顔だけ、覚えている。', ['kubota', '（回想）見えていたのに、言わなかった。…それも、記録です。', 'serious']], 'ch9.memB', { view: RV('office', ['kubota'], '（回想）4月5日 券売機の前') });
  branch('ch9.memB', [[ALL(F('ch4.secret_kept'), F('ch4.helped_yama')), 'ch9.memB_h'], [F('ch4.secret_kept'), 'ch9.memB_s'], [F('ch4.told_alone'), 'ch9.memB_a'], [F('ch4.trust_built'), 'ch9.memB_t']], 'ch9.memB_t');
  line('ch9.memB_h', ['六月。夜の事務室。山科の数え直しに、付き合った晩。', ['yamashina', '（回想）…誰にも、言うなよ。頼む。'], ['player', '（回想）言わない。数字を、もう一回。'], '缶コーヒーが二つ。一つは、開けられないまま、冷めていった。'], 'ch9.mem_end', { view: RV('hr', ['yamashina'], '（回想）6月 夜の事務室') });
  line('ch9.memB_s', ['六月。山科のミスを、一人で預かった夜。', ['yamashina', '（回想）…本当に、言わないつもりか。'], ['player', '（回想）言わない。…でも、一人では、重い。'], '缶コーヒーの冷たさが、紙の重さに似ていた。'], 'ch9.mem_end', { view: RV('hr', ['yamashina'], '（回想）6月 夜の事務室') });
  line('ch9.memB_a', ['六月。助役室の前で、一人、立っていた夜。', ['player', '（回想）…報告します。山科の件です。'], '扉の向こうで、椅子の音。その日、山科は、一度もこちらを見なかった。'], 'ch9.mem_end', { view: RV('hr', ['yamashina'], '（回想）6月 助役室の前') });
  line('ch9.memB_t', ['六月。山科と、苦手を言い合った帰り道。', ['yamashina', '（回想）俺、数字が苦手でさ。…お前は？'], ['player', '（回想）…人の顔を見ると、急ぐ癖が。'], '二人で笑って、缶コーヒーを、同時に開けた。'], 'ch9.mem_end', { view: RV('hr', ['yamashina'], '（回想）6月 帰り道') });
  line('ch9.mem_end', ['書き込みの多い手帳は、言い訳の隙がない。自己評価シートを広げた。'], 'ch9.self_stance', { view: MEM() });

  // ============ 4. 自己評価 ============
  choice('ch9.self_stance', '自己評価シート。何から書きますか？', [
    opt('fact', '事実と数字から', 'ch9.self_route', { tone: 'careful', effects: [set('ch9.self_fact'), ev('accuracy', 2)] }),
    opt('fail', '失敗と、変えたことから', 'ch9.self_route', { tone: 'honest', effects: [set('ch9.self_fail'), ev('reporting', 2)] }),
    opt('others', '助けてくれた人と、自分の役割から', 'ch9.self_route', { tone: 'caring', effects: [ev('teamwork', 2)] })
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
      results: res3('ch9.self_rg', 'ch9.self_rm', 'ch9.self_rb', [ev('reporting', 2), { var: { key: 'ch9.score', add: 1 } }], [ev('reporting', 1)], [ev('reporting', -1), { var: { key: 'ch9.score', add: -1 } }]), view: v25('office', [], '自己評価シート') };
  }
  line('ch9.self_rg', ['ペンを置く。七か月前の自分には、書けなかった文章だった。'], 'ch9.polish', { view: MEM('（自己評価シート）') });
  line('ch9.self_rm', ['半分は自分の言葉。残り半分は「頑張ります」の顔をしていた。そこだけ、消しゴムをかけた。'], 'ch9.polish', { view: MEM('（自己評価シート）') });
  line('ch9.self_rb', ['読み返すと、誰にでも当てはまる文章だった。付箋が、少しだけ、こちらを見ている。'], 'ch9.polish', { view: MEM('（自己評価シート）') });

  choice('ch9.polish', '最後の一行。「半年の成果」の欄に、もう一行、書ける。', [
    opt('honest', 'できたことと、できなかったことを、そのまま書く', 'ch9.po_h', { tone: 'honest', effects: [ev('reporting', 1), { var: { key: 'ch9.score', add: 1 } }] }),
    opt('polish', '「全体として、期待以上だったと思います」と書き添える', 'ch9.po_p', { tone: 'risky', effects: [set('ch9.polished'), ev('reporting', 2), { var: { key: 'ch9.score', add: -2 } }] })
  ], { view: MEM('（自己評価シート）') });
  line('ch9.po_h', ['消しゴムの粉を、手で払う。紙は、少し、汚くなった。'], 'ch9.peer_route', { view: MEM('（自己評価シート）') });
  line('ch9.po_p', ['体裁は、整った。字だけが、少し、他人の字に見えた。'], 'ch9.peer_route', { view: MEM('（自己評価シート）') });
  // ============ 5. 同僚コメント → 同期 ============
  rbranch('ch9.peer_route', 'ch9.peer_');
  line('ch9.peer_station', [
    ['kubota', '同僚コメントは本人に見せない決まりです。読み上げます。決まりの外で。', 'smile'],
    ['kubota', '「最初の一声が上手になった。忙しいほど、周りへの声が遅れる」。'],
    ['player', '最初の一声は、久保田さんの教えです。'],
    ['kubota', '教えただけでは身につきません。…優しい人は、一人で抱えて後で爆発します。早めに回して。']
  ], 'ch9.peer_station_t', { view: v25('hr', ['kubota'], '13:00 休憩室') });
  line('ch9.peer_depot', [
    ['sawada_r', '同僚評価は短く書く決まりです。一行だけ、長く書きました。'],
    ['sawada_r', '「数字を声に出して確認する。ただ、床下が気になると線に近づく」。'],
    ['player', '…図星です。身を乗り出してました。'],
    ['sawada_r', '私は九年前、橘さんに襟をつかまれました。好奇心は、足元を見てから使え、と。', 'smile']
  ], 'ch9.peer_depot_t', { view: v25('depot', ['sawada_r'], '13:00 詰所') });
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
  const PEERX = {
    station: '…これは、書いていない話です。春、あなたが「分からない」と言った日、私は、ほっとしたんです。私も、言えなかったので。',
    depot: '評価に書けない話を。私が見習いだった頃、橘さんは、私の記録票を、三回、突き返しました。四回目で、黙って、判を押した。',
    dispatch: '書けない話を一つ。この部屋で、私が一番、聞き返せなかった夜のこと。…あなたは、聞き返した。それで、十分です。',
    planning: '書けない話を。僕、去年、資料の数字を一つ間違えて。戸田さんは、怒らずに、横に付箋を貼って帰りました。「一緒に見直す」って。'
  };
  for (const r of ROUTES) {
    const who = M[r].ev2; const pv = v25(M[r].bg, [who], '13:00 ' + M[r].place);
    branch('ch9.peer_' + r + '_t', [[F('ch3.honest'), 'ch9.peer_' + r + '_h'], [F('ch3.pushed'), 'ch9.peer_' + r + '_p']], 'ch9.peer_' + r + '_x');
    line('ch9.peer_' + r + '_h', [[who, '体調を自分から申告した日、みんな覚えています。無理しない人は、長持ちします。']], 'ch9.peer_' + r + '_x', { view: pv });
    line('ch9.peer_' + r + '_p', [[who, '無理を押して出た日、顔色が悪かった。休む判断も、仕事です。', 'worry']], 'ch9.peer_' + r + '_x', { view: pv });
    branch('ch9.peer_' + r + '_x', [[RL('kubota', 'trust', '>=', 4), 'ch9.peer_' + r + '_xy']], 'ch9.hub_in');
    line('ch9.peer_' + r + '_xy', [[who, PEERX[r]]], 'ch9.hub_in', { effects: [set('ch9.peer_open')], view: pv });
  }

  // ============ 5b. 昼休み：駅を歩く（3Dハブ）============
  line('ch9.hub_in', ['13時30分。昼休み。面談まで、一時間。コンコースに出ると、顔なじみの気配が、いくつもあった。'], 'ch9.hub', { effects: [{ clock: { minute: hm(13, 30) } }, set('ch9.hub_in')], view: v3('concourse', '13:30 コンコース') });
  hub('ch9', {
    title: '青嶺中央駅 昼休み（11月4日）',
    hint: '面談までの時間、駅を歩いて、顔なじみに会えます。山科とは、話しておきたい。',
    timed: [{ id: 'iv', at: hm(14, 45), goto: 'ch9.iv_route' }],
    goals: [{ id: 'g_yama', label: '山科と話す', when: F('ch9.yama_done') }],
    exit: { label: '面談へ向かう（14:20以降）', requires: ALL(F('ch9.hub_in'), F('ch9.yama_done'), T('>=', hm(14, 20))), goto: 'ch9.iv_route' }
  });
  const H = N['ch9.hub']; const HR = F('ch9.hub_in');
  H.interactions.push({ id: 'yama', object: 'yamashina', label: '山科に声をかける', goto: 'ch9.yama', requires: HR, once: true, icon: '🥫' });
  H.interactions.push({ id: 'kaji', object: 'kajiwara', label: '梶原さんに挨拶する', goto: 'ch9.kj_1', requires: HR, once: true, icon: '👵' });
  H.interactions.push({ id: 'nomura', object: 'nomura', label: 'ホームのベンチに、野村さんがいる', goto: 'ch9.nm_1', requires: ALL(HR, { not: { gone: 'nomura' } }), once: true, icon: '🦯' });
  H.interactions.push({ id: 'ogawa', object: 'ogawa', label: '改札の脇で、会釈をしている男性に気づく', goto: 'ch9.og_1', requires: ALL(HR, ANY(F('ch7.ogawa_thanks'), F('ch7.ogawa_unheard'), F('ch7.ogawa_hurry'), F('ch7.ogawa_rule'))), once: true, icon: '🧳' });
  H.interactions.push({ id: 'haha', object: 'haha', label: 'ベビーカーの母親が、こちらを見ている', goto: 'ch9.hh_1', requires: ALL(HR, ANY(F('ch7.haha_helped'), F('ch7.haha_slipped'), F('ch7.haha_relayed'))), once: true, icon: '👶' });
  const HV = (who, cap) => v3('concourse', cap);
  fx('ch9.hub_back', [time(15)], 'ch9.hub');
  // 梶原さん：帽子（取り戻す余地）／水曜の約束
  branch('ch9.kj_1', [[F('ch8.hat_left'), 'ch9.kj_hat']], 'ch9.kj_plain');
  line('ch9.kj_hat', [['kajiwara', 'あの帽子。送ったの？'], ['player', 'まだ、預かっています。']], 'ch9.kj_hs', { view: v25('office', ['kajiwara'], '13:40 コンコース') });
  branch('ch9.kj_hs', [[F('ch8.hat_story'), 'ch9.kj_hs1']], 'ch9.kj_hc');
  line('ch9.kj_hs1', [['kajiwara', '内側の糸は、奥さんの字だから。…ね。']], 'ch9.kj_hc', { view: v25('office', ['kajiwara'], '13:41 コンコース') });
  choice('ch9.kj_hc', '野村さんの帽子を、どうする？', [
    opt('send', '今夜、短い手紙を添えて、送る', 'ch9.kj_send', { tone: 'honest', effects: [set('ch9.hat_sent')] }),
    opt('later', 'もう少し、考えてから', 'ch9.kj_later', { tone: 'careful', effects: [set('ch9.hat_pending')] })
  ], { view: v25('office', ['kajiwara']) });
  line('ch9.kj_send', [['player', '「預かっていました」とだけ、書きます。お詫びの言葉は、足りないので。'], ['kajiwara', '…それでいいの。足りなくても、届くものは、あるわ。', 'smile']], 'ch9.hub_back', { effects: [rel('kajiwara', 1, 2)], view: v25('office', ['kajiwara']) });
  line('ch9.kj_later', [['kajiwara', '考えてる間にも、人は、動くのよ。…待ってるわ。', 'worry']], 'ch9.hub_back', { view: v25('office', ['kajiwara']) });
  chain('ch9.kj_p', 'ch9.hub_back', [
    [F('ch8.vow_greet'), [['kajiwara', '水曜、毎週、声をかけてくれるのね。あの人も、それで、通院が楽になったって。', 'smile']]],
    [F('ch8.vow_note'), [['kajiwara', 'あなたの作ったメモ、窓口の皆さんが使ってるのね。…今朝、初めて、名前で呼ばれたわ。']]],
    [F('ch8.vow_wait'), [['kajiwara', '頼る前に待ってくれるのは、助かるの。…でも、たまには、聞いてくれても、いいのよ。']]]
  ], v25('office', ['kajiwara'], '13:40 コンコース'));
  line('ch9.kj_plain', [['kajiwara', 'あら、今日は、評価の日だったかしら。顔に、書いてあるわ。']], 'ch9.kj_p0', { view: v25('office', ['kajiwara'], '13:40 コンコース') });
  // 野村さん（去らなかった場合）
  branch('ch9.nm_1', [[F('ch8.nomura_honored'), 'ch9.nm_h'], [F('ch8.elder_late'), 'ch9.nm_l']], 'ch9.nm_n');
  line('ch9.nm_h', [['nomura', '…座らせてもらった日の礼だ。柿だ。梶原のところの。'], '紙袋が、掌に、ずしりと重い。', ['nomura', '台車の話なら、また、させてくれ。立たずに、な。', 'smile']], 'ch9.hub_back', { effects: [rel('nomura', 1, 2), set('ch9.nomura_gift')], view: v25('office', ['nomura'], '13:45 ホーム') });
  line('ch9.nm_l', [['nomura', '…あの日は、遅かったな。(苦笑)'], ['nomura', 'だが、来た。…次は、遅くなるなよ。'], '杖が、かん、と一度だけ、床を叩いた。'], 'ch9.hub_back', { effects: [rel('nomura', 1, 1)], view: v25('office', ['nomura'], '13:45 ホーム') });
  line('ch9.nm_n', [['nomura', '…ラムネ、うまかった。それだけだ。いいよ、もう。'], '「いいよ」の後ろに、少しだけ、礼の気配があった。'], 'ch9.hub_back', { effects: [rel('nomura', 1, 1)], view: v25('office', ['nomura'], '13:45 ホーム') });
  // 小川さん（夏の夜の答え方が、そのまま戻ってくる）
  branch('ch9.og_1', [[F('ch7.ogawa_thanks'), 'ch9.og_t'], [F('ch7.ogawa_unheard'), 'ch9.og_u']], 'ch9.og_r');
  line('ch9.og_t', [['ogawa', '夏の夜は、失礼した。娘の定期入れだ。…あの子は、駅員になりたいと言い出した。', 'smile'], '男性が差し出したのは、青い定期入れに入った、小さな似顔絵だった。'], 'ch9.hub_back', { effects: [rel('ogawa', 1, 2)], view: v25('office', ['ogawa'], '13:50 改札') });
  line('ch9.og_u', [['ogawa', '…夏の夜の、あなたか。'], ['ogawa', '娘は、無事だった。…それだけ、言いに来た。礼ではない。報告だ。'], '背を向ける前に、男性は一度だけ、足を止めた。'], 'ch9.hub_back', { effects: [], view: v25('office', ['ogawa'], '13:50 改札') });
  line('ch9.og_r', [['ogawa', '夏は、「間に合う」と言われた。決まりだと言われた。…どちらも、嘘ではなかった。', 'serious'], '男性は、軽く頭を下げて、改札へ消えた。'], 'ch9.hub_back', { effects: [], view: v25('office', ['ogawa'], '13:50 改札') });
  // 母親
  branch('ch9.hh_1', [[F('ch7.haha_helped'), 'ch9.hh_h']], 'ch9.hh_n');
  line('ch9.hh_h', [['haha', '階段のとき、ありがとうございました。この子、もう、歩きます。', 'smile'], '去年の、手すり側の母親。…今年は、一人、足が軽い。'], 'ch9.hub_back', { effects: [rel('haha', 1, 1)], view: v25('office', ['haha'], '13:55 エレベーター前') });
  line('ch9.hh_n', [['haha', '夏の階段、大丈夫でした。…電話まで、もらって。'], '「大丈夫でした」の顔が、少しだけ、疲れていた。'], 'ch9.hub_back', { view: v25('office', ['haha'], '13:55 エレベーター前') });

  const YV = v25('hr', ['yamashina'], '14:30 休憩室');
  line('ch9.yama', [
    '自販機の前。山科が、開けていない缶コーヒーを両手で握っている。',
    ['yamashina', '「同期との関係」って欄があるんだよ。俺、何て書かれてる？', 'worry']
  ], 'ch9.yama_b', { view: YV });
  branch('ch9.yama_b', [[ALL(F('ch4.secret_kept'), F('ch4.helped_yama')), 'ch9.yama_h'], [F('ch4.secret_kept'), 'ch9.yama_s'], [F('ch4.told_alone'), 'ch9.yama_c'], [ALL(F('ch4.told_truth'), F('ch4.helped_yama')), 'ch9.yama_t']], 'ch9.yama_tt');
  line('ch9.yama_s', [['yamashina', '…あれ、本当に誰にも言わなかったよな。気づいてた。', 'worry'], ['yamashina', '助かった。でもお前、一人で重かったろ。次は半分持たせろ。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 1)], view: YV });
  line('ch9.yama_h', [['yamashina', '庇われた上に、数え直しまで付き合わせた。最悪の借りだ。', 'smile'], ['yamashina', '返す。利子つきで。覚悟しとけ。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 2)], view: YV });
  line('ch9.yama_c', [['yamashina', 'お前が一人で助役に話した日。俺は、後から聞いた。', 'serious'], ['yamashina', '怒るより先に、情けなかった。…礼は、まだ言わない。順番がある。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 0)], view: YV });
  line('ch9.yama_t', [['yamashina', '二人で報告に行って、残って直した。あの日から、評価の紙がどうでもよくなった。', 'smile'], ['yamashina', '…いや、嘘。腹は痛い。']], 'ch9.yama_after', { effects: [rel('yamashina', 1, 2)], view: YV });
  line('ch9.yama_tt', [['yamashina', 'お前が駅長に話した日、三日、口を利かなかった。', 'serious'], ['yamashina', 'でも俺のミスは、手順書の一行になった。…三日が俺の限界だ。']], 'ch9.yama_after', { effects: [rel('yamashina', 2, 0)], view: YV });
  rbranch('ch9.yama_after', 'ch9.ya_');
  line('ch9.ya_station', [['yamashina', '俺は基地、お前は駅。基地の人間には、駅に信頼できる奴がいるのが、地味にでかい。']], 'ch9.yama_c', { view: YV });
  line('ch9.ya_depot', [['yamashina', 'お前が基地に通ってるの、正直悔しい。…来月、一緒に落ちたら飲もう。', 'smile']], 'ch9.yama_c', { view: YV });
  line('ch9.ya_dispatch', [['yamashina', '指令か。基地と指令は犬猿って噂だが、お前なら話が通じそうだ。']], 'ch9.yama_c', { view: YV });
  line('ch9.ya_planning', [['yamashina', '計画に行くなら一つ頼む。入出区の五分を、資料に書いてくれ。']], 'ch9.yama_c', { view: YV });

  // 山科：「俺、何て書かれてる？」（沈黙も、答えになる）
  line('ch9.yama_c', [['yamashina', '…なあ。俺、評価の紙に、何て書かれてると思う？', 'worry']], 'ch9.yama_cc', { view: YV });
  choice('ch9.yama_cc', '山科に、どう答える？', [
    opt('real', '「見てないから、分からない。でも、俺が書くなら、こう書く」と、本当のことを言う', 'ch9.yama_r', { tone: 'honest', effects: [set('ch9.yama_real')] }),
    opt('soothe', '「大丈夫。悪いことは、書かれてない」と言う（見ていないのに）', 'ch9.yama_s', { tone: 'caring', effects: [set('ch9.yama_soothe')] }),
    opt('silent', '（言葉が、見つからない）', 'ch9.yama_x', { tone: 'neutral' })
  ], { timeLimit: 25, defaultOption: 'silent', view: YV });
  line('ch9.yama_r', [['player', '「手順書に一行足した奴」。…俺なら、それを、一番上に書く。'], ['yamashina', '…そうか。…盛るなよ、って言おうとしたけど、盛ってないな。', 'smile']], 'ch9.yama_back', { effects: [rel('yamashina', 2, 2)], view: YV });
  line('ch9.yama_s', [['yamashina', '本当か。…ありがとう。助かる。', 'smile'], '缶コーヒーの口が、ようやく、開いた。…見ていない紙の中身を、保証してしまった。'], 'ch9.yama_back', { effects: [rel('yamashina', 1, 0)], view: YV });
  line('ch9.yama_x', [['yamashina', '…黙るのかよ。', 'worry'], '缶は、最後まで、開かなかった。山科は、軽く手を上げて、ホームへ戻っていった。'], 'ch9.yama_back', { effects: [rel('yamashina', -1, -1), set('ch9.yama_silent')], view: YV });
  fx('ch9.yama_back', [set('ch9.yama_done'), time(20)], 'ch9.hub');

  // ============ 6. 評価面談：紙は一枚、あとは、口で聞く ============
  rbranch('ch9.iv_route', 'ch9.iv_');
  const IV = {
    station: [['shiraishi', '机の上の紙を、指で叩いた。「券売機の前、三十秒」。', 'normal'], ['shiraishi', '久保田が測っていた。迷う客の前に立つまでの秒数だ。四月は二分だった。']],
    depot: [['tachibana', '紙は一枚。「確認印、欠落、一」。', 'normal'], ['tachibana', '七月、お前が見つけた。印の欠けを。あの一個で、俺はお前を見る目が変わった。']],
    dispatch: [['hamaguchi', '紙に、赤丸が一つ。八月の復唱記録の、ある一語だ。', 'normal'], ['hamaguchi', '「見込み」を、お前は「確定」と書かなかった。それだけで、ここに座らせる価値がある。']],
    planning: [['toda', '一枚の表を、机の中央に置いた。端に小さな注記。', 'normal'], ['toda', 'この一行を、課内の五人が読みました。あなたの字です。']]
  };
  for (const r of ROUTES) line('ch9.iv_' + r, [...IV[r], ['morishita', '紙の話は、ここまで。ここからは、あなたの口で聞きます。']], 'ch9.iv_stance', { effects: [{ clock: { minute: hm(15, 0) } }], view: VM(r, '15:00 ' + M[r].place) });
  branch('ch9.iv_stance', [[F('ch9.self_fact'), 'ch9.iv_sf'], [F('ch9.self_fail'), 'ch9.iv_sl']], 'ch9.iv_so');
  const IVV = v25('hr', ['morishita'], '15:10 評価面談');
  line('ch9.iv_sf', [['morishita', '自己評価は数字の筋が通っています。数字に出ない所は、評価者の言葉で。']], 'ch9.slip_in', { view: IVV });
  line('ch9.iv_sl', [['morishita', '失敗から書く人は、伸びます。見せたくなかったでしょうに。']], 'ch9.slip_in', { view: IVV });
  line('ch9.iv_so', [['morishita', '感謝から書き始める人は少数です。評価のためでなく、癖なんでしょうね。']], 'ch9.slip_in', { view: IVV });
  line('ch9.slip_in', [
    ['morishita', '評価票に、匿名の「利用者の声」が一枚、挟まっています。内容は、まだ読み上げません。'],
    ['morishita', '誰の目か、心当たりは。当てるための質問では、ありません。評価の根拠が、誰の目なのかを、知っておいてほしい。']
  ], 'ch9.guess', { view: IVV });
  choice('ch9.guess', '匿名の声の主に、心当たりは？', [
    opt('ts', '始発の券売機の、常連の方', 'ch9.guess_x', { tone: 'careful', requires: F('ch3.tsumura_met'), effects: [set('ch9.guess_ts')] }),
    opt('og', '夏の夜、改札の前で、怒鳴った男性', 'ch9.guess_x', { tone: 'careful', requires: ANY(F('ch7.ogawa_thanks'), F('ch7.ogawa_unheard'), F('ch7.ogawa_hurry'), F('ch7.ogawa_rule')), effects: [set('ch9.guess_og')] }),
    opt('kj', '毎週、通院に来る梶原さん', 'ch9.guess_x', { tone: 'caring', effects: [set('ch9.guess_kj')] }),
    opt('none', '心当たりは、ありません', 'ch9.guess_x', { tone: 'neutral', effects: [set('ch9.guess_none')] })
  ], { view: IVV });
  line('ch9.guess_x', [['morishita', '…そうですか。記録だけ、しておきます。']], 'ch9.hp_in', { view: IVV });
  branch('ch9.hp_in', [[F('ch5.root_found'), 'ch9.hp_rf']], 'ch9.hp');
  line('ch9.hp_rf', [['morishita', '七月、原因を人でなく、置き場所に求めた件は、高く評価されています。…だから、一点だけ、厳しいことを聞きます。']], 'ch9.hp', { view: IVV });
  branch('ch9.hp', [[F('ch9.polished'), 'ch9.hp_po'], [F('legacy.rule_break'), 'ch9.hp_rule'], [F('legacy.concealed'), 'ch9.hp_con'], [F('ch5.late_report'), 'ch9.hp_late'], [F('ch3.pushed'), 'ch9.hp_push'], [F('ch4.told_alone'), 'ch9.hp_alone']], 'ch9.hp_gen');
  const HP = { po: '自己評価の最後の一行。実際より、少し、きれいですね。九月の記録と、合いません。（付箋を一枚、机に置く）', rule: '線路に降りかけた日の記録が、ここにあります。あなたは、その日を、自己評価に書きませんでした。', con: '初日、運行情報の誤りに触れなかった件。自分から言う機会は、何度かありましたね。', late: '七月の第一報。十一分、遅れました。その十一分を、誰が、待っていましたか。', push: '五月、無理を押して出勤した件。今は、「休む判断」を、できますか。', alone: '同期の事情を、一人で助役に話した件。その同期は、今日、腹が痛いそうです。', gen: 'あなたの強みは、人を待たせないこと。弱みも、同じです。急ぐ癖が、あります。' };
  for (const [key, t] of Object.entries(HP)) line('ch9.hp_' + (key === 'po' ? 'po' : key), [['morishita', t, 'serious'], ['morishita', 'これについて、あなたの口から、聞かせてください。']], 'ch9.resp', { view: IVV });
  choice('ch9.resp', 'どう答えますか？', [
    opt('argue', '事情を説明し、誤解は正したい', 'ch9.rsp_argue', { tone: 'quick', effects: [set('ch9.iv_argue')] }),
    opt('accept', '言い訳せず、受け止める。行動で示す', 'ch9.rsp_accept', { tone: 'honest', effects: [set('ch9.iv_accept'), set('ch9.weekly_report')] }),
    opt('fix', '再発防止の手順を、自分で書いて出す', 'ch9.rsp_fix', { tone: 'careful', effects: [set('ch9.iv_fix'), set('ch9.weekend_gone')] }),
    opt('silent', '（言葉が出ない）', 'ch9.rsp_silent', { tone: 'neutral' })
  ], { important: true, who: 'morishita', timeLimit: 30, defaultOption: 'silent', view: IVV });
  const RESP = {
    station: { argue: ['shiraishi', '事情は聞いた。事情を言える者は、多い。言い訳に聞こえる前に、事実だけ、残せ。'], accept: ['shiraishi', '受け止めるのは、易しい。直すのが、難しい。…毎週、見る。'], fix: ['shiraishi', '手順に書く、か。誰に、いつ、何を言う。そこまで書けたら、読む。'], silent: ['shiraishi', '黙ったのは、誠実か、逃げか。…私は、まだ、決めない。'] },
    depot: { argue: ['tachibana', '…言い訳は、基地では聞かん。事実だけ、話せ。聞いてやる。'], accept: ['tachibana', '黙って受けるのは、半分だ。残り半分は、床下で見せろ。'], fix: ['tachibana', '手順書に、一行足すか。誰が読む。読まれん手順は、ないのと同じだ。'], silent: ['tachibana', '…黙るな。基地で黙る奴は、一番、危ない。', 'serious'] },
    dispatch: { argue: ['hamaguchi', '確定と見込みを、分けて。今のは、見込みのほうが、多い。'], accept: ['hamaguchi', '「確認します」は、言えた。次は、「直しました」を言え。'], fix: ['hamaguchi', '再発防止、書くのね。書いた紙を、復唱できる？ それが基準。'], silent: ['hamaguchi', '沈黙は、回線では、一番長い。…三秒で、「確認します」。'] },
    planning: { argue: ['toda', '数字になっていない反論は、意見です。聞きますが、出典を。'], accept: ['toda', '受け止める、は、結論ではありません。次の一手を、一行で。'], fix: ['toda', '資料にするのね。決める人が、最初に読む一行は、何ですか。'], silent: ['toda', '沈黙は、議事録に書けません。…でも、覚えておきます。'] }
  };
  const AFTER = { argue: ['反論は、記録に残ります。通るかどうかは、別です。', '「事情あり」の欄に、一行。それが、評価を、軽くも重くもします。', 1], accept: ['言い訳をしない、も、記録に残ります。…損をする時も、あります。', '来週から、毎週金曜、振り返りを出す約束が、できた。', 2], fix: ['「自ら作成」と、記録します。…その分、週末が、一つ、消えます。', '手順書の白紙が、机に置かれた。土曜は、もう、予定で埋まった。', 3], silent: ['沈黙も、記録します。「その場では、言えなかった」と。', '言えなかった言葉は、紙には、残らない。ただ、空気に、残る。', 0] };
  for (const key of ['argue', 'accept', 'fix', 'silent']) {
    rbranch('ch9.rsp_' + key, 'ch9.ra_' + key + '_');
    for (const r of ROUTES) line('ch9.ra_' + key + '_' + r, [RESP[r][key]], 'ch9.rx_' + key + '1', { view: VM(r, '15:20 ' + M[r].place) });
    line('ch9.rx_' + key + '1', [['morishita', AFTER[key][0]]], 'ch9.rx_' + key + '2', { view: IVV });
    line('ch9.rx_' + key + '2', [AFTER[key][1]], 'ch9.sc_route', { effects: [{ var: { key: 'ch9.score', add: AFTER[key][2] } }, ...(key === 'silent' ? [set('ch9.iv_silent')] : [])], view: IVV });
  }
  rbranch('ch9.sc_route', 'ch9.rb_');
  const HI = { service: 82, accuracy: 95, reporting: 72, teamwork: 66, safety: 75 };
  const KEYS = { station: ['service', 'teamwork'], depot: ['safety', 'accuracy'], dispatch: ['reporting', 'safety'], planning: ['reporting', 'accuracy'] };
  const RLN = { station: 'ここまでの半年、私は、君を、見てきた。…点では、測れない所を、私は買う。', depot: '半年、床下の話を、した。…お前の手の止め方は、もう、俺の目に入っている。', dispatch: '半年、電話の向こうで、聞いてきた。…あなたの聞き返しは、私の耳に、残っている。', planning: '半年、資料を、見てきました。…あなたの注記は、私の記憶に、残っています。' };
  for (const r of ROUTES) {
    branch('ch9.rb_' + r, [[RL('shiraishi', 'trust', '>=', 5), 'ch9.rb_' + r + '_y']], 'ch9.sc_' + r);
    line('ch9.rb_' + r + '_y', [[M[r].ev, RLN[r]]], 'ch9.sc_' + r, { effects: [{ var: { key: 'ch9.score', add: 1 } }, ], view: VM(r, '15:30 ' + M[r].place) });
    const [k1, k2] = KEYS[r];
    branch('ch9.sc_' + r, [[ALL(E(k1, '>=', HI[k1]), E(k2, '>=', HI[k2])), 'ch9.sc_' + r + '_2'], [ANY(E(k1, '>=', HI[k1]), E(k2, '>=', HI[k2])), 'ch9.sc_' + r + '_1']], 'ch9.vd_' + r);
    fx('ch9.sc_' + r + '_2', [{ var: { key: 'ch9.score', add: 2 } }], 'ch9.vd_' + r);
    fx('ch9.sc_' + r + '_1', [{ var: { key: 'ch9.score', add: 1 } }], 'ch9.vd_' + r);
    branch('ch9.vd_' + r, [[V('ch9.score', '>=', 5), 'ch9.sum_' + r + '_a'], [V('ch9.score', '>=', 3), 'ch9.sum_' + r + '_b']], 'ch9.sum_' + r + '_c');
    const e = M[r].ev;
    const SUM = {
      station: ['三つとも期待以上だ。次の半年は、教える側に回れ。', '期待どおりだ。得意を伸ばして、弱い所は仲間に頼れ。', '今は土台の時期だ。焦るな。だが、毎日は、見ている。'],
      depot: ['三本柱が揃っている。資格の話をしていい段階だ。', '見習いとしては悪くない。弱い面を、半年で潰せ。', '今のままでは床下は預けん。直せる。直す気があるなら、だ。'],
      dispatch: ['基礎は身についている。来年の基礎研修に推せる水準だ。', '標準だ。弱い面は、復唱の練習で補える。', '指令の前に、基礎を固める時期だ。焦るな。遅れは、取り戻せる。'],
      planning: ['基礎が、よくできています。次は主担当で一本、資料を。', '標準的です。得意と不得意を、自分の言葉で。', '今は型を作る時期です。型ができれば、あとは速い。']
    }[r];
    line(`ch9.sum_${r}_a`, [[e, SUM[0], 'smile'], ['morishita', '「期待を上回る」と記録。駅務基礎の修了も認定します。']], 'ch9.rec_route', { effects: [set('ch9.rate_high'), { cert: 'station_basic' }, tl('11月4日 半年の評価で「期待を上回る」と記録された')], view: VM(r, '15:50 ' + M[r].place) });
    line(`ch9.sum_${r}_b`, [[e, SUM[1]], ['morishita', '「期待どおり」と記録。駅務基礎の修了は、認定します。']], 'ch9.rec_route', { effects: [set('ch9.rate_mid'), { cert: 'station_basic' }, tl('11月4日 半年の評価で「期待どおり」と記録された')], view: VM(r, '15:50 ' + M[r].place) });
    line(`ch9.sum_${r}_c`, [[e, SUM[2], 'serious'], ['morishita', '「要育成」と記録。終点ではなく、出発点です。']], 'ch9.rec_route', { effects: [set('ch9.rate_low'), tl('11月4日 半年の評価で「要育成」と記録された')], view: VM(r, '15:50 ' + M[r].place) });
  }

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
    depot: [['tachibana', '橘検修長（厳しいが、見る目は確か）', 'careful'], ['sawada_r', '沢田さん（毎日、手本を見せた人）', 'caring'], ['yamashina', '山科さん（同じ基地を目指す同期）', 'neutral']],
    dispatch: [['hamaguchi', '浜口さん（基準を教えた人）', 'careful'], ['minase', '水無瀬さん（記録を見てくれた人）', 'caring'], ['shiraishi', '白石駅長（駅から送り出した人）', 'neutral']],
    planning: [['toda', '戸田さん（企画の責任者）', 'careful'], ['shiraishi', '白石駅長（現場から見た人）', 'quick'], ['kubota', '久保田さん（現場の目線を教えた人）', 'caring']]
  };
  for (const r of ROUTES) {
    line('ch9.rec_in_' + r, [RECIN[r], ['morishita', '署名で実習に申し込みます。良い点も、直す点も、そのまま書かれます。']], 'ch9.rec_' + r, { view: VM(r, '17:00 ' + M[r].place) });
    choice('ch9.rec_' + r, '誰に推薦を頼みますか？', RECOPT[r].map(([w, label, tone]) => opt(w, label, 'ch9.rs_' + r + '_' + w, { tone, effects: [set('ch9.rec_' + w), ] })), { important: true, who: 'morishita', view: VM(r, '17:00 推薦者の選択') });
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
  RS('depot', 'sawada_r', [
    ['sawada_r', '私が？ 橘さんのほうが重みがありますよ。', 'surprise'],
    ['player', '記録の読み方を教えたのは、沢田さんです。'],
    ['sawada_r', '場面で書きます。手の動き、声の出し方。ただし約束を。実習で、分からない事は、その場で聞くこと。', 'smile']
  ], [rel('sawada_r', 2, 2), ev('accuracy', 1)], '17:10 詰所');
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
    depot: [[F('ch9.rec_tachibana'), ['tachibana', '推薦書は事実だけだ。足りん所は、実習で足せ。']], [F('ch9.rec_sawada_r'), ['sawada_r', '下書き、場面ごとです。「記録票の一日」が一番長い。', 'smile']]],
    dispatch: [[F('ch9.rec_hamaguchi'), ['hamaguchi', '「見込み」は、実習で確かめてから足す。']], [F('ch9.rec_minase'), ['minase', '復唱の記録を並べて書きます。数字で、語らせます。', 'smile']]],
    planning: [[F('ch9.rec_toda'), ['toda', '数字、月曜までに。遅れた理由も、数字でね。']], [F('ch9.rec_shiraishi'), ['shiraishi', '「ホームの音」を、どう書くか。考えている。', 'smile']]]
  };
  for (const r of ROUTES) {
    const cases = AFT[r].map(([c], i) => [c, `ch9.after_${r}_${i}`]);
    branch('ch9.after_' + r, cases, 'ch9.after_' + r + '_x');
    AFT[r].forEach(([, l], i) => line(`ch9.after_${r}_${i}`, [l], 'ch9.rv0', { view: VM(r, '17:40 ' + M[r].place) }));
    line('ch9.after_' + r + '_x', [['yamashina', '推薦、頼めたか。…俺もだ。腹、治った。', 'smile']], 'ch9.rv0', { view: v25('hr', ['yamashina'], '17:40 休憩室') });
  }

  // ============ 10. 匿名の声の主（謎の回収）============
  const RVV = v25('hr', ['morishita'], '17:50 人事課');
  line('ch9.rv0', [['morishita', '最後に。例の、匿名の紙です。差出人から、「名前を足してよい」と連絡がありました。']], 'ch9.rv_who', { view: RVV });
  branch('ch9.rv_who', [[F('ch3.tsumura_met'), 'ch9.rv_ts'], [ANY(F('ch7.ogawa_thanks'), F('ch7.ogawa_unheard'), F('ch7.ogawa_hurry'), F('ch7.ogawa_rule')), 'ch9.rv_og']], 'ch9.rv_kj');
  branch('ch9.rv_ts', [[F('ch3.ts_asked'), 'ch9.rv_ts_a'], [F('ch3.ts_honest_feel'), 'ch9.rv_ts_h']], 'ch9.rv_ts_d');
  line('ch9.rv_ts_a', ['「始発の券売機で、機械に弱い私に、毎回、初めてのように説明してくれた。聞き返してくれる駅員は、貴重だ」。', '署名は、「津村」。'], 'ch9.rv_g', { effects: [set('ch9.slip_ts')], view: RVV });
  line('ch9.rv_ts_h', ['「始発の券売機で、正直に「分からない」と言ってくれた。それで、信用した」。', '署名は、「津村」。'], 'ch9.rv_g', { effects: [set('ch9.slip_ts')], view: RVV });
  line('ch9.rv_ts_d', ['「名前は、覚えていない。だが、始発の顔は、覚えている」。', '署名は、「津村」。'], 'ch9.rv_g', { effects: [set('ch9.slip_ts')], view: RVV });
  branch('ch9.rv_og', [[F('ch7.ogawa_thanks'), 'ch9.rv_og_t'], [F('ch7.ogawa_unheard'), 'ch9.rv_og_u']], 'ch9.rv_og_r');
  line('ch9.rv_og_t', ['「夏の夜、私は怒鳴った。娘の特徴を聞き返してくれた駅員が、いた。あの一言で、列の中の十分が、変わった」。', '署名は、「小川」。'], 'ch9.rv_g', { effects: [set('ch9.slip_og')], view: RVV });
  line('ch9.rv_og_u', ['「夏の夜、私の問いに、答える声が、なかった。娘は無事だった。だが、あの沈黙は、覚えている」。', '署名は、「小川」。'], 'ch9.rv_g', { effects: [set('ch9.slip_og')], view: RVV });
  line('ch9.rv_og_r', ['「夏の夜、言葉は、正しかった。ただ、私の問いには、届かなかった。それでも、駅員は、頭を下げた」。', '署名は、「小川」。'], 'ch9.rv_g', { effects: [set('ch9.slip_og')], view: RVV });
  branch('ch9.rv_kj', [[F('ch8.elder_helped'), 'ch9.rv_kj_h'], [F('ch8.elder_late'), 'ch9.rv_kj_l']], 'ch9.rv_kj_m');
  line('ch9.rv_kj_h', ['「友人の杖の音に、気づいてくれた駅員がいた。「いいよ」の裏を、聞いてくれた」。', '署名は、「梶原」。'], 'ch9.rv_g', { effects: [set('ch9.slip_kj')], view: RVV });
  line('ch9.rv_kj_l', ['「友人は「遅かった」と言った。言える相手になった、ということだと思う」。', '署名は、「梶原」。'], 'ch9.rv_g', { effects: [set('ch9.slip_kj')], view: RVV });
  line('ch9.rv_kj_m', ['「友人は、駅を変えた。責めてはいない。ただ、次の人には、聞いてあげて」。', '署名は、「梶原」。'], 'ch9.rv_g', { effects: [set('ch9.slip_kj')], view: RVV });
  branch('ch9.rv_g', [[ANY(ALL(F('ch9.slip_ts'), F('ch9.guess_ts')), ALL(F('ch9.slip_og'), F('ch9.guess_og')), ALL(F('ch9.slip_kj'), F('ch9.guess_kj'))), 'ch9.gr_y'], [F('ch9.guess_none'), 'ch9.gr_z']], 'ch9.gr_n');
  line('ch9.gr_y', [['morishita', '当たりでしたね。誰の目が、自分を見ているか。気づける人は、強い。', 'smile']], 'ch9.end', { effects: [set('ch9.guess_right'), rel('morishita', 1, 1)], view: RVV });
  line('ch9.gr_n', [['morishita', '外れでした。見られていた場所は、思わぬところに、あります。']], 'ch9.end', { view: RVV });
  line('ch9.gr_z', [['morishita', '心当たりがなかった、でよいと思います。見られていることを、知らないままのほうが、自然な日もある。']], 'ch9.end', { view: RVV });

  N['ch9.end'] = { id: 'ch9.end', type: 'end', chapter: 'ch9', title: '第9章 はじめての評価', nextChapter: 'ch10',
    summary: '半年の評価面談が終わった。手帳の付箋は、七か月の選択を一枚ずつ言葉に戻した。傷も、誇りも、記録に残る。そのうえで、推薦者を選んだ。来月、三日間の実習が始まる。',
    effects: [tl('11月4日 半年の評価面談を終える'), log('第9章を終了', 'chapter')] };
  k.shuffleCompose('ch9.');
}
