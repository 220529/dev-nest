# Dev Nest

ERP 接口转发服务，基于 NestJS 构建。用于在 VSCode 中通过 RunOnSave 插件自动转发请求到 ERP 系统。

## 🚀 功能特点

- **智能转发**: 根据请求参数自动选择目标 API（内部接口/开放接口）
- **文件读取**: 支持从文件路径读取数据并转发
- **日志记录**: 完整的请求和响应日志
- **错误处理**: 统一的错误处理和响应格式
- **环境配置**: 支持多环境配置（开发/生产）

## 📋 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量

**三层配置结构**：
- `.env` - 基础共用配置（已提交）
- `.env.dev` - 开发环境敏感配置（需创建）  
- `.env.prod` - 生产环境敏感配置（需创建）

**基础配置**（`.env`，已存在）:
```bash
ERP_RUN_FLOW_PATH=/api/runFlow
ERP_OPEN_RUN_FLOW_PATH=/api/open/runFlow
ERP_TIMEOUT=100000
PORT=9009
```

**创建开发环境配置**（`.env.dev`）:
```bash
NODE_ENV=development
ERP_BASE_URL=https://erp.tintan.net
ERP_AUTHORIZATION=Bearer your_jwt_token_here
ERP_APP_VERSION=v1.1.97
```

**创建生产环境配置**（`.env.prod`）:
```bash
NODE_ENV=production
ERP_BASE_URL=https://erp.tone.top
ERP_AUTHORIZATION=Bearer your_prod_jwt_token_here
ERP_APP_VERSION=v1.1.97
```

### 3. 启动服务

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm prod
```

### 4. 验证服务
- 🌐 服务地址: http://localhost:9009
- 📚 API 文档: http://localhost:9009/api

## 🔧 VSCode RunOnSave 配置

在你的项目中配置 `.vscode/settings.json`，实现保存文件时自动转发到 ERP：

### macOS/Linux 配置示例

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "src/codeFlow/.*\\.js$",
        "isAsync": true,
        "cmd": "/Users/kaixin/main/dev-nest/scripts/runOnSave/saveCodeFlow.sh '${file}' '${workspaceFolder}'"
      },
      {
        "match": "src/format/.*\\.js$",
        "isAsync": true,
        "cmd": "/Users/kaixin/main/dev-nest/scripts/runOnSave/saveFormat.sh '${file}' '${workspaceFolder}'"
      },
      {
        "match": "src/jsonToPage/.*\\.json$",
        "isAsync": true,
        "cmd": "/Users/kaixin/main/dev-nest/scripts/runOnSave/saveJsonToPage.sh '${file}' '${workspaceFolder}'"
      }
    ]
  }
}
```

### Windows 配置示例

```json
{
  "emeraldwalk.runonsave": {
    "shell": "D:/instance/Git/bin/bash.exe",
    "commands": [
      {
        "match": "src.*",
        "isAsync": true,
        "cmd": "E:/dev-nest/scripts/runOnSave/runOnSave.sh ./`cygpath -u '${relativeFile}'` ."
      },
      {
        "match": "qaSrc.*",
        "isAsync": true,
        "cmd": "E:/dev-nest/scripts/runOnSave/runOnSave.sh ./`cygpath -u '${relativeFile}'` ."
      },
      {
        "match": "prodSrc.*",
        "isAsync": true,
        "cmd": "E:/dev-nest/scripts/runOnSave/runOnSave.sh ./`cygpath -u '${relativeFile}'` ."
      }
    ]
  }
}
```

**配置说明**：
- `match`: 匹配要监听的文件路径模式
- `isAsync`: 异步执行，不阻塞编辑器
- `cmd`: 执行的脚本命令
- 脚本会自动调用 `http://localhost:9009/api/runFlow` 进行转发

## 🔄 API 接口

### POST /api/runFlow

ERP 转发服务的核心接口，根据请求参数自动选择目标 API。

