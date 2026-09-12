import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { NutritionEntry } from '@/lib/models';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

// Comprehensive food database with accurate nutrition data
const FOOD_DATABASE: any = {
  'pizza': { calories: 285, protein: 12, carbs: 35, fat: 10, fiber: 2, sugar: 3, sodium: 600, healthScore: 60 },
  'cheese pizza': { calories: 285, protein: 12, carbs: 35, fat: 10, fiber: 2, sugar: 3, sodium: 600, healthScore: 60 },
  'pepperoni pizza': { calories: 300, protein: 14, carbs: 33, fat: 12, fiber: 2, sugar: 3, sodium: 700, healthScore: 55 },
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, healthScore: 85 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1, healthScore: 80 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1, healthScore: 70 },
  'brown rice': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0.2, sodium: 5, healthScore: 75 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, healthScore: 80 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, healthScore: 85 },
  'egg': { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, sodium: 124, healthScore: 75 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5, sodium: 491, healthScore: 60 },
  'whole wheat bread': { calories: 247, protein: 9, carbs: 46, fat: 2.5, fiber: 4, sugar: 4, sodium: 400, healthScore: 70 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.2, sugar: 0.8, sodium: 6, healthScore: 65 },
  'spaghetti': { calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8, sugar: 0.6, sodium: 6, healthScore: 65 },
  'salad': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugar: 1.3, sodium: 20, healthScore: 90 },
  'curry': { calories: 120, protein: 8, carbs: 10, fat: 5, fiber: 2, sugar: 3, sodium: 400, healthScore: 65 },
  'dal': { calories: 120, protein: 7, carbs: 18, fat: 2, fiber: 4, sugar: 2, sodium: 200, healthScore: 75 },
  'roti': { calories: 120, protein: 3.5, carbs: 24, fat: 1.5, fiber: 3, sugar: 0.5, sodium: 10, healthScore: 70 },
  'idli': { calories: 90, protein: 3, carbs: 18, fat: 1, fiber: 2, sugar: 0.5, sodium: 150, healthScore: 75 },
  'dosa': { calories: 130, protein: 4, carbs: 24, fat: 2, fiber: 2, sugar: 1, sodium: 200, healthScore: 70 },
  'sandwich': { calories: 250, protein: 12, carbs: 30, fat: 10, fiber: 3, sugar: 4, sodium: 500, healthScore: 60 },
  'burger': { calories: 350, protein: 20, carbs: 30, fat: 18, fiber: 2, sugar: 5, sodium: 700, healthScore: 50 },
  'french fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8, sugar: 0.3, sodium: 210, healthScore: 40 },
  'soup': { calories: 70, protein: 3, carbs: 12, fat: 2, fiber: 2, sugar: 3, sodium: 300, healthScore: 75 },
  'noodles': { calories: 138, protein: 4.5, carbs: 24, fat: 3, fiber: 1, sugar: 1, sodium: 400, healthScore: 60 },
  'cake': { calories: 350, protein: 4, carbs: 45, fat: 18, fiber: 1, sugar: 25, sodium: 200, healthScore: 30 },
  'ice cream': { calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0.7, sugar: 21, sodium: 50, healthScore: 35 },
  'yogurt': { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7, sodium: 36, healthScore: 70 },
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5, sodium: 44, healthScore: 75 },
  'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sugar: 0.5, sodium: 621, healthScore: 50 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sugar: 0.1, sodium: 11, healthScore: 20 },
  'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6, healthScore: 70 },
  'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55, healthScore: 80 },
  'oatmeal': { calories: 71, protein: 2.5, carbs: 12, fat: 1.4, fiber: 1.7, sugar: 0.3, sodium: 4, healthScore: 85 },
  'cereal': { calories: 378, protein: 6, carbs: 80, fat: 2, fiber: 6, sugar: 10, sodium: 200, healthScore: 55 },
  'pancake': { calories: 227, protein: 6, carbs: 30, fat: 9, fiber: 1, sugar: 6, sodium: 400, healthScore: 45 },
  'waffle': { calories: 310, protein: 7, carbs: 35, fat: 16, fiber: 1, sugar: 8, sodium: 450, healthScore: 40 },
  'burger': { calories: 354, protein: 16, carbs: 41, fat: 15, fiber: 2, sugar: 5, sodium: 500, healthScore: 45 },
  'fries': { calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8, sugar: 0.3, sodium: 210, healthScore: 40 },
  'sandwich': { calories: 250, protein: 12, carbs: 30, fat: 10, fiber: 3, sugar: 4, sodium: 500, healthScore: 60 },
  'sushi': { calories: 142, protein: 6, carbs: 28, fat: 1, fiber: 1, sugar: 3, sodium: 300, healthScore: 70 },
  'taco': { calories: 226, protein: 12, carbs: 20, fat: 11, fiber: 3, sugar: 2, sodium: 400, healthScore: 55 },
  'burrito': { calories: 350, protein: 15, carbs: 40, fat: 14, fiber: 6, sugar: 3, sodium: 600, healthScore: 50 },
  'steak': { calories: 271, protein: 25, carbs: 0, fat: 19, fiber: 0, sugar: 0, sodium: 60, healthScore: 60 },
  'salmon': { calories: 208, protein: 22, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59, healthScore: 80 },
  'tuna': { calories: 132, protein: 28, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 50, healthScore: 85 },
  'shrimp': { calories: 85, protein: 18, carbs: 0, fat: 0.5, fiber: 0, sugar: 0, sodium: 111, healthScore: 80 },
  'tofu': { calories: 76, protein: 8, carbs: 2, fat: 4.8, fiber: 0.3, sugar: 0.6, sodium: 7, healthScore: 75 },
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7, sodium: 7, healthScore: 80 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33, healthScore: 90 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79, healthScore: 90 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69, healthScore: 85 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5, healthScore: 85 },
  'onion': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4, healthScore: 80 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1, sodium: 17, healthScore: 70 },
  'ginger': { calories: 80, protein: 1.8, carbs: 18, fat: 0.8, fiber: 2, sugar: 1.7, sodium: 13, healthScore: 75 },
  'mango': { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14, sodium: 1, healthScore: 75 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9, sodium: 0, healthScore: 85 },
  'grapes': { calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, sugar: 16, sodium: 2, healthScore: 70 },
  'watermelon': { calories: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, sugar: 6, sodium: 1, healthScore: 80 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1, healthScore: 85 },
  'blueberry': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sugar: 10, sodium: 1, healthScore: 80 },
  'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, sodium: 17, healthScore: 50 },
  'almond': { calories: 579, protein: 21, carbs: 22, fat: 49, fiber: 12, sugar: 4.4, sodium: 1, healthScore: 70 },
  'walnut': { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 7, sugar: 2.6, sodium: 2, healthScore: 70 },
  'cashew': { calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3, sugar: 6, sodium: 12, healthScore: 65 },
  'chocolate': { calories: 546, protein: 4.9, carbs: 61, fat: 31, fiber: 7, sugar: 48, sodium: 24, healthScore: 30 },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // GET - Fetch nutrition history
  if (req.method === 'GET') {
    try {
      const entries = await NutritionEntry.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(20);
      
      return res.status(200).json({
        success: true,
        entries,
      });
    } catch (error) {
      console.error('Error fetching nutrition entries:', error);
      return res.status(500).json({ message: 'Error fetching entries' });
    }
  }

  // POST - Analyze food
  if (req.method === 'POST') {
    try {
      const { foodName, imageBase64 } = req.body;

      let searchTerm = foodName || '';
      let detectedLabels: string[] = [];
      
      // Step 1: If image is provided, use Google Cloud Vision API to detect food
      if (imageBase64 && imageBase64.length > 0 && !foodName) {
        try {
          const API_KEY = 'AIzaSyDGZxN9uS3CPg5GHfWmLF6lB1OE4WxyM2Q';
          
          const base64Image = imageBase64.includes('base64,') 
            ? imageBase64.split('base64,')[1] 
            : imageBase64;

          const visionResponse = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
            {
              requests: [{
                image: {
                  content: base64Image,
                },
                features: [
                  { type: 'LABEL_DETECTION', maxResults: 15 },
                  { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
                ],
              }],
            }
          );

          const labels = visionResponse.data.responses[0]?.labelAnnotations || [];
          const objects = visionResponse.data.responses[0]?.localizedObjectAnnotations || [];
          
          // Get all labels
          const allLabels = labels.map((l: any) => l.description.toLowerCase());
          const objectNames = objects.map((o: any) => o.name.toLowerCase());
          
          detectedLabels = [...allLabels, ...objectNames];
          
          console.log('All detected labels:', detectedLabels);

          // Check if any detected label matches our food database
          const foodKeys = Object.keys(FOOD_DATABASE);
          let matchedFood = null;
          
          for (const label of detectedLabels) {
            // Check exact match
            if (foodKeys.includes(label)) {
              matchedFood = label;
              break;
            }
            // Check partial match
            for (const key of foodKeys) {
              if (label.includes(key) || key.includes(label)) {
                matchedFood = key;
                break;
              }
            }
            if (matchedFood) break;
          }

          if (matchedFood) {
            searchTerm = matchedFood;
            console.log('Detected food from image:', searchTerm);
          } else {
            // Use the first food-related label
            const foodKeywords = ['food', 'dish', 'meal', 'fruit', 'vegetable', 'meat', 'pasta', 'rice', 'bread', 
              'cake', 'pizza', 'burger', 'sandwich', 'salad', 'soup', 'curry', 'noodles', 'chicken', 'fish', 
              'egg', 'cheese', 'milk', 'juice', 'smoothie', 'snack', 'dessert'];
            
            for (const label of detectedLabels) {
              if (foodKeywords.some(keyword => label.includes(keyword))) {
                searchTerm = label;
                console.log('Using food-related label:', searchTerm);
                break;
              }
            }
          }

        } catch (visionError: any) {
          console.error('Vision API error:', visionError.response?.data || visionError.message);
        }
      }

      // If no food name from image or manual, use default
      if (!searchTerm) {
        searchTerm = foodName || 'food';
      }

      // Clean up search term
      searchTerm = searchTerm.replace(/and|with|one|bowl|plate|cup|of|for|from|the|food|dish|meal/gi, '').trim();
      
      console.log('Final search term:', searchTerm);

      // Step 2: Get nutrition data from our database or Open Food Facts
      let nutritionData = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        healthScore: 50,
        servingSize: '100g',
        foodName: searchTerm || 'Unknown food',
      };

      // First check our local database
      const lowerSearch = searchTerm.toLowerCase();
      let foundInDB = false;
      
      for (const [key, value] of Object.entries(FOOD_DATABASE)) {
        if (lowerSearch.includes(key) || key.includes(lowerSearch)) {
          nutritionData = {
            calories: value.calories,
            protein: value.protein,
            carbs: value.carbs,
            fat: value.fat,
            fiber: value.fiber || 0,
            sugar: value.sugar || 0,
            sodium: value.sodium || 0,
            healthScore: value.healthScore || 50,
            servingSize: '100g',
            foodName: searchTerm,
          };
          foundInDB = true;
          console.log('Found in local database:', key);
          break;
        }
      }

      // If not found in local DB, try Open Food Facts
      if (!foundInDB && searchTerm && searchTerm !== 'food') {
        try {
          const searchResponse = await axios.get(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,nutriments,nutrition_grade_fr,serving_size`
          );

          if (searchResponse.data.products && searchResponse.data.products.length > 0) {
            const product = searchResponse.data.products[0];
            const nutriments = product.nutriments || {};
            
            const calories = nutriments.energy_100g || nutriments.energy || nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
            const protein = nutriments.proteins_100g || nutriments.proteins || 0;
            const carbs = nutriments.carbohydrates_100g || nutriments.carbohydrates || 0;
            const fat = nutriments.fat_100g || nutriments.fat || 0;
            const fiber = nutriments.fiber_100g || nutriments.fiber || 0;
            const sugar = nutriments.sugars_100g || nutriments.sugars || 0;
            const sodium = nutriments.sodium_100g || nutriments.sodium || 0;

            const gradeScore: any = {
              'a': 85,
              'b': 70,
              'c': 55,
              'd': 40,
              'e': 25
            };
            
            nutritionData = {
              calories: typeof calories === 'number' && calories > 0 ? calories : 0,
              protein: typeof protein === 'number' && protein > 0 ? protein : 0,
              carbs: typeof carbs === 'number' && carbs > 0 ? carbs : 0,
              fat: typeof fat === 'number' && fat > 0 ? fat : 0,
              fiber: typeof fiber === 'number' && fiber > 0 ? fiber : 0,
              sugar: typeof sugar === 'number' && sugar > 0 ? sugar : 0,
              sodium: typeof sodium === 'number' && sodium > 0 ? sodium : 0,
              healthScore: gradeScore[product.nutrition_grade_fr] || 50,
              servingSize: product.serving_size || '100g',
              foodName: product.product_name || searchTerm,
            };
            console.log('Found in Open Food Facts:', product.product_name);
          }
        } catch (nutritionError) {
          console.error('Error fetching from Open Food Facts:', nutritionError);
        }
      }

      // If still no data, use a default fallback
      if (nutritionData.calories === 0) {
        nutritionData = {
          calories: 100,
          protein: 5,
          carbs: 15,
          fat: 3,
          fiber: 2,
          sugar: 2,
          sodium: 100,
          healthScore: 50,
          servingSize: '100g',
          foodName: searchTerm || 'Unknown food',
        };
      }

      // Save to database
      const entry = await NutritionEntry.create({
        userId: session.user.id,
        foodName: nutritionData.foodName || searchTerm || 'Unknown food',
        imageUrl: imageBase64 || '',
        calories: Math.round(nutritionData.calories),
        protein: Math.round(nutritionData.protein * 10) / 10,
        carbs: Math.round(nutritionData.carbs * 10) / 10,
        fat: Math.round(nutritionData.fat * 10) / 10,
        fiber: Math.round(nutritionData.fiber * 10) / 10,
        sugar: Math.round(nutritionData.sugar * 10) / 10,
        sodium: Math.round(nutritionData.sodium),
        healthScore: nutritionData.healthScore,
        servingSize: nutritionData.servingSize,
        detectedLabels: detectedLabels.length > 0 ? detectedLabels : [nutritionData.foodName],
      });

      return res.status(200).json({
        success: true,
        message: 'Food analyzed successfully!',
        data: {
          foodName: nutritionData.foodName || searchTerm || 'Unknown food',
          detectedLabels: detectedLabels.length > 0 ? detectedLabels.slice(0, 5) : [nutritionData.foodName],
          nutrition: {
            calories: Math.round(nutritionData.calories),
            protein: Math.round(nutritionData.protein * 10) / 10,
            carbs: Math.round(nutritionData.carbs * 10) / 10,
            fat: Math.round(nutritionData.fat * 10) / 10,
            fiber: Math.round(nutritionData.fiber * 10) / 10,
            sugar: Math.round(nutritionData.sugar * 10) / 10,
            sodium: Math.round(nutritionData.sodium),
            healthScore: nutritionData.healthScore,
            servingSize: nutritionData.servingSize,
          },
          entryId: entry._id,
        },
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error analyzing food',
        error: error.message || 'Unknown error',
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}