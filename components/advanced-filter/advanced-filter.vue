<template>
	<view class="filter-component">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<view class="filter-item" @click="showSiteFilter = true">
				<text class="filter-label">工地：</text>
				<view class="filter-value">
					<text :class="{ placeholder: !selectedSite.name }">{{ selectedSite.name || '请选择工地' }}</text>
					<text class="arrow">▼</text>
				</view>
			</view>
			<view class="filter-item" @click="showWorkerPopup = true">
				<text class="filter-label">工人：</text>
				<view class="filter-value">
					<text :class="{ placeholder: !selectedWorkers.length }">{{ selectedWorkerText }}</text>
					<text class="arrow">▼</text>
				</view>
			</view>
			<view class="filter-item" @click="showDateRangePicker = true">
				<text class="filter-label">时间段：</text>
				<view class="filter-value">
					<text :class="{ placeholder: !dateRangeText }">{{ dateRangeText || '请选择日期' }}</text>
					<text class="arrow">▼</text>
				</view>
			</view>
		</view>

		<!-- 查询按钮 -->
		<view class="query-button">
			<u-button type="primary" @click="handleQuery" :disabled="!isValid">查询统计</u-button>
		</view>

		<!-- 工地选择器 (单选) -->
		<u-select
			v-model="showSiteFilter"
			:list="siteFilterOptions"
			value-name="_id"
			label-name="name"
			@confirm="onSiteFilterConfirm"></u-select>

		<!-- 工人选择器 (多选) -->
		<u-popup v-model="showWorkerPopup" mode="bottom" border-radius="16">
			<view class="worker-popup">
				<view class="popup-header">
					<view class="popup-title">选择工人</view>
					<view class="popup-action">
						<text class="clear-btn" @click="clearWorkerSelection">清空</text>
						<text class="confirm-btn" @click="confirmWorkerSelection">确定</text>
					</view>
				</view>

				<scroll-view scroll-y class="worker-list">
					<view class="worker-all-item" @click="toggleAllWorkers">
						<u-checkbox v-model="allWorkersSelected" shape="circle" :disabled="workerFilterOptions.length === 0">
							全选
						</u-checkbox>
					</view>

					<view
						v-for="(worker, index) in workerFilterOptions"
						:key="worker._id"
						class="worker-item"
						@click="toggleWorker(worker)">
						<u-checkbox v-model="worker.checked" shape="circle">{{ worker.name }}</u-checkbox>
					</view>
				</scroll-view>
			</view>
		</u-popup>

		<!-- 日期范围选择器 -->
		<u-calendar v-model="showDateRangePicker" mode="range" @change="onDateRangeChange"></u-calendar>
	</view>
</template>

<script>
import dayjs from 'dayjs'

