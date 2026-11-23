/** 鉄道車両の走行物理エンジン（描画・UI・時計に依存しない純TypeScript）。
 *
 *  【重要】これは「313系を参考にしたゲーム用の抽象モデル」です。実在の車両・会社の仕様を再現・断定するものではありません。
 *  諸元の多くは公開情報の一般的な範囲をもとにした**推定値**で、各定数に `source: 'public' | 'estimated'` を付けています。
 *  実在会社の非公開の制御情報（実際の制御装置の特性・ブレーキ指令の詳細など）は使っていません。
 *
 *  単位は SI（m, s, kg, N, W, J）。速度は m/s、勾配は千分率（‰、上りが正）、曲線半径は m（0 は直線）。
 *  km/h との変換は kmhToMps / mpsToKmh を使うこと。
 *  積分は固定時間刻み（既定 1/60 s）の半陰的オイラー法。乱数・時刻・外部状態は使わないので、同じ入力なら結果は決定的。 */

export type ParamSource = 'public' | 'estimated';
export interface ParamEntry { value: number; unit: string; source: ParamSource; note: string }

const p = (value: number, unit: string, source: ParamSource, note: string): ParamEntry => ({ value, unit, source, note });

/** 参考車両（313系を参考にした4両編成・2M2T）の諸元。各項目の出典区分と意味を併記。 */
export const REFERENCE_PARAMS = {
  gravityMps2: p(9.80665, 'm/s²', 'public', '標準重力加速度（物理定数）'),
  carCount: p(4, '両', 'estimated', '4両編成と仮定（実在の編成を断定しない）'),
  motoredCarCount: p(2, '両', 'estimated', '電動車2・付随車2と仮定'),
  emptyCarMassKg: p(34000, 'kg', 'estimated', '1両あたりの空車質量（推定）'),
  passengerCapacityPerCar: p(130, '人', 'estimated', '1両あたりの乗車人数（満車時の目安・推定）'),
  passengerMassKg: p(60, 'kg', 'estimated', '旅客1人あたりの質量（手荷物込みの一般的な想定）'),
  rotatingMassFactor: p(1.1, '-', 'estimated', '回転部分質量の慣性相当を含む見かけ質量係数（一般的に約1.05〜1.15）'),
  maxSpeedMps: p(120 / 3.6, 'm/s', 'public', '最高運転速度 120km/h（公表されている範囲の参考値。ゲーム内上限として使用）'),
  maxTractiveForceN: p(110000, 'N', 'estimated', '起動時の最大牽引力（編成合計・推定）'),
  tractivePowerW: p(1500000, 'W', 'estimated', '定出力領域の編成合計出力（推定。電動車2両ぶんの主電動機合計の仮定）'),
  fieldWeakeningSpeedMps: p(22, 'm/s', 'estimated', '定出力から速度の二乗反比例（特性領域）へ移る速度（推定）'),
  davisAperKnN: p(2.0, 'N/kN', 'estimated', 'Davis式 A項：重量あたりの転がり抵抗（推定）'),
  davisBperKnPerMps: p(0.06, 'N/kN/(m/s)', 'estimated', 'Davis式 B項：重量あたりの速度比例抵抗（推定）'),
  davisCNPerMps2: p(7.5, 'N/(m/s)²', 'estimated', 'Davis式 C項：空気抵抗（編成全体・推定）'),
  curveResistanceCoeff: p(800, 'm·‰', 'estimated', '曲線抵抗 ≒ 800/R ‰（半径R[m]。国内でよく使われる近似式を参考にした推定）'),
  serviceBrakeStepDecelMps2: p(0.14, 'm/s²/段', 'estimated', '常用ブレーキ1段あたりの減速度。B1=0.14 … B7=0.98 m/s²（約3.5km/h/s）と仮定'),
  serviceBrakeSteps: p(7, '段', 'estimated', '常用ブレーキ段数（B1〜B7相当）'),
  emergencyBrakeDecelMps2: p(1.2, 'm/s²', 'estimated', '非常ブレーキの減速度（約4.3km/h/s・推定）'),
  serviceBrakeBuildUpS: p(1.0, 's', 'estimated', '常用ブレーキの立ち上がり時間'),
  emergencyBrakeBuildUpS: p(0.6, 's', 'estimated', '非常ブレーキの立ち上がり時間'),
  adhesionDryMu0: p(0.30, '-', 'estimated', '乾燥時の低速粘着係数'),
  adhesionWetMu0: p(0.10, '-', 'estimated', '雨天時の低速粘着係数（落ち葉・湿潤を含めた厳しめの想定）'),
  adhesionSpeedDecayMps: p(50, 'm/s', 'estimated', '粘着係数が速度で低下する目安：μ(v)=μ0/(1+v/この値)'),
  brakeAdhesionUtilization: p(0.9, '-', 'estimated', 'ブレーキ時に使える粘着の割合（滑走防止装置を想定）'),
} as const satisfies Record<string, ParamEntry>;

