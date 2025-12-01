/**
 * @flowId 890
 * @flowKey oknfqepwkcohzkfv
 * @flowName 获取企微JS-SDK签名
 * @flowNodeName 函数名称
 * @flowNodeType funEditNode
 * @flowNodeId 1
 * @updateTime 2025-11-12 11:40:20
 */

/**
 * 概述：
 * - 为企微H5页面提供JS-SDK签名，用于调用客户端API（选择客户、创建群聊等）
 * - 签名算法：https://developer.work.weixin.qq.com/document/path/100746
 * - 参考：临时获取微信授权_Ticket.js 和 common.js 的实现方式
 */

try {
  // 入参：url（当前页面完整URL，必填）
  const { url, type, corpid = 'ww8d13fb7282087b07' } = body;

  if (!url) {
    return {
      handleError: '请提供页面URL（url参数）',
    };
  }

  // 处理URL（去掉#及其后面的部分）
  const urlToSign = url.split('#')[0];

  // URL 验证
  if (!urlToSign.startsWith('http://') && !urlToSign.startsWith('https://')) {
    return {
      handleError: `URL格式错误，必须包含协议（http://或https://）。当前URL: ${urlToSign}`,
    };
  }

  // t 参数说明（参考 common.js 的 getJSSDKTicket 方法）：
  // 0 = 企业微信（使用 checkWxTokenV2 和 qyapi.weixin.qq.com）
  // 2 = 企业微信（使用 checkWxTokenV2 和 qyapi.weixin.qq.com）
  // 3 = 微信公众号（使用 checkWxTokenV3 和 api.weixin.qq.com）
  // 4 = 微信公众号（使用 checkWxTokenV4 和 api.weixin.qq.com）
  // 参考：临时获取微信授权_Ticket.js 使用 isWx ? 3 : 0（企业微信用0）
  const t = type !== undefined ? type : 0; // 默认0（企业微信）

  // 使用 service.common.generateJSSDKSignature 方法
  // 该方法已经包含了获取 ticket、生成签名的完整流程
  // 参考：common.js 第992-1005行
  if (
    !ctx.service ||
    !ctx.service.common ||
    !ctx.service.common.generateJSSDKSignature
  ) {
    return {
      handleError:
        'service.common.generateJSSDKSignature 方法不存在，请检查服务配置',
    };
  }

  // 前置检查：如果是企业微信（t=0或2），先检查 checkWxTokenV2 是否可用
  if (
    (t === 0 || t === 2) &&
    ctx.service.user &&
    ctx.service.user.checkWxTokenV2
  ) {
    try {
      const testToken = await ctx.service.user.checkWxTokenV2();
      if (!testToken) {
        return {
          handleError: `checkWxTokenV2() 返回空值，无法获取 access_token

请检查：
- 微信配置是否正确（corpid、secret等）
- 是否有获取 token 的权限
- 如果是第三方应用，可能需要使用不同的 token 获取方式

提示：可以尝试传入 type=3 使用微信公众号的方式，或检查微信服务配置`,
        };
      }
    } catch (e) {
      ctx.logger.warn('检查 checkWxTokenV2 时出错', e);
    }
  }

  // 调用 generateJSSDKSignature，该方法会：
  // 1. 调用 checkJSSDKTicket(t) 获取 ticket（有缓存机制）
  // 2. 生成 noncestr、timestamp
  // 3. 生成签名
  // 4. 返回 { timestamp, nonceStr, signature }
  // 注意：如果 checkWxTokenV2() 返回空值，getJSSDKTicket 会失败，导致 generateJSSDKSignature 返回的 ticket 为 undefined
  let signRes;
  try {
    signRes = await ctx.service.common.generateJSSDKSignature(urlToSign, t);
  } catch (e) {
    ctx.logger.error('调用 generateJSSDKSignature 异常', e);
    return {
      handleError: `调用 generateJSSDKSignature 异常: ${
        e.message || String(e)
      }`,
    };
  }

  if (!signRes) {
    // 可能是 getJSSDKTicket 返回了 undefined（checkWxTokenV2 返回空值）
    return {
      handleError: `generateJSSDKSignature 返回空值

可能的原因：
1. checkWxTokenV2() 返回空值，导致无法获取 access_token
2. 获取 jsapi_ticket 失败

请检查：
- 微信配置是否正确（corpid、secret等）
- 是否有获取 token 的权限
- 如果是第三方应用，可能需要使用不同的 token 获取方式`,
    };
  }

  if (signRes.error) {
    return {
      handleError: `generateJSSDKSignature 失败: ${signRes.error}`,
    };
  }

  if (!signRes.nonceStr || !signRes.timestamp || !signRes.signature) {
    // 如果 signature 为空，可能是 ticket 为空导致的
    // 检查一下 ticket 是否获取成功
    let ticketInfo = '';
    try {
      const ticket = await ctx.service.common.checkJSSDKTicket(t);
      if (!ticket) {
        ticketInfo =
          '\n诊断：checkJSSDKTicket 返回空值，可能是 checkWxTokenV2() 返回空值';
      }
    } catch (e) {
      ticketInfo = `\n诊断：检查 ticket 时出错: ${e.message}`;
    }

    return {
      handleError: `generateJSSDKSignature 返回数据不完整，缺少必要字段${ticketInfo}

返回的数据: ${JSON.stringify(signRes)}`,
    };
  }

  // 获取企业ID（corpid，用于wx.config的appId）
  let finalCorpid = corpid || '';
  if (!finalCorpid && ctx.model && ctx.model.Config) {
    try {
      const wxConfig = await ctx.model.Config.findOne({
        where: { key: 'wx_corpid' },
      });
      finalCorpid = wxConfig?.value || '';
    } catch (e) {
      ctx.logger.warn('获取corpid失败', e);
    }
  }

  if (!finalCorpid) {
    return {
      handleError:
        '未配置企业ID（corpid），请在请求参数中传入corpid，或在配置表中设置key=wx_corpid',
    };
  }

  // 返回签名配置（直接使用 generateJSSDKSignature 返回的签名）
  return {
    success: true,
    appId: finalCorpid,
    timestamp: signRes.timestamp,
    nonceStr: signRes.nonceStr,
    signature: signRes.signature,
  };
} catch (error) {
  ctx.logger.error('获取企微JS-SDK签名失败', error);
  return {
    handleError: error.message || '获取签名失败',
    error: error.stack,
  };
}
