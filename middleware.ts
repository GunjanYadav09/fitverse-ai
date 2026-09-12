import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/', 
    '/features', 
    '/pricing', 
    '/about', 
    '/contact', 
    '/faq',
    '/ai-coach',
    '/nutrition',
    '/workout'
  ];
  
  const authRoutes = ['/login', '/signup'];
  
  // Routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/onboarding',
    '/explore',
    '/meal-scanner',
    '/cycle',
    '/workouts',
    '/nutrition',
    '/hydration',
    '/progress',
    '/craving-converter',
    '/grocery-planner',
    '/sleep',
    '/restaurant-advisor',
  ];

  // Allow public routes
  if (publicRoutes.includes(path) || path === '/') {
    return NextResponse.next();
  }

  // Redirect to login if trying to access protected route without auth
  if (protectedRoutes.some(route => path.startsWith(route)) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if trying to access auth routes while logged in
  if (authRoutes.includes(path) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect to onboarding if onboarding incomplete
  if (path === '/dashboard' && token && !token.onboardingCompleted) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Redirect to dashboard if onboarding is complete and trying to access onboarding
  if (path === '/onboarding' && token && token.onboardingCompleted) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/profile',
    '/onboarding',
    '/login',
    '/signup',
    '/explore',
    '/meal-scanner',
    '/cycle',
    '/workouts',
    '/nutrition',
    '/hydration',
    '/progress',
    '/craving-converter',
    '/grocery-planner',
    '/sleep',
    '/restaurant-advisor',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/faq',
    '/ai-coach',
    '/nutrition',
    '/workout',
  ],
};