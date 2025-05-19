<template>
	<view class="container common-page-container has-btm-btn">
		<!-- 表单内容 -->
		<view class="form-group">
			<u-cell-group>
				<!-- 工地选择 -->
				<u-cell-item
					title="工地"
					:value="siteInfo.name || '请选择工地'"
					:arrow="!isEdit"
					@click="!isEdit && (showSitePicker = true)"
					:border-bottom="true">
					<text slot="icon" class="required-icon">*</text>
				</u-cell-item>

				<!-- 日期选择 -->
				<u-cell-item
					title="日期"
					:value="date || '请选择日期'"
					:arrow="true"
					@click="showDatePicker = true"
					:border-bottom="true">
					<text slot="icon" class="required-icon">*</text>
				</u-cell-item>

				<!-- 工时单位 -->
				<u-cell-item title="工时单位" :arrow="false" :border-bottom="true">
					<text slot="icon" class="required-icon">*</text>
					<view slot="right-icon" class="radio-group">
						<u-radio-group v-model="timeUnit" placement="row" @change="watchTimeUnit">
							<u-radio name="day" shape="circle">按工</u-radio>
							<u-radio name="hour" shape="circle">按小时</u-radio>
						</u-radio-group>
					</view>
				</u-cell-item>

				<!-- 工时数量 -->
				<u-cell-item title="工时数量" :arrow="false" :border-bottom="false">
					<text slot="icon" class="required-icon">*</text>
					<view slot="right-icon" class="number-input">
						<u-number-box
							v-model="hoursValue"
							:min="0"
							:max="timeUnit === 'day' ? 1 : 24"
							:step="1"
							:positive-integer="false"
							disabled-input
							:input-width="120"
							@change="onHoursChange"></u-number-box>
						<text class="unit-text">{{ timeUnit === 'day' ? '工' : '小时' }}</text>
					</view>
				</u-cell-item>
			</u-cell-group>
		</view>

		<!-- 选择工人部分 -->
		<view class="worker-section">
			<view class="section-title">
				<template v-if="isEdit">已选工人</template>
				<template v-else>选择工人（已选 {{ selectedWorkers.length }} 人）</template>
			</view>

			<view class="worker-list">
				<!-- 加载中提示 -->
				<view v-if="loading" class="u-text-center u-padding-20">
					<u-loading></u-loading>
				</view>
				<!-- 无数据提示 -->
				<view v-else-if="workerList.length === 0" class="u-text-center u-padding-20">
					<u-empty mode="list" text="暂无工人信息"></u-empty>
				</view>
				<!-- 工人列表 -->
				<scroll-view class="worker-list-scroll" v-else scroll-y>
					<template v-if="isEdit">
						<!-- 编辑模式下只显示已选工人 -->
						<view v-for="(item, index) in selectedWorkers" :key="item._id" class="worker-item">
							<view class="worker-content">
								<view class="avatar">{{ item.name ? item.name.substr(0, 1) : '' }}</view>
								<view class="info">
									<view class="name">{{ item.name }}</view>
									<view class="phone">{{ item.phone || '' }}</view>
								</view>
							</view>
						</view>
					</template>
					<template v-else>
						<!-- 新增模式下可选择工人 -->
						<view
							v-for="(item, index) in workerList"
							:key="item._id"
							class="worker-item"
							@click="toggleWorker(item._id)">
							<view class="worker-checkbox">
								<u-checkbox
									v-model="workerSelected[item._id]"
									shape="circle"
									@change="checkboxChange(item._id, $event)"></u-checkbox>
							</view>
							<view class="worker-content">
								<view class="avatar">{{ item.name ? item.name.substr(0, 1) : '' }}</view>
								<view class="info">
									<view class="name">{{ item.name }}</view>
									<view class="phone">{{ item.phone || '' }}</view>
								</view>
							</view>
						</view>
					</template>
				</scroll-view>
			</view>
		</view>

		<!-- 底部按钮 -->
		<view class="common-btm-btn">
			<template v-if="isEdit">
				<u-button type="error" plain :loading="submitting" @click="handleDelete">删除记录</u-button>
				<u-button type="primary" :loading="submitting" @click="handleSubmit">保存修改</u-button>
			</template>
			<u-button v-else type="primary" :loading="submitting" @click="handleSubmit">保存记录</u-button>
		</view>

		<!-- 工地选择弹窗 -->
		<u-select
			v-model="showSitePicker"
			:list="siteList"
			:default-value="[defaultSiteIndex]"
			value-name="_id"
			label-name="name"
			@confirm="onSiteConfirm"></u-select>

		<!-- 日期选择器 -->
		<!-- TODO：uView v1不支持默认日期。解决办法：复制一份源码为公共组件，修改增加默认日期功能 -->
		<u-calendar v-model="showDatePicker" mode="date" :default-date="date" @change="onDateChange"></u-calendar>
	</view>
