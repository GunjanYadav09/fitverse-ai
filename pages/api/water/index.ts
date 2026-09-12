import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { WaterEntry, UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // ============ GET - Today's water + history ============
  if (req.method === 'GET') {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Today's total
      const todayEntries = await WaterEntry.find({
        userId: session.user.id,
        date: today,
      });

      const todayTotal = todayEntries.reduce((sum, e) => sum + e.amount, 0);

      // Get user's water goal
      const profile = await UserProfile.findOne({ userId: session.user.id });
      const waterGoal = profile?.waterGoal || 2500;

      // Get last 7 days
      const last7Days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const entries = await WaterEntry.find({
          userId: session.user.id,
          date: dateStr,
        });

        const total = entries.reduce((sum, e) => sum + e.amount, 0);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        last7Days.push({
          date: dateStr,
          dayName,
          total,
          goalMet: total >= waterGoal,
          entries: entries.map(e => ({ _id: e._id, amount: e.amount, recordedAt: e.recordedAt })),
        });
      }

      // Calculate streak (consecutive days meeting goal, ending today)
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const entries = await WaterEntry.find({
          userId: session.user.id,
          date: dateStr,
        });
        const total = entries.reduce((sum, e) => sum + e.amount, 0);

        if (total >= waterGoal) {
          streak++;
        } else {
          break;
        }
      }

      // Today's individual entries (for undo)
      const todayEntriesList = todayEntries.map(e => ({
        _id: e._id,
        amount: e.amount,
        recordedAt: e.recordedAt,
      }));

      return res.status(200).json({
        success: true,
        today: {
          total: todayTotal,
          goal: waterGoal,
          percentage: Math.min(100, Math.round((todayTotal / waterGoal) * 100)),
          entries: todayEntriesList,
        },
        last7Days,
        streak,
      });
    } catch (error) {
      console.error('Error fetching water data:', error);
      return res.status(500).json({ message: 'Error fetching water data' });
    }
  }

  // ============ POST - Add water ============
  if (req.method === 'POST') {
    try {
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const today = new Date().toISOString().split('T')[0];

      const entry = await WaterEntry.create({
        userId: session.user.id,
        amount: Number(amount),
        date: today,
      });

      return res.status(201).json({
        success: true,
        message: `Added ${amount}ml`,
        entry,
      });
    } catch (error) {
      console.error('Error adding water:', error);
      return res.status(500).json({ message: 'Error adding water' });
    }
  }

  // ============ DELETE - Remove water entry ============
  if (req.method === 'DELETE') {
    try {
      const { entryId } = req.query;

      const entry = await WaterEntry.findOneAndDelete({
        _id: entryId,
        userId: session.user.id,
      });

      if (!entry) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Entry removed',
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error removing entry' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}