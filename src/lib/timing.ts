import { Scene, SceneWithFrames, SRTEntry } from '@/types';

/**
 * Converts scenes from startLeg (SRT index) to actual frame numbers.
 * The AI defines startLeg as the 0-based index of the SRT entry where each scene begins.
 * This function resolves those indexes to exact frame numbers at 30fps.
 */
export function convertScenesFromLegendaIndex(
  scenes: Scene[],
  srtEntries: SRTEntry[]
): SceneWithFrames[] {
  if (srtEntries.length === 0) return [];
  const lastFrame = srtEntries[srtEntries.length - 1].endFrame;

  return scenes.map((scene, i) => {
    const startEntry = srtEntries[scene.startLeg] ?? srtEntries[0];
    const nextScene = scenes[i + 1];
    const endEntry = nextScene
      ? (srtEntries[nextScene.startLeg] ?? srtEntries[srtEntries.length - 1])
      : null;

    const startFrame = startEntry.startFrame;
    const endFrame = endEntry ? endEntry.startFrame : lastFrame;
    const durationFrames = Math.max(endFrame - startFrame, 30); // min 1s

    return {
      ...scene,
      startFrame,
      endFrame,
      durationFrames,
    };
  });
}
