import { NextResponse } from "next/server";
import { generateSmartNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await generateSmartNotifications();
    return NextResponse.json({ notifications, total: notifications.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحميل التنبيهات." }, { status: 500 });
  }
}
