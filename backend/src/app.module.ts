import { Module } from '@nestjs/common';
import { EngineModule } from './engine/engine.module';
import { GameController } from './engine/engine.controller';
//Modulo raiz del proyecto
// Aquí se importan los módulos principales de la aplicación
@Module({
  imports: [EngineModule],
  controllers: [GameController],
})
export class AppModule {}
