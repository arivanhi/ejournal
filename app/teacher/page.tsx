// app/teacher/page.tsx
import { redirect } from "next/navigation";

export default function TeacherIndexPage() {
	// Langsung arahkan (redirect) pengguna ke halaman dashboard
	redirect("/teacher/dashboard");
}
