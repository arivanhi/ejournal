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
	HelpCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./adminLayout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	const menuItems = [
		{ name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
		{ name: "Data Master", icon: Database, path: "/admin/master" },
		{ name: "Manajemen Role", icon: Users, path: "/admin/role" },
		{ name: "Manajemen Mapel", icon: BookOpen, path: "/admin/mapel" },
		{ name: "Jadwal Pelajaran", icon: Calendar, path: "/admin/jadwal" },
		{ name: "Tampilan Guru", icon: UserSquare, path: "/teacher/dashboard" },
	];

	return (
		<div className={styles.layoutContainer}>
			{/* Sidebar */}
			<aside className={styles.sidebar}>
				<div>
					<div className={styles.sidebarHeader}>
						<div className={styles.logoWrapper}>
							<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" className={styles.logoImage} />
						</div>
						<div>
							<div className={styles.brandName}>
								SMAN 2<br />
								Brebes
							</div>
							<div className={styles.brandSubtitle}>Portal Admin</div>
						</div>
					</div>

					<nav className={styles.navContainer}>
						{menuItems.map((item) => {
							const isActive = pathname === item.path;
							return (
								<Link key={item.name} href={item.path} className={isActive ? styles.navItemActive : styles.navItem}>
									<item.icon size={18} />
									<span>{item.name}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				<div className={styles.sidebarFooter}>
					<button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutBtn}>
						<LogOut size={18} />
						<span>Keluar</span>
					</button>
				</div>
			</aside>

			{/* Main Area */}
			<div className={styles.mainArea}>
				<header className={styles.header}>
					<div className={styles.headerTitle}>E-Journal & Presensi</div>
					<div className={styles.headerActions}>
						<button className={styles.iconBtn}>
							<Bell size={20} />
						</button>
						<button className={styles.iconBtn}>
							<HelpCircle size={20} />
						</button>
						<div className={styles.avatar}>
							<UserCircle size={32} />
						</div>
					</div>
				</header>

				<main className={styles.contentScroll}>{children}</main>
			</div>
		</div>
	);
}
