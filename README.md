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

Todos los motores deben estar ubicados dentro de la carpeta backend (al mismo nivel que src, no dentro de src).

Estructura esperada:
```bash
backend/
│── gnugo/
│── leelaz/
│── pachi/
│── src/
│── ...
```

#### Gnu Go

1. Descargar desde: 
🔗https://www.gnu.org/software/gnugo/download.html

2. Dentro de backend/gnugo/ crear una subcarpeta llamada interface.

3. Copiar dentro de backend/gnugo/interface/ los siguientes archivos:
- gnugo.exe
- cyggcc_s-1.dll
- cygncurses-10.dll
- cygwin1.dll
- COPYING

#### LeelaZero
1. Descargar Leela Zero 0.17 + AutoGTP v18 desde:
 https://github.com/leela-zero/leela-zero/releases

2. Copiar todos los archivos en la carpeta: `backend/leelaz`

3. Asegúrate de incluir:
- leelaz.exe
- autogtp.exe
- Todas las librerías .dll necesarias
- La red neuronal que se puede obtener desde la página oficial o desde que. https://leela.online-go.com/networks/?C=M&O=D. Luego de descargar el archivo, renombrarlo al nombre de weights.txt.gz

Pachi
Descargar desde:
🔗 https://github.com/pasky/pachi

Copiar los binarios y archivos necesarios dentro de: `backend/pachi/`

### Ayuda
Tambien se puede descargar Pachi y GnuGo para windows en este apartado:
https://gnugo.baduk.org/


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

