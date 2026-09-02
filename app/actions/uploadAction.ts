"use server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function uploadFileAction(formData: FormData) {
	try {
		const file = formData.get("file") as File;
		const kelasName = formData.get("kelasName") as string;
		const siswaName = formData.get("siswaName") as string;

		if (!file) {
			return { success: false, message: "No file uploaded" };
		}
		if (!kelasName || !siswaName) {
			return { success: false, message: "Missing kelasName or siswaName" };
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Format folder name: safe string
		const safeKelasName = kelasName.replace(/[^a-zA-Z0-9-_\.]/g, "_");
		const safeSiswaName = siswaName.replace(/[^a-zA-Z0-9-_\.]/g, "_");
		
		const uploadDir = join(process.cwd(), "public", "storage", "uploads", safeKelasName, safeSiswaName);

		// Create directory if it doesn't exist
		if (!existsSync(uploadDir)) {
			await mkdir(uploadDir, { recursive: true });
		}

		// Ensure unique filename
		const timestamp = Date.now();
		const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");
		const fileName = `${timestamp}_${safeFileName}`;
		
		const filePath = join(uploadDir, fileName);

		await writeFile(filePath, buffer);

		// Return the public URL path
		const fileUrl = `/storage/uploads/${safeKelasName}/${safeSiswaName}/${fileName}`;

		return { success: true, fileUrl };
	} catch (error: any) {
		console.error("Upload error:", error);
		return { success: false, message: "Server error during upload: " + (error?.message || String(error)) };
	}
}
