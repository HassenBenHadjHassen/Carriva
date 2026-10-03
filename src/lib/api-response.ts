import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  console.error('[API Error]', error);

  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error.message === 'RATE_LIMIT_EXCEEDED') {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
  }

  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Bad Request', details: error.errors }, { status: 400 });
  }

  return NextResponse.json(
    { error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (error instanceof Error ? error.message : 'Unknown Error') },
    { status: 500 }
  );
}
