import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const svgPath = path.join(process.cwd(), "public", "branding", "registration-header.svg");
    const svg = await readFile(svgPath, "utf8");
    const match = svg.match(/data:image\/jpeg;base64,([^"']+)/);

    if (!match?.[1]) {
      return NextResponse.json({ message: "تعذر العثور على صورة الشعار." }, { status: 404 });
    }

    const image = Buffer.from(match[1], "base64");

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(image.length),
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable"
      }
    });
  } catch {
    return NextResponse.json({ message: "تعذر تحميل صورة الشعار." }, { status: 500 });
  }
}
