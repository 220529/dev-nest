import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
