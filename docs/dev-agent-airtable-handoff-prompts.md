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

Usar al terminar una sesión de desarrollo o cuando ya existe el dashboard y se actualizará su estado.

### Regla clave: el update siempre debe ser autocontenido

El update NO debe ser únicamente una comparación técnica contra el reporte anterior. Hermes necesita recibir el **estado actual completo** del proyecto para reemplazar el snapshot anterior. La comparación histórica se conserva solo como contexto y se convierte a una explicación que un stakeholder pueda entender aunque nunca haya visto el reporte anterior.

Para un proyecto con mucho avance desde el último reporte, usar:

```text
MODO_DE_ACTUALIZACION: REFRESH_COMPLETO
```

No crear un segundo proyecto. No usar el prompt de creación salvo que el proyecto realmente no exista. `REFRESH_COMPLETO` significa: reconstruir todos los datos actuales del proyecto, cerrar o marcar como alcanzado lo que ya terminó, reemplazar tareas/hitos obsoletos y explicar el avance en lenguaje cliente.

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
- El bloque debe poder leerse sin conocer el update anterior. No escribas "como antes", "sigue igual", "se avanzó en lo anterior" ni referencias a IDs internos sin explicar el contexto.
- Primero describe el estado actual completo; después resume los cambios más importantes desde el último reporte.
- Cuando algo anterior ya terminó, no lo dejes como tarea pendiente: márcalo como cerrado/alcanzado y muévelo a avance, hito o actividad.
- El mensaje para cliente debe seguir esta estructura: `qué construimos o validamos` → `qué significa para el cliente` → `qué sigue` → `qué necesitamos del cliente`.
- Si no puedes reconstruir con certeza el estado actual, marca el dato como `no verificado`; no rellenes el dashboard con el diff incompleto.

INTELIA_PROJECT_UPDATE_START
TIPO_DE_HANDOFF: ACTUALIZACION_PROYECTO
MODO_DE_ACTUALIZACION: [REFRESH_COMPLETO | CAMBIO_INCREMENTAL]
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

ESTADO_ACTUAL_CANONICO
- Qué está funcionando hoy:
- Qué está terminado y verificado:
- Qué está parcialmente terminado:
- Qué falta para completar el proyecto:
- Qué ya no aplica del reporte anterior:
- Qué cambió en alcance, fechas, riesgos o prioridades:
- Explicación breve para un stakeholder que nunca vio el reporte anterior:

QUE_CAMBIO_DESDE_EL_UPDATE_ANTERIOR
- Cambio:
  - Tipo: [avance | fix | entrega | decisión | bloqueo | cambio de alcance | investigación]
  - Descripción para cliente:
  - Impacto para cliente:
  - Evidencia:
  - Visible al cliente: sí/no

HISTORIA_VISIBLE_PARA_CLIENTE
- Antes, en una frase entendible:
- Ahora, en una frase entendible:
- Por qué importa el cambio:
- Evidencia del cambio:

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
- Si han pasado varias sesiones o hubo mucho avance, usa `MODO_DE_ACTUALIZACION: REFRESH_COMPLETO`: reconstruye el estado actual completo y explica `antes → ahora → por qué importa`. No dependas de que el stakeholder haya visto reportes anteriores.
- Incluye un roadmap completo; no respondas solo con 2–3 hitos genéricos.
- Devuelve únicamente el bloque oficial, sin explicación adicional.
```

---

## Prompt 3 — Descripción completa de la solución para el módulo General

Usar después de crear un proyecto o cuando se necesita explicar la solución de forma completa para stakeholders. Este prompt no reemplaza el update operativo; genera la narrativa funcional y de producto.

```text
Necesito que prepares un handoff oficial de la SOLUCIÓN para el módulo General del Portal Cliente de Intelia.

Actúa como Product Architect y Technical Project Analyst. Revisa el contexto real del proyecto: README, brief, PRD, requisitos, flujos de usuario, arquitectura, decisiones, contratos de datos, integraciones, código existente, pruebas, documentación y alcance aprobado.

Tu objetivo NO es modificar código ni generar un update de tareas. Tu objetivo es explicar qué solución se está construyendo, por qué existe, cómo funcionará y qué verá cada tipo de usuario. Hermes usará la respuesta para crear una card resumida en Home y una página General completa.

Reglas estrictas:
- Devuelve únicamente el bloque oficial.
- No inventes información, fechas, métricas ni capacidades.
- Distingue entre existente, aprobado, en desarrollo, propuesto y pendiente.
- Si algo no está definido, escribe `pendiente de definición`.
- Escribe primero para stakeholders no técnicos; explica la jerga técnica cuando sea necesaria.
- No presentes una capacidad documentada como si ya estuviera construida.
- No confundas definición, desarrollo, piloto y producción.
- No mezcles el backlog operativo con la explicación de producto.
- No incluyas secretos, tokens, API keys, passwords, connection strings, commits privados ni rutas sensibles.
- La explicación debe poder entenderse aunque el stakeholder nunca haya visto reportes anteriores.

