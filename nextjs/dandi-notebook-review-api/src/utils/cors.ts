import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://dandi-notebook-review-api.vercel.app'
];

const CORS_BASE_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email, X-Api-Token, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
};

function getCorsHeaders(origin?: string | null) {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    origin = ALLOWED_ORIGINS[0];
  }
  return {
    ...CORS_BASE_HEADERS,
    'Access-Control-Allow-Origin': origin
  };
}

export function corsOptions() {
  const origin = null; // In OPTIONS requests we don't have access to origin
  return new NextResponse(null, {
    headers: getCorsHeaders(origin),
  });
}

export function corsify<T>(response: NextResponse<T>, origin?: string | null): NextResponse<T> {
  const headers = getCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsResponse<T>(data: T, init?: ResponseInit, origin?: string): NextResponse<T> {
  const response = NextResponse.json(data, init);
  return corsify(response, origin);
}
