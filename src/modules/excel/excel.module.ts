import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { ErpModule } from '../erp';

@Module({
  imports: [HttpModule, ErpModule],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