export default {
	name: 'AdvancedFilter',

	props: {
		// 默认选中的工地id
		defaultSiteId: {
			type: String,
			default: '',
		},
		// 默认选中的工人id列表
		defaultWorkerIds: {
			type: Array,
			default: () => [],
		},
		// 默认选中的开始日期
		defaultStartDate: {
			type: String,
			default: '',
		},
		// 默认选中的结束日期
		defaultEndDate: {
			type: String,
			default: '',
		},
		// 是否显示查询按钮
		showQueryButton: {
			type: Boolean,
			default: true,
		},
	},

	data() {
		return {
			// 筛选条件
			selectedSite: {},
			selectedWorkers: [],
			startDate: this.defaultStartDate || '',
			endDate: this.defaultEndDate || '',
			dateRangeText: '',

			// 筛选弹窗
			showSiteFilter: false,
			showWorkerPopup: false,
			showDateRangePicker: false,

			// 筛选选项
			siteFilterOptions: [],
			workerFilterOptions: [],
		}
	},

	computed: {
		// 显示已选工人文本
		selectedWorkerText() {
			if (this.selectedWorkers.length === 0) {
				return '请选择工人'
			} else if (this.selectedWorkers.length === 1) {
				return this.selectedWorkers[0].name
			} else {
				return `已选${this.selectedWorkers.length}人`
			}
		},
		allWorkersSelected() {
			for (const worker of this.workerFilterOptions) {
				if (!worker.checked) {
					return false
				}
			}
			return true
		},
		// 验证是否可以查询
		isValid() {
			return this.selectedSite._id && this.selectedWorkers.length > 0 && this.startDate && this.endDate
		},
	},

	created() {
		this.loadFilterOptions()
	},

	methods: {
		// 加载筛选选项
		async loadFilterOptions() {
			this.$showLoading()

			try {
				// 加载工地列表
				const siteService = uniCloud.importObject('site-service')
				const siteRes = await siteService.getSiteList({ keyword: '' })

				console.log('siteRes', siteRes)

				if (siteRes.code === 0 && siteRes.data.list) {
					this.siteFilterOptions = siteRes.data.list

					// 设置默认选中的工地
					if (this.defaultSiteId) {
						const site = siteRes.data.list.find(item => item._id === this.defaultSiteId)
						if (site) {
							this.selectedSite = { _id: site._id, name: site.name }
						}
					}
				}

				// 加载工人列表
				const workerService = uniCloud.importObject('worker-service')
				const workerRes = await workerService.getWorkerList({ keyword: '' })

				if (workerRes.code === 0 && workerRes.data.list) {
					this.workerFilterOptions = workerRes.data.list.map(item => {
						item.checked = false
						return item
					})

					// 初始化工人选择状态
					this.initWorkerSelection()
				}

				// 设置默认日期范围文本
				this.updateDateRangeText()
			} catch (e) {
				console.error('加载筛选选项失败:', e)
				uni.showToast({
					title: '加载筛选选项失败',
					icon: 'none',
				})
			} finally {
				this.$hideLoading()
			}
		},

		// 初始化工人选择状态
		initWorkerSelection() {
			this.workerFilterOptions.forEach(worker => {
				if (this.defaultWorkerIds.includes(worker._id)) {
					this.$set(worker, 'checked', true)
				}
			})
		},

		// 工地筛选确认
		onSiteFilterConfirm(e) {
			console.log(e)
			if (e.length > 0) {
				const siteId = e[0].value
				const site = this.siteFilterOptions.find(item => item._id === siteId)
				this.selectedSite = { _id: siteId, name: site ? site.name : '' }
			}

			// 触发筛选变更事件
			this.emitFilterChange()
		},

		// 切换单个工人选中状态
		toggleWorker(worker) {
			this.$set(worker, 'checked', !worker.checked)
		},

		// 切换全选状态
		toggleAllWorkers() {
			let flag = this.allWorkersSelected
			this.workerFilterOptions.forEach(worker => {
				this.$set(worker, 'checked', !flag)
			})
		},

		// 清空工人选择
		clearWorkerSelection() {
			this.workerFilterOptions.forEach(worker => {
				this.$set(worker, 'checked', false)
			})
		},

		// 确认工人选择
		confirmWorkerSelection() {
			// 更新选中的工人数组
			this.updateSelectedWorkers()

			// 关闭弹窗
			this.showWorkerPopup = false

			// 触发筛选变更事件
			this.emitFilterChange()
		},

		// 更新选中的工人数组
		updateSelectedWorkers() {
			this.selectedWorkers = this.workerFilterOptions.filter(item => item.checked)
		},

		// 日期范围选择回调
		onDateRangeChange(e) {
			if (e.startDate && e.endDate) {
				this.startDate = e.startDate
				this.endDate = e.endDate

				// 更新显示文本
				this.updateDateRangeText()

				// 触发筛选变更事件
				this.emitFilterChange()
			}
		},

		// 更新日期范围显示文本
		updateDateRangeText() {
			if (!this.startDate || !this.endDate) {
				this.dateRangeText = ''
				return
			}

			// 格式化显示文本
			if (this.startDate === this.endDate) {
				this.dateRangeText = dayjs(this.startDate).format('YYYY/MM/DD')
			} else {
				this.dateRangeText = `${dayjs(this.startDate).format('YYYY/MM/DD')} 至 ${dayjs(this.endDate).format(
					'YYYY/MM/DD',
				)}`
			}
		},

		// 触发筛选变更事件
		emitFilterChange() {
			// 构建筛选条件对象
			const filterParams = {
				selectedSite: this.selectedSite,
				selectedWorkers: this.selectedWorkers,
				startDate: this.startDate,
				endDate: this.endDate,
			}

			// 触发筛选变更事件
			this.$emit('change', filterParams)
		},

		// 点击查询按钮
		handleQuery() {
			this.$emit('search', {
				selectedSite: this.selectedSite,
				selectedWorkers: this.selectedWorkers,
				startDate: this.startDate,
				endDate: this.endDate,
			})
		},

		reset() {
			this.selectedSite = {}
			this.clearWorkerSelection()
			this.updateSelectedWorkers()
			this.startDate = ''
			this.endDate = ''
			this.dateRangeText = ''

			// 触发筛选变更事件
			this.emitFilterChange()
		},
	},
}
</script>

<style lang="scss" scoped>
.filter-component {
	width: 100%;
}

.filter-bar {
	background-color: #ffffff;
	padding: 20rpx 30rpx;
	display: flex;
	flex-direction: column;
	border-bottom: 1px solid #ebedf0;
}

.filter-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 28rpx;
	color: #646566;
	margin-bottom: 30rpx;
	padding: 20rpx 0;
	border-bottom: 1px solid #f5f5f5;
}

.filter-item:last-child {
	margin-bottom: 0;
	border-bottom: none;
}

.filter-label {
	margin-right: 8rpx;
}

.filter-value {
	color: #323233;
	display: flex;
	align-items: center;

	.placeholder {
		color: #c8c9cc;
	}
}

.arrow {
	color: #c8c9cc;
	margin-left: 4rpx;
	font-size: 24rpx;
}

.query-button {
	padding: 20rpx 30rpx;
	background-color: #ffffff;
	border-bottom: 1px solid #ebedf0;
}

.worker-popup {
	background-color: #ffffff;
	height: 800rpx;
	display: flex;
	flex-direction: column;
}

.popup-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1px solid #ebedf0;
}

.popup-title {
	font-size: 32rpx;
	font-weight: 500;
	color: #323233;
}

.popup-action {
	display: flex;
	align-items: center;
}

.clear-btn {
	font-size: 28rpx;
	color: #969799;
	margin-right: 30rpx;
}

.confirm-btn {
	font-size: 28rpx;
	color: #2979ff;
	font-weight: 500;
}

.worker-list {
	flex: 1;
	padding: 0 30rpx;
	height: calc(100% - 94rpx);
}

.worker-all-item {
	padding: 30rpx 0;
	border-bottom: 1px solid #ebedf0;
}

.worker-item {
	padding: 24rpx 0;
	border-bottom: 1px solid #ebedf0;
}

.worker-item:last-child {
	border-bottom: none;
}
</style>
