import { Module } from '@nestjs/common';
import { AssistantModule } from './assistant/infra/assistant.module'; 
//Modulo raiz del proyecto
// Aquí se importan los módulos principales de la aplicación
@Module({
  imports: [AssistantModule], 
})
export class AppModule {}