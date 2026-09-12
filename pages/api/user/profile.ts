import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { User, UserProfile, MenstrualCycle } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // GET - Fetch profile
  if (req.method === 'GET') {
    try {
      const user = await User.findById(session.user.id);
      const profile = await UserProfile.findOne({ userId: session.user.id });
      const cycle = await MenstrualCycle.findOne({ userId: session.user.id });
      
      return res.status(200).json({
        success: true,
        user: {
          fullName: user?.fullName,
          email: user?.email,
          onboardingCompleted: user?.onboardingCompleted,
          gender: user?.gender || profile?.gender || '',
        },
        profile: profile || {},
        cycle: cycle || {},
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error fetching profile' 
      });
    }
  }

  // PUT - Update profile
  if (req.method === 'PUT') {
    try {
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
        // Menstrual Cycle fields
        enableCycleTracking,
        lastPeriodStart,
        cycleLength,
        periodDuration,
        isRegular,
        cycleSymptoms,
        cycleNotes,
      } = req.body;

      // Update user
      await User.findByIdAndUpdate(session.user.id, {
        fullName: fullName || session.user.name,
      });

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

      // Update profile
      const profile = await UserProfile.findOneAndUpdate(
        { userId: session.user.id },
        {
          userId: session.user.id,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          age,
          gender,
          height: height ? Number(height) : null,
          heightUnit: heightUnit || 'cm',
          weight: weight ? Number(weight) : null,
          weightUnit: weightUnit || 'kg',
          fitnessGoal,
          fitnessLevel,
          activityLevel,
          workoutPreference,
          dietType,
          sleepHours: sleepHours ? Number(sleepHours) : null,
          waterGoal: waterGoal ? Number(waterGoal) : 2500,
          stressLevel,
        },
        { upsert: true, new: true }
      );

      // Handle Menstrual Cycle data for female users
      if (gender === 'female') {
        // Prepare cycle data
        const cycleData: any = {
          userId: session.user.id,
          trackingEnabled: enableCycleTracking || false,
        };

        // Only add date fields if tracking is enabled and data is provided
        if (enableCycleTracking) {
          if (lastPeriodStart) {
            cycleData.lastPeriodStart = new Date(lastPeriodStart);
          }
          if (cycleLength) {
            cycleData.cycleLength = cycleLength;
          }
          if (periodDuration) {
            cycleData.periodDuration = periodDuration;
          }
          if (isRegular !== undefined) {
            cycleData.isRegular = isRegular === 'true';
          }
          if (cycleSymptoms) {
            // Handle symptoms as comma-separated string
            cycleData.symptoms = typeof cycleSymptoms === 'string' 
              ? cycleSymptoms.split(',').map((s: string) => s.trim()).filter(Boolean)
              : cycleSymptoms;
          }
          if (cycleNotes) {
            cycleData.notes = cycleNotes;
          }
        }

        // Update or create cycle record
        await MenstrualCycle.findOneAndUpdate(
          { userId: session.user.id },
          cycleData,
          { upsert: true, new: true }
        );
      } else {
        // If user is not female, disable or remove cycle tracking
        await MenstrualCycle.findOneAndUpdate(
          { userId: session.user.id },
          { 
            userId: session.user.id, 
            trackingEnabled: false 
          },
          { upsert: true, new: true }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error updating profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    message: 'Method not allowed' 
  });
}