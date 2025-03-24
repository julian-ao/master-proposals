// middleware.js (Edge-Compatible)
import { NextResponse } from 'next/server';

export const config = {
    matcher: '/api/:path*', // Apply only to `/api` routes
};

export function middleware(request) {
    const response = NextResponse.next();

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;
}