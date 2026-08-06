import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { generateSmartNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await currentSession();
    if (!session) {
      return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
    }

    const notifications = await generateSmartNotifications();
    return NextResponse.json(
      { notifications, total: notifications.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Notifications load failed", error);
    return NextResponse.json({ message: "تعذر تحميل التنبيهات." }, { status: 500 });
  }
}
