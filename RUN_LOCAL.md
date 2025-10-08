# Ejecutar localmente (Dev)

Guía para correr **KataGo Web** en tu máquina.

> Requisitos recomendados: **Windows 10/11 64-bit**, 8–16 GB RAM.  
> Node.js **18+** (LTS), npm 9+. GPU opcional.

---

## 1) Preparación de archivos

Cloná el repositorio y verificá:
backend/
engines/katago/
katago.exe # ejecutable KataGo (Windows)
networks/
kata1-b15c192-....txt.gz # red neuronal (incluida o bajada)

> **Redes neuronales**: usá una red compatible (p.ej. b15c192).  
> Copiá el `.txt.gz` a `backend/engines/katago/networks/`.

---

## 2) Variables de entorno

### 2.1 Backend (`backend/.env`)

```env
KATAGO_EXE_PATH=engines/katago/katago.exe
KATAGO_NETWORKS_DIR=engines/katago/networks
KATAGO_NETWORK_FILE=kata1-b15c192-....txt.gz
KATAGO_CFG_PATH=engines/katago/analysis_web.cfg

# Perfiles por defecto
KATAGO_HW=cpu-low
KATAGO_PRESET=medium
```

En Linux/macOS, ajustá KATAGO_EXE_PATH a engines/katago/katago si corresponde.

### 2.2 Frontend (frontend/.env)

VITE_API_BASE_URL=http://localhost:3000

## 3) Instalación y arranque

### 3.1 Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

Levanta en http://localhost:3000.

Al primer POST /game/start se genera analysis_web.cfg y se lanza katago.exe.

3.2 Frontend (Vite)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrí la URL que imprime Vite (ej.: http://localhost:5173).

## 4. Uso básico (UI)

### 1. Home:

-  Elegí Dificultad (easy/medium/hard/pro).

-  Elegí Hardware (cpu-low/cpu-mid/gpu).

-  (Opcional) Escribí el archivo de red (solo el nombre dentro de networks/).

-  Click “Aplicar y jugar”.

### 2.Game:

Jugá en el tablero principal.

Mirá el Delta Winrate y Delta Puntos de tu jugada.

Consultá Top-3 del Bot y Top-3 para el Usuario (WR/Score/PV).

Probá ideas en el Tablero independiente (no afecta la partida).

## 5. Presets y perfiles (referencia)

Presets (ajustan maxVisits):

-  easy: 90

-  medium: 180

-  hard: 400

-  pro: 1000

Hardware (ajustan hilos y batch NN):

- cpu-low: numSearchThreads=4, nnMaxBatchSize=4

- cpu-mid: numSearchThreads=8, nnMaxBatchSize=8

- gpu: numSearchThreads=12, nnMaxBatchSize=32

La mezcla se vuelca en analysis_web.cfg automáticamente antes de lanzar KataGo.
