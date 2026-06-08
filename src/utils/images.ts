import type { ExerciseDef, Food, Recipe } from '@/models/types';

/**
 * Item thumbnails. We don't bundle hundreds of photos, so we fetch a relevant
 * image by keyword (deterministic per id) from a free keyword image service.
 * Components fall back to an emoji tile if the image fails to load.
 */
function lock(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}

function url(keyword: string, id: string, size = 200): string {
  const kw = encodeURIComponent(keyword.trim() || 'food');
  return `https://loremflickr.com/${size}/${size}/${kw}?lock=${lock(id)}`;
}

/** Keyword from a food/recipe name: drop anything after a comma, keep 2 words. */
function nameKeyword(name: string): string {
  return name.split(',')[0].split(' ').slice(0, 2).join(' ');
}

export function foodImage(food: Food, size = 200): string {
  return url(`${nameKeyword(food.name)},food`, food.id, size);
}

export function recipeImage(recipe: Recipe, size = 400): string {
  return url(`${nameKeyword(recipe.name)},meal`, recipe.id, size);
}

/** Generic keyword thumbnail (for logged entries where we only have a name). */
export function keywordImage(keyword: string, id: string, suffix = 'food', size = 160): string {
  return url(`${nameKeyword(keyword)},${suffix}`, id, size);
}

export function exerciseImage(ex: ExerciseDef, size = 200): string {
  const kw =
    ex.category === 'cardio' || ex.category === 'sports'
      ? `${nameKeyword(ex.name)},fitness`
      : `${ex.equipment ?? 'gym'},workout`;
  return url(kw, ex.id, size);
}
