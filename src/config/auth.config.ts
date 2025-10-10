/**
 * 授权配置文件
 * 
 * 使用方法：
 * 1. 复制这个文件到你的本地
 * 2. 将token粘贴到对应环境的配置中
 * 3. 根据需要切换环境
 */

// 当前使用的环境 - 手动切换
const CURRENT_ENV = 'prod'; // 'dev' | 'prod'

// 开发环境配置
const devConfig = {
  baseUrl: 'https://erp.tintan.net',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTI5MSwibmFtZSI6IuWImOWHr-asoyIsIm1vYmlsZSI6ImxreCIsImlzQWN0aXZlIjp0cnVlLCJzdXBwbGllcklkIjpudWxsLCJjb21wYW55SWQiOjAsImRlcGFydG1lbnRJZCI6IjAiLCJyb2xlcyI6IjEiLCJjdXJSb2xlIjoxLCJ3eHVzZXJpZCI6IiIsImF1dG9Mb2dpbiI6ZmFsc2UsInBvc2l0aW9uIjoiIiwicHdkVmVyc2lvbiI6MiwibG9naW5SZXF1ZXN0SWQiOiIxNzhjOWNkZC1hOWU3LTRlMjctYjNkNi0wY2Q2MGMxM2I3YzUiLCJpYXQiOjE3NTk5ODYxNDksImV4cCI6MTc2MDU5MDk0OX0.P-aBVAmUiPE4u3oQivN3Y-nDVv8-js7NFi4AIjp8NFA'
};

// 生产环境配置
const prodConfig = {
  baseUrl: 'https://erp.tone.top',
  authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDYzMCwibmFtZSI6IuWImOWHr-asoyIsIm1vYmlsZSI6ImxreCIsImlzQWN0aXZlIjp0cnVlLCJzdXBwbGllcklkIjpudWxsLCJjb21wYW55SWQiOjAsImRlcGFydG1lbnRJZCI6IjAiLCJyb2xlcyI6IjEiLCJjdXJSb2xlIjoxLCJ3eHVzZXJpZCI6bnVsbCwiYXV0b0xvZ2luIjpmYWxzZSwicG9zaXRpb24iOiIiLCJwd2RWZXJzaW9uIjoyLCJsb2dpblRva2VuVHlwZSI6Ind4IiwibG9naW5SZXF1ZXN0SWQiOiJhOTE2MzlhOS0yNTFmLTRkOGEtYjA5Mi03M2IxZWU1YmEzZTkiLCJpYXQiOjE3NjAwNjAzODcsImV4cCI6MTc2MDY2NTE4N30.2o4Lr7Txmut9VajY8iADht7mk3gWEVdE0-X4P-5IQ_o'
};

// 环境配置映射
const envConfigs = {
  dev: devConfig,
  prod: prodConfig
};

// 导出当前环境的授权配置
export const getAuthConfig = () => {
  const config = envConfigs[CURRENT_ENV];
  if (!config) {
    throw new Error(`未知的环境配置: ${CURRENT_ENV}`);
  }
  return config;
};

// 导出当前环境名称
export const getCurrentEnv = () => CURRENT_ENV;
