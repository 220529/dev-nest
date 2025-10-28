import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExcelService } from './excel.service';
import { ParseExcelDto, RunFlowDto } from './dto/excel.dto';

@Controller('api/excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  /**
   * 解析Excel文件
   */
  @Post('parse')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xls|xlsx|csv)$/)) {
          return cb(new BadRequestException('只支持Excel文件格式'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async parseExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ParseExcelDto,
  ) {
    return this.excelService.parseExcel(file, {
      mappingType: dto.mappingType || 'materials',
      sheetName: dto.sheetName,
      sheetIndex: dto.sheetIndex
    });
  }

  /**
   * 调用runFlow接口处理解析后的数据
   */
  @Post('runflow')
  async callRunFlow(@Body() dto: RunFlowDto) {
    return this.excelService.callRunFlow(dto);
  }

  /**
   * 获取可用的映射配置列表
   */
  @Get('mappings')
  async getMappingTypes() {
    return this.excelService.getMappingTypes();
  }

  /**
   * 获取已解析的JSON文件列表
   */
  @Get('json-files')
  async getJsonFiles() {
    return this.excelService.getJsonFiles();
  }

  /**
   * 获取RunFlow配置（FlowId和Action选项）
   */
  @Get('runflow-config')
  async getRunFlowConfig() {
    return this.excelService.getRunFlowConfig();
  }
}

