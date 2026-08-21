import { NextRequest, NextResponse } from "next/server";
import { verifyPortalCode } from "@/lib/portal-auth";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin || origin === process.env.NEXT_PUBLIC_APP_URL;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 2_000 || !sameOrigin(request)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    const { token, code } = await request.json();
    if (typeof token !== "string" || token.length < 2 || token.length > 200 || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }
    const ok = await verifyPortalCode(token, code);
    if (!ok) return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[portal-auth/verify] error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No se pudo verificar el código" }, { status: 500 });
  }
}