INTELIA_SOLUTION_HANDOFF_START
TIPO_DE_HANDOFF: DESCRIPCION_COMPLETA_SOLUCION
FECHA_HORA_DE_ANALISIS: [YYYY-MM-DD HH:mm zona]
AGENTE_ORIGEN: [Claude Code | OpenCode | Codex | Otro]
REPO_O_CONTEXTO: [repo/ruta/contexto]
BRANCH_O_VERSION: [branch + commit corto o pendiente]

IDENTIFICACION
- Cliente:
- Área/unidad:
- Proyecto:
- Código:
- Slug público:
- Stakeholders principales:
- Usuarios finales:
- Estado actual: [idea | definida | en desarrollo | parcialmente operativa | lista para piloto | productiva]

RESUMEN_PARA_HOME
- Título corto:
- Subtítulo:
- Qué es la solución:
- Problema principal que resuelve:
- Para quién se construye:
- Beneficio principal:
- Estado actual en lenguaje cliente:
- Texto recomendado para la card:
- Texto del botón: Ver solución completa

CONTEXTO_DEL_PROBLEMA
- Cómo se realiza hoy el proceso:
- Fricciones actuales:
- Riesgos actuales:
- Equipos afectados:
- Evidencia:

OBJETIVO_Y_PROPUESTA_DE_VALOR
- Objetivo principal:
- Objetivos secundarios:
- Resultado esperado:
- Beneficio para dirección:
- Beneficio para operación:
- Beneficio para usuarios finales:
- Antes:
- Después:
- Cómo se medirá el éxito:
- Qué queda fuera:

FLUJO_COMPLETO_DE_LA_SOLUCION
- Paso:
  - Nombre:
  - Actor:
  - Qué ocurre:
  - Entrada:
  - Automatización:
  - Decisión humana:
  - Salida:
  - Estado:
  - Valor para el usuario:
  - Evidencia:

ROLES_Y_USUARIOS
- Rol:
  - Quién es:
  - Qué necesita:
  - Qué puede hacer:
  - Qué puede consultar:
  - Qué no puede hacer:
  - Cómo se autentica:
  - Estado:

MODULOS_DE_LA_SOLUCION
- Módulo:
  - Nombre para cliente:
  - Nombre técnico si aplica:
  - Para qué sirve:
  - Usuario principal:
  - Funciones:
  - Entradas:
  - Salidas:
  - Estado:
  - Dependencias:
  - Qué verá el stakeholder:

DATOS_E_INTEGRACIONES
- Fuente o sistema:
  - Para qué se usa:
  - Qué entra:
  - Qué sale:
  - Frecuencia:
  - Responsable:
  - Estado:
  - Riesgos:
  - Decisiones pendientes:

AUTOMATIZACION_E_IA
- Capacidad:
  - Qué hace:
  - Qué no hace:
  - Qué datos utiliza:
  - Quién la revisa:
  - Qué pasa si falla:
  - Cómo se evita que invente información:
  - Estado:

SEGURIDAD_PERMISOS_Y_AUDITORIA
- Mecanismo de acceso:
- Roles y permisos:
- Datos sensibles:
- Separación entre usuarios:
- Auditoría:
- Aprobaciones humanas:
- Retención:
- Medidas implementadas:
- Medidas pendientes:

ALCANCE_Y_EXPERIENCIA
- Incluido en esta fase:
- Parcialmente incluido:
- Fuera de alcance:
- Reservado para fases futuras:
- Cómo inicia el usuario:
- Qué recorrido realiza:
- Qué resultado obtiene:
- Qué ocurre ante errores:

EJEMPLO_DE_USO_REAL
- Situación inicial:
- Usuario:
- Pasos:
- Resultado:
- Beneficio:
- Parte verificada:
- Parte futura:

ESTADO_DE_LA_SOLUCION
- Capacidades existentes:
- Capacidades aprobadas no construidas:
- Capacidades en desarrollo:
- Capacidades pendientes:
- Dependencias externas:
- Riesgos:
- Próximo resultado visible:

DECISIONES_Y_SUPUESTOS
- Tema:
  - Estado: [confirmado | aprobado | supuesto | pendiente | descartado]
  - Decisión actual:
  - Impacto:
  - Responsable:
  - Evidencia:

GLOSARIO_CLIENTE
- Término técnico:
  - Explicación sencilla:
  - Por qué aparece:

REFERENCIAS
- Nombre:
  - Tipo:
  - Ruta o URL:
  - Qué demuestra:
  - Visible al cliente: sí/no

NO_PUBLICAR
- Información interna o sensible que Hermes debe omitir:

NOTAS_PARA_HERMES
- Qué debe aparecer en la card Home:
- Qué debe aparecer en General:
- Qué requiere revisión humana:
- Qué información falta:
INTELIA_SOLUTION_HANDOFF_END
```
