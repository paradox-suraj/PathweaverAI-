import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user, profile, account }) {
      if (user) {
        console.log("=== NEXTAUTH LOGIN DIAGNOSTIC ===");
        console.log("User Email:", user.email);
        console.log("User Name:", user.name);
        console.log("OAuth Profile:", profile);
        console.log("=================================");
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  ...authConfig,
});
