<template>
	<view class="site-detail" v-if="site._id">
		<!-- 工地头部信息 -->
		<view class="site-header">
			<view class="site-name">{{ site.name }}</view>
			<view class="site-address" v-if="site.address">
				<u-icon name="map" color="#969799" size="16" class="address-icon"></u-icon>
				<text>{{ site.address }}</text>
			</view>
		</view>

		<!-- 操作面板 -->
		<view class="action-panel">
			<view class="action-item primary-btn" @click="goWorkHourRecord">
				<view class="action-icon">
					<u-icon name="clock" color="#FFFFFF" size="22"></u-icon>
				</view>
				<view class="action-text">记工时</view>
			</view>
			
			<view class="action-item plain-btn" @click="goWorkHourList">
				<view class="action-icon">
					<u-icon name="file-text" color="#2979ff" size="22"></u-icon>
				</view>
				<view class="action-text">工时记录</view>
			</view>
			
			<view class="action-item plain-btn" @click="goWorkHourStats">
				<view class="action-icon">
					<u-icon name="account" color="#2979ff" size="22"></u-icon>
				</view>
				<view class="action-text">工时统计</view>
			</view>
		</view>

		<!-- 工地工人列表 -->
		<view class="info-card">
			<view class="card-header">
				<view>工地工人 ({{ workerCount || 0 }}人)</view>
				<view class="view-all" @click="goSiteWorkers">
					<text>查看全部</text>
					<u-icon name="arrow-right" color="#2979ff" size="14"></u-icon>
				</view>
			</view>
			<view class="card-content" v-if="workers.length > 0">
				<view class="worker-row" v-for="(worker, index) in workers" :key="index">
					<view class="worker-avatar">
						<u-avatar :text="worker.name.substring(0, 1)" font-size="18" bg-color="#188fff" size="40"></u-avatar>
					</view>
					<view class="worker-info">
						<view class="worker-name">{{ worker.name }}</view>
						<view class="worker-hours">累计工时: 计算中</view>
					</view>
				</view>
				<view class="add-worker" @click="goAddWorker">
					<u-icon name="plus" color="#2979ff" size="22"></u-icon>
					<text>添加工人</text>
				</view>
			</view>
			<view class="card-empty" v-else>
				<u-empty mode="data" text="暂无工人数据"></u-empty>
				<view class="add-worker-empty" @click="goAddWorker">
					<u-icon name="plus" color="#2979ff" size="22"></u-icon>
					<text>添加工人</text>
				</view>
			</view>
		</view>

		<!-- 备注信息 -->
		<view class="info-card" v-if="site.remark">
			<view class="card-header">
				<view>备注信息</view>
			</view>
			<view class="card-content">
				<view class="remark-content">{{ site.remark }}</view>
			</view>
		</view>

		<!-- 操作按钮区域 -->
		<view class="action-buttons">
			<u-button type="primary" @click="goEdit">编辑</u-button>
			<u-button type="error" :plain="true" @click="confirmDelete">删除</u-button>
		</view>

		<!-- 删除确认弹窗 -->
		<u-modal
			v-model="showDeleteModal"
			content="确定要删除该工地吗？删除后无法恢复"
			:show-cancel-button="true"
			confirm-text="删除"
			cancel-text="取消"
			confirm-color="#fa3534"
			@confirm="deleteSite"></u-modal>
	</view>
</template>

