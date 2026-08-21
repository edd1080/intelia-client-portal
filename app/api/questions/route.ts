import { NextRequest, NextResponse } from "next/server";
import { createClientQuestionFromSnapshot } from "@/lib/portal-questions";
import { isPortalSessionValid } from "@/lib/portal-auth";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin || origin === process.env.NEXT_PUBLIC_APP_URL;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 10_000 || !sameOrigin(request)) {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }
    const { token, message } = await request.json();
    if (typeof token !== "string" || token.length < 2 || token.length > 200 || typeof message !== "string" || message.trim().length < 3 || message.trim().length > 2_000) {
      return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });
    }

    if (!(await isPortalSessionValid(token))) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    await createClientQuestionFromSnapshot(token, message.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[questions] error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No se pudo registrar la pregunta" }, { status: 500 });
  }
}
