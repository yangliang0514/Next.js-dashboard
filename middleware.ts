import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // specifies what paths it should run on
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
