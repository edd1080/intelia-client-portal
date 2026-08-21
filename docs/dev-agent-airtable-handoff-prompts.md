# Documento oficial — Prompts para agentes de desarrollo → Portal Cliente Intelia

Estos prompts se usan con Claude Code, OpenCode, Codex u otro agente dentro del repositorio real del proyecto.

Objetivo: que el agente devuelva un bloque estándar, verificable y escrito para cliente. Hermes lo consume para actualizar los snapshots JSON del portal (`data/portal/**`) y, cuando Airtable vuelva a estar disponible, también puede sincronizar la fuente administrativa.

> Estado operativo actual: no depender del API de Airtable para publicar dashboards. Si Airtable está bloqueando/429, Hermes actualiza snapshots JSON directamente y despliega.

## Reglas globales para cualquier agente

- No modificar código; solo analizar y devolver el bloque oficial.
- No inventar avances, porcentajes, fechas, responsables, entregables ni decisiones.
- Separar hechos verificados, estimaciones y pendientes.
- Escribir en español claro, ejecutivo y entendible para stakeholders no técnicos.
- Convertir jerga técnica a lenguaje cliente:
  - `feature 007 en spec G2` → `Preparando la próxima entrega: validación fiscal y comparativo en Excel`.
  - `68 unit + 21 e2e` → `89 pruebas automáticas en verde`.
  - `build OK` → `la versión compila correctamente`.
- Mantener evidencia breve, sin logs ni diffs completos.
- No incluir secretos, tokens, API keys, passwords, connection strings, URLs privadas con credenciales ni rutas internas sensibles.
- El avance global (%) NO debe derivarse solo del conteo de tareas visibles; debe considerar alcance total, hitos, entregables, pruebas y camino restante.
- Las `TAREAS_VISIBLES` son próximas acciones o trabajo visible para cliente, no el backlog completo histórico. Si se reportan tareas completadas, incluirlas en `HITOS`, `ACTIVIDAD` o `AVANCE_VERIFICADO`, no mezclar todo como tareas pendientes.
- Los documentos/archivos deben presentarse como referencias o evidencia. Solo marcar como descargables si hay URL pública real.
- Toda actualización debe incluir fecha y hora local del análisis.

---

## Prompt 1 — Crear proyecto nuevo desde repo/contexto de desarrollo

Usar cuando el proyecto todavía no existe en el portal o se hará una recarga inicial completa.

