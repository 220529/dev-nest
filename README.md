# Dev Nest

简洁的Excel数据处理和ERP接口转发服务，基于NestJS构建。

## 🚀 功能特点

- **Excel解析**: 支持`.xlsx`、`.xls`、`.csv`格式
- **数据映射**: 自动映射Excel列名到数据库字段
- **批量处理**: 自动分批调用ERP接口，避免超时
- **测试模式**: 可限制处理数据条数，便于验证
- **转发服务**: 兼容原有ERP接口调用方式
- **简洁设计**: 专注核心功能，避免过度设计

## 📋 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动服务
```bash
pnpm start:dev
```

### 访问应用
- 🌐 服务地址: http://localhost:9001
- 📊 上传页面: http://localhost:9001/upload
- 📚 API文档: http://localhost:9001/api

## 🔧 配置说明

### ERP环境配置
编辑 `src/modules/erp/erp.config.ts`:

```typescript
// 切换环境: 'dev' | 'prod'
const CURRENT_ENV = 'prod';

// 更新对应环境的JWT token
const prodConfig = {
  baseUrl: 'https://erp.tone.top',
  authorization: 'Bearer YOUR_JWT_TOKEN'
};
```

### 数据映射配置
编辑 `src/schemas/materials.mapping.ts`:

```typescript
export const fieldMapping = {
  '产品编码': 'number',
  '产品名称': 'name',
  '采购价': 'purchasePrice',
  // ...更多映射
};
```

## 📁 项目结构

```
src/
├── modules/
│   ├── excel/          # Excel处理模块
│   └── erp/            # ERP接口模块
├── schemas/            # 数据映射配置
├── common/             # 公共组件
└── main.ts             # 应用入口
```

## 🔄 API接口

### Excel处理
- `POST /api/excel/parse` - 解析Excel文件
- `POST /api/excel/runflow` - 处理解析后的数据
- `GET /api/excel/mappings` - 获取映射配置

### ERP转发
- `POST /api/runFlow` - 兼容原有接口的转发服务

## 🎯 设计原则

1. **简洁**: 专注核心功能，避免过度抽象
2. **实用**: 解决实际业务问题，不追求技术炫技
3. **鲁棒**: 处理边界情况，提供友好错误信息
4. **易维护**: 清晰的代码结构，充分的注释说明

## 📝 使用示例

### 1. 上传Excel文件
访问 http://localhost:9001/upload，选择Excel文件并设置参数。

### 2. 批量处理
系统自动将数据分批（默认200条/批）调用ERP接口。

### 3. 测试模式
开启测试模式可限制处理条数，便于验证数据映射效果。

## 🛠️ 开发说明

- **Node.js**: >= 16
- **包管理器**: pnpm
- **框架**: NestJS 10
- **数据处理**: xlsx
- **HTTP客户端**: axios

## 📄 许可证

MIT