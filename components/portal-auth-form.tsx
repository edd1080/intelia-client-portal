"use client";

import { useState } from "react";

export function PortalAuthForm({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    setMessage("");
    const response = await fetch("/api/portal-auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "No se pudo enviar el código.");
      return;
    }
    setDevCode(data.devCode);
    setStep("code");
    setState("idle");
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim().length !== 6) return;
    setState("loading");
    setMessage("");
    const response = await fetch("/api/portal-auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error || "Código inválido o expirado.");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="auth-stage">
      <div className="aurora-field" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />
      <section className="auth-card">
        <div className="auth-glow auth-glow-a" />
        <div className="auth-glow auth-glow-b" />
        <div className="auth-mark">in</div>
        <p className="auth-kicker">Portal seguro de cliente</p>
        <h1>Acceso con código temporal</h1>
        <p className="auth-copy">Ingresa el correo autorizado para este proyecto. Te enviaremos un código de 6 dígitos antes de mostrar la información.</p>

        {step === "email" ? (
          <form className="auth-form" onSubmit={requestCode}>
            <label htmlFor="portal-email">Correo autorizado</label>
            <input id="portal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@empresa.com" autoComplete="email" required />
            <button disabled={state === "loading"}>{state === "loading" ? "Enviando…" : "Continuar"}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyCode}>
            <p className="auth-hint">Si el correo está autorizado, enviamos el código a <strong>{email}</strong>.</p>
            {devCode && <p className="auth-dev">Código local de prueba: <strong>{devCode}</strong></p>}
            <label htmlFor="portal-code">Código de acceso</label>
            <input id="portal-code" className="code-input" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="123456" autoComplete="one-time-code" required />
            <button disabled={state === "loading"}>{state === "loading" ? "Verificando…" : "Verificar y entrar"}</button>
            <button className="ghost-button" type="button" onClick={() => { setStep("email"); setCode(""); setMessage(""); }}>Usar otro correo</button>
          </form>
        )}

        {message && <p className="auth-error">{message}</p>}
        <p className="auth-footnote">Acceso de solo lectura. La información se consulta directamente desde Airtable.</p>
      </section>
    </main>
  );
}
