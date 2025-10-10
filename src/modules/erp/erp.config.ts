/**
 * ERP服务配置
 * 使用环境变量管理敏感信息
 * 
 * 使用方法:
 * 1. 创建 .env.dev 或 .env.prod 文件
 * 2. 运行对应的npm脚本: pnpm dev 或 pnpm prod
 */

// 获取必需的环境变量，无默认值
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`环境变量 ${key} 未设置，请在环境文件中配置`);
  }
  return value;
};

// ERP服务配置 - 完全从环境变量读取，无默认值
export const erpConfig = {
  baseUrl: getRequiredEnv('ERP_BASE_URL'),
  authorization: getRequiredEnv('ERP_AUTHORIZATION'),
  runFlowPath: getRequiredEnv('ERP_RUN_FLOW_PATH'),
  openRunFlowPath: getRequiredEnv('ERP_OPEN_RUN_FLOW_PATH'),
  timeout: Number(getRequiredEnv('ERP_TIMEOUT')),
  appVersion: getRequiredEnv('ERP_APP_VERSION')
};

// 导出当前环境信息
export const getCurrentEnv = () => process.env.NODE_ENV || 'development';

// 验证配置（在模块加载时自动验证）
export const validateConfig = () => {
  // 配置在导出时已经通过 getRequiredEnv 验证
  // 此函数保持兼容性，实际验证在 erpConfig 初始化时完成
  return true;
};

// 显示当前配置（隐藏敏感信息）
export const getConfigSummary = () => ({
  environment: getCurrentEnv(),
  baseUrl: erpConfig.baseUrl,
  appVersion: erpConfig.appVersion,
  hasAuthorization: !!erpConfig.authorization
});