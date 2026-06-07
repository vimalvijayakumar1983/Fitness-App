/**
 * Seed food database. A small but representative starter set spanning global
 * and Indian staples. In production this would be backed by a full nutrition
 * dataset (e.g. USDA FDC / IFCT) and barcode provider; the schema and search
 * API are designed to scale to that without changes.
 */
export interface SeedFood {
  name: string;
  brand?: string;
  serving: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  barcode?: string;
}

export const SEED_FOODS: SeedFood[] = [
  // Staples
  { name: 'Cooked white rice', serving: '1 cup (158 g)', calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { name: 'Cooked brown rice', serving: '1 cup (195 g)', calories: 218, protein: 5, carbs: 46, fat: 1.6 },
  { name: 'Roti / Chapati', serving: '1 medium (40 g)', calories: 120, protein: 3, carbs: 18, fat: 3.7 },
  { name: 'Whole wheat bread', serving: '1 slice (28 g)', calories: 69, protein: 3.6, carbs: 12, fat: 1 },
  { name: 'Oatmeal, cooked', serving: '1 cup (234 g)', calories: 158, protein: 6, carbs: 27, fat: 3.2 },
  { name: 'Idli', serving: '2 pieces', calories: 78, protein: 2.6, carbs: 17, fat: 0.2 },
  { name: 'Dosa, plain', serving: '1 medium', calories: 133, protein: 2.7, carbs: 18, fat: 5 },
  { name: 'Poha', serving: '1 cup', calories: 180, protein: 3.5, carbs: 33, fat: 4 },

  // Proteins
  { name: 'Chicken breast, grilled', serving: '100 g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Egg, boiled', serving: '1 large', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: 'Paneer', serving: '100 g', calories: 265, protein: 18, carbs: 1.2, fat: 21 },
  { name: 'Tofu, firm', serving: '100 g', calories: 144, protein: 17, carbs: 3, fat: 9 },
  { name: 'Dal (cooked lentils)', serving: '1 cup', calories: 230, protein: 18, carbs: 40, fat: 0.8 },
  { name: 'Chana masala (chickpeas)', serving: '1 cup', calories: 269, protein: 14, carbs: 45, fat: 4 },
  { name: 'Greek yogurt, plain', serving: '170 g', calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { name: 'Salmon, baked', serving: '100 g', calories: 206, protein: 22, carbs: 0, fat: 13 },

  // Fruits & vegetables
  { name: 'Banana', serving: '1 medium (118 g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Apple', serving: '1 medium (182 g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: 'Mango', serving: '1 cup (165 g)', calories: 99, protein: 1.4, carbs: 25, fat: 0.6 },
  { name: 'Mixed vegetable curry', serving: '1 cup', calories: 150, protein: 4, carbs: 18, fat: 7 },
  { name: 'Spinach, cooked', serving: '1 cup', calories: 41, protein: 5, carbs: 7, fat: 0.5 },
  { name: 'Broccoli, steamed', serving: '1 cup', calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },

  // Snacks & drinks
  { name: 'Almonds', serving: '28 g (~23 nuts)', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: 'Peanut butter', serving: '2 tbsp (32 g)', calories: 188, protein: 8, carbs: 6, fat: 16 },
  { name: 'Masala chai (with milk & sugar)', serving: '1 cup', calories: 105, protein: 2.5, carbs: 16, fat: 3.5 },
  { name: 'Black coffee', serving: '1 cup', calories: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: 'Whey protein shake', serving: '1 scoop (30 g)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Samosa', serving: '1 piece', calories: 262, protein: 4, carbs: 24, fat: 17 },
  { name: 'Dark chocolate (70%)', serving: '1 oz (28 g)', calories: 170, protein: 2, carbs: 13, fat: 12 },
];
