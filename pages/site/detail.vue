<template>
	<view class="site-detail common-page-container has-btm-btn" v-if="site._id">
		<!-- 工地头部信息 -->
		<view class="site-header">
			<view class="site-name">{{ site.name }}</view>
			<view class="site-address" v-if="site.address">
				<!-- <u-icon name="map" color="#969799" size="24" class="address-icon"></u-icon> -->
				<text>📍 {{ site.address }}</text>
			</view>
			<view class="site-remark" v-if="site.remark">
				<!-- <u-icon name="bookmark" color="#969799" size="24" class="remark-icon"></u-icon> -->
				<text>📝 {{ site.remark }}</text>
			</view>
			<view class="site-worker">
				<text>👷🏻‍♂️ {{ workerCount || 0 }}人</text>
				<view class="view-all" @click="goSiteWorkers">
					<text>查看全部</text>
				</view>
			</view>
		</view>

		<!-- 操作面板 -->
		<view class="action-panel">
			<view class="action-item primary-btn" @click="goWorkHourRecord">
				<view class="action-icon">
					<u-icon name="clock" color="#FFFFFF" size="34"></u-icon>
				</view>
				<view class="action-text">记工时</view>
			</view>

			<view class="action-item plain-btn" @click="goWorkHourList">
				<view class="action-icon">
					<u-icon name="file-text" color="#2979ff" size="34"></u-icon>
				</view>
				<view class="action-text">工时记录</view>
			</view>

			<view class="action-item plain-btn" @click="goWorkHourStats">
				<view class="action-icon">
					<u-icon name="account" color="#2979ff" size="34"></u-icon>
				</view>
				<view class="action-text">工时统计</view>
			</view>
		</view>

		<!-- 工时记录日历 -->
		<view class="info-card">
			<view class="calendar-container">
				<uni-calendar
					:insert="true"
					:showMonth="true"
					:selected="info.selected"
					@change="calendarChange"
					@monthSwitch="monthSwitch" />
			</view>
		</view>

		<!-- 工地工人列表 -->
		<!-- <view class="info-card">
			<view class="card-header">
				<view>工地工人 ({{ workerCount || 0 }}人)</view>
				<view class="view-all" @click="goSiteWorkers">
					<text>查看全部</text>
				</view>
			</view>
			<scroll-view class="card-content" v-if="workers.length > 0" scroll-y>
				<view class="worker-row" v-for="(worker, index) in workers" :key="index">
					<view class="common-avatar-box">
						<u-avatar :text="worker.name.substring(0, 1)" bg-color="#188fff" size="58"></u-avatar>
					</view>
					<view class="worker-info">
						<view class="worker-name">{{ worker.name }}</view>
					</view>
				</view>
			</scroll-view>
			<view class="card-empty" v-else>
				<u-empty mode="data" text="暂无工人数据"></u-empty>
			</view>
		</view> -->

		<!-- 操作按钮区域 -->
		<view class="common-btm-btn">
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
			info: {
				lunar: true,
				range: false,
				insert: false,
				selected: [],
			},
			currentYear: new Date().getFullYear(),
			currentMonth: new Date().getMonth() + 1,
		}
	},
	onLoad(option) {
		console.log('进入工地详情页，接收到的参数:', option)

		if (option.id) {
			this.siteId = option.id
			console.log('成功设置工地ID:', this.siteId)
			this.getSiteDetail()
			this.getSiteWorkers()
			// 加载当月工时统计
			this.getMonthlyWorkHourStats()
		} else {
			console.log('未找到工地ID参数')
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
		// 日历日期变化事件
		calendarChange(e) {
			console.log('日历日期变化:', e)
			// 跳转到工时记录列表页面，并带入选中的日期
			uni.navigateTo({
				url: `/pages/worker-hour/index?siteId=${this.siteId}&date=${e.fulldate}`,
			})
		},

		// 日历月份切换事件
		monthSwitch(e) {
			console.log('日历月份切换:', e)
			// 获取新的年月信息
			this.currentYear = e.year
			this.currentMonth = e.month
			// 加载该月工时统计
			this.getMonthlyWorkHourStats()
		},

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
				})

				console.log('工地工人列表返回:', res)

				if (res.code === 0) {
					this.workers = res.data.list || []
					this.workerCount = this.workers.length
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

				console.log('准备删除工地，工地ID:', this.siteId, '类型:', typeof this.siteId)

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
				url: `/pages/site/workers?id=${this.siteId}&name=${encodeURIComponent(this.site.name)}`,
			})
		},

		// 跳转到记工时页面
		goWorkHourRecord() {
			uni.navigateTo({
				url: `/pages/worker-hour/add?siteId=${this.siteId}`,
			})
		},

		// 跳转到工时记录页面
		goWorkHourList() {
			uni.navigateTo({
				url: `/pages/worker-hour/index?siteId=${this.siteId}`,
			})
		},

		// 跳转到工时统计页面
		goWorkHourStats() {
			uni.navigateTo({
				url: `/pages/worker-hour/stats?siteId=${this.siteId}`,
			})
		},

		// 跳转到添加工人页面
		goAddWorker() {
			// 跳转到工地工人管理页面并默认打开添加工人选项卡
			uni.navigateTo({
				url: `/pages/site/workers?id=${this.siteId}&name=${encodeURIComponent(this.site.name)}&tab=1`,
			})
		},

		// 刷新页面数据
		refresh() {
			this.getSiteDetail()
			this.getSiteWorkers()
			this.getMonthlyWorkHourStats()
		},

		// 获取月度工时统计
		async getMonthlyWorkHourStats() {
			try {
				this.$showLoading('加载中...')

				// 调用云对象
				const workHourService = uniCloud.importObject('work-hour-service')
				const res = await workHourService.getMonthlyWorkHourStats({
					siteId: this.siteId,
					year: this.currentYear,
					month: this.currentMonth,
				})

				console.log('月度工时统计返回:', res)

				if (res.code === 0) {
					// 将数据转换为日历组件需要的格式
					this.processWorkHourData(res.data.list)
				} else {
					console.error('获取月度工时统计失败:', res.message)
				}
			} catch (e) {
				console.error('获取月度工时统计异常:', e)
			} finally {
				this.$hideLoading()
			}
		},

		// 处理工时数据用于日历显示
		processWorkHourData(data) {
			// 清空之前的选择
			this.info.selected = []

			// 将工时数据转换为日历组件需要的格式
			data.forEach(item => {
				this.info.selected.push({
					date: item.date, // 格式为: 2023-05-01
					info: item.totalHours + '小时',
					color: '#2979ff', // 有工时的日期使用蓝色高亮
				})
			})

			console.log('处理后的日历数据:', this.info.selected)
		},
	},
	onShow() {
		// 如果从编辑页返回，刷新数据
		if (this.siteId) {
			this.getSiteDetail()
			this.getSiteWorkers()
			this.getMonthlyWorkHourStats()
		}
	},
}
</script>

<style lang="scss" scoped>
.site-detail {
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

		.site-remark {
			font-size: 28rpx;
			color: #969799;
			display: flex;
			align-items: center;
			margin-top: 16rpx;

			.remark-icon {
				margin-right: 8rpx;
			}
		}

		.site-worker {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: 16rpx;
			font-size: 28rpx;
			color: #969799;

			.view-all {
				font-size: 28rpx;
				color: #2979ff;
				cursor: pointer;
			}
		}
	}

	.action-panel {
		background: #fff;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border-radius: 16rpx;
		overflow: hidden;
		margin: 0 24rpx 24rpx;
		padding: 24rpx;

		.action-item {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			width: 200rpx;
			height: 200rpx;
			border-radius: 12rpx;

			.action-icon {
				margin-bottom: 16rpx;
			}

			.action-text {
				font-size: 28rpx;
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
		flex: 1;
		display: flex;
		flex-direction: column;

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

		.calendar-container {
			padding: 16rpx;
		}

		.view-all {
			font-size: 28rpx;
			color: #2979ff;
			display: flex;
			align-items: center;
		}

		.card-content {
			flex: 1;
			overflow: hidden;
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
	}
}
</style>
