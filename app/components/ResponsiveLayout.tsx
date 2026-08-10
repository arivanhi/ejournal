"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, Bell, Settings, UserCircle } from "lucide-react";
import styles from "./responsiveLayout.module.css";

interface MenuItem {
	name: string;
	path: string;
	icon: any;
}

interface ResponsiveLayoutProps {
	menuItems: MenuItem[];
	user: {
		nama: string;
		role: string;
	};
	portalName: string;
	children: React.ReactNode;
}

export default function ResponsiveLayout({ menuItems, user, portalName, children }: ResponsiveLayoutProps) {
	const pathname = usePathname();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
	const closeSidebar = () => setIsSidebarOpen(false);

	const getRoleDisplay = (role: string) => {
		switch (role) {
			case "KEPSEK":
				return "Kepala Sekolah";
			case "WAKA":
				return "Wakil Kepala Sekolah";
			case "ADMIN_TU":
				return "Admin TU";
			case "GURU":
				return "Guru";
			case "WALI_KELAS":
				return "Wali Kelas";
			default:
				return role;
		}
	};

	return (
		<div className={styles.layoutWrapper}>
			{/* Mobile Sidebar Overlay */}
			<div
				className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.open : ""}`}
				onClick={closeSidebar}
			></div>

			{/* Sidebar */}
			<aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>
				<div className={styles.sidebarContent}>
					<div className={styles.sidebarHeader}>
						<div className={styles.sidebarHeaderLeft}>
							<div className={styles.logoWrapper}>
								<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" className={styles.logoImage} />
							</div>
							<div>
								<div className={styles.schoolName}>SMAN 2 Brebes</div>
								<div className={styles.portalName}>{portalName}</div>
							</div>
						</div>
						<button className={styles.closeSidebarBtn} onClick={closeSidebar}>
							<X size={20} />
						</button>
					</div>

					<nav className={styles.menuContainer}>
						{menuItems.map((item) => {
							const isActive = pathname === item.path;
							return (
								<Link
									key={item.name}
									href={item.path}
									className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
									onClick={closeSidebar}
								>
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

			{/* Main Content */}
			<div className={styles.mainContent}>
				<header className={styles.topbar}>
					<div className={styles.topbarLeft}>
						<button className={styles.burgerBtn} onClick={toggleSidebar}>
							<Menu size={24} />
						</button>
						<h1 className={styles.topbarTitle}>E-Journal & Presensi</h1>
					</div>
					<div className={styles.topbarActions}>
						<div className={styles.profileSection}>
							<div className={styles.profileInfo}>
								<span className={styles.profileName}>{user.nama}</span>
								<span className={styles.profileRole}>{getRoleDisplay(user.role)}</span>
							</div>
							<div className={styles.avatar}>
								<UserCircle size={32} />
							</div>
						</div>
					</div>
				</header>

				<div className={styles.contentScroll}>
					{children}
				</div>
			</div>
		</div>
	);
}
