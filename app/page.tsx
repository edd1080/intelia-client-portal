import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="eyebrow">Intelia</p>
        <h1>Portal privado de estado de proyectos</h1>
        <p>
          Cada proyecto se consulta desde un link único. Si tienes un link de cliente,
          ábrelo directamente para ver el avance más reciente.
        </p>
        <Link className="primary-link" href="/p/demo">
          Ver demo visual
        </Link>
      </section>
    </main>
  );
}
