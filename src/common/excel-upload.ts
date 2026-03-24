import { BadRequestException } from '@nestjs/common';

export const EXCEL_FILE_DESCRIPTION = 'Excel 文件，支持 xlsx/xls/csv';

export function buildExcelFileInterceptorOptions() {
  return {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_request, file, callback) => {
      const isExcelFile =
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        /\.(xlsx|xls|csv)$/i.test(file.originalname);

      if (!isExcelFile) {
        return callback(
          new BadRequestException('仅支持上传 Excel 文件'),
          false,
        );
      }

      callback(null, true);
    },
  };
}
