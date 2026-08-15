import { NextRequest, NextResponse } from "next/server";
import { verifyPortalCode } from "@/lib/portal-auth";

export async function POST(request: NextRequest) {
  try {
    const { token, code } = await request.json();
    if (typeof token !== "string" || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }
    const ok = await verifyPortalCode(token, code);
    if (!ok) return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo verificar el código" }, { status: 500 });
  }
}
