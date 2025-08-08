# 🧠 GO Software - Plataforma Web Interactiva para Aprender y Jugar GO

Plataforma web escalable y profesional donde los usuarios pueden jugar partidas de GO contra motores como GnuGo, Pachi o LeelaZero, con asistencia reflexiva en tiempo real, informes personalizados y seguimiento de progreso.

---

## 🎯 Objetivo del Proyecto

Desarrollar una plataforma **educativa y entretenida** que combine juego, análisis y mejora continua a través de inteligencia artificial.

---

## 🧱 Funcionalidades Clave

- 🕹 Juego de GO contra motores: GoGnu, Pachi y LeelaZero
- 🤖 Chatbot reflexivo que guía al jugador con preguntas, no jugadas.
- 📑 Informe post-partida con feedback generado por IA (OpenAI).
- 🧠 Ejercicios personalizados según errores cometidos.
- 📊 Dashboard de progreso con estadísticas, logros y evolución.
- 🎯 Preparado para sistema de suscripciones y roles de usuario.

---

## 🧪 Tecnologías Utilizadas

### 📦 Backend
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT para autenticación
- Zod para validaciones

### 🖥 Frontend
- React + Vite + TypeScript
- TailwindCSS
- Framer Motion
- React Query (TanStack)

### 🤖 IA & Bot
- OpenAI GPT-4o (para informes)
- GnuGo (motor lógico clásico)
- Pachi (Monte Carlo Tree Search)
- LeelaZero (red neuronal entrenada)


## 🚀 Instalación y Ejecución


### 1. Clonar el repositorio

```bash
git clone https://github.com/aquilescb/GO
cd GO
```

### 2. Requisitos previos
Node.js: https://nodejs.org/es

### 3. Instalacion de Motores

#### Gnu Go
Descargar desde: https://gnugo.baduk.org/

En la carpeta backend/gnugo/ crear una subcarpeta llamada interface.

Copiar dentro de interface los siguientes archivos:
- gnugo.exe
- cyggcc_s-1.dll
- cygncurses-10.dll
- cygwin1.dll
- COPYING

#### LeelaZero
Descargar Leela Zero 0.17 + AutoGTP v18 desde:
https://github.com/leela-zero/leela-zero/releases

Copiar todos los archivos en la carpeta:
`backend/gnugo/leelaz`

Asegúrate de incluir leelaz.exe, autogtp.exe, librerías .dll y el archivo weights.txt.gz.

Leela Zero 0.17 + AutoGTP v18
Instalar los motores:
https://github.com/leela-zero/leela-zero/releases

Gnu Go y Pachi descargar 

https://gnugo.baduk.org/

Para Gnu crear una carpeta interface dentro del motor y dentro  deben estar los 4 archivos .dll y el .exe


### 3. Backend

```bash
cd backend
npm install
```

---

### 4. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

