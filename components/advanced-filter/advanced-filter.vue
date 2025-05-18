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
					<text :class="{ placeholder: !selectedWorkers.length && !isAllWorkersMode }">{{ selectedWorkerText }}</text>
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
		<u-picker
			v-model="showSiteFilter"
			:list="siteFilterOptions"
			value-name="_id"
			:default-value="defaultSiteIndexArray"
			label-name="name"
			@confirm="onSiteFilterConfirm"></u-picker>

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
			startDate: '',
			endDate: '',
			dateRangeText: '',

			// 筛选弹窗
			showSiteFilter: false,
			showWorkerPopup: false,
			showDateRangePicker: false,

			// 筛选选项
			siteFilterOptions: [],
			workerFilterOptions: [],

			// 是否选择全部工人
			isAllWorkersMode: true,
		}
	},

	computed: {
		// 显示已选工人文本
		selectedWorkerText() {
			if (this.isAllWorkersMode) {
				return '全部工人'
			} else if (this.selectedWorkers.length === 0) {
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
			return this.selectedSite._id && this.startDate && this.endDate
		},
		// 默认选中的工地索引
		defaultSiteIndexArray() {
			const index = this.siteFilterOptions.findIndex(item => item._id === this.defaultSiteId)
			return index !== -1 ? [index] : []
		},
	},

	created() {
		console.log('Advanced-Filter 组件创建，默认日期：', this.defaultStartDate, this.defaultEndDate)
		this.loadSiteOptions()
		// 初始化时不再加载所有工人，等待工地选择后再加载
		// 设置默认日期范围文本
		this.startDate = this.defaultStartDate || dayjs().format('YYYY-MM-DD')
		this.endDate = this.defaultEndDate || dayjs().format('YYYY-MM-DD')
		console.log('设置后的日期范围:', this.startDate, this.endDate)
		this.updateDateRangeText() // 确保调用此方法更新日期显示
		console.log('日期范围文本:', this.dateRangeText)
	},

	methods: {
		// 加载工地筛选选项
		async loadSiteOptions() {
			this.$showLoading('加载工地...')
			try {
				const siteService = uniCloud.importObject('site-service')
				const siteRes = await siteService.getSiteList({ keyword: '' })
				console.log('siteRes', siteRes)
				if (siteRes.code === 0 && siteRes.data.list) {
					this.siteFilterOptions = siteRes.data.list
					// 设置默认选中的工地并加载对应工人
					if (this.defaultSiteId) {
						const site = siteRes.data.list.find(item => item._id === this.defaultSiteId)
						if (site) {
							this.selectedSite = { _id: site._id, name: site.name }
							await this.loadWorkersBySite(this.defaultSiteId) // 加载该工地的工人
						}
					} else {
						// 如果没有默认工地，清空工人列表和选中状态
						this.workerFilterOptions = []
						this.selectedWorkers = []
					}
				}
			} catch (e) {
				console.error('加载工地选项失败:', e)
				this.$showToast.none('加载工地选项失败')
			} finally {
				this.$hideLoading()
			}
		},

		// 根据工地ID加载工人筛选选项
		async loadWorkersBySite(siteId) {
			if (!siteId) {
				this.workerFilterOptions = []
				this.selectedWorkers = []
				this.isAllWorkersMode = true // 没有工地时，默认为全部工人模式
				this.initWorkerSelection() // 清空工人选择时也应初始化
				return
			}
			this.$showLoading('加载工人...')
			try {
				const siteService = uniCloud.importObject('site-service')
				const workerRes = await siteService.getSiteWorkers({ siteId })
				console.log('workerRes by siteId', siteId, workerRes)
				if (workerRes.code === 0 && workerRes.data.list) {
					this.workerFilterOptions = workerRes.data.list.map(item => {
						item.checked = false // 重置选中状态
						return item
					})
					// 初始化工人选择状态 (加载默认选中)
					this.initWorkerSelection()
					// 如果之前有选中的工人，需要根据新的工人列表重新匹配，但这里通常是清空后重新选择
					// this.updateSelectedWorkers() // 确保 selectedWorkers 也更新
				} else {
					this.workerFilterOptions = []
					this.$showToast.none(workerRes.message || '加载工人列表失败')
				}
			} catch (e) {
				console.error('加载工人列表失败:', e)
				this.$showToast.none('加载工人列表失败')
				this.workerFilterOptions = []
			} finally {
				this.$hideLoading()
				// 加载完工人后，确保 selectedWorkers 与实际勾选一致
				this.updateSelectedWorkers() // 更新selectedWorkers数组
				this.emitFilterChange() // 工人列表变化也触发一次change
			}
		},

		// 初始化工人选择状态
		initWorkerSelection() {
			// 如果没有工人选项，直接返回
			if (!this.workerFilterOptions || this.workerFilterOptions.length === 0) {
				this.selectedWorkers = []
				return
			}
			this.workerFilterOptions.forEach(worker => {
				// 检查 defaultWorkerIds 中是否包含当前工人ID，且当前选定工地与默认工地ID一致时才自动勾选
				// 或者，如果不是初始加载，则根据 selectedWorkers 恢复勾选状态 (适用于切换工地后重新打开popup)
				const isDefaultWorker =
					this.defaultWorkerIds.includes(worker._id) && this.selectedSite._id === this.defaultSiteId
				const isPreviouslySelected = this.selectedWorkers.some(sw => sw._id === worker._id)

				this.$set(worker, 'checked', isDefaultWorker || isPreviouslySelected)
			})
			this.updateSelectedWorkers() // 更新一下selectedWorkers数组
		},

		// 工地筛选确认
		async onSiteFilterConfirm(e) {
			console.log('工地筛选确认:', e)
			let newSiteId = ''
			let newSiteName = ''
			if (e.length > 0) {
				newSiteId = e[0].value
				const site = this.siteFilterOptions.find(item => item._id === newSiteId)
				newSiteName = site ? site.name : ''
			}

			// 只有当工地实际发生变化时才重新加载工人并清空工人选择
			if (this.selectedSite._id !== newSiteId) {
				this.selectedSite = { _id: newSiteId, name: newSiteName }
				this.selectedWorkers = [] // 清空已选工人
				this.clearWorkerSelectionInternal() // 清空勾选状态
				await this.loadWorkersBySite(newSiteId) // 根据新工地加载工人
			} else if (!newSiteId) {
				// 如果清空了工地选择
				this.selectedSite = {}
				this.selectedWorkers = []
				this.workerFilterOptions = []
				this.clearWorkerSelectionInternal()
			}
			// 触发筛选变更事件
			this.emitFilterChange()
		},

		// 切换单个工人选中状态
		toggleWorker(worker) {
			this.$set(worker, 'checked', !worker.checked)
			// this.updateSelectedWorkers() // 实时更新selectedWorkers，或者在confirm时更新
		},

		// 切换全选状态
		toggleAllWorkers() {
			let flag = this.allWorkersSelected
			this.workerFilterOptions.forEach(worker => {
				this.$set(worker, 'checked', !flag)
			})
			// this.updateSelectedWorkers()
		},

		// 清空工人选择（用户操作）
		clearWorkerSelection() {
			this.clearWorkerSelectionInternal()
			// this.updateSelectedWorkers() // 立即更新，或者在confirm时更新
		},

		// 内部清空工人勾选状态的方法
		clearWorkerSelectionInternal() {
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
			// 当没有选择任何工人时，自动切换到全部工人模式
			this.isAllWorkersMode = this.selectedWorkers.length === 0
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
				selectedWorkers: this.isAllWorkersMode ? [] : this.selectedWorkers, // 全部工人模式时传递空数组
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
				selectedWorkers: this.isAllWorkersMode ? [] : this.selectedWorkers, // 全部工人模式时传递空数组
				startDate: this.startDate,
				endDate: this.endDate,
			})
		},

		reset() {
			this.selectedSite = {}
			this.clearWorkerSelectionInternal() // 使用内部方法清空勾选
			this.updateSelectedWorkers() // 更新selectedWorkers数组
			this.workerFilterOptions = [] // 重置时清空工人选项
			this.startDate = ''
			this.endDate = ''
			this.dateRangeText = ''

			// 触发筛选变更事件
			this.emitFilterChange()
		},
	},

	watch: {
		// 监听默认日期变化
		defaultStartDate(newVal) {
			console.log('defaultStartDate变化:', newVal)
			if (newVal) {
				this.startDate = newVal
				this.updateDateRangeText()
			}
		},
		defaultEndDate(newVal) {
			console.log('defaultEndDate变化:', newVal)
			if (newVal) {
				this.endDate = newVal
				this.updateDateRangeText()
			}
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
