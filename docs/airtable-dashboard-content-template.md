# Plantilla oficial de contenido para Airtable → Portal Cliente Intelia

Esta plantilla define qué información debe cargarse en Airtable para que el dashboard tranquilice al cliente, explique avance real y evite pedir updates por WhatsApp.

## Principio editorial

Cada update debe responder en menos de 10 segundos:

1. ¿Dónde estamos?
2. ¿Qué cambió desde la última vez?
3. ¿Qué falta?
4. ¿Hay riesgos o decisiones pendientes?
5. ¿Qué puede revisar el cliente?

## Tabla: Proyectos

Campos mínimos para el dashboard:

| Campo | Tipo sugerido | Uso en dashboard |
|---|---|---|
| Cliente | Link a Clientes | Aislamiento por cliente |
| Nombre / Proyecto | Texto | Título principal |
| Código | Texto corto | Identificador operativo |
| Estado general | Single select: en progreso, en riesgo, atrasado, pausado, completado | Badge de estado |
| Fase actual | Texto corto | Card principal: “Fase de …” |
| Progreso % | Número 0-100 | Barra de progreso |
| Resumen ejecutivo | Long text | Explicación clara del estado |
| Explicación del avance restante | Long text | Nota bajo resumen: qué representa el % faltante |
| Próximo hito | Texto / lookup | Qué sigue |
| Fecha próximo hito | Fecha | Próximo compromiso visible |
| Fecha estimada de cierre | Fecha | Expectativa de cierre |
| Última actualización | Fecha | Header |
| Actualizado por | Texto / select | Header: Intelia, Hermes, PM |
| Métricas de impacto | Long text `label|value|note` por línea | Card de métricas |
| Semáforo cliente | Single select: tranquilo, atención, decisión requerida | Lectura rápida ejecutiva |
| Mensaje para cliente | Long text | Mensaje humano: por qué debería estar tranquilo o qué necesitamos |

## Tabla: Actividad

Cada registro debe ser una novedad concreta, no una bitácora interna extensa.

| Campo | Tipo sugerido | Regla |
|---|---|---|
| Proyecto | Link a Proyectos | Obligatorio |
| Fecha | Fecha | Obligatorio |
| Tipo | Select: avance, decisión, bloqueo, entrega, reunión, cambio de alcance | Obligatorio |
| Título | Texto corto | Recomendado para UI |
| Descripción en lenguaje plano | Long text | Visible al cliente |
| Qué significa para el cliente | Long text | Por qué importa |
| Origen | Select: Hermes, PM, Cliente, Reunión, Equipo técnico | Auditoría |
| Visible al cliente | Checkbox | Solo publicar lo aprobado |

## Tabla: Tareas

Solo tareas client-facing o agrupaciones entendibles. Evitar tareas internas tipo “refactor hook”.

| Campo | Tipo sugerido | Regla |
|---|---|---|
| Proyecto | Link a Proyectos | Obligatorio |
| Nombre / Tarea | Texto | Visible |
| Descripción cliente | Long text | Explica valor/resultados |
| Estado | Select: por hacer, en progreso, en revisión, completado, bloqueado | Kanban/lista |
| Prioridad | Select: alta, media, baja | Badge |
| Fecha estimada | Fecha | Expectativa |
| Hito relacionado | Link a Hitos | Agrupación |
| Visible al cliente | Checkbox | Obligatorio |
| Es actual | Checkbox | Destacar trabajo vigente |
| Dueño Intelia | Texto/persona | Interno o visible opcional |
| Necesita acción del cliente | Checkbox | Para decisiones pendientes |
| Acción requerida | Long text | Si aplica |

## Tabla: Hitos

| Campo | Tipo sugerido | Uso |
|---|---|---|
| Proyecto | Link a Proyectos | Obligatorio |
| Nombre / Hito | Texto | Roadmap |
| Descripción cliente | Long text | Qué se logra |
| Fecha estimada | Fecha | Roadmap/Gantt |
| Fecha real | Fecha | Cierre real |
| Estado | Select: alcanzado, actual, pendiente, en riesgo, bloqueado | Timeline |
| Criterio de aceptación | Long text | Qué significa completado |

## Tabla: Preguntas

| Campo | Tipo sugerido | Uso |
|---|---|---|
| Proyecto | Link a Proyectos | Obligatorio |
| Autor | Texto/select | Cliente/Intelia |
| Mensaje / Pregunta | Long text | Visible |
| Fecha | Fecha | Orden |
| Estado | Select: sin responder, respondido, requiere decisión | Badge |
| Respuesta | Long text | Visible si existe |
| Fecha de respuesta | Fecha | Auditoría |
| Requiere decisión de cliente | Checkbox | Prioridad |

## Tabla: Archivos

| Campo | Tipo sugerido | Uso |
|---|---|---|
| Proyecto | Link a Proyectos | Obligatorio |
| Nombre / Archivo | Texto | Card |
| Categoría | Select: entregable, documento, diseño, minuta, reporte, dataset, link | Icono/agrupación |
| URL | URL | Abrir archivo |
| Archivo adjunto | Attachment | Alternativa a URL |
| Fecha | Fecha | Recencia |
| Estado | Select: disponible, pendiente, reemplazado | Evitar links rotos |
| Descripción | Long text | Contexto |
| Visible al cliente | Checkbox | Control publicación |

## Plantilla rápida para updates de sesión

```markdown
Cliente:
Proyecto / Código:
Fecha del update:
Estado general:
Fase actual:
Progreso %:

Resumen ejecutivo visible al cliente:

Qué cambió desde el último update:
- 

Qué sigue:
- 

Hitos actualizados:
- Nombre:
  Estado:
  Fecha estimada:
  Descripción cliente:

Tareas actualizadas:
- Tarea:
  Estado:
  Prioridad:
  Visible al cliente: sí/no
  Descripción cliente:
  Necesita acción del cliente: sí/no
  Acción requerida:

Riesgos / bloqueos / decisiones:
- Riesgo:
  Impacto:
  Mitigación:
  Necesita decisión de cliente:

Preguntas y respuestas:
- Pregunta:
  Respuesta:
  Estado:

Archivos / entregables:
- Nombre:
  Categoría:
  URL o pendiente:
  Descripción:

Métricas:
- Label | Valor | Nota

Mensaje para cliente:
```

## Criterio de calidad del update

Un cliente debería poder decir:

- “Entiendo el estado sin llamar a Intelia.”
- “Sé qué sigue y cuándo.”
- “Sé si necesitan algo de mí.”
- “Veo evidencia: tareas, hitos, entregables o métricas.”
- “Si hay riesgo, entiendo el plan de mitigación.”
