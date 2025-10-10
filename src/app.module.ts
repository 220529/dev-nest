import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ExcelModule } from '@/modules/excel/excel.module';
import { ErpModule } from '@/modules/erp/erp.module';
import { HttpLoggingInterceptor } from '@/common';

@Module({
  imports: [
    ErpModule,
    ExcelModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
