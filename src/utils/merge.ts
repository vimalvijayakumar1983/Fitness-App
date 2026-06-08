/**
 * Merge layered lists of items by id over a base list. Later layers win on id
 * collisions (so order layers least→most authoritative, e.g. [cms, userCustom]).
 * New items (not in base) are surfaced first, newest layer first.
 */
export function mergeById<T extends { id: string }>(base: T[], layers: T[][]): T[] {
  if (!layers.some((l) => l.length)) return base;
  const map = new Map(base.map((x) => [x.id, x]));
  const baseIds = new Set(map.keys());
  const extras: T[] = [];
  for (const layer of layers) {
    for (const item of layer) {
      if (!baseIds.has(item.id) && !map.has(item.id)) extras.unshift(item);
      else if (!baseIds.has(item.id)) {
        // already an extra from an earlier layer — replace in place
        const i = extras.findIndex((e) => e.id === item.id);
        if (i >= 0) extras[i] = item;
        else extras.unshift(item);
      }
      map.set(item.id, item);
    }
  }
  const baseMerged = base.map((x) => map.get(x.id)!);
  return [...extras.map((e) => map.get(e.id)!), ...baseMerged];
}
