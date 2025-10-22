import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { AppController } from '@/app.controller';
import { ExcelModule } from '@/modules/excel/excel.module';
import { ErpModule } from '@/modules/erp/erp.module';
import { HttpLoggingInterceptor } from '@/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: ['.env.local', '.env'], // 环境文件路径
    }),
    ErpModule,
    ExcelModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'data'),
      serveRoot: '/data',
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
