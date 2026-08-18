import { NextRequest, NextResponse } from "next/server";
import { createClientQuestionFromSnapshot } from "@/lib/portal-questions";
import { isPortalSessionValid } from "@/lib/portal-auth";

export async function POST(request: NextRequest) {
  try {
    const { token, message } = await request.json();
    if (typeof token !== "string" || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });
    }

    if (!(await isPortalSessionValid(token))) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    await createClientQuestionFromSnapshot(token, message.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar la pregunta" }, { status: 500 });
  }
}
