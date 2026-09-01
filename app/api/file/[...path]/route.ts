import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync, statSync } from "fs";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	try {
		const resolvedParams = await params;
		const pathArray = resolvedParams.path;
		if (!pathArray || pathArray.length === 0) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const decodedPathArray = pathArray.map((p) => decodeURIComponent(p));
		const filePath = join(process.cwd(), "public", "storage", ...decodedPathArray);

		if (!existsSync(filePath)) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const stat = statSync(filePath);
		if (!stat.isFile()) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const fileBuffer = await readFile(filePath);
		
		const ext = filePath.split('.').pop()?.toLowerCase();
		let contentType = "application/octet-stream";
		if (ext === "pdf") contentType = "application/pdf";
		else if (ext === "png") contentType = "image/png";
		else if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
		
		return new NextResponse(fileBuffer, {
			headers: {
				"Content-Type": contentType,
				"Content-Length": stat.size.toString(),
			},
		});
	} catch (error) {
		console.error("Error serving file:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
