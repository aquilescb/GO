import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

//Punto de entrada de la aplicación NestJS
// Aquí se configura el módulo raíz y se inicia el servidor
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
}
void bootstrap();
