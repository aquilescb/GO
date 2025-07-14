import { Board, Move, Reflexion,JugadaConTurno } from '../../types/assistant.types';
function esBorde(x: number, y: number, size: number): boolean {
    return x === 0 || y === 0 || x === size - 1 || y === size - 1;
}

function obtenerVecinos(x: number, y: number): [number, number][] {
    return [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
    ];
}
function estaEnAtari(board: Board, x: number, y: number): boolean {
    const size = board.length;
    const vecinos = obtenerVecinos(x, y);
    const libertades = vecinos.filter(
        ([i, j]) =>
        i >= 0 && j >= 0 && i < size && j < size && board[i][j] === null
    ).length;
    return libertades === 1;
}

function estaMuyAislada(board: Board, move: Move): boolean {
    const { x, y, color } = move;
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board.length; j++) {
        if (board[i][j] === color) {
            const distancia = Math.sqrt((i - x) ** 2 + (j - y) ** 2);
            if (distancia < 4) return false;
        }
        }
    }
    return true;
}
function intentaConectarGrupos(board: Board, move: Move): boolean {
    const { x, y, color } = move;
    const size = board.length;
    const distanciaMaxima = 5;

    let aliados: { x: number; y: number }[] = [];

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
        if (board[i][j] === color) {
            aliados.push({ x: i, y: j });
        }
        }
    }

    // Ver cuántos aliados están en lados distintos del nuevo movimiento
    const grupoIzq = aliados.filter((a) => a.x < x && Math.abs(a.y - y) <= distanciaMaxima);
    const grupoDer = aliados.filter((a) => a.x > x && Math.abs(a.y - y) <= distanciaMaxima);

    return grupoIzq.length > 0 && grupoDer.length > 0;
}

function esInvasion(board: Board, move: Move): boolean {
    const { x, y, color } = move;
    const enemy = color === "black" ? "white" : "black";
    const size = board.length;

    // Verificar si hay enemigos cerca
    const vecinos = obtenerVecinos(x, y);
    const enemigosCerca = vecinos.filter(
        ([i, j]) =>
        i >= 0 && j >= 0 && i < size && j < size && board[i][j] === enemy
    ).length >= 2;

    // Verificar si no hay aliados en un rango de 5
    let aliadosLejanos = true;
    for (let i = Math.max(0, x - 5); i <= Math.min(size - 1, x + 5); i++) {
        for (let j = Math.max(0, y - 5); j <= Math.min(size - 1, y + 5); j++) {
        if (board[i][j] === color) {
            aliadosLejanos = false;
            break;
        }
        }
        if (!aliadosLejanos) break;
    }

    return enemigosCerca && aliadosLejanos;
}
function juegaSiempreEnLaMismaZona(history: Move[], move: Move): boolean {
    const zonaLimite = 4;
    const recientes = history.slice(-5).filter(m => m.color === move.color);

    const repetidas = recientes.filter(
        (m) =>
        Math.abs(m.x - move.x) <= zonaLimite &&
        Math.abs(m.y - move.y) <= zonaLimite
    );

    return repetidas.length >= 3;
}
function estaJugandoEspejo(history: Move[], move: Move): boolean {
    const lastOpponentMove = [...history].reverse().find(
        (m) => m.color !== move.color
    );
    if (!lastOpponentMove) return false;

    return move.x === lastOpponentMove.x && move.y === lastOpponentMove.y;
}


// Análisis de movimientos inteligentes
export function analizarMovimientoInteligente(board: Board, move: Move, history: JugadaConTurno[]): Reflexion[] {
    const size = board.length;
    const { x, y, color } = move;
    const enemy = color === 'black' ? 'white' : 'black';
    const reflexiones: Reflexion[] = [];

    const vecinos = obtenerVecinos(x, y);

  // 📍 Borde del tablero
    if (esBorde(x, y, size)) {
        reflexiones.push({
        tipo: 'estratégica',
        mensaje: '¿Por qué jugar tan cerca del borde tan pronto?',
        });
    }

  // 🔗 Aliados cerca
    const aliadosCerca = vecinos.some(
        ([i, j]) =>
        i >= 0 && j >= 0 && i < size && j < size && board[i][j] === color
    );

    if (!aliadosCerca) {
        reflexiones.push({
        tipo: 'defensiva',
        mensaje: 'Esa piedra parece muy expuesta, ¿cómo la vas a proteger?',
        });
    }

    // ⚔️ Enemigos cerca
    const enemigosCerca = vecinos.some(
        ([i, j]) =>
        i >= 0 && j >= 0 && i < size && j < size && board[i][j] === enemy
    );

    if (enemigosCerca) {
        reflexiones.push({
        tipo: 'ofensiva',
        mensaje: '¿Estás preparado para una lucha en ese sector?',
        });
    }

    // 🧤 Libertades
    const libertades = vecinos.filter(
        ([i, j]) =>
        i >= 0 && j >= 0 && i < size && j < size && board[i][j] === null
    ).length;

    if (libertades <= 2) {
        reflexiones.push({
        tipo: 'defensiva',
        mensaje: 'Esa jugada te deja con pocas opciones de escape.',
        });
    }

    // Fallback
    if (reflexiones.length === 0) {
        reflexiones.push({
        tipo: 'táctica',
        mensaje: '¿Cuál es tu intención con esta jugada?',
        });
    }
    // ☠️ Atari
    if (estaEnAtari(board, x, y)) {
    reflexiones.push({
        tipo: "defensiva",
        mensaje: "Esa piedra está en atari apenas la jugás, ¿es un sacrificio?",
    });
    }

    // 🛰 Jugada muy aislada
    if (estaMuyAislada(board, move)) {
    reflexiones.push({
        tipo: "estratégica",
        mensaje: "Esa jugada está muy lejos del resto de tus piedras, ¿hay un plan detrás?",
    });
    }

    // 🔗 Conectar grupos
    if (intentaConectarGrupos(board, move)) {
    reflexiones.push({
        tipo: "táctica",
        mensaje: "¿Estás intentando unir tus grupos? Cuidado con un posible corte enemigo.",
        });
    }
    // 🏴 Invasión
    if (esInvasion(board, move)) {
        reflexiones.push({
            tipo: "ofensiva",
            mensaje: "¿Estás invadiendo el territorio enemigo? Asegurate de tener un plan de salida.",
        });
    }
    // estilo repetitivo
    if (juegaSiempreEnLaMismaZona(history, move)) {
    reflexiones.push({
        tipo: "estratégica",
        mensaje: "Jugás muchas veces en la misma zona. ¿Estás olvidando otras partes del tablero?",
    });
    }

    // espejo
    if (estaJugandoEspejo(history, move)) {
    reflexiones.push({
        tipo: "táctica",
        mensaje: "¿Estás copiando jugadas del rival? Puede que te lleve a una posición débil.",
    });
    }

    return reflexiones;
}
