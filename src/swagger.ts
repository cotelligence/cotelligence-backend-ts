import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (
  app: INestApplication,
  title: string,
  description: string,
  version: string,
  tag: string,
): void => {
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addTag(tag);
  const document = SwaggerModule.createDocument(app, config.build());
  SwaggerModule.setup('/api/v1/swagger', app, document, {});
};
