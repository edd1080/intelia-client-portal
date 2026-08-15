import Link from "next/link";

export default function NotFound() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="eyebrow">Link no encontrado</p>
        <h1>No pudimos abrir este proyecto</h1>
        <p>El token puede haber expirado, sido revocado o estar mal copiado.</p>
        <Link className="primary-link" href="/">Volver al inicio</Link>
      </section>
    </main>
  );
}
