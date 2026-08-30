"use client";

import { LayoutDashboard, Users, Clock, BookOpen, FileBarChart, Settings, Star } from "lucide-react";
import ResponsiveLayout from "../components/ResponsiveLayout";

export default function PimpinanLayoutClient({ children, user }: { children: React.ReactNode; user: any }) {
	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/pimpinan/dashboard" },
		{ name: "Kehadiran Siswa", icon: Users, path: "/pimpinan/kehadiran" },
		{ name: "Monitoring KBM", icon: Clock, path: "/pimpinan/monitoring" },
		{ name: "Jurnal Mengajar", icon: BookOpen, path: "/pimpinan/jurnal" },
		{ name: "Rating Guru", icon: Star, path: "/pimpinan/rating" },
		{ name: "Laporan Rekapitulasi", icon: FileBarChart, path: "/pimpinan/report" },
		{ name: "Laporan Konseling", icon: BookOpen, path: "/pimpinan/konseling" },
		{ name: "Setelan", icon: Settings, path: "/pimpinan/setelan" },
	];

	return (
		<ResponsiveLayout menuItems={menuItems} user={user} portalName="Dashboard Pimpinan">
			{children}
		</ResponsiveLayout>
	);
}
