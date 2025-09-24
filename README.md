# 🧠 GO Software - Plataforma Web Interactiva para Aprender y Jugar GO

Plataforma web escalable y profesional donde los usuarios pueden jugar partidas de GO contra motores como **GnuGo**, **Pachi**, **LeelaZero** o **KataGo**, con asistencia reflexiva en tiempo real, informes personalizados y seguimiento de progreso.

---

## 🎯 Objetivo del Proyecto
Combinar juego, análisis y mejora continua con inteligencia artificial para ofrecer una experiencia educativa y entretenida.

---

## 🧱 Funcionalidades Clave
- 🕹 Juego de GO contra motores: **GnuGo**, **Pachi**, **LeelaZero** y **KataGo**.
- 🤖 Chatbot reflexivo que guía al jugador con preguntas, no con jugadas directas.
- 📑 Informe post-partida con feedback generado por IA.
- 🧠 Ejercicios personalizados según errores cometidos.
- 📊 Dashboard con estadísticas y logros.
- 🎯 Preparado para sistema de suscripciones y roles.

---

## 🧪 Tecnologías Utilizadas
### 📦 Backend
- NestJS + TypeScript

### 🖥 Frontend
- React + Vite + TypeScript
- TailwindCSS
- Framer Motion
- React Query (TanStack)

### 🤖 IA & Motores
- OpenAI GPT-4o
- [GnuGo](https://www.gnu.org/software/gnugo/download.html) (motor lógico clásico)
- [Pachi](https://github.com/pasky/pachi)
- [LeelaZero](https://github.com/leela-zero/leela-zero/releases)
- [KataGo](https://github.com/lightvector/KataGo/releases) + redes oficiales en [katagotraining.org/networks](https://katagotraining.org/networks/)

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/aquilescb/GO
cd GO
```

---

### 2. Requisitos previos
- **Node.js**: [Descargar aquí](https://nodejs.org/es)  
- **Windows 10/11** 
---

### 3. Instalación de Motores

> **IMPORTANTE:** Todos los motores van dentro de la carpeta `backend/engines` siguiendo la estructura exacta.  
> No colocar dentro de `src`.

Estructura esperada:
```
backend/
│── engines/
│   ├── gnugo/
│   │   └── interface/
│   ├── katago/
│   ├── leelaz/
│   └── pachi/
│── src/
```

---

#### 🔹 GnuGo
1. Descargar desde: [GNU Go Official](https://www.gnu.org/software/gnugo/download.html)  
   También disponible para Windows aquí: [gnugo.baduk.org](https://gnugo.baduk.org/)  

2. Crear la carpeta:
```
backend/engines/gnugo/interface/
```

3. Copiar los siguientes archivos dentro de `interface/`:
- `gnugo.exe`
- `cyggcc_s-1.dll`
- `cygncurses-10.dll`
- `cygwin1.dll`
- `COPYING`

---

#### 🔹 KataGo
1. Descargar desde: [KataGo Releases](https://github.com/lightvector/KataGo/releases)  
   Elige **Windows OpenCL** o **Windows CUDA** según tu hardware. Lo mas recomendable es **OpenCL**

2. Copiar todo el contenido extraído en:
```
backend/engines/katago/
```

3. Descargar la red neuronal desde: [KataGo Networks](https://katagotraining.org/networks/)  
   - Ejemplo: `g170e-b15c192-s1672170752-d466197061.txt.gz`  
   - Crear la carpeta network si no exsite en el siguiente ruta: `backend/engines/katago/networks/`. Luego meter el archivo dentro de esa carpeta

---

#### 🔹 LeelaZero
1. Descargar Leela Zero 0.17 + AutoGTP v18 desde:  
   [Leela Zero Releases](https://github.com/leela-zero/leela-zero/releases)

2. Copiar todo en:
```
backend/engines/leelaz/
```

3. Descargar una red desde:  
   [Leela Networks](https://zero.sjeng.org/networks) o [leela.online-go.com/networks](https://leela.online-go.com/networks/?C=M&O=D)  
   - Renombrar el archivo a `weights.txt.gz`  
   - Colocarlo en `backend/engines/leelaz/`.

---

#### 🔹 Pachi
1. Descargar desde: [Pachi GitHub](https://github.com/pasky/pachi) o binarios de [gnugo.baduk.org](https://gnugo.baduk.org/).

2. Copiar los binarios y librerías necesarias en:
```
backend/engines/pachi/
```

---
## Instalar dependencias y ejecutar los servidores

### 4. Backend
```bash
cd backend
npm install
npm run star:dev
```

---

### 5. Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---
