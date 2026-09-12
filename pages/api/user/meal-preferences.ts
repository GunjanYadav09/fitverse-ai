import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  if (req.method === 'PUT') {
    try {
      const {
        allergies,
        dislikes,
        cuisinePreference,
        spiceLevel,
        mealComplexity,
        includeSnacks,
        additionalNotes,
      } = req.body;

      const profile = await UserProfile.findOneAndUpdate(
        { userId: session.user.id },
        {
          $set: {
            'mealPreferences.allergies': allergies || [],
            'mealPreferences.dislikes': dislikes || [],
            'mealPreferences.cuisinePreference': cuisinePreference || 'mixed',
            'mealPreferences.spiceLevel': spiceLevel || 'medium',
            'mealPreferences.mealComplexity': mealComplexity || 'moderate',
            'mealPreferences.includeSnacks': includeSnacks !== false,
            'mealPreferences.additionalNotes': additionalNotes || '',
          },
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Meal preferences saved',
        profile,
      });
    } catch (error: any) {
      console.error('Preferences error:', error);
      return res.status(500).json({ message: 'Error saving preferences', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}