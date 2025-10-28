import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { erpConfig } from './erp.config';

export interface ErpApiParams {
  flowId?: string;
  action?: string;
  data?: any;
  [key: string]: any;
}

export interface BatchProcessOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface BatchProcessResult {
  success: boolean;
  totalCount: number;
  successCount: number;
  errorCount: number;
  batchCount: number;
  results: any[];
}

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * 调用ERP runFlow接口的通用方法
   * @param params API参数
   * @returns API响应结果
   */
  async callRunFlow(params: ErpApiParams): Promise<any> {
    const apiUrl = erpConfig.baseUrl + erpConfig.runFlowPath;
    
    try {
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
      
      // 打印API调用成功的返回结果
      this.logger.log(`ERP API调用成功: ${JSON.stringify(response.data)}`);
      return response.data;
      
    } catch (error) {
      // 拦截器已处理日志，这里只抛出错误
      throw error;
    }
  }

  /**
   * 分批处理数据，调用ERP API
   * @param dataArray 要处理的数据数组
   * @param apiParams API固定参数（如flowId, action等）
   * @param options 批处理选项
   * @returns 处理结果
   */
  async processBatchData(
    dataArray: any[],
    apiParams: ErpApiParams,
    options: BatchProcessOptions = {}
  ): Promise<BatchProcessResult> {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('数据数组不能为空');
    }

    const {
      batchSize = 200,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    const totalCount = dataArray.length;
    const batchCount = Math.ceil(totalCount / batchSize);
    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    this.logger.log(`开始批量处理: 总数据${totalCount}条，分${batchCount}批，每批${batchSize}条`);

    for (let i = 0; i < batchCount; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalCount);
      const batchData = dataArray.slice(startIndex, endIndex);
      const currentBatch = i + 1;
      
      this.logger.log(`处理第${currentBatch}/${batchCount}批，数据量: ${batchData.length}条`);

      const batchResult = await this.processSingleBatch(
        batchData, 
        apiParams, 
        currentBatch, 
        batchCount, 
        maxRetries, 
        retryDelay
      );

      results.push(batchResult);

      if (batchResult.success) {
        successCount += batchData.length;
        this.logger.log(`第${currentBatch}批处理成功`);
      } else {
        errorCount += batchData.length;
        this.logger.error(`第${currentBatch}批处理失败: ${batchResult.error}`);
      }

      // 批次间延迟，避免请求过于频繁
      if (i < batchCount - 1 && retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    this.logger.log(`批量处理完成: 成功${successCount}条，失败${errorCount}条`);

    const finalResult = {
      success: errorCount === 0,
      totalCount,
      successCount,
      errorCount,
      batchCount,
      results
    };

    // 打印批量处理的最终结果
    this.logger.log(`批量处理最终结果: ${JSON.stringify({
      success: finalResult.success,
      totalCount: finalResult.totalCount,
      successCount: finalResult.successCount,
      errorCount: finalResult.errorCount,
      batchCount: finalResult.batchCount,
      message: `批量处理完成: 成功${successCount}条，失败${errorCount}条，共${batchCount}批`
    })}`);

    return finalResult;
  }

  /**
   * 处理单个批次（带重试机制）
   */
  private async processSingleBatch(
    batchData: any[],
    apiParams: ErpApiParams,
    currentBatch: number,
    totalBatches: number,
    maxRetries: number,
    retryDelay: number
  ): Promise<any> {
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        // 构造批次请求参数
        const params = {
          ...apiParams,
          data: batchData,
          batchInfo: {
            current: currentBatch,
            total: totalBatches,
            size: batchData.length
          }
        };

        const result = await this.callRunFlow(params);
        
        // 打印单批次处理结果
        this.logger.log(`第${currentBatch}批处理结果: ${JSON.stringify({
          success: true,
          dataCount: batchData.length,
          result: result
        })}`);
        
        return {
          batchIndex: currentBatch,
          dataCount: batchData.length,
          success: true,
          result: result
        };
        
      } catch (error) {
        retryCount++;
        
        if (retryCount <= maxRetries) {
          this.logger.warn(`第${currentBatch}批处理失败，准备重试 (${retryCount}/${maxRetries}): ${error.message}`);
          // 等待后重试
          if (retryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        } else {
          // 最终失败
          return {
            batchIndex: currentBatch,
            dataCount: batchData.length,
            success: false,
            error: error.message
          };
        }
      }
    }
  }

  /**
   * 调用开放接口（用于数据转发等场景）
   * @param params 包含dataPath等参数
   */
  async callOpenRunFlow(params: any): Promise<any> {
    const apiUrl = params.hostPre + erpConfig.openRunFlowPath;
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, params, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Host': params.host,
            'Connection': 'keep-alive',
          },
          timeout: 30000, // 开放接口使用较短超时
        })
      );
      
      // 打印开放API调用成功的返回结果  
      this.logger.log(`开放API调用成功: ${JSON.stringify(response.data)}`);
      return response.data;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * 转发服务 - 处理原始runFlow请求转发
   * @param params 包含dataPath等参数的请求体
   * @returns 转发结果
   */
  async forwardRunFlow(params: any): Promise<any> {
    try {
      // 如果有dataPath，从文件读取数据（兼容旧逻辑）
      if (params.dataPath) {
        const fs = require('fs');
        const jsData = fs.readFileSync(params.dataPath, 'utf8');
        const data = { ...params, data: jsData };
        
        this.logger.log(`转发请求到: ${data.hostPre}/api/open/runFlow`);
        const result = await this.callOpenRunFlow(data);
        this.logger.log(`转发请求成功: ${JSON.stringify(result)}`);
        
        return result;
      }
      
      // 如果有hostPre，使用开放接口
      if (params.hostPre) {
        this.logger.log(`转发请求到: ${params.hostPre}/api/open/runFlow`);
        const result = await this.callOpenRunFlow(params);
        this.logger.log(`转发请求成功: ${JSON.stringify(result)}`);
        
        return result;
      }
      
      // 否则直接调用内部runFlow接口
      this.logger.log(`调用runFlow接口: ${JSON.stringify(params)}`);
      const result = await this.callRunFlow(params);
      this.logger.log(`调用成功: ${JSON.stringify(result)}`);
      
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

  /**
   * 健康检查 - 测试ERP连接
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      // 可以调用一个简单的API来测试连接
      const result = await this.callRunFlow({
        action: 'healthCheck'
      });
      
      return {
        status: 'healthy',
        message: 'ERP连接正常'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `ERP连接失败: ${error.message}`
      };
    }
  }
}