</template>

<script>
import dayjs from 'dayjs'
import { convertHoursToWorkDays } from '@/utils'
const app = getApp()
export default {
	data() {
		return {
			// 编辑模式标识
			isEdit: false,
			recordId: '',

			// 工地相关
			siteId: '',
			siteInfo: {},
			siteList: [],
			showSitePicker: false,
			defaultSiteIndex: 0,

			// 日期相关
			date: '',
			showDatePicker: false,
			dayUnit: app.globalData.dayUnit,

			// 工时相关
			timeUnit: 'day', // 改为字符串类型: 'day'和'hour'
			hoursValue: 1, // 改为数值类型

			// 工人相关
			loading: false,
			workerList: [],
			selectedWorkerIds: [],
			selectedWorkers: [],
			workerSelected: {}, // 工人是否被选中的映射对象

			// 表单提交状态
			submitting: false,
		}
	},
	onLoad(option) {
		// 编辑模式
		if (option._id) {
			// 编辑模式
			this.isEdit = true
			this.recordId = option._id
			this.siteId = option.siteId
			this.date = option.date

			// 计算工时单位和值
			const hours = parseFloat(option.hours)
			if (hours % this.dayUnit === 0) {
				this.timeUnit = 'day' // 按天
				this.hoursValue = hours / this.dayUnit
			} else {
				this.timeUnit = 'hour' // 按小时
				this.hoursValue = hours
			}

			// 设置选中的工人
			if (option.workerId) {
				this.selectedWorkerIds = [option.workerId]
			}
		}

		if (option.siteId) {
			this.siteId = option.siteId
		}

		// 初始化日期为今天（如果没有传入日期）
		if (!this.date) {
			const today = new Date()
			this.date = dayjs(today).format('YYYY-MM-DD')
		}

		// 加载数据
		this.loadData()
	},
	methods: {
		// 初始化数据
		async loadData() {
			this.$showLoading('加载中...')

			try {
				await Promise.all([this.getSiteList(), this.siteId ? this.getWorkersBySite() : Promise.resolve()])
			} catch (e) {
				this.$showToast.none('数据加载失败')
				console.log('加载数据失败:', e)
			} finally {
				this.$hideLoading()
			}
		},

		// 获取工地列表
		async getSiteList() {
			try {
				// 导入站点服务云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteList({
					keyword: '',
				})

				console.log('工地列表返回:', res)

				if (res.code === 0 && res.data.list) {
					this.siteList = res.data.list

					if (this.siteId) {
						this.siteInfo = this.siteList.filter(site => site._id === this.siteId)[0] || {}
					}
				} else {
					throw new Error(res.message || '获取工地列表失败')
				}
			} catch (e) {
				console.log('获取工地列表失败:', e)
				throw e
			}
		},

		// 获取工地信息
		// async getSiteInfo() {
		// 	if (!this.siteId) return

		// 	try {
		// 		// 导入站点服务云对象
		// 		const siteService = uniCloud.importObject('site-service')
		// 		const res = await siteService.getSiteDetail({
		// 			siteId: this.siteId,
		// 		})

		// 		console.log('工地详情返回:', res)

		// 		if (res.code === 0 && res.data) {
		// 			this.siteInfo = res.data
		// 		} else {
		// 			throw new Error(res.message || '获取工地信息失败')
		// 		}
		// 	} catch (e) {
		// 		console.log('获取工地信息失败:', e)
		// 		this.$showToast.none('获取工地信息失败')
		// 	}
		// },

		// 获取工地关联的工人列表
		async getWorkersBySite() {
			if (!this.siteId) return

			this.loading = true
			this.workerList = []

			// 编辑模式下保留已选工人
			if (!this.isEdit) {
				this.selectedWorkerIds = []
				this.selectedWorkers = []
			}
			this.workerSelected = {}

			try {
				// 导入站点服务云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteWorkers({
					siteId: this.siteId,
					keyword: '',
				})

				console.log('工地工人列表返回:', res)

				if (res.code === 0 && res.data.list) {
					this.workerList = res.data.list

					// 初始化工人选择状态
					this.workerList.forEach(worker => {
						// 编辑模式下，设置已选工人的选中状态
						const isSelected = this.isEdit ? this.selectedWorkerIds.includes(worker._id) : false
						this.$set(this.workerSelected, worker._id, isSelected)
					})

					// 编辑模式下，更新已选工人列表
					if (this.isEdit) {
						this.updateSelectedWorkers()
					}
				} else {
					throw new Error(res.message || '获取工人列表失败')
				}
			} catch (e) {
				console.log('获取工人列表失败:', e)
				this.$showToast.none('获取工人列表失败')
			} finally {
				this.loading = false
			}
		},

		// 选择工地回调
		onSiteConfirm(e) {
			console.log(e)
			if (e.length > 0) {
				const selectedSiteId = e[0]?.value || ''
				// 如果选择了新的工地，清空已选工人
				if (this.siteId !== selectedSiteId) {
					this.selectedWorkerIds = []
					this.selectedWorkers = []
					this.workerSelected = {}
				}

				this.siteId = selectedSiteId
				this.siteInfo = this.siteList.filter(item => item._id === selectedSiteId)[0]
				this.defaultSiteIndex = this.siteList.findIndex(item => item._id === selectedSiteId)
				// 重新获取工地关联的工人
				this.getWorkersBySite()
			}
		},

		// 日期选择回调
		// {
		//   day: 4, // 选择了哪一天
		//   days: 30, // 这个月份有多少天
		//   isToday: true, // 选择的日期是否今天
		//   month: 6, // 选择的月份
		//   result: "2020-06-04", // 选择的日期整体值
		//   week: "星期四", // 选择日期所属的星期数
		//   year: 2020 , // 选择的年份
		// }
		onDateChange(e) {
			console.log('日期选择回调', e)
			this.date = e.result
		},

		// 点击工人项切换选择状态
		toggleWorker(workerId) {
			// 使用 $set 确保响应式更新
			this.$set(this.workerSelected, workerId, !this.workerSelected[workerId])
			this.updateSelectedWorkers()
		},

		// 复选框选中状态改变事件
		checkboxChange(workerId, checked) {
			this.$set(this.workerSelected, workerId, checked)
			this.updateSelectedWorkers()
		},

		// 更新已选工人数组
		updateSelectedWorkers() {
			this.selectedWorkerIds = Object.keys(this.workerSelected).filter(id => this.workerSelected[id])
			this.selectedWorkers = this.workerList.filter(worker => this.selectedWorkerIds.includes(worker._id))
		},

		// 工时单位切换
		watchTimeUnit(value) {
			// 自动调整工时值以适应新的单位
			if (value === 'day' && this.hoursValue > 1) {
				// 从小时切换到天，如果超过1天，则设为1天
				this.hoursValue = 1
			} else if (value === 'day' && this.hoursValue * this.dayUnit > 24) {
				// 如果换算后超过24小时，则调整
				this.hoursValue = 1
			}
		},

		// 工时数量改变事件
		onHoursChange(e) {
			console.log('工时值改变:', e.value)
		},

		// 处理删除
		handleDelete() {
			uni.showModal({
				title: '删除确认',
				content: '确定要删除这条工时记录吗？',
				confirmColor: '#fa3534',
				success: async res => {
					if (res.confirm) {
						await this.deleteWorkHour(this.recordId)
					}
				},
			})
		},

		// 删除工时记录
		async deleteWorkHour(workHourId) {
			this.$showLoading('删除中...')
			this.submitting = true

			try {
				// 导入工时服务云对象
				const workHourService = uniCloud.importObject('work-hour-service')

				// 调用删除方法
				const res = await workHourService.deleteWorkHour({ workHourId })

				if (res.code === 0) {
					this.$showToast.success('删除成功')

					if (this.isEdit) {
						uni.$emit('needRefresh')
					}
					// 返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
				} else {
					throw new Error(res.message || '删除失败')
				}
			} catch (e) {
				console.log('删除工时记录失败:', e)
				this.$showToast.error(e.message || '删除失败')
			} finally {
				this.$hideLoading()
				this.submitting = false
			}
		},

		// 保存工时记录
		async handleSubmit() {
			// 表单验证
			if (!this.siteId) {
				return this.$showToast.none('请选择工地')
			}

			if (!this.date) {
				return this.$showToast.none('请选择日期')
			}

			if (this.hoursValue <= 0) {
				return this.$showToast.none('请输入有效的工时')
			}

			if (this.selectedWorkerIds.length === 0) {
				return this.$showToast.none('请至少选择一名工人')
			}

			this.submitting = true
			this.$showLoading('保存中...')

			try {
				// 转换工时值
				// 如果是按天，转换为小时
				const hours = this.timeUnit === 'day' ? this.hoursValue * this.dayUnit : this.hoursValue

				let params = {
					siteId: this.siteId,
					workerId: this.isEdit ? this.selectedWorkerIds[0] : this.selectedWorkerIds.join(','),
					date: this.date,
					hours: hours,
				}

				// 编辑模式添加记录ID
				if (this.isEdit) {
					params._id = this.recordId
				}

				console.log('保存工时参数:', params)

				// 导入工时服务云对象
				const workHourService = uniCloud.importObject('work-hour-service')

				// 调用云对象保存记录
				const res = await workHourService.saveWorkHours(params)

				console.log('保存工时返回:', res)

				if (res.code === 0) {
					this.$hideLoading()
					// 显示成功提示
					this.$showToast.none(`记录成功`)

					if (this.isEdit) {
						uni.$emit('needRefresh')
					}

					// 返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
				} else {
					throw new Error(res.message || '保存失败')
				}
			} catch (e) {
				console.log('保存工时记录失败:', e)
				this.$showToast.error(e.message || '保存失败')
			} finally {
				this.$hideLoading()
				this.submitting = false
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;

	&.common-page-container {
		padding-bottom: 184rpx;
	}
}

.form-group {
	margin-top: 15rpx;
	background-color: #ffffff;
}

.required-icon {
	color: #fa3534;
	padding-right: 8rpx;
}

.radio-group {
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
}

.number-input {
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.unit-text {
	margin-left: 10rpx;
	color: #666;
}

.worker-section {
	margin-top: 30rpx;
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.section-title {
	padding: 20rpx 30rpx;
	font-size: 28rpx;
	color: #909399;
}

.worker-list {
	background-color: #ffffff;
	padding: 0 20rpx;
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	.worker-list-scroll {
		flex: 1;
		overflow: hidden;
	}
}

.worker-item {
	padding: 24rpx 0;
	border-bottom: 1px solid #ebeef5;
	display: flex;
	align-items: center;
}

.worker-item:last-child {
	border-bottom: none;
}

.worker-checkbox {
	margin-right: 10rpx;
}

.worker-content {
	flex: 1;
	display: flex;
	align-items: center;
}

.avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background-color: #2979ff;
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: bold;
	margin-right: 20rpx;
}

.info {
	flex: 1;
}

.name {
	font-size: 30rpx;
	font-weight: 500;
	color: #303133;
	margin-bottom: 8rpx;
}

.phone {
	font-size: 24rpx;
	color: #909399;
}

.footer {
	padding: 30rpx;
	background-color: #ffffff;
	position: sticky;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 100;
	box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}
</style>
