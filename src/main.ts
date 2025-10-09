import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('Dev Nest API')
    .setDescription('简单的中转服务API')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 9001);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 9001}`);
  console.log(`Swagger UI is available at: http://localhost:${process.env.PORT ?? 9001}/api`);
}
bootstrap();
