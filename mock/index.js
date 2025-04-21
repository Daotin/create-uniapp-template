const Mock = require('better-mock/dist/mock.mp.js')
import { BASE_URL } from '@/config/index.js'

// 定义通用的成功返回值
export const basicSuccess = () => {
	return {
		code: 200,
		body: {},
		message: '成功',
	}
}

// const getUserInfo = () => {
// 	return Mock.mock({
// 		code: 200,
// 		body: {
// 			id: 1,
// 			userName: '@email',
// 			email: '@email',
// 			mobile: /^1[345789]\d{9}$/,
// 			createdTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
// 		},
// 		message: '成功',
// 	})
// }

// 修复URL格式问题
// 1. 从BASE_URL中提取路径部分
const urlPath = BASE_URL.replace(/^https?:\/\/[^/]+/, '')
// 2. 确保路径不以斜杠开头
const cleanPath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath
// 3. 构建正确的API URL正则表达式
const apiUrl = new RegExp(cleanPath + '/demo')

console.log('Mock拦截URL:', apiUrl)
// 拦截 Ajax 请求，返回模拟的响应数据。
Mock.mock(apiUrl, 'post', basicSuccess)
