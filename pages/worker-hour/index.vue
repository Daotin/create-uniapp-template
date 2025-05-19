<template>
	<view class="container common-page-container">
		<!-- 使用自定义筛选组件 -->
		<advanced-filter
			:defaultSiteId="siteId"
			:defaultStartDate="filterParams.startDate"
			:defaultEndDate="filterParams.endDate"
			@search="loadWorkHourList"></advanced-filter>

		<!-- 工时记录列表 -->
		<view class="work-hour-list" v-if="workHourGroups.length > 0">
			<view class="date-group" v-for="group in workHourGroups" :key="group.date">
				<view class="date-header">
					<text>{{ group.dateText }}</text>
					<text class="total-hours">总计: {{ convertHoursToWorkDays(group.totalHours).workText }}</text>
				</view>
				<view class="records">
					<view
						class="record-item"
						v-for="item in group.records"
						:key="item._id"
						@click="handleItemClick(item)"
						@longpress="handleItemLongPress(item)">
						<view class="record-header">
							<text class="site-name">{{ item.siteName }}</text>
							<text class="record-time">{{ formatTime(item.createTime) }}</text>
						</view>
						<view class="worker-info justify-between">
							<view class="flex items-center">
								<view class="avatar">{{ item.workerName.substring(0, 1) }}</view>
								<text class="worker-name">{{ item.workerName }}</text>
							</view>
							<text class="hours">{{ convertHoursToWorkDays(item.hours).workText }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-wrapper" v-if="workHourGroups.length === 0">
			<u-empty mode="data" text="暂无工时记录"></u-empty>
		</view>

		<!-- 操作菜单 -->
		<u-action-sheet :list="actionList" v-model="showActionSheet" @click="handleActionClick"></u-action-sheet>

		<!-- 悬浮按钮 -->
		<!-- <view class="common-add-btn">
			<u-button type="primary" size="mini" shape="circle" @click="goToAddWorkHour">
				<u-icon name="plus" color="#FFFFFF" size="24"></u-icon>
			</u-button>
		</view> -->
	</view>
</template>

<script>
import dayjs from 'dayjs'
import { redirectToLogin } from '@/utils'
import { convertHoursToWorkDays } from '@/utils'
export default {
	data() {
		return {
			convertHoursToWorkDays,
			siteId: '',
			// 筛选条件
			filterParams: {
				selectedSite: {},
				selectedWorkers: [],
				startDate: dayjs().format('YYYY-MM-DD'),
				endDate: dayjs().format('YYYY-MM-DD'),
			},

			// 列表数据
			workHourList: [],
			workHourGroups: [],

			// 记录操作
			showActionSheet: false,
			currentRecord: null,
			actionList: [
				{
					text: '删除记录',
					color: '#fa3534',
				},
			],
		}
	},

	onLoad(option) {
		console.log('进入工时记录列表页，接收到的参数:', option)

		// 加载工时记录数据
		// setTimeout(() => {
		// 	this.loadWorkHourList()
		// }, 500)
		if (option.siteId) {
			this.siteId = option.siteId
			this.filterParams.selectedSite._id = option.siteId
			console.log('工地ID:', this.siteId)
		}

		// 如果传入了日期参数，更新筛选条件的开始日期和结束日期
		if (option.date) {
			console.log('接收到日期参数:', option.date)
			this.filterParams.startDate = option.date
			this.filterParams.endDate = option.date
			console.log('已设置筛选日期为:', this.filterParams.startDate, this.filterParams.endDate)
		}

		// 初始化加载数据，使用设置好的筛选条件
		this.loadWorkHourList()
	},

	onShow() {
		// 如果从新增页返回，刷新列表
		uni.$on('needRefresh', this.loadWorkHourList)
	},

	methods: {
		// 加载工时记录列表
		async loadWorkHourList(params) {
			console.log('加载工时记录列表', params)
			// 如果从筛选组件传入了参数，则使用传入的参数
			if (params) {
				this.filterParams = params
			}

			this.$showLoading()
			this.workHourList = []
			this.workHourGroups = []

			try {
				// 导入工时服务云对象
				const workHourService = uniCloud.importObject('work-hour-service')

				// 构建请求参数
				const requestParams = {
					siteId: this.filterParams.selectedSite?._id || '',
					workerId: this.filterParams.selectedWorkers?.map(worker => worker._id).join(',') || '', // 确保即使为空也传递空字符串
					startDate: this.filterParams.startDate,
					endDate: this.filterParams.endDate,
				}

				console.log('请求参数:', requestParams)

				// 移除参数校验，允许查询所有工人数据
				// if (!requestParams.siteId || !requestParams.workerId || !requestParams.startDate || !requestParams.endDate) {
				if (!requestParams.siteId || !requestParams.startDate || !requestParams.endDate) {
					this.$showToast.none('请求参数不正确')
					return
				}

				// 请求数据
				const res = await workHourService.getWorkHourList(requestParams)
				console.log('工时记录列表返回:', res)

				if (res.code === 0) {
					this.workHourList = res.data.list

					// 按日期分组处理数据
					this.groupWorkHourByDate()
				} else {
					throw new Error(res.message || '获取工时记录失败')
				}
			} catch (e) {
				console.log('加载工时记录失败:', e)
				if (e.code === 401 || e.code === 403) {
					redirectToLogin()
				}
			} finally {
				this.$hideLoading()
			}
		},

		// 按日期分组处理数据
		groupWorkHourByDate() {
			// 创建日期映射
			const dateMap = new Map()

			// 将数据按日期分组
			this.workHourList.forEach(item => {
				const dateStr = dayjs(item.date).format('YYYY-MM-DD')

				if (!dateMap.has(dateStr)) {
					const today = dayjs().format('YYYY-MM-DD')
					const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

					let dateText = dayjs(dateStr).format('YYYY年M月D日')
					if (dateStr === today) {
						dateText += '（今天）'
					} else if (dateStr === yesterday) {
						dateText += '（昨天）'
					}

					dateMap.set(dateStr, {
						date: dateStr,
						dateText,
						records: [],
						totalHours: 0, // 新增总工时字段
					})
				}

				// 计算总工时
				const group = dateMap.get(dateStr)
				group.records.push(item)
				group.totalHours += Number(item.hours || 0) // 累加工时
			})

			// 转换为数组并按日期排序
			this.workHourGroups = Array.from(dateMap.values()).sort((a, b) => {
				return new Date(b.date) - new Date(a.date)
			})
		},

		// 长按工时记录项
		handleItemLongPress(item) {
			this.currentRecord = item
			this.showActionSheet = true
		},

		// 点击操作菜单项
		async handleActionClick(index) {
			if (!this.currentRecord) return

			if (index === 0) {
				// 删除记录
				// 确认删除
				uni.showModal({
					title: '删除确认',
					content: '确定要删除这条工时记录吗？',
					confirmColor: '#fa3534',
					success: async res => {
						if (res.confirm) {
							await this.deleteWorkHour(this.currentRecord._id)
						}
					},
				})
			}
		},

		// 删除工时记录
		async deleteWorkHour(workHourId) {
			uni.showLoading({
				title: '删除中...',
			})

			try {
				// 导入工时服务云对象
				const workHourService = uniCloud.importObject('work-hour-service')

				// 调用删除方法
				const res = await workHourService.deleteWorkHour({ workHourId })
				console.log('删除工时记录返回:', res)

				if (res.code === 0) {
					uni.showToast({
						title: '删除成功',
						icon: 'success',
					})

					// 重新加载数据
					this.loadWorkHourList()
				} else {
					throw new Error(res.message || '删除失败')
				}
			} catch (e) {
				console.log('删除工时记录失败:', e)
				uni.showToast({
					title: e.message || '删除失败',
					icon: 'none',
				})
			} finally {
				uni.hideLoading()
			}
		},

		// 跳转到添加工时页面
		goToAddWorkHour() {
			uni.navigateTo({
				url: '/pages/worker-hour/add',
			})
		},

		// 格式化创建时间
		formatTime(time) {
			if (!time) return ''
			return dayjs(time).format('HH:mm')
		},

		// 点击工时记录项
		handleItemClick(item) {
			uni.navigateTo({
				url: `/pages/worker-hour/add?_id=${item._id}&siteId=${item.siteId}&workerId=${item.workerId}&date=${dayjs(
					item.date,
				).format('YYYY-MM-DD')}&hours=${item.hours}`,
			})
		},
	},
}
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
}

.work-hour-list {
	padding-bottom: 120rpx;
}

.loading-wrapper,
.empty-wrapper {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60rpx 0;
}

.loading-text,
.empty-text {
	margin-top: 20rpx;
	font-size: 28rpx;
	color: #909399;
}

.date-group {
	margin-bottom: 20rpx;
}

.date-header {
	padding: 20rpx 30rpx;
	font-size: 28rpx;
	color: #969799;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.total-hours {
	color: #2979ff;
	font-weight: 500;
}

.records {
	background-color: #ffffff;
}

.record-item {
	padding: 24rpx 30rpx;
	border-bottom: 1px solid #ebedf0;
}

.record-item:last-child {
	border-bottom: none;
}

.record-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.site-name {
	flex: 1;
	font-size: 32rpx;
	font-weight: 500;
	color: #323233;
}

.record-time {
	font-size: 24rpx;
	color: #969799;
}

.worker-info {
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
	margin-right: 16rpx;
}

.hours {
	font-size: 28rpx;
	color: #2979ff;
	font-weight: 500;
}
</style>
