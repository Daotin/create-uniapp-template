<template>
	<view class="worker-detail common-page-container has-btm-btn" v-if="worker._id">
		<!-- 工人头部信息 -->
		<view class="worker-header">
			<u-avatar :text="worker.name ? worker.name.substring(0, 1) : ''" bg-color="#188fff"></u-avatar>
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
		<view class="common-btm-btn">
			<u-button type="primary" @click="goEdit">编辑</u-button>
			<u-button type="error" :plain="true" @click="confirmDelete">删除</u-button>
		</view>

		<!-- 删除确认弹窗 -->
		<u-modal
			:show="showDeleteModal"
			content="确定要删除该工人吗？删除后无法恢复"
			:show-cancel-button="true"
			confirm-text="删除"
			cancel-text="取消"
			confirm-color="#fa3534"
			@confirm="deleteWorker"
			@cancel="showDeleteModal = false"
			@close="showDeleteModal = false"></u-modal>
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

					uni.$emit('needRefresh')

					// 等待提示显示后返回上一页
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
				} else {
					this.$showToast.none(res.message || '删除失败')
				}
			} catch (e) {
				console.error('删除工人异常:', e)
				this.$showToast.none('删除失败，请重试')
			} finally {
				this.$hideLoading()
				this.showDeleteModal = false
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
	.worker-header {
		background-color: #fff;
		padding: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 24rpx;

		::v-deep .u-avatar {
			text {
				font-size: 32rpx !important;
				color: #fff;
			}
		}

		.worker-name {
			font-size: 36rpx;
			font-weight: 500;
			margin-top: 24rpx;
			margin-bottom: 12rpx;
			color: #323233;
		}

		.worker-phone {
			font-size: 28rpx;
			color: #969799;
		}
	}

	.info-group {
		background: #fff;
		margin-bottom: 24rpx;

		.info-title {
			padding: 24rpx 32rpx;
			color: #969799;
			font-size: 28rpx;
			border-bottom: 1rpx solid #ebedf0;
		}

		.info-content {
			padding: 0 32rpx;
		}

		.info-item {
			display: flex;
			padding: 24rpx 0;
			border-bottom: 1rpx solid #ebedf0;

			&:last-child {
				border-bottom: none;
			}

			.info-label {
				width: 160rpx;
				color: #646566;
				font-size: 28rpx;
			}

			.info-value {
				flex: 1;
				font-size: 28rpx;
				color: #323233;
			}
		}
	}
}
</style>
