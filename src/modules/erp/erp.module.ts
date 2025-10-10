import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ErpService } from './erp.service';

@Module({
  imports: [HttpModule],
  providers: [ErpService],
  exports: [ErpService], // 导出供其他模块使用
})
export class ErpModule {}
