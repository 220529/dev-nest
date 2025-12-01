import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Excel数据处理和ERP接口转发服务';
  }

  @Get('upload')
  async getUploadPage(@Res() res: Response) {
    const uploadPath = path.join(process.cwd(), 'public', 'upload.html');

    if (fs.existsSync(uploadPath)) {
      const html = fs.readFileSync(uploadPath, 'utf8');
      res.type('html').send(html);
    } else {
      res.status(404).send('Upload page not found');
    }
  }

  @Get('runflow')
  async getRunFlowPage(@Res() res: Response) {
    const runflowPath = path.join(process.cwd(), 'public', 'runflow.html');

    if (fs.existsSync(runflowPath)) {
      const html = fs.readFileSync(runflowPath, 'utf8');
      res.type('html').send(html);
    } else {
      res.status(404).send('RunFlow page not found');
    }
  }

  @Get('websocket')
  async getWebsocketPage(@Res() res: Response) {
    const websocketPath = path.join(process.cwd(), 'public', 'websocket.html');

    if (fs.existsSync(websocketPath)) {
      const html = fs.readFileSync(websocketPath, 'utf8');
      res.type('html').send(html);
    } else {
      res.status(404).send('WebSocket page not found');
    }
  }

  @Get('wx-create-customer-chat')
  async getWxCreateCustomerChatPage(@Res() res: Response) {
    const chatPath = path.join(
      process.cwd(),
      'public',
      'wx-create-customer-chat.html',
    );

    if (fs.existsSync(chatPath)) {
      const html = fs.readFileSync(chatPath, 'utf8');
      res.type('html').send(html);
    } else {
      res.status(404).send('Wx Create Customer Chat page not found');
    }
  }

  // 企微域名校验文件路由（必须在根目录可访问）
  // 使用参数路由匹配 WW_verify_ 开头的文件
  @Get('WW_verify_:fileId')
  async getWxVerifyFile(@Req() req: Request, @Res() res: Response) {
    // 从请求路径中提取完整文件名（去掉开头的 /）
    const urlPath = req.url || '';
    const fileName = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

    // 验证文件名格式（必须以 WW_verify_ 开头，以 .txt 结尾）
    if (!fileName.startsWith('WW_verify_') || !fileName.endsWith('.txt')) {
      return res.status(404).send('File not found');
    }

    const verifyFilePath = path.join(process.cwd(), 'public', fileName);

    if (fs.existsSync(verifyFilePath)) {
      const content = fs.readFileSync(verifyFilePath, 'utf8').trim(); // 去除首尾空白

      // 设置正确的响应头（企微校验要求）
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // 直接返回文件内容（不添加任何额外内容）
      res.status(200).send(content);
    } else {
      res.status(404).send('Verification file not found');
    }
  }
}