**请求参数**：
```typescript
{
  dataPath?: string;    // 可选：文件路径，读取文件内容作为数据
  hostPre?: string;     // 可选：目标主机前缀
  host?: string;        // 可选：目标主机
  [key: string]: any;   // 其他业务参数
}
```

**转发逻辑**：
1. 如果包含 `dataPath`：读取文件内容，转发到开放接口
2. 如果包含 `hostPre`：转发到指定主机的开放接口
3. 否则：转发到内部 RunFlow API

**响应格式**：
```typescript
// 成功
{
  // ERP 返回的数据
}

// 失败
{
  error: string;
  statusCode?: number;
  message?: any;
}
```

## 📁 项目结构

```
dev-nest/
├── src/
│   ├── modules/
│   │   └── erp/              # ERP 转发模块
│   │       ├── erp.config.ts    # 环境配置
│   │       ├── erp.service.ts   # 转发服务
│   │       ├── erp.controller.ts # 控制器
│   │       └── erp.module.ts    # 模块定义
│   ├── common/               # 公共组件（拦截器等）
│   ├── app.module.ts         # 应用模块
│   └── main.ts               # 应用入口
├── scripts/
│   └── runOnSave/            # RunOnSave 脚本
├── .env                      # 基础配置
├── .env.dev                  # 开发环境配置（需创建）
├── .env.prod                 # 生产环境配置（需创建）
└── package.json
```

## 🎯 使用场景

### 场景 1：保存文件自动同步到 ERP

1. 在 t1-code 项目中编辑 codeFlow/format/jsonToPage 文件
2. 保存文件（Ctrl+S / Cmd+S）
3. RunOnSave 插件自动触发脚本
4. 脚本调用 dev-nest 的 `/api/runFlow` 接口
5. dev-nest 转发请求到 ERP 系统
6. ERP 系统更新数据

### 场景 2：直接调用转发接口

```bash
# 调用内部接口
curl -X POST http://localhost:9009/api/runFlow \
  -H "Content-Type: application/json" \
  -d '{"flowId": "123", "action": "test"}'

# 调用开放接口
curl -X POST http://localhost:9009/api/runFlow \
  -H "Content-Type: application/json" \
  -d '{"hostPre": "https://erp.tintan.net", "host": "erp.tintan.net", "data": "test"}'

# 从文件读取数据
curl -X POST http://localhost:9009/api/runFlow \
  -H "Content-Type: application/json" \
  -d '{"dataPath": "/path/to/data.json", "hostPre": "https://erp.tintan.net", "host": "erp.tintan.net"}'
```

## 🛠️ 开发说明

- **Node.js**: >= 16
- **包管理器**: pnpm
- **框架**: NestJS 11
- **HTTP 客户端**: @nestjs/axios + axios
- **API 文档**: Swagger

## 📝 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| NODE_ENV | 运行环境 | development / production |
| PORT | 服务端口 | 9009 |
| ERP_BASE_URL | ERP 基础 URL | https://erp.tintan.net |
| ERP_AUTHORIZATION | 认证令牌 | Bearer eyJhbGc... |
| ERP_APP_VERSION | 应用版本 | v1.1.97 |
| ERP_RUN_FLOW_PATH | 内部接口路径 | /api/runFlow |
| ERP_OPEN_RUN_FLOW_PATH | 开放接口路径 | /api/open/runFlow |
| ERP_TIMEOUT | 请求超时时间（毫秒） | 100000 |

## 🔍 日志说明

服务会记录详细的请求和响应日志：

```
🚀 应用启动成功
🌍 环境: DEVELOPMENT
🔗 ERP: https://erp.tintan.net
📊 服务: http://localhost:9009
🔐 认证: ✅ 已配置

[ErpService] 调用runFlow接口
[ErpService] ERP API调用成功: {...}
[ErpService] 调用成功
```

## 📄 许可证

MIT
