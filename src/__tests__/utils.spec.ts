import { INestApplication, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import dotenv from 'dotenv';
import { Logger } from 'nestjs-pino';
import path from 'path';

import { AppModule } from '../app.module';
import { AllExceptionsFilter } from '../common/filters/all-exception.filter';
import { EnvConfig } from '../config/common.config.types';
import { CommonConfigService } from '../config/common.config.service';

export const setupConfigService = (): CommonConfigService => {
  dotenv.config({
    path: path.resolve(__dirname, '..', '..', '.env.test'),
    override: true,
  });
  return new CommonConfigService(new ConfigService<EnvConfig>({}));
};

export const setupTestApp = async (): Promise<INestApplication> => {
  dotenv.config({
    path: path.resolve(__dirname, '..', '..', '.env.test'),
    override: true,
  });
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  const adapterHost = app.get(HttpAdapterHost);
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter(adapterHost));
  app.setGlobalPrefix('/api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
    ],
  });
  return app;
};
