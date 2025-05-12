<template>
	<view class="site-list common-page-container">
		<!-- 搜索框 -->
		<view class="search-box">
			<u-search
				v-model="keyword"
				placeholder="搜索工地名称"
				:show-action="false"
				@custom="searchSites"
				@search="searchSites"
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
			<u-empty v-if="list.length === 0 && !loading" text="暂无工地数据" mode="list"></u-empty>

			<view v-else>
				<view v-for="(item, index) in list" :key="index" class="list-item">
					<view class="item-header" @click="goDetail(item._id)">
						<view class="site-name">{{ item.name }}</view>
					</view>
					<view class="item-content" @click="goDetail(item._id)">
						<view class="info-row" v-if="item.address">
							<view class="info-text">📍 {{ item.address }}</view>
						</view>
						<view class="info-row" v-if="item.remark">
							<view class="info-text">📄 {{ item.remark }}</view>
						</view>
					</view>
					<view class="item-actions">
						<view class="action-btn" @click="goDetail(item._id)">
							<u-icon name="file-text" color="#2979ff" size="34"></u-icon>
							<text>详情</text>
						</view>
						<view class="action-btn" @click="goWorkTime(item._id)">
							<u-icon name="clock" color="#2979ff" size="34"></u-icon>
							<text>记工时</text>
						</view>
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
import { redirectToLogin } from '@/utils/index.js'
export default {
	data() {
		return {
			keyword: '', // 搜索关键词
			list: [], // 工地列表
			loading: false, // 加载状态
			refreshTriggered: false, // 下拉刷新状态
		}
	},
	onLoad() {
		this.getSiteList()
	},
	onShow() {
		// 如果从新增页或详情页返回，刷新列表
		uni.$on('needRefresh', this.getSiteList)
	},
	onUnload() {
		// 移除事件监听
		uni.$off('needRefresh')
	},
	onPullDownRefresh() {
		this.refresh()
	},
	methods: {
		// 获取工地列表
		async getSiteList() {
			try {
				this.loading = true
				console.log('请求参数:', { keyword: this.keyword })

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteList({
					keyword: this.keyword,
				})

				console.log('工地列表返回:', res)

				if (res.code === 0) {
					this.list = res.data.list
				} else {
					this.$showToast.none(res.message || '获取工地列表失败')
				}
			} catch (e) {
				console.error('获取工地列表异常:', e, e.code)
				if (e.code === 401 || e.code === 403) {
					redirectToLogin()
				}
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
				this.refreshTriggered = false
			}
		},

		// 搜索工地
		searchSites() {
			this.getSiteList()
		},

		// 刷新列表
		refresh() {
			this.getSiteList()
		},

		// scroll-view下拉刷新
		onRefresh() {
			this.refreshTriggered = true
			this.refresh()
		},

		// 跳转到详情页
		goDetail(id) {
			console.log('跳转到工地详情页，传递的ID:', id)
			uni.navigateTo({
				url: `/pages/site/detail?id=${id}`,
			})
		},

		// 跳转到记工时页面
		goWorkTime(id) {
			console.log('直接跳转到记工时页面，工地ID:', id)
			uni.navigateTo({
				url: `/pages/worker-hour/add?siteId=${id}`,
			})
		},

		// 跳转到添加页
		goAdd() {
			uni.navigateTo({
				url: '/pages/site/add',
			})
		},
	},
}
</script>

<style lang="scss" scoped>
.site-list {
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
		padding: 24rpx;
	}

	.list-item {
		background-color: #fff;
		margin-bottom: 24rpx;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 12rpx rgba(100, 101, 102, 0.08);

		.item-header {
			background-color: #2979ff;
			color: white;
			padding: 16rpx 24rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.site-name {
				font-size: 32rpx;
				font-weight: 500;
			}
		}

		.item-content {
			padding: 20rpx 24rpx;

			.info-row {
				display: flex;
				margin-bottom: 12rpx;
				align-items: center;

				&:last-child {
					margin-bottom: 0;
				}

				.info-text {
					font-size: 28rpx;
					color: #646566;
				}
			}
		}

		.item-actions {
			display: flex;
			border-top: 1rpx solid #ebedf0;

			.action-btn {
				flex: 1;
				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				padding: 16rpx 0;
				color: #2979ff;
				font-size: 26rpx;

				&:first-child {
					border-right: 1rpx solid #ebedf0;
				}

				text {
					margin-left: 8rpx;
				}
			}
		}
	}
}
</style>
