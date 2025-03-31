import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '12mb' }));
  app.use(bodyParser.urlencoded({ limit: '12mb', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.enableCors({ credentials: true });
  const config = new DocumentBuilder()
    .setTitle('Gulp & Grub API')
    .setDescription('Gulp & Grub API description')
    .setVersion('1.0')
    .addTag('gulp & grub')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
