/**
 * RunFlow 配置文件
 */

export interface ActionConfig {
  flowId: string;
  action: string;
  name: string;
}

export const actionConfigs: ActionConfig[] = [
  {
    flowId: 'z244yolix5cg9meb',
    action: 'query_order_record',
    name: '客户需求记录表'
  },
  {
    flowId: 'z244yolix5cg9meb',
    action: 'clear_order_record',
    name: '清空复测数据'
  },
];