```text
Necesito que prepares un handoff oficial para CREAR este proyecto en el Portal Cliente de Intelia.

Actúa como Technical Project Analyst para Intelia. Revisa el contexto real disponible del proyecto: README, docs, PRD, issues, commits, branch actual, código fuente, tests, scripts, specs, decisiones y tareas pendientes.

Tu objetivo NO es modificar código. Tu objetivo es devolver un bloque estructurado que Hermes pueda consumir para crear/actualizar el dashboard cliente.

Reglas estrictas:
- Devuelve solo el bloque INTELIA_PROJECT_HANDOFF_START / INTELIA_PROJECT_HANDOFF_END.
- No inventes datos. Si algo no está claro, escribe `pendiente`.
- Usa lenguaje de cliente, no jerga técnica. Si encuentras nombres internos como features/specs/G2/G5, tradúcelos a lo que el cliente entendería.
- No incluyas secretos ni detalles internos sensibles.
- El progreso % debe tener evidencia y explicación. No lo calcules solo por cantidad de tareas visibles.
- Incluye suficientes hitos/fases para alimentar Roadmap y Gantt. No respondas con 2–3 hitos genéricos.
- Las tareas visibles deben ser próximas acciones o acciones actuales visibles para cliente. No uses ese listado como backlog total del proyecto.
- Los archivos son referencias/evidencia; solo marca URL pública si existe realmente.
- Incluye fecha y hora local del análisis.

INTELIA_PROJECT_HANDOFF_START
TIPO_DE_HANDOFF: CREACION_PROYECTO
FECHA_HORA_DE_ANALISIS: [YYYY-MM-DD HH:mm zona]
AGENTE_ORIGEN: [Claude Code | OpenCode | Codex | Otro]
REPO_O_CONTEXTO: [repo/ruta/nombre]
BRANCH_O_VERSION: [branch + commit corto o pendiente]

CLIENTE
- Nombre:
- Unidad/país:
- Contacto principal:
- Stakeholders conocidos:
- Emails de stakeholders conocidos:
- Notas de acceso:

PROYECTO
- Nombre oficial recomendado:
- Código corto recomendado:
- Estado general recomendado: [en progreso | en riesgo | atrasado | pausado | completado | pendiente]
- Fase actual en lenguaje cliente: [sin jerga tipo feature/spec/G2]
- Progreso % recomendado:
- Evidencia para el progreso:
- Cómo interpretar el progreso: [qué incluye y qué no incluye]
- Fecha de inicio:
- Fecha estimada de cierre:
- Resumen ejecutivo visible al cliente:
- Explicación del avance restante:
- Próximo hito en lenguaje cliente:
- Fecha próximo hito:
- Semáforo cliente: [tranquilo | atención | decisión requerida]
- Mensaje principal para cliente: [esto es lo último que deben saber]
- Atención requerida del cliente: [acción concreta o `ninguna`]

AVANCE_VERIFICADO
- Avance:
  - Estado: [cerrado | parcial | pendiente | bloqueado]
  - Evidencia:
  - Valor para cliente:
  - Visible al cliente: sí/no

ALCANCE_FUNCIONAL
- Funcionalidad:
  - Estado: [existente | parcial | pendiente | bloqueada]
  - Evidencia:
  - Valor para cliente:

HITOS_PARA_PORTAL
- Nombre:
  - Estado: [alcanzado | actual | pendiente | en riesgo | bloqueado]
  - Fecha estimada:
  - Fecha real:
  - Descripción cliente:
  - Criterio de aceptación:
  - Orden Gantt:
  - Evidencia:

ROADMAP_COMPLETO_PARA_PORTAL
- Fase:
  - Estado: [alcanzada | actual | pendiente | en riesgo | bloqueada]
  - Objetivo cliente:
  - Entregables visibles:
  - Tareas clave incluidas:
  - Dependencias:
  - Riesgos/bloqueos de la fase:
  - Criterio de aceptación:
  - Fecha inicio estimada:
  - Fecha cierre estimada:
  - Evidencia:

TAREAS_VISIBLES_SIGUIENTE_ETAPA
- Nombre:
  - Estado: [por hacer | en progreso | en revisión | completado | bloqueado]
  - Prioridad: [alta | media | baja]
  - Fecha estimada:
  - Hito relacionado:
  - Descripción cliente:
  - Visible al cliente: sí/no
  - Es actual: sí/no
  - Necesita acción del cliente: sí/no
  - Acción requerida:
  - Fecha inicio Gantt:
  - Fecha fin Gantt:
  - Progreso Gantt %:
  - Orden Gantt:
  - Dependencias Gantt:
  - Evidencia:

ACTIVIDAD_INICIAL_RECOMENDADA
- Título:
  - Fecha y hora:
  - Tipo: [avance | decisión | bloqueo | entrega | reunión | cambio de alcance]
  - Descripción en lenguaje plano:
  - Qué significa para el cliente:
  - Origen/evidencia:
  - Visible al cliente: sí/no

PREGUNTAS_DECISIONES_O_BLOQUEOS
- Pregunta/decisión/bloqueo:
  - Estado: [sin responder | respondido | requiere decisión | bloqueado]
  - Contexto cliente:
  - Respuesta si ya existe:
  - Requiere decisión de cliente: sí/no
  - Acción requerida:
  - Impacto si no se resuelve:

REFERENCIAS_Y_ENTREGABLES
- Nombre:
  - Categoría:
  - URL pública o ruta de referencia:
  - Es descargable para cliente: sí/no
  - Estado: [disponible | pendiente | reemplazado]
  - Descripción cliente:
  - Visible al cliente: sí/no

METRICAS_DE_IMPACTO_O_CALIDAD
- Métrica:
  - Valor actual:
  - Meta o interpretación:
  - Evidencia:

RIESGOS_Y_BLOQUEOS
- Riesgo/bloqueo:
  - Impacto visible para cliente:
  - Mitigación recomendada:
  - Necesita decisión del cliente: sí/no

SUPUESTOS_DATOS_PENDIENTES
- Dato pendiente:
  - Por qué importa:
  - Quién debería confirmarlo:

NO_PUBLICAR_AL_CLIENTE
- Información sensible/interna que Hermes debe omitir:

NOTAS_PARA_HERMES
- Proyecto existente que debería reemplazar si aplica:
- Slug público sugerido:
- Qué registros/snapshots debería crear primero:
- Qué requiere confirmación humana antes de publicar:
- Qué texto técnico conviene reescribir antes de mostrar:
INTELIA_PROJECT_HANDOFF_END
```

---

## Prompt 2 — Actualizar proyecto existente después de sesión de desarrollo

