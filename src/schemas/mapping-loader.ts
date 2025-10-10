/**
 * 映射配置加载器
 * 用于管理多种Excel表结构的映射配置
 */

import * as path from 'path';
import * as fs from 'fs';

export interface MappingConfig {
  tableName: string;
  displayName: string;
  fieldMapping: Record<string, string>;
  typeConversion: {
    intFields: string[];
    doubleFields: string[];
  };
  filterRules: {
    requiredFields: string[];
    customFilter?: (item: any) => boolean;
  };
  convertValue(value: any, fieldName: string): any;
  filterData(mappedData: any[]): any[];
}

class MappingLoader {
  private mappings = new Map<string, MappingConfig>();

  constructor() {
    this.loadAllMappings();
  }

  /**
   * 自动加载所有映射配置文件
   */
  private loadAllMappings() {
    const schemaDir = __dirname;
    
    try {
      const files = fs.readdirSync(schemaDir);
      
      files.forEach(file => {
        if (file.endsWith('-mapping.ts') && file !== 'mapping-loader.ts') {
          const mappingName = file.replace('-mapping.ts', '');
          try {
            const mapping = require(path.join(schemaDir, file)).default;
            this.mappings.set(mappingName, mapping);
            console.log(`加载映射配置: ${mappingName}`);
          } catch (error) {
            console.error(`加载映射配置失败: ${file}`, error.message);
          }
        }
      });
    } catch (error) {
      console.error('读取schemas目录失败:', error.message);
    }

    // 如果没有找到任何映射文件，添加默认的materials映射
    if (this.mappings.size === 0) {
      console.log('未找到映射文件，加载默认材料映射配置');
      this.loadDefaultMaterialsMapping();
    }
  }

  /**
   * 加载默认的材料映射配置
   */
  private loadDefaultMaterialsMapping() {
    const defaultMapping: MappingConfig = {
      tableName: 'materials',
      displayName: '材料表',
      fieldMapping: {
        '产品编码': 'number',
        '产品名称': 'name',
        '采购价': 'purchasePrice',
        '税点': 'taxRate',
        '不含税采购价': 'untaxedPurchasePrice',
      },
      typeConversion: {
        intFields: ['taxRate'],
        doubleFields: ['purchasePrice', 'untaxedPurchasePrice']
      },
      filterRules: {
        requiredFields: ['number'],
        customFilter: undefined
      },
      convertValue(value: any, fieldName: string): any {
        const { intFields, doubleFields } = this.typeConversion;
        
        // 处理数字字段
        if (intFields.includes(fieldName)) {
          // 如果值为空，返回0
          if (value === null || value === undefined || value === '') {
            return 0;
          }
          const num = parseInt(value);
          return isNaN(num) ? 0 : num;
        }
        
        if (doubleFields.includes(fieldName)) {
          // 如果值为空，返回0
          if (value === null || value === undefined || value === '') {
            return 0;
          }
          const num = parseFloat(value);
          return isNaN(num) ? 0 : num;
        }
        
        // 处理字符串字段
        if (value === null || value === undefined || value === '') {
          return null;
        }
        
        // 默认返回字符串
        return String(value);
      },
      filterData(mappedData: any[]): any[] {
        return mappedData.filter(item => {
          // 检查必须字段
          for (const field of this.filterRules.requiredFields) {
            if (item[field] === null || item[field] === undefined || item[field] === 0 || item[field] === '') {
              return false;
            }
          }
          
          // 执行自定义过滤函数（如果有）
          if (this.filterRules.customFilter && typeof this.filterRules.customFilter === 'function') {
            return this.filterRules.customFilter(item);
          }
          
          return true;
        });
      }
    };

    this.mappings.set('materials', defaultMapping);
  }

  /**
   * 获取指定的映射配置
   * @param mappingName 映射配置名称
   * @returns 映射配置对象
   */
  getMapping(mappingName: string): MappingConfig {
    if (!this.mappings.has(mappingName)) {
      throw new Error(`未找到映射配置: ${mappingName}`);
    }
    const mapping = this.mappings.get(mappingName);
    if (!mapping) {
      throw new Error(`映射配置为空: ${mappingName}`);
    }
    return mapping;
  }

  /**
   * 获取所有可用的映射配置名称
   * @returns 映射配置名称数组
   */
  getAvailableMappings(): string[] {
    return Array.from(this.mappings.keys());
  }
}

// 单例模式
export default new MappingLoader();
