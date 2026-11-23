import { describe, it, expect } from 'vitest';
import {
  REFERENCE_PARAMS, listEstimatedParams, referenceTrainSpec, trainMassKg, kmhToMps, mpsToKmh, FLAT_DRY,
  accelerateToSpeed, stoppingDistanceM, stepTrain, initialTrainState, tractiveForceCurveN, davisResistanceN,
  adhesionCoefficient, brakeDemandDecelMps2, FIXED_DT_S, type TrackEnv, type DriverInput,
} from '../src/engine/railPhysics';

const spec = referenceTrainSpec();
const V90 = kmhToMps(90);

describe('railPhysics 基本', () => {
  it('全定数に出典区分があり、推定値の一覧が取れる', () => {
    for (const e of Object.values(REFERENCE_PARAMS)) expect(['public', 'estimated']).toContain(e.source);
    expect(listEstimatedParams().length).toBeGreaterThan(10);
    expect(mpsToKmh(kmhToMps(90))).toBeCloseTo(90, 9);
  });
  it('編成質量は空車＋旅客荷重で増える', () => {
    expect(trainMassKg(spec, 1)).toBeGreaterThan(trainMassKg(spec, 0));
    expect(trainMassKg(spec, 0)).toBe(4 * 34000);
  });
  it('牽引力曲線：低速一定→定出力→二乗反比例で単調減少', () => {
    const f0 = tractiveForceCurveN(spec, 0), f5 = tractiveForceCurveN(spec, 5);
    expect(f5).toBe(f0);
    expect(tractiveForceCurveN(spec, 15) * 15).toBeCloseTo(spec.tractivePowerW, 3);
    let prev = Infinity;
    for (let v = 0; v <= 33; v += 1) { const f = tractiveForceCurveN(spec, v); expect(f).toBeLessThanOrEqual(prev + 1e-9); prev = f; }
    expect(tractiveForceCurveN(spec, 30) / tractiveForceCurveN(spec, 22)).toBeCloseTo((22 / 30) ** 2, 3);
  });
  it('Davis抵抗は速度とともに増える', () => {
    const m = trainMassKg(spec, 0.5);
    expect(davisResistanceN(spec, m, 25)).toBeGreaterThan(davisResistanceN(spec, m, 10));
  });
  it('ブレーキ段は B1<…<B7<非常、雨天は粘着で頭打ち', () => {
    expect(brakeDemandDecelMps2(spec, { kind: 'service', step: 1 })).toBeLessThan(brakeDemandDecelMps2(spec, { kind: 'service', step: 7 }));
    expect(brakeDemandDecelMps2(spec, { kind: 'service', step: 7 })).toBeLessThan(brakeDemandDecelMps2(spec, { kind: 'emergency' }));
    expect(adhesionCoefficient(spec, 10, 'wet')).toBeLessThan(adhesionCoefficient(spec, 10, 'dry'));
  });
});