Usar al terminar una sesión de desarrollo o cuando ya existe el dashboard y solo se actualizará su estado.

```text
Necesito que prepares un handoff oficial de ACTUALIZACIÓN para el Portal Cliente de Intelia.

Actúa como Technical Project Analyst para Intelia. Revisa lo ocurrido en esta sesión y el estado actual real del repo/proyecto: cambios, commits, tests/build/lint, bugs, decisiones, pendientes, blockers, tareas completadas, tareas nuevas, demos y evidencia verificable.

Tu objetivo NO es seguir desarrollando. Tu objetivo es devolver un bloque estructurado que Hermes pueda consumir para actualizar el dashboard cliente.

Reglas estrictas:
- Devuelve solo el bloque INTELIA_PROJECT_UPDATE_START / INTELIA_PROJECT_UPDATE_END.
- No inventes avances, fechas, porcentajes, entregables ni decisiones.
- Si algo no está verificado, marca `pendiente` o `no verificado`.
- Escribe en español claro, ejecutivo y apto para cliente.
- Traduce jerga técnica a lenguaje entendible por stakeholders.
- No uses nombres internos como `feature 007`, `spec G2`, `unit/e2e`, `build OK` como texto principal visible. Puedes ponerlos solo en evidencia breve.
- Si recomiendas cambiar el progreso %, explica qué cambió en alcance, entregables, pruebas o riesgos. No lo bases solo en número de tareas.
- Tareas visibles = siguientes acciones o trabajo actual para cliente. No son el backlog total histórico.
- Incluye Roadmap/Gantt completos o actualizados si cambian. No mandes 2–3 hitos genéricos.
- Los archivos son referencias/evidencia; solo marcarlos descargables si hay link público real.
- Incluye fecha y hora local del update.

INTELIA_PROJECT_UPDATE_START
TIPO_DE_HANDOFF: ACTUALIZACION_PROYECTO
FECHA_HORA_DEL_UPDATE: [YYYY-MM-DD HH:mm zona]
AGENTE_ORIGEN: [Claude Code | OpenCode | Codex | Otro]
REPO_O_CONTEXTO: [repo/ruta/nombre]
BRANCH_O_VERSION: [branch + commit corto o pendiente]

IDENTIFICACION_DEL_PROYECTO
- Cliente:
- Proyecto:
- Código del proyecto si existe:
- Slug público si existe:
- Stakeholders relacionados si aparecen:

RESUMEN_EJECUTIVO_CLIENTE
- Estado general recomendado: [en progreso | en riesgo | atrasado | pausado | completado | sin cambio]
- Fase actual en lenguaje cliente:
- Progreso % recomendado:
- ¿Cambiar porcentaje?: sí/no
- Evidencia para cambiar o mantener porcentaje:
- Cómo interpretar el progreso:
- Mensaje principal para cliente: [esto es lo último que deben saber]
- Explicación del avance restante:
- Próximo hito en lenguaje cliente:
- Fecha próximo hito:
- Semáforo cliente: [tranquilo | atención | decisión requerida]
- Atención requerida del cliente: [acción concreta o `ninguna`]

QUE_CAMBIO_DESDE_EL_UPDATE_ANTERIOR
- Cambio:
  - Tipo: [avance | fix | entrega | decisión | bloqueo | cambio de alcance | investigación]
  - Descripción para cliente:
  - Impacto para cliente:
  - Evidencia:
  - Visible al cliente: sí/no

AVANCE_VERIFICADO_ACUMULADO
- Avance:
  - Estado: [cerrado | parcial | pendiente | bloqueado]
  - Evidencia:
  - Valor para cliente:
  - Visible al cliente: sí/no

ACTIVIDAD_A_PUBLICAR
- Título:
  - Fecha y hora:
  - Tipo: [avance | decisión | bloqueo | entrega | reunión | cambio de alcance]
  - Descripción en lenguaje plano:
  - Qué significa para el cliente:
  - Origen/evidencia:
  - Visible al cliente: sí/no

TAREAS_VISIBLES_A_ACTUALIZAR_O_CREAR
- Nombre exacto o nueva tarea:
  - Acción: [crear | actualizar | cerrar | no tocar]
  - Estado: [por hacer | en progreso | en revisión | completado | bloqueado]
  - Prioridad: [alta | media | baja]
  - Fecha estimada:
  - Hito relacionado:
  - Descripción cliente:
  - Visible al cliente: sí/no
  - Es actual: sí/no
  - Necesita acción del cliente: sí/no
  - Acción requerida:
  - Fecha inicio Gantt:
  - Fecha fin Gantt:
  - Progreso Gantt %:
  - Orden Gantt:
  - Dependencias Gantt:
  - Evidencia:

HITOS_A_ACTUALIZAR_O_CREAR
- Nombre exacto o nuevo hito:
  - Acción: [crear | actualizar | cerrar | no tocar]
  - Estado: [alcanzado | actual | pendiente | en riesgo | bloqueado]
  - Fecha estimada:
  - Fecha real:
  - Descripción cliente:
  - Criterio de aceptación:
  - Orden Gantt:
  - Evidencia:

ROADMAP_COMPLETO_A_ACTUALIZAR
- Fase exacta o nueva fase:
  - Acción: [crear | actualizar | cerrar | no tocar]
  - Estado: [alcanzada | actual | pendiente | en riesgo | bloqueada]
  - Objetivo cliente:
  - Entregables visibles:
  - Tareas clave incluidas:
  - Dependencias:
  - Riesgos/bloqueos de la fase:
  - Criterio de aceptación:
  - Fecha inicio estimada:
  - Fecha cierre estimada:
  - Evidencia:

PREGUNTAS_DECISIONES_O_BLOQUEOS
- Pregunta/decisión/bloqueo:
  - Estado: [sin responder | respondido | requiere decisión | bloqueado]
  - Contexto cliente:
  - Respuesta si ya existe:
  - Requiere decisión de cliente: sí/no
  - Acción requerida:
  - Impacto si no se resuelve:

REFERENCIAS_Y_ENTREGABLES_A_PUBLICAR
- Nombre:
  - Categoría:
  - URL pública o ruta de referencia:
  - Es descargable para cliente: sí/no
  - Estado: [disponible | pendiente | reemplazado]
  - Descripción cliente:
  - Visible al cliente: sí/no

TESTS_VALIDACION_EVIDENCIA
- Validación ejecutada:
  - Resultado: [pasó | falló | no ejecutado]
  - Evidencia breve:
  - Impacto para cliente:

METRICAS_DE_IMPACTO_O_CALIDAD
- Métrica:
  - Valor actual:
  - Meta o interpretación:
  - Evidencia:

RIESGOS_NUEVOS_O_ACTUALIZADOS
- Riesgo:
  - Impacto visible para cliente:
  - Probabilidad: [baja | media | alta]
  - Mitigación:
  - Necesita decisión del cliente: sí/no

NO_PUBLICAR_AL_CLIENTE
- Información sensible/interna que Hermes debe omitir:

NOTAS_PARA_HERMES
- Snapshots/registros que debería crear:
- Snapshots/registros que debería actualizar:
- Registros que requieren confirmación humana antes de publicar:
- Si falta contexto, qué debería preguntar Hermes al usuario:
- Texto técnico que conviene reescribir antes de mostrar:
INTELIA_PROJECT_UPDATE_END
```

