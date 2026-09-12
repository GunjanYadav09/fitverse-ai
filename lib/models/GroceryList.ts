import mongoose from 'mongoose';

const GroceryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, default: '' },
  category: {
    type: String,
    enum: ['produce', 'dairy', 'protein', 'grains', 'spices', 'pantry', 'frozen', 'beverages', 'other'],
    default: 'other',
  },
  estimatedCost: { type: Number, default: 0 },
  checked: { type: Boolean, default: false },
  fromMealPlan: { type: Boolean, default: false },
});

const GroceryListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listName: { type: String, required: true },
  items: [GroceryItemSchema],
  totalItems: { type: Number, default: 0 },
  checkedItems: { type: Number, default: 0 },
  estimatedTotal: { type: Number, default: 0 },
  mealPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    default: null,
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const GroceryList = mongoose.models.GroceryList || mongoose.model('GroceryList', GroceryListSchema);