import { Controller, Post, Body } from "@nestjs/common";
import { AssistantService } from "./assistant.service";
import { AnalyzeMoveDto } from "./dto/analyze-move.dto";

@Controller("assistant")
export class AssistantController {
    constructor(private readonly assistantService: AssistantService) {}

    @Post("analizar")
    analizarMovimiento(@Body() dto: AnalyzeMoveDto): string {
        return this.assistantService.analizarMovimiento(dto);
    } 
}
