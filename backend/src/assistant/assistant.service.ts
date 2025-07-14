import { Injectable } from "@nestjs/common";
import { AnalyzeMoveDto } from "./dto/analyze-move.dto";
import { analizarMovimientoInteligente } from "./logic/analyzer";
import { JugadaConTurno } from "src/types/assistant.types";

@Injectable()
export class AssistantService {
    analizarMovimiento(dto: AnalyzeMoveDto): string {
        // Validar que el dto tenga las propiedades necesarias
        const { board, lastMove, history } = dto;

        const respuestas = analizarMovimientoInteligente(board, lastMove, history as JugadaConTurno[]);
        return respuestas[Math.floor(Math.random() * respuestas.length)].mensaje;

    }
}
