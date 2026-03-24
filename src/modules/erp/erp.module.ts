import { Module } from '@nestjs/common';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';
import { ImportModule } from '@/modules/import/import.module';

@Module({
  imports: [ImportModule],
  controllers: [ErpController],
  providers: [ErpService],
  exports: [ErpService], // 导出供其他模块使用
})
export class ErpModule {}
