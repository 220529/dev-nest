import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

@Module({
  controllers: [ApiController],
  providers: [ApiService],
  exports: [ApiService], // 导出服务供其他模块使用
})
export class ApiModule {}
