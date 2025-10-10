import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
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
}
