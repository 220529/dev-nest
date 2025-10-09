import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiService } from './api.service';

@ApiTags('API')
@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('runFlow')
  @ApiOperation({ summary: '中转服务 - runFlow' })
  async runFlow(@Body() body: any) {
    return await this.apiService.runFlow(body);
  }
}
