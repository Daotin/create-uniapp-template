<template>
	<view class="my-page h-full flex flex-col items-center justify-center">
		<template v-if="hasLogin">
			<view class="user-info-box">
				<image class="avatar" src="/static/avatar.jpg" mode="aspectFill"></image>
				<view class="nickname">{{nickname}}</view>
			</view>
			
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
			nickname: '',
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
				
				if (this.hasLogin) {
					// 生成随机昵称
					this.generateNickname()
				}
			} catch (e) {
				this.hasLogin = false
			}
		},
		generateNickname() {
			// 生成8位随机数
			const randomNum = Math.floor(10000000 + Math.random() * 90000000)
			this.nickname = `微信用户_${randomNum}`
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
	
	.user-info-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		
		.avatar {
			width: 150rpx;
			height: 150rpx;
			border-radius: 50%;
			margin-bottom: 20rpx;
		}
		
		.nickname {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}
	
	.logout-text {
		position: absolute;
		bottom: 20rpx;
		text-align: center;
		color: #c00000;
		font-size: 20rpx;
	}
}
</style>