<script>
export default {
	data() {
		return {
			siteId: '', // 工地ID
			site: {}, // 工地信息
			workers: [], // 工人列表
			workerCount: 0, // 工人总数
			loading: false, // 加载状态
			showDeleteModal: false, // 是否显示删除确认弹窗
		}
	},
	onLoad(option) {
		if (option.id) {
			this.siteId = option.id
			this.getSiteDetail()
			this.getSiteWorkers()
		} else {
			this.$showToast.none('参数错误')
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
		
		// 监听工地详情刷新事件
		uni.$on('refreshSiteDetail', this.refresh)
	},
	onUnload() {
		// 移除事件监听
		uni.$off('refreshSiteDetail')
	},
	methods: {
		// 获取工地详情
		async getSiteDetail() {
			try {
				this.loading = true
				this.$showLoading('加载中...')

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteDetail({
					siteId: this.siteId,
				})

				console.log('工地详情返回:', res)

				if (res.code === 0 && res.data) {
					this.site = res.data
				} else {
					this.$showToast.none(res.message || '获取工地信息失败')
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (e) {
				console.error('获取工地详情异常:', e)
				this.$showToast.none('获取工地信息失败，请重试')
			} finally {
				this.loading = false
				this.$hideLoading()
			}
		},

		// 获取工地工人列表
		async getSiteWorkers() {
			try {
				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteWorkers({
					siteId: this.siteId,
					page: 1,
					pageSize: 2 // 只获取前2条
				})

				console.log('工地工人列表返回:', res)

				if (res.code === 0) {
					this.workers = res.data.list
					this.workerCount = res.data.total
				}
			} catch (e) {
				console.error('获取工地工人列表异常:', e)
			}
		},

		// 跳转到编辑页面
		goEdit() {
			uni.navigateTo({
				url: `/pages/site/add?id=${this.siteId}`,
			})
		},

		// 确认删除
		confirmDelete() {
			this.showDeleteModal = true
		},

		// 删除工地
		async deleteSite() {
			try {
				this.$showLoading('删除中...')

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.deleteSite({
					siteId: this.siteId,
				})

				console.log('删除工地返回:', res)

				if (res.code === 0) {
					this.$showToast.success('删除成功')
					
					// 触发刷新事件
					uni.$emit('needRefresh')

					// 等待提示显示后返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					this.$showToast.none(res.message || '删除失败')
				}
			} catch (e) {
				console.error('删除工地异常:', e)
				this.$showToast.none('删除失败，请重试')
			} finally {
				this.$hideLoading()
			}
		},
		
		// 跳转到工地工人列表页面
		goSiteWorkers() {
			// 跳转到工地工人管理页面
			uni.navigateTo({
				url: `/pages/site/workers?id=${this.siteId}&name=${encodeURIComponent(this.site.name)}`
			})
		},
		
		// 跳转到记工时页面
		goWorkHourRecord() {
			// 暂不实现，等待后续开发
			this.$showToast.success('记工时功能开发中')
		},
		
		// 跳转到工时记录页面
		goWorkHourList() {
			// 暂不实现，等待后续开发
			this.$showToast.success('工时记录功能开发中')
		},
		
		// 跳转到工时统计页面
		goWorkHourStats() {
			// 暂不实现，等待后续开发
			this.$showToast.success('工时统计功能开发中')
		},

		// 跳转到添加工人页面
		goAddWorker() {
			// 跳转到工地工人管理页面并默认打开添加工人选项卡
			uni.navigateTo({
				url: `/pages/site/workers?id=${this.siteId}&name=${encodeURIComponent(this.site.name)}&tab=1`
			})
		},

		// 刷新页面数据
		refresh() {
			this.getSiteDetail()
			this.getSiteWorkers()
		}
	},
	onShow() {
		// 如果从编辑页返回，刷新数据
		if (this.siteId) {
			this.getSiteDetail()
			this.getSiteWorkers()
		}
	},
}
</script>

<style lang="scss" scoped>
.site-detail {
	min-height: 100vh;
	background-color: #f7f8fa;
	padding-bottom: 40rpx;

	.site-header {
		background-color: #fff;
		padding: 40rpx 32rpx;
		margin-bottom: 24rpx;

		.site-name {
			font-size: 36rpx;
			font-weight: 500;
			margin-bottom: 16rpx;
			color: #323233;
		}

		.site-address {
			font-size: 28rpx;
			color: #969799;
			display: flex;
			align-items: center;
			
			.address-icon {
				margin-right: 8rpx;
			}
		}
	}

	.action-panel {
		background: #fff;
		display: flex;
		flex-direction: column;
		border-radius: 16rpx;
		overflow: hidden;
		margin: 0 24rpx 24rpx;
		padding: 32rpx;
		
		.action-item {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 24rpx 0;
			margin-bottom: 24rpx;
			border-radius: 8rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.action-icon {
				font-size: 40rpx;
				margin-right: 20rpx;
			}
			
			.action-text {
				font-size: 32rpx;
				color: #323233;
			}
		}
		
		.primary-btn {
			background-color: #2979ff;
			color: white;
			
			.action-text {
				color: white;
			}
		}
		
		.plain-btn {
			background-color: #fff;
			border: 1rpx solid #ebedf0;
		}
	}

	.info-card {
		background: #fff;
		margin: 0 24rpx 24rpx;
		border-radius: 16rpx;
		overflow: hidden;

		.card-header {
			padding: 24rpx 32rpx;
			color: #323233;
			font-size: 32rpx;
			font-weight: 500;
			border-bottom: 1rpx solid #ebedf0;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		
		.view-all {
			font-size: 28rpx;
			color: #2979ff;
			display: flex;
			align-items: center;
		}
		
		.card-content {
			padding: 0;
		}
		
		.card-empty {
			padding: 40rpx;
		}
		
		.worker-row {
			display: flex;
			padding: 24rpx 32rpx;
			border-bottom: 1rpx solid #ebedf0;
			align-items: center;
			
			&:last-child {
				border-bottom: none;
			}
		}
		
		.worker-avatar {
			margin-right: 24rpx;
		}
		
		.worker-info {
			flex: 1;
		}
		
		.worker-name {
			font-size: 32rpx;
			line-height: 44rpx;
			color: #323233;
		}
		
		.worker-hours {
			font-size: 24rpx;
			color: #969799;
		}
		
		.remark-content {
			padding: 24rpx 32rpx;
			font-size: 28rpx;
			color: #646566;
			line-height: 1.5;
		}
		
		.add-worker {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 24rpx 32rpx;
			border-top: 1rpx solid #ebedf0;
			
			.u-icon {
				margin-right: 8rpx;
			}
		}
		
		.add-worker-empty {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 40rpx;
			border-top: 1rpx solid #ebedf0;
			
			.u-icon {
				margin-right: 8rpx;
			}
		}
	}

	.action-buttons {
		margin: 40rpx 24rpx;

		.u-button {
			margin-bottom: 24rpx;
		}
	}
}
</style> 