import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { setupTestApp } from '../src/__tests__/utils.spec';

describe('e2e (App)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
    console.log(`prisma connected to ${process.env.DB_URL}`);
    await app.init();
  });
  describe('health check', () => {
    it('should get health', async () => {
      await request.agent(app.getHttpServer()).get('/health').expect(200);
    });
  });
});
