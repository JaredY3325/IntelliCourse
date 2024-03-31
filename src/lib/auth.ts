import { DefaultSession, NextAuthOptions, getServerSession } from "next-auth";
import { prisma } from "./db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      // make JWT include id and credit
      id: string;
      credits: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    credits: number;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    // Configured to use JWT for session management. stored on client-side
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token }) => {
      // find user based on jwt token
      const db_user = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });
      // bind database id and credit with jwt token, everytime a JWT is issuedf
      if (db_user) {
        token.id = db_user.id;
        token.credits = db_user.credits as number;
      }
      return token;
    },
    // Updates sessions to include user details from token, allowing them to be accessed on client side
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.credits = token.credits;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET as string,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
};
export const getAuthSession = () => {
  return getServerSession(authOptions);
};

// const deleteAllUsers = async () => {
//   try {
//     const deleteResult = await prisma.user.deleteMany({});
//     console.log(`Delete ${deleteResult.count} users`);
//   } catch (err) {
//     console.error("Error deleting users", err);
//   }
// };

// deleteAllUsers();
