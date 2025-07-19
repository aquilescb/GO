import { Body, Controller, Post } from '@nestjs/common';
import { AssistantService } from '../application/assistant.service';
import { AnalyzeMoveDto } from '../dto/analyze-move.dto';
import { AssistantResponse, AnalyzeMoveInput } from '../domain/types/assistant.types';
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('think')
  think(@Body() dto: AnalyzeMoveDto): AssistantResponse {
    console.log('Llegó al endpoint /assistant/think');
    return this.assistantService.think(dto as AnalyzeMoveInput);
  }
}
