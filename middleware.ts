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

		// 2. Proteksi Halaman Guru & Wali Kelas (Menggunakan folder /teacher)
		// Karena satu dashboard menangani 2 role ini, kita gabungkan pengecekannya
		if (path.startsWith("/teacher") && role !== "GURU" && role !== "WALI_KELAS") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// --- AUTO-REDIRECT (SOLUSI 404) ---
		// Jika sistem/login mengarahkan ke "/teacher", "/guru", atau "/wali-kelas",
		// langsung belokkan secara paksa ke "/teacher/dashboard"
		if (path === "/teacher" || path === "/guru" || path === "/wali-kelas") {
			return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
		}

		// 3. Proteksi Halaman Siswa (Mobile Web App)
		if (path.startsWith("/siswa") && role !== "SISWA") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// 4. Proteksi Halaman Waka
		if (path.startsWith("/waka") && role !== "WAKA") {
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
		"/teacher/:path*", // <--- WAJIB DITAMBAHKAN AGAR NEXT-AUTH MENGENALI ROUTE INI
		"/guru/:path*",
		"/siswa/:path*",
		"/waka/:path*",
		"/wali-kelas/:path*",
	],
};
