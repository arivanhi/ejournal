"use client";

import { LayoutDashboard, Users, BookOpen, Database, Calendar, UserSquare } from "lucide-react";
import ResponsiveLayout from "../components/ResponsiveLayout";

export default function AdminLayoutClient({ children, user }: { children: React.ReactNode; user: any }) {
	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/admin/" },
		{ name: "Data Master", icon: Database, path: "/admin/master" },
		{ name: "Manajemen Role", icon: Users, path: "/admin/role" },
		{ name: "Manajemen Mapel", icon: BookOpen, path: "/admin/mapel" },
		{ name: "Jadwal Pelajaran", icon: Calendar, path: "/admin/jadwal" },
		{ name: "Tampilan Guru", icon: UserSquare, path: "/teacher/dashboard" },
	];

	return (
		<ResponsiveLayout menuItems={menuItems} user={user} portalName="Portal Admin">
			{children}
		</ResponsiveLayout>
	);
}
