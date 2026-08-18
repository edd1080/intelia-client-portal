import { resolveProjectByPublicIdentifierFromSnapshot } from "@/lib/portal-snapshots";

const API_ROOT = "https://api.airtable.com/v0";
const QUESTIONS_TABLE = "Preguntas";

function airtableToken() {
  const value = process.env.AIRTABLE_API_KEY;
  if (!value) throw new Error("Missing AIRTABLE_API_KEY");
  return value;
}

export async function createClientQuestionFromSnapshot(accessToken: string, message: string) {
  const data = resolveProjectByPublicIdentifierFromSnapshot(accessToken);
  if (!data || accessToken === "demo") throw new Error("Project not found");

  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(`${API_ROOT}/${data.source.baseId}/${encodeURIComponent(QUESTIONS_TABLE)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${airtableToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      typecast: true,
      fields: {
        Proyecto: [data.project.id],
        Autor: "cliente",
        Mensaje: message,
        Fecha: today,
        Estado: "sin responder",
      },
    }),
  });

  if (!response.ok) throw new Error(`Airtable ${response.status}: ${await response.text()}`);
  return response.json();
}
