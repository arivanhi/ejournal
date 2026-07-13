import { Users, GraduationCap, CalendarCheck, Settings, BookCopy, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			{/* Title */}
			<div>
				<h1 className="text-2xl font-bold text-[#0a2540]">Dashboard Overview</h1>
				<p className="text-gray-500 mt-1">High-level statistics and quick administrative actions for SMAN 2 Brebes.</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
					<div className="flex items-center gap-4 mb-2">
						<div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
							<Users className="h-6 w-6" />
						</div>
						<p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Students</p>
					</div>
					<h2 className="text-5xl font-bold text-[#0a2540]">1,248</h2>
				</div>

				<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
					<div className="flex items-center gap-4 mb-2">
						<div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
							<GraduationCap className="h-6 w-6" />
						</div>
						<p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Teachers</p>
					</div>
					<h2 className="text-5xl font-bold text-[#0a2540]">86</h2>
				</div>

				<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
					<div className="flex items-center gap-4 mb-2">
						<div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
							<CalendarCheck className="h-6 w-6" />
						</div>
						<p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Sessions Today</p>
					</div>
					<h2 className="text-5xl font-bold text-[#0a2540]">42</h2>
				</div>
			</div>

			{/* Bottom Section */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Quick Access */}
				<div className="lg:col-span-2 space-y-4">
					<h3 className="text-lg font-bold text-[#0a2540]">Quick Access</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
							<div className="flex justify-between items-start mb-4">
								<div className="p-2 bg-gray-50 text-gray-700 rounded-lg">
									<Settings className="h-5 w-5" />
								</div>
								<ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#0a2540] transition-colors" />
							</div>
							<h4 className="text-lg font-bold text-[#0a2540] mb-2">Manajemen Role</h4>
							<p className="text-sm text-gray-500">
								Configure permissions, assign administrative rights, and manage user roles across the platform.
							</p>
						</div>

						<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
							<div className="flex justify-between items-start mb-4">
								<div className="p-2 bg-gray-50 text-gray-700 rounded-lg">
									<BookCopy className="h-5 w-5" />
								</div>
								<ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#0a2540] transition-colors" />
							</div>
							<h4 className="text-lg font-bold text-[#0a2540] mb-2">Manajemen Mapel</h4>
							<p className="text-sm text-gray-500">
								Setup curriculum, allocate teachers to subjects, and manage academic scheduling.
							</p>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="space-y-4">
					<h3 className="text-lg font-bold text-[#0a2540]">Recent Activity</h3>
					<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
						<div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent hidden"></div>

						{/* Timeline Items */}
						<div className="relative pl-6 mb-6">
							<span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-[#0a2540] bg-white"></span>
							<div className="border-l-2 border-gray-200 absolute left-1 top-4 h-full"></div>
							<h5 className="font-bold text-[#0a2540] text-sm">Role Updated</h5>
							<p className="text-xs text-gray-500 mt-1">Budi Santoso assigned as Homeroom Teacher for X-IPA 1.</p>
							<span className="text-[10px] font-semibold text-gray-400 mt-2 block">10 mins ago</span>
						</div>

						<div className="relative pl-6 mb-6">
							<span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-gray-300 bg-white"></span>
							<div className="border-l-2 border-gray-200 absolute left-1 top-4 h-full"></div>
							<h5 className="font-bold text-gray-700 text-sm">Subject Added</h5>
							<p className="text-xs text-gray-500 mt-1">New curriculum module 'Fisika Lanjutan' added.</p>
							<span className="text-[10px] font-semibold text-gray-400 mt-2 block">2 hours ago</span>
						</div>

						<div className="relative pl-6 mb-6">
							<span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-gray-300 bg-white"></span>
							<h5 className="font-bold text-gray-700 text-sm">System Backup</h5>
							<p className="text-xs text-gray-500 mt-1">Automated database backup completed successfully.</p>
							<span className="text-[10px] font-semibold text-gray-400 mt-2 block">Yesterday, 23:00</span>
						</div>

						<button className="w-full mt-2 border border-gray-200 text-gray-700 font-semibold text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors">
							View Full Log
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
