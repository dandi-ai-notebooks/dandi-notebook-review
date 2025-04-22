import { NextRequest } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { corsOptions, corsResponse } from '../../../utils/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const data = await request.json();
    const { apiToken } = data;

    if (!apiToken) {
      return corsResponse({ error: 'API token is required' }, { status: 400 });
    }

    const user = await User.findOne({ apiToken }, { _id: 0, __v: 0 });
    if (!user) {
      return corsResponse({ error: 'Invalid API token' }, { status: 401 });
    }

    return corsResponse(user);
  } catch (error) {
    console.error('Error authenticating:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}
