export function maskName(name?: string | null, visibleChars = 1): string {
  if (!name) return 'Pembeli';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'Pembeli';

  const maskedParts = parts.map(part => {
    if (!part) return '';
    // if the part is only asterisks or too short, return masked asterisks
    if (/^\*+$/.test(part)) return '*'.repeat(Math.max(visibleChars, 1));
    const visible = part.slice(0, visibleChars);
    const restLen = Math.max(part.length - visibleChars, 1);
    return visible + '*'.repeat(restLen);
  });

  return maskedParts.join(' ');
}
