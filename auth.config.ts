import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    // user will be redirected to this route for login and logout
    signIn: '/login',
  },

  // the authorized callback is used to verify if the request is authorized to access a page via middleware
  // it is called before a request is completed and receives an object withthe auth and request property
  // the auth property contains the user's session
  // the request property contains the request object
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
