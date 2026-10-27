// Local progress belongs to whoever last signed in on this browser. When a different account signs in,
// the previous account's local copy is dropped instead of being merged into the new account.
export function claimLocal(dataKey: string, email: string): boolean {
  const ownerKey = dataKey + ":owner";
  try {
    const owner = localStorage.getItem(ownerKey);
    localStorage.setItem(ownerKey, email);
    if (owner && owner !== email) { localStorage.removeItem(dataKey); return true; }
  } catch {}
  return false;
}

/** Sign-out: forget this browser's local progress so the next person starts clean. */
export function clearLocal(...dataKeys: string[]) {
  try { for (const k of dataKeys) { localStorage.removeItem(k); localStorage.removeItem(k + ":owner"); } } catch {}
}
