import { NextRequest, NextResponse } from "next/server";
import { requestPortalCode } from "@/lib/portal-auth";

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();
    if (typeof token !== "string" || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const result = await requestPortalCode(token, email);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo enviar el código" }, { status: 500 });
  }
}
