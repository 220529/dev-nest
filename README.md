# Dev Nest - NestJS 中转服务

简单的中转服务API，提供基于 Swagger 的 API 文档。

## 功能特点

- ✅ **模块化架构**: 使用 NestJS 模块系统组织代码
- ✅ **路径别名**: 支持 `@/` 前缀的路径别名导入
- ✅ **Swagger 文档**: 自动生成 API 文档
- ✅ **中转服务**: 实现 runFlow 数据转发功能

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
npm run start:dev
```

### 访问应用
- 应用地址: http://localhost:9001
- Swagger UI: http://localhost:9001/api

## 项目结构

```
src/
├── modules/           # 功能模块
│   ├── api/          # API模块
│   │   ├── api.controller.ts
│   │   ├── api.service.ts
│   │   ├── api.module.ts
│   │   └── index.ts
│   └── index.ts
├── app.controller.ts  # 主控制器
├── app.service.ts     # 主服务
├── app.module.ts      # 主模块
└── main.ts           # 应用入口
```

## 路径别名配置

项目支持以下路径别名:
- `@/*` → `src/*`
- `@/modules/*` → `src/modules/*`
- `@/common/*` → `src/common/*`
- `@/config/*` → `src/config/*`

## API 接口

### POST /api/runFlow
中转服务接口，读取文件数据并转发到目标API。

**请求参数:**
```json
{
  "dataPath": "文件路径",
  "hostPre": "目标主机前缀",
  "host": "目标主机"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": "目标API返回的数据"
}
```

## 开发命令

```bash
# 开发模式
npm run start:dev

# 构建
npm run build

# 生产模式
npm run start:prod

# 测试
npm run test

# 代码格式化
npm run format

# 代码检查
npm run lint
```