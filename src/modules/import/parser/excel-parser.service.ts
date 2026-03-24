import { BadRequestException, Injectable } from '@nestjs/common';
import type { Express } from 'express';
import * as XLSX from 'xlsx';
import { ParsedSheet, ParsedWorkbook } from './excel.types';

@Injectable()
export class ExcelParserService {
  parse(file: Express.Multer.File): ParsedWorkbook {
    if (!file) {
      throw new BadRequestException('请上传 Excel 文件');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('上传文件内容为空');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheets: ParsedSheet[] = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const headers = this.extractHeaders(sheet);
        const rows = XLSX.utils
          .sheet_to_json<Record<string, unknown>>(sheet, {
            defval: '',
          })
          .map((values, index) => ({
            rowNo: index + 2,
            values,
          }));

        return {
          sheetName,
          headers,
          rows,
        };
      });

      return {
        fileName: file.originalname,
        sheets,
      };
    } catch {
      throw new BadRequestException('Excel 文件解析失败，请确认文件格式正确');
    }
  }

  private extractHeaders(sheet: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1:A1');
    const headers: string[] = [];

    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: column });
      const cellValue = sheet[cellAddress]?.v;
      headers.push(
        cellValue === undefined || cellValue === null ? '' : String(cellValue),
      );
    }

    return headers;
  }
}
