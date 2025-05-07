<template>
	<view class="container common-page-container">
		<!-- 使用高级筛选组件 -->
		<advanced-filter :defaultSiteId="siteId" @search="loadStatistics"></advanced-filter>

		<!-- 统计结果 -->
		<view class="content" v-if="statisticsList.length > 0">
			<view class="result-container">
				<view class="result-header">
					<text>统计结果 (共{{ statisticsList.length }}人)</text>
					<text class="result-value">总计：{{ formatTotalHours(totalHours) }}</text>
				</view>

				<view class="result-table">
					<view class="table-header">
						<view class="th">工人</view>
						<view class="th text-right">总工时</view>
					</view>
					<view class="table-body">
						<view class="table-row" v-for="item in statisticsList" :key="item._id">
							<view class="worker-cell">
								<view class="avatar">{{ item.workerName.substring(0, 1) }}</view>
								<text class="worker-name">{{ item.workerName }}</text>
							</view>
							<view class="total-hours text-right">{{ formatHours(item.totalHours) }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-wrapper" v-else>
			<u-empty mode="data" text="暂无符合条件的工时统计"></u-empty>
		</view>
	</view>
</template>

<script>
import dayjs from 'dayjs'
import { redirectToLogin } from '@/utils'
export default {
	data() {
		return {
			siteId: '',
			// 统计数据
			statisticsList: [],
			totalHours: 0,
		}
	},

	onLoad(option) {
		// 如果有工地ID参数，则保存
		if (option.siteId) {
			this.siteId = option.siteId
		}
	},

	methods: {
		// 加载统计数据
		async loadStatistics(params) {
			console.log('统计查询参数:', params)

			if (!params.selectedSite._id || !params.selectedWorkers.length || !params.startDate || !params.endDate) {
				return
			}

			this.$showLoading()

			try {
				// 导入工时服务云对象
				const workHourService = uniCloud.importObject('work-hour-service')

				// 构建请求参数
				const requestParams = {
					siteId: params.selectedSite._id,
					workerId: params.selectedWorkers.map(worker => worker._id).join(','),
					startDate: params.startDate,
					endDate: params.endDate,
				}

				// 请求统计数据
				const res = await workHourService.getWorkHourStats(requestParams)
				console.log('工时统计返回:', res)

				if (res.code === 0) {
					this.statisticsList = res.data.list
					this.totalHours = res.data.total?.totalHours || 0
				} else {
					throw new Error(res.message || '获取工时统计失败')
				}
			} catch (e) {
				console.log('加载工时统计失败:', e)
				if (e.code === 401 || e.code === 403) {
					redirectToLogin()
				}
			} finally {
				this.$hideLoading()
			}
		},

		// 格式化工时
		formatHours(hours) {
			if (hours === undefined || hours === null) return ''

			// 如果可以被8整除，显示为天数
			if (hours % 8 === 0) {
				const days = hours / 8
				return `${days}天`
			}

			// 如果有整天，则显示天数和小时
			if (hours > 8) {
				const days = Math.floor(hours / 8)
				const remainingHours = hours % 8
				if (remainingHours === 0) {
					return `${days}天`
				}
				return `${days}天${remainingHours}小时`
			}

			return `${hours}小时`
		},

		// 格式化总工时
		formatTotalHours(hours) {
			if (hours === undefined || hours === null) return ''

			const days = Math.floor(hours / 8)
			const remainingHours = hours % 8

			if (days === 0) {
				return `${hours}小时`
			}

			if (remainingHours === 0) {
				return `${days}天`
			}

			return `${days}天${remainingHours}小时`
		},
	},
}
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
}

.content {
	flex: 1;
	padding-bottom: 30rpx;
}

.result-container {
	margin-top: 24rpx;
}

.result-header {
	padding: 20rpx 30rpx;
	font-size: 28rpx;
	color: #969799;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.result-value {
	color: #2979ff;
	font-weight: 500;
}

.result-table {
	background-color: #ffffff;
}

.table-header {
	display: flex;
	align-items: center;
	height: 88rpx;
	background-color: #f7f8fa;
	border-bottom: 1px solid #ebedf0;
}

.th {
	flex: 1;
	padding: 0 30rpx;
	font-size: 28rpx;
	color: #646566;
}

.table-row {
	display: flex;
	padding: 24rpx 30rpx;
	border-bottom: 1px solid #ebedf0;
}

.table-row:last-child {
	border-bottom: none;
}

.worker-cell {
	flex: 1;
	display: flex;
	align-items: center;
}

.avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: #2979ff;
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	margin-right: 16rpx;
	font-size: 24rpx;
}

.worker-name {
	font-size: 28rpx;
	color: #323233;
}

.total-hours {
	flex: 1;
	font-size: 28rpx;
	color: #2979ff;
	font-weight: 500;
}

.empty-wrapper {
	padding: 120rpx 0;
}
</style>