export type ParamKey = keyof typeof REFERENCE_PARAMS;

/** 推定値（source === 'estimated'）の一覧。レポート・調整画面用。 */
export function listEstimatedParams(): { key: ParamKey; entry: ParamEntry }[] {
  return (Object.keys(REFERENCE_PARAMS) as ParamKey[])
    .filter(k => REFERENCE_PARAMS[k].source === 'estimated')
    .map(k => ({ key: k, entry: REFERENCE_PARAMS[k] }));
}

export interface TrainSpec {
  gravityMps2: number;
  carCount: number;
  motoredCarCount: number;
  emptyCarMassKg: number;
  passengerCapacityPerCar: number;
  passengerMassKg: number;
  rotatingMassFactor: number;
  maxSpeedMps: number;
  maxTractiveForceN: number;
  tractivePowerW: number;
  fieldWeakeningSpeedMps: number;
  davisAperKnN: number;
  davisBperKnPerMps: number;
  davisCNPerMps2: number;
  curveResistanceCoeff: number;
  serviceBrakeStepDecelMps2: number;
  serviceBrakeSteps: number;
  emergencyBrakeDecelMps2: number;
  serviceBrakeBuildUpS: number;
  emergencyBrakeBuildUpS: number;
  adhesionDryMu0: number;
  adhesionWetMu0: number;
  adhesionSpeedDecayMps: number;
  brakeAdhesionUtilization: number;
}

/** 参考諸元から既定の TrainSpec を作る（必要なら一部を上書き）。 */
export function referenceTrainSpec(overrides: Partial<TrainSpec> = {}): TrainSpec {
  const out = {} as Record<string, number>;
  for (const k of Object.keys(REFERENCE_PARAMS) as ParamKey[]) out[k] = REFERENCE_PARAMS[k].value;
  return { ...(out as unknown as TrainSpec), ...overrides };
}

export const FIXED_DT_S = 1 / 60;

export const kmhToMps = (kmh: number): number => kmh / 3.6;
export const mpsToKmh = (mps: number): number => mps * 3.6;

export type Weather = 'dry' | 'wet';

export interface TrackEnv {
  /** 勾配（‰）。上りが正、下りが負。 */
  gradePermille: number;
  /** 曲線半径（m）。0 は直線。 */
  curveRadiusM: number;
  weather: Weather;
}
export const FLAT_DRY: TrackEnv = { gradePermille: 0, curveRadiusM: 0, weather: 'dry' };

export type BrakeCommand =
  | { kind: 'none' }
  | { kind: 'service'; step: number } // 1〜serviceBrakeSteps（B1〜B7相当）
  | { kind: 'emergency' };

export interface DriverInput {
  /** 力行ノッチの割合 0〜1（1で全力行）。 */
  powerRatio: number;
  brake: BrakeCommand;
}
export const COAST: DriverInput = { powerRatio: 0, brake: { kind: 'none' } };

export interface TrainState {
  timeS: number;
  positionM: number;
  speedMps: number;
  /** ブレーキの効き具合 0〜1（立ち上がり遅れの表現）。 */
  brakeApplied: number;
  /** 牽引力が車両になした仕事の累計（J、非負）。 */
  tractionWorkJ: number;
  /** 直近の1ステップの値（表示・デバッグ用）。 */
  lastTractiveForceN: number;
  lastBrakeDecelMps2: number;
  lastResistanceN: number;
}
export const initialTrainState = (speedMps = 0): TrainState => ({
  timeS: 0, positionM: 0, speedMps, brakeApplied: 0, tractionWorkJ: 0,
  lastTractiveForceN: 0, lastBrakeDecelMps2: 0, lastResistanceN: 0,
});

