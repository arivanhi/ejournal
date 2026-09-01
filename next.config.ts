import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	// Tambahkan konfigurasi lain di bawah ini jika nanti diperlukan
	eslint: {
		// Mengabaikan peringatan/error ESLint saat proses build Docker
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Mengabaikan error tipe TypeScript saat proses build Docker
		ignoreBuildErrors: true,
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "5mb",
		},
	},
};

export default nextConfig;
