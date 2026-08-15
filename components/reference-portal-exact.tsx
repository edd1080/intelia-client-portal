"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { ClientPortalData } from "@/lib/airtable";

type ReferencePortalExactProps = {
  data?: ClientPortalData;
  token?: string;
  authRequired?: boolean;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusLabel(status?: string) {
  const normalized = String(status || "en curso").toLowerCase();
  if (normalized.includes("riesgo")) return "En riesgo";
  if (normalized.includes("atras")) return "Atrasado";
  if (normalized.includes("paus")) return "Pausado";
  if (normalized.includes("complet")) return "Completado";
  return "En curso";
}

function buildMarkup(data?: ClientPortalData, authRequired = true) {
  if (!data) return authRequired ? markup : markup.replace(/<div id="auth-screen"[\s\S]*$/, "");
  const progress = Math.max(0, Math.min(100, Math.round(data.project.progress || 60)));
  const phase = data.project.currentPhase || data.project.nextMilestone || "Fase de Desarrollo Core";
  const lastUpdated = data.lastUpdated.date ? data.lastUpdated.date : "Hoy";
  const updatedBy = data.lastUpdated.by || "Intelia";
  const next = data.project.nextMilestone || "Siguiente hito por confirmar";
  const signal = data.project.clientSignal || (data.project.status?.toLowerCase().includes("riesgo") ? "atención" : "tranquilo");
  const clientMessage = data.project.clientMessage || "El proyecto tiene un siguiente paso identificado y el equipo Intelia mantiene la visibilidad operativa del avance.";
  const remaining = data.project.remainingExplanation || `El ${100 - progress}% restante corresponde a los próximos hitos y validaciones antes del cierre.`;
  const clientAction = data.tasks.find((task) => task.needsClientAction)?.requiredAction
    || data.questions.find((question) => question.requiresClientDecision)?.message
    || "No hay decisiones pendientes del cliente en este momento.";
  return markup
    .replaceAll("Asistente Copilot CX", escapeHtml(data.project.name || "Proyecto Intelia"))
    .replaceAll("En curso • Fase de pruebas", `${escapeHtml(statusLabel(data.project.status))} • ${escapeHtml(phase)}`)
    .replaceAll("Actualizado: Hoy, 10:45 AM", `Actualizado: ${escapeHtml(lastUpdated)} • ${escapeHtml(updatedBy)}`)
    .replaceAll("Fase de Desarrollo Core", escapeHtml(phase))
    .replaceAll("STATUS OFICIAL", signal === "tranquilo" ? "STATUS OFICIAL" : "REQUIERE ATENCIÓN")
    .replaceAll(">60\n                    </span>", `>${progress}\n                    </span>`)
    .replaceAll("w-[60%]", `w-[${progress}%]`)
    .replaceAll("Hemos completado exitosamente la fase de\n                  <strong class=\"text-slate-900\">\n                    Setup de Infraestructura\n                  </strong>\n                  y la ingesta de datos. Actualmente estamos avanzando de forma\n                  fluida en el\n                  <strong class=\"text-slate-900\">Entrenamiento del LLM</strong>\n                  .", escapeHtml(data.project.executiveSummary))
    .replaceAll("El 40% restante corresponde a las pruebas de integración en\n                    entorno Staging (30%) y el despliegue a Producción (10%),\n                    programados para completarse en las próximas 3 semanas.", escapeHtml(remaining))
    .replaceAll("Siguiente hito definido", escapeHtml(next))
    .replaceAll("Mensaje ejecutivo para el cliente", escapeHtml(clientMessage))
    .replaceAll("Si hay decisiones pendientes, aparecerán aquí con la acción esperada del cliente.", escapeHtml(clientAction))
    .replace(/<div id="auth-screen"[\s\S]*$/, authRequired ? markup.match(/<div id="auth-screen"[\s\S]*$/)?.[0] || "" : "");
}

export function ReferencePortalExact({ data, token = "demo", authRequired = true }: ReferencePortalExactProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.portalToken = token;

    const canvas = root.querySelector<HTMLCanvasElement>("#webgl-canvas");
    let renderer: THREE.WebGLRenderer | undefined;
    let material: THREE.ShaderMaterial | undefined;
    let geometry: THREE.PlaneGeometry | undefined;
    let frame = 0;

    if (canvas) {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `;
      const fragmentShader = `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution.xy;
          vec2 noiseUv1 = uv * 1.2 + vec2(uTime * 0.015, uTime * 0.02);
          vec2 noiseUv2 = uv * 1.8 - vec2(uTime * 0.01, uTime * 0.015);
          float n1 = snoise(noiseUv1);
          float n2 = snoise(noiseUv2);
          vec3 bg = vec3(0.96, 0.98, 1.0);
          vec3 colorA = vec3(1.0, 1.0, 1.0);
          vec3 colorB = vec3(0.92, 0.97, 0.98);
          vec3 finalColor = mix(bg, colorA, n1 * 0.5 + 0.5);
          finalColor = mix(finalColor, colorB, n2 * 0.2 + 0.2);
          float dist = distance(uv, vec2(0.5));
          finalColor -= dist * 0.08;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;
      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
      });
      geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));
      let time = 0;
      const render = () => {
        time += 0.01;
        if (material) material.uniforms.uTime.value = time;
        renderer?.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();
    }

    const resize = () => {
      renderer?.setSize(window.innerWidth, window.innerHeight);
      material?.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resize);

    const showScreen = (screenId: string) => {
      root.querySelectorAll(".screen-section").forEach((el) => {
        el.classList.add("hidden");
        el.classList.remove("block");
      });
      const target = root.querySelector(`#screen-${screenId}`);
      if (target) {
        target.classList.remove("hidden");
        target.classList.add("block");
      }
      root.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("bg-white/80", "text-slate-800", "shadow-sm", "border-white/60", "font-semibold");
        link.classList.add("text-slate-600", "hover:bg-white/50", "font-medium");
        const icon = link.querySelector("iconify-icon");
        if (icon) {
          icon.classList.remove("text-emerald-500");
          const current = icon.getAttribute("icon") || "";
          icon.setAttribute("icon", current.replace("-bold-duotone", "-linear"));
        }
        const onClick = link.getAttribute("data-screen") || "";
        if (onClick === screenId) {
          link.classList.remove("text-slate-600", "hover:bg-white/50", "font-medium");
          link.classList.add("bg-white/80", "text-slate-800", "shadow-sm", "border-white/60", "font-semibold");
          if (icon) {
            icon.classList.add("text-emerald-500");
            const current = icon.getAttribute("icon") || "";
            icon.setAttribute("icon", current.replace("-linear", "-bold-duotone"));
          }
        }
      });
    };

    root.querySelectorAll<HTMLElement>(".nav-link").forEach((link) => {
      const onclick = link.getAttribute("onclick") || "";
      const match = onclick.match(/showScreen\('([^']+)'\)/);
      if (match) link.setAttribute("data-screen", match[1]);
      link.onclick = (event) => {
        event.preventDefault();
        showScreen(link.getAttribute("data-screen") || "resumen");
      };
    });
    const showToast = (message: string) => {
      root.querySelector("[data-action-toast]")?.remove();
      const toast = document.createElement("div");
      toast.setAttribute("data-action-toast", "true");
      toast.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-slate-800 text-white text-sm px-5 py-3 rounded-2xl shadow-xl border border-slate-700 transition-opacity duration-300";
      toast.textContent = message;
      root.appendChild(toast);
      window.setTimeout(() => {
        toast.style.opacity = "0";
        window.setTimeout(() => toast.remove(), 320);
      }, 2800);
    };

    const closeMobileMenu = () => {
      const aside = root.querySelector<HTMLElement>("aside");
      aside?.classList.add("hidden");
      aside?.classList.remove("flex", "fixed", "inset-y-6", "left-6");
      const icon = root.querySelector<HTMLElement>("[data-mobile-menu] iconify-icon");
      icon?.setAttribute("icon", "solar:hamburger-menu-linear");
    };

    const mobileMenu = root.querySelector<HTMLElement>("[data-mobile-menu]");
    if (mobileMenu) {
      // Keep the thumb-reachable mobile trigger outside the blurred header;
      // backdrop-filter creates a containing block for fixed children on mobile.
      if (mobileMenu.parentElement !== root) root.appendChild(mobileMenu);
      mobileMenu.onclick = () => {
        const aside = root.querySelector<HTMLElement>("aside");
        if (!aside) return;
        if (!aside.classList.contains("hidden")) {
          closeMobileMenu();
          return;
        }
        aside.classList.remove("hidden");
        aside.classList.add("flex", "fixed", "inset-y-6", "left-6");
        const icon = root.querySelector<HTMLElement>("[data-mobile-menu] iconify-icon");
        icon?.setAttribute("icon", "solar:close-circle-linear");
      };
    }

    root.querySelectorAll<HTMLElement>(".nav-link").forEach((link) => {
      link.addEventListener("click", () => closeMobileMenu(), { once: false });
    });

    root.querySelector<HTMLElement>("[data-support]")?.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "mailto:edgar@intelia.pro?subject=Soporte%20Portal%20de%20Cliente%20Intelia";
    });

    const listButton = root.querySelector<HTMLElement>("[data-view-list]");
    const kanbanButton = root.querySelector<HTMLElement>("[data-view-kanban]");
    const taskBoard = root.querySelector<HTMLElement>("[data-task-board]");
    const setTaskView = (view: "list" | "kanban") => {
      if (!taskBoard || !listButton || !kanbanButton) return;
      if (view === "list") {
        taskBoard.classList.remove("md:grid-cols-3");
        taskBoard.classList.add("md:grid-cols-1");
        taskBoard.querySelectorAll<HTMLElement>(":scope > div").forEach((lane) => lane.classList.add("md:flex-row"));
        listButton.className = "px-4 py-2 bg-emerald-500 rounded-xl text-sm font-medium text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-600 transition-all";
        kanbanButton.className = "px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-sm font-medium text-slate-700 shadow-sm border border-white/60 hover:bg-white/80 transition-all";
      } else {
        taskBoard.classList.add("md:grid-cols-3");
        taskBoard.classList.remove("md:grid-cols-1");
        taskBoard.querySelectorAll<HTMLElement>(":scope > div").forEach((lane) => lane.classList.remove("md:flex-row"));
        listButton.className = "px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-sm font-medium text-slate-700 shadow-sm border border-white/60 hover:bg-white/80 transition-all";
        kanbanButton.className = "px-4 py-2 bg-emerald-500 rounded-xl text-sm font-medium text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-600 transition-all";
      }
    };
    listButton?.addEventListener("click", () => setTaskView("list"));
    kanbanButton?.addEventListener("click", () => setTaskView("kanban"));

    root.querySelector<HTMLElement>("[data-upload-readonly]")?.addEventListener("click", () => {
      showToast("Portal de lectura: los archivos los publica Intelia desde Airtable.");
    });
    root.querySelectorAll<HTMLElement>("[data-file-card]").forEach((card) => {
      card.addEventListener("click", () => showToast("Archivo disponible desde el repositorio de entregables del proyecto."));
    });
    root.querySelectorAll<HTMLElement>("[data-resource-card]").forEach((card) => {
      card.addEventListener("click", () => showScreen("archivos"));
    });

    const topHeader = root.querySelector("#top-header");
    if (topHeader) gsap.to(topHeader, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 });
    gsap.to(root.querySelector("#main-path"), { strokeDashoffset: 0, duration: 2.5, ease: "power2.inOut", delay: 1.8 });
    gsap.to(root.querySelector(".main-dot"), { scale: 1.4, transformOrigin: "center", duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" });

    const emailButton = root.querySelector<HTMLElement>("[data-auth-email]");
    const codeButton = root.querySelector<HTMLElement>("[data-auth-code]");
    const resetButton = root.querySelector<HTMLElement>("[data-auth-reset]");
    emailButton?.addEventListener("click", async () => {
      const emailInput = root.querySelector<HTMLInputElement>("#auth-email");
      const email = emailInput?.value.trim() || "";
      if (!email || !email.includes("@")) {
        emailInput?.classList.add("border-red-400", "focus:border-red-500", "focus:ring-red-500/20");
        return;
      }
      emailButton.setAttribute("disabled", "true");
      emailButton.textContent = "Enviando...";
      try {
        if (token !== "demo") {
          const response = await fetch("/api/portal-auth/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, email }),
          });
          if (!response.ok) throw new Error("request failed");
        }
      } catch {
        emailInput?.classList.add("border-red-400", "focus:border-red-500", "focus:ring-red-500/20");
        emailButton.removeAttribute("disabled");
        emailButton.textContent = "Continuar";
        return;
      }
      root.querySelector("#auth-step-1")?.classList.add("hidden");
      root.querySelector("#auth-step-1")?.classList.remove("flex");
      root.querySelector("#auth-step-2")?.classList.remove("hidden");
      root.querySelector("#auth-step-2")?.classList.add("flex");
      const display = root.querySelector("#auth-email-display");
      if (display) display.textContent = email;
    });
    codeButton?.addEventListener("click", async () => {
      const codeInput = root.querySelector<HTMLInputElement>("#auth-code");
      const code = codeInput?.value.trim() || "";
      let valid = token === "demo" ? code === "123456" : false;
      if (token !== "demo") {
        codeButton.setAttribute("disabled", "true");
        codeButton.textContent = "Verificando...";
        try {
          const response = await fetch("/api/portal-auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, code }),
          });
          valid = response.ok;
        } catch {
          valid = false;
        }
        codeButton.removeAttribute("disabled");
        codeButton.textContent = "Verificar y Entrar";
      }
      if (valid) {
        const authScreen = root.querySelector<HTMLElement>("#auth-screen");
        if (authScreen) {
          authScreen.style.opacity = "0";
          setTimeout(() => authScreen.remove(), 500);
        }
      } else {
        codeInput?.classList.add("border-red-400", "focus:border-red-500", "focus:ring-red-500/20");
        root.querySelector("#auth-error")?.classList.remove("hidden");
      }
    });
    resetButton?.addEventListener("click", () => {
      root.querySelector("#auth-step-2")?.classList.add("hidden");
      root.querySelector("#auth-step-2")?.classList.remove("flex");
      root.querySelector("#auth-step-1")?.classList.remove("hidden");
      root.querySelector("#auth-step-1")?.classList.add("flex");
    });

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  }, []);

  return <div ref={rootRef} className="reference-exact-root" dangerouslySetInnerHTML={{ __html: buildMarkup(data, authRequired) }} />;
}

