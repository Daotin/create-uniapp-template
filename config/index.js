export const BASE_URL =
	process.env.NODE_ENV === 'development'
		? 'https://mockapi.example.com/api' // 开发环境使用模拟域名
		: 'https://api.yourdomain.com/api' // 生产环境使用实际域名
export const IMG_BASE_URL = 'http://whty.tyjulink.com:82/'
export const UPDATA_AVATAR = 'http://whty.tyjulink.com:82/eleccard/wechatPlatform/updateAvatar'

export const MAP_KEY = '23EBZ-7GECM-4AZ62-67DPE-6JQYH-DOFSY'
