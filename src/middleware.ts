import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  console.log('Middleware triggered for:', req.nextUrl.pathname);
  const token = await auth(req);
  const pathname = req.nextUrl.pathname;
  
  // Check if the route is protected
  const isProtectedAdminApi = pathname.startsWith('/api/admin');
  const isProtectedUserApi = pathname.startsWith('/api/checkins') || 
                             pathname.startsWith('/api/upload');
  const isProtectedAdminWeb = pathname.startsWith('/admin');
  const isProtectedUserWeb = pathname.startsWith('/user');

  // Authentication check - no token means unauthorized
  if (!token) {
    // For protected API routes, return 401 Unauthorized
    if (isProtectedAdminApi || isProtectedUserApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For protected web routes, redirect to home page
    if (isProtectedAdminWeb || isProtectedUserWeb) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // For non-protected routes, allow access
    return NextResponse.next();
  }
  
  // User is authenticated, now check authorization based on role
  const role = token.role;
  
  // Admin routes - only admin role can access
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Redirect to user page if user role
      const url = req.nextUrl.clone();
      url.pathname = role === 'user' ? '/user' : '/';
      return NextResponse.redirect(url);
    }
  }
  
  // User routes - only user role can access
  if (pathname.startsWith('/user') || 
      pathname.startsWith('/api/checkins') || 
      pathname.startsWith('/api/upload')) {
    if (role !== 'user') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Redirect admin to admin page, others to home
      const url = req.nextUrl.clone();
      url.pathname = role === 'admin' ? '/admin' : '/';
      return NextResponse.redirect(url);
    }
  }
  
  // If authenticated and authorized, add authorization header for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('Authorization', `Bearer ${token.accessToken}`);
    return NextResponse.next({ headers: requestHeaders });
  }
  
  // Allow access to the route
  return NextResponse.next();
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/api/admin/:path*',
    '/api/checkins/:path*',
    '/api/upload/:path*'
  ],
};