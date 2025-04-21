import { BASE_URL } from '@/config/index.js'
import store from '@/store/index.js'

// loading配置，请求次数统计
const startLoading = () => {
	uni.showLoading({
		title: '正在加载...',
		icon: 'loading',
		mask: true,
	})
}

const endLoading = () => {
	uni.hideLoading()
}

// 存储请求个数
var needLoadingRequestCount = 0

const showFullScreenLoading = isLoading => {
	if (!isLoading) return
	if (needLoadingRequestCount === 0) {
		startLoading()
	}
	needLoadingRequestCount++
}

const tryHideFullScreenLoading = isLoading => {
	if (!isLoading) return
	if (needLoadingRequestCount <= 0) return
	needLoadingRequestCount--
	if (needLoadingRequestCount === 0) {
		endLoading()
	}
}

// 封装请求
const baseRequest = async (url, method, data = {}, loading = true) => {
	const userId = store.getters.userId || ''

	// 手动添加loading控制
	const obj = {
		data: {
			userId,
		},
		isLoading: data?.isLoading !== undefined ? data.isLoading : true,
	}

	console.log('请求地址', url, obj.data)
	let header = {}

	showFullScreenLoading(obj.isLoading)
	return new Promise((reslove, reject) => {
		uni.request({
			url: BASE_URL + url,
			method: method || 'GET',
			header: header,
			timeout: 10000,
			data: obj.data || {},
			success: res => {
				try {
					console.log('返回参数', url, res)
					if (res.statusCode === 200) {
						if (res.data.code == '00' || res.data.code == 200) {
							res?.data ? reslove(res.data) : reslove(res.data)
							tryHideFullScreenLoading(obj.isLoading)
						} else {
							setTimeout(() => {
								uni.showToast({
									title: res?.data ? res.data : res.msg,
									icon: 'none',
								})
							}, 30)
							reject(res)
							tryHideFullScreenLoading(obj.isLoading)
						}
					} else {
						setTimeout(() => {
							uni.showToast({
								title: '网络连接失败，请稍后重试',
								icon: 'none',
							})
						}, 30)
						reject(res)
						tryHideFullScreenLoading(obj.isLoading)
					}
				} catch (e) {
					uni.showToast({
						title: '网络连接失败，请稍后重试',
						icon: 'none',
					})
					reject()
				}
			},
			fail: msg => {
				setTimeout(() => {
					uni.showToast({
						title: '网络连接失败，请稍后重试',
						icon: 'none',
					})
				}, 30)
				reject(msg)
				tryHideFullScreenLoading(obj.isLoading)
			},
		})
	})
}

const request = {}
const methods = ['options', 'get', 'post', 'put', 'head', 'delete', 'trace', 'connect']
methods.forEach(method => {
	request[method] = (api, data, loading) => baseRequest(api, method, data, loading)
})

export default request
