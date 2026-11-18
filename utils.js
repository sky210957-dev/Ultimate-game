export const $ = id => document.getElementById(id);

export const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
