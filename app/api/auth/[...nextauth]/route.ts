import NextAuth, { NextAuthOptions } from "next-auth";
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

				// Cari user di database berdasarkan username
				const user = await prisma.user.findUnique({
					where: { username: credentials.username },
				});

				if (!user) {
					return null; // Username tidak ditemukan
				}

				// Bandingkan password yang diinput dengan hash di database
				const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

				if (!isPasswordValid) {
					return null; // Password salah
				}

				// Jika berhasil, kembalikan objek user yang akan disimpan di Token JWT
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
		// Memasukkan data custom ke dalam Token JWT
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
		// Meneruskan data dari Token JWT agar bisa dibaca di frontend (Session)
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id;
				session.user.username = token.username;
				session.user.role = token.role;
			}
			return session;
		},
	},
	session: {
		strategy: "jwt",
		maxAge: 24 * 60 * 60, // Sesi aktif selama 1 hari
	},
	pages: {
		signIn: "/login", // Nanti kita buat custom UI halamannya di sini
	},
	secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
