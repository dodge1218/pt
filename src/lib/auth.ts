import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

const demoAuthEnabled = process.env.ENABLE_DEMO_AUTH === "true";

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
                where: { email: "ryan@dreamsitebuilders.com" },
                update: {},
                create: {
                  name: "Ryan",
                  email: "ryan@dreamsitebuilders.com",
                  github: "dodge1218",
                  headline: "Building 6 things at once",
                  bio: "Full-stack dev. Running DreamSiteBuilders. Building tools for builders who use AI as core workflow.",
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
