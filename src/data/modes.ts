import type { ModeId } from '../engine/types';

export interface ModeDef {
  id: ModeId; name: string; kind: 'story' | 'free'; group: 'rail' | 'road';
  tagline: string; core: string; management: boolean;
  /** playable: プレイ可能な縦断実装あり／unimplemented: 設計のみ（プレイ不可） */
  status: 'playable' | 'unimplemented';
  playableScope?: string;
  seasons?: string;
}

export const MODES: ModeDef[] = [
  { id: 'R1', name: '鉄道運転士ストーリー「最後の定時」', kind: 'story', group: 'rail', tagline: '新人運転士の乗務・技能・職場ドラマ', core: '運転・乗務・点呼・ダイヤ乱れ', management: false, status: 'unimplemented' },
  { id: 'R2', name: '鉄道会社経営「消えゆく路線、残すべき未来」', kind: 'story', group: 'rail', tagline: '輸送計画・財務・設備・組織の経営', core: '予算・収支・ダイヤ改正・設備投資', management: true, status: 'unimplemented' },
  { id: 'R3', name: '運行指令「運行の境界線」', kind: 'story', group: 'rail', tagline: '指令職に専念する長期キャリア', core: '在線表示・ダイヤグラム・車両/乗務員運用', management: false, status: 'unimplemented' },
  { id: 'R4', name: '鉄道フリープレイ', kind: 'free', group: 'rail', tagline: '運転・指令・基地見学・路線編集', core: '自由運転・編集・サンドボックス', management: true, status: 'unimplemented' },
  { id: 'R5', name: '新入社員から会長へ', kind: 'story', group: 'rail', tagline: '多職種を経験する数十年のキャリア', core: '現場体験・人間関係・長期選択', management: false, status: 'unimplemented' },
  { id: 'R6', name: '交差するレール', kind: 'story', group: 'rail', tagline: '複数主人公の群像ミステリー（非暴力）', core: '調査・会話・記録の照合', management: false, status: 'unimplemented' },
  { id: 'R7', name: '配属先は、明日変わる', kind: 'story', group: 'rail', tagline: '部署異動・研修・評価・勤続人生', core: '駅務・勤務表・異動・人間関係', management: false, status: 'playable', playableScope: '第1章「新しい名札」を実装／第2章は冒頭のみ（体験版）。全96章中 2章分（うち1章完成）。', seasons: '8シーズン×12章以上（企画）' },
  { id: 'R8', name: '消えた引継ぎ帳', kind: 'story', group: 'rail', tagline: '職場調査サスペンス（非暴力）', core: '文書の版比較・聞き取り・説明責任', management: false, status: 'unimplemented' },
  { id: 'R9', name: '特急42号の空白', kind: 'story', group: 'rail', tagline: 'タイムライン・ヒューマンミステリー', core: '時刻表照合・証言整理', management: false, status: 'unimplemented' },
  { id: 'R10', name: '白紙の再開発計画', kind: 'story', group: 'rail', tagline: '企業・地域の調整サスペンス', core: '駅前案比較・説明会・合意形成', management: false, status: 'unimplemented' },
  { id: 'R11', name: '改札の向こうの約束', kind: 'story', group: 'rail', tagline: '多世代の長編ヒューマンドラマ', core: '駅の日常・季節イベント・世代交代', management: false, status: 'unimplemented' },
  { id: 'C1', name: 'レーサー「ゼロからのチェッカー」', kind: 'story', group: 'road', tagline: '新人からレース界へ', core: '車両物理・予選・決勝・ピット', management: false, status: 'unimplemented' },
  { id: 'C2', name: 'チーム経営「薄氷のチャンピオン」', kind: 'story', group: 'road', tagline: 'ドライバーを操作しないチーム運営', core: '契約・開発・戦略・シーズン計画', management: true, status: 'unimplemented' },
  { id: 'C3', name: '自動車フリープレイ', kind: 'free', group: 'road', tagline: '自由ドライブ・サーキット・車両研究', core: '改造・セッティング・リプレイ', management: false, status: 'unimplemented' }
];

export const modeById = (id: ModeId) => MODES.find(m => m.id === id)!;