/** 編成質量（kg）＝空車＋旅客荷重。loadFactor は乗車率 0〜1（1で定員）。 */
export function trainMassKg(spec: TrainSpec, loadFactor: number): number {
  const lf = Math.min(1, Math.max(0, loadFactor));
  return spec.carCount * (spec.emptyCarMassKg + spec.passengerCapacityPerCar * lf * spec.passengerMassKg);
}

/** 粘着係数 μ(v)。速度が上がると低下し、雨天では低速側から小さい。 */
export function adhesionCoefficient(spec: TrainSpec, speedMps: number, weather: Weather): number {
  const mu0 = weather === 'wet' ? spec.adhesionWetMu0 : spec.adhesionDryMu0;
  return mu0 / (1 + Math.max(0, speedMps) / spec.adhesionSpeedDecayMps);
}

/** 牽引力曲線（N）：低速は一定 → 定出力（P/v）→ 高速は速度の二乗反比例。粘着制限前の値。 */
export function tractiveForceCurveN(spec: TrainSpec, speedMps: number): number {
  const v = Math.max(0, speedMps);
  if (v >= spec.maxSpeedMps) return 0;
  const vConst = spec.tractivePowerW / spec.maxTractiveForceN; // 定出力に入る速度
  if (v <= vConst) return spec.maxTractiveForceN;
  const vk = Math.max(spec.fieldWeakeningSpeedMps, vConst);
  if (v <= vk) return spec.tractivePowerW / v;
  const fk = spec.tractivePowerW / vk;
  return fk * (vk / v) * (vk / v);
}

/** 粘着で制限した牽引力（N）。動軸（電動車）にかかる重量×μ が上限。 */
export function tractiveForceLimitedN(spec: TrainSpec, massKg: number, speedMps: number, weather: Weather, powerRatio: number): number {
  const ratio = Math.min(1, Math.max(0, powerRatio));
  const curve = tractiveForceCurveN(spec, speedMps) * ratio;
  const motoredShare = spec.motoredCarCount / spec.carCount;
  const adhesionLimit = adhesionCoefficient(spec, speedMps, weather) * motoredShare * massKg * spec.gravityMps2;
  return Math.min(curve, adhesionLimit);
}

/** 走行抵抗（N）：Davis式 A+Bv+Cv²（A,B は重量比例）。常に非負で進行方向と逆向き。 */
export function davisResistanceN(spec: TrainSpec, massKg: number, speedMps: number): number {
  const v = Math.max(0, speedMps);
  const weightKn = massKg * spec.gravityMps2 / 1000;
  return spec.davisAperKnN * weightKn + spec.davisBperKnPerMps * weightKn * v + spec.davisCNPerMps2 * v * v;
}

/** 勾配抵抗（N）。上りで正（進行を妨げる）、下りで負（押す）。 */
export function gradeResistanceN(spec: TrainSpec, massKg: number, gradePermille: number): number {
  return massKg * spec.gravityMps2 * gradePermille / 1000;
}

/** 曲線抵抗（N）。半径 R[m] に対し ≒ coeff/R ‰ 相当。直線（R<=0）は 0。 */
export function curveResistanceN(spec: TrainSpec, massKg: number, curveRadiusM: number): number {
  if (!(curveRadiusM > 0)) return 0;
  return massKg * spec.gravityMps2 * (spec.curveResistanceCoeff / curveRadiusM) / 1000;
}

/** ブレーキの要求減速度（m/s²、満効時）。粘着による制限は含まない。 */
export function brakeDemandDecelMps2(spec: TrainSpec, brake: BrakeCommand): number {
  if (brake.kind === 'emergency') return spec.emergencyBrakeDecelMps2;
  if (brake.kind === 'service') {
    const step = Math.min(spec.serviceBrakeSteps, Math.max(0, Math.round(brake.step)));
    return step * spec.serviceBrakeStepDecelMps2;
  }
  return 0;
}

/** 実際に出せるブレーキ減速度（m/s²）。粘着（全軸）で頭打ち。 */
export function brakeAvailableDecelMps2(spec: TrainSpec, brake: BrakeCommand, speedMps: number, weather: Weather): number {
  const demand = brakeDemandDecelMps2(spec, brake);
  const limit = adhesionCoefficient(spec, speedMps, weather) * spec.brakeAdhesionUtilization * spec.gravityMps2;
  return Math.min(demand, limit);
}

