<template>
	<view class="my-page h-full">
		<!-- 未登录状态 -->
		<view v-if="!isLogin" class="login-container">
			<button type="primary" @click="handleLogin" class="login-btn">微信一键登录</button>
		</view>

		<!-- 已登录状态 -->
		<view v-else class="user-info-container">
			<view class="avatar-container">
				<!-- 头像区域，可点击修改 -->
				<button class="avatar-wrapper" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<image class="avatar" :src="avatarUrl || '/static/avatar.jpg'"></image>
				</button>

				<!-- 昵称区域，可点击修改 -->
				<view class="nickname-container">
					<input
						v-if="isEditingNickname"
						type="nickname"
						class="nickname-input"
						v-model="inputNickname"
						@blur="updateNickname"
						@confirm="updateNickname"
						placeholder="请输入昵称"
						focus />
					<text v-else class="nickname" @click="startEditNickname">{{ nickName || '微信用户' }}</text>
				</view>
			</view>
		</view>

		<!-- 退出登录按钮 -->
		<view v-if="isLogin" class="logout-container">
			<text class="logout-btn" @click="logout">退出登录</text>
		</view>
	</view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import storage from '@/utils/storage'

export default {
	data() {
		return {
			isEditingNickname: false,
			inputNickname: '',
		}
	},
	computed: {
		...mapGetters(['userId', 'nickName', 'avatarUrl', 'isLogin']),
	},
	methods: {
		...mapActions({
			setUserInfo: 'demo/setUserInfo',
			setUserId: 'demo/setUserId',
			setUserDelAll: 'demo/setUserDelAll',
			updateUserAvatar: 'demo/updateUserAvatar',
			updateUserNickname: 'demo/updateUserNickname',
		}),
		// 生成随机昵称
		generateRandomNickname() {
			const randomStr = Math.random().toString(36).substr(2, 8)
			return `微信用户_${randomStr}`
		},
		// 登录处理
		handleLogin() {
			uni.login({
				provider: 'weixin',
				success: loginRes => {
					console.log('登录成功', loginRes)
					// 保存用户ID
					this.setUserId(loginRes.code)

					// TODO：后续需要调用后端接口，传入code获取登录的token（或者先获openid，然后调用后端接口获取token）

					// 设置默认用户信息
					const defaultUserInfo = {
						nickName: this.generateRandomNickname(),
						avatarUrl: '/static/avatar.jpg',
					}

					// 保存用户信息
					this.setUserInfo(defaultUserInfo)
					// 存储到本地
					storage.setItem('userInfo', defaultUserInfo)

					this.$showToast.success('登录成功')
				},
				fail: err => {
					console.error('login fail', err)
					this.$showToast.error('登录失败')
				},
			})
		},
		// 选择头像
		// BUG：在微信开发者工具中，点击微信头像后会报错：[渲染层错误] [Component] <button>: chooseAvatar:fail Error: ENOENT: no such file or directory, 在手机上预览OK
		onChooseAvatar(e) {
			console.log('onChooseAvatar', e)
			const { avatarUrl } = e.detail
			if (avatarUrl) {
				// 更新头像
				this.updateUserAvatar(avatarUrl)

				// 获取当前存储的用户信息
				const userInfo = storage.getItem('userInfo') || {}
				// 更新头像并保存
				userInfo.avatarUrl = avatarUrl
				storage.setItem('userInfo', userInfo)
			}
		},
		// 开始编辑昵称
		startEditNickname() {
			this.inputNickname = this.nickName || ''
			this.isEditingNickname = true
		},
		// 更新昵称
		updateNickname() {
			if (this.inputNickname.trim()) {
				// 更新昵称
				this.updateUserNickname(this.inputNickname)

				// 获取当前存储的用户信息
				const userInfo = storage.getItem('userInfo') || {}
				// 更新昵称并保存
				userInfo.nickName = this.inputNickname
				storage.setItem('userInfo', userInfo)
			}
			this.isEditingNickname = false
		},
		// 退出登录
		logout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: res => {
					if (res.confirm) {
						this.setUserDelAll()
						storage.removeItem('userInfo')
						this.$showToast.success('已退出登录')
					}
				},
			})
		},
	},
	// 页面加载时，从本地存储恢复数据
	onLoad() {
		// 从本地存储中获取用户信息
		const userInfo = storage.getItem('userInfo')
		if (userInfo) {
			this.setUserInfo(userInfo)
		}
	},
}
</script>

<style lang="scss">
.my-page {
	background-color: #f8f8f8;
	padding: 20rpx;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.login-container {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
}

.login-btn {
	width: 80%;
	height: 90rpx;
	line-height: 90rpx;
	border-radius: 45rpx;
	font-size: 32rpx;
}

.user-info-container {
	padding: 50rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
}

.avatar-container {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.avatar-wrapper {
	width: 200rpx;
	height: 200rpx;
	background: none;
	padding: 0;
	margin: 0;
	border: none;
	line-height: normal;
	border-radius: 50%;
	overflow: hidden;
	image {
		width: 100%;
		height: 100%;
	}
}

.avatar-wrapper::after {
	border: none;
}

.avatar {
	width: 160rpx;
	height: 160rpx;
	border-radius: 80rpx;
	margin-bottom: 20rpx;
}

.nickname-container {
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 80rpx;
}

.nickname {
	font-size: 36rpx;
	font-weight: bold;
}

.nickname-input {
	font-size: 36rpx;
	text-align: center;
	min-width: 300rpx;
	border-bottom: 1px solid #ddd;
	padding: 10rpx;
}

.logout-container {
	position: fixed;
	bottom: 50rpx;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
}

.logout-btn {
	text-align: center;
	color: #c00000;
}
</style>
