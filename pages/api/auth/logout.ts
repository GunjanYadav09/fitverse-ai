import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (session) {
    // NextAuth handles the actual logout
    return res.status(200).json({ message: 'Logged out successfully' });
  }
  
  return res.status(401).json({ message: 'Not logged in' });
}