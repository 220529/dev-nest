import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ErpService } from './erp.service';

@ApiTags('ERP')
@Controller('api')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  /**
   * 转发服务 - runFlow接口
   * 兼容原有的转发逻辑
   */
  @Post('runFlow')
  @ApiOperation({ summary: 'ERP转发服务 - runFlow' })
  async runFlow(@Body() body: any) {
    return this.erpService.forwardRunFlow(body);
  }
}
