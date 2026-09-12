import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { WorkoutEntry, UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // GET - Fetch workout history
  if (req.method === 'GET') {
    try {
      const workouts = await WorkoutEntry.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(30);
      
      return res.status(200).json({
        success: true,
        workouts,
      });
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return res.status(500).json({ message: 'Error fetching workouts' });
    }
  }

  // POST - Generate or save workout
  if (req.method === 'POST') {
    try {
      const { 
        action, 
        workoutName, 
        workoutType, 
        duration, 
        intensity, 
        exercises,
        notes 
      } = req.body;

      // If action is 'generate', create a personalized workout
      if (action === 'generate') {
        // Fetch user profile for personalization
        const profile = await UserProfile.findOne({ userId: session.user.id });
        
        const fitnessGoal = profile?.fitnessGoal || 'general-wellness';
        const fitnessLevel = profile?.fitnessLevel || 'beginner';
        const workoutPreference = profile?.workoutPreference || 'home';
        const activityLevel = profile?.activityLevel || 'moderate';

        // Generate workout based on preferences
        const generatedWorkout = generateWorkout(
          fitnessGoal, 
          fitnessLevel, 
          workoutPreference,
          activityLevel
        );

        return res.status(200).json({
          success: true,
          message: 'Workout generated successfully!',
          workout: generatedWorkout,
        });
      }

      // If action is 'save', save the workout
      if (action === 'save') {
        const workout = await WorkoutEntry.create({
          userId: session.user.id,
          workoutName,
          workoutType,
          duration,
          intensity,
          exercises,
          notes: notes || '',
        });

        return res.status(201).json({
          success: true,
          message: 'Workout saved successfully!',
          workout,
        });
      }

      // If action is 'complete', mark workout as completed
      if (action === 'complete') {
        const { workoutId, caloriesBurned } = req.body;
        
        const workout = await WorkoutEntry.findOneAndUpdate(
          { _id: workoutId, userId: session.user.id },
          {
            completed: true,
            completedAt: new Date(),
            caloriesBurned: caloriesBurned || 0,
          },
          { new: true }
        );

        if (!workout) {
          return res.status(404).json({ message: 'Workout not found' });
        }

        return res.status(200).json({
          success: true,
          message: 'Workout completed! Great job! 🎉',
          workout,
        });
      }

      return res.status(400).json({ message: 'Invalid action' });

    } catch (error: any) {
      console.error('Workout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing workout',
        error: error.message || 'Unknown error',
      });
    }
  }

  // DELETE - Delete a workout
  if (req.method === 'DELETE') {
    try {
      const { workoutId } = req.query;
      
      const workout = await WorkoutEntry.findOneAndDelete({
        _id: workoutId,
        userId: session.user.id,
      });

      if (!workout) {
        return res.status(404).json({ message: 'Workout not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Workout deleted successfully',
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting workout' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// ============================================================
// WORKOUT GENERATOR LOGIC
// ============================================================

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration: number;
  rest: number;
}

interface GeneratedWorkout {
  workoutName: string;
  workoutType: string;
  duration: number;
  intensity: string;
  exercises: Exercise[];
  notes: string;
}

function generateWorkout(
  fitnessGoal: string,
  fitnessLevel: string,
  workoutPreference: string,
  activityLevel: string
): GeneratedWorkout {
  
  // Exercise database by category
  const exerciseDatabase: any = {
    // Upper Body
    upperBody: [
      { name: 'Push-ups', sets: 3, reps: 12, duration: 0, rest: 30 },
      { name: 'Dumbbell Rows', sets: 3, reps: 10, duration: 0, rest: 45 },
      { name: 'Shoulder Press', sets: 3, reps: 10, duration: 0, rest: 45 },
      { name: 'Bicep Curls', sets: 3, reps: 12, duration: 0, rest: 30 },
      { name: 'Tricep Dips', sets: 3, reps: 10, duration: 0, rest: 30 },
      { name: 'Chest Flys', sets: 3, reps: 12, duration: 0, rest: 45 },
      { name: 'Pull-ups', sets: 3, reps: 8, duration: 0, rest: 60 },
      { name: 'Lateral Raises', sets: 3, reps: 12, duration: 0, rest: 30 },
    ],
    // Lower Body
    lowerBody: [
      { name: 'Squats', sets: 3, reps: 15, duration: 0, rest: 45 },
      { name: 'Lunges', sets: 3, reps: 12, duration: 0, rest: 45 },
      { name: 'Deadlifts', sets: 3, reps: 10, duration: 0, rest: 60 },
      { name: 'Calf Raises', sets: 3, reps: 20, duration: 0, rest: 30 },
      { name: 'Leg Press', sets: 3, reps: 12, duration: 0, rest: 45 },
      { name: 'Hamstring Curls', sets: 3, reps: 12, duration: 0, rest: 45 },
      { name: 'Glute Bridges', sets: 3, reps: 15, duration: 0, rest: 30 },
      { name: 'Step-ups', sets: 3, reps: 12, duration: 0, rest: 45 },
    ],
    // Core
    core: [
      { name: 'Plank', sets: 3, reps: 0, duration: 60, rest: 30 },
      { name: 'Crunches', sets: 3, reps: 20, duration: 0, rest: 30 },
      { name: 'Russian Twists', sets: 3, reps: 20, duration: 0, rest: 30 },
      { name: 'Leg Raises', sets: 3, reps: 15, duration: 0, rest: 30 },
      { name: 'Mountain Climbers', sets: 3, reps: 20, duration: 0, rest: 30 },
      { name: 'Bicycle Crunches', sets: 3, reps: 20, duration: 0, rest: 30 },
      { name: 'Side Plank', sets: 3, reps: 0, duration: 30, rest: 30 },
      { name: 'Dead Bug', sets: 3, reps: 12, duration: 0, rest: 30 },
    ],
    // Cardio
    cardio: [
      { name: 'Jumping Jacks', sets: 3, reps: 30, duration: 0, rest: 30 },
      { name: 'Burpees', sets: 3, reps: 10, duration: 0, rest: 45 },
      { name: 'High Knees', sets: 3, reps: 30, duration: 0, rest: 30 },
      { name: 'Jump Rope', sets: 3, reps: 0, duration: 60, rest: 30 },
      { name: 'Skaters', sets: 3, reps: 20, duration: 0, rest: 30 },
      { name: 'Box Jumps', sets: 3, reps: 10, duration: 0, rest: 45 },
      { name: 'Sprint in Place', sets: 3, reps: 0, duration: 30, rest: 30 },
      { name: 'Jump Squats', sets: 3, reps: 12, duration: 0, rest: 45 },
    ],
    // Full Body
    fullBody: [
      { name: 'Burpees', sets: 3, reps: 10, duration: 0, rest: 45 },
      { name: 'Squat to Press', sets: 3, reps: 12, duration: 0, rest: 45 },
      { name: 'Renegade Rows', sets: 3, reps: 10, duration: 0, rest: 45 },
      { name: 'Thrusters', sets: 3, reps: 10, duration: 0, rest: 60 },
      { name: 'Kettlebell Swings', sets: 3, reps: 15, duration: 0, rest: 45 },
      { name: 'Clean and Press', sets: 3, reps: 8, duration: 0, rest: 60 },
    ],
    // Flexibility
    flexibility: [
      { name: 'Forward Fold', sets: 1, reps: 0, duration: 60, rest: 15 },
      { name: 'Cat-Cow Stretch', sets: 1, reps: 0, duration: 60, rest: 15 },
      { name: 'Downward Dog', sets: 1, reps: 0, duration: 60, rest: 15 },
      { name: 'Child\'s Pose', sets: 1, reps: 0, duration: 60, rest: 15 },
      { name: 'Cobra Stretch', sets: 1, reps: 0, duration: 45, rest: 15 },
      { name: 'Quad Stretch', sets: 2, reps: 0, duration: 30, rest: 15 },
      { name: 'Hamstring Stretch', sets: 2, reps: 0, duration: 30, rest: 15 },
      { name: 'Shoulder Stretch', sets: 2, reps: 0, duration: 30, rest: 15 },
    ],
  };

  // Workout templates based on goal
  const workoutTemplates: any = {
    'weight-loss': {
      name: 'Fat Burning Workout',
      type: 'Cardio + Strength',
      focus: ['cardio', 'fullBody', 'core'],
    },
    'weight-gain': {
      name: 'Muscle Building Workout',
      type: 'Strength Training',
      focus: ['upperBody', 'lowerBody', 'core'],
    },
    'muscle-gain': {
      name: 'Muscle Building Workout',
      type: 'Strength Training',
      focus: ['upperBody', 'lowerBody', 'core'],
    },
    'maintain-weight': {
      name: 'Balanced Fitness Workout',
      type: 'Mixed Training',
      focus: ['cardio', 'fullBody', 'core'],
    },
    'improve-fitness': {
      name: 'General Fitness Workout',
      type: 'Mixed Training',
      focus: ['cardio', 'fullBody', 'core'],
    },
    'improve-strength': {
      name: 'Strength Building Workout',
      type: 'Strength Training',
      focus: ['upperBody', 'lowerBody', 'core'],
    },
    'improve-endurance': {
      name: 'Endurance Training',
      type: 'Cardio',
      focus: ['cardio', 'fullBody'],
    },
    'improve-flexibility': {
      name: 'Flexibility & Mobility',
      type: 'Stretching',
      focus: ['flexibility'],
    },
    'general-wellness': {
      name: 'Total Wellness Workout',
      type: 'Mixed Training',
      focus: ['cardio', 'fullBody', 'flexibility'],
    },
  };

  const template = workoutTemplates[fitnessGoal] || workoutTemplates['general-wellness'];

  // Adjust intensity based on fitness level
  const intensityMap: any = {
    'beginner': 'low',
    'intermediate': 'medium',
    'advanced': 'high',
  };
  const intensity = intensityMap[fitnessLevel] || 'medium';

  // Adjust number of exercises based on level
  const exerciseCount = {
    'beginner': 4,
    'intermediate': 6,
    'advanced': 8,
  }[fitnessLevel] || 5;

  // Adjust duration based on activity level
  const durationMap: any = {
    'sedentary': 20,
    'light': 30,
    'moderate': 45,
    'active': 60,
    'very-active': 75,
  };
  const duration = durationMap[activityLevel] || 45;

  // Select exercises from focus categories
  const selectedExercises: Exercise[] = [];
  const focusCategories = template.focus;
  
  // Distribute exercises across categories
  const exercisesPerCategory = Math.ceil(exerciseCount / focusCategories.length);
  
  for (const category of focusCategories) {
    const categoryExercises = exerciseDatabase[category] || [];
    // Shuffle and pick random exercises
    const shuffled = [...categoryExercises].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, exercisesPerCategory);
    
    for (const exercise of selected) {
      // Adjust reps/sets based on fitness level
      let adjustedExercise = { ...exercise };
      
      if (fitnessLevel === 'beginner') {
        adjustedExercise.sets = Math.max(2, exercise.sets - 1);
        adjustedExercise.reps = Math.round(exercise.reps * 0.7);
        adjustedExercise.duration = Math.round(exercise.duration * 0.7);
      } else if (fitnessLevel === 'advanced') {
        adjustedExercise.sets = exercise.sets + 1;
        adjustedExercise.reps = Math.round(exercise.reps * 1.3);
        adjustedExercise.duration = Math.round(exercise.duration * 1.3);
      }
      
      selectedExercises.push(adjustedExercise);
    }
  }

  // Trim to exact exercise count
  const finalExercises = selectedExercises.slice(0, exerciseCount);

  // Calculate estimated calories burned
  const calorieEstimate = Math.round(
    duration * (intensity === 'high' ? 8 : intensity === 'medium' ? 6 : 4)
  );

  return {
    workoutName: template.name,
    workoutType: template.type,
    duration,
    intensity,
    exercises: finalExercises,
    notes: `Personalized for your ${fitnessGoal.replace(/-/g, ' ')} goal. Estimated ${calorieEstimate} calories burned.`,
  };
}