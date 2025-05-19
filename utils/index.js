import packageJson from '../package.json'
import app from '@/App.vue'
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
	let t = setTimeout(() => {
		clearTimeout(t)
		console.log('跳转redirectToLogin')
		uni.switchTab({
			url: '/pages/about/index',
		})
	}, 60)
}

// 获取package.json的version
export function getVersion() {
	return packageJson.version
}

// 单位换算：xx小时换算成xx工xx小时
export function convertHoursToWorkDays(hours) {
	const dayUnit = app.globalData.dayUnit
	console.log('convertHoursToWorkDays:', dayUnit, hours)
	const workDays = Math.floor(hours / dayUnit)
	const workHours = hours % dayUnit

	function getWorkText(workDays, workHours) {
		if (workDays) {
			return workHours ? `${workDays}工${workHours}H` : `${workDays}工`
		}
		if (workHours) {
			return `${workHours}H`
		}
		return '0H'
	}

	return {
		workDays,
		workHours,
		workText: getWorkText(workDays, workHours),
	}
}
