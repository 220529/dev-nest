import { BadGatewayException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { getErpConfig } from '@/modules/erp/erp.config';

@Injectable()
export class RunflowClientService {
  constructor(private readonly httpService: HttpService) {}

  async invoke(payload: Record<string, any>): Promise<any> {
    const erpConfig = getErpConfig();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          erpConfig.baseUrl + erpConfig.runFlowPath,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: erpConfig.authorization,
              'app-version': erpConfig.appVersion,
              Accept: '*/*',
              Connection: 'keep-alive',
            },
            timeout: erpConfig.timeout,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new BadGatewayException({
          message: 'runflow 调用失败',
          statusCode: error.response.status,
          detail: error.response.data,
        });
      }

      throw new BadGatewayException({
        message: 'runflow 调用失败',
        detail: error.message,
      });
    }
  }

  async invokeOpen(params: {
    hostPre: string;
    host?: string;
    payload: Record<string, any>;
  }): Promise<any> {
    const erpConfig = getErpConfig();

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          params.hostPre + erpConfig.openRunFlowPath,
          params.payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: '*/*',
              Host: params.host,
              Connection: 'keep-alive',
            },
            timeout: 30000,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new BadGatewayException({
          message: '开放 runflow 调用失败',
          statusCode: error.response.status,
          detail: error.response.data,
        });
      }

      throw new BadGatewayException({
        message: '开放 runflow 调用失败',
        detail: error.message,
      });
    }
  }
}
