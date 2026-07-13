"use client";

import {
	LogOut,
	LayoutDashboard,
	Users,
	BookOpen,
	Database,
	Calendar,
	UserSquare,
	Bell,
	UserCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
		{ name: "Manajemen Role", icon: Users, path: "/admin/roles" },
		{ name: "Manajemen Mapel", icon: BookOpen, path: "/admin/mapel" },
		{ name: "Data Master", icon: Database, path: "/admin/master" },
		{ name: "Jadwal Pelajaran", icon: Calendar, path: "/admin/jadwal" },
		{ name: "Teacher View", icon: UserSquare, path: "/admin/teacher-view" },
	];

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="w-64 bg-[#0a2540] text-white flex flex-col justify-between">
				<div>
					{/* Logo & Title */}
					<div className="p-6 flex items-center gap-4">
						<div className="bg-white p-1 rounded-lg">
							<img src="/next.svg" alt="Logo" className="h-8 w-8 object-contain" />
						</div>
						<div>
							<h2 className="font-bold text-lg leading-tight">
								SMAN 2<br />
								Brebes
							</h2>
							<p className="text-xs text-blue-300">Admin Portal</p>
						</div>
					</div>

					{/* Navigation */}
					<nav className="mt-6 px-4 space-y-1">
						{menuItems.map((item) => {
							const isActive = pathname === item.path;
							return (
								<Link key={item.name} href={item.path}>
									<div
										className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${isActive ? "bg-white/10 border-l-4 border-yellow-400 font-semibold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
									>
										<item.icon className="h-5 w-5" />
										<span className="text-sm">{item.name}</span>
									</div>
								</Link>
							);
						})}
					</nav>
				</div>

				{/* Logout Button */}
				<div className="p-4 border-t border-white/10">
					<button
						onClick={() => signOut({ callbackUrl: "/login" })}
						className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl w-full transition-colors"
					>
						<LogOut className="h-5 w-5" />
						<span className="text-sm font-semibold">Keluar</span>
					</button>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
				<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
					<h1 className="font-semibold text-gray-700">E-Journal & Presensi</h1>
					<div className="flex items-center gap-4">
						<button className="text-gray-400 hover:text-gray-600">
							<Bell className="h-5 w-5" />
						</button>
						<div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
							{/* Avatar Placeholder */}
							<UserCircle className="h-full w-full text-gray-500" />
						</div>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 overflow-y-auto p-8">{children}</main>
			</div>
		</div>
	);
}
