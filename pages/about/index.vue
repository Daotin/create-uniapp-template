<template>
	<view class="my-page h-full flex flex-col items-center justify-center">
		<template v-if="hasLogin">
			<text>我的</text>
			<!-- 这里可以添加已登录用户看到的内容 -->

			<view class="logout-text" @click="handleLogout">注销登录</view>
		</template>
		<template v-else>
			<u-button type="primary" @click="handleLogin" size="large">去登录</u-button>
		</template>
	</view>
</template>

<script>
import storage from '@/utils/storage.js'
import { confirm } from '@/utils/toast.js'
import { mutations as uniIdMutations } from '@/uni_modules/uni-id-pages/common/store.js'

export default {
	data() {
		return {
			hasLogin: false,
		}
	},
	onShow() {
		// 每次显示页面时检查登录状态
		this.checkLoginState()
	},
	methods: {
		checkLoginState() {
			try {
				// 检查是否有token和用户信息
				const token = storage.getItem('uni_id_token')
				const userInfo = storage.getItem('uni-id-pages-userInfo')
				this.hasLogin = Boolean(token && userInfo)
			} catch (e) {
				this.hasLogin = false
			}
		},
		handleLogin() {
			uni.navigateTo({
				url: `/uni_modules/uni-id-pages/pages/login/login-withoutpwd`,
			})
		},
		async handleLogout() {
			await confirm('确认退出登录？')
			await uniIdMutations.logout()
			this.hasLogin = false
		},
	},
}
</script>

<style lang="scss">
.my-page {
	padding: 20rpx;
	.logout-text {
		position: absolute;
		bottom: 20rpx;
		text-align: center;
		color: #c00000;
		font-size: 20rpx;
	}
}
</style>