const markup = String.raw`
    <!-- Fondo WebGL -->
    <canvas id="webgl-canvas" class="absolute inset-0 z-0 pointer-events-none w-full h-full"></canvas>
    <div class="absolute inset-0 z-0 pointer-events-none noise-overlay"></div>

    <!-- Cabecera Fija del Cliente (Fuera del espacio 3D) -->
    <aside class="w-24 h-[calc(100vh-3rem)] my-6 ml-6 relative z-50 backdrop-blur-3xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-[2rem] flex-col hidden md:flex bg-white/70 items-center py-6 shrink-0">
      <div class="px-2 flex flex-col items-center gap-2 mb-8">
        <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-bold tracking-tight shadow-md shadow-emerald-500/30 border border-white/20">
          NV
        </div>
        <span class="hidden">Intelia</span>
      </div>
      <nav class="flex-1 flex flex-col items-center space-y-4 w-full px-2">
        <a href="#" onclick="showScreen('resumen')" class="nav-link flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all group hover:scale-105 bg-white/80 text-slate-800 shadow-sm border border-white/60 font-semibold">
          <iconify-icon icon="solar:widget-5-bold-duotone" class="text-[22px] text-emerald-500 group-hover:scale-110 transition-transform"></iconify-icon>
          <span class="text-[9px] uppercase tracking-wider">Resumen</span>
        </a>
        <a href="#" onclick="showScreen('tareas')" class="nav-link flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all group hover:scale-105 text-slate-600 hover:bg-white/50 font-medium border border-transparent">
          <iconify-icon icon="solar:checklist-minimalistic-linear" class="text-[22px] group-hover:scale-110 transition-transform"></iconify-icon>
          <span class="text-[9px] uppercase tracking-wider">Tareas</span>
        </a>
        <a href="#" onclick="showScreen('roadmap')" class="nav-link flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all group hover:scale-105 text-slate-600 hover:bg-white/50 font-medium border border-transparent">
          <iconify-icon icon="solar:route-linear" class="text-[22px] group-hover:scale-110 transition-transform"></iconify-icon>
          <span class="text-[9px] uppercase tracking-wider">Roadmap</span>
        </a>
        <a href="#" onclick="showScreen('gantt')" class="nav-link flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all group hover:scale-105 text-slate-600 hover:bg-white/50 font-medium border border-transparent">
          <iconify-icon icon="solar:chart-square-linear" class="text-[22px] group-hover:scale-110 transition-transform"></iconify-icon>
          <span class="text-[9px] uppercase tracking-wider">Gantt</span>
        </a>
        <a href="#" onclick="showScreen('archivos')" class="nav-link flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all group hover:scale-105 text-slate-600 hover:bg-white/50 font-medium border border-transparent">
          <iconify-icon icon="solar:folder-with-files-linear" class="text-[22px] group-hover:scale-110 transition-transform"></iconify-icon>
          <span class="text-[9px] uppercase tracking-wider">Archivos</span>
        </a>
      </nav>
      <div class="mt-auto flex flex-col items-center w-full px-2">
        <a href="#" data-support="true" class="w-14 h-14 bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform group relative border border-slate-700">
          <iconify-icon icon="solar:help-circle-bold-duotone" class="text-2xl text-emerald-400"></iconify-icon>
          <div class="absolute left-16 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-slate-700 z-50">
            Soporte Técnico
          </div>
        </a>
      </div>
    </aside>
    <div class="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
      <header id="top-header" class="w-auto mx-6 mt-6 mb-2 p-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl border border-white/60 rounded-[2rem] bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] opacity-0 z-20 relative">
        <div class="flex items-center gap-4">
          <button data-mobile-menu="true" class="md:hidden p-2.5 bg-white/60 rounded-xl border border-white/60 shadow-sm text-slate-700 flex items-center justify-center hover:bg-white/80 transition-colors">
            <iconify-icon icon="solar:hamburger-menu-linear" class="text-xl"></iconify-icon>
          </button>
          <div class="">
            <h1 class="text-2xl font-semibold tracking-tight text-slate-800 drop-shadow-sm">
              Asistente Copilot CX
            </h1>
            <div class="flex items-center gap-2 mt-1">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="text-xs font-medium text-slate-600 bg-white/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/50">
                En curso • Fase de pruebas
              </span>
              <span class="text-xs font-medium text-slate-500 ml-2">
                Actualizado: Hoy, 10:45 AM
              </span>
            </div>
          </div>
        </div>
        <div class="bg-white/60 backdrop-blur-md border border-white/60 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
          <iconify-icon icon="solar:shield-check-linear" class="text-slate-500 text-lg" stroke-width="1.5"></iconify-icon>
          <span class="text-xs font-medium text-slate-600">
            Portal de lectura
          </span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 screen-section" id="screen-resumen">
          <!-- RESUMEN -->
          <div class="md:col-span-2 lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80 p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <div class="flex-1 pr-0 md:pr-4 flex flex-col justify-center">
              <div class="flex items-center gap-2 mb-4">
                <div class="bg-emerald-100/80 px-3 py-1.5 rounded-full shadow-sm border border-emerald-200 inline-flex items-center gap-2">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="text-[10px] font-mono font-bold text-emerald-800 tracking-wider">
                    STATUS OFICIAL
                  </span>
                </div>
              </div>
              <h2 class="text-3xl md:text-4xl font-semibold tracking-tight text-slate-800 mb-2 leading-tight">
                Fase de Desarrollo Core
              </h2>
              <div class="mt-6 mb-6">
                <div class="flex justify-between items-end mb-3">
                  <h3 class="text-sm font-semibold text-slate-600 tracking-tight">
                    Progreso Global del Proyecto
                  </h3>
                  <div class="flex items-baseline gap-1">
                    <span class="text-4xl font-semibold tracking-tighter text-emerald-500">
                      60
                    </span>
                    <span class="text-lg font-medium text-emerald-500/70">
                      %
                    </span>
                  </div>
                </div>
                <div class="relative h-4 w-full bg-slate-200/50 rounded-full overflow-hidden shadow-inner border border-slate-300/30">
                  <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 w-[60%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] relative overflow-hidden">
                    <div class="absolute inset-0 w-full h-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div class="bg-white/50 rounded-2xl p-5 border border-white/60 shadow-sm">
                <p class="text-sm text-slate-700 leading-relaxed font-medium">
                  Hemos completado exitosamente la fase de
                  <strong class="text-slate-900">
                    Setup de Infraestructura
                  </strong>
                  y la ingesta de datos. Actualmente estamos avanzando de forma
                  fluida en el
                  <strong class="text-slate-900">Entrenamiento del LLM</strong>
                  .
                </p>
                <div class="mt-3 pt-3 border-t border-slate-200/60 flex items-start gap-2">
                  <iconify-icon icon="solar:info-circle-bold-duotone" class="text-emerald-500 text-lg shrink-0 mt-0.5"></iconify-icon>
                  <p class="text-xs text-slate-500 leading-snug">
                    El 40% restante corresponde a las pruebas de integración en
                    entorno Staging (30%) y el despliegue a Producción (10%),
                    programados para completarse en las próximas 3 semanas.
                  </p>
                </div>
              </div>
            </div>
            <div class="md:w-80 bg-gradient-to-b from-white/80 to-white/30 rounded-[1.5rem] border border-white/60 p-6 relative overflow-hidden flex flex-col justify-center shadow-inner">
              <div class="flex justify-between items-center text-slate-700 mb-4">
                <span class="font-medium text-xs">Precisión (Test)</span>
                <span class="font-mono text-xl font-semibold text-emerald-500">
                  87.4%
                </span>
              </div>
              <div class="relative h-20 w-full mt-2">
                <svg class="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0,35 Q20,35 40,25 T70,15 T100,5" fill="none" stroke="rgba(16,185,129,0.2)" stroke-width="2"></path>
                  <path id="main-path" d="M0,35 Q20,35 40,25 T70,15 T100,5" fill="none" stroke="#10b981" stroke-width="2" class="stroke-draw drop-shadow-sm" style="stroke-dashoffset: 0px;"></path>
                  <circle cx="100" cy="5" r="3" fill="white" stroke="#10b981" stroke-width="1.5" class="main-dot" style=" transform-origin: 0px 0px;" data-svg-origin="100 5" transform="matrix(1.4,0,0,1.4,-40,-2)"></circle>
                </svg>
              </div>
            </div>
          </div>

          <!-- TAREAS -->
          <div class="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2rem] p-6 text-white/90 shadow-lg shadow-emerald-500/10 border border-white/30 flex flex-col hover:shadow-xl transition-shadow">
            <div class="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:checklist-minimalistic-linear" class="text-xl text-white/80" stroke-width="1.5"></iconify-icon>
              <h3 class="text-xl font-semibold tracking-tight text-white">
                Tareas
              </h3>
            </div>
            <p class="text-xs leading-relaxed text-white/80 font-medium mb-6">
              Distribución del trabajo actualizado desde el tablero interno.
            </p>
            <div class="space-y-3 mt-auto">
              <div class="bg-white/10 rounded-xl p-3 border border-white/20">
                <div class="flex justify-between items-center text-xs mb-1.5">
                  <span class="font-medium text-white/90">Completadas</span>
                  <span class="font-mono text-white">24</span>
                </div>
                <div class="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                  <div class="h-full bg-white/90 rounded-full w-[80%]"></div>
                </div>
              </div>
              <div class="bg-white/10 rounded-xl p-3 border border-white/20">
                <div class="flex justify-between items-center text-xs mb-1.5">
                  <span class="font-medium text-white/90">En Revisión</span>
                  <span class="font-mono text-white">3</span>
                </div>
                <div class="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                  <div class="h-full bg-white/60 rounded-full w-[30%]"></div>
                </div>
              </div>
              <div class="bg-white/10 rounded-xl p-3 border border-white/20">
                <div class="flex justify-between items-center text-xs mb-1.5">
                  <span class="font-medium text-white/90">Siguientes</span>
                  <span class="font-mono text-white">12</span>
                </div>
                <div class="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                  <div class="h-full bg-white/30 rounded-full w-[10%]"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- HITOS -->
          <div class="bg-gradient-to-br from-teal-500 to-teal-700 rounded-[2rem] p-6 text-white shadow-lg shadow-teal-900/10 border border-white/20 flex flex-col hover:shadow-xl transition-shadow">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold tracking-tight text-white">
                Hitos
              </h3>
              <div class="bg-white/20 p-1.5 rounded-lg">
                <iconify-icon icon="solar:route-linear" class="text-lg" stroke-width="1.5"></iconify-icon>
              </div>
            </div>
            <div class="relative flex-1 pl-4 border-l border-white/20 space-y-6 mt-2">
              <div class="relative">
                <div class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-white ring-4 ring-teal-500"></div>
                <p class="text-xs font-mono text-white/60 mb-0.5">12 Sep</p>
                <p class="text-sm font-medium text-white/90">
                  Ingesta de datos base
                </p>
              </div>
              <div class="relative">
                <div class="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                <div class="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full bg-white animate-ping opacity-60"></div>
                <p class="text-xs font-mono text-white mb-0.5">Actual</p>
                <p class="text-sm font-medium text-white">
                  Entrenamiento del LLM
                </p>
                <p class="text-xs text-white/70 mt-1 leading-snug">
                  Ajuste fino con histórico de tickets.
                </p>
              </div>
              <div class="relative opacity-60">
                <div class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-transparent border border-white"></div>
                <p class="text-xs font-mono text-white/60 mb-0.5">28 Oct</p>
                <p class="text-sm font-medium text-white/90">
                  Despliegue en Staging
                </p>
              </div>
            </div>
          </div>

          <!-- RECURSOS -->
          <div class="md:col-span-2 lg:col-span-1 bg-gradient-to-br from-[#d4e4ec] to-[#b8cfd8] rounded-[2rem] p-6 text-slate-700 shadow-lg border border-white/50 flex flex-col hover:shadow-xl transition-shadow">
            <h3 class="text-xl font-semibold tracking-tight mb-4 text-slate-800">
              Recursos
            </h3>
            <div class="space-y-2 mb-6">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Entregables
              </p>
              <div class="flex items-center gap-3 bg-white/40 p-2.5 rounded-xl border border-white/50 hover:bg-white/70 transition-colors cursor-pointer shadow-sm resource-card" data-resource-card="true">
                <div class="bg-blue-500/10 p-1.5 rounded-lg text-blue-600">
                  <iconify-icon icon="solar:document-text-linear" stroke-width="1.5"></iconify-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium text-slate-800">
                    Arq_Sistema_v1.pdf
                  </p>
                  <p class="text-[10px] text-slate-500">2.4 MB</p>
                </div>
              </div>
              <div class="flex items-center gap-3 bg-white/40 p-2.5 rounded-xl border border-white/50 hover:bg-white/70 transition-colors cursor-pointer shadow-sm resource-card" data-resource-card="true">
                <div class="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600">
                  <iconify-icon icon="solar:file-check-linear" stroke-width="1.5"></iconify-icon>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium text-slate-800">
                    Métricas_Baseline.csv
                  </p>
                  <p class="text-[10px] text-slate-500">842 KB</p>
                </div>
              </div>
            </div>
            <div class="mt-auto">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Preguntas Recientes
              </p>
              <div class="bg-white/50 rounded-xl p-3 border border-white/60 shadow-sm">
                <p class="text-xs font-medium text-slate-800 mb-1">
                  ¿Cuándo necesitamos acceso a AWS?
                </p>
                <p class="text-[10px] text-slate-600 leading-snug">
                  Para el hito de Staging a finales de Octubre.
                </p>
              </div>
            </div>
          </div>

          <!-- ACTIVIDAD -->
          <div class="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#53617a] to-[#3a445c] rounded-[2rem] p-6 md:p-8 text-white shadow-lg shadow-slate-800/10 border border-white/10 flex flex-col">
            <div class="flex items-center gap-2 mb-6">
              <iconify-icon icon="solar:history-linear" class="text-xl text-white/70" stroke-width="1.5"></iconify-icon>
              <h3 class="text-xl font-semibold tracking-tight text-white">
                Actividad Reciente
              </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              <div class="bg-black/20 rounded-2xl border border-white/10 p-5 flex flex-col justify-center hover:bg-black/30 transition-colors cursor-default shadow-sm backdrop-blur-sm">
                <p class="text-xs font-mono text-white/70 mb-2">
                  Hoy, 09:30 AM
                </p>
                <p class="text-sm font-medium text-white/90 leading-relaxed">
                  Se completó la evaluación de sesgos en el conjunto de
                  validación con resultados positivos.
                </p>
              </div>
              <div class="bg-black/20 rounded-2xl border border-white/10 p-5 flex flex-col justify-center hover:bg-black/30 transition-colors cursor-default shadow-sm backdrop-blur-sm">
                <p class="text-xs font-mono text-white/70 mb-2">Ayer</p>
                <p class="text-sm font-medium text-white/90 leading-relaxed">
                  Conexión establecida con la API de Zendesk en entorno de
                  desarrollo.
                </p>
              </div>
              <div class="bg-black/20 rounded-2xl border border-white/10 p-5 flex flex-col justify-center hover:bg-black/30 transition-colors cursor-default shadow-sm backdrop-blur-sm">
                <p class="text-xs font-mono text-white/70 mb-2">Hace 3 días</p>
                <p class="text-sm font-medium text-white/90 leading-relaxed">
                  Aprobación de la arquitectura de infraestructura cloud.
                </p>
              </div>
            </div>
          </div>
          <div class="md:col-span-2 lg:col-span-1 bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80 flex flex-col hover:shadow-xl transition-shadow">
            <div class="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:pie-chart-2-linear" class="text-xl text-emerald-500" stroke-width="1.5"></iconify-icon>
              <h3 class="text-xl font-semibold tracking-tight text-slate-800">
                Estado de Tareas
              </h3>
            </div>
            <div class="flex-1 flex flex-col justify-center">
              <div class="relative w-32 h-32 mx-auto mb-6">
                <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90 drop-shadow-sm">
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(0,0,0,0.05)" stroke-width="4"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" stroke-width="4" stroke-dasharray="59 41" stroke-dashoffset="0"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" stroke-width="4" stroke-dasharray="5 95" stroke-dashoffset="-59"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" stroke-width="4" stroke-dasharray="7 93" stroke-dashoffset="-64"></circle>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#94a3b8" stroke-width="4" stroke-dasharray="29 71" stroke-dashoffset="-71"></circle>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center flex-col">
                  <span class="text-2xl font-bold text-slate-800 tracking-tighter">
                    41
                  </span>
                  <span class="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                    Total
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs px-2">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                  <span class="font-medium text-slate-600">Completadas</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
                  <span class="font-medium text-slate-600">Trabajando</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
                  <span class="font-medium text-slate-600">En Review</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm"></span>
                  <span class="font-medium text-slate-600">Por trabajar</span>
                </div>
              </div>
            </div>
          </div>
          <div class="md:col-span-1 lg:col-span-1 bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80 flex flex-col hover:shadow-xl transition-shadow">
            <div class="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:map-arrow-right-linear" class="text-xl text-emerald-500" stroke-width="1.5"></iconify-icon>
              <h3 class="text-xl font-semibold tracking-tight text-slate-800">
                Qué sigue
              </h3>
            </div>
            <p class="text-xs font-mono font-semibold text-emerald-700 uppercase tracking-wider mb-3">
              Siguiente hito definido
            </p>
            <p class="text-sm text-slate-600 leading-relaxed font-medium">
              Mensaje ejecutivo para el cliente
            </p>
          </div>
          <div class="md:col-span-1 lg:col-span-1 bg-gradient-to-br from-[#eef7f5] to-white rounded-[2rem] p-6 text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80 flex flex-col hover:shadow-xl transition-shadow">
            <div class="flex items-center gap-2 mb-4">
              <iconify-icon icon="solar:shield-warning-linear" class="text-xl text-emerald-500" stroke-width="1.5"></iconify-icon>
              <h3 class="text-xl font-semibold tracking-tight text-slate-800">
                Atención requerida
              </h3>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed font-medium">
              Si hay decisiones pendientes, aparecerán aquí con la acción esperada del cliente.
            </p>
          </div>
        </div>
        <div id="screen-tareas" class="screen-section hidden max-w-7xl mx-auto space-y-6 pb-12">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold tracking-tight text-slate-800">
              Tareas
            </h2>
            <div class="flex gap-2">
              <button data-view-list="true" class="px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-sm font-medium text-slate-700 shadow-sm border border-white/60 hover:bg-white/80 transition-all">
                Vista Lista
              </button>
              <button data-view-kanban="true" class="px-4 py-2 bg-emerald-500 rounded-xl text-sm font-medium text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                Vista Kanban
              </button>
            </div>
          </div>
          <div data-task-board="true" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-700">Por Hacer</h3>
                <span class="bg-white/60 px-2 py-0.5 rounded-md text-xs font-medium text-slate-500">
                  3
                </span>
              </div>
              <div class="bg-white/80 rounded-xl p-4 shadow-sm border border-white/60">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-red-100 text-red-600 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                    Alta
                  </span>
                </div>
                <p class="text-sm font-medium text-slate-800 mb-2">
                  Configurar entorno de desarrollo
                </p>
                <p class="text-xs text-slate-500">
                  Preparar repositorios y accesos AWS.
                </p>
              </div>
              <div class="bg-white/80 rounded-xl p-4 shadow-sm border border-white/60">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                    Media
                  </span>
                </div>
                <p class="text-sm font-medium text-slate-800 mb-2">
                  Definir esquema de BBDD
                </p>
                <p class="text-xs text-slate-500">
                  Crear diagramas ER para el modelo.
                </p>
              </div>
            </div>
            <div class="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-700">En Curso</h3>
                <span class="bg-white/60 px-2 py-0.5 rounded-md text-xs font-medium text-slate-500">
                  2
                </span>
              </div>
              <div class="bg-white/80 rounded-xl p-4 shadow-sm border border-white/60">
                <div class="flex items-center gap-2 mb-2">
                  <span class="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                    Alta
                  </span>
                </div>
                <p class="text-sm font-medium text-slate-800 mb-2">
                  Entrenamiento del LLM
                </p>
                <p class="text-xs text-slate-500">
                  Ajuste fino con histórico de tickets.
                </p>
              </div>
            </div>
            <div class="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-700">Completado</h3>
                <span class="bg-white/60 px-2 py-0.5 rounded-md text-xs font-medium text-slate-500">
                  1
                </span>
              </div>
              <div class="bg-white/80 rounded-xl p-4 shadow-sm border border-white/60 opacity-70">
                <p class="text-sm font-medium text-slate-800 mb-2 line-through">
                  Ingesta de datos base
                </p>
                <p class="text-xs text-slate-500">
                  Recopilar primeros 10k tickets.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="screen-roadmap" class="screen-section hidden max-w-5xl mx-auto space-y-6 pb-12">
          <h2 class="text-2xl font-semibold tracking-tight text-slate-800 mb-6">
            Roadmap del Proyecto
          </h2>
          <div class="relative border-l-2 border-emerald-200 ml-4 space-y-10">
            <div class="relative pl-8">
              <div class="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm"></div>
              <h3 class="text-lg font-semibold text-slate-800">
                Fase 1: Preparación
              </h3>
              <p class="text-sm text-emerald-600 font-medium mb-2">
                Septiembre 2023
              </p>
              <div class="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm">
                <p class="text-sm text-slate-600">
                  Recopilación de requisitos, asignación de equipo y setup de
                  infraestructura en AWS.
                </p>
              </div>
            </div>
            <div class="relative pl-8">
              <div class="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              </div>
              <h3 class="text-lg font-semibold text-slate-800">
                Fase 2: Desarrollo Core
              </h3>
              <p class="text-sm text-emerald-600 font-medium mb-2">
                Octubre 2023 (Actual)
              </p>
              <div class="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm">
                <p class="text-sm text-slate-600">
                  Entrenamiento del LLM, integración con APIs y creación del
                  dashboard inicial.
                </p>
              </div>
            </div>
            <div class="relative pl-8 opacity-60">
              <div class="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-slate-300 ring-4 ring-white shadow-sm"></div>
              <h3 class="text-lg font-semibold text-slate-800">
                Fase 3: Staging &amp; Testing
              </h3>
              <p class="text-sm text-slate-500 font-medium mb-2">
                Noviembre 2023
              </p>
              <div class="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm">
                <p class="text-sm text-slate-600">
                  Pruebas con usuarios beta, afinamiento de prompts y corrección
                  de bugs.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div id="screen-gantt" class="screen-section hidden max-w-7xl mx-auto space-y-6 pb-12">
          <h2 class="text-2xl font-semibold tracking-tight text-slate-800 mb-6">
            Gráfica Gantt
          </h2>
          <div class="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80 p-6 overflow-x-auto">
            <div class="min-w-[800px]">
              <div class="grid grid-cols-12 gap-2 mb-4 text-xs font-semibold text-slate-500 border-b border-slate-200 pb-2">
                <div class="col-span-3">Tarea</div>
                <div class="col-span-9 grid grid-cols-4 gap-2 text-center">
                  <div>Semana 1</div>
                  <div>Semana 2</div>
                  <div>Semana 3</div>
                  <div>Semana 4</div>
                </div>
              </div>
              <div class="space-y-4">
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-3 text-sm font-medium text-slate-700">
                    Setup Infraestructura
                  </div>
                  <div class="col-span-9 grid grid-cols-4 gap-2 relative">
                    <div class="col-start-1 col-span-1 h-6 bg-emerald-200 rounded-md border border-emerald-300 relative group">
                      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-emerald-700">
                        100%
                      </span>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-3 text-sm font-medium text-slate-700">
                    Entrenamiento LLM
                  </div>
                  <div class="col-span-9 grid grid-cols-4 gap-2 relative">
                    <div class="col-start-2 col-span-2 h-6 bg-emerald-500 rounded-md shadow-sm shadow-emerald-500/20 relative">
                      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">
                        60%
                      </span>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-3 text-sm font-medium text-slate-700">
                    Integración UI
                  </div>
                  <div class="col-span-9 grid grid-cols-4 gap-2 relative">
                    <div class="col-start-3 col-span-2 h-6 bg-slate-200 rounded-md border border-slate-300 relative"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="screen-archivos" class="screen-section hidden max-w-7xl mx-auto space-y-6 pb-12">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold tracking-tight text-slate-800">
              Archivos
            </h2>
            <button data-upload-readonly="true" class="px-4 py-2 bg-emerald-500 rounded-xl text-sm font-medium text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2">
              <iconify-icon icon="solar:upload-linear" class="text-lg"></iconify-icon>
              Subir Archivo
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 file-card" data-file-card="true">
              <div class="bg-blue-500/10 h-24 rounded-xl flex items-center justify-center text-blue-600 text-4xl">
                <iconify-icon icon="solar:document-text-linear"></iconify-icon>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800 truncate">
                  Arq_Sistema_v1.pdf
                </p>
                <p class="text-xs text-slate-500 mt-1">2.4 MB • Hace 2 días</p>
              </div>
            </div>
            <div class="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 file-card" data-file-card="true">
              <div class="bg-emerald-500/10 h-24 rounded-xl flex items-center justify-center text-emerald-600 text-4xl">
                <iconify-icon icon="solar:file-check-linear"></iconify-icon>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800 truncate">
                  Métricas_Baseline.csv
                </p>
                <p class="text-xs text-slate-500 mt-1">842 KB • Hace 1 sem</p>
              </div>
            </div>
            <div class="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 file-card" data-file-card="true">
              <div class="bg-purple-500/10 h-24 rounded-xl flex items-center justify-center text-purple-600 text-4xl">
                <iconify-icon icon="solar:gallery-linear"></iconify-icon>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800 truncate">
                  Mockups_V2.png
                </p>
                <p class="text-xs text-slate-500 mt-1">4.1 MB • Hoy</p>
              </div>
            </div>
            <div class="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 file-card" data-file-card="true">
              <div class="bg-amber-500/10 h-24 rounded-xl flex items-center justify-center text-amber-600 text-4xl">
                <iconify-icon icon="solar:presentation-linear"></iconify-icon>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800 truncate">
                  Kickoff_Slides.pptx
                </p>
                <p class="text-xs text-slate-500 mt-1">12 MB • Hace 1 mes</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Contenedor Principal 3D -->
<script>
      function showScreen(screenId) { document.querySelectorAll('.screen-section').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); }); const target = document.getElementById('screen-' + screenId); if(target) { target.classList.remove('hidden'); target.classList.add('block'); } document.querySelectorAll('.nav-link').forEach(link => { link.classList.remove('bg-white/80', 'text-slate-800', 'shadow-sm', 'border-white/60', 'font-semibold'); link.classList.add('text-slate-600', 'hover:bg-white/50', 'font-medium'); const icon = link.querySelector('iconify-icon'); if (icon) { icon.classList.remove('text-emerald-500'); icon.setAttribute('icon', icon.getAttribute('icon').replace('-bold-duotone', '-linear')); } if (link.getAttribute('onclick').includes(screenId)) { link.classList.remove('text-slate-600', 'hover:bg-white/50', 'font-medium'); link.classList.add('bg-white/80', 'text-slate-800', 'shadow-sm', 'border-white/60', 'font-semibold'); if (icon) { icon.classList.add('text-emerald-500'); icon.setAttribute('icon', icon.getAttribute('icon').replace('-linear', '-bold-duotone')); } } }); }
    </script>

    <div id="auth-screen" class="fixed inset-0 z-[100] bg-blue-50/90 backdrop-blur-xl flex items-center justify-center p-4 transition-opacity duration-500">
      <div class="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white p-8 md:p-12 w-full max-w-md flex flex-col relative overflow-hidden">
        <div class="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"></div>

        <div class="relative z-10 text-center mb-8">
          <div class="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold tracking-tight shadow-lg shadow-emerald-500/30 mx-auto mb-4 border border-white/20">
            NV
          </div>
          <h2 class="text-2xl font-semibold tracking-tight text-slate-800">
            Portal de Cliente
          </h2>
          <p class="text-sm text-slate-500 mt-2 font-medium">
            Acceso seguro con código temporal
          </p>
        </div>

        <div id="auth-step-1" class="relative z-10 flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="auth-email" class="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
              Correo Electrónico
            </label>
            <div class="relative">
              <iconify-icon icon="solar:letter-linear" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"></iconify-icon>
              <input type="email" id="auth-email" placeholder="tu@empresa.com" class="w-full bg-white/60 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl py-3.5 pl-12 pr-4 text-slate-700 outline-none transition-all shadow-sm font-medium placeholder:text-slate-400" required="">
            </div>
          </div>
          <button data-auth-email="true" class="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-2xl py-3.5 font-semibold shadow-md transition-all mt-2 active:scale-[0.98]">
            Continuar
          </button>
        </div>

        <div id="auth-step-2" class="relative z-10 hidden flex-col gap-4">
          <p class="text-sm text-slate-600 text-center mb-2 leading-relaxed">
            Hemos enviado un código a
            <br>
            <span id="auth-email-display" class="font-semibold text-slate-800"></span>
          </p>
          <div class="flex flex-col gap-1.5">
            <label for="auth-code" class="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
              Código de Acceso
            </label>
            <div class="relative">
              <input type="text" id="auth-code" placeholder="123456" maxlength="6" class="w-full bg-white/60 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl py-3.5 px-4 text-slate-700 outline-none transition-all shadow-sm font-mono text-xl tracking-[0.25em] placeholder:text-slate-300 placeholder:font-sans placeholder:text-base placeholder:tracking-normal text-center" required="">
            </div>
            <p id="auth-error" class="text-xs text-red-500 font-medium ml-1 mt-1 hidden">
              Código incorrecto. Pista: 123456
            </p>
          </div>
          <button data-auth-code="true" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-3.5 font-semibold shadow-md shadow-emerald-500/20 transition-all mt-2 active:scale-[0.98]">
            Verificar y Entrar
          </button>
          <button data-auth-reset="true" class="text-xs font-medium text-slate-500 hover:text-slate-700 mt-2 transition-colors">
            Usar otro correo
          </button>
        </div>
      </div>
    </div>
`;
