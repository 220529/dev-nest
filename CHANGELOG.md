# 更新日志

## 2025-01-10 - 数字字段默认值修复

### 🐛 修复问题

**问题描述**: Excel解析后的JSON数据中，数字字段(purchasePrice、taxRate、untaxedPurchasePrice)在没有值时显示为`null`

**影响范围**: 所有Excel解析功能

### ✅ 解决方案

修改了数据映射配置中的`convertValue`方法：

**修复前**:
```json
{
  "number": "ABC123",
  "name": "产品名称",
  "purchasePrice": null,
  "taxRate": null,
  "untaxedPurchasePrice": null
}
```

**修复后**:
```json
{
  "number": "ABC123", 
  "name": "产品名称",
  "purchasePrice": 0,
  "taxRate": 0,
  "untaxedPurchasePrice": 0
}
```

### 🔧 技术细节

1. **修改文件**:
   - `src/schemas/materials-mapping.ts`
   - `src/schemas/mapping-loader.ts`

2. **修改逻辑**:
   - 数字字段(intFields, doubleFields)在值为空时返回`0`而不是`null`
   - 字符串字段在值为空时仍然返回`null`
   - 无效数字解析失败时也返回`0`而不是`null`

3. **字段映射**:
   - `taxRate` (税点) - 整数字段 - 空值返回0
   - `purchasePrice` (采购价) - 浮点数字段 - 空值返回0  
   - `untaxedPurchasePrice` (不含税采购价) - 浮点数字段 - 空值返回0

### 🎯 测试方法

1. 上传包含空单元格的Excel文件
2. 查看解析后的JSON数据
3. 确认数字字段显示为`0`而不是`null`

### 📋 影响评估

- ✅ 不影响现有功能
- ✅ 提高数据一致性
- ✅ 方便后续数据处理
- ✅ 符合业务逻辑预期

---

## 其他修复

### 测试模式逻辑优化 (2025-01-10)

修复了测试模式在某些情况下不生效的问题，确保勾选测试模式后始终能正确限制数据处理量。
