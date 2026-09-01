"use client";

import { LayoutDashboard, Clock, FileText, CheckCircle, Users, Settings, BookOpen } from "lucide-react";
import ResponsiveLayout from "../components/ResponsiveLayout";

export default function TeacherLayoutClient({ children, user, isGuruBK = false, isKoorBk = false }: { children: React.ReactNode; user: any; isGuruBK?: boolean; isKoorBk?: boolean }) {
	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
		{ name: "Isi Jurnal", icon: FileText, path: "/teacher/jurnal" },
		{ name: "Jurnal TKA", icon: BookOpen, path: "/teacher/jurnal-tka" },
		...(isGuruBK ? [{ name: "Jurnal Konseling", icon: BookOpen, path: "/teacher/jurnal-konseling" }] : []),
		{ name: "QR Presensi", icon: Clock, path: "/teacher/presensi" },
		{ name: "Riwayat Mengajar", icon: CheckCircle, path: "/teacher/riwayat" },
		...(user?.role === "WALI_KELAS" ? [
			{ name: "Data Siswa", icon: Users, path: "/teacher/data-siswa" },
			{ name: "Konseling Kelas", icon: Users, path: "/teacher/konseling-kelas" }
		] : []),
		...(isKoorBk ? [{ name: "Kehadiran Siswa", icon: Users, path: "/teacher/kehadiran-koor" }] : []),
		{ name: "Setelan", icon: Settings, path: "/teacher/setelan" },
	];

	return (
		<ResponsiveLayout menuItems={menuItems} user={user} portalName="Portal Guru">
			{children}
		</ResponsiveLayout>
	);
}
