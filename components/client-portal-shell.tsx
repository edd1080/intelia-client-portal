"use client";

import { useMemo, useState } from "react";
import { QuestionForm } from "@/components/question-form";
import { ClientPortalData, Task } from "@/lib/airtable";

type SectionId = "resumen" | "actividad" | "tareas" | "roadmap" | "preguntas" | "archivos" | "metricas";

const sectionKeys = {
  kanban: ["kanban", "tareas", "tablero"],
  milestones: ["hitos", "timeline", "línea de tiempo", "linea de tiempo"],
  activity: ["actividad", "feed"],
  questions: ["preguntas", "q&a", "qa"],
  files: ["archivos", "entregables", "files"],
  metrics: ["metricas", "métricas", "impacto"],
};

function isEnabled(data: ClientPortalData, section: keyof typeof sectionKeys) {
  if (!data.project.enabledSections.length) return true;
  const enabled = data.project.enabledSections.map((item) => item.toLowerCase());
  return sectionKeys[section].some((key) => enabled.includes(key));
}

function formatDate(date?: string) {
  if (!date) return "Por definir";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("riesgo")) return "risk";
  if (normalized.includes("atras")) return "late";
  if (normalized.includes("complet")) return "done";
  if (normalized.includes("paus")) return "paused";
  return "active";
}

function groupTasks(tasks: Task[]) {
  const order = ["por hacer", "en progreso", "en revisión", "en revision", "completado"];
  const groups = new Map<string, Task[]>();
  for (const status of order) groups.set(status, []);
  for (const task of tasks) {
    const key = task.status.toLowerCase();
    const canonical = order.find((status) => status === key) ?? task.status;
    groups.set(canonical, [...(groups.get(canonical) ?? []), task]);
  }
  return Array.from(groups.entries()).filter(([, items]) => items.length > 0);
}

function percent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

