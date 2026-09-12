import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { SleepSolution } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await connectDB();

  // GET - Fetch last solution
  if (req.method === 'GET') {
    try {
      const solution = await SleepSolution.findOne({ userId: session.user.id })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        solution: solution || null,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching solutions' });
    }
  }

  // POST - Generate solutions
  if (req.method === 'POST') {
    try {
      const {
        problems,
        details,
        isNightStudier,
        studyHoursPerDay,
        preferredStudyTime,
        wakeTime,
        bedtime,
      } = req.body;

      // Generate personalized solutions
      const solutions = generateSolutions(problems, details, isNightStudier);

      // Generate study schedule if user is a night studier
      let recommendedSchedule = null;
      if (isNightStudier) {
        recommendedSchedule = generateStudySchedule(
          studyHoursPerDay || 4,
          preferredStudyTime || 'late-night',
          wakeTime || '07:00',
          bedtime || '23:00'
        );
      }

      // Save to database
      const savedSolution = await SleepSolution.create({
        userId: session.user.id,
        problems: problems || [],
        details: details || '',
        isNightStudier: isNightStudier || false,
        studyHoursPerDay: studyHoursPerDay || 0,
        preferredStudyTime: preferredStudyTime || 'flexible',
        recommendedSchedule: recommendedSchedule || {},
        solutionsGiven: solutions.map((s: any) => s.title),
      });

      return res.status(200).json({
        success: true,
        message: 'Solutions generated!',
        solutions,
        studySchedule: recommendedSchedule,
        saved: savedSolution,
      });
    } catch (error: any) {
      console.error('Sleep solutions error:', error);
      return res.status(500).json({ message: 'Error generating solutions' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// ============================================================
// SOLUTIONS GENERATOR
// ============================================================

function generateSolutions(problems: string[], details: string, isNightStudier: boolean) {
  const solutions: any[] = [];

  // Problem-specific solutions
  const solutionMap: any = {
    'cant-fall-asleep': {
      title: '🌙 Difficulty Falling Asleep',
      icon: '😴',
      tips: [
        '**4-7-8 Breathing**: Inhale for 4s, hold for 7s, exhale for 8s. Repeat 4 times. This activates your parasympathetic nervous system.',
        '**Progressive Muscle Relaxation**: Tense each muscle group for 5s, then relax. Start from toes and work up to your face.',
        '**No screens 60 min before bed**: Blue light suppresses melatonin production by up to 50%.',
        '**Keep room cool**: 65-68°F (18-20°C) is the optimal sleep temperature.',
        '**Try the "cognitive shuffle"**: Think of random unrelated objects (apple, ladder, cloud...) to quiet racing thoughts.',
        '**If awake 20+ min**: Get out of bed and do something calm (read, stretch) until sleepy.',
      ],
    },
    'wake-up-at-night': {
      title: '⏰ Waking Up During Night',
      icon: '🌃',
      tips: [
        '**Avoid fluids 2 hours before bed** to prevent bathroom trips.',
        '**Blackout curtains**: Even small light sources disrupt melatonin.',
        '**White noise machine** or fan to mask background sounds.',
        '**Cool room**: Overheating is the #1 cause of night waking.',
        '**Avoid alcohol**: It fragments sleep and reduces deep sleep stages.',
        '**Keep a notepad** by your bed to write down worries that wake you.',
      ],
    },
    'cant-sleep-due-stress': {
      title: '😰 Stress & Anxiety Affecting Sleep',
      icon: '🧘',
      tips: [
        '**Brain dump journal**: Before bed, write down everything on your mind. It frees your brain from holding onto thoughts.',
        '**Set a "worry time"**: Schedule 15 min earlier in the day to process worries, so bedtime is only for sleep.',
        '**Try 10 min meditation**: Apps like Insight Timer (free) have guided sleep meditations.',
        '**Warm bath/shower 90 min before bed**: The drop in body temperature after triggers sleepiness.',
        '**Gratitude practice**: Write 3 good things from your day. Reduces anxiety naturally.',
        '**Talk to someone**: If stress is chronic, consider speaking with a counselor.',
      ],
    },
    'early-morning-wake': {
      title: '🌅 Waking Too Early',
      icon: '🐓',
      tips: [
        '**Consistent wake time**: Even on weekends, keep the same wake time to regulate your body clock.',
        '**Delay morning light**: Don\'t expose yourself to bright light immediately if waking too early.',
        '**Avoid caffeine after 2 PM**: Caffeine has a 6-hour half-life.',
        '**Check for depression**: Early waking is a common symptom — talk to a professional if ongoing.',
        '**Move your bedtime later** by 15 min every few days if you\'re waking too early.',
      ],
    },
    'sleepy-during-day': {
      title: '😪 Sleepy During the Day',
      icon: '☕',
      tips: [
        '**20-min power nap** before 3 PM can restore energy without affecting night sleep.',
        '**Get morning sunlight** within 30 min of waking — it sets your circadian rhythm.',
        '**Hydrate**: Dehydration causes fatigue. Drink water throughout the day.',
        '**Move every hour**: Even a 2-min walk boosts alertness.',
        '**Check iron/B12 levels**: Deficiency causes fatigue — get a blood test if persistent.',
        '**Avoid heavy lunches**: Large meals cause post-lunch drowsiness.',
      ],
    },
    'inconsistent-schedule': {
      title: '⏱️ Irregular Sleep Schedule',
      icon: '📅',
      tips: [
        '**Same wake time daily** is more important than same bedtime.',
        '**Anchor with morning light**: Get outside within 30 min of waking.',
        '**Gradual shifts**: Move bedtime 15 min earlier every 3 nights until you hit target.',
        '**No weekend catch-up**: Sleeping till noon on Sunday ruins your Monday.',
        '**Consistent pre-bed routine**: Same 30-min ritual tells your brain it\'s time.',
      ],
    },
    'study-affected-sleep': {
      title: '📚 Study Schedule Affecting Sleep',
      icon: '🎓',
      tips: [
        '**Study in morning/afternoon** if possible — your brain retains more.',
        '**Never study in bed**: Reserve bed only for sleep.',
        '**Use Pomodoro**: 25 min study + 5 min break. Prevents burnout.',
        '**Stop studying 1 hour before bed**: Give your brain time to wind down.',
        '**If you must study late**: Use warm lighting (not blue/white) and take 5-min breaks every 30 min.',
      ],
    },
    'phone-addiction': {
      title: '📱 Screen Time Before Bed',
      icon: '📵',
      tips: [
        '**Set phone to "Sleep Mode"** 1 hour before bed (blocks notifications + reduces blue light).',
        '**Charge phone outside bedroom** — biggest single change you can make.',
        '**Use a physical alarm clock** instead of phone alarm.',
        '**Replace scrolling with reading**: Physical books are best.',
        '**Try "gray scale mode"** on your phone after 8 PM to make it less addictive.',
      ],
    },
    'caffeine-issues': {
      title: '☕ Caffeine Affecting Sleep',
      icon: '🚫',
      tips: [
        '**Cut off caffeine at 2 PM**: Caffeine half-life is 5-6 hours.',
        '**Reduce gradually**: Cut by 25% every few days to avoid withdrawal headaches.',
        '**Swap afternoon coffee** for green tea or water.',
        '**Try decaf after lunch** if you miss the ritual.',
        '**Watch hidden sources**: Chocolate, some sodas, certain teas also have caffeine.',
      ],
    },
  };

  for (const problem of problems) {
    if (solutionMap[problem]) {
      solutions.push(solutionMap[problem]);
    }
  }

  // Add custom problem solution
  if (details && details.trim()) {
    solutions.push({
      title: '📝 Your Custom Concern',
      icon: '💬',
      tips: [
        `You mentioned: "${details}"`,
        '**Talk to a doctor or sleep specialist** if this continues for more than 3 weeks.',
        '**Keep a sleep diary**: Track bedtime, wake time, and how you feel. Share with your doctor.',
        '**Avoid self-medicating** with sleep aids without professional advice.',
      ],
    });
  }

  // If no problems matched, give general advice
  if (solutions.length === 0) {
    solutions.push({
      title: '💡 General Sleep Hygiene',
      icon: '✨',
      tips: [
        '**Consistent schedule**: Same bedtime and wake time every day.',
        '**Dark, cool, quiet room**: Optimize your sleep environment.',
        '**No screens 1 hour before bed**.',
        '**No caffeine after 2 PM**.',
        '**Exercise regularly**, but not within 3 hours of bedtime.',
        '**Wind down routine**: Reading, stretching, or meditation.',
      ],
    });
  }

  return solutions;
}

// ============================================================
// STUDY SCHEDULE GENERATOR
// ============================================================

function generateStudySchedule(
  studyHours: number,
  preferredTime: string,
  wakeTime: string,
  bedtime: string
) {
  // Parse wake and bedtime
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const [bedH, bedM] = bedtime.split(':').map(Number);

  const schedule: any = {
    type: preferredTime,
    totalStudyHours: studyHours,
    blocks: [],
    tips: [],
  };

  if (preferredTime === 'early-morning') {
    // Study in early morning (best for retention)
    schedule.title = '🌅 Early Morning Study Schedule';
    schedule.description = 'Best for memory retention and focus. Your brain is freshest after sleep.';

    const startHour = wakeH + 1; // 1 hour after waking
    schedule.blocks = [
      {
        time: `${pad(startHour)}:00 - ${pad(startHour + 2)}:00`,
        activity: '🎯 Deep Study Block 1',
        detail: 'Most challenging subject — brain is freshest',
        priority: 'high',
      },
      {
        time: `${pad(startHour + 2)}:00 - ${pad(startHour + 2)}:30`,
        activity: '☕ Break + Breakfast',
        detail: 'Eat a protein-rich meal for sustained energy',
        priority: 'rest',
      },
      {
        time: `${pad(startHour + 2)}:30 - ${pad(startHour + 4)}:30`,
        activity: '📚 Study Block 2',
        detail: 'Second subject — moderate difficulty',
        priority: 'high',
      },
      ...(studyHours > 4 ? [{
        time: `${pad(startHour + 4)}:30 - ${pad(startHour + 6)}:30`,
        activity: '📖 Study Block 3',
        detail: 'Revision or practice problems',
        priority: 'medium',
      }] : []),
    ];

    schedule.tips = [
      '🌙 Sleep by 10:30 PM to wake up fresh at your target time.',
      '💧 Drink water immediately after waking to boost alertness.',
      '☀️ Get 10 min of sunlight right after waking to set your body clock.',
      '☕ Avoid coffee in the first hour — you don\'t need it.',
      '🚫 No studying after 8 PM — you\'ve done your work.',
    ];
  } else if (preferredTime === 'late-night') {
    // Late night study (common for students but need to be smart)
    schedule.title = '🌙 Smart Night Study Schedule';
    schedule.description = 'Optimized for night owls. Ensures you still get quality sleep.';

    const sleepStartHour = bedH;
    const lastStudyEnd = sleepStartHour - 1; // Stop 1 hour before bed

    schedule.blocks = [
      {
        time: '07:00 - 08:00',
        activity: '☀️ Wake up + Morning Sunlight',
        detail: 'Critical for resetting your body clock',
        priority: 'health',
      },
      {
        time: '08:00 - 09:00',
        activity: '🍳 Breakfast + Light Review',
        detail: 'Review yesterday\'s notes',
        priority: 'medium',
      },
      {
        time: '16:00 - 17:00',
        activity: '💪 Exercise / Walk',
        detail: 'Boosts focus for evening study',
        priority: 'health',
      },
      {
        time: '18:00 - 19:00',
        activity: '🍽️ Dinner',
        detail: 'Light meal — avoid heavy foods',
        priority: 'rest',
      },
      {
        time: '19:00 - 20:30',
        activity: '📚 Study Block 1',
        detail: 'Start with easier subjects to warm up',
        priority: 'high',
      },
      {
        time: '20:30 - 20:45',
        activity: '☕ Break',
        detail: 'Walk around, stretch, no phone',
        priority: 'rest',
      },
      {
        time: '20:45 - 22:00',
        activity: '🎯 Study Block 2 — Deep Work',
        detail: 'Hardest subject — focus window',
        priority: 'high',
      },
      {
        time: `${pad(lastStudyEnd)}:00 - ${pad(sleepStartHour)}:00`,
        activity: '🌙 Wind Down',
        detail: 'No screens, warm tea, light reading, journal',
        priority: 'sleep',
      },
      {
        time: `${pad(sleepStartHour)}:00 - 07:00`,
        activity: '😴 SLEEP (8 hours!)',
        detail: 'Non-negotiable — your brain consolidates learning during sleep',
        priority: 'critical',
      },
    ];

    schedule.tips = [
      '⏰ Study BEFORE 10 PM — memory retention drops significantly after.',
      '📵 No phone after 9 PM — blue light ruins sleep quality.',
      '☕ No caffeine after 3 PM — it stays in your system for 6 hours.',
      '🎧 Use warm lighting and instrumental music for focus.',
      '🚫 Never study in bed — reserve it only for sleep.',
      '😴 You MUST sleep by your target time. Sleep is when learning consolidates!',
      '📝 After studying, write 3 things you learned — helps memory.',
    ];
  } else {
    // Flexible - split sessions
    schedule.title = '⚖️ Balanced Study Schedule';
    schedule.description = 'Flexible schedule that adapts to your day.';

    schedule.blocks = [
      {
        time: '07:00 - 08:00',
        activity: '☀️ Morning Routine + Breakfast',
        detail: 'Wake at consistent time',
        priority: 'health',
      },
      {
        time: '09:00 - 11:00',
        activity: '📚 Morning Study Block',
        detail: 'Best time for new/hard material',
        priority: 'high',
      },
      {
        time: '11:00 - 11:30',
        activity: '☕ Break',
        detail: 'Walk, hydrate, light snack',
        priority: 'rest',
      },
      {
        time: '11:30 - 13:00',
        activity: '📖 Study Block 2',
        detail: 'Practice problems',
        priority: 'high',
      },
      {
        time: '13:00 - 15:00',
        activity: '🍽️ Lunch + Rest',
        detail: 'Meal, short nap if needed (20 min max)',
        priority: 'rest',
      },
      {
        time: '15:00 - 17:00',
        activity: '🎯 Study Block 3',
        detail: 'Revision',
        priority: 'medium',
      },
      {
        time: '17:00 - 19:00',
        activity: '💪 Exercise + Dinner',
        detail: 'Physical activity is essential',
        priority: 'health',
      },
      {
        time: '19:00 - 21:00',
        activity: '📚 Evening Study',
        detail: 'Light revision or flashcards',
        priority: 'medium',
      },
      {
        time: '21:00 - 22:30',
        activity: '🌙 Wind Down',
        detail: 'No screens, prepare for tomorrow',
        priority: 'sleep',
      },
      {
        time: '22:30 - 07:00',
        activity: '😴 Sleep',
        detail: 'Target 8-8.5 hours',
        priority: 'critical',
      },
    ];

    schedule.tips = [
      '🔄 Study in 2-3 sessions instead of one long one.',
      '🎯 Hardest subjects in morning, revision at night.',
      '💪 Exercise boosts learning and sleep quality.',
      '📵 No screens 1 hour before bed.',
      '😴 Aim for 8 hours — you will feel twice as focused.',
    ];
  }

  return schedule;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}