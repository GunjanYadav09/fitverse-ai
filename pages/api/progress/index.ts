import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import {
  WaterEntry,
  SleepEntry,
  WorkoutEntry,
  NutritionEntry,
  WeightEntry,
  UserProfile,
} from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const range = (req.query.range as string) || '7'; // 7, 30, or 90
    const days = parseInt(range) || 7;

    // ============ WATER DATA ============
    const waterData: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entries = await WaterEntry.find({ userId: session.user.id, date: dateStr });
      const total = entries.reduce((s, e) => s + e.amount, 0);
      waterData.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: total,
      });
    }

    // ============ SLEEP DATA ============
    const sleepData: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = await SleepEntry.findOne({ userId: session.user.id, date: dateStr });
      sleepData.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: entry?.duration || 0,
        quality: entry?.quality || 0,
      });
    }

    // ============ WORKOUT DATA ============
    const workouts = await WorkoutEntry.find({
      userId: session.user.id,
      completed: true,
      completedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    }).sort({ completedAt: 1 });

    const workoutData: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayWorkouts = workouts.filter(
        (w) => new Date(w.completedAt).toISOString().split('T')[0] === dateStr
      );
      workoutData.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayWorkouts.length,
        minutes: dayWorkouts.reduce((s, w) => s + (w.duration || 0), 0),
        calories: dayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
      });
    }

    // ============ NUTRITION DATA ============
    const nutrition = await NutritionEntry.find({
      userId: session.user.id,
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: 1 });

    const nutritionData: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = nutrition.filter(
        (n) => new Date(n.createdAt).toISOString().split('T')[0] === dateStr
      );
      nutritionData.push({
        date: dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: dayEntries.reduce((s, n) => s + (n.calories || 0), 0),
        protein: dayEntries.reduce((s, n) => s + (n.protein || 0), 0),
        carbs: dayEntries.reduce((s, n) => s + (n.carbs || 0), 0),
        fat: dayEntries.reduce((s, n) => s + (n.fat || 0), 0),
        count: dayEntries.length,
      });
    }

    // ============ WEIGHT DATA ============
    const weightEntries = await WeightEntry.find({ userId: session.user.id })
      .sort({ recordedAt: 1 })
      .limit(30);

    const weightData = weightEntries.map((w) => ({
      date: new Date(w.recordedAt).toISOString().split('T')[0],
      value: w.weight,
      unit: w.unit,
    }));

    // ============ STATS CALCULATION ============
    const profile = await UserProfile.findOne({ userId: session.user.id });
    const waterGoal = profile?.waterGoal || 2500;
    const sleepGoalMinutes = (profile?.sleepHours || 8) * 60;

    const avgWater = Math.round(
      waterData.reduce((s, d) => s + d.value, 0) / waterData.length
    );
    const avgSleep = Math.round(
      sleepData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) /
        Math.max(1, sleepData.filter((d) => d.value > 0).length)
    );
    const totalWorkouts = workoutData.reduce((s, d) => s + d.count, 0);
    const totalWorkoutMinutes = workoutData.reduce((s, d) => s + d.minutes, 0);
    const totalCaloriesBurned = workoutData.reduce((s, d) => s + d.calories, 0);
    const avgCalories = Math.round(
      nutritionData.filter((d) => d.calories > 0).reduce((s, d) => s + d.calories, 0) /
        Math.max(1, nutritionData.filter((d) => d.calories > 0).length)
    );

    // Consistency
    const daysWithWater = waterData.filter((d) => d.value > 0).length;
    const daysWithSleep = sleepData.filter((d) => d.value > 0).length;
    const daysWithWorkout = workoutData.filter((d) => d.count > 0).length;
    const daysMeetingWaterGoal = waterData.filter((d) => d.value >= waterGoal).length;
    const daysMeetingSleepGoal = sleepData.filter((d) => d.value >= sleepGoalMinutes).length;

    // Weight change
    const startWeight = weightData[0]?.value || 0;
    const currentWeight = weightData[weightData.length - 1]?.value || 0;
    const weightChange = currentWeight - startWeight;

    // ============ INSIGHTS ============
    const insights: string[] = [];

    if (avgWater < waterGoal * 0.7) {
      insights.push(
        `💧 Your water intake averaged ${avgWater}ml, below your goal of ${waterGoal}ml. Try drinking a glass every hour!`
      );
    } else if (daysMeetingWaterGoal >= days * 0.7) {
      insights.push(
        `💧 Excellent hydration! You met your water goal ${daysMeetingWaterGoal} out of ${days} days.`
      );
    }

    if (avgSleep < 7 * 60) {
      insights.push(
        `😴 You averaged ${Math.floor(avgSleep / 60)}h ${avgSleep % 60}m of sleep. Aim for 7-9 hours for better recovery.`
      );
    } else if (avgSleep >= 7 * 60) {
      insights.push(
        `😴 Great sleep! Averaging ${Math.floor(avgSleep / 60)}h ${avgSleep % 60}m per night.`
      );
    }

    if (totalWorkouts === 0) {
      insights.push(
        `🏋️ No workouts completed yet. Start with just 15 minutes a day!`
      );
    } else if (totalWorkouts >= 5) {
      insights.push(
        `🏋️ You completed ${totalWorkouts} workouts this period — you're crushing it!`
      );
    }

    if (weightChange < -0.5) {
      insights.push(`⚖️ You lost ${Math.abs(weightChange).toFixed(1)}kg — great progress!`);
    } else if (weightChange > 0.5) {
      insights.push(`⚖️ You gained ${weightChange.toFixed(1)}kg. Keep tracking your journey!`);
    }

    return res.status(200).json({
      success: true,
      range: days,
      water: {
        data: waterData,
        goal: waterGoal,
        avg: avgWater,
        daysMet: daysMeetingWaterGoal,
      },
      sleep: {
        data: sleepData,
        goal: sleepGoalMinutes,
        avg: avgSleep,
        daysMet: daysMeetingSleepGoal,
      },
      workouts: {
        data: workoutData,
        total: totalWorkouts,
        totalMinutes: totalWorkoutMinutes,
        totalCalories: totalCaloriesBurned,
        daysActive: daysWithWorkout,
      },
      nutrition: {
        data: nutritionData,
        avgCalories: avgCalories,
      },
      weight: {
        data: weightData,
        start: startWeight,
        current: currentWeight,
        change: weightChange,
      },
      consistency: {
        water: Math.round((daysWithWater / days) * 100),
        sleep: Math.round((daysWithSleep / days) * 100),
        workout: Math.round((daysWithWorkout / days) * 100),
      },
      insights,
    });
  } catch (error: any) {
    console.error('Progress API error:', error);
    return res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
}