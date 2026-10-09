export const MAX_LIVES = 5;
export const REGEN_MS = 60 * 60 * 1000;

export function computeLives(count: number, anchor: Date, now: Date) {
  if (count >= MAX_LIVES) return { lives: MAX_LIVES, anchor: now };
  const regen = Math.floor((now.getTime() - anchor.getTime()) / REGEN_MS);
  const lives = Math.min(MAX_LIVES, count + Math.max(regen, 0));
  const newAnchor = lives >= MAX_LIVES
    ? now
    : new Date(anchor.getTime() + Math.max(regen, 0) * REGEN_MS);
  return { lives, anchor: newAnchor };
}
