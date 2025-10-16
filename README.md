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
- 🌐 服务地址: http://localhost:9009
- 📊 上传页面: http://localhost:9009/upload
- 📚 API文档: http://localhost:9009/api

## 🔧 配置说明

### 环境变量配置

**三层配置结构**：
- `.env` - 基础共用配置（已提交）
- `.env.dev` - 开发环境敏感配置（需创建）  
- `.env.prod` - 生产环境敏感配置（需创建）

1. **基础配置**（`.env`，已存在）:
```bash
ERP_RUN_FLOW_PATH=/api/runFlow
ERP_OPEN_RUN_FLOW_PATH=/api/open/runFlow
ERP_TIMEOUT=100000
ERP_APP_VERSION=v1.1.96
PORT=9009
```

2. **创建环境配置**：
```bash
# .env.dev (开发环境)
NODE_ENV=development
ERP_BASE_URL=https://your-dev-erp.example.com
ERP_AUTHORIZATION=Bearer your_dev_jwt_token

# .env.prod (生产环境)  
NODE_ENV=production
ERP_BASE_URL=https://your-prod-erp.example.com
ERP_AUTHORIZATION=Bearer your_prod_jwt_token
```

### 运行命令
```bash
# 开发环境
pnpm dev

# 生产环境
pnpm prod
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
访问 http://localhost:9009/upload，选择Excel文件并设置参数。

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