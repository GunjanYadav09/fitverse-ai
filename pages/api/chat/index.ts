import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/mongodb';
import { ChatMessage, UserProfile } from '@/lib/models';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// List of models to try in order (first that works will be used)
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

// ============================================================
// RETRY HELPER WITH EXPONENTIAL BACKOFF
// Handles 429 (rate limit) errors gracefully
// ============================================================
async function generateWithRetry(
  model: any,
  history: any[],
  message: string,
  maxRetries = 3
): Promise<string> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.9,
        },
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit (429) error
      const is429 =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (is429) {
        // Try to extract retry delay from error details
        let delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s

        try {
          const retryInfo = error?.errorDetails?.find((d: any) =>
            d['@type']?.includes('RetryInfo')
          );
          if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay);
            if (!isNaN(seconds)) {
              delayMs = seconds * 1000;
            }
          }
        } catch {
          // Use default exponential backoff
        }

        console.log(
          `⏳ Rate limited. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      // If not a 429 or we've exhausted retries, throw
      throw error;
    }
  }

  throw lastError;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  await connectDB();

  // ============ GET - Fetch history ============
  if (req.method === 'GET') {
    try {
      const { sessionId = 'default', limit = 50 } = req.query;
      const messages = await ChatMessage.find({
        userId: session.user.id,
        sessionId: sessionId as string,
      })
        .sort({ createdAt: 1 })
        .limit(Number(limit));

      return res.status(200).json({ success: true, messages });
    } catch (error) {
      console.error('Fetch history error:', error);
      return res.status(500).json({ message: 'Error fetching chat history' });
    }
  }

  // ============ POST - Send message ============
  if (req.method === 'POST') {
    try {
      const { message, sessionId = 'default' } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Message is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
      }

      // 1. Save user message
      await ChatMessage.create({
        userId: session.user.id,
        role: 'user',
        content: message.trim(),
        sessionId,
      });

      // 2. Get user profile
      const profile = await UserProfile.findOne({ userId: session.user.id });

      // 3. Get last 10 messages for context
      const history = await ChatMessage.find({
        userId: session.user.id,
        sessionId,
      })
        .sort({ createdAt: -1 })
        .limit(10);

      const previousMessages = history.reverse().slice(0, -1);

      // 4. Build system prompt
      const userName = session.user.name || 'there';
      const goal = profile?.fitnessGoal?.replace(/-/g, ' ') || 'general wellness';
      const fitnessLevel = profile?.fitnessLevel || 'beginner';
      const dietType = profile?.dietType || 'not specified';
      const allergies = profile?.mealPreferences?.allergies?.length
        ? profile.mealPreferences.allergies.join(', ')
        : 'none';

      const systemPrompt = `You are Aura, a warm, caring, and motivating AI health companion in the FitVerse AI app. You act as a FRIEND, PERSONAL TRAINER, NUTRITIONIST, and MOTIVATOR all in one.

USER CONTEXT:
- Name: ${userName}
- Fitness Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Diet Type: ${dietType}
- Allergies: ${allergies}

YOUR PERSONALITY:
- Warm and encouraging, like a caring best friend
- Knowledgeable about fitness, nutrition, and wellness
- Use the user's name occasionally
- Use 1-3 emojis per message, not excessive
- Keep responses under 200 words unless detailed help is requested
- Respect the user's allergies at all times

WHAT YOU CAN HELP WITH:
- Workout advice, exercise tips, training plans
- Nutrition guidance, meal ideas (respect allergies!)
- Motivation and emotional support
- Sleep and recovery tips
- Hydration reminders

NEVER:
- Diagnose medical conditions
- Recommend specific medications
- Suggest foods the user is allergic to

TONE: Friendly, warm, occasionally playful. Like texting your favorite fitness-savvy friend.`;

      // 5. Build conversation
      const conversationHistory = previousMessages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // 6. Call Gemini with fallback across models + retry on rate limit
      let aiResponse = '';
      let lastError: any = null;

      for (const modelName of MODEL_CANDIDATES) {
        try {
          console.log(`🔄 Trying model: ${modelName}`);

          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
          });

          // Use the retry wrapper
          aiResponse = await generateWithRetry(
            model,
            conversationHistory,
            message.trim()
          );

          if (aiResponse) {
            console.log(`✅ Success with model: ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`❌ Model "${modelName}" failed:`, err.message);
          lastError = err;

          // If this is a 429 after all retries, small delay before trying next model
          const is429 =
            err?.status === 429 ||
            err?.message?.includes('429') ||
            err?.message?.includes('RESOURCE_EXHAUSTED');

          if (is429) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          // Continue to next model
        }
      }

      if (!aiResponse) {
        throw lastError || new Error('All AI models failed to respond');
      }

      // 7. Save AI response
      const assistantMessage = await ChatMessage.create({
        userId: session.user.id,
        role: 'assistant',
        content: aiResponse,
        sessionId,
      });

      return res.status(200).json({
        success: true,
        message: {
          _id: assistantMessage._id,
          role: 'assistant',
          content: aiResponse,
          createdAt: assistantMessage.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Chat error:', error);

      if (
        error?.message?.includes('429') ||
        error?.status === 429 ||
        error?.message?.includes('RESOURCE_EXHAUSTED')
      ) {
        return res.status(429).json({
          message:
            "I'm a bit overwhelmed right now! Please wait a few seconds and try again. 💙",
        });
      }

      return res.status(500).json({
        message: "I'm having trouble thinking right now. Let's try again in a moment. 🤔",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  // ============ DELETE - Clear history ============
  if (req.method === 'DELETE') {
    try {
      const { sessionId = 'default' } = req.query;
      await ChatMessage.deleteMany({
        userId: session.user.id,
        sessionId: sessionId as string,
      });
      return res.status(200).json({ success: true, message: 'Chat cleared' });
    } catch (error) {
      return res.status(500).json({ message: 'Error clearing chat' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}