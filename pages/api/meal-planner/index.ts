import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { MealPlan, UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // ============ GET ============
  if (req.method === 'GET') {
    try {
      const plans = await MealPlan.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10);
      return res.status(200).json({ success: true, plans });
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      return res.status(500).json({ message: 'Error fetching meal plans' });
    }
  }

  // ============ POST ============
  if (req.method === 'POST') {
    try {
      const { action, planId } = req.body;

      // ---------- GENERATE ----------
      if (action === 'generate') {
        const profile = await UserProfile.findOne({ userId: session.user.id });

        const goal = profile?.fitnessGoal || 'general-wellness';
        const dietType = profile?.dietType || 'vegetarian';
        const weight = profile?.weight || 70;
        const height = profile?.height || 170;
        const age = profile?.age || 25;
        const gender = profile?.gender || 'male';
        const activityLevel = profile?.activityLevel || 'moderate';

        // User preferences
        const mealPrefs = profile?.mealPreferences || {};
        const allergies = mealPrefs.allergies || profile?.allergies || [];
        const dislikes = mealPrefs.dislikes || [];
        const cuisinePreference = mealPrefs.cuisinePreference || 'mixed';
        const spiceLevel = mealPrefs.spiceLevel || 'medium';
        const mealComplexity = mealPrefs.mealComplexity || 'moderate';
        const includeSnacks = mealPrefs.includeSnacks !== false;
        const additionalNotes = mealPrefs.additionalNotes || '';

        // Calculate BMR
        let bmr = 0;
        if (gender === 'male') bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        else if (gender === 'female') bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        else bmr = 10 * weight + 6.25 * height - 5 * age - 78;

        const activityMultipliers: any = {
          sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, 'very-active': 1.9,
        };
        const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

        let targetCalories = tdee;
        if (goal === 'weight-loss') targetCalories = tdee - 500;
        else if (goal === 'weight-gain' || goal === 'muscle-gain') targetCalories = tdee + 300;
        targetCalories = Math.round(targetCalories);

        const plan = generateMealPlan(targetCalories, goal, dietType, {
          allergies, dislikes, cuisinePreference, spiceLevel, mealComplexity, includeSnacks, additionalNotes,
        });

        return res.status(200).json({
          success: true,
          message: 'Meal plan generated successfully!',
          plan,
          targetCalories,
        });
      }

      // ---------- SAVE ----------
      if (action === 'save') {
        const { planName, goal, totalCalories, totalProtein, totalCarbs, totalFat, days, preferences } = req.body;

        await MealPlan.updateMany(
          { userId: session.user.id, isActive: true },
          { isActive: false }
        );

        const plan = await MealPlan.create({
          userId: session.user.id,
          planName, goal, totalCalories, totalProtein, totalCarbs, totalFat, days,
          preferences: preferences || {},
          isActive: true,
        });

        return res.status(201).json({ success: true, message: 'Meal plan saved!', plan });
      }

      // ---------- DELETE ----------
      if (action === 'delete') {
        await MealPlan.findOneAndDelete({ _id: planId, userId: session.user.id });
        return res.status(200).json({ success: true, message: 'Plan deleted' });
      }

      return res.status(400).json({ message: 'Invalid action' });
    } catch (error: any) {
      console.error('Meal planner error:', error);
      return res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// ============================================================
// MEAL PLAN GENERATOR with preferences filtering
// ============================================================

const FOOD_DATABASE: any = {
  breakfast: {
    vegetarian: [
      { name: 'Oatmeal with fruits & nuts', calories: 350, protein: 12, carbs: 55, fat: 10, ingredients: ['oats', 'milk', 'banana', 'almonds'] },
      { name: 'Paneer paratha with curd', calories: 400, protein: 18, carbs: 45, fat: 15, ingredients: ['paneer', 'wheat', 'curd'] },
      { name: 'Poha with peanuts', calories: 300, protein: 8, carbs: 50, fat: 8, ingredients: ['rice flakes', 'peanuts', 'onion'] },
      { name: 'Idli with sambar', calories: 280, protein: 10, carbs: 48, fat: 5, ingredients: ['rice', 'lentils', 'vegetables'] },
      { name: 'Vegetable upma', calories: 320, protein: 9, carbs: 52, fat: 8, ingredients: ['semolina', 'vegetables'] },
      { name: 'Greek yogurt with granola', calories: 350, protein: 20, carbs: 45, fat: 10, ingredients: ['yogurt', 'granola', 'berries'] },
      { name: 'Masala dosa', calories: 380, protein: 8, carbs: 60, fat: 12, ingredients: ['rice', 'lentils', 'potato'] },
      { name: 'Aloo paratha with curd', calories: 420, protein: 12, carbs: 55, fat: 18, ingredients: ['wheat', 'potato', 'curd'] },
      { name: 'Besan chilla', calories: 300, protein: 15, carbs: 35, fat: 10, ingredients: ['chickpea flour', 'onion', 'tomato'] },
    ],
    vegan: [
      { name: 'Oatmeal with almond milk & berries', calories: 320, protein: 10, carbs: 55, fat: 8, ingredients: ['oats', 'almond milk', 'berries'] },
      { name: 'Avocado toast with seeds', calories: 380, protein: 10, carbs: 40, fat: 20, ingredients: ['bread', 'avocado', 'seeds'] },
      { name: 'Tofu scramble with veggies', calories: 300, protein: 20, carbs: 15, fat: 18, ingredients: ['tofu', 'peppers', 'onion'] },
      { name: 'Smoothie bowl with fruits', calories: 350, protein: 8, carbs: 65, fat: 6, ingredients: ['banana', 'berries', 'almond milk'] },
      { name: 'Peanut butter banana toast', calories: 400, protein: 12, carbs: 55, fat: 16, ingredients: ['bread', 'peanut butter', 'banana'] },
    ],
    'non-vegetarian': [
      { name: 'Egg omelette with toast', calories: 380, protein: 22, carbs: 35, fat: 18, ingredients: ['eggs', 'bread', 'cheese'] },
      { name: 'Boiled eggs with avocado', calories: 350, protein: 18, carbs: 12, fat: 25, ingredients: ['eggs', 'avocado'] },
      { name: 'Chicken sausage with eggs', calories: 420, protein: 28, carbs: 15, fat: 25, ingredients: ['chicken sausage', 'eggs'] },
      { name: 'Egg bhurji with paratha', calories: 450, protein: 22, carbs: 45, fat: 20, ingredients: ['eggs', 'wheat', 'onion'] },
      { name: 'Scrambled eggs with veggies', calories: 320, protein: 20, carbs: 10, fat: 22, ingredients: ['eggs', 'spinach', 'tomato'] },
    ],
    eggetarian: [
      { name: 'Egg omelette with toast', calories: 380, protein: 22, carbs: 35, fat: 18, ingredients: ['eggs', 'bread'] },
      { name: 'Boiled eggs with toast', calories: 320, protein: 18, carbs: 30, fat: 14, ingredients: ['eggs', 'bread'] },
      { name: 'Egg bhurji with roti', calories: 400, protein: 22, carbs: 40, fat: 18, ingredients: ['eggs', 'wheat'] },
    ],
  },
  lunch: {
    vegetarian: [
      { name: 'Rajma chawal with salad', calories: 550, protein: 20, carbs: 85, fat: 12, ingredients: ['kidney beans', 'rice', 'vegetables'] },
      { name: 'Paneer butter masala with roti', calories: 600, protein: 22, carbs: 65, fat: 25, ingredients: ['paneer', 'tomato', 'cream', 'wheat'] },
      { name: 'Dal makhani with rice', calories: 550, protein: 18, carbs: 78, fat: 15, ingredients: ['lentils', 'cream', 'rice'] },
      { name: 'Vegetable biryani with raita', calories: 600, protein: 15, carbs: 90, fat: 18, ingredients: ['rice', 'vegetables', 'yogurt'] },
      { name: 'Chole with bhature', calories: 650, protein: 20, carbs: 85, fat: 25, ingredients: ['chickpeas', 'flour'] },
      { name: 'Mixed vegetable curry with roti', calories: 500, protein: 15, carbs: 70, fat: 15, ingredients: ['vegetables', 'wheat'] },
      { name: 'Palak paneer with rice', calories: 550, protein: 22, carbs: 65, fat: 20, ingredients: ['spinach', 'paneer', 'rice'] },
      { name: 'Veg thali (dal, sabzi, roti, rice)', calories: 600, protein: 20, carbs: 90, fat: 15, ingredients: ['lentils', 'vegetables', 'wheat', 'rice'] },
    ],
    vegan: [
      { name: 'Chickpea salad bowl', calories: 450, protein: 18, carbs: 60, fat: 15, ingredients: ['chickpeas', 'vegetables', 'olive oil'] },
      { name: 'Tofu stir-fry with rice', calories: 500, protein: 22, carbs: 65, fat: 16, ingredients: ['tofu', 'vegetables', 'rice'] },
      { name: 'Lentil soup with bread', calories: 400, protein: 20, carbs: 55, fat: 10, ingredients: ['lentils', 'bread'] },
      { name: 'Quinoa vegetable bowl', calories: 480, protein: 18, carbs: 70, fat: 12, ingredients: ['quinoa', 'vegetables'] },
      { name: 'Vegan Buddha bowl', calories: 520, protein: 16, carbs: 75, fat: 18, ingredients: ['grains', 'vegetables', 'tahini'] },
    ],
    'non-vegetarian': [
      { name: 'Grilled chicken with rice', calories: 600, protein: 40, carbs: 70, fat: 15, ingredients: ['chicken', 'rice', 'vegetables'] },
      { name: 'Fish curry with rice', calories: 550, protein: 35, carbs: 65, fat: 18, ingredients: ['fish', 'rice', 'coconut'] },
      { name: 'Chicken biryani with raita', calories: 700, protein: 35, carbs: 85, fat: 22, ingredients: ['chicken', 'rice', 'yogurt'] },
      { name: 'Tandoori chicken with salad', calories: 500, protein: 45, carbs: 20, fat: 25, ingredients: ['chicken', 'vegetables'] },
      { name: 'Egg curry with rice', calories: 520, protein: 22, carbs: 65, fat: 18, ingredients: ['eggs', 'rice', 'tomato'] },
    ],
    eggetarian: [
      { name: 'Egg curry with rice', calories: 520, protein: 22, carbs: 65, fat: 18, ingredients: ['eggs', 'rice'] },
      { name: 'Egg fried rice', calories: 550, protein: 20, carbs: 75, fat: 18, ingredients: ['eggs', 'rice', 'vegetables'] },
      { name: 'Egg salad sandwich', calories: 450, protein: 22, carbs: 45, fat: 20, ingredients: ['eggs', 'bread', 'mayonnaise'] },
    ],
  },
  dinner: {
    vegetarian: [
      { name: 'Vegetable khichdi', calories: 400, protein: 15, carbs: 60, fat: 10, ingredients: ['rice', 'lentils', 'vegetables'] },
      { name: 'Paneer tikka with salad', calories: 450, protein: 28, carbs: 20, fat: 25, ingredients: ['paneer', 'vegetables'] },
      { name: 'Dal tadka with roti', calories: 420, protein: 18, carbs: 55, fat: 12, ingredients: ['lentils', 'wheat'] },
      { name: 'Vegetable pulao with raita', calories: 480, protein: 12, carbs: 75, fat: 14, ingredients: ['rice', 'vegetables', 'yogurt'] },
      { name: 'Palak paneer with roti', calories: 480, protein: 22, carbs: 45, fat: 22, ingredients: ['spinach', 'paneer', 'wheat'] },
      { name: 'Vegetable soup with bread', calories: 300, protein: 10, carbs: 45, fat: 8, ingredients: ['vegetables', 'bread'] },
    ],
    vegan: [
      { name: 'Vegetable stir-fry with tofu', calories: 420, protein: 20, carbs: 45, fat: 18, ingredients: ['tofu', 'vegetables'] },
      { name: 'Lentil curry with rice', calories: 480, protein: 18, carbs: 75, fat: 10, ingredients: ['lentils', 'rice'] },
      { name: 'Vegan pasta with vegetables', calories: 450, protein: 14, carbs: 70, fat: 12, ingredients: ['pasta', 'vegetables'] },
      { name: 'Chickpea curry with quinoa', calories: 500, protein: 20, carbs: 70, fat: 14, ingredients: ['chickpeas', 'quinoa'] },
    ],
    'non-vegetarian': [
      { name: 'Grilled fish with vegetables', calories: 450, protein: 35, carbs: 25, fat: 22, ingredients: ['fish', 'vegetables'] },
      { name: 'Chicken curry with roti', calories: 520, protein: 35, carbs: 45, fat: 22, ingredients: ['chicken', 'wheat'] },
      { name: 'Egg curry with roti', calories: 480, protein: 22, carbs: 50, fat: 20, ingredients: ['eggs', 'wheat'] },
      { name: 'Chicken tikka with salad', calories: 420, protein: 40, carbs: 15, fat: 22, ingredients: ['chicken', 'vegetables'] },
      { name: 'Prawn masala with rice', calories: 550, protein: 30, carbs: 65, fat: 18, ingredients: ['prawns', 'rice'] },
    ],
    eggetarian: [
      { name: 'Egg curry with roti', calories: 480, protein: 22, carbs: 50, fat: 20, ingredients: ['eggs', 'wheat'] },
      { name: 'Egg bhurji with roti', calories: 450, protein: 22, carbs: 45, fat: 18, ingredients: ['eggs', 'wheat'] },
      { name: 'Boiled eggs with salad', calories: 350, protein: 20, carbs: 15, fat: 22, ingredients: ['eggs', 'vegetables'] },
    ],
  },
  snacks: {
    vegetarian: [
      { name: 'Greek yogurt with honey', calories: 150, protein: 15, carbs: 20, fat: 3, ingredients: ['yogurt', 'honey'] },
      { name: 'Mixed nuts (30g)', calories: 180, protein: 6, carbs: 6, fat: 16, ingredients: ['almonds', 'walnuts', 'cashews'] },
      { name: 'Fruit bowl', calories: 120, protein: 2, carbs: 30, fat: 1, ingredients: ['apple', 'banana', 'orange'] },
      { name: 'Cheese cubes', calories: 150, protein: 10, carbs: 2, fat: 12, ingredients: ['cheese'] },
      { name: 'Banana with peanut butter', calories: 200, protein: 7, carbs: 28, fat: 8, ingredients: ['banana', 'peanut butter'] },
      { name: 'Buttermilk with roasted seeds', calories: 120, protein: 6, carbs: 10, fat: 6, ingredients: ['buttermilk', 'seeds'] },
    ],
    vegan: [
      { name: 'Trail mix', calories: 180, protein: 6, carbs: 18, fat: 10, ingredients: ['nuts', 'dried fruits'] },
      { name: 'Apple with almond butter', calories: 190, protein: 5, carbs: 25, fat: 9, ingredients: ['apple', 'almond butter'] },
      { name: 'Roasted chickpeas', calories: 150, protein: 8, carbs: 20, fat: 5, ingredients: ['chickpeas'] },
      { name: 'Coconut yogurt with berries', calories: 140, protein: 3, carbs: 20, fat: 6, ingredients: ['coconut yogurt', 'berries'] },
    ],
    'non-vegetarian': [
      { name: 'Boiled eggs (2)', calories: 155, protein: 13, carbs: 1, fat: 11, ingredients: ['eggs'] },
      { name: 'Chicken salad', calories: 200, protein: 20, carbs: 5, fat: 10, ingredients: ['chicken', 'vegetables'] },
      { name: 'Tuna with crackers', calories: 180, protein: 15, carbs: 15, fat: 5, ingredients: ['tuna', 'crackers'] },
      { name: 'Greek yogurt with honey', calories: 150, protein: 15, carbs: 20, fat: 3, ingredients: ['yogurt', 'honey'] },
    ],
    eggetarian: [
      { name: 'Boiled eggs (2)', calories: 155, protein: 13, carbs: 1, fat: 11, ingredients: ['eggs'] },
      { name: 'Greek yogurt with honey', calories: 150, protein: 15, carbs: 20, fat: 3, ingredients: ['yogurt', 'honey'] },
      { name: 'Cheese cubes', calories: 150, protein: 10, carbs: 2, fat: 12, ingredients: ['cheese'] },
    ],
  },
};

// ============ PREFERENCE FILTER ============
function filterByPreferences(items: any[], allergies: string[], dislikes: string[]): any[] {
  const allergyKeywords = allergies.map(a => a.toLowerCase().trim()).filter(Boolean);
  const dislikeKeywords = dislikes.map(d => d.toLowerCase().trim()).filter(Boolean);

  return items.filter(item => {
    const itemName = item.name.toLowerCase();
    const ingredients = (item.ingredients || []).map((i: string) => i.toLowerCase());

    // Check allergies
    for (const allergy of allergyKeywords) {
      if (itemName.includes(allergy)) return false;
      if (ingredients.some((ing: string) => ing.includes(allergy))) return false;
    }

    // Check dislikes
    for (const dislike of dislikeKeywords) {
      if (itemName.includes(dislike)) return false;
      if (ingredients.some((ing: string) => ing.includes(dislike))) return false;
    }

    return true;
  });
}

function getRandomItem(arr: any[]) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMealPlan(
  targetCalories: number,
  goal: string,
  dietType: string,
  preferences: any
) {
  const diet =
    dietType === 'vegan' ? 'vegan'
    : dietType === 'non-vegetarian' ? 'non-vegetarian'
    : dietType === 'eggetarian' ? 'eggetarian'
    : 'vegetarian';

  const { allergies = [], dislikes = [], includeSnacks = true, spiceLevel, cuisinePreference, additionalNotes } = preferences;

  // Filter database by preferences
  const breakfastPool = filterByPreferences(FOOD_DATABASE.breakfast[diet], allergies, dislikes);
  const lunchPool = filterByPreferences(FOOD_DATABASE.lunch[diet], allergies, dislikes);
  const dinnerPool = filterByPreferences(FOOD_DATABASE.dinner[diet], allergies, dislikes);
  const snackPool = filterByPreferences(FOOD_DATABASE.snacks[diet], allergies, dislikes);

  // Fallbacks (if all filtered out)
  const safeBreakfast = breakfastPool.length > 0 ? breakfastPool : FOOD_DATABASE.breakfast[diet];
  const safeLunch = lunchPool.length > 0 ? lunchPool : FOOD_DATABASE.lunch[diet];
  const safeDinner = dinnerPool.length > 0 ? dinnerPool : FOOD_DATABASE.dinner[diet];
  const safeSnacks = snackPool.length > 0 ? snackPool : FOOD_DATABASE.snacks[diet];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const planDays: any[] = [];

  // Shuffle helper
  const shuffle = (arr: any[]) => [...arr].sort(() => 0.5 - Math.random());

  const shuffledBreakfast = shuffle(safeBreakfast);
  const shuffledLunch = shuffle(safeLunch);
  const shuffledDinner = shuffle(safeDinner);
  const shuffledSnacks = shuffle(safeSnacks);

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const breakfast = shuffledBreakfast[i % shuffledBreakfast.length];
    const lunch = shuffledLunch[i % shuffledLunch.length];
    const dinner = shuffledDinner[i % shuffledDinner.length];

    const snacks: any[] = [];
    if (includeSnacks) {
      const snack1 = shuffledSnacks[(i * 2) % shuffledSnacks.length];
      const snack2 = shuffledSnacks[(i * 2 + 1) % shuffledSnacks.length];
      snacks.push(
        { name: snack1.name, calories: snack1.calories, protein: snack1.protein, carbs: snack1.carbs, fat: snack1.fat },
        { name: snack2.name, calories: snack2.calories, protein: snack2.protein, carbs: snack2.carbs, fat: snack2.fat }
      );
    }

    planDays.push({
      day,
      breakfast: { name: breakfast.name, calories: breakfast.calories, protein: breakfast.protein, carbs: breakfast.carbs, fat: breakfast.fat },
      lunch: { name: lunch.name, calories: lunch.calories, protein: lunch.protein, carbs: lunch.carbs, fat: lunch.fat },
      dinner: { name: dinner.name, calories: dinner.calories, protein: dinner.protein, carbs: dinner.carbs, fat: dinner.fat },
      snacks,
    });
  }

  // Compute averages
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  for (const d of planDays) {
    const snackCal = d.snacks.reduce((s: number, sn: any) => s + sn.calories, 0);
    const snackPro = d.snacks.reduce((s: number, sn: any) => s + sn.protein, 0);
    const snackCarb = d.snacks.reduce((s: number, sn: any) => s + sn.carbs, 0);
    const snackFat = d.snacks.reduce((s: number, sn: any) => s + sn.fat, 0);
    totalCalories += d.breakfast.calories + d.lunch.calories + d.dinner.calories + snackCal;
    totalProtein += d.breakfast.protein + d.lunch.protein + d.dinner.protein + snackPro;
    totalCarbs += d.breakfast.carbs + d.lunch.carbs + d.dinner.carbs + snackCarb;
    totalFat += d.breakfast.fat + d.lunch.fat + d.dinner.fat + snackFat;
  }
  const dayCount = planDays.length;
  totalCalories = Math.round(totalCalories / dayCount);
  totalProtein = Math.round(totalProtein / dayCount);
  totalCarbs = Math.round(totalCarbs / dayCount);
  totalFat = Math.round(totalFat / dayCount);

  const planName =
    goal === 'weight-loss' ? '7-Day Weight Loss Plan'
    : goal === 'muscle-gain' ? '7-Day Muscle Building Plan'
    : goal === 'weight-gain' ? '7-Day Weight Gain Plan'
    : goal === 'maintain-weight' ? '7-Day Maintenance Plan'
    : '7-Day Balanced Wellness Plan';

  return {
    planName,
    goal,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    days: planDays,
    preferences: {
      allergies, dislikes, includeSnacks, spiceLevel, cuisinePreference, additionalNotes,
    },
  };
}