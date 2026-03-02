import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { erpConfig } from './erp.config';

/**
 * 转发请求的参数模型
 */
export interface ForwardParams {
  dataPath?: string;
  hostPre?: string;
  host?: string;
  [key: string]: any;
}

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * 调用ERP runFlow接口
   */
  private async callRunFlow(params: any): Promise<any> {
    const apiUrl = erpConfig.baseUrl + erpConfig.runFlowPath;
    
    const response = await firstValueFrom(
      this.httpService.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': erpConfig.authorization,
          'app-version': erpConfig.appVersion,
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
        timeout: erpConfig.timeout,
      })
    );
    
    this.logger.log(`ERP API调用成功: ${JSON.stringify(response.data)}`);
    return response.data;
  }

  /**
   * 调用开放接口
   */
  private async callOpenRunFlow(params: any): Promise<any> {
    const apiUrl = params.hostPre + erpConfig.openRunFlowPath;
    
    const response = await firstValueFrom(
      this.httpService.post(apiUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Host': params.host,
          'Connection': 'keep-alive',
        },
        timeout: 30000,
      })
    );
    
    this.logger.log(`开放API调用成功: ${JSON.stringify(response.data)}`);
    return response.data;
  }

  /**
   * 转发服务 - 处理runFlow请求转发
   */
  async forwardRunFlow(params: ForwardParams): Promise<any> {
    try {
      // 如果有dataPath，从文件读取数据
      if (params.dataPath) {
        const fs = require('fs');
        const jsData = fs.readFileSync(params.dataPath, 'utf8');
        const data = { ...params, data: jsData };
        
        this.logger.log(`转发请求到: ${data.hostPre}/api/open/runFlow`);
        const result = await this.callOpenRunFlow(data);
        this.logger.log(`转发请求成功`);
        
        return result;
      }
      
      // 如果有hostPre，使用开放接口
      if (params.hostPre) {
        this.logger.log(`转发请求到: ${params.hostPre}/api/open/runFlow`);
        const result = await this.callOpenRunFlow(params);
        this.logger.log(`转发请求成功`);
        
        return result;
      }
      
      // 否则直接调用内部runFlow接口
      this.logger.log(`调用runFlow接口`);
      const result = await this.callRunFlow(params);
      this.logger.log(`调用成功`);
      
      return result;
      
    } catch (error) {
      this.logger.error('转发请求失败:', error.message);
      
      if (error.code === 'ENOENT') {
        return { error: 'Data file not found' };
      }
      
      if (error.response) {
        return { 
          error: 'Target API error', 
          statusCode: error.response.status, 
          message: error.response.data 
        };
      }
      
      return { error: 'Failed to fetch data: ' + error.message };
    }
  }
}
