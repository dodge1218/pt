import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

const demoAuthEnabled = process.env.ENABLE_DEMO_AUTH === "true";
const allowedEmails = parseAllowedEmails(process.env.PROOFTICKET_ALLOWED_EMAILS);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          github: profile.login,
        };
      },
    }),
    ...(demoAuthEnabled
      ? [
          Credentials({
            id: "demo",
            name: "Demo",
            credentials: {},
            async authorize() {
              const user = await prisma.user.upsert({
                where: { email: "builder@example.com" },
                update: {},
                create: {
                  name: "Builder One",
                  email: "builder@example.com",
                  github: "builder-demo",
                  headline: "Coordinating async project work",
                  bio: "Demo builder using scoped agent approvals and durable project tickets.",
                  timezone: "America/New_York",
                  activeStart: "14:30",
                  activeEnd: "03:00",
                },
              });

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      if (allowedEmails.length === 0) return true;
      const email = user.email?.toLowerCase();
      return Boolean(email && allowedEmails.includes(email));
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

function parseAllowedEmails(value?: string) {
  return (value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
