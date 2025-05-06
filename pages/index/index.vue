<template>
	<view class="content h-full" :style="{ paddingTop: navHeight + 'rpx' }">
		<!-- 顶部导航栏背景 -->
		<view class="nav-bar custom-nav-bar" :style="{ height: navHeight + 'rpx' }">
			<text class="nav-title">记工时</text>
		</view>

		<!-- 菜单卡片 -->
		<view class="menu-cards">
			<view class="card-item" @click="goToWorkerList">
				<u-icon name="account" color="#188fff" size="32"></u-icon>
				<text class="card-text">工人管理</text>
			</view>

			<view class="card-item" @click="goToSiteList">
				<u-icon name="home" color="#19be6b" size="32"></u-icon>
				<text class="card-text">工地管理</text>
			</view>

			<view class="card-item" @click="goToRecord">
				<u-icon name="calendar" color="#fa3534" size="32"></u-icon>
				<text class="card-text">工时记录</text>
			</view>

			<view class="card-item" @click="goToStat">
				<u-icon name="chart" color="#ff9900" size="32"></u-icon>
				<text class="card-text">工时统计</text>
			</view>
		</view>

		<!-- 公共组件示例 -->
		<!-- <common-empty></common-empty> -->

		<!-- 测试底部安全区域 -->
		<!-- <u-keyboard ref="uKeyboard" mode="number" v-model="show"></u-keyboard> -->
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
	methods: {
		// 跳转到工人列表
		goToWorkerList() {
			uni.navigateTo({
				url: '/pages/worker/index',
			})
		},
		// 跳转到工地列表
		goToSiteList() {
			uni.navigateTo({
				url: '/pages/site/index',
			})
		},
		goToStat() {
			uni.navigateTo({
				url: '/pages/worker-hour/stats',
			})
		},
		goToRecord() {
			uni.navigateTo({
				url: '/pages/worker-hour/index',
			})
		},
	},
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

	.menu-cards {
		padding: 20px 15px;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;

		.card-item {
			width: 48%;
			height: 100px;
			background-color: #fff;
			border-radius: 8px;
			margin-bottom: 15px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

			.card-text {
				margin-top: 10px;
				font-size: 14px;
				color: #323233;
			}
		}
	}
}
</style>
