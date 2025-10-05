import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const secret = process.env.NEXTAUTH_SECRET;

export const auth = async (req: NextRequest) => {
  const token = await getToken({ req, secret });
  return token;
};