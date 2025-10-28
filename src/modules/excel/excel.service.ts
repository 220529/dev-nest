import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs-extra';
import * as path from 'path';
import { RunFlowDto, ExcelParseResult, BatchProcessResult } from './dto/excel.dto';
import * as materialsMapping from '../../schemas/materials.mapping';
import { ErpService } from '../erp/erp.service';
import { actionConfigs } from '../../config/runflow.config';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private readonly erpService: ErpService) {}

  /**
   * 解析Excel文件
   */
  async parseExcel(
    file: Express.Multer.File,
    options: { mappingType?: string; sheetName?: string; sheetIndex?: number } = {}
  ): Promise<ExcelParseResult> {
    const { mappingType = 'materials', sheetName, sheetIndex } = options;
    try {
      if (!file) {
        throw new BadRequestException('请上传Excel文件');
      }

      // 解析Excel
      const workbook = XLSX.readFile(file.path);
      
      // 显示所有可用的Sheet
      this.logger.log(`Excel包含 ${workbook.SheetNames.length} 个Sheet: ${JSON.stringify(workbook.SheetNames)}`);
      
      // 选择要读取的Sheet
      let targetSheetName: string;
      if (sheetName) {
        // 通过名称选择
        if (workbook.SheetNames.includes(sheetName)) {
          targetSheetName = sheetName;
        } else {
          throw new BadRequestException(`指定的Sheet "${sheetName}" 不存在。可用的Sheet: ${workbook.SheetNames.join(', ')}`);
        }
      } else if (sheetIndex !== undefined) {
        // 通过索引选择
        if (sheetIndex >= 0 && sheetIndex < workbook.SheetNames.length) {
          targetSheetName = workbook.SheetNames[sheetIndex];
        } else {
          throw new BadRequestException(`Sheet索引 ${sheetIndex} 超出范围。可用索引: 0-${workbook.SheetNames.length - 1}`);
        }
      } else {
        // 默认选择第一个Sheet
        targetSheetName = workbook.SheetNames[0];
      }
      
      this.logger.log(`当前读取Sheet: "${targetSheetName}" (索引: ${workbook.SheetNames.indexOf(targetSheetName)})`);
      
      const worksheet = workbook.Sheets[targetSheetName];
      
      if (!worksheet) {
        throw new BadRequestException('选择的Sheet为空');
      }

      // 转换为JSON数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!jsonData || jsonData.length === 0) {
        throw new BadRequestException('Excel文件没有数据');
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      // 调试：打印Excel列标题
      this.logger.log(`Excel列标题: ${JSON.stringify(headers)}`);
      this.logger.log(`前3行数据预览: ${JSON.stringify(rows.slice(0, 3))}`);

      // 使用指定的映射配置处理数据
      const result = this.processExcelData(headers, rows, mappingType);

      // 确保数据文件夹存在
      const dataDir = path.join(process.cwd(), 'data', 'parsed_json');
      await fs.ensureDir(dataDir);
      
      // 生成唯一的文件名
      const timestamp = Date.now();
      const outputPath = path.join(dataDir, `parsed_excel_data_${timestamp}.json`);
      const invalidPath = path.join(dataDir, `invalid_data_${timestamp}.json`);
      
      // 保存有效数据为JSON文件
      await fs.writeJSON(outputPath, result.validData, { spaces: 2 });
      
      // 保存无效数据为JSON文件（如果有的话）
      let invalidJsonPath: string | undefined = undefined;
      if (result.invalidData.length > 0) {
        await fs.writeJSON(invalidPath, result.invalidData, { spaces: 2 });
        // 只返回文件名，不包含完整路径
        invalidJsonPath = `invalid_data_${timestamp}.json`;
        this.logger.log(`无效数据已保存到: ${invalidPath}`);
      }

      // 清理上传的临时文件
      if (await fs.pathExists(file.path)) {
        await fs.unlink(file.path);
      }

      return {
        success: true,
        data: result.validData,
        total: result.validData.length,
        originalTotal: rows.length,
        invalidTotal: result.invalidData.length,
        filterRate: Math.round((result.invalidData.length / rows.length) * 100),
        jsonPath: outputPath,
        invalidJsonPath: invalidJsonPath,
        mappingType: mappingType,
        message: `成功解析 ${result.validData.length} 条有效数据，${result.invalidData.length} 条无效数据，已保存到 ${outputPath}，使用映射: ${mappingType}`
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
        action: dto.action || 'materials_excel',
        ...dto.params // 合并额外参数
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
   * 获取已解析的JSON文件列表
   */
  async getJsonFiles(): Promise<{ success: boolean; files: any[]; message?: string }> {
    try {
      const dataDir = path.join(process.cwd(), 'data', 'parsed_json');
      
      // 确保目录存在
      if (!await fs.pathExists(dataDir)) {
        return {
          success: true,
          files: [],
          message: '数据目录不存在'
        };
      }

      // 读取目录下的所有文件
      const allFiles = await fs.readdir(dataDir);
      
      // 只筛选出有效的JSON文件（不包含invalid_data开头的文件）
      const jsonFiles = allFiles
        .filter(file => file.startsWith('parsed_excel_data_') && file.endsWith('.json'))
        .sort((a, b) => {
          // 按时间戳降序排列（最新的在前）
          const timestampA = parseInt(a.replace('parsed_excel_data_', '').replace('.json', ''));
          const timestampB = parseInt(b.replace('parsed_excel_data_', '').replace('.json', ''));
          return timestampB - timestampA;
        });

      // 获取文件信息
      const fileDetails = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(dataDir, file);
          const stats = await fs.stat(filePath);
          const timestamp = parseInt(file.replace('parsed_excel_data_', '').replace('.json', ''));
          const date = new Date(timestamp);
          
          // 格式化文件大小
          const formatSize = (bytes: number): string => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
          };

          // 格式化日期
          const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          };

          return {
            name: file,
            path: filePath,
            size: formatSize(stats.size),
            timestamp: timestamp,
            date: formatDate(date)
          };
        })
      );

      return {
        success: true,
        files: fileDetails
      };

    } catch (error) {
      this.logger.error('获取JSON文件列表失败:', error);
      throw new BadRequestException(`获取JSON文件列表失败: ${error.message}`);
    }
  }

  /**
   * 获取RunFlow配置（Action选项）
   */
  getRunFlowConfig(): { success: boolean; actions: any[] } {
    try {
      return {
        success: true,
        actions: actionConfigs
      };
    } catch (error) {
      this.logger.error('获取RunFlow配置失败:', error);
      throw new BadRequestException(`获取RunFlow配置失败: ${error.message}`);
    }
  }

  /**
   * 通用数据处理方法：映射 + 过滤
   */
  private processExcelData(headers: string[], rows: any[][], mappingType: string): { validData: any[], invalidData: any[] } {
    // 目前只支持materials映射
    if (mappingType !== 'materials') {
      throw new BadRequestException(`不支持的映射类型: ${mappingType}`);
    }
    
    // 映射数据
    const rawMappedData = rows.map((row, rowIndex) => {
      const rowData = {};
      headers.forEach((header, colIndex) => {
        const dbField = materialsMapping.fieldMapping[header];
        if (dbField) {
          const rawValue = row[colIndex];
          rowData[dbField] = materialsMapping.convertValue(rawValue, dbField);
        }
      });
      // 添加原始Excel行号（标题行是第1行，数据从第2行开始）
      rowData['_excelRowNumber'] = rowIndex + 2;
      return rowData;
    });

    // 使用配置化的过滤方法，分离有效和无效数据
    const result = materialsMapping.filterData(rawMappedData);
    
    // 记录过滤结果
    if (result.invalidData.length > 0) {
      this.logger.log(`数据过滤完成: ${result.validData.length}条有效数据，${result.invalidData.length}条无效数据`);
    }
    
    return result;
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
