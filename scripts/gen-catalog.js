/*
 * Extracts the app's bundled FOODS / EXERCISES / RECIPES arrays into
 * server/src/seed/catalog.json so the backend can seed the full catalog.
 * The data objects are valid JS literals, so we bracket-match and eval them.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'data');
const OUT = path.join(__dirname, '..', 'server', 'src', 'seed', 'catalog.json');

function extractArray(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('marker not found: ' + marker);
  const eq = src.indexOf('=', i);
  const start = src.indexOf('[', eq);
  let depth = 0;
  for (let j = start; j < src.length; j++) {
    const ch = src[j];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        // eslint-disable-next-line no-eval
        return eval('(' + src.slice(start, j + 1) + ')');
      }
    }
  }
  throw new Error('unbalanced array for ' + marker);
}

const foods = extractArray(fs.readFileSync(path.join(SRC, 'foods.ts'), 'utf8'), 'export const FOODS');
const exercises = extractArray(fs.readFileSync(path.join(SRC, 'exercises.ts'), 'utf8'), 'export const EXERCISES');
const recipes = extractArray(fs.readFileSync(path.join(SRC, 'recipes.ts'), 'utf8'), 'export const RECIPES');

fs.writeFileSync(OUT, JSON.stringify({ foods, exercises, recipes }, null, 0));
console.log(`catalog.json written: ${foods.length} foods, ${exercises.length} exercises, ${recipes.length} recipes`);
