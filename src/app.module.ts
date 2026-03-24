import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from '@/app.controller';
import { ErpModule } from '@/modules/erp/erp.module';
import { ImportModule } from '@/modules/import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.dev', '.env.local', '.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/tools',
    }),
    ErpModule,
    ImportModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