describe('railPhysics 走行シミュレーション', () => {
  it('① 平坦線で0→90km/hの加速時間が20〜60秒', () => {
    const r = accelerateToSpeed(V90, FLAT_DRY, spec, 0.5);
    expect(r.reached).toBe(true);
    expect(r.timeS).toBeGreaterThan(20);
    expect(r.timeS).toBeLessThan(60);
  });
  it('② 非常ブレーキの停止距離は常用最大(B7)より短い', () => {
    const b7 = stoppingDistanceM(V90, { kind: 'service', step: 7 }, FLAT_DRY, spec, 0.5);
    const em = stoppingDistanceM(V90, { kind: 'emergency' }, FLAT_DRY, spec, 0.5);
    expect(b7.reached && em.reached).toBe(true);
    expect(em.distanceM).toBeLessThan(b7.distanceM);
    expect(em.distanceM).toBeGreaterThan(100);
  });
  it('③ 上り勾配は加速が遅く、下り勾配は停止距離が延びる', () => {
    const up: TrackEnv = { ...FLAT_DRY, gradePermille: 25 };
    const down: TrackEnv = { ...FLAT_DRY, gradePermille: -25 };
    expect(accelerateToSpeed(V90, up, spec, 0.5).timeS).toBeGreaterThan(accelerateToSpeed(V90, FLAT_DRY, spec, 0.5).timeS);
    const brake = { kind: 'service', step: 7 } as const;
    expect(stoppingDistanceM(V90, brake, down, spec, 0.5).distanceM).toBeGreaterThan(stoppingDistanceM(V90, brake, FLAT_DRY, spec, 0.5).distanceM);
    expect(stoppingDistanceM(V90, brake, up, spec, 0.5).distanceM).toBeLessThan(stoppingDistanceM(V90, brake, FLAT_DRY, spec, 0.5).distanceM);
  });
  it('曲線抵抗は加速をわずかに遅くし、乗車率が高いと遅くなる', () => {
    const curve: TrackEnv = { ...FLAT_DRY, curveRadiusM: 300 };
    expect(accelerateToSpeed(V90, curve, spec, 0.5).timeS).toBeGreaterThan(accelerateToSpeed(V90, FLAT_DRY, spec, 0.5).timeS);
    expect(accelerateToSpeed(V90, FLAT_DRY, spec, 1).timeS).toBeGreaterThan(accelerateToSpeed(V90, FLAT_DRY, spec, 0).timeS);
  });
  it('④ 雨天の粘着低下で加速が鈍る（停止距離も延びる）', () => {
    const wet: TrackEnv = { ...FLAT_DRY, weather: 'wet' };
    const dry = accelerateToSpeed(V90, FLAT_DRY, spec, 0.5);
    const w = accelerateToSpeed(V90, wet, spec, 0.5);
    expect(w.timeS).toBeGreaterThan(dry.timeS + 1);
    const em = { kind: 'emergency' } as const;
    expect(stoppingDistanceM(V90, em, wet, spec, 0.5).distanceM).toBeGreaterThan(stoppingDistanceM(V90, em, FLAT_DRY, spec, 0.5).distanceM);
  });
  it('⑤ 速度・仕事は非負で、長時間でも発散しない', () => {
    const env: TrackEnv = { gradePermille: -30, curveRadiusM: 400, weather: 'wet' };
    const mass = trainMassKg(spec, 1);
    let s = initialTrainState(0), prevWork = 0, prevPos = 0;
    for (let i = 0; i < 60 * 600; i++) {
      const phase = Math.floor(i / (60 * 60)) % 3;
      const input: DriverInput = phase === 0 ? { powerRatio: 1, brake: { kind: 'none' } } : phase === 1 ? { powerRatio: 0, brake: { kind: 'service', step: 4 } } : { powerRatio: 0.5, brake: { kind: 'none' } };
      s = stepTrain(s, input, env, spec, mass);
      expect(Number.isFinite(s.speedMps) && Number.isFinite(s.positionM) && Number.isFinite(s.tractionWorkJ)).toBe(true);
      expect(s.speedMps).toBeGreaterThanOrEqual(0);
      expect(s.speedMps).toBeLessThan(60);
      expect(s.tractionWorkJ).toBeGreaterThanOrEqual(prevWork);
      expect(s.positionM).toBeGreaterThanOrEqual(prevPos);
      prevWork = s.tractionWorkJ; prevPos = s.positionM;
    }
  });
  it('停止中は牽引なしだと動かず、時間は固定刻みで進む', () => {
    const s = stepTrain(initialTrainState(0), { powerRatio: 0, brake: { kind: 'none' } }, { ...FLAT_DRY, gradePermille: 5 }, spec, trainMassKg(spec, 0.5));
    expect(s.speedMps).toBe(0);
    expect(s.timeS).toBeCloseTo(FIXED_DT_S, 12);
  });
  it('⑥ 同じ入力なら結果は決定的', () => {
    const a = accelerateToSpeed(V90, { gradePermille: 10, curveRadiusM: 500, weather: 'wet' }, spec, 0.7);
    const b = accelerateToSpeed(V90, { gradePermille: 10, curveRadiusM: 500, weather: 'wet' }, spec, 0.7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const c = stoppingDistanceM(V90, { kind: 'emergency' }, FLAT_DRY, spec, 0.5);
    const d = stoppingDistanceM(V90, { kind: 'emergency' }, FLAT_DRY, spec, 0.5);
    expect(JSON.stringify(c)).toBe(JSON.stringify(d));
  });
});
