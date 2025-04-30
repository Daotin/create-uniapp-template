<template>
	<view class="worker-detail" v-if="worker._id">
		<!-- 工人头部信息 -->
		<view class="worker-header">
			<u-avatar
				:text="worker.name ? worker.name.substring(0, 1) : ''"
				font-size="28"
				size="70"
				bg-color="#188fff"></u-avatar>
			<view class="worker-name">{{ worker.name }}</view>
			<view class="worker-phone">{{ worker.phone || '未设置手机号' }}</view>
		</view>

		<!-- 基本信息 -->
		<view class="info-group">
			<view class="info-title">基本信息</view>
			<view class="info-content">
				<view class="info-item">
					<text class="info-label">姓名</text>
					<text class="info-value">{{ worker.name }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">手机号</text>
					<text class="info-value">{{ worker.phone || '未设置' }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">备注</text>
					<text class="info-value">{{ worker.remark || '无' }}</text>
				</view>
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
			content="确定要删除该工人吗？删除后无法恢复"
			:show-cancel-button="true"
			confirm-text="删除"
			cancel-text="取消"
			confirm-color="#fa3534"
			@confirm="deleteWorker"></u-modal>
	</view>
</template>

<script>
export default {
	data() {
		return {
			workerId: '', // 工人ID
			worker: {}, // 工人信息
			loading: false, // 加载状态
			showDeleteModal: false, // 是否显示删除确认弹窗
		}
	},
	onLoad(option) {
		if (option.id) {
			this.workerId = option.id
			this.getWorkerDetail()
		} else {
			this.$showToast.none('参数错误')
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	},
	methods: {
		// 获取工人详情
		async getWorkerDetail() {
			try {
				this.loading = true
				this.$showLoading('加载中...')

				// 直接调用云对象
				const workerService = uniCloud.importObject('worker-service')
				const res = await workerService.getWorkerDetail({
					workerId: this.workerId,
				})

				console.log('工人详情返回:', res)

				if (res.code === 0 && res.data) {
					this.worker = res.data
				} else {
					this.$showToast.none(res.message || '获取工人信息失败')
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				}
			} catch (e) {
				console.error('获取工人详情异常:', e)
				this.$showToast.none('获取工人信息失败，请重试')
			} finally {
				this.loading = false
				this.$hideLoading()
			}
		},

		// 跳转到编辑页面
		goEdit() {
			uni.navigateTo({
				url: `/pages/worker/add?id=${this.workerId}`,
			})
		},

		// 确认删除
		confirmDelete() {
			this.showDeleteModal = true
		},

		// 删除工人
		async deleteWorker() {
			try {
				this.$showLoading('删除中...')

				// 直接调用云对象
				const workerService = uniCloud.importObject('worker-service')
				const res = await workerService.deleteWorker({
					workerId: this.workerId,
				})

				console.log('删除工人返回:', res)

				if (res.code === 0) {
					this.$showToast.success('删除成功')

					// 等待提示显示后返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} else {
					this.$showToast.none(res.message || '删除失败')
				}
			} catch (e) {
				console.error('删除工人异常:', e)
				this.$showToast.none('删除失败，请重试')
			} finally {
				this.$hideLoading()
			}
		},
	},
	onShow() {
		// 如果从编辑页返回，刷新数据
		if (this.workerId) {
			this.getWorkerDetail()
		}
	},
}
</script>

<style lang="scss" scoped>
.worker-detail {
	min-height: 100vh;
	background-color: #f7f8fa;
	padding-bottom: 20px;

	.worker-header {
		background-color: #fff;
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 12px;

		.worker-name {
			font-size: 18px;
			font-weight: 500;
			margin-top: 12px;
			margin-bottom: 6px;
			color: #323233;
		}

		.worker-phone {
			font-size: 14px;
			color: #969799;
		}
	}

	.info-group {
		background: #fff;
		margin-bottom: 12px;

		.info-title {
			padding: 12px 16px;
			color: #969799;
			font-size: 14px;
			border-bottom: 1px solid #ebedf0;
		}

		.info-content {
			padding: 0 16px;
		}

		.info-item {
			display: flex;
			padding: 12px 0;
			border-bottom: 1px solid #ebedf0;

			&:last-child {
				border-bottom: none;
			}

			.info-label {
				width: 80px;
				color: #646566;
				font-size: 14px;
			}

			.info-value {
				flex: 1;
				font-size: 14px;
				color: #323233;
			}
		}
	}

	.action-buttons {
		margin: 20px 16px;

		.u-button {
			margin-bottom: 12px;
		}
	}
}
</style>
