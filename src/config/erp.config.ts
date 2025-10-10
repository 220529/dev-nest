import { getAuthConfig } from './auth.config';

// 获取当前环境的认证配置
const authConfig = getAuthConfig();

export const erpConfig = {
  baseUrl: authConfig.baseUrl,
  authorization: authConfig.authorization,
  runFlowPath: '/api/runFlow',
  openRunFlowPath: '/api/open/runFlow',
  timeout: 100000, // 单次API调用超时(100秒)
  appVersion: 'v1.1.96'
};
