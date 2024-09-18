import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from './db';
import { User } from './app/lib/definitions';
import { QueryResult } from 'pg';
import bcrypt from 'bcrypt';

export const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function getUser(email: string) {
  try {
    const user: QueryResult<User> = await sql(
      `SELECT * FROM users WHERE email = '${email}'`
    );

    return user.rows[0];
  } catch (err) {
    console.error('Failed to fetch user:', err);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = AuthSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
});
