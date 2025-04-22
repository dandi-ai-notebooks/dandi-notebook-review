import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
};

export function corsOptions() {
  return new NextResponse(null, {
    headers: CORS_HEADERS,
  });
}

export function corsify<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsResponse<T>(data: T, init?: ResponseInit): NextResponse<T> {
  const response = NextResponse.json(data, init);
  return corsify(response);
}