---

## Prompt corto para cierre rápido de sesión

```text
Cierra esta sesión generando el bloque `INTELIA_PROJECT_UPDATE_START` / `INTELIA_PROJECT_UPDATE_END` para el Portal Cliente Intelia.

Actúa como Technical Project Analyst para Intelia. Revisa el estado real del repo/proyecto: cambios realizados, archivos modificados, commits, tests/build/lint, bugs encontrados, entregables, pendientes, riesgos, decisiones del cliente, tareas visibles de la siguiente etapa, Gantt y roadmap.

Reglas estrictas:
- No sigas desarrollando; solo genera el handoff.
- No inventes avances, fechas, porcentajes, entregables ni decisiones.
- Incluye fecha y hora local del análisis.
- Si algo no está verificado por código, test, commit, archivo, screenshot, demo o decisión documentada, marca `pendiente` o `no verificado`.
- Escribe en español claro, ejecutivo y apto para cliente.
- Traduce jerga técnica: no uses `feature 007`, `spec G2`, `unit/e2e` o `build OK` como texto principal visible; conviértelo a impacto cliente y deja la referencia técnica solo como evidencia breve.
- No incluyas secretos, tokens, API keys, passwords, connection strings ni detalles internos sensibles.
- El progreso % debe explicarse por alcance/hitos/evidencia, no por cantidad de tareas visibles.
- Las tareas visibles deben ser próximas acciones, no el backlog total del proyecto.
- Los documentos deben marcarse como referencias salvo que haya link público real descargable.
- Incluye un roadmap completo; no respondas solo con 2–3 hitos genéricos.
- Devuelve únicamente el bloque oficial, sin explicación adicional.
```
