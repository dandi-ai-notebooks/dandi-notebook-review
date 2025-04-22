import { NextRequest } from 'next/server';
import { ADMIN_TOKEN } from '../../../../config/admin';
import { corsOptions, corsResponse } from '../../../../utils/cors';

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request.headers.get('origin') || undefined);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { token } = data;

    if (!token || token !== ADMIN_TOKEN) {
      return corsResponse({ error: 'Invalid admin token' }, { status: 401 }, request.headers.get('origin') || undefined);
    }

    return corsResponse({ authenticated: true }, undefined, request.headers.get('origin') || undefined);
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return corsResponse({ error: 'Internal Server Error' }, { status: 500 }, request.headers.get('origin') || undefined);
  }
}
