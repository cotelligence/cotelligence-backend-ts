import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { setupSwagger } from './swagger';
import { formatError, logger } from './utils/logging';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
  });
  app.useLogger(app.get(Logger));
  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(adapterHost));
  app.setGlobalPrefix('/api/v1', {
    exclude: ['health'],
  });
  // disable swagger in production
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(
      app,
      'Cotelligence Backend Ts',
      'Cotelligence Backend in Typescript',
      '1.0',
      'cotelligence-backend-ts'
    );
  }
  // skip favicon request
  app.use((req, res, next) => {
    if (req.url === '/favicon.ico') {
      res.status(204);
    } else {
      next();
    }
  });
  app.enableCors();
  await app.listen(process.env.PORT ?? 8080);
}

bootstrap().catch((e) => {
  logger.error(`caught non-api exception: ${formatError(e)}`);
  throw e;
});
