import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ApiModule } from '@/modules/api';

@Module({
  imports: [ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
