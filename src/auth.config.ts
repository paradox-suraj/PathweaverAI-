import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    ...(process.env.NODE_ENV !== 'production' ? [
      CredentialsProvider({
        name: "Test Account",
        credentials: {
          username: { label: "Username", type: "text", placeholder: "testuser" },
        },
        async authorize(credentials) {
          // Dev only: allow instant login with any username for testing isolation
          const username = credentials?.username as string;
          if (!username) return null;
          
          return {
            id: `test-id-${username}`,
            name: username,
            email: `${username}@test.com`,
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + username,
          };
        },
      })
    ] : []),
  ],
  trustHost: true,
} satisfies NextAuthConfig;
