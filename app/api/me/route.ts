import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";

export async function GET() {
  const user = await getUserSession();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
}
