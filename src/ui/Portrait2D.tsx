import { useId } from 'react';
import type { CharacterDef } from '../engine/types';

/** 会話用の2D人物画（ベクター）。人物データ（性別・年齢・髪・肌・制服・小物）と表情から、陰影・ハイライト・線画つきで描く。 */
type Hair = 'short' | 'side' | 'spiky' | 'bob' | 'ponytail' | 'long' | 'bun' | 'thin' | 'child';
const STYLE: Record<string, { hair: Hair; eye?: string; brow?: number; freckles?: boolean; cheeks?: number }> = {
  player: { hair: 'short', eye: '#3a2a20' }, shiraishi: { hair: 'side', eye: '#2a2018', brow: 1.4 }, kubota: { hair: 'ponytail', eye: '#3a2a20' }, yamashina: { hair: 'spiky', eye: '#2a2430' }, morishita: { hair: 'bob', eye: '#3a2a20' },
  kajiwara: { hair: 'bun', eye: '#4a3a30' }, hamaguchi: { hair: 'short', eye: '#2a2018' }, traveler: { hair: 'long', eye: '#4a3428' }, sakai: { hair: 'ponytail', eye: '#3a2a20' }, hinata: { hair: 'child', eye: '#2a2018', cheeks: 1.6 }, nomura: { hair: 'thin', eye: '#4a3a30' }, haha: { hair: 'bob', eye: '#3a2a20' }, tourist2: { hair: 'short', eye: '#3a5a7a' }
};

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function shade(hex: string, amt: number) { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (c: number) => clamp(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)); return `#${[f(r), f(g), f(b)].map(x => x.toString(16).padStart(2, '0')).join('')}`; }

