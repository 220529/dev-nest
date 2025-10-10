import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getCurrentEnv, getAuthConfig } from '@/config/auth.config';

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
  
  const port = process.env.PORT ?? 9001;
  await app.listen(port);
  
  // 显示关键环境信息
  const currentEnv = getCurrentEnv();
  const authConfig = getAuthConfig();
  console.log(`🌍 环境: ${currentEnv.toUpperCase()} | ERP: ${authConfig.baseUrl} | 上传: http://localhost:${port}/upload`);
}
bootstrap();
