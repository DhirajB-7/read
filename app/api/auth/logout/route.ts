import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
  return NextResponse.json({ success: true });
}