export function Portrait2D({ def, mood = 'normal', size = 200 }: { def?: CharacterDef; mood?: string; size?: number }) {
  const uid = useId().replace(/:/g, ''); const id = (n: string) => `${n}${uid}`;
  const d = def ?? { id: 'player', name: '', uniform: '#233658', hair: '#2a2018', skin: '#efc9a6', age: 24, gender: 'x', dept: 'station', accessory: 'none' } as unknown as CharacterDef;
  const st = STYLE[d.id] ?? { hair: d.gender === 'f' ? 'bob' : 'short' } as (typeof STYLE)[string];
  const female = d.gender === 'f', child = st.hair === 'child', old = d.age >= 65; const staff = d.dept === 'station' || d.dept === 'dispatch' || d.dept === 'hr' || d.id === 'player';
  const skin = d.skin, skinL = shade(skin, 0.28), skinD = shade(skin, -0.2), skinDD = shade(skin, -0.34), hair = d.hair, hairL = shade(hair, 0.35), hairD = shade(hair, -0.4), uni = d.uniform, uniL = shade(uni, 0.22), uniD = shade(uni, -0.35);
  const ink = '#1b1511'; const eyeC = st.eye ?? '#3a2a20';
  const sc = child ? 0.9 : 1; const cy = child ? 210 : 190;      // 顔の中心
  const happy = mood === 'smile', worry = mood === 'worry', serious = mood === 'serious', surprise = mood === 'surprise';
  // ----- 髪 -----
  const hairBack = (() => {
    switch (st.hair) {
      case 'bob': return <path d="M112 190 C104 92 150 50 200 50 C250 50 296 92 288 190 L292 318 C250 336 150 336 108 318Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".5" strokeWidth="2" />;
      case 'long': return <path d="M108 190 C100 88 150 46 200 46 C250 46 300 88 292 190 C300 260 296 340 286 400 C240 420 160 420 114 400 C104 340 100 260 108 190Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".5" strokeWidth="2" />;
      case 'ponytail': return <g><path d="M262 120 C318 120 336 190 312 270 C304 300 286 318 270 322 C292 270 292 200 250 150Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".5" strokeWidth="2" /><ellipse cx="270" cy="122" rx="13" ry="8" fill="#b02a2a" /></g>;
      case 'bun': return <g><circle cx="200" cy="58" r="30" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".5" strokeWidth="2" /><path d="M180 50 C190 40 210 40 220 50" stroke={hairL} strokeWidth="3" fill="none" opacity=".7" /></g>;
      default: return null;
    }
  })();
  const hairFront = (() => {
    const hl = (p: string) => <path d={p} stroke={hairL} strokeWidth="3" fill="none" opacity=".55" strokeLinecap="round" />;
    switch (st.hair) {
      case 'short': return <g><path d="M126 176 C118 100 156 62 200 62 C246 62 284 100 274 176 C268 146 256 124 238 116 C216 132 178 132 158 114 C142 124 130 148 126 176Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" />{hl('M160 100 C172 84 196 78 214 80')}{hl('M232 96 C246 102 256 116 260 132')}</g>;
      case 'side': return <g><path d="M126 178 C116 98 154 60 202 60 C250 60 286 100 274 178 C270 150 260 128 244 118 C222 108 190 112 160 124 C144 134 132 150 126 178Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" />{hl('M150 108 C170 82 214 76 240 92')}<path d="M164 118 C186 98 220 96 246 112" stroke={ink} strokeOpacity=".35" strokeWidth="2" fill="none" />{old || d.age > 45 ? <g><path d="M126 178 C124 150 130 136 142 126 L146 170Z" fill="#cfcfcf" opacity=".8" /><path d="M274 178 C276 150 270 136 258 126 L254 170Z" fill="#cfcfcf" opacity=".8" /></g> : null}</g>;
      case 'spiky': return <g><path d="M124 178 C112 112 132 74 160 62 L156 38 L180 56 L190 30 L208 54 L228 34 L232 58 L258 46 C278 80 282 130 276 178 C268 150 260 128 240 116 C218 134 176 134 156 114 C142 126 130 150 124 178Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />{hl('M164 90 C176 76 196 68 214 70')}</g>;
      case 'bob': return <g><path d="M120 190 C116 100 154 66 200 66 C248 66 286 100 280 190 C270 160 258 140 240 130 C232 112 214 108 200 108 C184 108 166 112 160 130 C142 140 130 160 120 190Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" />{hl('M150 104 C170 80 220 76 250 96')}</g>;
      case 'ponytail': return <g><path d="M126 176 C118 96 158 62 200 62 C246 62 284 98 274 176 C268 146 254 124 232 118 C214 108 184 110 166 120 C146 132 132 150 126 176Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" />{hl('M156 98 C176 78 214 74 238 90')}</g>;
      case 'long': return <g><path d="M122 200 C112 96 152 58 200 58 C250 58 290 96 278 200 C272 160 258 134 236 122 C214 112 186 114 166 126 C144 138 130 164 122 200Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" />{hl('M150 104 C172 76 224 72 252 96')}{hl('M132 190 C132 230 128 280 132 330')}</g>;
      case 'bun': return <g><path d="M128 178 C122 106 158 74 200 74 C242 74 278 106 272 178 C266 150 254 130 236 122 C214 116 186 116 164 124 C146 134 134 154 128 178Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".5" strokeWidth="2" />{hl('M160 100 C180 86 220 84 244 100')}</g>;
      case 'thin': return <g><path d="M128 190 C122 150 130 128 146 116 L150 160 C140 168 134 180 128 190Z M272 190 C278 150 270 128 254 116 L250 160 C260 168 266 180 272 190Z" fill="#d9d9d4" stroke={ink} strokeOpacity=".35" strokeWidth="1.5" /><path d="M150 100 C170 80 232 80 252 100 C240 94 214 90 200 90 C186 90 164 94 150 100Z" fill="#d9d9d4" opacity=".7" /></g>;
      case 'child': return <g><path d="M128 190 C116 100 150 64 200 64 C250 64 284 100 272 190 C266 156 254 140 238 134 C214 146 176 146 160 134 C146 140 134 160 128 190Z" fill={`url(#${id('hr')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2" />{hl('M156 104 C176 82 224 80 244 104')}</g>;
    }
  })();
  // ----- 目・眉・口 -----
  const eye = (cx: number, flip: number) => {
    const er = child ? 1.18 : 1; const big = surprise ? 1.22 : 1;
    if (happy) return <g key={cx}><path d={`M${cx - 18} ${cy + 0} Q${cx} ${cy - 16} ${cx + 18} ${cy + 0}`} stroke={ink} strokeWidth="4.5" fill="none" strokeLinecap="round" /><path d={`M${cx - 15} ${cy + 3} Q${cx} ${cy - 8} ${cx + 15} ${cy + 3}`} stroke={skinD} strokeWidth="2" fill="none" opacity=".5" /></g>;
    return <g key={cx}>
      <ellipse cx={cx} cy={cy} rx={19 * er * big} ry={(serious ? 10 : 13) * er * big} fill="#fbfaf7" stroke={ink} strokeOpacity=".5" strokeWidth="1.6" />
      <circle cx={cx + flip * 1.5} cy={cy + 0.5} r={10.5 * er * big} fill={`url(#${id('ir')})`} />
      <circle cx={cx + flip * 1.5} cy={cy + 0.5} r={5 * er * big} fill="#0c0a0a" />
      <circle cx={cx + flip * 1.5 - 3.5} cy={cy - 4} r={3.2 * er} fill="#fff" opacity=".95" /><circle cx={cx + flip * 1.5 + 4} cy={cy + 4} r={1.6} fill="#fff" opacity=".6" />
      <path d={`M${cx - 20 * er} ${cy - 2} Q${cx} ${cy - (serious ? 14 : 19) * er * big} ${cx + 20 * er} ${cy - 2}`} stroke={ink} strokeWidth={female || child ? 4.2 : 3.6} fill="none" strokeLinecap="round" />
      {female && <path d={`M${cx + flip * 17} ${cy - 5} l${flip * 6} -4`} stroke={ink} strokeWidth="2.6" strokeLinecap="round" />}
      <path d={`M${cx - 15} ${cy + 11} Q${cx} ${cy + 16} ${cx + 15} ${cy + 11}`} stroke={skinD} strokeWidth="1.6" fill="none" opacity=".6" />
    </g>;
  };
  const brow = (cx: number, flip: number) => { const th = (st.brow ?? 1) * (female ? 0.75 : 1) * (child ? 0.7 : 1); const raise = surprise ? -9 : happy ? -3 : 0; const tilt = worry ? -flip * 9 : serious ? flip * 8 : 0; const y = cy - 30 + raise;
    return <path key={cx} d={`M${cx - 20} ${y + (tilt > 0 ? 0 : -tilt * 0.6) + 3} Q${cx} ${y - 7 + (worry ? -2 : 0)} ${cx + 20} ${y + (tilt > 0 ? tilt : 0) + 3 + (tilt < 0 ? 0 : 0)}`} stroke={old ? '#9a9a96' : shade(hair, -0.15)} strokeWidth={5 * th} fill="none" strokeLinecap="round" transform={`rotate(${(flip * (serious ? 6 : worry ? -7 : 0))} ${cx} ${y})`} />; };
  const my = cy + 64;
  const mouth = happy ? <g><path d={`M178 ${my - 4} Q200 ${my + 22} 222 ${my - 4} Q200 ${my + 4} 178 ${my - 4}Z`} fill="#6a2a24" stroke={ink} strokeOpacity=".6" strokeWidth="1.8" /><path d={`M184 ${my - 1} Q200 ${my + 6} 216 ${my - 1} L214 ${my + 3} Q200 ${my + 9} 186 ${my + 3}Z`} fill="#fbfaf7" /></g>
    : surprise ? <ellipse cx="200" cy={my + 4} rx="11" ry="14" fill="#5a1f1c" stroke={ink} strokeOpacity=".6" strokeWidth="1.8" />
    : worry ? <path d={`M182 ${my + 8} Q200 ${my - 6} 218 ${my + 8}`} stroke="#7a3a32" strokeWidth="3.6" fill="none" strokeLinecap="round" />
    : serious ? <path d={`M184 ${my + 2} L216 ${my + 2}`} stroke="#7a3a32" strokeWidth="3.6" strokeLinecap="round" />
    : <path d={`M184 ${my} Q200 ${my + 8} 216 ${my}`} stroke="#7a3a32" strokeWidth="3.6" fill="none" strokeLinecap="round" />;
  const faceH = child ? 'M134 204 C134 140 160 112 200 112 C240 112 266 140 266 204 C266 258 238 292 200 296 C162 292 134 258 134 204Z' : 'M130 170 C130 106 160 80 200 80 C240 80 270 106 270 170 C270 240 240 282 200 286 C160 282 130 240 130 170Z';
  // ----- 帽子（駅員）-----
  const cap = d.accessory === 'cap' ? <g>
    <path d="M118 128 C116 70 150 44 200 44 C250 44 284 70 282 128 Z" fill={`url(#${id('un')})`} stroke={ink} strokeOpacity=".6" strokeWidth="2" /><path d="M116 122 C150 132 250 132 284 122 L286 140 C250 150 150 150 114 140Z" fill={uniD} stroke={ink} strokeOpacity=".6" strokeWidth="2" />
    <path d="M124 144 C160 156 240 156 276 144 L272 154 C240 168 160 168 128 154Z" fill="#101626" stroke={ink} strokeOpacity=".6" strokeWidth="2" />
    <g transform="translate(200 108)"><circle r="14" fill="#d8b030" stroke="#8a6a10" strokeWidth="2" /><circle r="8" fill="none" stroke="#8a6a10" strokeWidth="1.6" /><path d="M-5 3 L0 -6 L5 3Z" fill="#8a6a10" /></g>
    <path d="M140 76 C164 60 210 58 236 68" stroke="#fff" strokeOpacity=".25" strokeWidth="5" fill="none" strokeLinecap="round" /></g> : null;
  const glasses = d.accessory === 'glasses' ? <g stroke="#1b1511" strokeWidth="3.4" fill="rgba(180,210,235,.18)"><rect x="132" y={cy - 20} width="62" height="44" rx="14" /><rect x="206" y={cy - 20} width="62" height="44" rx="14" /><path d="M194 " /><path d={`M194 ${cy - 6} Q200 ${cy - 12} 206 ${cy - 6}`} fill="none" /><path d={`M132 ${cy - 8} L120 ${cy - 14} M268 ${cy - 8} L280 ${cy - 14}`} fill="none" /><path d={`M142 ${cy - 12} l14 -6`} stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" /></g> : null;

  return (
    <svg viewBox="0 0 400 500" width={size} height={size * 1.25} role="img" aria-label={d.name} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id('un')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={uniL} /><stop offset=".55" stopColor={uni} /><stop offset="1" stopColor={uniD} /></linearGradient>
        <radialGradient id={id('sk')} cx=".42" cy=".38" r=".75"><stop offset="0" stopColor={skinL} /><stop offset=".6" stopColor={skin} /><stop offset="1" stopColor={skinD} /></radialGradient>
        <linearGradient id={id('hr')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={hairL} /><stop offset=".45" stopColor={hair} /><stop offset="1" stopColor={hairD} /></linearGradient>
        <radialGradient id={id('ir')} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor={shade(eyeC, 0.35)} /><stop offset=".6" stopColor={eyeC} /><stop offset="1" stopColor={shade(eyeC, -0.5)} /></radialGradient>
        <linearGradient id={id('ns')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={skinDD} stopOpacity=".55" /><stop offset="1" stopColor={skinDD} stopOpacity="0" /></linearGradient>
      </defs>
      {hairBack}
      {/* 肩・上着 */}
      <path d={child ? 'M92 500 C98 410 140 372 200 370 C260 372 302 410 308 500Z' : 'M50 500 C58 398 116 358 200 356 C284 358 342 398 350 500Z'} fill={`url(#${id('un')})`} stroke={ink} strokeOpacity=".6" strokeWidth="2.2" />
      <path d="M60 500 C66 430 100 392 138 376 C120 420 118 460 122 500Z" fill={uniD} opacity=".35" /><path d="M340 500 C334 430 300 392 262 376 C280 420 282 460 278 500Z" fill={uniD} opacity=".3" />
      {/* 首 */}
      <path d="M168 270 L168 350 C176 366 224 366 232 350 L232 270Z" fill={`url(#${id('sk')})`} stroke={ink} strokeOpacity=".4" strokeWidth="1.6" /><path d="M168 300 C190 330 214 330 232 300 L232 350 C224 366 176 366 168 350Z" fill={skinDD} opacity=".4" />
      {staff ? <g>
        <path d="M166 352 L200 424 L234 352 C224 366 176 366 166 352Z" fill="#f6f5f0" stroke={ink} strokeOpacity=".5" strokeWidth="1.8" /><path d="M150 352 L196 432 L170 500 L120 500 C128 440 138 390 150 352Z" fill={uniD} stroke={ink} strokeOpacity=".5" strokeWidth="1.8" /><path d="M250 352 L204 432 L230 500 L280 500 C272 440 262 390 250 352Z" fill={uniD} stroke={ink} strokeOpacity=".5" strokeWidth="1.8" />
        <path d="M186 366 L214 366 L208 384 L192 384Z" fill="#a82626" stroke={ink} strokeOpacity=".5" strokeWidth="1.6" /><path d="M192 384 L208 384 L216 470 L200 486 L184 470Z" fill="#b92d2d" stroke={ink} strokeOpacity=".5" strokeWidth="1.6" /><path d="M196 392 L198 470" stroke="#fff" strokeOpacity=".25" strokeWidth="3" />
        <circle cx="206" cy="500" r="0" /><circle cx="246" cy="470" r="7" fill="#d8b030" stroke="#8a6a10" strokeWidth="1.6" /><circle cx="154" cy="470" r="7" fill="#d8b030" stroke="#8a6a10" strokeWidth="1.6" />
        <g transform="translate(268 420)"><rect x="-26" y="-10" width="52" height="22" fill="#fff" stroke={ink} strokeOpacity=".6" strokeWidth="1.6" /><rect x="-26" y="-10" width="6" height="22" fill="#1b6f45" /><path d="M-14 0 h30 M-14 6 h20" stroke="#1d2a44" strokeWidth="2.6" /></g>
      </g> : <g>
        <path d="M150 352 C164 380 186 392 200 392 C214 392 236 380 250 352 C236 366 214 372 200 372 C186 372 164 366 150 352Z" fill={shade(uni, -0.15)} stroke={ink} strokeOpacity=".5" strokeWidth="1.8" /><path d="M176 356 C186 380 214 380 224 356" fill="none" stroke={shade(uni, 0.3)} strokeWidth="3" opacity=".6" />
        {d.accessory === 'bag' && <path d="M100 500 L160 360 M300 500 L240 360" stroke="#6a4a3a" strokeWidth="9" opacity=".9" />}
      </g>}
      {/* 耳・顔 */}
      <ellipse cx="128" cy={cy + 8} rx="13" ry="22" fill={skin} stroke={ink} strokeOpacity=".5" strokeWidth="1.8" /><ellipse cx="272" cy={cy + 8} rx="13" ry="22" fill={skin} stroke={ink} strokeOpacity=".5" strokeWidth="1.8" /><path d={`M126 ${cy} q-4 10 2 20`} stroke={skinD} strokeWidth="2" fill="none" /><path d={`M274 ${cy} q4 10 -2 20`} stroke={skinD} strokeWidth="2" fill="none" />
      <path d={faceH} fill={`url(#${id('sk')})`} stroke={ink} strokeOpacity=".55" strokeWidth="2.2" />
      <path d={`M138 ${cy + 40} C146 ${cy + 92} 176 ${cy + 108} 200 ${cy + 108} C224 ${cy + 108} 254 ${cy + 92} 262 ${cy + 40} C250 ${cy + 80} 228 ${cy + 96} 200 ${cy + 96} C172 ${cy + 96} 150 ${cy + 80} 138 ${cy + 40}Z`} fill={skinD} opacity=".22" />
      {st.cheeks !== undefined || female || child ? <g opacity={(st.cheeks ?? 1) * 0.28}><ellipse cx="156" cy={cy + 36} rx="20" ry="11" fill="#e2756a" /><ellipse cx="244" cy={cy + 36} rx="20" ry="11" fill="#e2756a" /></g> : null}
      {old && <g stroke={skinDD} strokeWidth="1.6" fill="none" opacity=".5"><path d={`M150 ${cy - 44} q50 -8 100 0`} /><path d={`M154 ${cy - 36} q46 -6 92 0`} /><path d={`M178 ${cy + 40} q-4 18 4 30`} /><path d={`M222 ${cy + 40} q4 18 -4 30`} /></g>}
      {/* 目鼻口 */}
      {brow(168, 1)}{brow(232, -1)}{eye(168, 1)}{eye(232, -1)}{glasses}
      <path d={`M200 ${cy + 4} C198 ${cy + 26} 194 ${cy + 36} 196 ${cy + 42} C200 ${cy + 46} 208 ${cy + 44} 210 ${cy + 40}`} stroke={skinDD} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".75" />
      <path d={`M186 ${cy + 46} q4 3 8 0 M206 ${cy + 46} q4 3 8 0`} stroke={skinDD} strokeWidth="2" fill="none" opacity=".6" />
      {mouth}
      {worry && <path d="M286 150 C292 162 292 170 286 176 C280 170 280 162 286 150Z" fill="#9fd0ee" stroke="#4a86a8" strokeWidth="1.6" opacity=".85" />}
      {st.freckles && <g fill={skinDD} opacity=".4"><circle cx="156" cy={cy + 24} r="2" /><circle cx="166" cy={cy + 30} r="2" /><circle cx="244" cy={cy + 24} r="2" /><circle cx="234" cy={cy + 30} r="2" /></g>}
      {hairFront}{cap}
    </svg>
  );
}
