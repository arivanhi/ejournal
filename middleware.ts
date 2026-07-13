import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
	function middleware(req) {
		const path = req.nextUrl.pathname;
		const role = req.nextauth.token?.role;

		// 1. Proteksi Halaman Admin TU
		if (path.startsWith("/admin") && role !== "ADMIN_TU") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// 2. Proteksi Halaman Guru
		if (path.startsWith("/guru") && role !== "GURU") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// 3. Proteksi Halaman Siswa (Mobile Web App)
		if (path.startsWith("/siswa") && role !== "SISWA") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// 4. Proteksi Halaman Waka
		if (path.startsWith("/waka") && role !== "WAKA") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// 5. Proteksi Halaman Wali Kelas
		if (path.startsWith("/wali-kelas") && role !== "WALI_KELAS") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// Jika otorisasi lolos, lanjutkan perjalanan user
		return NextResponse.next();
	},
	{
		callbacks: {
			// Fungsi ini akan mengecek apakah user memiliki token (sudah login)
			// Jika return false, user akan otomatis dilempar kembali ke halaman signIn (/login)
			authorized: ({ token }) => !!token,
		},
	},
);

// Tentukan URL/Route mana saja yang HARUS dicegat oleh middleware ini
export const config = {
	matcher: [
		"/admin/:path*",
		"/guru/:path*",
		"/siswa/:path*",
		"/waka/:path*",
		"/wali-kelas/:path*",
		// Route selain di atas (seperti /login, /api, atau aset gambar) akan dibiarkan lewat
	],
};
