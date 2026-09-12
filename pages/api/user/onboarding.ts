import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { User, UserProfile, MenstrualCycle } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectDB();

    const {
      fullName,
      dateOfBirth,
      gender,
      height,
      heightUnit,
      weight,
      weightUnit,
      fitnessGoal,
      fitnessLevel,
      activityLevel,
      workoutPreference,
      dietType,
      sleepHours,
      waterGoal,
      stressLevel,
      // Cycle data
      lastPeriodStart,
      cycleLength,
      periodDuration,
      isRegular,
      cycleSymptoms,
      cycleNotes,
      enableCycleTracking,
    } = req.body;

    // Calculate age
    let age = null;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Update user
    await User.findByIdAndUpdate(session.user.id, {
      fullName: fullName || session.user.name,
      onboardingCompleted: true,
    });

    // Update profile
    const profileData = {
      userId: session.user.id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      age: age || null,
      gender: gender || null,
      height: height ? Number(height) : null,
      heightUnit: heightUnit || 'cm',
      weight: weight ? Number(weight) : null,
      weightUnit: weightUnit || 'kg',
      fitnessGoal: fitnessGoal || null,
      fitnessLevel: fitnessLevel || null,
      activityLevel: activityLevel || null,
      workoutPreference: workoutPreference || null,
      dietType: dietType || null,
      sleepHours: sleepHours ? Number(sleepHours) : null,
      waterGoal: waterGoal ? Number(waterGoal) : 2500,
      stressLevel: stressLevel || null,
    };

    await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      profileData,
      { upsert: true, new: true }
    );

    // Handle Menstrual Cycle data for female users
    if (gender === 'female' && enableCycleTracking && lastPeriodStart) {
      const cycleData = {
        userId: session.user.id,
        lastPeriodStart: new Date(lastPeriodStart),
        cycleLength: cycleLength || '25-28',
        periodDuration: periodDuration || '4-5',
        isRegular: isRegular === 'true',
        symptoms: cycleSymptoms || [],
        notes: cycleNotes || '',
        trackingEnabled: true,
      };

      await MenstrualCycle.findOneAndUpdate(
        { userId: session.user.id },
        cycleData,
        { upsert: true, new: true }
      );
    } else if (gender === 'female') {
      // If female but cycle tracking is disabled
      await MenstrualCycle.findOneAndUpdate(
        { userId: session.user.id },
        { userId: session.user.id, trackingEnabled: false },
        { upsert: true, new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully!',
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error completing onboarding',
      error: error.message || 'Unknown error',
    });
  }
}