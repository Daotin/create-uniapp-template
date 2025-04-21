// 手机号脱敏
export function formatPhone(phone) {
	if (phone && phone.length) {
		return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
	}
	return ''
}
