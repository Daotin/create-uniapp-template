// confirm
export async function confirm(content = '', title = '提示', ...args) {
	const option = args[0] || {}
	try {
		const params = {
			...option,
			title,
			content,
			showCancel: true,
			placeholderText: option.placeholderText || '请输入',
		}
		// console.log("confirm==?", params, option, args);
		const res = await uni.showModal(params)
		if (res.confirm) {
			return Promise.resolve(res)
		} else if (res.cancel) {
			return Promise.reject(res)
		}
	} catch (err) {
		console.error(err)
		return Promise.reject(err)
	}
}

// alert
export async function alert(content = '', title = '提示', ...args) {
	const option = args[0] || {}
	try {
		const res = await uni.showModal({
			...option,
			title,
			content,
			showCancel: false,
		})
		console.log(res)
		if (res.confirm) {
			return Promise.resolve(res)
		} else {
			return Promise.reject(res)
		}
	} catch (err) {
		console.error(err)
		return Promise.reject(err)
	}
}

// 页面loading
export function showLoading(title = '加载中') {
	uni.showLoading({
		title,
	})
}

// 隐藏loading
export function hideLoading() {
	uni.hideLoading()
}

// showToast
export function showToast(title = '提示', ...args) {
	const option = args[0] || {}
	const t = setTimeout(() => {
		clearTimeout(t)
		uni.showToast({
			...option,
			title,
			icon: option.icon || 'success',
		})
	}, 30)
}
const toastType = ['success', 'error', 'loading', 'none']
toastType.forEach(type => {
	showToast[type] = function (title = '提示', ...args) {
		const option = args[0] || {}
		const t = setTimeout(() => {
			clearTimeout(t)
			uni.showToast({
				...option,
				title,
				icon: type,
			})
		}, 30)
	}
})
