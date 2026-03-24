/**
 * ERP 服务配置
 * 使用环境变量管理敏感信息
 *
 * 使用方法:
 * 1. 创建 .env.dev 或 .env.prod 文件
 * 2. 运行对应的 npm 脚本: pnpm dev 或 pnpm prod
 */

const ERP_REQUIRED_KEYS = [
  'ERP_BASE_URL',
  'ERP_AUTHORIZATION',
  'ERP_RUN_FLOW_PATH',
  'ERP_OPEN_RUN_FLOW_PATH',
  'ERP_TIMEOUT',
  'ERP_APP_VERSION',
] as const;

type ErpRequiredKey = (typeof ERP_REQUIRED_KEYS)[number];

const getEnv = (key: ErpRequiredKey): string | undefined => process.env[key];

const getRequiredEnv = (key: ErpRequiredKey): string => {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`环境变量 ${key} 未设置，请在环境文件中配置`);
  }
  return value;
};

export interface ErpConfig {
  baseUrl: string;
  authorization: string;
  runFlowPath: string;
  openRunFlowPath: string;
  timeout: number;
  appVersion: string;
}

export const getErpConfig = (): ErpConfig => ({
  baseUrl: getRequiredEnv('ERP_BASE_URL'),
  authorization: getRequiredEnv('ERP_AUTHORIZATION'),
  runFlowPath: getRequiredEnv('ERP_RUN_FLOW_PATH'),
  openRunFlowPath: getRequiredEnv('ERP_OPEN_RUN_FLOW_PATH'),
  timeout: Number(getRequiredEnv('ERP_TIMEOUT')),
  appVersion: getRequiredEnv('ERP_APP_VERSION'),
});

export const getCurrentEnv = () => process.env.NODE_ENV || 'development';

export const getMissingConfigKeys = (): ErpRequiredKey[] =>
  ERP_REQUIRED_KEYS.filter((key) => !getEnv(key));

export const hasValidConfig = () => getMissingConfigKeys().length === 0;

export const validateConfig = () => {
  getErpConfig();
  return true;
};

export const getConfigSummary = () => {
  const baseUrl = getEnv('ERP_BASE_URL');
  const appVersion = getEnv('ERP_APP_VERSION');
  const authorization = getEnv('ERP_AUTHORIZATION');

  return {
    environment: getCurrentEnv(),
    baseUrl: baseUrl ?? '未配置',
    appVersion: appVersion ?? '未配置',
    hasAuthorization: !!authorization,
    isConfigured: hasValidConfig(),
    missingKeys: getMissingConfigKeys(),
  };
};
