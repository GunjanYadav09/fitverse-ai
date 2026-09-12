import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { SleepEntry, UserProfile } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // ============ GET - Today's sleep + history ============
  if (req.method === 'GET') {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Today's sleep entry (or last night's)
      const todayEntry = await SleepEntry.findOne({
        userId: session.user.id,
        date: today,
      });

      // Get user's sleep goal (default 8 hours)
      const profile = await UserProfile.findOne({ userId: session.user.id });
      const sleepGoalHours = profile?.sleepHours || 8;
      const sleepGoalMinutes = sleepGoalHours * 60;

      // Last 7 days
      const last7Days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const entry = await SleepEntry.findOne({
          userId: session.user.id,
          date: dateStr,
        });

        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        last7Days.push({
          date: dateStr,
          dayName,
          duration: entry?.duration || 0,
          quality: entry?.quality || 0,
          bedtime: entry?.bedtime || '',
          wakeTime: entry?.wakeTime || '',
          goalMet: entry ? entry.duration >= sleepGoalMinutes : false,
          hasEntry: !!entry,
        });
      }

      // Weekly stats
      const entriesWithData = last7Days.filter((d) => d.hasEntry);
      const totalMinutes = entriesWithData.reduce((s, d) => s + d.duration, 0);
      const avgMinutes = entriesWithData.length > 0 ? Math.round(totalMinutes / entriesWithData.length) : 0;
      const avgQuality =
        entriesWithData.length > 0
          ? Math.round((entriesWithData.reduce((s, d) => s + d.quality, 0) / entriesWithData.length) * 10) / 10
          : 0;
      const bestDay = entriesWithData.reduce((best: any, d: any) => (d.duration > (best?.duration || 0) ? d : best), null);
      const worstDay = entriesWithData.reduce((worst: any, d: any) => (d.duration < (worst?.duration || Infinity) ? d : worst), null);

      // Calculate streak (consecutive days meeting sleep goal, ending today)
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const entry = await SleepEntry.findOne({
          userId: session.user.id,
          date: dateStr,
        });

        if (entry && entry.duration >= sleepGoalMinutes) {
          streak++;
        } else {
          break;
        }
      }

      return res.status(200).json({
        success: true,
        today: todayEntry
          ? {
              duration: todayEntry.duration,
              quality: todayEntry.quality,
              bedtime: todayEntry.bedtime,
              wakeTime: todayEntry.wakeTime,
              notes: todayEntry.notes,
              _id: todayEntry._id,
            }
          : null,
        goal: {
          hours: sleepGoalHours,
          minutes: sleepGoalMinutes,
        },
        last7Days,
        stats: {
          avgMinutes,
          avgQuality,
          totalMinutes,
          entriesCount: entriesWithData.length,
          bestDay: bestDay
            ? { dayName: bestDay.dayName, duration: bestDay.duration }
            : null,
          worstDay: worstDay
            ? { dayName: worstDay.dayName, duration: worstDay.duration }
            : null,
        },
        streak,
      });
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      return res.status(500).json({ message: 'Error fetching sleep data' });
    }
  }

  // ============ POST - Add/Update sleep entry ============
  if (req.method === 'POST') {
    try {
      const { bedtime, wakeTime, quality, notes } = req.body;

      if (!bedtime || !wakeTime) {
        return res.status(400).json({ message: 'Bedtime and wake time required' });
      }

      // Calculate duration
      const [bH, bM] = bedtime.split(':').map(Number);
      const [wH, wM] = wakeTime.split(':').map(Number);

      let durationMinutes = wH * 60 + wM - (bH * 60 + bM);
      // If wake time is before bedtime, it means sleep crossed midnight
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }

      if (durationMinutes <= 0 || durationMinutes > 24 * 60) {
        return res.status(400).json({ message: 'Invalid sleep duration' });
      }

      // Save with today's date
      const today = new Date().toISOString().split('T')[0];

      const entry = await SleepEntry.findOneAndUpdate(
        { userId: session.user.id, date: today },
        {
          userId: session.user.id,
          date: today,
          bedtime,
          wakeTime,
          duration: durationMinutes,
          quality: quality || 3,
          notes: notes || '',
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Sleep logged successfully!',
        entry,
      });
    } catch (error) {
      console.error('Error saving sleep:', error);
      return res.status(500).json({ message: 'Error saving sleep' });
    }
  }

  // ============ DELETE - Remove sleep entry ============
  if (req.method === 'DELETE') {
    try {
      const { entryId } = req.query;

      await SleepEntry.findOneAndDelete({
        _id: entryId,
        userId: session.user.id,
      });

      return res.status(200).json({ success: true, message: 'Entry removed' });
    } catch (error) {
      return res.status(500).json({ message: 'Error removing entry' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}