# ERP 服务模块

专门处理与ERP系统交互的服务模块，支持批量数据处理和API调用。

## 功能特性

- ✅ **统一的API调用**: 封装了与ERP系统的HTTP通信
- ✅ **批量数据处理**: 支持大数据量分批处理，避免超时
- ✅ **重试机制**: 内置重试逻辑，提高成功率
- ✅ **错误处理**: 完善的错误处理和日志记录
- ✅ **灵活配置**: 支持批次大小、超时时间等参数配置

## 使用方法

### 1. 基本设置

在你的模块中导入 `ErpModule`:

```typescript
import { Module } from '@nestjs/common';
import { ErpModule } from '../erp';

@Module({
  imports: [ErpModule],
  // ...
})
export class YourModule {}
```

### 2. 注入服务

在你的服务中注入 `ErpService`:

```typescript
import { Injectable } from '@nestjs/common';
import { ErpService } from '../erp';

@Injectable()
export class YourService {
  constructor(private readonly erpService: ErpService) {}
}
```

### 3. 调用单个API

```typescript
// 调用单个runFlow接口
const result = await this.erpService.callRunFlow({
  flowId: 'your_flow_id',
  action: 'your_action',
  data: yourData
});
```

### 4. 批量数据处理

```typescript
// 批量处理大量数据
const result = await this.erpService.processBatchData(
  dataArray,           // 要处理的数据数组
  {                   // API固定参数
    flowId: 'your_flow_id',
    action: 'your_action'
  },
  {                   // 批处理选项
    batchSize: 200,   // 每批处理200条数据
    maxRetries: 3,    // 最大重试3次
    retryDelay: 1000  // 重试间隔1秒
  }
);

console.log(result.success);      // 是否全部成功
console.log(result.successCount); // 成功处理的数据量
console.log(result.errorCount);   // 失败的数据量
```

### 5. 开放接口调用

```typescript
// 调用开放接口（用于数据转发）
const result = await this.erpService.callOpenRunFlow({
  hostPre: 'https://your-host.com',
  host: 'your-host.com',
  dataPath: '/path/to/data.json',
  // ... 其他参数
});
```

### 6. 健康检查

```typescript
// 检查ERP连接状态
const health = await this.erpService.healthCheck();
console.log(health.status);  // 'healthy' 或 'unhealthy'
console.log(health.message); // 详细信息
```

## 配置说明

### 环境配置

编辑 `src/config/auth.config.ts` 来配置不同环境:

```typescript
// 切换环境
const CURRENT_ENV = 'dev'; // 'dev' | 'prod'

// 开发环境
const devConfig = {
  baseUrl: 'https://erp.tintan.net',
  authorization: 'Bearer your_dev_token_here'
};

// 生产环境
const prodConfig = {
  baseUrl: 'https://erp.tone.top',
  authorization: 'Bearer your_prod_token_here'
};
```

### API配置

其他配置项在 `src/config/erp.config.ts` 中:

```typescript
export const erpConfig = {
  baseUrl: authConfig.baseUrl,        // 从环境配置获取
  authorization: authConfig.authorization,  // 从环境配置获取
  runFlowPath: '/api/runFlow',        // runFlow接口路径
  openRunFlowPath: '/api/open/runFlow', // 开放接口路径
  timeout: 100000,                    // 超时时间(100秒)
  appVersion: 'v1.1.91'              // 应用版本
};
```

## 最佳实践

### 1. 批量处理建议

- **小数据量** (< 1000条): 使用 `batchSize: 100`
- **中等数据量** (1000-10000条): 使用 `batchSize: 200` (推荐)
- **大数据量** (> 10000条): 使用 `batchSize: 500-1000`

### 2. 错误处理

```typescript
try {
  const result = await this.erpService.callRunFlow(params);
  // 处理成功结果
} catch (error) {
  // 处理错误
  this.logger.error('ERP调用失败', error.message);
}
```

### 3. 测试模式

对于大量数据，建议先使用小批量测试:

```typescript
// 测试少量数据
const testResult = await this.erpService.processBatchData(
  dataArray.slice(0, 100), // 只处理前100条
  apiParams,
  { batchSize: 50 }
);

if (testResult.success) {
  // 测试成功，处理全部数据
  const fullResult = await this.erpService.processBatchData(
    dataArray,
    apiParams,
    { batchSize: 200 }
  );
}
```

## 使用示例

### Excel数据处理

```typescript
// 已在ExcelService中使用
const result = await this.erpService.processBatchData(
  excelData,
  {
    flowId: 'z244yolix5cg9meb',
    action: 'materials_excel'
  },
  {
    batchSize: dto.batchSize || 200,
    maxRetries: 3,
    retryDelay: 1000
  }
);
```

### 其他业务场景

```typescript
// 用户数据同步
await this.erpService.processBatchData(
  userDataArray,
  { action: 'sync_users' },
  { batchSize: 100 }
);

// 订单数据处理
await this.erpService.processBatchData(
  orderDataArray,
  { action: 'process_orders' },
  { batchSize: 50 }
);

// 库存更新
await this.erpService.callRunFlow({
  action: 'update_inventory',
  data: inventoryData
});
```

## 注意事项

1. **Token管理**: 确保及时更新过期的Authorization token
2. **网络超时**: 对于大批量数据，考虑调整timeout配置
3. **错误监控**: 建议添加错误监控和告警机制
4. **日志记录**: ErpService会自动记录详细的调用日志
