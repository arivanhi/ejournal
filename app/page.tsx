import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/login");
	}

	// Arahkan ke dashboard masing-masing berdasarkan Role
	switch (session.user.role) {
		case "ADMIN_TU":
			redirect("/admin");
		case "GURU":
			redirect("/teacher");
		case "WALI_KELAS":
			redirect("/wali-kelas");
		case "WAKA":
			redirect("/waka");
		case "SISWA":
			redirect("/siswa");
		default:
			redirect("/login");
	}
}
