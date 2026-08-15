import Link from "next/link";

export default function Home() {
  return (
    <main className="portal-home-shell">
      <div className="portal-home-noise" />
      <section className="portal-home-card">
        <div className="portal-home-mark">NV</div>
        <p className="portal-home-eyebrow">Intelia Client Portal</p>
        <h1>Portal privado de estado de proyectos</h1>
        <p className="portal-home-copy">
          Este dominio funciona como punto seguro para portales de clientes. Cada proyecto se consulta desde un enlace privado asignado por Intelia.
        </p>
        <div className="portal-home-note">
          <span className="portal-home-dot" />
          <span>Si ya tienes tu enlace de proyecto, ábrelo directamente para ver el avance más reciente.</span>
        </div>
        <Link className="portal-home-link" href="/p/demo">
          Ver demo visual
        </Link>
      </section>
    </main>
  );
}
