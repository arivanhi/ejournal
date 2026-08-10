import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: { label: "Username/NISN/NPP", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) {
					return null;
				}

				const user = await prisma.user.findUnique({
					where: { username: credentials.username },
				});

				if (!user) {
					return null;
				}

				const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

				if (!isPasswordValid) {
					return null;
				}

				return {
					id: user.id,
					username: user.username,
					name: user.nama,
					role: user.role,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			if (user) {
				token.id = user.id;
				token.username = user.username;
				token.role = user.role;
			}
			if (trigger === "update" && session?.name) {
				token.name = session.name;
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				(session.user as any).id = token.id;
				(session.user as any).username = token.username;
				(session.user as any).role = token.role;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
		maxAge: 24 * 60 * 60,
	},
	pages: {
		signIn: "/login",
	},
	secret: process.env.NEXTAUTH_SECRET,
};
