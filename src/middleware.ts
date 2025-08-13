// Middleware neutre: laisse tout passer (migration vers Supabase Auth)
import { NextResponse } from 'next/server';

export function middleware() {
	return NextResponse.next();
}

export const config = {} as const;