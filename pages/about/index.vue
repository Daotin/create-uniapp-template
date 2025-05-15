<template>
	<view class="my-page h-full flex flex-col items-center">
		<template v-if="hasLogin">
			<!-- 登录成功后显示简单的用户信息和入口 -->
			<view class="user-info">
				<view class="avatar-wrapper" @click="goToUserInfo">
					<image class="avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill"></image>
				</view>
				<view class="nickname" @click="goToUserInfo">{{ userInfo.nickname || '点击设置昵称' }}</view>
			</view>

			<!-- 其他可能的"我的"页面功能入口 -->
			<view class="menu-list">
				<view class="menu-item" @click="goToUserInfo">
					<text>修改个人资料</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="handleLogout">
					<text style="color: red">退出登录</text>
					<text class="arrow">></text>
				</view>
				<!-- 可以添加更多菜单项 -->
			</view>
			<view class="version-box">
				<text>当前版本：{{ version }}</text>
			</view>
		</template>
		<template v-else>
			<view class="login-container">
				<u-button type="primary" @click="handleLogin" size="large">去登录</u-button>
			</view>
		</template>
	</view>
</template>

<script>
import storage from '@/utils/storage.js'
import { mutations as uniIdMutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { confirm } from '@/utils/toast.js'
import { getVersion } from '@/utils/index.js'
export default {
	data() {
		return {
			version: '',
			hasLogin: false,
			userInfo: {},
			defaultAvatar: '/static/avatar.jpg',
		}
	},
	onLoad() {
		this.init()
	},
	onShow() {
		// 每次显示页面时检查登录状态
		this.init()
	},
	methods: {
		init() {
			this.getVersion()
			this.checkLoginState()
		},
		getVersion() {
			this.version = getVersion()
		},
		checkLoginState() {
			try {
				console.log('检查登录状态')
				// 检查是否有token和用户信息
				const token = storage.getItem('uni_id_token')
				const userInfoStorage = storage.getItem('uni-id-pages-userInfo')
				this.hasLogin = Boolean(token && userInfoStorage)

				console.log('检查登录状态', this.hasLogin, token)

				if (this.hasLogin) {
					// 获取最新的用户信息
					this.getUserInfo()
				}
			} catch (e) {
				this.hasLogin = false
				console.error('检查登录状态出错:', e)
			}
		},
		getUserInfo() {
			try {
				// 从storage中获取用户信息
				const userInfoStorage = storage.getItem('uni-id-pages-userInfo')
				if (userInfoStorage) {
					this.userInfo = JSON.parse(JSON.stringify(userInfoStorage))

					// 处理头像URL
					if (this.userInfo.avatar_file && this.userInfo.avatar_file.url) {
						this.userInfo.avatar = this.userInfo.avatar_file.url
					} else {
						this.userInfo.avatar = this.defaultAvatar
					}
				}
			} catch (e) {
				console.error('获取用户信息出错:', e)
				this.userInfo = {}
			}
		},
		handleLogin() {
			uni.navigateTo({
				url: `/uni_modules/uni-id-pages/pages/login/login-withoutpwd`,
			})
		},
		goToUserInfo() {
			uni.navigateTo({
				url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo',
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
	padding: 30rpx;

	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 80vh;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 0;

		.avatar-wrapper {
			margin-bottom: 20rpx;
		}

		.avatar {
			width: 150rpx;
			height: 150rpx;
			border-radius: 50%;
		}

		.nickname {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-top: 10rpx;
		}
	}

	.menu-list {
		width: 100%;
		background-color: #ffffff;
		border-radius: 12rpx;
		margin-top: 30rpx;

		.menu-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #eee;

			.arrow {
				color: #999;
			}
		}
	}
	.version-box {
		margin-top: 30rpx;
		font-size: 24rpx;
		color: #999;
	}
}
</style>
