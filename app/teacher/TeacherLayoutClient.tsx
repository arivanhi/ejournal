"use client";

import { LayoutDashboard, Clock, FileText, CheckCircle, Users, Settings } from "lucide-react";
import ResponsiveLayout from "../components/ResponsiveLayout";

export default function TeacherLayoutClient({ children, user }: { children: React.ReactNode; user: any }) {
	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
		{ name: "Jadwal & Presensi", icon: Clock, path: "/teacher/presensi" },
		{ name: "Isi Jurnal", icon: FileText, path: "/teacher/jurnal" },
		{ name: "Riwayat Mengajar", icon: CheckCircle, path: "/teacher/riwayat" },
		...(user?.role === "WALI_KELAS" ? [{ name: "Data Siswa", icon: Users, path: "/teacher/data-siswa" }] : []),
		{ name: "Setelan", icon: Settings, path: "/teacher/setelan" },
	];

	return (
		<ResponsiveLayout menuItems={menuItems} user={user} portalName="Portal Guru">
			{children}
		</ResponsiveLayout>
	);
}
