import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { RestaurantAnalysis, UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  await connectDB();

  // ============ GET ============
  if (req.method === 'GET') {
    try {
      const analyses = await RestaurantAnalysis.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(15);
      return res.status(200).json({ success: true, analyses });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching analyses' });
    }
  }

  // ============ POST ============
  if (req.method === 'POST') {
    try {
      const { action, analysisId, restaurantName, cuisineType, menuItems, menuText } = req.body;

      // Delete
      if (action === 'delete') {
        await RestaurantAnalysis.findOneAndDelete({
          _id: analysisId,
          userId: session.user.id,
        });
        return res.status(200).json({ success: true, message: 'Deleted' });
      }

      // Analyze
      if (!restaurantName || !restaurantName.trim()) {
        return res.status(400).json({ message: 'Please enter a restaurant name' });
      }

      const profile = await UserProfile.findOne({ userId: session.user.id });
      const userGoal = profile?.fitnessGoal || 'general-wellness';

      // Parse menu — if custom items are provided use them; otherwise generate from restaurant name
      let parsedItems: any[] = [];
      if (menuItems && Array.isArray(menuItems) && menuItems.length > 0) {
        parsedItems = menuItems.map((item: any) => analyzeMenuItem(item, userGoal));
      } else {
        parsedItems = generateMenuFor(restaurantName, cuisineType || 'mixed', userGoal);
      }

      // Categorize
      const recommended = parsedItems
        .filter((i) => i.verdict === 'excellent' || i.verdict === 'good')
        .sort((a, b) => b.healthScore - a.healthScore);
      const alternatives = parsedItems
        .filter((i) => i.verdict === 'moderate')
        .sort((a, b) => b.healthScore - a.healthScore);
      const avoid = parsedItems
        .filter((i) => i.verdict === 'avoid')
        .sort((a, b) => a.healthScore - b.healthScore);

      // Summary
      const bestPick = recommended[0];
      let summary = '';
      if (bestPick) {
        summary = `Based on your ${userGoal.replace(/-/g, ' ')} goal, we recommend "${bestPick.name}" (${bestPick.calories} kcal, ${bestPick.protein}g protein). ${bestPick.reason}`;
      } else if (alternatives.length > 0) {
        summary = `No excellent options found. Best available: "${alternatives[0].name}" (${alternatives[0].calories} kcal). Try to eat smaller portions and skip fried sides.`;
      } else {
        summary = `This menu is not aligned with your fitness goals. Consider a different restaurant or request a custom modification.`;
      }

      const analysis = await RestaurantAnalysis.create({
        userId: session.user.id,
        restaurantName,
        cuisineType: cuisineType || 'mixed',
        menuText: menuText || '',
        recommended,
        alternatives,
        avoid,
        summary,
        userGoal,
      });

      return res.status(200).json({
        success: true,
        message: 'Analysis complete!',
        analysis,
      });
    } catch (error: any) {
      console.error('Restaurant advisor error:', error);
      return res.status(500).json({ message: 'Error analyzing menu', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// ============================================================
// MENU ANALYSIS LOGIC
// ============================================================

function analyzeMenuItem(item: any, userGoal: string) {
  const calories = item.calories || 0;
  const protein = item.protein || 0;
  const carbs = item.carbs || 0;
  const fat = item.fat || 0;
  const fiber = item.fiber || 0;

  // Calculate health score (0-100)
  let score = 50;

  // Protein bonus
  if (protein >= 25) score += 20;
  else if (protein >= 15) score += 12;
  else if (protein >= 8) score += 5;

  // Fiber bonus
  if (fiber >= 6) score += 15;
  else if (fiber >= 3) score += 8;
  else if (fiber >= 1) score += 3;

  // Fat penalty
  if (fat > 30) score -= 20;
  else if (fat > 20) score -= 12;
  else if (fat > 12) score -= 5;

  // Calorie penalty (per item)
  if (calories > 800) score -= 20;
  else if (calories > 600) score -= 12;
  else if (calories > 450) score -= 5;

  // Goal-based adjustments
  if (userGoal === 'weight-loss') {
    if (calories > 500) score -= 10;
    if (fiber >= 4) score += 8;
  } else if (userGoal === 'muscle-gain' || userGoal === 'weight-gain') {
    if (protein >= 25) score += 10;
    if (calories < 300) score -= 5;
  } else if (userGoal === 'improve-fitness') {
    if (fat < 15 && protein >= 15) score += 8;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Determine verdict
  let verdict = 'moderate';
  let reason = '';

  if (score >= 75) {
    verdict = 'excellent';
    reason = `Great choice! High in protein (${protein}g) and fiber, low in unhealthy fats.`;
  } else if (score >= 55) {
    verdict = 'good';
    reason = `Solid option. Balanced macros with ${protein}g protein and ${calories} kcal.`;
  } else if (score >= 35) {
    verdict = 'moderate';
    reason = `Okay occasionally. ${calories} kcal with ${fat}g fat — portion control recommended.`;
  } else {
    verdict = 'avoid';
    reason = `High calorie (${calories} kcal) and fat (${fat}g). Not recommended for your goal.`;
  }

  // Add goal-specific reason
  if (userGoal === 'weight-loss' && calories > 600) {
    reason += ' Too many calories for weight loss.';
  }
  if (userGoal === 'muscle-gain' && protein >= 30) {
    reason += ' Excellent for muscle building!';
  }

  return {
    name: item.name,
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
    healthScore: score,
    verdict,
    reason,
  };
}

// ============================================================
// COMMON MENU GENERATOR
// ============================================================

function generateMenuFor(restaurantName: string, cuisineType: string, userGoal: string) {
  const name = restaurantName.toLowerCase();

  let menu: any[] = [];

  // Detect cuisine/type from name
  if (name.includes('pizza') || name.includes('domino') || name.includes('pizza hut')) {
    menu = [
      { name: 'Margherita Pizza (2 slices)', calories: 420, protein: 16, carbs: 52, fat: 14, fiber: 4 },
      { name: 'Veggie Delight Pizza (2 slices)', calories: 380, protein: 15, carbs: 48, fat: 12, fiber: 5 },
      { name: 'Pepperoni Pizza (2 slices)', calories: 550, protein: 22, carbs: 50, fat: 28, fiber: 3 },
      { name: 'Cheese Burst Pizza', calories: 680, protein: 24, carbs: 62, fat: 38, fiber: 3 },
      { name: 'Garlic Bread', calories: 290, protein: 6, carbs: 40, fat: 12, fiber: 2 },
      { name: 'Caesar Salad', calories: 180, protein: 8, carbs: 12, fat: 12, fiber: 4 },
      { name: 'Pasta Alfredo', calories: 620, protein: 18, carbs: 70, fat: 28, fiber: 4 },
      { name: 'Choco Lava Cake', calories: 380, protein: 5, carbs: 48, fat: 18, fiber: 2 },
      { name: 'Cold Coffee', calories: 240, protein: 4, carbs: 32, fat: 10, fiber: 1 },
    ];
  } else if (name.includes('burger') || name.includes('mcdonal') || name.includes('kfc') || name.includes('wendy')) {
    menu = [
      { name: 'Grilled Chicken Burger', calories: 420, protein: 30, carbs: 38, fat: 15, fiber: 4 },
      { name: 'Veggie Burger', calories: 380, protein: 14, carbs: 48, fat: 14, fiber: 6 },
      { name: 'Double Cheese Burger', calories: 720, protein: 34, carbs: 52, fat: 38, fiber: 3 },
      { name: 'Chicken Nuggets (6pc)', calories: 280, protein: 18, carbs: 18, fat: 16, fiber: 1 },
      { name: 'French Fries (Medium)', calories: 340, protein: 4, carbs: 44, fat: 16, fiber: 4 },
      { name: 'Chicken Salad', calories: 240, protein: 26, carbs: 12, fat: 10, fiber: 4 },
      { name: 'Grilled Chicken Wrap', calories: 400, protein: 28, carbs: 42, fat: 12, fiber: 5 },
      { name: 'Sundae Ice Cream', calories: 320, protein: 6, carbs: 52, fat: 10, fiber: 1 },
      { name: 'Cola (Large)', calories: 280, protein: 0, carbs: 70, fat: 0, fiber: 0 },
    ];
  } else if (name.includes('sub') || name.includes('sandwich') || name.includes('subway')) {
    menu = [
      { name: 'Grilled Chicken Sub (6")', calories: 320, protein: 26, carbs: 38, fat: 7, fiber: 5 },
      { name: 'Veggie Delight Sub (6")', calories: 230, protein: 9, carbs: 40, fat: 4, fiber: 5 },
      { name: 'Tuna Sub (6")', calories: 400, protein: 22, carbs: 42, fat: 16, fiber: 4 },
      { name: 'Chicken Tikka Sub (6")', calories: 350, protein: 24, carbs: 40, fat: 9, fiber: 5 },
      { name: 'Cookies (2pc)', calories: 400, protein: 4, carbs: 52, fat: 20, fiber: 2 },
      { name: 'Cold Drink', calories: 200, protein: 0, carbs: 50, fat: 0, fiber: 0 },
    ];
  } else if (name.includes('indian') || name.includes('curry') || name.includes('biryani') || name.includes('thali')) {
    menu = [
      { name: 'Tandoori Chicken (half)', calories: 320, protein: 42, carbs: 6, fat: 14, fiber: 1 },
      { name: 'Dal Tadka', calories: 220, protein: 12, carbs: 26, fat: 8, fiber: 6 },
      { name: 'Palak Paneer', calories: 380, protein: 18, carbs: 14, fat: 28, fiber: 4 },
      { name: 'Chicken Biryani', calories: 620, protein: 28, carbs: 78, fat: 22, fiber: 4 },
      { name: 'Veg Biryani', calories: 520, protein: 12, carbs: 82, fat: 16, fiber: 6 },
      { name: 'Butter Naan', calories: 260, protein: 7, carbs: 42, fat: 7, fiber: 2 },
      { name: 'Roti (2pc)', calories: 200, protein: 6, carbs: 42, fat: 1, fiber: 4 },
      { name: 'Butter Chicken', calories: 480, protein: 28, carbs: 12, fat: 34, fiber: 2 },
      { name: 'Paneer Tikka', calories: 340, protein: 20, carbs: 12, fat: 24, fiber: 3 },
      { name: 'Gulab Jamun (2pc)', calories: 300, protein: 3, carbs: 52, fat: 10, fiber: 0 },
    ];
  } else if (name.includes('chinese') || name.includes('noodle') || name.includes('wok')) {
    menu = [
      { name: 'Veg Hakka Noodles', calories: 480, protein: 12, carbs: 72, fat: 14, fiber: 5 },
      { name: 'Chicken Fried Rice', calories: 520, protein: 22, carbs: 68, fat: 18, fiber: 3 },
      { name: 'Veg Manchurian', calories: 320, protein: 8, carbs: 44, fat: 12, fiber: 4 },
      { name: 'Chicken Manchurian', calories: 400, protein: 22, carbs: 42, fat: 16, fiber: 3 },
      { name: 'Spring Rolls (2pc)', calories: 280, protein: 6, carbs: 34, fat: 14, fiber: 3 },
      { name: 'Sweet & Sour Chicken', calories: 440, protein: 24, carbs: 58, fat: 12, fiber: 4 },
      { name: 'Hot & Sour Soup', calories: 120, protein: 4, carbs: 16, fat: 4, fiber: 3 },
      { name: 'Chilli Paneer', calories: 380, protein: 18, carbs: 20, fat: 26, fiber: 3 },
    ];
  } else if (name.includes('cafe') || name.includes('coffee') || name.includes('starbucks')) {
    menu = [
      { name: 'Cappuccino (small)', calories: 120, protein: 6, carbs: 10, fat: 6, fiber: 0 },
      { name: 'Latte (small)', calories: 150, protein: 8, carbs: 14, fat: 7, fiber: 0 },
      { name: 'Cold Brew (unsweetened)', calories: 5, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      { name: 'Chicken Panini', calories: 400, protein: 24, carbs: 42, fat: 14, fiber: 4 },
      { name: 'Avocado Toast', calories: 320, protein: 8, carbs: 34, fat: 16, fiber: 6 },
      { name: 'Blueberry Muffin', calories: 380, protein: 6, carbs: 52, fat: 16, fiber: 2 },
      { name: 'Chocolate Brownie', calories: 420, protein: 5, carbs: 58, fat: 20, fiber: 2 },
      { name: 'Fresh Fruit Bowl', calories: 140, protein: 2, carbs: 34, fat: 1, fiber: 6 },
    ];
  } else {
    // Generic mixed menu
    menu = [
      { name: 'Grilled Chicken Salad', calories: 320, protein: 30, carbs: 14, fat: 14, fiber: 5 },
      { name: 'Vegetable Soup', calories: 120, protein: 4, carbs: 18, fat: 3, fiber: 4 },
      { name: 'Grilled Fish with Vegetables', calories: 380, protein: 34, carbs: 20, fat: 16, fiber: 5 },
      { name: 'Whole Wheat Pasta', calories: 480, protein: 16, carbs: 68, fat: 14, fiber: 8 },
      { name: 'Chicken Sandwich (whole wheat)', calories: 420, protein: 26, carbs: 42, fat: 14, fiber: 5 },
      { name: 'Veggie Wrap', calories: 360, protein: 12, carbs: 48, fat: 12, fiber: 7 },
      { name: 'Paneer Tikka', calories: 340, protein: 20, carbs: 12, fat: 24, fiber: 3 },
      { name: 'Fried Rice', calories: 520, protein: 12, carbs: 78, fat: 16, fiber: 4 },
      { name: 'Cheeseburger', calories: 680, protein: 30, carbs: 48, fat: 36, fiber: 3 },
      { name: 'French Fries', calories: 340, protein: 4, carbs: 44, fat: 16, fiber: 4 },
      { name: 'Chocolate Cake Slice', calories: 420, protein: 5, carbs: 54, fat: 20, fiber: 2 },
      { name: 'Soft Drink', calories: 250, protein: 0, carbs: 65, fat: 0, fiber: 0 },
    ];
  }

  // Analyze each item
  return menu.map((item) => analyzeMenuItem(item, userGoal));
}