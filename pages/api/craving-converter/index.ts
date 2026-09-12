import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { CravingEntry, UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // ============ GET - Fetch history ============
  if (req.method === 'GET') {
    try {
      const entries = await CravingEntry.find({
        userId: session.user.id,
        saved: true,
      })
        .sort({ createdAt: -1 })
        .limit(20);

      return res.status(200).json({ success: true, entries });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching history' });
    }
  }

  // ============ POST - Convert craving ============
  if (req.method === 'POST') {
    try {
      const { action, craving, entryId } = req.body;

      // Save entry
      if (action === 'save') {
        await CravingEntry.findByIdAndUpdate(entryId, { saved: true });
        return res.status(200).json({ success: true, message: 'Saved!' });
      }

      // Delete entry
      if (action === 'delete') {
        await CravingEntry.findOneAndDelete({
          _id: entryId,
          userId: session.user.id,
        });
        return res.status(200).json({ success: true, message: 'Deleted' });
      }

      // Generate conversion
      if (!craving || !craving.trim()) {
        return res.status(400).json({ message: 'Please enter a craving' });
      }

      // Get user profile for personalization
      const profile = await UserProfile.findOne({ userId: session.user.id });
      const dietType = profile?.dietType || 'vegetarian';
      const allergies = profile?.mealPreferences?.allergies || profile?.allergies || [];

      const conversion = generateConversion(craving.trim(), dietType, allergies);

      // Save to database (unsaved by default)
      const entry = await CravingEntry.create({
        userId: session.user.id,
        craving: conversion.craving,
        healthyAlternative: conversion.healthyAlternative,
        originalCalories: conversion.originalCalories,
        healthyCalories: conversion.healthyCalories,
        caloriesSaved: conversion.caloriesSaved,
        cookingTime: conversion.cookingTime,
        ingredients: conversion.ingredients,
        steps: conversion.steps,
        nutrition: conversion.nutrition,
        tips: conversion.tips,
        saved: false,
      });

      return res.status(200).json({
        success: true,
        conversion,
        entryId: entry._id,
      });
    } catch (error: any) {
      console.error('Craving converter error:', error);
      return res.status(500).json({ message: 'Error generating conversion' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// ============================================================
// CRAVING → HEALTHY CONVERSION DATABASE
// ============================================================

const CONVERSION_DATABASE: any = {
  // ============ PIZZA ============
  pizza: {
    healthyAlternative: 'Whole Wheat Veggie Pizza',
    originalCalories: 285,
    healthyCalories: 165,
    cookingTime: 25,
    ingredients: [
      '2 whole wheat pizza base (or 2 whole wheat rotis)',
      '1/2 cup low-fat mozzarella cheese (or vegan cheese)',
      '1/2 cup tomato puree (no sugar added)',
      '1/2 cup mixed vegetables (bell peppers, onion, tomato, olives)',
      '1 tsp oregano + 1 tsp basil',
      '1 tsp olive oil',
      'Pinch of salt & black pepper',
    ],
    steps: [
      'Preheat oven to 200°C (400°F).',
      'Spread tomato puree evenly on the whole wheat base.',
      'Sprinkle oregano, basil, salt, and pepper.',
      'Add chopped vegetables and top with cheese.',
      'Drizzle 1 tsp olive oil on top.',
      'Bake for 12-15 minutes until golden and cheese melts.',
      'Slice and enjoy guilt-free!',
    ],
    nutrition: { protein: 11, carbs: 22, fat: 5, fiber: 4 },
    tips: [
      '💡 Use rotis instead of pizza base for even fewer calories.',
      '💡 Load up on veggies — they add volume and fiber without calories.',
      '💡 Skip processed cheese; use fresh mozzarella in small quantity.',
      '💡 Add a side salad to make it more filling.',
    ],
  },

  // ============ BURGER ============
  burger: {
    healthyAlternative: 'Grilled Chicken/Veggie Burger (Whole Wheat Bun)',
    originalCalories: 450,
    healthyCalories: 280,
    cookingTime: 20,
    ingredients: [
      '1 whole wheat burger bun',
      '1 grilled chicken breast OR 1 grilled veggie patty (chickpea/black bean)',
      '2 lettuce leaves',
      '1 tomato slice',
      '2 onion rings',
      '1 tsp Greek yogurt (or vegan mayo)',
      '1 tsp mustard',
      'Pinch of salt, pepper, paprika',
    ],
    steps: [
      'Season the patty with salt, pepper, and paprika.',
      'Grill on a non-stick pan for 4-5 minutes each side.',
      'Toast the bun lightly (no butter).',
      'Mix Greek yogurt + mustard for a healthy sauce.',
      'Layer: bun → sauce → lettuce → patty → tomato → onion → bun.',
      'Press gently and serve with a side salad or baked sweet potato wedges.',
    ],
    nutrition: { protein: 25, carbs: 30, fat: 8, fiber: 6 },
    tips: [
      '💡 Bake your own veggie patty using chickpeas + spices.',
      '💡 Skip the fries — serve with salad or baked sweet potato.',
      '💡 Use Greek yogurt instead of mayo to save 100+ calories.',
      '💡 Skip cheese slice — save another 80 calories.',
    ],
  },

  // ============ CHOCOLATE ============
  chocolate: {
    healthyAlternative: 'Dark Chocolate Oat Bites (Homemade)',
    originalCalories: 546,
    healthyCalories: 180,
    cookingTime: 15,
    ingredients: [
      '1 cup rolled oats',
      '2 tbsp unsweetened cocoa powder',
      '2 tbsp peanut butter (natural)',
      '2 tbsp honey or maple syrup',
      '1 tbsp dark chocolate chips (70%+)',
      '1 tsp vanilla extract',
      'Pinch of sea salt',
    ],
    steps: [
      'Mix oats, cocoa powder, and salt in a bowl.',
      'Add peanut butter, honey, and vanilla. Mix well.',
      'Fold in dark chocolate chips.',
      'Roll into small balls (about 12).',
      'Refrigerate for 30 minutes.',
      'Store in an airtight container for up to 5 days.',
    ],
    nutrition: { protein: 5, carbs: 22, fat: 7, fiber: 3 },
    tips: [
      '💡 Use 70%+ dark chocolate — less sugar, more antioxidants.',
      '💡 These satisfy chocolate cravings without the sugar crash.',
      '💡 Great pre-workout snack due to oats + peanut butter.',
      '💡 Add chopped nuts for extra protein.',
    ],
  },

  // ============ ICE CREAM ============
  'ice cream': {
    healthyAlternative: 'Frozen Banana Nice Cream',
    originalCalories: 207,
    healthyCalories: 105,
    cookingTime: 5,
    ingredients: [
      '2 frozen bananas (peel + freeze overnight)',
      '2 tbsp Greek yogurt OR coconut yogurt',
      '1 tsp honey or maple syrup',
      '1/2 tsp vanilla extract',
      'Optional: 1 tbsp cocoa powder for chocolate flavor',
      'Optional toppings: berries, nuts, dark chocolate chips',
    ],
    steps: [
      'Add frozen bananas, yogurt, honey, and vanilla to a blender.',
      'Blend until smooth and creamy (like soft-serve).',
      'For chocolate version, add cocoa powder.',
      'Serve immediately OR freeze for 1 hour for firmer texture.',
      'Top with fresh berries and chopped nuts.',
    ],
    nutrition: { protein: 4, carbs: 22, fat: 1, fiber: 3 },
    tips: [
      '💡 Frozen bananas create the same creamy texture without cream.',
      '💡 Zero added sugar if you skip honey.',
      '💡 Add peanut butter for a protein boost.',
      '💡 Make it in a food processor for best texture.',
    ],
  },

  // ============ FRIES ============
  fries: {
    healthyAlternative: 'Air-Fried Sweet Potato Wedges',
    originalCalories: 312,
    healthyCalories: 140,
    cookingTime: 25,
    ingredients: [
      '2 medium sweet potatoes',
      '1 tbsp olive oil',
      '1 tsp paprika',
      '1/2 tsp garlic powder',
      '1/2 tsp onion powder',
      'Pinch of salt & pepper',
      'Optional: fresh rosemary',
    ],
    steps: [
      'Wash and cut sweet potatoes into wedges (keep skin on).',
      'Soak in cold water for 10 min, then pat dry.',
      'Toss with olive oil, paprika, garlic, onion powder, salt, pepper.',
      'Air fry at 200°C (400°F) for 18-20 minutes, shaking halfway.',
      'OR bake in oven at 220°C (425°F) for 25 min.',
      'Garnish with fresh rosemary and serve.',
    ],
    nutrition: { protein: 2, carbs: 28, fat: 5, fiber: 4 },
    tips: [
      '💡 Sweet potatoes have more fiber and vitamins than regular potatoes.',
      '💡 Air fryer uses 90% less oil than deep frying.',
      '💡 Keep the skin on — that\'s where the fiber is.',
      '💡 Pair with Greek yogurt dip instead of ketchup.',
    ],
  },

  // ============ SAMOSA ============
  samosa: {
    healthyAlternative: 'Baked Veggie Samosa (Whole Wheat)',
    originalCalories: 262,
    healthyCalories: 145,
    cookingTime: 40,
    ingredients: [
      '1 cup whole wheat flour',
      '1 tsp oil + pinch of salt',
      'For filling: 2 boiled potatoes, 1/2 cup peas',
      '1 tsp cumin seeds, 1 tsp coriander powder',
      '1/2 tsp garam masala, 1/2 tsp amchur',
      '1 green chili (optional)',
      'Fresh coriander',
    ],
    steps: [
      'Mix flour, oil, salt, and water to form a stiff dough.',
      'Sauté cumin, potatoes, peas, spices for 5 minutes.',
      'Roll small dough balls, cut into semicircles.',
      'Fill with potato mixture, seal edges.',
      'Brush with a little oil.',
      'Bake at 180°C (350°F) for 25 min, flipping halfway.',
      'Serve with mint chutney.',
    ],
    nutrition: { protein: 5, carbs: 25, fat: 4, fiber: 4 },
    tips: [
      '💡 Baking saves 120+ calories vs deep frying.',
      '💡 Whole wheat adds fiber and keeps you full longer.',
      '💡 Add paneer to filling for extra protein.',
      '💡 Serve with yogurt-based mint chutney.',
    ],
  },

  // ============ PASTA ============
  pasta: {
    healthyAlternative: 'Whole Wheat Veggie Pasta',
    originalCalories: 380,
    healthyCalories: 220,
    cookingTime: 20,
    ingredients: [
      '1 cup whole wheat pasta (dry)',
      '1 cup mixed vegetables (zucchini, bell peppers, broccoli)',
      '1 cup tomato puree (homemade)',
      '2 garlic cloves',
      '1 tbsp olive oil',
      '1 tsp oregano + basil',
      '2 tbsp grated parmesan (optional)',
      'Salt & pepper',
    ],
    steps: [
      'Boil pasta in salted water until al dente.',
      'Sauté garlic in olive oil.',
      'Add veggies, cook for 5 min.',
      'Add tomato puree + herbs. Simmer 5 min.',
      'Toss in pasta.',
      'Top with parmesan and fresh basil.',
    ],
    nutrition: { protein: 10, carbs: 38, fat: 6, fiber: 6 },
    tips: [
      '💡 Whole wheat pasta has 3x the fiber of regular.',
      '💡 Load up on veggies — they add volume.',
      '💡 Skip cream-based sauces.',
      '💡 Add grilled chicken for protein.',
    ],
  },

  // ============ CAKE ============
  cake: {
    healthyAlternative: 'Oat & Banana Mug Cake',
    originalCalories: 350,
    healthyCalories: 195,
    cookingTime: 5,
    ingredients: [
      '1 ripe banana (mashed)',
      '3 tbsp rolled oats (ground)',
      '1 egg (or 1 tbsp flax + 3 tbsp water)',
      '1 tbsp cocoa powder (for chocolate)',
      '1 tsp honey',
      '1/4 tsp baking powder',
      'Pinch of cinnamon',
      'Optional: dark chocolate chips',
    ],
    steps: [
      'Mash banana in a mug.',
      'Add oats, egg, cocoa, honey, baking powder, cinnamon.',
      'Mix until smooth.',
      'Top with chocolate chips.',
      'Microwave for 90 seconds.',
      'Let cool 1 min, then enjoy!',
    ],
    nutrition: { protein: 8, carbs: 30, fat: 5, fiber: 4 },
    tips: [
      '💡 Single-serving — prevents overeating.',
      '💡 Banana provides natural sweetness.',
      '💡 Ready in under 3 minutes.',
      '💡 Add a dollop of Greek yogurt on top.',
    ],
  },

  // ============ COLD DRINK / SODA ============
  'cold drink': {
    healthyAlternative: 'Sparkling Lemon-Mint Cooler',
    originalCalories: 140,
    healthyCalories: 25,
    cookingTime: 3,
    ingredients: [
      '1 glass sparkling water (unsweetened)',
      'Juice of 1/2 lemon',
      '5-6 fresh mint leaves',
      '1 tsp honey (optional)',
      'Ice cubes',
      'Lemon slice for garnish',
    ],
    steps: [
      'Muddle mint leaves in a glass.',
      'Add lemon juice and honey.',
      'Add ice cubes.',
      'Pour sparkling water over.',
      'Stir gently and garnish with lemon slice.',
    ],
    nutrition: { protein: 0, carbs: 6, fat: 0, fiber: 0 },
    tips: [
      '💡 Saves 115+ calories vs soda.',
      '💡 Zero artificial sweeteners.',
      '💡 Add cucumber slices for extra freshness.',
      '💡 Sparkling water gives the same fizz without sugar.',
    ],
  },

  // ============ CHIPS ============
  chips: {
    healthyAlternative: 'Baked Kale or Sweet Potato Chips',
    originalCalories: 536,
    healthyCalories: 150,
    cookingTime: 20,
    ingredients: [
      '1 bunch kale (or 1 sweet potato, thinly sliced)',
      '1 tbsp olive oil',
      '1/2 tsp sea salt',
      '1/2 tsp paprika',
      'Optional: nutritional yeast',
    ],
    steps: [
      'Preheat oven to 175°C (350°F).',
      'Wash and thoroughly dry kale/sweet potato.',
      'Toss with olive oil, salt, paprika.',
      'Spread in a single layer on baking sheet.',
      'Bake 15-18 min until crispy.',
      'Cool for 2 min (they crisp more as they cool).',
    ],
    nutrition: { protein: 3, carbs: 18, fat: 6, fiber: 3 },
    tips: [
      '💡 Kale is a superfood — full of vitamins A, C, K.',
      '💡 1 cup kale chips = 30 cal vs 1 cup potato chips = 150 cal.',
      '💡 Make sure kale is completely dry before baking.',
      '💡 Store in airtight container for up to 3 days.',
    ],
  },

  // ============ DONUT ============
  donut: {
    healthyAlternative: 'Baked Oat Banana Donuts',
    originalCalories: 452,
    healthyCalories: 180,
    cookingTime: 20,
    ingredients: [
      '1 cup rolled oats (ground into flour)',
      '2 ripe bananas',
      '1 egg',
      '2 tbsp Greek yogurt',
      '1 tsp baking powder',
      '1 tsp cinnamon',
      '1 tbsp honey',
      'For glaze: 2 tbsp Greek yogurt + 1 tsp honey',
    ],
    steps: [
      'Preheat oven to 180°C (350°F).',
      'Blend all ingredients into a smooth batter.',
      'Pour into greased donut pan.',
      'Bake for 12-15 min.',
      'Cool completely.',
      'Whisk yogurt + honey for glaze, drizzle on top.',
    ],
    nutrition: { protein: 7, carbs: 30, fat: 3, fiber: 4 },
    tips: [
      '💡 Baking saves 250+ calories vs fried donuts.',
      '💡 Banana + honey provide natural sweetness.',
      '💡 Add cocoa powder for chocolate donuts.',
      '💡 Top with fresh berries for extra nutrients.',
    ],
  },

  // ============ NOODLES ============
  noodles: {
    healthyAlternative: 'Zucchini Noodles (Zoodles) with Veggies',
    originalCalories: 220,
    healthyCalories: 90,
    cookingTime: 15,
    ingredients: [
      '2 medium zucchini (spiralized)',
      '1 cup mixed vegetables',
      '2 garlic cloves',
      '1 tbsp olive oil',
      '2 tbsp low-sodium soy sauce',
      '1 tsp sesame oil',
      'Chili flakes, salt',
      'Optional: grilled chicken or tofu',
    ],
    steps: [
      'Spiralize zucchini into noodles.',
      'Sauté garlic in olive oil.',
      'Add veggies, stir-fry 3 min.',
      'Add zucchini noodles, toss 2 min.',
      'Add soy sauce + sesame oil.',
      'Top with protein and chili flakes.',
    ],
    nutrition: { protein: 4, carbs: 10, fat: 7, fiber: 3 },
    tips: [
      '💡 Zucchini noodles have 1/10 the carbs of regular noodles.',
      '💡 Don\'t overcook zoodles — they get soggy.',
      '💡 Add peanut sauce for Asian flavor.',
      '💡 Top with grilled chicken to make it a meal.',
    ],
  },

  // ============ PANCAKE ============
  pancake: {
    healthyAlternative: 'Banana Oat Pancakes',
    originalCalories: 227,
    healthyCalories: 165,
    cookingTime: 12,
    ingredients: [
      '2 ripe bananas',
      '1 cup rolled oats',
      '2 eggs',
      '1 tsp baking powder',
      '1 tsp cinnamon',
      '1 tsp vanilla',
      'Pinch of salt',
      'Toppings: fresh fruits, honey, Greek yogurt',
    ],
    steps: [
      'Blend bananas, oats, eggs, baking powder, cinnamon, vanilla until smooth.',
      'Let batter rest 5 min.',
      'Heat non-stick pan on medium.',
      'Pour 1/4 cup batter per pancake.',
      'Cook 2 min per side until golden.',
      'Top with fruits and honey.',
    ],
    nutrition: { protein: 9, carbs: 28, fat: 5, fiber: 4 },
    tips: [
      '💡 Oats + banana replace refined flour and sugar.',
      '💡 No added sugar needed.',
      '💡 Add protein powder for extra protein.',
      '💡 Make a big batch and freeze leftovers.',
    ],
  },
};

// ============================================================
// GENERATE CONVERSION
// ============================================================

function generateConversion(craving: string, dietType: string, allergies: string[]) {
  const lower = craving.toLowerCase().trim();

  // Try to find a match
  let matched: any = null;
  let matchedKey = '';

  for (const [key, value] of Object.entries(CONVERSION_DATABASE)) {
    if (lower.includes(key) || key.includes(lower)) {
      matched = value;
      matchedKey = key;
      break;
    }
  }

  // Fallback if no exact match — generate a generic healthy alternative
  if (!matched) {
    matched = generateGenericAlternative(craving);
    matchedKey = craving;
  }

  // Check allergies & swap if needed
  const allergyLower = allergies.map((a: string) => a.toLowerCase());

  // If user is vegan, swap dairy items
  if (dietType === 'vegan') {
    matched = adaptForVegan(matched);
  }

  // If user is vegetarian and alternative has chicken, swap to veggie
  if (dietType === 'vegetarian' || dietType === 'eggetarian') {
    matched = matched.healthyAlternative.includes('Chicken')
      ? {
          ...matched,
          healthyAlternative: matched.healthyAlternative.replace('Chicken', 'Veggie (chickpea)'),
          ingredients: matched.ingredients.map((i: string) =>
            i.includes('chicken') ? i.replace(/chicken[^,]*/gi, 'chickpea patty') : i
          ),
        }
      : matched;
  }

  // Check for allergy conflicts
  const conflictIngredients: string[] = [];
  for (const allergy of allergyLower) {
    for (const ing of matched.ingredients) {
      if (ing.toLowerCase().includes(allergy)) {
        conflictIngredients.push(ing);
      }
    }
  }

  // Add warning tip if conflicts found
  let tips = [...matched.tips];
  if (conflictIngredients.length > 0) {
    tips.unshift(
      `⚠️ Alert: This recipe contains ${conflictIngredients.join(', ')} which may conflict with your allergies. Please substitute or skip.`
    );
  }

  const caloriesSaved = matched.originalCalories - matched.healthyCalories;

  return {
    craving,
    healthyAlternative: matched.healthyAlternative,
    originalCalories: matched.originalCalories,
    healthyCalories: matched.healthyCalories,
    caloriesSaved,
    cookingTime: matched.cookingTime,
    ingredients: matched.ingredients,
    steps: matched.steps,
    nutrition: matched.nutrition,
    tips,
  };
}

function generateGenericAlternative(craving: string) {
  return {
    healthyAlternative: `Homemade Healthy ${craving.charAt(0).toUpperCase() + craving.slice(1)}`,
    originalCalories: 350,
    healthyCalories: 200,
    cookingTime: 25,
    ingredients: [
      'Fresh whole-food ingredients of your choice',
      'Minimal oil (1 tsp)',
      'Natural spices and herbs',
      'No refined sugar or flour',
      'Plenty of vegetables',
    ],
    steps: [
      'Identify the main unhealthy component of your craving (oil, sugar, refined flour).',
      'Replace with a healthier alternative (olive oil, honey, whole wheat).',
      'Add fiber-rich vegetables for volume.',
      'Cook using baking, grilling, or air-frying instead of deep-frying.',
      'Season with herbs and spices instead of heavy sauces.',
      'Enjoy in moderation.',
    ],
    nutrition: { protein: 10, carbs: 25, fat: 6, fiber: 4 },
    tips: [
      '💡 Homemade versions have 40-50% fewer calories.',
      '💡 Use whole-food ingredients whenever possible.',
      '💡 Bake or grill instead of deep-frying.',
      '💡 Add vegetables to increase fiber and fullness.',
    ],
  };
}

function adaptForVegan(recipe: any) {
  return {
    ...recipe,
    healthyAlternative: recipe.healthyAlternative
      .replace('Greek yogurt', 'coconut yogurt')
      .replace('Chicken', 'Vegan'),
    ingredients: recipe.ingredients.map((i: string) =>
      i
        .replace(/Greek yogurt/gi, 'coconut yogurt')
        .replace(/chicken breast/gi, 'tofu/tempeh')
        .replace(/cheese/gi, 'vegan cheese')
        .replace(/egg \(or[^)]*\)/gi, 'flax egg (1 tbsp flax + 3 tbsp water)')
        .replace(/^2 eggs/gi, '2 flax eggs')
        .replace(/^1 egg/gi, '1 flax egg')
        .replace(/honey/gi, 'maple syrup')
        .replace(/Greek yogurt/gi, 'coconut yogurt')
    ),
  };
}