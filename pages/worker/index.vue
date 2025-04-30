<template>
	<view class="worker-list">
		<!-- 搜索框 -->
		<view class="search-box">
			<u-search v-model="keyword" placeholder="搜索工人姓名" :show-action="false" @custom="searchWorkers" @search="searchWorkers" shape="round" bg-color="#f7f8fa"></u-search>
		</view>

		<!-- 列表内容 -->
		<scroll-view scroll-y class="content" @scrolltolower="loadMore" refresher-enabled @refresherrefresh="onRefresh" :refresher-triggered="refreshTriggered">
			<u-empty v-if="list.length === 0 && !loading" text="暂无工人数据" mode="list"></u-empty>
			
			<view v-else>
				<view v-for="(item, index) in list" :key="index" class="list-item" @click="goDetail(item._id)">
					<view class="avatar-box">
						<u-avatar :text="item.name.substring(0, 1)" font-size="22" bg-color="#188fff" size="40"></u-avatar>
					</view>
					<view class="info">
						<view class="name">{{item.name}}</view>
						<view class="phone">{{item.phone || '未设置手机号'}}</view>
					</view>
					<view class="right-icon">
						<u-icon name="arrow-right" color="#969799" size="18"></u-icon>
					</view>
				</view>
				
				<!-- 加载更多状态 -->
				<view class="load-more">
					<u-loadmore :status="loadMoreStatus" :loading-text="loadingText" :loadmore-text="loadMoreText" :nomore-text="noMoreText"></u-loadmore>
				</view>
			</view>
		</scroll-view>

		<!-- 添加按钮 -->
		<view class="fab-box">
			<u-button type="primary" size="mini" shape="circle" @click="goAdd">
				<u-icon name="plus" color="#FFFFFF" size="24"></u-icon>
			</u-button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			keyword: '', // 搜索关键词
			list: [], // 工人列表
			page: 1, // 当前页码
			pageSize: 15, // 每页条数
			total: 0, // 总条数
			loading: false, // 加载状态
			loadMoreStatus: 'loading', // 加载状态：loading-加载中 nomore-没有更多 loadmore-加载更多
			loadingText: '正在加载', // 加载中的提示文字
			loadMoreText: '点击或上拉加载更多', // 加载更多的提示文字
			noMoreText: '没有更多了', // 没有更多的提示文字
			refreshTriggered: false, // 下拉刷新状态
		}
	},
	onLoad() {
		this.getWorkerList()
  },
  onShow() { 
    // 如果从新增页返回，刷新列表
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
			try {
				this.loading = true
				console.log('请求参数:', { keyword: this.keyword, page: this.page, pageSize: this.pageSize })
				
				// 直接调用云对象
				const workerService = uniCloud.importObject('worker-service')
				const res = await workerService.getWorkerList({
					keyword: this.keyword,
					page: this.page,
					pageSize: this.pageSize
				})
				
				console.log('工人列表返回:', res)
				
				if (res.code === 0) {
					// 如果是第一页，直接替换列表，否则追加
					if (this.page === 1) {
						this.list = res.data.list
					} else {
						this.list = [...this.list, ...res.data.list]
					}
					this.total = res.data.total
					
					// 更新加载状态
					this.loadMoreStatus = this.list.length >= this.total ? 'nomore' : 'loadmore'
				} else {
					this.$showToast.none(res.message || '获取工人列表失败')
				}
			} catch (e) {
				console.error('获取工人列表异常:', e)
				this.$showToast.none('获取工人列表失败，请重试')
				this.loadMoreStatus = 'loadmore'
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
				this.refreshTriggered = false
			}
		},
		
		// 搜索工人
		searchWorkers() {
			this.page = 1
			this.getWorkerList()
		},
		
		// 加载更多
		loadMore() {
			if (this.loadMoreStatus === 'nomore' || this.loading) return
			
			this.page++
			this.loadMoreStatus = 'loading'
			this.getWorkerList()
		},
		
		// 刷新列表
		refresh() {
			this.page = 1
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
				url: `/pages/worker/detail?id=${id}`
			})
		},
		
		// 跳转到添加页
		goAdd() {
			uni.navigateTo({
				url: '/pages/worker/add'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.worker-list {
	min-height: 100vh;
	background-color: #f7f8fa;
	display: flex;
	flex-direction: column;
	
	.search-box {
		padding: 20rpx 32rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #ebedf0;
	}
	
	.content {
		flex: 1;
		height: calc(100vh - 116rpx); // 减去搜索框高度
		padding-bottom: 160rpx; // 为底部按钮留出空间
	}
	
	.list-item {
		display: flex;
		padding: 24rpx 32rpx;
		background-color: #fff;
		align-items: center;
		margin-bottom: 2rpx;
		
		.avatar-box {
			margin-right: 24rpx;
		}
		
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
	
	.load-more {
		padding: 30rpx 0;
	}
	
	.fab-box {
		position: fixed;
		right: 40rpx;
		bottom: 60rpx;
		z-index: 9;
		
		/deep/ .u-btn {
			width: 100rpx;
			height: 100rpx;
			box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.4);
		}
	}
}
</style>