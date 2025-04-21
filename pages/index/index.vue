<template>
	<view class="content h-full" :style="{ paddingTop: navHeight + 'rpx' }">
		<!-- <view class="navigation-bar" :style="{ height: navHeight + 'rpx' }"></view> -->
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">{{ title }}</text>
		</view>
		<!-- uView示例 -->
		<u-button type="primary" @click="getDemo">接口mock</u-button>
		<u-button type="success" @click="show = true">吊起键盘</u-button>

		<!-- 公共组件示例 -->
		<common-empty></common-empty>

		<!-- 测试底部安全区域 -->
		<u-keyboard ref="uKeyboard" mode="number" v-model="show"></u-keyboard>
	</view>
</template>

<script>
const app = getApp()
export default {
	data() {
		return {
			title: 'Hello',
			navHeight: 0,
			show: false,
		}
	},
	onLoad() {
		console.log('page index onLoad')
	},
	onShow() {
		this.navHeight = app.globalData.navHeight
		console.log('page index navHeight', this.navHeight)
	},
	methods: {
		async getDemo() {
			const res = await this.$api.demo.apiDemo()
			console.log(res)
			this.$showToast.success('接口mock成功')
		},
	},
}
</script>

<style lang="scss" scoped>
.content {
	background-color: pink;

	.navigation-bar {
		width: 100%;
		background-color: green;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-bottom: 50rpx;
	}
}
</style>