export function ClientPortalShell({ data, token }: { data: ClientPortalData; token: string }) {
  const [active, setActive] = useState<SectionId>("resumen");
  const tone = statusTone(data.project.status);
  const tasksDone = data.tasks.filter((task) => task.status.toLowerCase().includes("complet")).length;
  const currentTasks = data.tasks.filter((task) => task.isCurrent);
  const visibleTasks = data.tasks.filter((task) => task.visibleToClient).length;
  const progress = percent(tasksDone, data.tasks.length);
  const groups = useMemo(() => groupTasks(data.tasks), [data.tasks]);
  const initials = data.client.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const allNav: { id: SectionId; label: string; icon: string; enabled: boolean }[] = [
    { id: "resumen", label: "Resumen", icon: "✦", enabled: true },
    { id: "actividad", label: "Updates", icon: "↻", enabled: isEnabled(data, "activity") },
    { id: "tareas", label: "Tareas", icon: "✓", enabled: isEnabled(data, "kanban") },
    { id: "roadmap", label: "Roadmap", icon: "⌁", enabled: isEnabled(data, "milestones") },
    { id: "preguntas", label: "Preguntas", icon: "?", enabled: isEnabled(data, "questions") },
    { id: "archivos", label: "Archivos", icon: "□", enabled: isEnabled(data, "files") },
    { id: "metricas", label: "Impacto", icon: "%", enabled: isEnabled(data, "metrics") && data.impactMetrics.length > 0 },
  ];
  const nav = allNav.filter((item) => item.enabled);

  return (
    <main className="client-app" style={{ "--brand": data.client.brandColor || "#10b981" } as React.CSSProperties}>
      <div className="aurora-field" aria-hidden="true" />
      <div className="noise-layer" aria-hidden="true" />

      <aside className="side-dock" aria-label="Navegación del portal">
        <div className="dock-logo">{initials || "IN"}</div>
        <nav>
          {nav.map((item) => (
            <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
        <div className="dock-help">?</div>
      </aside>

      <section className="portal-workspace">
        <header className="top-glass">
          <div>
            <p className="micro-label">{data.project.code}</p>
            <h1>{data.project.name}</h1>
            <div className="header-meta">
              <span className={`status-dot ${tone}`} />
              <strong>{data.project.status}</strong>
              <span>{data.client.name}</span>
              <span>Actualizado: {formatDate(data.lastUpdated.date)}</span>
            </div>
          </div>
          <div className="read-badge">Solo lectura</div>
        </header>

        <div className="mobile-nav" aria-label="Navegación móvil">
          {nav.map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>{item.label}</button>)}
        </div>

        {active === "resumen" && (
          <section className="screen-grid enter-screen">
            <article className="glass-card hero-summary wide-card">
              <div>
                <p className="pill-label">Status oficial</p>
                <h2>Estado ejecutivo del proyecto</h2>
                <p>{data.project.executiveSummary}</p>
                {tone === "risk" && <div className="insight-note">Transparencia sin alarma: aquí se muestra qué está pasando y qué decisión o insumo ayuda a destrabar el avance.</div>}
              </div>
              <div className="progress-module">
                <span>{progress}%</span>
                <p>Progreso por tareas</p>
                <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
                <small>{tasksDone} de {data.tasks.length} tareas completadas · {currentTasks.length} activas</small>
              </div>
            </article>

            <article className="gradient-card green-card">
              <h3>Tareas</h3>
              <p>Distribución viva del trabajo visible e interno.</p>
              <div className="stat-rows">
                <div><span>Completadas</span><strong>{tasksDone}</strong></div>
                <div><span>En trabajo</span><strong>{currentTasks.length}</strong></div>
                <div><span>Visibles</span><strong>{visibleTasks}</strong></div>
              </div>
            </article>

            <article className="gradient-card slate-card">
              <h3>Próximo hito</h3>
              <p>{data.project.nextMilestone || "Por definir"}</p>
              <small>{formatDate(data.project.nextMilestoneDate)}</small>
            </article>

            <article className="glass-card activity-preview wide-card soft-dark">
              <div className="section-title"><span>Actividad reciente</span><h3>Lo último que cambió</h3></div>
              <div className="update-cards compact">
                {data.activity.slice(0, 3).map((item) => (
                  <article key={item.id}>
                    <time>{formatDate(item.date)}</time>
                    <p>{item.description}</p>
                    <span>{item.type || "update"}</span>
                  </article>
                ))}
              </div>
            </article>
          </section>
        )}

        {active === "actividad" && (
          <section className="enter-screen stacked-screen">
            <div className="section-title"><span>Updates</span><h2>Actividad reciente</h2><p>Un feed claro de lo que se movió, sin formato estático de reporte.</p></div>
            <div className="activity-river">
              {data.activity.map((item, index) => (
                <article key={item.id}>
                  <div className="river-index">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <time>{formatDate(item.date)}</time>
                    <p>{item.description}</p>
                    <span>{item.type || "nota"} · {item.origin || data.lastUpdated.by}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {active === "tareas" && (
          <section className="enter-screen stacked-screen">
            <div className="section-title"><span>Tablero</span><h2>Tareas del proyecto</h2><p>{data.tasks.length} tareas asociadas · {visibleTasks} visibles para cliente.</p></div>
            {currentTasks.length > 0 && <div className="current-strip"><strong>En trabajo ahora</strong>{currentTasks.map((task) => <span key={task.id}>{task.name}</span>)}</div>}
            <div className="kanban-board">
              {groups.map(([status, tasks]) => (
                <div className="kanban-lane" key={status}>
                  <header><h3>{status}</h3><span>{tasks.length}</span></header>
                  {tasks.map((task) => (
                    <article className={task.isCurrent ? "task-item current" : "task-item"} key={task.id}>
                      <strong>{task.name}</strong>
                      <div>{task.isCurrent && <span>En trabajo</span>}{!task.visibleToClient && <span>Interna</span>}</div>
                      {task.milestone && <small>{task.milestone}</small>}
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {active === "roadmap" && (
          <section className="enter-screen stacked-screen">
            <div className="section-title"><span>Roadmap</span><h2>Hitos principales</h2><p>Secuencia simple de decisiones, entregas y validaciones.</p></div>
            <div className="roadmap-line">
              {data.milestones.map((milestone, index) => (
                <article key={milestone.id} className={statusTone(milestone.status)}>
                  <div className="road-dot">{index + 1}</div>
                  <div><h3>{milestone.name}</h3><p>{milestone.status}</p></div>
                  <time>{formatDate(milestone.actualDate || milestone.estimatedDate)}</time>
                </article>
              ))}
            </div>
          </section>
        )}

        {active === "preguntas" && (
          <section className="enter-screen split-screen">
            <div className="glass-card"><div className="section-title"><span>Preguntas</span><h2>Dudas y respuestas</h2><p>Escribe una pregunta; Intelia responde aquí mismo.</p></div><QuestionForm token={token} /></div>
            <div className="qa-panel">
              {data.questions.map((question) => <article key={question.id}><p>{question.message}</p>{question.answer ? <strong>{question.answer}</strong> : <span>Pendiente de respuesta</span>}</article>)}
            </div>
          </section>
        )}

        {active === "archivos" && (
          <section className="enter-screen stacked-screen">
            <div className="section-title"><span>Entregables</span><h2>Archivos publicados</h2><p>Documentos y entregables visibles para este proyecto.</p></div>
            <div className="file-grid">
              {data.files.map((file) => file.url ? <a key={file.id} href={file.url} target="_blank" rel="noreferrer"><span>□</span><strong>{file.name}</strong><small>{file.category || "Archivo"} · {formatDate(file.date)}</small></a> : <article key={file.id}><span>□</span><strong>{file.name}</strong><small>{file.category || "Archivo"} · {formatDate(file.date)} · enlace pendiente</small></article>)}
            </div>
          </section>
        )}

        {active === "metricas" && (
          <section className="enter-screen stacked-screen">
            <div className="section-title"><span>Impacto</span><h2>Métricas del proyecto</h2><p>Indicadores de avance o valor de negocio reportados.</p></div>
            <div className="impact-grid">
              {data.impactMetrics.map((metric) => <article key={metric.label}><strong>{metric.value || "—"}</strong><span>{metric.label}</span>{metric.note && <small>{metric.note}</small>}</article>)}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
