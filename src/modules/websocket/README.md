# WebSocket 学习指南

## 📖 什么是 WebSocket？

WebSocket 是一种在单个 TCP 连接上进行**全双工通信**的协议。

- **HTTP**: 客户端发请求 → 服务器回应 → 连接关闭（单向）
- **WebSocket**: 建立连接后，客户端和服务器可以**随时互相发送**消息（双向）

## 🚀 快速开始

### 1. 启动服务
```bash
pnpm start:dev
```

### 2. 访问测试页面
打开浏览器访问：`http://localhost:9009/websocket`

### 3. 尝试发送消息
- 在输入框中输入消息
- 点击"发送"按钮
- 查看服务器的回复

## 📁 文件结构

```
src/modules/websocket/
├── websocket.gateway.ts   # WebSocket 服务端逻辑
├── websocket.module.ts    # 模块定义
└── README.md             # 本文件

public/
└── websocket.html        # 测试页面
```

## 🔍 代码解析

### 服务端 (websocket.gateway.ts)

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway {
  
  // 1️⃣ 客户端连接时触发
  handleConnection(client: Socket) {
    // client.id 是客户端的唯一标识
  }

  // 2️⃣ 客户端断开时触发
  handleDisconnect(client: Socket) {
    // 清理资源
  }

  // 3️⃣ 监听特定消息
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string) {
    // 收到客户端发的 'message' 事件
    // 返回值会自动发回客户端
    return { event: 'message', data: '回复内容' };
  }
}
```

### 客户端 (websocket.html)

```javascript
// 1️⃣ 连接服务器
const socket = io('http://localhost:9009');

// 2️⃣ 监听连接成功
socket.on('connect', () => {
  console.log('连接成功');
});

// 3️⃣ 发送消息到服务器
socket.emit('message', '你好');

// 4️⃣ 监听服务器消息
socket.on('message', (data) => {
  console.log('收到:', data);
});
```

## 🎯 学习路径

### 第一步：基础通信（当前）
- ✅ 建立连接
- ✅ 发送/接收消息
- ✅ 断开连接

### 第二步：进阶功能（下一步可以添加）
- [ ] 广播消息给所有客户端
- [ ] 房间功能（分组通信）
- [ ] 私聊功能（点对点）
- [ ] 心跳检测

### 第三步：实际应用
- [ ] 实时进度推送
- [ ] 在线聊天
- [ ] 协同编辑

## 💡 常用场景

### 1. 推送进度（如 RunFlow 进度）
```typescript
// 服务端推送进度
this.server.emit('progress', {
  taskId: '123',
  progress: 50,
  message: '处理中...'
});
```

### 2. 广播消息
```typescript
// 发给所有客户端
this.server.emit('notification', '系统通知');
```

### 3. 发给特定客户端
```typescript
// 只发给某个客户端
client.emit('private', '私密消息');
```

## 🔧 调试技巧

### 查看日志
服务端会打印：
```
[WebSocket] 客户端连接: xxx
[WebSocket] 收到消息: hello
[WebSocket] 客户端断开: xxx
```

### 浏览器控制台
打开 F12，查看：
```javascript
console.log(socket.connected);  // 连接状态
console.log(socket.id);         // 客户端ID
```

## 📚 下一步学习

想添加更多功能？修改 `websocket.gateway.ts`：

```typescript
// 添加新的消息处理
@SubscribeMessage('你的事件名')
handleCustom(@MessageBody() data: any) {
  // 处理逻辑
  return { event: '回复事件名', data: '...' };
}
```

## 🤔 常见问题

**Q: 为什么连接不上？**
A: 检查服务是否启动，端口是否正确（默认9009）

**Q: 如何查看所有连接的客户端？**
A: 可以在 gateway 中添加一个 Map 来跟踪

**Q: WebSocket vs HTTP 轮询？**
A: WebSocket 更高效，实时性更好，适合需要频繁通信的场景

