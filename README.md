# KataGo Web — Juego + Análisis con IA

Plataforma web para jugar Go contra **KataGo** y **aprender de los errores** en tiempo real.

## ✨ Funcionalidades

-  **Partida 19×19** vs. IA (KataGo, modo _analysis_).
-  **Mapa de influencia** (ownership) en vivo.
-  **Sistema de Errores (Δ / Delta)** por turno:
   -  **Delta Winrate**: cambio en probabilidad de victoria.
   -  **Delta Puntos**: cambio en la ventaja de puntos.
-  **Recomendaciones para el usuario** (Top-3 con PV/WR/Score).
-  **Tablero independiente (“laboratorio”)** para practicar y dibujar.
-  **Selector de dificultad / hardware / red** antes de jugar.

## 🧩 Arquitectura

-  **Frontend**: Vite + React + TypeScript + Tailwind.
-  **Backend**: NestJS (Node 18+).
-  **Motor**: KataGo (ejecutable local) en modo `analysis`.
-  **Comunicación**: HTTP/JSON (REST).
-  **Estado**: sesión en memoria (lista de jugadas).

## 🗂️ Estructura (extracto)

backend/
engines/katago/
katago.exe
networks/
kata1-b15c192-....txt.gz
analysis_web.cfg # se genera automáticamente
src/engine/katago/
runtime-config.ts # presets/hardware y writer del CFG
katago.service.ts # lifecycle + análisis
engine.controller.ts # endpoints REST
src/engine/engine.analysis.config.ts # RuntimeConfig + envs

frontend/
src/domains/game-go/pages/
HomePage.tsx # selector preset/hardware/red y start
GamePage.tsx # tablero + métricas + delta
src/domains/game-go/components/
Board.tsx, OverlayOwnership.tsx, MoveStrip.tsx, PracticeBoard.tsx, TagsSelect.tsx
src/lib/api/katagoApi.ts # cliente REST

## ⚙️ Configuración dinámica

En **Home** elegís:

-  **Dificultad**: `easy | medium | hard | pro` (controla `maxVisits`).
-  **Hardware**: `cpu-low | cpu-mid | gpu` (hilos de búsqueda y batch NN).
-  **Red neuronal**: nombre del archivo dentro de `engines/katago/networks/`.

Al aplicar, el backend re-escribe `analysis_web.cfg` y relanza KataGo.

## 🔌 Endpoints (resumen)

-  `POST /game/start` — inicia motor + resetea sesión.
-  `POST /game/shutdown` — detiene motor.
-  `POST /game/play-eval` — `{ move: "D4" }` → análisis + delta + sugerencias.
-  `GET  /game/config` — devuelve configuración vigente.
-  `POST /game/config/apply` — cambia `preset/hardware/network` y reinicia motor.

## ▶️ Cómo correr

Ver **RUN_LOCAL.md** para guía paso a paso (.env, comandos, troubleshooting).

## 📚 Glosario rápido

-  **WR (Winrate)**: probabilidad de victoria (0–100%).
-  **Score**: ventaja en puntos (signo/magnitud).
-  **PV**: principal variation (secuencia prevista).
-  **Delta**: diferencia entre “línea óptima” y “lo jugado por el usuario”.

## 🛣️ Roadmap breve

-  Exportar partidas a **SGF**.
-  Histórico de **Delta** por partida (gráfico).
-  Endpoint para listar redes en `networks/`.
-  Preset alternativo por **tiempo fijo** (`maxTime`).

## 📜 Licencia

Uso interno / demo (ajustar según el proyecto).
