/**
 * 材料表字段映射配置
 * 
 * 验证规则说明:
 * - requiredFields: 必填字段，不能为空(null/undefined/'')
 * - nonZeroFields: 数值字段不能为0，适用于价格等业务字段
 * 
 * 使用示例:
 * - requiredFields: ['number'] + nonZeroFields: ['purchasePrice'] 
 *   → 产品编码必填，采购价不能为0
 * - requiredFields: ['number', 'name'] + nonZeroFields: ['purchasePrice', 'untaxedPurchasePrice']
 *   → 产品编码和名称必填，两个价格字段都不能为0
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
  // 整数字段：需要转换为整数的字段名（如税点使用整数表示百分比）
  intFields: ['taxRate'],
  // 浮点数字段：需要转换为小数的字段名（如价格支持小数点）
  doubleFields: ['purchasePrice', 'untaxedPurchasePrice']
};

// 数据有效性验证规则
export const validationRules = {
  // 必填字段：这些字段不能为空，否则整行数据无效
  requiredFields: ['number'],
  // 数值字段不能为0：这些字段不能为0，否则整行数据无效（空值已转换为0）
  nonZeroFields: ['purchasePrice', 'taxRate', 'untaxedPurchasePrice'],
  // nonZeroFields: ['purchasePrice', 'untaxedPurchasePrice'],
  // 可选：数字字段不能为负数的配置（未来扩展用）
  // nonNegativeFields: ['purchasePrice', 'untaxedPurchasePrice'],
  // 可选：字符串字段最小长度要求（未来扩展用）
  // minLengthFields: { number: 2, name: 1 }
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
    // 检查所有必填字段
    const hasRequiredFields = validationRules.requiredFields.every(fieldName => {
      const value = item[fieldName];
      return value !== null && value !== undefined && value !== '';
    });
    
    // 检查非零字段（价格字段不能为0）
    const hasNonZeroFields = (validationRules.nonZeroFields || []).every(fieldName => {
      const value = item[fieldName];
      return value !== null && value !== undefined && value !== 0 && value !== '';
    });
    
    return hasRequiredFields && hasNonZeroFields;
  });
}

// 获取无效数据的原因（用于调试）
export function getInvalidReason(item: any): string {
  const missingFields = validationRules.requiredFields.filter(fieldName => {
    const value = item[fieldName];
    return value === null || value === undefined || value === '';
  });
  
  const zeroValueFields = (validationRules.nonZeroFields || []).filter(fieldName => {
    const value = item[fieldName];
    return value === null || value === undefined || value === 0 || value === '';
  });
  
  const issues: string[] = [];
  if (missingFields.length > 0) {
    issues.push(`缺少必填字段: ${missingFields.join(', ')}`);
  }
  if (zeroValueFields.length > 0) {
    issues.push(`价格字段不能为0: ${zeroValueFields.join(', ')}`);
  }
  
  return issues.length > 0 ? issues.join('；') : '数据有效';
}

// 可用映射列表
export const availableMappings = ['materials'];
