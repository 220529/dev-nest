import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getConfigSummary } from '@/modules/erp/erp.config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Swagger 配置
    const config = new DocumentBuilder()
      .setTitle('Dev Nest API')
      .setDescription('ERP接口转发服务')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT ?? 9009;
    await app.listen(port);

    // 显示启动信息
    const configSummary = getConfigSummary();
    console.log(`🚀 应用启动成功`);
    console.log(`🌍 环境: ${configSummary.environment.toUpperCase()}`);
    console.log(`🔗 ERP: ${configSummary.baseUrl}`);
    console.log(`📊 服务: http://localhost:${port}`);
    console.log(`🧰 工具页: http://localhost:${port}/tools/excel-import.html`);
    console.log(
      `🔐 认证: ${configSummary.hasAuthorization ? '✅ 已配置' : '❌ 未配置'}`,
    );
    if (!configSummary.isConfigured) {
      console.warn(
        `⚠️ ERP 环境变量未完整配置，ERP 转发接口暂不可用: ${configSummary.missingKeys.join(', ')}`,
      );
    }
  } catch (error) {
    console.error('❌ 应用启动失败:', error.message);
    console.error('💡 请检查环境配置文件是否正确设置');
    process.exit(1);
  }
}
bootstrap();
