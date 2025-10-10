/**
 * Materials表字段映射配置
 * 简单直接的映射关系定义
 */

import { MappingConfig } from './mapping-loader';

const materialsMapping: MappingConfig = {
  // 表基本信息
  tableName: 'materials',
  displayName: '材料表',
  
  // Excel列名到数据库字段的映射
  fieldMapping: {
    '产品编码': 'number',
    '产品名称': 'name',
    '采购价': 'purchasePrice',
    '税点': 'taxRate',
    '不含税采购价': 'untaxedPurchasePrice',
  },

  // 数据类型转换规则
  typeConversion: {
    // 整数类型字段
    intFields: ['taxRate'],
    
    // 浮点数类型字段  
    doubleFields: ['purchasePrice', 'untaxedPurchasePrice']
  },

  // 数据过滤规则
  filterRules: {
    // 必须字段（不能为null、undefined、''、0）
    requiredFields: ['number'],
    
    // 自定义过滤函数（可选）
    customFilter: undefined, // 可以是一个函数：(item) => boolean
    
    // 自定义过滤函数示例（取消注释可启用）:
    // customFilter: (item) => {
    //   // 例如：过滤掉采购价格过低的商品
    //   return item.purchasePrice >= 10;
    // }
  },

  // 数据转换函数
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

  // 数据过滤函数
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

export default materialsMapping;
