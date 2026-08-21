import { NextRequest, NextResponse } from "next/server";
import { requestPortalCode } from "@/lib/portal-auth";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin || origin === process.env.NEXT_PUBLIC_APP_URL;
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 10_000 || !sameOrigin(request)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    const { token, email } = await request.json();
    if (typeof token !== "string" || token.length < 2 || token.length > 200 || typeof email !== "string" || email.length > 320 || !email.includes("@")) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const result = await requestPortalCode(token, email, clientIp(request));
    if (result.rateLimited) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta más tarde.", retryAfter: result.retryAfter }, { status: 429 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[portal-auth/request] error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No se pudo enviar el código" }, { status: 500 });
  }
}
