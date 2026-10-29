// expect: no-restricted-syntax
export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

export function pickWinner(count: number): number {
  return Math.floor(Math.random() * count) + new Date().getDay();
}
