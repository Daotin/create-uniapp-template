<template>
	<view class="content h-full" :style="{ paddingTop: navHeight + 'rpx' }">
		<!-- 顶部导航栏背景 -->
		<view class="nav-bar custom-nav-bar" :style="{ height: navHeight + 'rpx' }">
			<text class="nav-title">小小菜谱</text>
		</view>

		<u-button type="success" @click="show = true">打开键盘</u-button>

		<u-icon name="level" size="100"></u-icon>

		<!-- 测试底部安全区域 -->
		<u-keyboard ref="uKeyboard" mode="number" :show="show" @close="show = false"></u-keyboard>
	</view>
</template>

<script>
const app = getApp()
export default {
	data() {
		return {
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
	methods: {},
}
</script>

<style lang="scss" scoped>
.content {
	min-height: 100vh;
	background-color: #f7f8fa;

	.custom-nav-bar {
		background: linear-gradient(to right, #2979ff, #188fff);
		width: 100%;
		display: flex;
		align-items: flex-end;
		padding-bottom: 10px;

		.nav-title {
			color: #fff;
			font-size: 18px;
			font-weight: 500;
			padding-left: 15px;
		}
	}
}
</style>
