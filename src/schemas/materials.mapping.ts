/**
 * 材料表字段映射配置
 * 简单直接的配置对象
 */

// Excel列名到数据库字段的映射
export const fieldMapping = {
  '产品编码': 'number',
  '产品名称': 'name',
  '采购价': 'purchasePrice',
  '税点': 'taxRate',
  '不含税采购价': 'untaxedPurchasePrice',
};

// 数据类型转换规则
export const typeConversion = {
  intFields: ['taxRate'],
  doubleFields: ['purchasePrice', 'untaxedPurchasePrice']
};

// 数据转换函数
export function convertValue(value: any, fieldName: string): any {
  const { intFields, doubleFields } = typeConversion;
  
  // 处理数字字段
  if (intFields.includes(fieldName) || doubleFields.includes(fieldName)) {
    if (value === null || value === undefined || value === '') {
      return 0; // 空值返回0
    }
    const num = intFields.includes(fieldName) ? parseInt(value) : parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  // 处理字符串字段
  return (value === null || value === undefined || value === '') ? null : String(value);
}

// 数据过滤函数
export function filterData(mappedData: any[]): any[] {
  return mappedData.filter(item => {
    // 必须有产品编码
    return item.number && item.number !== '' && item.number !== null;
  });
}

// 可用映射列表
export const availableMappings = ['materials'];
