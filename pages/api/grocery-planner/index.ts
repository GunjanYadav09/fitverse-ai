import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { GroceryList, MealPlan } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  await connectDB();

  // ============ GET ============
  if (req.method === 'GET') {
    try {
      const lists = await GroceryList.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10);
      return res.status(200).json({ success: true, lists });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching lists' });
    }
  }

  // ============ POST ============
  if (req.method === 'POST') {
    try {
      const { action, listId, itemId } = req.body;

      // -------- GENERATE FROM MEAL PLAN --------
      if (action === 'generate') {
        // Get latest meal plan
        const mealPlan = await MealPlan.findOne({ userId: session.user.id })
          .sort({ createdAt: -1 });

        let items: any[] = [];
        let listName = 'Weekly Grocery List';
        let mealPlanId = null;

        if (mealPlan) {
          // Extract unique ingredients from meal plan
          const ingredientMap = new Map<string, number>();
          mealPlan.days.forEach((day: any) => {
            // For each meal type, extract ingredients if available
            const meals = [
              day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])
            ];
            meals.forEach((meal: any) => {
              if (meal && meal.name) {
                // Simple ingredient extraction from food name
                extractIngredients(meal.name).forEach((ing) => {
                  ingredientMap.set(ing, (ingredientMap.get(ing) || 0) + 1);
                });
              }
            });
          });

          // Convert map to items
          for (const [name, count] of ingredientMap.entries()) {
            items.push({
              name,
              quantity: count > 1 ? `${count} portions` : '1 portion',
              category: categorizeIngredient(name),
              estimatedCost: estimateCost(name),
              checked: false,
              fromMealPlan: true,
            });
          }

          listName = `${mealPlan.planName} - Grocery List`;
          mealPlanId = mealPlan._id;
        }

        // Add common staples if list is short
        if (items.length < 8) {
          const staples = getCommonStaples();
          items = [...items, ...staples];
        }

        // Deduplicate
        const uniqueItems = Array.from(
          new Map(items.map((i) => [i.name.toLowerCase(), i])).values()
        );

        const totalEstimated = uniqueItems.reduce((s: number, i: any) => s + (i.estimatedCost || 0), 0);

        const groceryList = await GroceryList.create({
          userId: session.user.id,
          listName,
          items: uniqueItems,
          totalItems: uniqueItems.length,
          estimatedTotal: Math.round(totalEstimated),
          mealPlanId,
        });

        return res.status(200).json({
          success: true,
          message: 'Grocery list generated!',
          list: groceryList,
        });
      }

      // -------- TOGGLE ITEM --------
      if (action === 'toggle') {
        const list = await GroceryList.findOne({
          _id: listId,
          userId: session.user.id,
        });
        if (!list) return res.status(404).json({ message: 'List not found' });

        const item = list.items.id(itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        item.checked = !item.checked;
        list.checkedItems = list.items.filter((i: any) => i.checked).length;
        await list.save();

        return res.status(200).json({ success: true, list });
      }

      // -------- ADD CUSTOM ITEM --------
      if (action === 'add-item') {
        const { listId: id, name, quantity, category } = req.body;
        const list = await GroceryList.findOne({ _id: id, userId: session.user.id });
        if (!list) return res.status(404).json({ message: 'List not found' });

        list.items.push({
          name,
          quantity: quantity || '1',
          category: category || 'other',
          estimatedCost: estimateCost(name),
          checked: false,
          fromMealPlan: false,
        });
        list.totalItems = list.items.length;
        list.estimatedTotal = list.items.reduce((s: number, i: any) => s + (i.estimatedCost || 0), 0);
        await list.save();

        return res.status(200).json({ success: true, list });
      }

      // -------- REMOVE ITEM --------
      if (action === 'remove-item') {
        const list = await GroceryList.findOne({ _id: listId, userId: session.user.id });
        if (!list) return res.status(404).json({ message: 'List not found' });

        const item = list.items.id(itemId);
        if (item) item.deleteOne();

        list.totalItems = list.items.length;
        list.checkedItems = list.items.filter((i: any) => i.checked).length;
        list.estimatedTotal = list.items.reduce((s: number, i: any) => s + (i.estimatedCost || 0), 0);
        await list.save();

        return res.status(200).json({ success: true, list });
      }

      // -------- RESET CHECKED --------
      if (action === 'reset') {
        const list = await GroceryList.findOne({ _id: listId, userId: session.user.id });
        if (!list) return res.status(404).json({ message: 'List not found' });

        list.items.forEach((i: any) => (i.checked = false));
        list.checkedItems = 0;
        await list.save();

        return res.status(200).json({ success: true, list });
      }

      // -------- DELETE LIST --------
      if (action === 'delete') {
        await GroceryList.findOneAndDelete({ _id: listId, userId: session.user.id });
        return res.status(200).json({ success: true, message: 'Deleted' });
      }

      return res.status(400).json({ message: 'Invalid action' });
    } catch (error: any) {
      console.error('Grocery planner error:', error);
      return res.status(500).json({ message: 'Error processing request', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// ============================================================
// HELPERS
// ============================================================

function extractIngredients(mealName: string): string[] {
  const lower = mealName.toLowerCase();
  const ingredients: string[] = [];

  // Common ingredient keywords found in meal names
  const keywordMap: any = {
    'paneer': 'Paneer',
    'chicken': 'Chicken',
    'fish': 'Fish',
    'egg': 'Eggs',
    'tofu': 'Tofu',
    'rice': 'Rice',
    'roti': 'Whole Wheat Flour',
    'paratha': 'Whole Wheat Flour',
    'bread': 'Bread',
    'pasta': 'Pasta',
    'noodles': 'Noodles',
    'dal': 'Lentils (Dal)',
    'rajma': 'Kidney Beans',
    'chole': 'Chickpeas',
    'chickpea': 'Chickpeas',
    'lentil': 'Lentils',
    'quinoa': 'Quinoa',
    'oats': 'Rolled Oats',
    'oatmeal': 'Rolled Oats',
    'yogurt': 'Yogurt',
    'curd': 'Curd',
    'milk': 'Milk',
    'cheese': 'Cheese',
    'butter': 'Butter',
    'cream': 'Cream',
    'banana': 'Bananas',
    'apple': 'Apples',
    'mango': 'Mangoes',
    'berries': 'Berries',
    'spinach': 'Spinach',
    'palak': 'Spinach',
    'potato': 'Potatoes',
    'aloo': 'Potatoes',
    'tomato': 'Tomatoes',
    'onion': 'Onions',
    'garlic': 'Garlic',
    'ginger': 'Ginger',
    'carrot': 'Carrots',
    'broccoli': 'Broccoli',
    'peas': 'Peas',
    'vegetables': 'Mixed Vegetables',
    'salad': 'Salad Greens',
    'avocado': 'Avocado',
    'peanut': 'Peanut Butter',
    'almond': 'Almonds',
    'walnut': 'Walnuts',
    'cashew': 'Cashews',
    'nuts': 'Mixed Nuts',
    'honey': 'Honey',
    'chocolate': 'Dark Chocolate',
    'cocoa': 'Cocoa Powder',
    'soup': 'Soup Base',
    'idli': 'Idli Batter',
    'dosa': 'Dosa Batter',
    'sambar': 'Sambar Powder',
    'upma': 'Semolina (Rava)',
    'poha': 'Poha (Flattened Rice)',
    'khichdi': 'Rice + Lentils',
    'biryani': 'Basmati Rice',
    'pulao': 'Basmati Rice',
    'smoothie': 'Fruits',
    'sandwich': 'Bread',
    'burger': 'Burger Buns',
    'pizza': 'Pizza Base',
    'tikka': 'Paneer/Chicken',
    'curry': 'Curry Base (Tomato + Onion)',
  };

  for (const [key, value] of Object.entries(keywordMap)) {
    if (lower.includes(key)) {
      if (!ingredients.includes(value)) ingredients.push(value);
    }
  }

  // If no match, add generic items
  if (ingredients.length === 0) {
    ingredients.push('Mixed Vegetables', 'Spices');
  }

  return ingredients;
}

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();

  const categories: any = {
    produce: ['spinach', 'palak', 'potato', 'aloo', 'tomato', 'onion', 'garlic', 'ginger',
      'carrot', 'broccoli', 'peas', 'vegetables', 'salad', 'avocado', 'banana', 'apple',
      'mango', 'berries', 'fruits', 'cucumber', 'lemon', 'coriander', 'mint', 'chili', 'bell pepper'],
    dairy: ['milk', 'curd', 'yogurt', 'cheese', 'paneer', 'butter', 'cream', 'ghee'],
    protein: ['chicken', 'fish', 'egg', 'tofu', 'prawn', 'mutton', 'beef', 'soy'],
    grains: ['rice', 'wheat', 'flour', 'bread', 'pasta', 'noodles', 'oats', 'quinoa',
      'semolina', 'rava', 'poha', 'basmati', 'burger buns', 'pizza base', 'idli batter',
      'dosa batter'],
    spices: ['spice', 'masala', 'sambar powder', 'curry base', 'salt', 'pepper', 'cumin',
      'coriander powder', 'turmeric', 'chili powder', 'garam masala', 'cardamom', 'cloves'],
    pantry: ['lentils', 'dal', 'chickpeas', 'kidney beans', 'sugar', 'honey', 'oil',
      'olive oil', 'cocoa', 'chocolate', 'peanut butter', 'nuts', 'almonds', 'walnuts',
      'cashews', 'soup base'],
    frozen: ['frozen', 'ice'],
    beverages: ['juice', 'water', 'tea', 'coffee', 'drink'],
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if ((keywords as string[]).some((k) => lower.includes(k))) {
      return cat;
    }
  }
  return 'other';
}

function estimateCost(name: string): number {
  const lower = name.toLowerCase();
  const costMap: any = {
    'paneer': 90, 'chicken': 180, 'fish': 200, 'egg': 60, 'tofu': 100,
    'rice': 70, 'wheat': 50, 'flour': 50, 'bread': 45, 'pasta': 90, 'noodles': 60,
    'oats': 120, 'quinoa': 180, 'milk': 60, 'curd': 50, 'yogurt': 70, 'cheese': 150,
    'butter': 120, 'cream': 80, 'dal': 120, 'lentils': 120, 'chickpeas': 80,
    'kidney beans': 90, 'spinach': 30, 'potato': 40, 'tomato': 40, 'onion': 35,
    'garlic': 30, 'ginger': 40, 'carrot': 40, 'broccoli': 60, 'peas': 60,
    'vegetables': 80, 'salad': 50, 'avocado': 120, 'banana': 50, 'apple': 120,
    'mango': 100, 'berries': 180, 'fruits': 120, 'nuts': 250, 'almonds': 300,
    'walnuts': 350, 'cashews': 320, 'peanut butter': 250, 'honey': 200,
    'chocolate': 150, 'cocoa': 180, 'oil': 150, 'olive oil': 350, 'sugar': 50,
    'salt': 20, 'spices': 100, 'masala': 80, 'sambar powder': 60, 'curry base': 80,
    'basmati': 150, 'poha': 50, 'semolina': 60, 'rava': 60, 'idli batter': 70,
    'dosa batter': 70, 'soup base': 80, 'pizza base': 80, 'burger buns': 60,
  };

  for (const [key, cost] of Object.entries(costMap)) {
    if (lower.includes(key)) return cost as number;
  }
  return 50; // Default
}

function getCommonStaples() {
  return [
    { name: 'Salt', quantity: '1 pack', category: 'spices', estimatedCost: 20, checked: false, fromMealPlan: false },
    { name: 'Cooking Oil', quantity: '1 bottle', category: 'pantry', estimatedCost: 150, checked: false, fromMealPlan: false },
    { name: 'Onions', quantity: '1 kg', category: 'produce', estimatedCost: 35, checked: false, fromMealPlan: false },
    { name: 'Tomatoes', quantity: '500g', category: 'produce', estimatedCost: 30, checked: false, fromMealPlan: false },
    { name: 'Garlic', quantity: '1 pack', category: 'produce', estimatedCost: 30, checked: false, fromMealPlan: false },
    { name: 'Ginger', quantity: '100g', category: 'produce', estimatedCost: 30, checked: false, fromMealPlan: false },
    { name: 'Cumin Seeds', quantity: '100g', category: 'spices', estimatedCost: 50, checked: false, fromMealPlan: false },
    { name: 'Turmeric Powder', quantity: '100g', category: 'spices', estimatedCost: 40, checked: false, fromMealPlan: false },
  ];
}