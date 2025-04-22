import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://dandi-ai-notebooks.github.io',
];

const CORS_BASE_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email, X-Api-Token, X-Admin-Token',
  'Access-Control-Max-Age': '86400',
};

function getCorsHeaders(origin?: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      ...CORS_BASE_HEADERS,
      'Access-Control-Allow-Origin': origin
    };
  }
  else {
    return {} as Record<string, string>;
  }
}

export function corsOptions(origin: string | undefined) {
  return new NextResponse(null, {
    headers: getCorsHeaders(origin),
  });
}

export function corsify<T>(response: NextResponse<T>, origin: string | undefined): NextResponse<T> {
  const headers = getCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsResponse<T>(data: T, init: ResponseInit | undefined, origin: string | undefined): NextResponse<T> {
  const response = NextResponse.json(data, init);
  return corsify(response, origin);
}
