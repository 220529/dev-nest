import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs-extra';
import * as path from 'path';
import { RunFlowDto, ExcelParseResult, BatchProcessResult } from './dto/excel.dto';
import * as materialsMapping from '../../schemas/materials.mapping';
import { ErpService } from '../erp/erp.service';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private readonly erpService: ErpService) {}

  /**
   * 解析Excel文件
   */
  async parseExcel(
    file: Express.Multer.File,
    mappingType: string = 'materials'
  ): Promise<ExcelParseResult> {
    try {
      if (!file) {
        throw new BadRequestException('请上传Excel文件');
      }

      // 解析Excel
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new BadRequestException('Excel文件为空');
      }

      // 转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!jsonData || jsonData.length === 0) {
        throw new BadRequestException('Excel文件没有数据');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      // 使用指定的映射配置处理数据
      const mappedData = this.processExcelData(headers, rows, mappingType);

      // 确保数据文件夹存在
      const dataDir = path.join(process.cwd(), 'data', 'parsed_json');
      await fs.ensureDir(dataDir);
      
      // 生成唯一的文件名
      const timestamp = Date.now();
      const outputPath = path.join(dataDir, `parsed_excel_data_${timestamp}.json`);
      
      // 保存为JSON文件
      await fs.writeJSON(outputPath, mappedData, { spaces: 2 });

      // 清理上传的临时文件
      if (await fs.pathExists(file.path)) {
        await fs.unlink(file.path);
      }

      return {
        success: true,
        data: mappedData,
        total: mappedData.length,
        originalTotal: rows.length,
        filterRate: Math.round((1 - mappedData.length / rows.length) * 100),
        jsonPath: outputPath,
        mappingType: mappingType,
        message: `成功解析 ${mappedData.length} 条数据，已保存到 ${outputPath}，使用映射: ${mappingType}`
      };

    } catch (error) {
      this.logger.error('Excel解析失败:', error);
      throw new BadRequestException(`Excel解析失败: ${error.message}`);
    }
  }

  /**
   * 调用runFlow接口处理解析后的数据
   */
  async callRunFlow(dto: RunFlowDto): Promise<BatchProcessResult> {
    try {
      if (!await fs.pathExists(dto.dataPath)) {
        throw new BadRequestException('数据文件不存在');
      }

      // 读取JSON数据
      let jsonData = await fs.readJSON(dto.dataPath);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new BadRequestException('数据文件为空或格式不正确');
      }

      const originalCount = jsonData.length;
      
      // 处理测试模式，限制数据量
      if (dto.testMode) {
        const limit = dto.testLimit && dto.testLimit > 0 ? dto.testLimit : 1000; // 默认1000条
        jsonData = jsonData.slice(0, limit);
        this.logger.log(`测试模式启用: 原始数据${originalCount}条，限制为${jsonData.length}条`);
      }

      // 构造API参数
      const apiParams = {
        flowId: dto.flowId || 'z244yolix5cg9meb',
        action: dto.action || 'materials_excel'
      };

      const batchSize = dto.batchSize || 200;
      this.logger.log(`准备分批调用runFlow: 总数据${jsonData.length}条，批次大小${batchSize}条`);
      
      // 分批处理数据
      const result = await this.processBatchData(jsonData, batchSize, apiParams);
      
      // 处理完成后清理JSON文件
      if (dto.dataPath.includes('data/parsed_json/parsed_excel_data_')) {
        await fs.unlink(dto.dataPath);
        this.logger.log(`已清理临时文件: ${dto.dataPath}`);
      }
      
      return result;

    } catch (error) {
      this.logger.error('调用runFlow失败:', error);
      throw new BadRequestException(`调用runFlow失败: ${error.message}`);
    }
  }

  /**
   * 获取可用的映射配置列表
   */
  getMappingTypes(): { success: boolean; mappings: string[]; details: any } {
    try {
      const mappingDetails = {
        'materials': {
          displayName: '材料表',
          tableName: 'materials',
          supportedFields: Object.keys(materialsMapping.fieldMapping)
        }
      };
      
      return {
        success: true,
        mappings: materialsMapping.availableMappings,
        details: mappingDetails
      };
    } catch (error) {
      this.logger.error('获取映射配置失败:', error);
      throw new BadRequestException(`获取映射配置失败: ${error.message}`);
    }
  }

  /**
   * 通用数据处理方法：映射 + 过滤
   */
  private processExcelData(headers: string[], rows: any[][], mappingType: string): any[] {
    // 目前只支持materials映射
    if (mappingType !== 'materials') {
      throw new BadRequestException(`不支持的映射类型: ${mappingType}`);
    }
    
    // 映射数据
    const rawMappedData = rows.map((row) => {
      const rowData = {};
      headers.forEach((header, colIndex) => {
        const dbField = materialsMapping.fieldMapping[header];
        if (dbField) {
          const rawValue = row[colIndex];
          rowData[dbField] = materialsMapping.convertValue(rawValue, dbField);
        }
      });
      return rowData;
    });

    // 使用配置化的过滤方法，静静过滤掉无效数据
    const validData = materialsMapping.filterData(rawMappedData);
    
    // 简单记录过滤结果
    if (rawMappedData.length > validData.length) {
      const filteredCount = rawMappedData.length - validData.length;
      this.logger.log(`数据过滤完成: ${validData.length}条有效数据，${filteredCount}条无效数据已过滤`);
    }
    
    return validData;
  }

  /**
   * 分批处理数据 - 使用ErpService
   */
  private async processBatchData(
    jsonData: any[],
    batchSize: number,
    apiParams: any
  ): Promise<BatchProcessResult> {
    const result = await this.erpService.processBatchData(jsonData, apiParams, {
      batchSize,
      maxRetries: 3,
      retryDelay: 1000
    });
    
    return {
      success: result.success,
      totalCount: result.totalCount,
      processedCount: result.successCount,
      errorCount: result.errorCount,
      batchCount: result.batchCount,
      results: result.results,
      message: `批量处理完成: 成功${result.successCount}条，失败${result.errorCount}条，共${result.batchCount}批`
    };
  }

}
