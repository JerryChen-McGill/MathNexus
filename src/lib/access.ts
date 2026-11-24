// Local developer playtesting access; this does not grant any server permissions.
export function isAdminToken(token: string): boolean {
  return ['JerryChen', 'JennyWang'].includes(token.trim().replace(/\s+/g, ''));
}

export function canPlayLevel(level: number, count: number, highestLevel: number, token: string): boolean {
  return Number.isInteger(level) && level >= 1 && level <= count && (isAdminToken(token) || level <= highestLevel);
}
