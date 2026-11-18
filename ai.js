export const randomChoice = arr => arr[Math.floor(Math.random()*arr.length)];

export function pickByDifficulty(moves, scoreFn, diff) {
  if (moves.length === 0) return null;
  if (diff === 'easy') return randomChoice(moves);
  const scored = moves.map(m => ({ m, s: scoreFn(m) }));
  scored.sort((a,b) => b.s - a.s);
  if (diff === 'medium') return Math.random() < 0.3 ? scored[0].m : randomChoice(moves);
  return scored[0].m;
}