/** 1ステップ進める（純関数）。非常ブレーキ・常用ブレーキ中は牽引力ゼロ。速度は 0 未満にならない。 */
export function stepTrain(
  state: TrainState, input: DriverInput, env: TrackEnv, spec: TrainSpec, massKg: number, dtS: number = FIXED_DT_S,
): TrainState {
  const v = Math.max(0, state.speedMps);
  const braking = input.brake.kind !== 'none';
  const buildUp = input.brake.kind === 'emergency' ? spec.emergencyBrakeBuildUpS : spec.serviceBrakeBuildUpS;
  const brakeApplied = braking
    ? Math.min(1, state.brakeApplied + dtS / Math.max(buildUp, dtS))
    : Math.max(0, state.brakeApplied - dtS / Math.max(spec.serviceBrakeBuildUpS, dtS)); // 緩めも同程度の時間
  const effMass = massKg * spec.rotatingMassFactor;

  const tractive = braking ? 0 : tractiveForceLimitedN(spec, massKg, v, env.weather, input.powerRatio);
  const brakeDecel = brakeAvailableDecelMps2(spec, input.brake, v, env.weather) * brakeApplied;
  const brakeForce = brakeDecel * effMass;
  const resistance = davisResistanceN(spec, massKg, v) + curveResistanceN(spec, massKg, env.curveRadiusM);
  const grade = gradeResistanceN(spec, massKg, env.gradePermille);

  let nextV: number;
  if (v === 0) {
    // 停止中：転がり抵抗は静止摩擦として扱い、牽引力＋下り勾配が（ブレーキ・抵抗・曲線）を上回ったときだけ動き出す。
    const drive = tractive - grade - (davisResistanceN(spec, massKg, 0) + curveResistanceN(spec, massKg, env.curveRadiusM)) - brakeForce;
    nextV = drive > 0 ? drive / effMass * dtS : 0; // 逆走はしない（保持ブレーキ想定）
  } else {
    const net = tractive - resistance - grade - brakeForce;
    nextV = Math.max(0, v + net / effMass * dtS);
  }
  const avgV = (v + nextV) / 2;
  return {
    timeS: state.timeS + dtS,
    positionM: state.positionM + avgV * dtS,
    speedMps: nextV,
    brakeApplied,
    tractionWorkJ: state.tractionWorkJ + tractive * avgV * dtS,
    lastTractiveForceN: tractive,
    lastBrakeDecelMps2: brakeDecel,
    lastResistanceN: resistance + grade,
  };
}

export interface RunResult { timeS: number; distanceM: number; finalSpeedMps: number; reached: boolean; finalState: TrainState }

/** 平坦・勾配などの環境で、停止状態から目標速度まで全力行で加速する時間（秒）と距離（m）。上限時間内に届かなければ reached=false。 */
export function accelerateToSpeed(
  targetSpeedMps: number, env: TrackEnv, spec: TrainSpec, loadFactor: number, limitS = 600, powerRatio = 1,
): RunResult {
  const mass = trainMassKg(spec, loadFactor);
  let s = initialTrainState(0);
  const input: DriverInput = { powerRatio, brake: { kind: 'none' } };
  const maxSteps = Math.ceil(limitS / FIXED_DT_S);
  for (let i = 0; i < maxSteps && s.speedMps < targetSpeedMps; i++) s = stepTrain(s, input, env, spec, mass);
  return { timeS: s.timeS, distanceM: s.positionM, finalSpeedMps: s.speedMps, reached: s.speedMps >= targetSpeedMps, finalState: s };
}

/** 初速から指定ブレーキで停止するまでの時間（秒）と停止距離（m）。力行はしない。 */
export function stoppingDistanceM(
  initialSpeedMps: number, brake: BrakeCommand, env: TrackEnv, spec: TrainSpec, loadFactor: number, limitS = 600,
): RunResult {
  const mass = trainMassKg(spec, loadFactor);
  let s = initialTrainState(Math.max(0, initialSpeedMps));
  const input: DriverInput = { powerRatio: 0, brake };
  const maxSteps = Math.ceil(limitS / FIXED_DT_S);
  for (let i = 0; i < maxSteps && s.speedMps > 0; i++) s = stepTrain(s, input, env, spec, mass);
  return { timeS: s.timeS, distanceM: s.positionM, finalSpeedMps: s.speedMps, reached: s.speedMps === 0, finalState: s };
}
