import { NextRequest } from 'next/server';
import { ADMIN_TOKEN } from '../../../../config/admin';
import { corsOptions, corsResponse } from '../../../../utils/cors';

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { token } = data;

    if (!token || token !== ADMIN_TOKEN) {
      return corsResponse({ error: 'Invalid admin token' }, { status: 401 });
    }

    return corsResponse({ authenticated: true });
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 });
  }
}
