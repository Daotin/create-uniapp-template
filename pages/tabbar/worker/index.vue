<template>
	<view class="worker-list common-page-container">
		<!-- 搜索框 -->
		<view class="search-box">
			<u-search
				v-model="keyword"
				placeholder="搜索工人姓名"
				:show-action="false"
				@custom="searchWorkers"
				@search="searchWorkers"
				shape="round"
				bg-color="#f7f8fa"></u-search>
		</view>

		<!-- 列表内容 -->
		<scroll-view
			scroll-y
			class="content"
			refresher-enabled
			@refresherrefresh="onRefresh"
			:refresher-triggered="refreshTriggered">
			<u-empty v-if="list.length === 0 && !loading" text="暂无工人数据" mode="list"></u-empty>

			<view v-else>
				<view v-for="(item, index) in list" :key="index" class="list-item" @click="goDetail(item._id)">
					<view class="common-avatar-box">
						<u-avatar :text="item.name.substring(0, 1)" size="58" bg-color="#188fff"></u-avatar>
					</view>
					<view class="info">
						<view class="name">{{ item.name }}</view>
						<view class="phone">{{ item.phone || '未设置手机号' }}</view>
					</view>
					<view class="right-icon">
						<u-icon name="arrow-right" color="#969799" size="18"></u-icon>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 添加按钮 -->
		<view class="common-add-btn">
			<u-button type="primary" size="mini" shape="circle" @click="goAdd">
				<u-icon name="plus" color="#FFFFFF" size="24"></u-icon>
			</u-button>
		</view>
	</view>
</template>

<script>
import { redirectToLogin } from '@/utils'
export default {
	data() {
		return {
			keyword: '', // 搜索关键词
			list: [], // 工人列表
			loading: false, // 加载状态
			refreshTriggered: false, // 下拉刷新状态
		}
	},
	onLoad() {
		this.getWorkerList()
	},
	onShow() {
		// 如果从新增页返回，刷新列表
		console.log('worker onshow')
		uni.$on('needRefresh', this.getWorkerList)
	},
	onUnload() {
		// 移除事件监听
		uni.$off('needRefresh')
	},
	onPullDownRefresh() {
		this.refresh()
	},
	methods: {
		// 获取工人列表
		async getWorkerList() {
			console.log('worker--getWorkerList')
			try {
				this.loading = true
				console.log('请求参数:', { keyword: this.keyword })

				// 直接调用云对象
				const workerService = uniCloud.importObject('worker-service')
				const res = await workerService.getWorkerList({
					keyword: this.keyword,
				})

				console.log('工人列表返回:', res)

				if (res.code === 0) {
					this.list = res.data.list
				} else {
					this.$showToast.none(res.message || '获取工人列表失败')
				}
			} catch (e) {
				console.error('获取工人列表异常:', e.code)
				if (e.code === 401 || e.code === 403) {
					redirectToLogin()
				}
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
				this.refreshTriggered = false
			}
		},

		// 搜索工人
		searchWorkers() {
			this.getWorkerList()
		},

		// 刷新列表
		refresh() {
			this.getWorkerList()
		},

		// scroll-view下拉刷新
		onRefresh() {
			this.refreshTriggered = true
			this.refresh()
		},

		// 跳转到详情页
		goDetail(id) {
			uni.navigateTo({
				url: `/pages/worker/detail?id=${id}`,
			})
		},

		// 跳转到添加页
		goAdd() {
			uni.navigateTo({
				url: '/pages/worker/add',
			})
		},
	},
}
</script>

<style lang="scss" scoped>
.worker-list {
	display: flex;
	flex-direction: column;

	.search-box {
		padding: 20rpx 32rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #ebedf0;
	}

	.content {
		flex: 1;
		height: calc(100vh - 116rpx);
	}

	.list-item {
		display: flex;
		padding: 24rpx 32rpx;
		background-color: #fff;
		align-items: center;
		margin-bottom: 2rpx;

		.info {
			flex: 1;

			.name {
				font-size: 32rpx;
				font-weight: 500;
				color: #323233;
				line-height: 1.4;
			}

			.phone {
				font-size: 24rpx;
				color: #969799;
				line-height: 1.4;
				margin-top: 8rpx;
			}
		}

		.right-icon {
			padding-left: 20rpx;
		}
	}
}
</style>
