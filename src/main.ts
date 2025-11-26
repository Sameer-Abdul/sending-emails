import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server started on port ${port}`);
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
