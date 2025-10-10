import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ErpModule } from '../erp';

@Module({
  imports: [HttpModule, ErpModule],
  controllers: [ApiController],
  providers: [ApiService],
  exports: [ApiService], // 导出服务供其他模块使用
})
export class ApiModule {}
