import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: como no usamos cookies/sessionId, no hace falta credentials
  app.enableCors({
    origin: true, // o poné tu origen: 'http://localhost:5173'
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  });

  // Cierre ordenado
  const close = async () => {
    try {
      await app.close();
    } catch {
      /* noop */
    }
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);

  await app.listen(3000);
}
void bootstrap();
