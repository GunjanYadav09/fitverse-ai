import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    res.status(200).json({ 
      success: true, 
      message: '✅ MongoDB connected successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: '❌ Connection failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}