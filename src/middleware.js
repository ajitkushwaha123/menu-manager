import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/zomato-to-swiggy(.*)",
  "/api/(.*)",
  "/login",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const APP_PASSWORD = process.env.APP_PASSWORD;
  
  if (APP_PASSWORD) {
    const authCookie = req.cookies.get('app_auth_token')?.value;
    
    if (authCookie === 'authenticated') {
      return NextResponse.next();
    }

    // Redirect to custom login page
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If no APP_PASSWORD is set, fallback to clerk protection
  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
