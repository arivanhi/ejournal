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
		if (path.startsWith("/teacher") && role !== "GURU" && role !== "WALI_KELAS") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// --- AUTO-REDIRECT (GURU/WALI KELAS) ---
		if (path === "/teacher" || path === "/guru" || path === "/wali-kelas") {
			return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
		}

		// 3. Proteksi Halaman Siswa (Mobile Web App)
		if (path.startsWith("/siswa") && role !== "SISWA") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// 4. Proteksi Halaman Pimpinan (Waka & Kepsek)
		if (path.startsWith("/pimpinan") && role !== "WAKA" && role !== "KEPSEK") {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// --- AUTO-REDIRECT (PIMPINAN) ---
		if (path === "/pimpinan" || path === "/waka" || path === "/kepsek") {
			return NextResponse.redirect(new URL("/pimpinan/dashboard", req.url));
		}

		// Jika otorisasi lolos, lanjutkan perjalanan user
		return NextResponse.next();
	},
	{
		callbacks: {
			// Fungsi ini akan mengecek apakah user memiliki token (sudah login)
			authorized: ({ token }) => !!token,
		},
	},
);

// Tentukan URL/Route mana saja yang HARUS dicegat oleh middleware ini
export const config = {
	matcher: [
		"/admin/:path*",
		"/teacher/:path*",
		"/guru/:path*",
		"/siswa/:path*",
		"/wali-kelas/:path*",
		"/pimpinan/:path*", // <--- WAJIB DITAMBAHKAN UNTUK KEPSEK/WAKASEK
		"/waka/:path*",
		"/kepsek/:path*",
	],
};
