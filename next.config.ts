import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	// Tambahkan konfigurasi lain di bawah ini jika nanti diperlukan
	typescript: {
		// Mengabaikan error tipe TypeScript saat proses build Docker
		ignoreBuildErrors: true,
	},
	optimizeFonts: false,
	experimental: {
		serverActions: {
			bodySizeLimit: "5mb",
		},
	},
};

export default nextConfig;
