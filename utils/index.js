// 手机号脱敏
export function formatPhone(phone) {
	if (phone && phone.length) {
		return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
	}
	return ''
}

// 跳转到登录页面，并清除登录信息
export function redirectToLogin() {
	uni.removeStorageSync('uni_id_token')
	// uni.removeStorageSync('uni-id-pages-userInfo')
	uni.setStorageSync('uni_id_token_expired', 0)
	setTimeout(() => {
		uni.switchTab({
			url: '/pages/about/index',
		})
	}, 100)
}
