"use client";

import { useState } from "react";

export function QuestionForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setState("sending");
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, message }),
    });
    if (response.ok) {
      setMessage("");
      setState("sent");
    } else {
      setState("error");
    }
  }

  if (token === "demo") {
    return <p className="form-note">En la demo el campo está desactivado; en un link real escribe directo a Airtable.</p>;
  }

  return (
    <form className="question-form" onSubmit={submit}>
      <label htmlFor="question">Dejar una pregunta para Chava</label>
      <textarea
        id="question"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Escribe tu duda en una frase clara…"
        rows={4}
      />
      <button disabled={state === "sending"}>{state === "sending" ? "Enviando…" : "Enviar pregunta"}</button>
      {state === "sent" && <p className="success">Pregunta recibida. Te responderemos por este mismo portal.</p>}
      {state === "error" && <p className="error">No se pudo enviar. Intenta de nuevo en unos minutos.</p>}
    </form>
  );
}
