import type { ModeId, StoryData } from '../engine/types';
import r7 from './r7/story.json';
import r8 from './r8/story.json';

/** プレイ可能なストーリーの登録表。モードIDごとにデータ・ランナー・セーブ領域（save:{modeId}:*）が切り替わる。 */
const REGISTRY: Partial<Record<ModeId, StoryData>> = {
  R7: r7 as unknown as StoryData,
  R8: r8 as unknown as StoryData
};

export const storyFor = (mode: ModeId): StoryData => { const s = REGISTRY[mode]; if (!s) throw new Error(`ストーリー未登録のモードです: ${mode}`); return s; };
export const registeredModes = (): ModeId[] => Object.keys(REGISTRY) as ModeId[];
