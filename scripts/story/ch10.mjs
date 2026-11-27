// R7 第10章「基地実習へ」（12月7日〜9日の三日間）。モチーフ：腕章（名札）。借りて、返す。
// ルート（ch6.wish_*）ごとに、別の場所・別の指導者・別の課題・別の「資格・研修の壁」で三日間を描く。
//   depot=基地実習（橘・沢田）／station=上級駅務の研修（他駅・星野）／dispatch=指令所での実習（浜口・水無瀬。扉の外から見る）／planning=企画部署での実習（戸田・黒田。資料と会議）
// 共通：人事の事前メモ → ルート別三日間 → 異動可否の会話（career）→ 章末の重要選択（ch10.stay / ch10.transfer）。
// 時刻は日またぎさせず、研修日は9:00〜17:00（勤務条件を守る）。
export default function ch10(k) {
  const { N, characters, line, choice, branch, fx, opt, set, rel, ev, sk, tr, tl, log, F, ANY, ALL, hm, v25, res3 } = k;

  characters.sawada ??= { id: 'sawada', name: '沢田 良平', kana: 'さわだ りょうへい', role: '車両基地 検修技術員', dept: 'depot', age: 31, years: 9, uniform: '#2f4f6a', hair: '#2a2a2a', skin: '#e8c29c', trait: '丁寧で手が早い。説明は短く、図で見せる。', bio: '橘検修長の下で九年。見習いの質問には、一度考えさせてから答える。', gender: 'm', accessory: 'none' };
  characters.minase ??= { id: 'minase', name: '水無瀬 美咲', kana: 'みなせ みさき', role: '輸送指令員', dept: 'dispatch', age: 34, years: 12, uniform: '#2a3d52', hair: '#2b2118', skin: '#f0cfae', trait: '落ち着いた声。復唱を欠かさない。', bio: '浜口と同じ指令所の当番員。新人の電話記録を丁寧に読む。', gender: 'f', accessory: 'glasses' };
  characters.toda ??= { id: 'toda', name: '戸田 玲子', kana: 'とだ れいこ', role: '本社 輸送計画課 課長補佐', dept: 'planning', age: 42, years: 19, uniform: '#3a4a5e', hair: '#2a2024', skin: '#f0cfae', trait: '数字を見て、人の事情も見る。会議では最後まで聞く。', bio: 'ダイヤ案の取りまとめ役。現場の声を資料に落とす仕事を大事にしている。', gender: 'f', accessory: 'glasses' };
  characters.kuroda ??= { id: 'kuroda', name: '黒田 拓海', kana: 'くろだ たくみ', role: '輸送計画課 係員', dept: 'planning', age: 27, years: 4, uniform: '#3a4a5e', hair: '#1c1c28', skin: '#efc9a6', trait: '資料の体裁にうるさい。教えるのは早口。', bio: '入社四年目。数字の置き方に、いつも一言ある。', gender: 'm', accessory: 'none' };
  characters.hoshino ??= { id: 'hoshino', name: '星野 慎一', kana: 'ほしの しんいち', role: '海浜口駅 助役（実習指導）', dept: 'station', age: 44, years: 22, uniform: '#1d2a44', hair: '#3a3a3a', skin: '#e8c29c', trait: '穏やかで観察が細かい。複数の駅の運用を経験している。', bio: '海浜口駅の助役。他駅からの実習生の受け入れ担当。', gender: 'm', accessory: 'cap' };

  const ROUTES = ['station', 'depot', 'dispatch', 'planning'];
  const rbranch = (id, prefix) => branch(id, [[F('ch6.wish_depot'), prefix + 'depot'], [F('ch6.wish_dispatch'), prefix + 'dispatch'], [F('ch6.wish_planning'), prefix + 'planning']], prefix + 'station');
  const E = (key, op, val) => ({ eval: { key, op, val } });
  const day = n => ({ clock: { addDay: n } });
  const at = (h, m) => ({ clock: { minute: hm(h, m) } });
  const HR = (who, cap) => v25('hr', who, cap);

  /** 課題（task）と、その結果の三つの反応（数値ではなく人物の感情）をまとめて作る。 */
  const mk = (id, kind, title, intro, extra, who, texts, eff, nxt, view) => {
    N[id] = { id, type: 'task', kind, title, intro, ...extra, results: res3(id + '_g', id + '_m', id + '_b', eff[0], eff[1], eff[2]), view };
    line(id + '_g', [[who, texts[0], 'smile']], nxt, { effects: [set(id + '_ok')], view });
    line(id + '_m', [[who, texts[1]]], nxt, { view });
    line(id + '_b', [[who, texts[2], 'serious']], nxt, { view });
  };

  // ============ 共通の導入：人事の事前メモ（過去の選択を一言で突く）============
  line('ch10.open', [
    '人事課の控室。石油ストーブが、チッ、と鳴った。机に、封筒が一通。',
    ['morishita', '12月7日。今日から三日間は「研修」扱いです。九時から十七時。残業はつけません。'],
    ['morishita', '体調が悪ければ、研修中でも言ってください。言える人が、一番長持ちします。'],
    ['morishita', '実習先には、評価メモを渡してあります。何が書いてあるか、先に。']
  ], 'ch10.m1', { effects: [day(33), at(7, 50), set('ch10.started'), tl('12月7日 三日間の実習が始まる'), log('第10章 基地実習へ', 'chapter')], view: HR(['morishita'], '12月7日（火） 7:50 本社 人事課') });
  const MV = HR(['morishita'], '事前メモ');
  branch('ch10.m1', [[F('ch3.honest'), 'ch10.m1h'], [F('ch3.pushed'), 'ch10.m1p']], 'ch10.m2');
  line('ch10.m1h', [['morishita', '五月、体調不良を自分で申告。「自己管理ができる」。今回も、同じ姿勢で。']], 'ch10.m2', { view: MV });
  line('ch10.m1p', [['morishita', '五月、無理をして勤務。後半に「休む判断を学んだ」と添えてあります。今回は、自分で線を。']], 'ch10.m2', { view: MV });
  branch('ch10.m2', [[F('ch4.secret_kept'), 'ch10.m2s'], [F('ch4.trust_built'), 'ch10.m2t']], 'ch10.m3');
  line('ch10.m2s', [['morishita', '同期の事情を守った件。守秘はできる人、と。一人で抱える癖も、同じ欄に。']], 'ch10.m3', { view: MV });
  line('ch10.m2t', [['morishita', '同期と弱さを言い合えた件。初対面ばかりの実習で、効く力です。']], 'ch10.m3', { view: MV });
  branch('ch10.m3', [[F('ch5.late_report'), 'ch10.m3l']], 'ch10.m3b');
  line('ch10.m3l', [['morishita', '七月の遅れた報告。その後、第一報が早くなったと、付記されています。']], 'ch10.m3b', { view: MV });
  branch('ch10.m3b', [[F('ch5.root_found'), 'ch10.m3r']], 'ch10.m4');
  line('ch10.m3r', [['morishita', '原因を人でなく、場所と手順に求めた件。高く評価されています。']], 'ch10.m4', { view: MV });
  branch('ch10.m4', [[F('ch2.idea_selfpost'), 'ch10.m4s'], [F('ch2.proposal_sent'), 'ch10.m4p'], [F('ch2.idea_consult'), 'ch10.m4c'], [F('ch2.idea_skip'), 'ch10.m4k']], 'ch10.m5');
  line('ch10.m4s', [['morishita', '四月の掲示の件。気づきを持ち込むときは、まず相談から。']], 'ch10.m5', { view: MV });
  line('ch10.m4p', [['morishita', '四月の提案書は、実習先にも共有済みです。書く場面で、効きます。']], 'ch10.m5', { view: MV });
  line('ch10.m4c', [['morishita', '四月は、気づきを先に相談した、と。順番を守る人は、現場で信用されます。']], 'ch10.m5', { view: MV });
  line('ch10.m4k', [['morishita', '四月は、気づきを見送った、と。三日間は、小さくても、口に出す練習を。']], 'ch10.m5', { view: MV });
  branch('ch10.m5', [[ANY(F('legacy.rule_break'), F('legacy.concealed')), 'ch10.m5x']], 'ch10.m6');
  line('ch10.m5x', [['morishita', '過去の指摘も伝わっています。向き合い方を選んだ日のことも、同じ紙に。この三日間は、その続きです。', 'smile']], 'ch10.m6', { view: MV });
  branch('ch10.m6', [[ANY(F('ch9.rec_kubota'), F('ch9.rec_sawada'), F('ch9.rec_minase')), 'ch10.m6a'], [ANY(F('ch9.rec_shiraishi'), F('ch9.rec_tachibana'), F('ch9.rec_hamaguchi'), F('ch9.rec_toda')), 'ch10.m6b'], [F('ch9.rec_yamashina'), 'ch10.m6c']], 'ch10.route');
  line('ch10.m6a', [['morishita', '推薦書は、毎日を見ていた人が書きました。場面が具体的で、先方が待っています。']], 'ch10.route', { view: MV });
  line('ch10.m6b', [['morishita', '推薦書は、責任ある立場の方が。重い言葉は、期待と同じ重さです。']], 'ch10.route', { view: MV });
  line('ch10.m6c', [['morishita', '推薦書は同期の方が。別枠ですが、先方は、人柄の欄を一番楽しみにしています。']], 'ch10.route', { view: MV });
  rbranch('ch10.route', 'ch10.in_');

  // ============ 共通：異動可否の判定（career の要件を会話で示す）============
  const JD = {
    station: ['上級駅務、助役候補の道の目安です。在籍十八か月以上。現在八か月。あと十か月。', 'service', 'teamwork', 58, 56],
    depot: ['検修の要件は、在籍十二か月、駅務基礎、車両基地入門、安全五十八・正確さ五十六。現在八か月。あと四か月。', 'safety', 'accuracy', 58, 56],
    dispatch: ['指令補助の目安は、在籍二十四か月、駅務基礎、運転整理の基礎研修。現在八か月。あと十六か月です。', 'reporting', 'safety', 60, 58],
    planning: ['輸送計画の要件は、在籍二十四か月、駅務基礎、報連相六十・正確さ五十八。現在八か月。あと十六か月。', 'reporting', 'accuracy', 60, 58]
  };
  const JV = HR(['morishita'], '15:50 人事課 面談（オンライン）');
  line('ch10.jd_open', [['morishita', '三日間、お疲れさまでした。最後に、異動の「可否」を。数字で、正直に。']], 'ch10.jd_route', { effects: [at(15, 50)], view: JV });
  rbranch('ch10.jd_route', 'ch10.jd_');
  for (const r of ROUTES) line('ch10.jd_' + r, [['morishita', JD[r][0]], ['morishita', '在籍だけは、今日どれだけ頑張っても動きません。「足りない」でなく「これから積む」です。']], 'ch10.jd_cert', { view: JV });
  branch('ch10.jd_cert', [[{ cert: 'station_basic' }, 'ch10.jd_cert_y']], 'ch10.jd_cert_n');
  line('ch10.jd_cert_y', [['morishita', '駅務基礎の修了は、確認できています。ここは満たしています。']], 'ch10.jd_ev_route', { view: JV });
  line('ch10.jd_cert_n', [['morishita', '駅務基礎の修了は、まだ記録にありません。次の定期研修で受けられるよう、調整します。']], 'ch10.jd_ev_route', { view: JV });
  rbranch('ch10.jd_ev_route', 'ch10.jd_ev_');
  for (const r of ROUTES) branch('ch10.jd_ev_' + r, [[ALL(E(JD[r][1], '>=', JD[r][3]), E(JD[r][2], '>=', JD[r][4])), 'ch10.jd_ev_y']], 'ch10.jd_ev_n');
  line('ch10.jd_ev_y', [['morishita', '評価の要件は、今の水準で満たしています。時間さえ経てば、条件の一つは、もう用意できている。', 'smile']], 'ch10.jd_sum_route', { view: JV });
  line('ch10.jd_ev_n', [['morishita', '評価の要件には、あと少し届きません。数字は、日々の積み重ねで動きます。']], 'ch10.jd_sum_route', { view: JV });
  rbranch('ch10.jd_sum_route', 'ch10.jd_sum_');
  const JS = {
    station: '判定は「要件未達」。ただ、希望は記録に残ります。条件が揃う来年の秋以降に、再判定です。',
    depot: '判定は「要件未達」。ただ、車両基地入門の研修は、この三日間を含めて記録できます。',
    dispatch: '判定は「要件未達」。指令補助は枠が少ない道です。早めに、研修計画を一緒に。',
    planning: '判定は「要件未達」。企画は枠が少ない。評価の数字を、丁寧に積みましょう。'
  };
  for (const r of ROUTES) line('ch10.jd_sum_' + r, [['morishita', JS[r]], ['morishita', 'あなたの価値の評価ではありません。時間と資格と研修の「順番」の話です。']], 'ch10.fin_' + r, { view: JV });

  // ============ 章末の重要選択（ルートで名前と意味が変わる）============
  const FIN = {
    station: { q: '三日間を終えて。これからの道は？', stay: '青嶺中央駅に戻り、学んだ手順を持ち帰って駅務を深める', trans: '他駅で、助役候補の道へ。海浜口駅への異動を正式に希望する' },
    depot: { q: '三日間を終えて。これからの道は？', stay: '駅に戻り、基地の「記録と確認」を持ち帰って駅務を深める', trans: '基地で働きたい。車両基地への異動を正式に希望する' },
    dispatch: { q: '三日間を終えて。これからの道は？', stay: '駅に戻り、指令の「確定と見込み」を持ち帰って駅務を深める', trans: '指令の仕事へ。指令補助への異動希望を正式に出す' },
    planning: { q: '三日間を終えて。これからの道は？', stay: '駅に戻り、資料と会議の学びを現場に持ち帰る', trans: '企画の仕事へ。輸送計画課への異動を正式に希望する' }
  };
  const APPLY = { station: { dept: 'station', note: '海浜口駅での上級駅務（助役候補）への異動希望' }, depot: { dept: 'depot', note: '青浜総合車両センター 検修への異動希望' }, planning: { dept: 'planning', note: '本社 輸送計画課への異動希望' } };
  for (const r of ROUTES) {
    line('ch10.fin_' + r, [['morishita', '最後に、あなたの気持ちを。どちらも、間違いではありません。「深める」も「踏み出す」も、同じ重さです。']], 'ch10.fc_' + r, { view: HR(['morishita'], '16:10 人事課 面談') });
    choice('ch10.fc_' + r, FIN[r].q, [
      opt('stay', FIN[r].stay, 'ch10.sc_' + r + '_stay', { tone: 'careful', effects: [set('ch10.stay'), ev('teamwork', 1), ...(r === 'depot' ? [set('ch10.back_to_station')] : [])] }),
      opt('transfer', FIN[r].trans, 'ch10.sc_' + r + '_tr', { tone: 'risky', effects: [set('ch10.transfer'), set('ch10.transfer_to_' + r), ...(APPLY[r] ? [{ apply: APPLY[r] }] : []), ...(r === 'depot' ? [set('ch10.apply_depot')] : [])] })
    ], { important: true, who: 'morishita', view: HR(['morishita'], '16:10 章末の選択') });
  }
  const SC = {
    station: {
      stay: [['morishita', '深める、ですね。星野助役にも伝えます。手順を持ち帰る人は、駅の宝です。', 'smile'], ['player', '他駅の形を、そのまま持ち込まず、うちの駅の形に直します。'], ['morishita', '来月から、月一回、他駅の運用を学ぶ日を作りましょう。']],
      tr: [['morishita', '海浜口駅への希望、受け付けます。判定は「要件未達」で保留。希望は、記録に残ります。', 'serious'], ['player', '今すぐでなくていいです。条件が揃うまで、今の駅で、やる事をやります。']]
    },
    depot: {
      stay: [['morishita', '深める、ですね。橘さんにも伝えます。基地は「駅を知る人」を欲しがっています。', 'smile'], ['player', '基地の「三回読む」を、駅に持ち帰ります。駅にも同じ手順があるはずなので。']],
      tr: [['morishita', '車両基地への希望、受け付けます。判定は「要件未達」で保留。この三日間は、研修として記録します。', 'serious'], ['player', '四月まで、駅務基礎と評価を、一つずつ積みます。']]
    },
    dispatch: {
      stay: [['morishita', '深める、ですね。浜口さんにも伝えます。指令は「駅の事情を知る人」を頼りにしています。', 'smile'], ['player', '「確定と見込み」を、駅の放送と引継ぎで、そのまま使います。']],
      tr: [['morishita', '指令補助への希望、受け付けます。ただ、正式な異動先の枠に、まだ登録がありません。希望のメモとして保管します。', 'serious'], ['player', '枠がなくても、残してもらえるのは助かります。研修計画を、一緒に。']]
    },
    planning: {
      stay: [['morishita', '深める、ですね。戸田さんにも伝えます。計画は「現場の肌感覚を持つ人」を欲しがっています。', 'smile'], ['player', '資料の端の注記を、駅の日報にも広げます。数字に顔をつける練習です。']],
      tr: [['morishita', '輸送計画課への希望、受け付けます。判定は「要件未達」で保留。三日間の資料は、保管します。', 'serious'], ['player', '練習資料を毎月一本、書きます。戸田さんに、読んでもらえるでしょうか。']]
    }
  };
  for (const r of ROUTES) {
    line('ch10.sc_' + r + '_stay', SC[r].stay, 'ch10.cl_' + r, { effects: [tl('12月9日 学びを持ち帰り、今の持ち場を深める道を選ぶ')], view: HR(['morishita'], '16:30 人事課 面談') });
    line('ch10.sc_' + r + '_tr', SC[r].tr, 'ch10.cl_' + r, { effects: [tl('12月9日 実習先への異動を、正式に希望として記録する')], view: HR(['morishita'], '16:30 人事課 面談') });
  }

  // ============ 閉幕（ルート別。選んだ道を読む。腕章の返却のあと）============
  const CLV = { station: ['hoshino', 'office', '海浜口駅 ホーム'], depot: ['tachibana', 'depot', '青浜総合車両センター 構内'], dispatch: ['hamaguchi', 'office', '輸送指令所 廊下'], planning: ['toda', 'hr', '本社 輸送計画課 窓際'] };
  const CLX = {
    station: { s: ['ホームの端で、星野が帽子を直した。', ['hoshino', '朝礼で、一分だけ話してみなさい。一分で話せる三日間は、身についている。']], t: ['ホームの端で、星野が帽子を直した。', ['hoshino', '春にまた、ここで。今度は同僚として。予定表に、書いておきますよ。', 'smile']] },
    depot: { s: ['夕暮れの検修庫。シャッターが、ゴン、と降りた。', ['tachibana', '駅へ戻れ。駅で一番正確な人間になれ。基地は、お前を忘れん。']], t: ['夕暮れの検修庫。シャッターが、ゴン、と降りた。', ['tachibana', '四月以降、待つ。それまで、駅で一番丁寧な見習いでいろ。']] },
    dispatch: { s: ['廊下の灯りは、昼も夜も同じ色だ。', ['hamaguchi', '駅で、確定と見込みを分けて話せ。それだけで、指令は助かる。']], t: ['廊下の灯りは、昼も夜も同じ色だ。', ['hamaguchi', '順番を守れ。急ぐな。だが、止まるな。']] },
    planning: { s: ['窓の外、夕方のラッシュの光が増えていく。', ['toda', '朝礼の隅で、数字を一つだけ話して。それが、計画と現場の最初の橋です。']], t: ['窓の外、夕方のラッシュの光が増えていく。', ['toda', '次は、書く側の席を用意します。それまで、顔のある数字を集めて。']] }
  };
  for (const r of ROUTES) {
    const [id, bg, cap] = CLV[r];
    branch('ch10.cl_' + r, [[F('ch10.transfer'), 'ch10.cl_' + r + '_t']], 'ch10.cl_' + r + '_s');
    line('ch10.cl_' + r + '_s', CLX[r].s, 'ch10.end', { effects: [at(17, 0)], view: v25(bg, [id], '12月9日 17:00 ' + cap) });
    line('ch10.cl_' + r + '_t', CLX[r].t, 'ch10.end', { effects: [at(17, 0)], view: v25(bg, [id], '12月9日 17:00 ' + cap) });
  }
  N['ch10.end'] = { id: 'ch10.end', type: 'end', chapter: 'ch10', title: '第10章 基地実習へ', nextChapter: 'ch11',
    summary: '三日間の実習が終わった。腕章は、返した。資格がなければ触れない作業の前で立ち止まった経験は、どの道を選んでも、足元に残る。今の持ち場を深めるか、別の道へ踏み出すか。答えは、次の季節に、少しずつ形になっていく。',
    effects: [tl('12月9日 三日間の実習を終える'), log('第10章を終了', 'chapter')] };

  const checklistLabels = ['見習い・監督下でできる', '有資格者のみ'];

  // ----------- depot：基地実習（橘・沢田・山科）-----------
  const DV = (who, cap) => v25('depot', who, cap);
  line('ch10.in_depot', [
    'ガラガラ、と検修庫のシャッターが上がる。油と、冷えた鉄の匂いが、顔に当たった。',
    ['tachibana', '来たな。この三日間、お前は見習いだ。これを付けろ。'],
    '黄色い腕章。白い糸で「見習・監督下」。布のくせに、やけに重い。',
    ['yamashina', '…重いな、これ。布なのに。', 'worry']
  ], 'ch10.dp_plan', { effects: [at(9, 0), set('ch10.route_depot')], view: DV(['tachibana', 'sawada', 'yamashina'], '12月7日（火） 9:00 青浜総合車両センター') });
  branch('ch10.dp_plan', [[F('ch6.plan_cert'), 'ch10.dp_pc'], [F('ch6.plan_ojt'), 'ch10.dp_po']], 'ch10.dp_wall');
  line('ch10.dp_pc', [['tachibana', '資格を先に取る計画だったな。いい。ただ、座学で床下の匂いは分からん。']], 'ch10.dp_wall', { view: DV(['tachibana'], '9:20') });
  line('ch10.dp_po', [['tachibana', '現場で覚える計画か。基地の現場は、資格者の隣でしか成立せん。']], 'ch10.dp_wall', { view: DV(['tachibana'], '9:20') });
  line('ch10.dp_wall', [
    '黒板に、赤線が一本。左は「見習い・監督下」。右は「有資格者のみ」。',
    ['tachibana', '赤線の右は触るな。触りたくなったら、俺を見ろ。止めてやる。']
  ], 'ch10.dp_zone_task', { view: DV(['sawada', 'tachibana'], '9:40 検修庫 詰所') });
  mk('ch10.dp_zone_task', 'checklist', '作業区分の確認（見習いの壁）', '見習いにできる作業か、有資格者だけの作業かを判定します。', {
    config: { labels: checklistLabels }, items: [
      { id: 'a', label: '検査済みの点検記録票を、先輩の確認を受けながら読み上げて照合する', truth: 'ok', why: '記録の確認は、見習いの基本業務です。' },
      { id: 'b', label: '床下の高圧機器のふたを開け、内部を点検する', truth: 'ng', why: '高圧に関わる作業は、有資格者のみです。' },
      { id: 'c', label: '工具箱の員数を確認し、声に出して報告する', truth: 'ok', why: '員数点検は、見習いが監督下で行う重要な作業です。' },
      { id: 'd', label: '留置線で、編成を動かす入換の合図を、自分の判断で出す', truth: 'ng', why: '入換は、資格者の合図と運転がそろって成り立ちます。' },
      { id: 'e', label: '検修庫の通路を巡回し、油漏れや置き忘れを見つけて報告する', truth: 'ok', why: '見回りと報告は、見習いにも期待される仕事です。' }
    ]
  }, 'sawada', ['全問正解です。壁の位置が分かれば、三日間は安全です。', '数問ずれました。赤線の右では、必ず止まってください。', '壁を軽く見ていませんか。壁は、あなたを守っています。'], [[ev('safety', 3)], [ev('safety', 1)], [ev('safety', -2)]], 'ch10.dp_rec_intro', DV(['sawada'], '10:00 検修庫'));
  line('ch10.dp_rec_intro', [
    ['sawada', '記録票は、次の作業者への手紙です。誤字は、次の人の命綱のほつれです。']
  ], 'ch10.dp_rec_task', { view: DV(['sawada'], '10:20') });
  mk('ch10.dp_rec_task', 'checklist', '点検記録票の確認', '各項目が、記録として正しいか、不備があるかを判定します。', {
    config: { labels: ['記載は正しい', '不備がある'] }, items: [
      { id: 'a', label: '検査日と次回検査期限が、規程の間隔に合っている', truth: 'ok', why: '間隔が合っていれば、記載として正しいです。' },
      { id: 'b', label: '検査者の確認印が、一か所だけ欠けている', truth: 'ng', why: '確認印の欠落は、誰が確認したか分からなくなる重大な不備です。' },
      { id: 'c', label: '油量の単位が、他の欄と違う（リットルと立方センチメートル）', truth: 'ng', why: '単位の混在は、数字の読み違いを招きます。' },
      { id: 'd', label: '部品交換の欄に、交換日と担当者の名前がそろっている', truth: 'ok', why: '日付と担当者が揃えば、追跡できます。' },
      { id: 'e', label: '備考欄は空白で、「異常なし」の記載がある', truth: 'ok', why: '異常なしの記載があれば、空白でも書式上許されます。' }
    ]
  }, 'sawada', ['二つとも拾いましたね。単位に気づく人は、少ないんです。', '惜しい。印と単位は、必ず見てください。', '見落としが多いです。声に出して、桁と単位から。'], [[ev('accuracy', 4), sk('depot', 3), tr('depot_intro', 20)], [ev('accuracy', 1), tr('depot_intro', 10)], [ev('accuracy', -2), tr('depot_intro', 5)]], 'ch10.dp_lunch', DV(['sawada'], '11:30 検修庫'));
  line('ch10.dp_lunch', [
    '正午。詰所の長机に、使い込んだ魔法瓶。橘が、湯呑みを三つ並べた。',
    ['tachibana', '昼を飛ばす奴は、午後に手が鈍る。飲め。'],
    ['tachibana', '俺は三年かかった。同期は一年。悔しかったが、遅い奴のほうが事故は少ない。'],
    '橘が、手元の札を、そっと沢田のほうへ滑らせた。「読んでくれ」。老眼鏡は、胸ポケットに入ったままだった。',
    ['sawada', '…はい。「交換済」です。']
  ], 'ch10.dp_d1end', { effects: [at(12, 0)], view: DV(['tachibana', 'yamashina', 'sawada'], '12:00 詰所') });
  branch('ch10.dp_d1end', [[F('ch10.dp_zone_task_ok'), 'ch10.dp_d1end_a']], 'ch10.dp_d1end_b');
  line('ch10.dp_d1end_a', [['tachibana', '区分表は全問正解だったな。壁を知る奴は、壁際で安全に動ける。', 'smile'], '十七時。橘が詰所の電気を消した。「明日、体を持ってこい」。'], 'ch10.dp_d2', { effects: [at(17, 0), tl('12月7日 基地実習 初日を終える')], view: DV(['tachibana'], '17:00 詰所') });
  line('ch10.dp_d1end_b', [['tachibana', '区分表は、ずれたな。壁の前でぶつかれたなら、悪くない。'], '十七時。橘が詰所の電気を消した。「明日、体を持ってこい」。'], 'ch10.dp_d2', { effects: [at(17, 0), tl('12月7日 基地実習 初日を終える')], view: DV(['tachibana'], '17:00 詰所') });

  line('ch10.dp_d2', [
    '二日目。窓に霜。工具室の金属が、触れるとキンと冷たい。',
    ['sawada', '床下に工具を忘れた編成が走ったら。想像できますね。'],
    ['player', '一本ずつ、声に出して数えます。']
  ], 'ch10.dp_tool_task', { effects: [day(1), at(9, 0)], view: DV(['sawada'], '12月8日（水） 9:00 工具室') });
  mk('ch10.dp_tool_task', 'memory', '工具の員数点検', '表示されている工具を覚え、同じ順に報告します。', {
    config: { sequence: ['トルクレンチ', 'ノギス', 'ハンマー', '懐中電灯'], pool: ['トルクレンチ', 'ノギス', 'ハンマー', '懐中電灯', 'スパナ', 'ドライバー', 'ペンチ', 'ゲージ'], showMs: 4600, showLabel: '作業前の工具箱' }
  }, 'sawada', ['全部合ってます。数える声が、もう基地の声ですよ。', '順番が一本、ずれました。置き場所と一緒に覚えると、ずれません。', '数が合いません。作業前は、必ず二人で数えます。一人の確信は信じません。'], [[ev('accuracy', 3), ev('safety', 2)], [ev('accuracy', 1)], [ev('safety', -2)]], 'ch10.dp_parts_intro', DV(['sawada'], '9:30 工具室'));
  line('ch10.dp_parts_intro', [['sawada', '次は部品札。読み違えると、使えない部品が「良品」に戻ります。']], 'ch10.dp_parts_task', { view: DV(['sawada'], '10:30 部品庫') });
  mk('ch10.dp_parts_task', 'sort', '部品札の仕分け', '札に従って、部品を正しい棚へ仕分けます。', {
    config: { perItem: 8, bins: [{ id: 'good', label: '良品棚（再使用可）' }, { id: 'check', label: '要検査棚' }, { id: 'scrap', label: '交換済み・廃棄' }], items: [
      { id: 'a', label: '「検査済・合格」の札が付いた締結部品', bin: 'good', why: '合格札があるので、良品棚です。' },
      { id: 'b', label: '札なし。外観に、わずかな傷', bin: 'check', why: '札のない部品は、要検査です。' },
      { id: 'c', label: '「交換済・使用不可」の札が付いた摩耗部品', bin: 'scrap', why: '使用不可は廃棄の対象です。' },
      { id: 'd', label: '「再検査待ち」の札が付いたシール材', bin: 'check', why: '再検査待ちは、検査棚です。' },
      { id: 'e', label: '「検査済・合格」だが、日付が古く規程の期限切れ', bin: 'check', why: '期限切れの合格札は、再検査が必要です。' }
    ] }
  }, 'sawada', ['期限まで見ましたね。…私が新人の頃より、速い。', 'ほぼ合ってます。期限切れの合格札だけ、気をつけて。', '札の読み方を、もう一度やりましょう。付き合います。'], [[ev('accuracy', 3), sk('depot', 3), tr('depot_intro', 35)], [ev('accuracy', 1), tr('depot_intro', 20)], [ev('accuracy', -1), tr('depot_intro', 10)]], 'ch10.dp_wall2', DV(['sawada'], '11:20 部品庫'));
  line('ch10.dp_wall2', [
    '黄色い線で囲まれた区画。沢田が、床下へ潜る前に、一度だけ振り向いた。',
    ['sawada', '有資格者の作業をします。見習いは、線の外から。声は、どうぞ。'],
    ['tachibana', '迷いは、資格の前に全部片付けてある。見えるか、あの手が。']
  ], 'ch10.dp_line_choice', { effects: [at(13, 0)], view: DV(['sawada', 'tachibana', 'yamashina'], '13:00 検修庫 作業区画') });
  choice('ch10.dp_line_choice', '線の外から、有資格者の作業を見ています。どう過ごす？', [
    opt('record', '手順と声かけを、全部手帳に書き取る', 'ch10.dp_c_record', { tone: 'careful', effects: [set('ch10.dp_record'), ev('accuracy', 2), sk('depot', 2)] }),
    opt('ask', '合間に「なぜその順番か」を聞く', 'ch10.dp_c_ask', { tone: 'honest', effects: [set('ch10.dp_ask'), ev('reporting', 2), rel('tachibana', 1, 1)] }),
    opt('path', '橘に、資格の取り方と順番を聞く', 'ch10.dp_c_path', { tone: 'quick', effects: [set('ch10.dp_path'), ev('teamwork', 1), tr('depot_intro', 10)] })
  ], { important: true, view: DV(['sawada', 'tachibana'], '13:10 検修庫 作業区画') });
  line('ch10.dp_c_record', [
    '「ふたを閉める前に、もう一度数える」。手帳に、一行ずつ。',
    ['tachibana', '書くのは、見るの一部だ。見習いは、見て、書け。'],
    '終わって、沢田が手帳に一言足した。「ここ、順番が逆です」。']
  , 'ch10.dp_d2end', { view: DV(['tachibana', 'sawada'], '14:00 検修庫') });
  line('ch10.dp_c_ask', [
    ['player', 'なぜ、閉める前にもう一度数えるんですか。'],
    ['sawada', '（床下から）作業中に、記憶が書き換わるからです。人間の記憶は、都合がいい。'],
    ['tachibana', '見習いの質問は、手順書の足りない一行を教えてくれる。', 'smile']
  ], 'ch10.dp_d2end', { view: DV(['sawada', 'tachibana'], '14:00 検修庫') });
  line('ch10.dp_c_path', [
    ['player', '資格まで、順番を教えてください。'],
    ['tachibana', '駅務基礎。基地入門。検修補助の座学と実技。三つ目に、半年から二年。']
  ], 'ch10.dp_d2end', { view: DV(['tachibana'], '14:00 検修庫') });
  line('ch10.dp_d2end', [
    '十七時のチャイム。'
  ], 'ch10.dp_d3', { effects: [at(17, 0), tl('12月8日 基地実習 二日目を終える')], view: DV(['tachibana', 'yamashina'], '17:00 詰所') });
  line('ch10.dp_d3', [
    '三日目。夜のうちに入区した編成が、庫内で、湯気のように冷気を吐いている。',
    ['tachibana', '見回りだ。見つけたら報告。何もなくても、報告。それが一人前だ。']
  ], 'ch10.dp_round_task', { effects: [day(1), at(9, 0)], view: DV(['tachibana'], '12月9日（木） 9:00 検修庫') });
  mk('ch10.dp_round_task', 'find', '検修庫の見回り', '検修庫の危険や不備を、制限時間内に見つけてタップします。', {
    config: { scene: 'depot', seconds: 40, props: [
      { x: 0.04, y: 0.15, w: 0.4, h: 0.5, c: '#44556a', t: '編成' }, { x: 0.5, y: 0.15, w: 0.2, h: 0.5, c: '#667788', t: '作業台' }, { x: 0.75, y: 0.1, w: 0.2, h: 0.6, c: '#556b55', t: '機器棚' }, { x: 0, y: 0.78, w: 1, h: 0.1, c: '#8a8f96', t: '通路' }],
    spots: [
      { id: 'oil', x: 0.28, y: 0.8, label: '編成の下の通路に、油が垂れている' },
      { id: 'wrench', x: 0.58, y: 0.42, label: '作業台に、レンチが置きっぱなし' },
      { id: 'cone', x: 0.84, y: 0.66, label: '機器棚の前の安全コーンが倒れている' },
      { id: 'ok', x: 0.15, y: 0.4, real: false, label: '編成の側面は問題ありません' }] }
  }, 'tachibana', ['…全部拾ったか。報告も短かった。それでいい。', '二つ。残りは、隅をもう一周しろ。', '歩く順番を決めろ。端から端まで。目は、足の次だ。'], [[ev('safety', 3), ev('accuracy', 2), tr('depot_intro', 35)], [ev('safety', 1), tr('depot_intro', 20)], [ev('safety', -1), tr('depot_intro', 10)]], 'ch10.dp_talk', DV(['tachibana'], '10:30 検修庫'));
  branch('ch10.dp_talk', [[ALL(F('ch10.dp_rec_task_ok'), F('ch10.dp_round_task_ok')), 'ch10.dp_talk_a'], [ANY(F('ch10.dp_rec_task_ok'), F('ch10.dp_round_task_ok'), F('ch10.dp_parts_task_ok')), 'ch10.dp_talk_b']], 'ch10.dp_talk_c');
  line('ch10.dp_talk_a', [
    ['tachibana', '三日、見た。記録も見回りも、手が止まらん。一度も、線を越えなかった。', 'smile'],
    ['tachibana', '向いている。だが、向いているのと、今入れるのは別の話だ。']
  ], 'ch10.dp_talk_x', { view: DV(['tachibana'], '14:30 詰所') });
  line('ch10.dp_talk_b', [
    ['tachibana', '得意と苦手が、はっきり出たな。足りない所は、先に潰してから来い。']
  ], 'ch10.dp_talk_x', { view: DV(['tachibana'], '14:30 詰所') });
  line('ch10.dp_talk_c', [
    ['tachibana', 'まだ、基地は足元に届いていない。', 'serious'],
    ['tachibana', 'だが、三日、一度も線を越えなかった。越える奴は、腕があっても置けん。']
  ], 'ch10.dp_talk_x', { view: DV(['tachibana'], '14:30 詰所') });
  branch('ch10.dp_talk_x', [[F('ch10.dp_ask'), 'ch10.dp_talk_xa'], [F('ch10.dp_path'), 'ch10.dp_talk_xp']], 'ch10.dp_talk_xr');
  line('ch10.dp_talk_xa', [['tachibana', '昨日の質問、沢田が手順書に一行足すそうだ。「数え直す理由」を。', 'smile']], 'ch10.dp_return', { view: DV(['tachibana'], '14:40 詰所') });
  line('ch10.dp_talk_xp', [['tachibana', '資格の順番を、自分から聞いた奴は久しぶりだ。研修日程は、人事に伝えておく。']], 'ch10.dp_return', { view: DV(['tachibana'], '14:40 詰所') });
  line('ch10.dp_talk_xr', [['tachibana', 'あの手帳は、後輩に見せろ。見習いの記録は、財産だ。']], 'ch10.dp_return', { view: DV(['tachibana'], '14:40 詰所') });
  line('ch10.dp_return', [
    ['sawada', '腕章を。…ゆっくり外してください。三日分、汗が染みてます。', 'smile'],
    '黄色い布を畳んで、両手で渡した。肩が軽くなった。それが、少し寂しかった。',
    ['yamashina', '来年の四月、また付ける。今度は、外す日のために。'],
    ['tachibana', '行け。人事が待ってる。']
  ], 'ch10.dp_vjd', { effects: [tr('depot_intro', 100), set('ch10.dp_done'), sk('depot', 3), tl('12月9日 車両基地入門の三日間を修了する')], view: DV(['tachibana', 'sawada', 'yamashina'], '15:30 詰所') });
  fx('ch10.dp_vjd', [], 'ch10.jd_open');

  // ----------- station：上級駅務の研修（他駅・星野）-----------
  const SV = (who, cap) => v25('office', who, cap);
  line('ch10.in_station', [
    '海浜口駅。発車メロディが、青嶺中央と違う。それだけで、他人の家に来た気分になる。',
    ['hoshino', '助役の星野です。ここは、通院と買い物のお客様が多い駅です。顔を覚えている方が、たくさんいます。', 'smile'],
    '星野が渡した腕章は、水色。白い糸で「実習・監督下」。'
  ], 'ch10.st_plan', { effects: [at(9, 0), set('ch10.route_station')], view: SV(['hoshino'], '12月7日（火） 9:00 海浜口駅 駅事務室') });
  branch('ch10.st_plan', [[F('ch6.plan_cert'), 'ch10.st_pc'], [F('ch6.plan_ojt'), 'ch10.st_po']], 'ch10.st_wall');
  line('ch10.st_pc', [['hoshino', '資格を先に、の計画でしたね。「運転取扱」の座学は、早めに。毎日、有資格者の仕事が見られます。']], 'ch10.st_wall', { view: SV(['hoshino'], '9:20') });
  line('ch10.st_po', [['hoshino', '現場で覚える計画でしたね。駅はそれが強い。ただ、運転に関わる部分は、座学が先です。']], 'ch10.st_wall', { view: SV(['hoshino'], '9:20') });
  line('ch10.st_wall', [
    ['hoshino', '列車の発車を抑止する。信号設備を扱う。「運転取扱い」は、資格者だけです。']
  ], 'ch10.st_zone_task', { view: SV(['hoshino'], '9:40 海浜口駅 事務室') });
  mk('ch10.st_zone_task', 'checklist', '駅務の作業区分（見習いの壁）', '見習いにできる作業か、有資格者だけの作業かを判定します。', {
    config: { labels: checklistLabels }, items: [
      { id: 'a', label: '落とし物の台帳登録を、助役の確認を受けながら行う', truth: 'ok', why: '台帳の登録は、見習いが監督下で行う基本業務です。' },
      { id: 'b', label: '運転士に、列車の発車を抑止するよう指示する', truth: 'ng', why: '運転に関わる指示は、運転取扱いの資格者だけです。' },
      { id: 'c', label: '車いすのお客様に、ホームで乗降の介助と案内を行う', truth: 'ok', why: '案内と介助は、研修を受けた見習いも行えます。' },
      { id: 'd', label: '構内の信号設備の切替操作を行う', truth: 'ng', why: '信号設備の操作は、資格者のみです。' },
      { id: 'e', label: 'ホームで人が線路に落ちそうなとき、非常停止ボタンを押す', truth: 'ok', why: '非常停止ボタンは、誰でも、危険と感じたら押します。押した後の報告が必須です。' }
    ]
  }, 'hoshino', ['全問正解。非常停止ボタンの判断が、特に確かでした。', '一部ずれました。運転に関わる指示は、必ず有資格者へ。', '線の位置が、まだ掴めていませんね。立ち会うのと、手を出すのは別です。'], [[ev('safety', 3)], [ev('safety', 1)], [ev('safety', -2)]], 'ch10.st_sort_intro', SV(['hoshino'], '10:00 海浜口駅'));
  line('ch10.st_sort_intro', [['hoshino', '窓口です。用件を聞いたら、まず「運転に関わるか」を考えてください。']], 'ch10.st_sort_task', { view: SV(['hoshino'], '10:20 海浜口駅 窓口') });
  mk('ch10.st_sort_task', 'sort', '窓口の用件の振り分け', '用件を聞いて、正しい対応先に振り分けます。', {
    config: { perItem: 8, bins: [{ id: 'now', label: 'その場で対応' }, { id: 'asst', label: '助役へ相談' }, { id: 'cmd', label: '運転の指令へ連絡' }], items: [
      { id: 'a', label: '「定期券の更新はどこでできますか」', bin: 'now', why: '場所の案内は、その場で足ります。' },
      { id: 'b', label: '「この券売機、お金を入れても反応しない」', bin: 'asst', why: '設備の不具合は、助役へ。' },
      { id: 'c', label: '「ホームで、気分の悪い人がいる」', bin: 'asst', why: '急病の対応は、助役と連携します。' },
      { id: 'd', label: '「線路に何か落ちているのが見えた」', bin: 'cmd', why: '線路上の異常は、運転に関わるため、指令に連絡します。' },
      { id: 'e', label: '「忘れ物をしたかもしれない」', bin: 'now', why: '台帳の案内は、その場で対応できます。' }
    ] }
  }, 'hoshino', ['全部正解。駅員として、安心して任せられます。', 'ほぼ合っています。線路の話は、必ず指令へ。', '振り分けが、かなりずれました。「運転に関わるか」を、最初に。'], [[ev('service', 3), ev('accuracy', 2)], [ev('service', 1)], [ev('accuracy', -1)]], 'ch10.st_lunch', SV(['hoshino'], '11:30 窓口'));
  line('ch10.st_lunch', [
    '休憩室の窓際に、古い観葉植物が一鉢。葉が、きれいに拭かれている。',
    ['hoshino', '私が来た年からあります。誰が拭いているのか、実は、知りません。', 'smile'],
    ['player', '…青嶺中央では、久保田さんが、始発前に券紙を替えています。'],
    ['hoshino', '見えない仕事に気づく人が、強い。本人には、言いましたか。']
  ], 'ch10.st_d1end', { effects: [at(12, 0)], view: SV(['hoshino'], '12:00 海浜口駅 休憩室') });
  line('ch10.st_d1end', [['hoshino', '明日は、少し難しい話です。体を休めて、九時に。']], 'ch10.st_d2', { effects: [at(17, 0), tl('12月7日 他駅での実習 初日を終える')], view: SV(['hoshino'], '17:00 海浜口駅') });
  line('ch10.st_d2', [
    '二日目。ホームの霜が、朝日で溶けて、線路が光っている。',
    ['hoshino', '今日は異常時の訓練です。想定なので、安心を。まず、見守りから。']
  ], 'ch10.st_watch_task', { effects: [day(1), at(9, 0)], view: SV(['hoshino'], '12月8日（水） 9:00 海浜口駅') });
  mk('ch10.st_watch_task', 'watch', 'ホームの見守り', '黄色い線に近づく人をタップして、声をかけます。', { config: { total: 10 } }, 'hoshino', ['十人とも、声が届いた。見る目が、広い。', '数人、線を越えました。視線を、もう少し遠くへ。', '危ない場面がいくつも。全体を見る練習を、もう一度。'], [[ev('safety', 4)], [ev('safety', 1)], [ev('safety', -2)]], 'ch10.st_route_intro', SV(['hoshino'], '10:30 ホーム'));
  line('ch10.st_route_intro', [['hoshino', '運転見合わせの想定です。案内所を経由して、バス乗り場へ。']], 'ch10.st_route_task', { view: SV(['hoshino'], '11:00 海浜口駅') });
  mk('ch10.st_route_task', 'route', '代替経路の案内', '起点から着点まで、階段（黒）を避け、案内所（I）に立ち寄る経路をつなぎます。', {
    config: { grid: ['S...#....', '.##.#.##.', '..I...~.G', '.#####.#.', '.........'], must: ['I'], best: 0, legend: { '#': '階段・壁（通れない）', '~': '混雑した通路（遅い）', I: '案内所（立ち寄る）', S: '起点', G: 'バス乗り場' } }
  }, 'hoshino', ['無理のない道です。案内所に寄るのも、正しい順でした。', '着きましたが、遠回りでした。最短も覚えておいて。', '案内所を飛ばすと、最新の情報を渡せません。確認が先です。'], [[ev('service', 3), ev('accuracy', 2)], [ev('service', 1)], [ev('accuracy', -1)]], 'ch10.st_drill', SV(['hoshino'], '11:40 海浜口駅'));
  line('ch10.st_drill', [
    '午後一時。拡声器が、ブツッ、と鳴った。',
    ['hoshino', '（拡声器）想定、開始。ホームでお客様が倒れました。私は事務室。見習いが、最初の判断を。'],
    ['hoshino', '（拡声器）許されるのは、声かけ、人を呼ぶ、非常停止ボタン、介助。列車を止める指示は、許されません。']
  ], 'ch10.st_drill_choice', { effects: [at(13, 0)], view: SV(['hoshino'], '13:00 海浜口駅 ホーム（訓練）') });
  choice('ch10.st_drill_choice', '訓練です。ホームで人が倒れました。最初の一手は？', [
    opt('button', '非常停止ボタンを押し、助役へ第一報', 'ch10.st_c_button', { tone: 'quick', effects: [set('ch10.st_button'), ev('safety', 2)] }),
    opt('call', '周りに声をかけて人手を集め、助役への連絡を頼み、付き添う', 'ch10.st_c_call', { tone: 'caring', effects: [set('ch10.st_call'), ev('teamwork', 2)] }),
    opt('care', '側に付き添い、近くの人にボタンを頼む', 'ch10.st_c_care', { tone: 'honest', effects: [set('ch10.st_care'), ev('service', 2)] })
  ], { important: true, view: SV(['hoshino'], '13:05 ホーム（訓練）') });
  line('ch10.st_c_button', [
    '赤いボタンを叩く。ブザーが、ホームの端まで走った。',
    ['hoshino', '正解。ただ、押した後も、人を一人にしない。迷わず押すのは、見習いにも許された、数少ない近道です。', 'smile']
  ], 'ch10.st_d2end', { view: SV(['hoshino'], '13:30 ホーム（訓練）') });
  line('ch10.st_c_call', [
    ['player', 'そこの方、助役への連絡を。あなたはAEDを。私は付き添います。'],
    '若手たちが、一斉に動く。声を出すと、場が変わる。'
  ], 'ch10.st_d2end', { view: SV(['hoshino'], '13:30 ホーム（訓練）') });
  line('ch10.st_c_care', [
    ['player', '聞こえますか。ここにいます。そこの方、赤いボタンを！'],
    '倒れた「お客様」の手を握る。握り返された気がした。演技かもしれない。',
    ['hoshino', '「一人で抱えない」。三日間の宿題です。', 'smile']
  ], 'ch10.st_d2end', { view: SV(['hoshino'], '13:30 ホーム（訓練）') });
  line('ch10.st_d2end', [
    '倒れ役の若手が、笑って手を振る。'
  ], 'ch10.st_d3', { effects: [at(17, 0), tl('12月8日 他駅での実習 二日目を終える')], view: SV(['hoshino'], '17:00 海浜口駅') });
  line('ch10.st_d3', [
    '三日目。机に、白紙の引継ぎ書が一枚。',
    ['hoshino', '駅は、人が代わっても続きます。頭の中でなく、紙に残す。駅務の最高の技術です。']
  ], 'ch10.st_hand_task', { effects: [day(1), at(9, 0)], view: SV(['hoshino'], '12月9日（木） 9:00 海浜口駅') });
  mk('ch10.st_hand_task', 'compose', '実習の引継ぎ書', '見たこと・持ち帰る提案・確かめ方を組み立てます。', {
    slots: [
      { id: 'fact', label: '見たこと（事実）', options: [{ id: 'f1', text: '海浜口駅では、窓口の用件を、運転に関わるかどうかで先に振り分けていました。', good: true, why: '観察した事実が、具体的です。' }, { id: 'f2', text: '海浜口駅の人は、みんな親切でした。', good: false, why: '感想で、持ち帰る事実がありません。' }, { id: 'f3', text: '海浜口駅は、うちより進んでいます。', good: false, why: '比較だけで、根拠が見えません。' }] },
      { id: 'plan', label: '持ち帰る提案', options: [{ id: 'p1', text: '青嶺中央駅でも、用件を「運転に関わるか」で最初に分ける短い表を、試したいです。', good: true, why: '小さく試せる提案です。' }, { id: 'p2', text: '海浜口駅のやり方を、すべて取り入れてください。', good: false, why: '駅の事情の違いを、無視しています。' }, { id: 'p3', text: '私が、すぐ窓口の運用を変えます。', good: false, why: '見習いが運用を変えることはできません。' }] },
      { id: 'check', label: '確かめ方', options: [{ id: 'c1', text: '一か月後に、応対の迷いが減ったかを、久保田さんに聞いて確かめます。', good: true, why: '確かめる人と時期が決まっています。' }, { id: 'c2', text: '特に確かめません。', good: false, why: '確認のない提案は、改善になりません。' }, { id: 'c3', text: '自分の感覚で判断します。', good: false, why: '感覚だけでは、確認になりません。' }] }
    ]
  }, 'hoshino', ['そのまま朝礼で共有できます。助役の書き方です。', '大筋は合っています。提案の根拠を、事実に結んで。', '感想が中心でした。見たこと、試すこと、確かめ方の順で。'], [[ev('reporting', 3), ev('accuracy', 2)], [ev('reporting', 1)], [ev('reporting', -1)]], 'ch10.st_talk', SV(['hoshino'], '11:30 海浜口駅'));
  branch('ch10.st_talk', [[F('ch10.st_hand_task_ok'), 'ch10.st_talk_a']], 'ch10.st_talk_b');
  line('ch10.st_talk_a', [
    ['hoshino', '事実から始まり、小さな提案で終わっている。助役に求められる書き方です。', 'smile']
  ], 'ch10.st_talk_x', { view: SV(['hoshino'], '14:00 海浜口駅') });
  line('ch10.st_talk_b', [
    ['hoshino', '引継ぎ書は、あと一歩。ただ、訓練の動きは一人前でした。紙は、これから伸ばせます。', 'smile']
  ], 'ch10.st_talk_x', { view: SV(['hoshino'], '14:00 海浜口駅') });
  branch('ch10.st_talk_x', [[F('ch10.st_button'), 'ch10.st_tx_b'], [F('ch10.st_call'), 'ch10.st_tx_c']], 'ch10.st_tx_k');
  line('ch10.st_tx_b', [['hoshino', '真っ先にボタンを押した件、駅員全員の前で話していいですか。「迷わず押す」の手本に。', 'smile']], 'ch10.st_return', { view: SV(['hoshino'], '14:30') });
  line('ch10.st_tx_c', [['hoshino', '周りを動かした場面、若手が真似したがっていました。声の出し方は、才能ではありません。', 'smile']], 'ch10.st_return', { view: SV(['hoshino'], '14:30') });
  line('ch10.st_tx_k', [['hoshino', '付き添いを選んだ優しさは、駅の財産です。次は、それを守る人手も、先に呼べるように。']], 'ch10.st_return', { view: SV(['hoshino'], '14:30') });
  line('ch10.st_return', [
    ['hoshino', '腕章を。三日間、線を守りました。それが一番の合格点です。'],
    '水色の布を畳んで渡す。肩が、少し軽くなった。',
    ['hoshino', '人事が、オンラインで待っています。']
  ], 'ch10.st_vjd', { effects: [sk('station', 3), set('ch10.st_done'), tl('12月9日 上級駅務の三日間を修了する')], view: SV(['hoshino'], '15:30 海浜口駅') });
  fx('ch10.st_vjd', [], 'ch10.jd_open');

  // ----------- dispatch：指令所での実習（浜口・水無瀬）。扉の外から見る -----------
  const PV = (who, cap) => v25('office', who, cap);
  line('ch10.in_dispatch', [
    '指令所の自動扉の手前に、白線が一本。その先は、この三日間、一歩も踏めない。',
    ['hamaguchi', '線の内側は、資格者だけだ。お前の席は、扉の外の椅子。'],
    ['minase', '膝に記録用紙を。聞こえたことを、聞こえたままに。', 'smile'],
    '灰色の腕章。白い糸で「見習・監督下」。',
    ['hamaguchi', '指令は、「動かさない勇気」と「動かす責任」の仕事だ。外から、見ろ。']
  ], 'ch10.ds_plan', { effects: [at(9, 0), set('ch10.route_dispatch')], view: PV(['hamaguchi', 'minase'], '12月7日（火） 9:00 輸送指令所 入口') });
  branch('ch10.ds_plan', [[F('ch6.plan_cert'), 'ch10.ds_pc'], [F('ch6.plan_ojt'), 'ch10.ds_po']], 'ch10.ds_wall');
  line('ch10.ds_pc', [['hamaguchi', '資格を先に、の計画だったな。指令は、それが唯一の入口だ。']], 'ch10.ds_wall', { view: PV(['hamaguchi'], '9:20') });
  line('ch10.ds_po', [['hamaguchi', '現場で覚える計画か。指令は、現場で覚える場所じゃない。聞いて、書いて、座学で体系にする。順番だ。']], 'ch10.ds_wall', { view: PV(['hamaguchi'], '9:20') });
  line('ch10.ds_wall', [
    ['minase', '運転整理は、列車の順番や行き先を変える、重い判断です。資格のある指令員が行います。'],
    ['hamaguchi', '見習いが、回線に出て運転士に指示する。ありえん。ありえない事を、先に言葉にしろ。']
  ], 'ch10.ds_zone_task', { view: PV(['minase', 'hamaguchi'], '9:40 輸送指令所 入口') });
  mk('ch10.ds_zone_task', 'checklist', '指令所の作業区分（見習いの壁）', '見習いにできる作業か、有資格者のみの作業かを判定します。', {
    config: { labels: checklistLabels }, items: [
      { id: 'a', label: '指令員の電話を、扉の外のスピーカーで聞き、記録用紙に書き取る', truth: 'ok', why: '聞き取りと記録は、見習いの基本業務です。' },
      { id: 'b', label: '運転士に、運転整理の指示を回線で伝える', truth: 'ng', why: '運転整理の指示は、資格のある指令員だけです。' },
      { id: 'c', label: '模擬盤で、監督下に、迂回の案を机上で組み立てる', truth: 'ok', why: '机上の模擬は、見習いも行える学びの場です。' },
      { id: 'd', label: '駅の係員に、運転再開の見込み時刻を自分の判断で伝える', truth: 'ng', why: '見込みの伝達は、指令員の責任です。' },
      { id: 'e', label: '指令員の復唱の内容を、あとで声に出して再確認する', truth: 'ok', why: '復唱の再確認は、見習いの練習です。' }
    ]
  }, 'minase', ['全問正解です。扉の外から見る意味が、分かっていますね。', '数問ずれました。見込みを伝えるのは、指令員の責任です。', '壁を軽く見ていませんか。壁は、お客様も守っています。'], [[ev('safety', 3)], [ev('safety', 1)], [ev('safety', -2)]], 'ch10.ds_mem_intro', PV(['minase'], '10:00 輸送指令所'));
  line('ch10.ds_mem_intro', [['minase', '列車番号と時刻は、一番間違えやすい数字です。聞いて、すぐ書いて。']], 'ch10.ds_mem_task', { view: PV(['minase'], '10:20 扉の外の椅子') });
  mk('ch10.ds_mem_task', 'memory', '復唱の聞き取り', '指令員の復唱で聞こえた内容を覚えて、同じ順に報告します。', {
    config: { sequence: ['臨九号', '八分遅れ', '五分で再開', '確定ではない'], pool: ['臨九号', '急三号', '八分遅れ', '十分遅れ', '五分で再開', '十分で再開', '確定ではない', '確定'], showMs: 4600, showLabel: '聞こえた復唱' }
  }, 'minase', ['そのまま書けています。見込みを、確定にしませんでしたね。', '一語ずれました。見込みと確定は、特に正確に。', '見込みが確定に化けていました。指令では、それが一番怖い。'], [[ev('accuracy', 3), ev('reporting', 2)], [ev('accuracy', 1)], [ev('reporting', -2)]], 'ch10.ds_lunch', PV(['minase'], '11:30 扉の外'));
  line('ch10.ds_lunch', [
    '休憩室に窓はない。壁に、折り紙の雪だるま。誰かが、季節だけは持ち込んでいる。',
    ['minase', '夜勤の翌日は、必ず休み。眠らないと、いい判断ができないので。', 'smile'],
    ['minase', '扉の外から見えるのは、その前。静かで、地味で。仕事の九割です。']
  ], 'ch10.ds_d1end', { effects: [at(12, 0)], view: PV(['minase'], '12:00 指令所 休憩室') });
  line('ch10.ds_d1end', [['hamaguchi', '今日は、ここまで。明日は強風だそうだ。体を休めておけ。']], 'ch10.ds_d2', { effects: [at(17, 0), tl('12月7日 指令所での実習 初日を終える')], view: PV(['hamaguchi'], '17:00 輸送指令所') });
  line('ch10.ds_d2', [
    '二日目。朝から、窓を風が叩く。指令所の空気が、少し硬い。'
  ], 'ch10.ds_sort_task', { effects: [day(1), at(9, 0)], view: PV(['hamaguchi', 'minase'], '12月8日（水） 9:00 輸送指令所') });
  mk('ch10.ds_sort_task', 'sort', '情報の仕分け', '入ってくる情報を、「確定」「見込み」「未確認」に仕分けます。', {
    config: { perItem: 8, bins: [{ id: 'fix', label: '確定' }, { id: 'est', label: '見込み' }, { id: 'unk', label: '未確認' }], items: [
      { id: 'a', label: '「臨九号は、八分遅れで、現在、踏切の手前に停車中」', bin: 'fix', why: '遅れと停車位置は、確認済みの事実です。' },
      { id: 'b', label: '「再開は、あと五分ほどの見込み」', bin: 'est', why: '再開の時刻は、見込みです。' },
      { id: 'c', label: '「踏切で何かあったらしい、と駅員が聞いた」', bin: 'unk', why: '伝聞は、確認が取れるまで未確認です。' },
      { id: 'd', label: '「強風の測定値は、秒速二十五メートル」', bin: 'fix', why: '測定値は、確定情報です。' },
      { id: 'e', label: '「風は、午後にはおさまりそう」', bin: 'est', why: '予想は、見込みです。' }
    ] }
  }, 'minase', ['三つに、きれいに分けましたね。浜口さんが、聞いたら喜びます。', 'ほぼ合っています。伝聞は、必ず「未確認」に。', '確定と見込みが混ざりました。ここが、指令の分かれ目です。'], [[ev('reporting', 3), ev('accuracy', 3)], [ev('reporting', 1)], [ev('reporting', -2)]], 'ch10.ds_route_task_intro', PV(['minase'], '10:30 模擬盤の前'));
  line('ch10.ds_route_task_intro', [['minase', '橋が止まった想定で、迂回案を一つ。案は出せても、採用は資格者です。']], 'ch10.ds_route_task', { view: PV(['minase'], '11:00 模擬盤') });
  mk('ch10.ds_route_task', 'route', '迂回案の組み立て（模擬盤）', '橋（黒）を避け、折返し駅（I）に立ち寄る経路をつなぎます。', {
    config: { grid: ['S...#....', '.##.#.##.', '..I...~.G', '.#####.#.', '.........'], must: ['I'], best: 0, legend: { '#': '橋・通行止め（通れない）', '~': '混雑区間（遅い）', I: '折返し駅（立ち寄る）', S: '起点', G: '終点' } }
  }, 'minase', ['無理のない迂回です。折返し駅の順も、正しい。', 'つながりましたが、遠回りです。時間の損失も、考えて。', '折返し駅を飛ばしています。運用上、必ず通る場所です。'], [[ev('accuracy', 3), ev('safety', 2)], [ev('accuracy', 1)], [ev('accuracy', -1)]], 'ch10.ds_wall2', PV(['minase'], '11:40 模擬盤'));
  line('ch10.ds_wall2', [
    '午後一時。強風の運転規制が、本当に入った。扉の向こうが、静かに動き出す。',
    ['hamaguchi', '（スピーカー越しに）{player}、聞こえるな。今の一報、駅に流す前に、一つだけ足すなら何だ。']
  ], 'ch10.ds_choice', { effects: [at(13, 0)], view: PV(['hamaguchi', 'minase'], '13:00 輸送指令所 扉の外') });
  choice('ch10.ds_choice', '強風の一報に、あと一つ足すなら？', [
    opt('time', '次の連絡の時刻', 'ch10.ds_c_time', { tone: 'careful', effects: [set('ch10.ds_time'), ev('reporting', 2)] }),
    opt('split', '確定と見込みを分ける一文', 'ch10.ds_c_split', { tone: 'honest', effects: [set('ch10.ds_split'), ev('accuracy', 2)] }),
    opt('action', '駅への具体的な行動の指示', 'ch10.ds_c_action', { tone: 'caring', effects: [set('ch10.ds_action'), ev('service', 2)] })
  ], { important: true, view: PV(['hamaguchi'], '13:10 輸送指令所 扉の外') });
  line('ch10.ds_c_time', [
    ['player', '情報がないと、駅は何も言えません。次がいつか分かれば、案内を続けられます。'],
    ['hamaguchi', '中身より、「いつ来るか」が安心になる時がある。…守れる時刻を約束しろ。', 'smile']
  ], 'ch10.ds_d2end', { view: PV(['hamaguchi', 'minase'], '13:30 輸送指令所') });
  line('ch10.ds_c_split', [
    ['player', '「確定、強風で速度規制。見込み、解除は十四時以降」と、分けます。'],
    ['hamaguchi', '…それだ。俺が何年、言い続けてると思ってる。']
  ], 'ch10.ds_d2end', { view: PV(['hamaguchi', 'minase'], '13:30 輸送指令所') });
  line('ch10.ds_c_action', [
    ['player', '「ホームで待機を」「階段の混雑に注意を」と、行動を。'],
    ['hamaguchi', '現場の目だな。だが、指令は、駅の仕事に指示を出しすぎん。'],
    ['minase', '駅から来た人の視点は、指令にも必要です。役割の線だけ、覚えて。', 'smile']
  ], 'ch10.ds_d2end', { view: PV(['hamaguchi', 'minase'], '13:30 輸送指令所') });
  line('ch10.ds_d2end', [
    '規制は、十五時過ぎに解除された。最後の一報が、淡々と読み上げられる。'
  ], 'ch10.ds_d3', { effects: [at(17, 0), tl('12月8日 指令所での実習 二日目を終える')], view: PV(['minase'], '17:00 輸送指令所') });
  line('ch10.ds_d3', [
    '三日目。浜口が、赤ペンを一本、机に置いた。',
    ['hamaguchi', '今日は、お前が赤を入れる側だ。引継ぎは、一文字で次の判断が狂う。'],
    ['hamaguchi', '…昔、俺が「たぶん大丈夫」と書いた日がある。それ以上は、言わん。']
  ], 'ch10.ds_hand_task', { effects: [day(1), at(9, 0)], view: PV(['hamaguchi'], '12月9日（木） 9:00 輸送指令所') });
  mk('ch10.ds_hand_task', 'checklist', '引継ぎ記録の確認', '各項目が、引継ぎ記録として適切か、不備があるかを判定します。', {
    config: { labels: ['記載は適切', '不備がある'] }, items: [
      { id: 'a', label: '「臨九号は、見込み五分で再開」とだけあり、確定した遅れの時間がない', truth: 'ng', why: '確定した事実が欠けています。見込みだけでは、引継ぎになりません。' },
      { id: 'b', label: '強風規制の解除時刻と、連絡した駅の名前が、そろっている', truth: 'ok', why: '時刻と連絡先があれば、追跡できます。' },
      { id: 'c', label: '備考欄に「たぶん大丈夫」と書かれている', truth: 'ng', why: '曖昧な表現は、引継ぎで最も避けるべきです。' },
      { id: 'd', label: '列車番号が、記録の冒頭と末尾で違っている', truth: 'ng', why: '番号の不一致は、重大な不備です。' },
      { id: 'e', label: '記録の最後に、記録者の名前と記入時刻がある', truth: 'ok', why: '誰がいつ書いたか分かれば、確認できます。' }
    ]
  }, 'hamaguchi', ['全部拾ったな。…「たぶん」を、一番に見つけたな。', '二つ。番号の不一致は、必ず見ろ。', '引継ぎは、読む人の命綱だ。一文字ずつだ。'], [[ev('accuracy', 4), ev('reporting', 2)], [ev('accuracy', 1)], [ev('accuracy', -2)]], 'ch10.ds_talk', PV(['hamaguchi'], '11:00 輸送指令所'));
  branch('ch10.ds_talk', [[ALL(F('ch10.ds_mem_task_ok'), F('ch10.ds_hand_task_ok')), 'ch10.ds_talk_a'], [ANY(F('ch10.ds_mem_task_ok'), F('ch10.ds_hand_task_ok'), F('ch10.ds_sort_task_ok')), 'ch10.ds_talk_b']], 'ch10.ds_talk_c');
  line('ch10.ds_talk_a', [
    ['hamaguchi', '三日、扉の外のお前を見ていた。書き取りも引継ぎも、一文字ずつ丁寧だった。', 'smile'],
    ['hamaguchi', '指令員は才能より癖でできている。「分ける」癖が、もうある。']
  ], 'ch10.ds_talk_x', { view: PV(['hamaguchi'], '14:00 輸送指令所') });
  line('ch10.ds_talk_b', [
    ['hamaguchi', '得意と苦手が、はっきり出た。苦手を隠すな。「できません、確認します」と言える奴が、強い。']
  ], 'ch10.ds_talk_x', { view: PV(['hamaguchi'], '14:00 輸送指令所') });
  line('ch10.ds_talk_c', [
    ['hamaguchi', '扉の中は、まだ遠い。', 'serious'],
    ['hamaguchi', 'だが、一度も線を越えなかった。越えたがる奴を、指令は置けん。']
  ], 'ch10.ds_talk_x', { view: PV(['hamaguchi'], '14:00 輸送指令所') });
  branch('ch10.ds_talk_x', [[F('ch10.ds_time'), 'ch10.ds_tx_t'], [F('ch10.ds_split'), 'ch10.ds_tx_s']], 'ch10.ds_tx_a');
  line('ch10.ds_tx_t', [['minase', '「次の連絡の時刻」。手順書に、一行足したいと思います。現場を安心させる視点でした。', 'smile']], 'ch10.ds_return', { view: PV(['minase'], '14:30') });
  line('ch10.ds_tx_s', [['minase', '「確定と見込みを分ける」。浜口さん、嬉しそうでした。あの人が顔に出すのは、滅多にないんです。', 'smile']], 'ch10.ds_return', { view: PV(['minase'], '14:30') });
  line('ch10.ds_tx_a', [['minase', '駅の行動を挙げた視点は、指令にも要ります。役割の線は、忘れずに。']], 'ch10.ds_return', { view: PV(['minase'], '14:30') });
  line('ch10.ds_return', [
    ['hamaguchi', '腕章を返せ。扉の外の椅子に、よく座った。それが一番難しい仕事だ。'],
    '灰色の布を畳んで渡す。扉の向こうで、電話が鳴った。いつもと同じ音が、少し違って聞こえた。',
    ['minase', '人事が、オンラインで待っています。']
  ], 'ch10.ds_vjd', { effects: [sk('dispatch', 3), set('ch10.ds_done'), tl('12月9日 指令所での三日間を修了する')], view: PV(['hamaguchi', 'minase'], '15:30 輸送指令所') });
  fx('ch10.ds_vjd', [], 'ch10.jd_open');

  // ----------- planning：企画部署での実習（戸田・黒田）。資料と会議 -----------
  const LV = (who, cap) => v25('hr', who, cap);
  line('ch10.in_planning', [
    'コピー機が、ガガガ、と唸っている。窓のない会議室は、紙とトナーの匂いがした。',
    ['toda', '三日間、資料と会議を見ます。見習いは、会議ではオブザーバー。発言は、求められたときだけ。'],
    '薄い緑の名札。紙の厚みで、「オブザーバー」と読める。',
    ['toda', '企画は、数字と人の事情の通訳です。通訳が、話を作ってはいけません。']
  ], 'ch10.pl_plan', { effects: [at(9, 0), set('ch10.route_planning')], view: LV(['toda', 'kuroda'], '12月7日（火） 9:00 本社 輸送計画課') });
  branch('ch10.pl_plan', [[F('ch6.plan_cert'), 'ch10.pl_pc'], [F('ch6.plan_ojt'), 'ch10.pl_po']], 'ch10.pl_wall');
  line('ch10.pl_pc', [['toda', '資格を先に、の計画でしたね。企画は資格より実績ですが、堅実な順番です。']], 'ch10.pl_wall', { view: LV(['toda'], '9:20') });
  line('ch10.pl_po', [['toda', '現場で覚える計画でしたね。企画は、現場の経験が資料の質を決めます。ただ、決裁は順番に積み上がります。']], 'ch10.pl_wall', { view: LV(['toda'], '9:20') });
  line('ch10.pl_wall', [
    ['toda', '企画の壁は、資格でなく、承認です。出典が揃い、私の確認を経て、初めて外に出ます。'],
    ['kuroda', '外に出る資料と、内輪の下書きは別物です。一つずつ。']
  ], 'ch10.pl_zone_task', { view: LV(['toda', 'kuroda'], '9:40 輸送計画課') });
  mk('ch10.pl_zone_task', 'checklist', '資料作成の権限の確認（見習いの壁）', '見習いが下書きとして行える作業か、承認が必要な作業かを判定します。', {
    config: { labels: ['見習いが、下書きとして行える', '承認が必要（見習いは不可）'] }, items: [
      { id: 'a', label: '集計表の下書きを作り、課長補佐の確認を受ける', truth: 'ok', why: '下書きは、見習いの基本業務です。' },
      { id: 'b', label: '作った資料を、確認なしで他部署へ送る', truth: 'ng', why: '外部へ出る資料は、承認が必要です。' },
      { id: 'c', label: '出典のわからない数字を、「確かだと思う」として資料に載せる', truth: 'ng', why: '出典のない数字は、載せられません。' },
      { id: 'd', label: '会議の議事の要点をメモし、確認を受けて共有する', truth: 'ok', why: '議事メモは、見習いが担える重要な業務です。' },
      { id: 'e', label: 'ダイヤ案の内容を、確定した案として現場に伝える', truth: 'ng', why: '案は、確定するまで案です。' }
    ]
  }, 'kuroda', ['全部合ってます。壁、ちゃんと読めてる。', '一部ずれました。「確定するまで案」。これ、忘れると事故ります。', '承認の壁、軽く見てませんか。出た資料は、取り消せません。'], [[ev('reporting', 3)], [ev('reporting', 1)], [ev('reporting', -2)]], 'ch10.pl_comp_intro', LV(['kuroda'], '10:00 輸送計画課'));
  line('ch10.pl_comp_intro', [['toda', '年末の臨時増発の資料、骨子を。「何を決めてほしいか」から書くのが、礼儀です。']], 'ch10.pl_comp_task', { view: LV(['toda'], '10:20 輸送計画課') });
  mk('ch10.pl_comp_task', 'compose', '会議資料の骨子づくり', '決めてほしいこと、根拠、お願いを組み立てます。', {
    slots: [
      { id: 'ask', label: '決めてほしいこと', options: [{ id: 'a1', text: '年末の十二月二十七日から三十日に、夕方の臨時増発を一本、試験的に実施するかを、決めていただきたいです。', good: true, why: '決める対象と期間が、具体的です。' }, { id: 'a2', text: '年末は混むので、何とかしてください。', good: false, why: '決める対象が不明確です。' }, { id: 'a3', text: '増発することにしました。', good: false, why: '見習いが、決定を宣言することはできません。' }] },
      { id: 'basis', label: '根拠', options: [{ id: 'b1', text: '昨年の同期間の改札通過数（出典：駅務集計）と、ホームの待ち行列の写しを添付します。', good: true, why: '出典のある数字と現場の事実が揃っています。' }, { id: 'b2', text: '現場の感覚で、混みそうです。', good: false, why: '感覚だけでは根拠になりません。' }, { id: 'b3', text: '他社も増発しているようです。', good: false, why: '出典がなく、自社の事情とも結びつきません。' }] },
      { id: 'req', label: 'お願い', options: [{ id: 'r1', text: '決定の期限を十二月二十日とさせてください。それまでに確認が必要な点は、お知らせください。', good: true, why: '期限と確認の窓口が、明確です。' }, { id: 'r2', text: 'できるだけ早く、お願いします。', good: false, why: '期限が曖昧です。' }, { id: 'r3', text: '特に、お願いはありません。', good: false, why: '決める人に動いてもらう一文がありません。' }] }
    ]
  }, 'toda', ['そのまま会議に出せます。一番上が「何を決めるか」なのが、いい。', '大筋は合っています。出典を、もう一度。', '決める人の席で読み直して。「何を決めれば？」が見えない紙は、読まれません。'], [[ev('reporting', 4), ev('accuracy', 2), sk('planning', 3)], [ev('reporting', 1)], [ev('reporting', -2)]], 'ch10.pl_lunch', LV(['toda'], '11:40 輸送計画課'));
  line('ch10.pl_lunch', [
    '正午。戸田が、ふいに立ち上がった。「食堂へ。席を離れるのが、この課の不文律です」。',
    ['kuroda', '新人の頃、破って三日、同じ数字を見続けて、同じ誤りを見逃しました。'],
    ['toda', '計画課の机から見える景色と、ホームの景色は違います。…ホーム、恋しいですよ。時々。', 'smile']
  ], 'ch10.pl_d1end', { effects: [at(12, 0)], view: LV(['toda', 'kuroda'], '12:00 本社 食堂') });
  line('ch10.pl_d1end', [['kuroda', '明日は会議です。疲れますよ。寝て、来てください。']], 'ch10.pl_d2', { effects: [at(17, 0), tl('12月7日 企画部署での実習 初日を終える')], view: LV(['kuroda'], '17:00 輸送計画課') });
  line('ch10.pl_d2', [
    '二日目。小会議室の机に、資料が一部ずつ並ぶ。ホチキスの針が、一つ、傾いている。',
    ['toda', 'ダイヤ修正案の会議です。計画、運転、駅営業の代表が来ます。あなたは、聞く席。']
  ], 'ch10.pl_mem_task', { effects: [day(1), at(9, 0)], view: LV(['toda'], '12月8日（水） 9:00 本社 小会議室') });
  mk('ch10.pl_mem_task', 'memory', '会議の要点の記録', '会議の要点を覚えて、同じ順に報告します。', {
    config: { sequence: ['折返し五分', '清掃時間', '運転課の懸念', '十二月二十日'], pool: ['折返し五分', '折返し三分', '清掃時間', '点検時間', '運転課の懸念', '駅営業課の要望', '十二月二十日', '十二月二十七日'], showMs: 4800, showLabel: '会議の議事（要点）' }
  }, 'kuroda', ['順番も数字も合ってる。議事の骨が、見えてます。', '一つ抜けました。「誰が、いつまでに」が一番大事です。', '要点が混ざってます。議事は、順番と数字が命です。'], [[ev('accuracy', 3), ev('reporting', 2)], [ev('accuracy', 1)], [ev('reporting', -1)]], 'ch10.pl_sort_task_intro', LV(['kuroda'], '10:30 小会議室'));
  line('ch10.pl_sort_task_intro', [['toda', '発言は、事実、推測、要望に分けて聞きます。それが議事の質です。']], 'ch10.pl_sort_task', { view: LV(['toda'], '11:00 小会議室') });
  mk('ch10.pl_sort_task', 'sort', '発言の仕分け', '会議の発言を、「事実」「推測」「要望」に仕分けます。', {
    config: { perItem: 8, bins: [{ id: 'fact', label: '事実' }, { id: 'guess', label: '推測' }, { id: 'req', label: '要望' }], items: [
      { id: 'a', label: '「先月の折返しは、平均で四分四十秒だった」', bin: 'fact', why: '測定された数字は、事実です。' },
      { id: 'b', label: '「年末は、きっと折返しがもっと遅れると思う」', bin: 'guess', why: '「思う」は、推測です。' },
      { id: 'c', label: '「折返しの時間を、あと一分延ばしてほしい」', bin: 'req', why: '「ほしい」は、要望です。' },
      { id: 'd', label: '「清掃は、二人で四分かかっている」', bin: 'fact', why: '実測値は、事実です。' },
      { id: 'e', label: '「駅の人は、たぶん困っているはず」', bin: 'guess', why: '「たぶん」は、推測です。' }
    ] }
  }, 'toda', ['全部分けられました。議事の質が、一段上がります。', 'ほぼ合っています。「思う」「はず」は、推測です。', '事実と推測が混ざりました。会議の記録は、ここが土台です。'], [[ev('accuracy', 3), ev('reporting', 2)], [ev('accuracy', 1)], [ev('accuracy', -1)]], 'ch10.pl_wall2', LV(['toda'], '11:40 小会議室'));
  line('ch10.pl_wall2', [
    '午後一時。運転課の担当者が、折返し時間の短縮を、強く求める。',
    ['kuroda', '（小声で）駅の清掃は五分ぎりぎりのはず。…でも、資料にその数字がない。', 'worry'],
    '議論が一巡し、沈黙が長くなった。',
    ['toda', '{player}さん。現場の方として、一言。無理には求めません。']
  ], 'ch10.pl_choice', { effects: [at(13, 0)], view: LV(['toda', 'kuroda'], '13:00 本社 小会議室') });
  choice('ch10.pl_choice', '会議で、一言を求められました。どう答える？', [
    opt('data', '清掃の実測時間（四分四十秒）を挙げ、数字で話す', 'ch10.pl_c_data', { tone: 'careful', effects: [set('ch10.pl_data'), ev('accuracy', 2), ev('reporting', 1)] }),
    opt('voice', '「現場は五分でもぎりぎりです」と、率直な感触を言う', 'ch10.pl_c_voice', { tone: 'honest', effects: [set('ch10.pl_voice'), ev('service', 2)] }),
    opt('listen', '「今は聞きます。根拠を添えた資料で、後でお出しします」と答える', 'ch10.pl_c_listen', { tone: 'neutral', effects: [set('ch10.pl_listen'), ev('reporting', 2)] })
  ], { important: true, view: LV(['toda'], '13:10 本社 小会議室') });
  line('ch10.pl_c_data', [
    ['player', '先月の駅の記録で、折返しの平均は四分四十秒でした。詰めると、清掃の抜けが出ます。'],
    '部屋が、一瞬静かになった。数字は、事情を、一番短い言葉で運ぶ。',
    ['toda', '出典は駅営業課の記録。運転課の方、次の案に反映できますか。']
  ], 'ch10.pl_d2end', { view: LV(['toda', 'kuroda'], '13:30 小会議室') });
  line('ch10.pl_c_voice', [
    ['player', '現場は、五分でもぎりぎりです。清掃を削ると、車内の印象が変わります。'],
    '空気が少し柔らぐ。「現場の声は、そうですよね」と、誰かが頷いた。',
    ['toda', '率直な感触は、会議に必要です。あとで、数字に直しましょう。一緒に。', 'smile']
  ], 'ch10.pl_d2end', { view: LV(['toda', 'kuroda'], '13:30 小会議室') });
  line('ch10.pl_c_listen', [
    ['player', '今は聞きます。根拠を添えた資料で、後でお出しします。'],
    '聞くことに集中すると、他の人の言葉が、普段よりよく聞こえた。',
    ['toda', '聞くのは遠慮でなく、選択です。会議の後、資料で返して。', 'smile']
  ], 'ch10.pl_d2end', { view: LV(['toda', 'kuroda'], '13:30 小会議室') });
  line('ch10.pl_d2end', [
    '会議は、十分、延びた。結論は、持ち越し。'
  ], 'ch10.pl_d3', { effects: [at(17, 0), tl('12月8日 企画部署での実習 二日目を終える')], view: LV(['toda'], '17:00 輸送計画課') });
  line('ch10.pl_d3', [
    '三日目。黒田が、赤ペンだらけのダイヤ案を、机に広げた。',
    ['kuroda', '課題は「矛盾探し」。仕込みが三つあります。僕が作りました。ちょっと自信作です。']
  ], 'ch10.pl_find_task', { effects: [day(1), at(9, 0)], view: LV(['kuroda', 'toda'], '12月9日（木） 9:00 輸送計画課') });
  mk('ch10.pl_find_task', 'find', 'ダイヤ案の矛盾探し', 'ダイヤ案の矛盾や誤りを、制限時間内に見つけてタップします。', {
    config: { scene: 'concourse', seconds: 40, props: [
      { x: 0.05, y: 0.08, w: 0.9, h: 0.22, c: '#2f5d8a', t: '上り線のダイヤ' }, { x: 0.05, y: 0.36, w: 0.9, h: 0.22, c: '#2f7a56', t: '下り線のダイヤ' }, { x: 0.05, y: 0.64, w: 0.9, h: 0.22, c: '#a35c00', t: '折返しと清掃' }],
    spots: [
      { id: 'time', x: 0.3, y: 0.18, label: '上り線の折返し時刻が、下り線の出発時刻より後になっている' },
      { id: 'unit', x: 0.62, y: 0.46, label: '下り線の所要時間の単位が、分と秒で混ざっている' },
      { id: 'clean', x: 0.78, y: 0.74, label: '清掃時間が三分と書かれている（実測は四分四十秒）' },
      { id: 'ok', x: 0.15, y: 0.5, real: false, label: 'この行は、他の行と整合しています' }] }
  }, 'kuroda', ['全部…！ 自信作だったのに。くそ、嬉しい。', '二つ。単位の混在は見落としやすい。僕もよくやります。', '見落としが多いです。数字を、指で一行ずつ追ってください。'], [[ev('accuracy', 4), ev('reporting', 2), sk('planning', 3)], [ev('accuracy', 1)], [ev('accuracy', -1)]], 'ch10.pl_talk', LV(['kuroda'], '10:40 輸送計画課'));
  branch('ch10.pl_talk', [[ALL(F('ch10.pl_comp_task_ok'), F('ch10.pl_find_task_ok')), 'ch10.pl_talk_a'], [ANY(F('ch10.pl_comp_task_ok'), F('ch10.pl_find_task_ok'), F('ch10.pl_sort_task_ok')), 'ch10.pl_talk_b']], 'ch10.pl_talk_c');
  line('ch10.pl_talk_a', [
    ['toda', '資料も、矛盾探しも、数字に顔がありました。', 'smile'],
    ['toda', '決裁は、時間が運んでくれます。それまでに、どれだけ顔を付けられるか。']
  ], 'ch10.pl_talk_x', { view: LV(['toda'], '14:00 輸送計画課') });
  line('ch10.pl_talk_b', [
    ['toda', '得意と苦手が出ましたね。苦手は、「できません、確認します」と堂々と。それが、信頼です。']
  ], 'ch10.pl_talk_x', { view: LV(['toda'], '14:00 輸送計画課') });
  line('ch10.pl_talk_c', [
    ['toda', 'まだ、資料の世界は届いていません。', 'serious'],
    ['toda', 'ただ、承認の壁を、三日間一度も越えようとしなかった。評価します。']
  ], 'ch10.pl_talk_x', { view: LV(['toda'], '14:00 輸送計画課') });
  branch('ch10.pl_talk_x', [[F('ch10.pl_data'), 'ch10.pl_tx_d'], [F('ch10.pl_voice'), 'ch10.pl_tx_v']], 'ch10.pl_tx_l');
  line('ch10.pl_tx_d', [['kuroda', '清掃の実測値、運転課が次の案に反映するそうです。現場の数字が、資料を動かした瞬間でした。', 'smile']], 'ch10.pl_return', { view: LV(['kuroda'], '14:30') });
  line('ch10.pl_tx_v', [['kuroda', '「五分でもぎりぎり」。あの一言で、空気が変わりました。あとは数字に直せば、完璧です。', 'smile']], 'ch10.pl_return', { view: LV(['kuroda'], '14:30') });
  line('ch10.pl_tx_l', [['kuroda', '聞くのに徹した人が、一番正確に議事を取ってました。資料、楽しみにしてます。', 'smile']], 'ch10.pl_return', { view: LV(['kuroda'], '14:30') });
  line('ch10.pl_return', [
    ['toda', '名札を。座っていることが、一番難しい仕事です。'],
    '薄い緑の名札を外して、渡す。紙の軽さが、手のひらに残った。',
    ['toda', '人事が、オンラインで待っています。']
  ], 'ch10.pl_vjd', { effects: [sk('planning', 3), set('ch10.pl_done'), tl('12月9日 企画部署での三日間を修了する')], view: LV(['toda', 'kuroda'], '15:30 輸送計画課') });
  fx('ch10.pl_vjd', [], 'ch10.jd_open');
}
