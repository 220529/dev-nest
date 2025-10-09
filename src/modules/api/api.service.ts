import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  async runFlow(params: any) {
    try {
      // 读取数据文件
      const jsData = fs.readFileSync(params.dataPath, 'utf8');
      
      // 构造请求数据
      const data = { ...params, data: jsData };
      
      this.logger.log(`转发请求到: ${data.hostPre}/api/open/runFlow`);
      
      // 发送HTTP请求到目标API
      const response = await axios.post(`${data.hostPre}/api/open/runFlow`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Host': data.host,
          'Connection': 'keep-alive',
        },
        timeout: 30000, // 30秒超时
      });
      
      this.logger.log('转发请求成功');
      return response.data;
      
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
