<template>
	<view class="profile-page">
		<!-- 未登录状态 -->
		<template v-if="!hasLogin">
			<view class="login-container">
				<view class="login-title">欢迎使用AI画廊</view>
				<view class="login-subtitle">登录后可以保存你的创作，分享你的灵感</view>
				<u-button type="primary" shape="circle" size="large" @click="handleLogin">
					<template v-slot:default>
						<u-icon name="weixin-fill" color="#ffffff" size="24" style="margin-right: 10rpx;"></u-icon>微信一键登录
					</template>
				</u-button>
				<view class="text-xs text-gray-400 mt-5">
					点击登录按钮将跳转到uni-id-pages登录页面
				</view>
			</view>
		</template>
		
		<!-- 已登录状态 -->
		<template v-else>
			<!-- 用户信息 -->
			<view class="user-info-section">
				<view class="avatar-wrapper" @click="goToUserInfo">
					<image class="avatar" :src="userInfo.avatar || defaultAvatar" mode="aspectFill"></image>
				</view>
				<view class="nickname" @click="goToUserInfo">{{ userInfo.nickname || '点击设置昵称' }}</view>
			</view>
			
			<!-- 菜单列表 -->
			<view class="menu-list">
				<view class="menu-item" @click="goToUserInfo">
					<view class="flex items-center">
						<view class="menu-icon">
							<u-icon name="account-fill" color="#606266" size="24"></u-icon>
						</view>
						<view>修改个人资料</view>
					</view>
					<view class="arrow">
						<u-icon name="arrow-right" color="#c0c4cc" size="24"></u-icon>
					</view>
				</view>
				<view class="menu-item" @click="goToMyCreations">
					<view class="flex items-center">
						<view class="menu-icon">
							<u-icon name="photo" color="#606266" size="24"></u-icon>
						</view>
						<view>我的创作</view>
					</view>
					<view class="arrow">
						<u-icon name="arrow-right" color="#c0c4cc" size="24"></u-icon>
					</view>
				</view>
				<view class="menu-item" @click="goToSettings">
					<view class="flex items-center">
						<view class="menu-icon">
							<u-icon name="setting" color="#606266" size="24"></u-icon>
						</view>
						<view>设置</view>
					</view>
					<view class="arrow">
						<u-icon name="arrow-right" color="#c0c4cc" size="24"></u-icon>
					</view>
				</view>
				<view class="menu-item" @click="handleLogout">
					<view class="flex items-center">
						<view class="menu-icon">
							<u-icon name="minus-circle" color="#fa3534" size="24"></u-icon>
						</view>
						<view class="text-red">退出登录</view>
					</view>
					<view class="arrow">
						<u-icon name="arrow-right" color="#c0c4cc" size="24"></u-icon>
					</view>
				</view>
			</view>
		</template>
		
	</view>
</template>

<script>
import storage from '@/utils/storage.js'
import { mutations as uniIdMutations } from '@/uni_modules/uni-id-pages/common/store.js'
import { confirm } from '@/utils/toast.js'

export default {
	data() {
		return {
			hasLogin: false,
			userInfo: {},
			defaultAvatar: '/static/avatar.jpg'
		}
	},
	onLoad() {
		this.checkLoginState()
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
				const userInfoStorage = storage.getItem('uni-id-pages-userInfo')
				this.hasLogin = Boolean(token && userInfoStorage)
				
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
				url: `/uni_modules/uni-id-pages/pages/login/login-withoutpwd`
			})
		},
		goToUserInfo() {
			uni.navigateTo({
				url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
			})
		},
		goToMyCreations() {
			uni.showToast({
				title: '我的创作功能开发中',
				icon: 'none'
			})
		},
		goToSettings() {
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none'
			})
		},
		async handleLogout() {
			await confirm('确认退出登录？')
			await uniIdMutations.logout()
			this.hasLogin = false
			this.userInfo = {}
		},
	}
}
</script>

<style lang="scss">
.profile-page {
	background-color: #f8f8f8;
	min-height: 100vh;
	
	.navbar {
		height: 88rpx;
		background-color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 32rpx;
		position: relative;
		z-index: 50;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	.login-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 70vh;
		padding: 0 40rpx;
		
		.login-title {
			font-size: 48rpx;
			font-weight: bold;
			margin-bottom: 32rpx;
		}
		
		.login-subtitle {
			font-size: 28rpx;
			color: #606266;
			margin-bottom: 60rpx;
			text-align: center;
		}
		
		.mt-5 {
			margin-top: 20rpx;
		}
		
		.text-xs {
			font-size: 24rpx;
		}
		
		.text-gray-400 {
			color: #909399;
		}
	}
	
	.user-info-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 80rpx 0;
		
		.avatar-wrapper {
			margin-bottom: 32rpx;
		}
		
		.avatar {
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			object-fit: cover;
			background-color: #f1f1f1;
		}
		
		.nickname {
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
		}
	}
	
	.menu-list {
		background-color: white;
		border-radius: 24rpx;
		margin: 0 32rpx;
		overflow: hidden;
		
		.menu-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 32rpx;
			border-bottom: 1px solid #f1f1f1;
			
			&:last-child {
				border-bottom: none;
			}
			
			.menu-icon {
				width: 48rpx;
				height: 48rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 24rpx;
			}
			
			.text-red {
				color: #fa3534;
			}
			
			.flex {
				display: flex;
			}
			
			.items-center {
				align-items: center;
			}
		}
	}
}
</style>
