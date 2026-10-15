import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { APP_CONFIG, AppConfig } from './identity/config';

async function bootstrap() {
  const app = configureApp(
    await NestFactory.create(AppModule, { bodyParser: false }),
  );
  app.enableShutdownHooks();
  await app.listen(app.get<AppConfig>(APP_CONFIG).PORT);
}
bootstrap();
