const uniIDCommon = require('uni-id-common')

/**
 * 校验用户登录状态和 Token 有效性
 * @param {string} token - 从客户端获取的 uniIdToken
 * @param {object} clientInfo - 通过 this.getClientInfo() 获取的客户端信息
 * @returns {object} 如果校验通过，返回 uni-id checkToken 的结果 (包含 uid, role, permission 等)
 * @throws {Error} 如果校验不通过，抛出带有 code, errCode, errMsg 属性的 Error 对象
 */
async function checkLogin(token, clientInfo) {
	console.log('[auth-filter] 开始执行登录校验 (参数传入方式)...')
	console.log('[auth-filter] 接收到的 token:', token)
	// console.log('[auth-filter] 接收到的 clientInfo:', JSON.stringify(clientInfo)); // clientInfo 可能很多，选择性打印

	if (!token) {
		console.warn('[auth-filter] 用户未登录，缺少 token')
		const err = new Error('用户未登录，请先登录')
		err.code = 401
		err.errCode = 'LOGIN_REQUIRED'
		err.errMsg = '用户未登录，请先登录'
		throw err
	}

	if (!clientInfo) {
		console.error('[auth-filter] 缺少 clientInfo 参数')
		const err = new Error('认证参数不足，无法校验用户身份')
		// err.code = 500; // 可定义为服务器内部错误
		err.errCode = 'CLIENTINFO_MISSING'
		err.errMsg = '认证参数不足，无法校验用户身份'
		throw err
	}

	const uniID = uniIDCommon.createInstance({
		clientInfo,
	})
	console.log('[auth-filter] uniID 实例已创建，准备调用 checkToken...')

	const tokenInfo = await uniID.checkToken(token)
	console.log('[auth-filter] uniID.checkToken 返回结果:', JSON.stringify(tokenInfo))

	if (tokenInfo.errCode) {
		console.warn('[auth-filter] Token 校验失败:', tokenInfo.errMsg, '原始错误码:', tokenInfo.errCode)
		const err = new Error(tokenInfo.errMsg || '登录状态已失效，请重新登录')
		err.code = 403
		err.errCode = 'TOKEN_INVALID'
		err.originalUniIdErrCode = tokenInfo.errCode
		err.errMsg = tokenInfo.errMsg || '登录状态已失效，请重新登录'
		throw err
	}

	console.log('[auth-filter] Token 校验通过，用户信息:', JSON.stringify(tokenInfo))
	return tokenInfo // 返回包含 uid, role, permission 等的对象
}

module.exports = {
	checkLogin,
}
