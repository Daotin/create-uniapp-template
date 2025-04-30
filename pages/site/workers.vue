<template>
	<view class="site-workers">
		<!-- Tab切换 -->
		<u-tabs :list="tabList" :is-scroll="false" :current="current" @change="tabChange"></u-tabs>

		<!-- 搜索框 -->
		<view class="search-box">
			<u-search
				v-model="keyword"
				:placeholder="current === 0 ? '搜索工地工人' : '搜索可添加工人'"
				:show-action="false"
				@custom="search"
				@search="search"
				shape="round"
				bg-color="#f7f8fa"></u-search>
		</view>

		<!-- 当前工地工人列表 -->
		<scroll-view v-if="current === 0" scroll-y class="content">
			<u-empty v-if="currentList.length === 0 && !loading" text="暂无工人数据" mode="list"></u-empty>

			<view v-else>
				<view class="site-info">
					<text class="site-name">{{ siteName }}</text>
					<text class="site-count">共 {{ currentList.length }} 人</text>
				</view>

				<view v-for="(item, index) in currentList" :key="index" class="list-item">
					<view class="avatar-box">
						<u-avatar :text="item.name.substring(0, 1)" font-size="22" bg-color="#188fff" size="40"></u-avatar>
					</view>
					<view class="info">
						<view class="name">{{ item.name }}</view>
						<view class="phone">{{ item.phone || '未设置手机号' }}</view>
					</view>
					<view class="action-box">
						<u-button type="error" size="mini" plain @click.stop="removeWorker(item)">移除</u-button>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 可添加工人列表 -->
		<scroll-view v-if="current === 1" scroll-y class="content">
			<u-empty v-if="availableList.length === 0 && !loading" text="暂无可添加工人" mode="list"></u-empty>

			<view v-else>
				<view class="site-info">
					<text class="site-name">{{ siteName }}</text>
					<text class="site-count">可添加 {{ availableList.length }} 人</text>
				</view>

				<view v-for="(item, index) in availableList" :key="index" class="list-item">
					<view class="avatar-box">
						<u-avatar :text="item.name.substring(0, 1)" font-size="22" bg-color="#188fff" size="40"></u-avatar>
					</view>
					<view class="info">
						<view class="name">{{ item.name }}</view>
						<view class="phone">{{ item.phone || '未设置手机号' }}</view>
					</view>
					<view class="action-box">
						<u-checkbox :name="item._id" v-model="item.checked" @change="checkboxChange"></u-checkbox>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 空白状态 -->
		<view v-if="availableList.length === 0" class="empty-box">
			<u-empty mode="list" icon="http://cdn.uviewui.com/uview/empty/list.png"></u-empty>
		</view>
		<view v-else class="batch-add-box" v-if="current === 1">
			<view class="batch-btn">
				<u-button type="primary" @click="batchAddWorkers">批量添加</u-button>
			</view>
		</view>

		<!-- 确认操作弹窗 -->
		<u-modal
			v-model="showConfirmModal"
			:content="confirmContent"
			:show-cancel-button="true"
			@confirm="confirmAction"></u-modal>
	</view>
</template>

<script>
export default {
	data() {
		return {
			tabList: [{ name: '当前工人' }, { name: '添加工人' }],
			current: 0, // 当前选项卡索引
			siteId: '', // 工地ID
			siteName: '', // 工地名称
			keyword: '', // 搜索关键词
			currentList: [], // 当前工地工人列表
			availableList: [], // 可添加工人列表
			loading: false, // 加载状态

			// 批量添加
			selectedWorkerIds: [], // 选中的工人ID列表

			// 确认操作
			showConfirmModal: false, // 是否显示确认弹窗
			confirmContent: '', // 确认弹窗内容
			confirmType: '', // 确认类型：remove/batch
			currentItem: null, // 当前操作的工人
		}
	},
	onLoad(option) {
		if (option.id) {
			this.siteId = option.id

			// 如果有站点名称参数，直接使用
			if (option.name) {
				this.siteName = decodeURIComponent(option.name)
			} else {
				this.getSiteDetail()
			}

			// 如果有tab参数，切换到指定tab
			if (option.tab) {
				this.current = parseInt(option.tab)
			}

			this.loadData()
		} else {
			this.$showToast.none('参数错误')
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	},
	methods: {
		// 获取工地详情（获取工地名称）
		async getSiteDetail() {
			try {
				this.$showLoading('加载中...')

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteDetail({
					siteId: this.siteId,
				})

				console.log('工地详情返回:', res)

				if (res.code === 0 && res.data) {
					this.siteName = res.data.name
				}
			} catch (e) {
				console.error('获取工地详情异常:', e)
			} finally {
				this.$hideLoading()
			}
		},

		// 加载数据
		loadData() {
			if (this.current === 0) {
				this.getSiteWorkers()
			} else {
				this.getAvailableWorkers()
			}
		},

		// 获取工地工人列表
		async getSiteWorkers() {
			try {
				this.loading = true
				console.log('请求参数:', { siteId: this.siteId, keyword: this.keyword })

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getSiteWorkers({
					siteId: this.siteId,
					keyword: this.keyword,
				})

				console.log('工地工人列表返回:', res)

				if (res.code === 0) {
					// 为每个工人添加checked属性
					this.currentList = res.data.list.map(item => {
						return {
							...item,
							checked: false
						}
					})
				} else {
					this.$showToast.none(res.message || '获取工地工人列表失败')
				}
			} catch (e) {
				console.error('获取工地工人列表异常:', e)
				this.$showToast.none('获取工地工人列表失败，请重试')
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
			}
		},

		// 获取可添加工人列表
		async getAvailableWorkers() {
			try {
				this.loading = true
				console.log('请求参数:', { siteId: this.siteId, keyword: this.keyword })

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.getAvailableWorkers({
					siteId: this.siteId,
					keyword: this.keyword,
				})

				console.log('可添加工人列表返回:', res)

				if (res.code === 0) {
					// 为每个工人添加checked属性
					this.availableList = res.data.list.map(item => {
						return {
							...item,
							checked: false
						}
					})
				} else {
					this.$showToast.none(res.message || '获取可添加工人列表失败')
				}
			} catch (e) {
				console.error('获取可添加工人列表异常:', e)
				this.$showToast.none('获取可添加工人列表失败，请重试')
			} finally {
				this.loading = false
				uni.stopPullDownRefresh()
			}
		},

		// Tab切换
		tabChange(index) {
			this.current = index
			this.keyword = ''
			this.loadData()
		},

		// 搜索
		search() {
			this.loadData()
		},

		// 移除工人
		removeWorker(item) {
			this.confirmType = 'remove'
			this.currentItem = item
			this.confirmContent = `确定要将工人"${item.name}"从工地移除吗？`
			this.showConfirmModal = true
		},

		// 确认操作
		async confirmAction() {
			if (this.confirmType === 'remove') {
				await this.doRemoveWorker(this.currentItem)
			} else if (this.confirmType === 'batch') {
				await this.doBatchAddWorker()
			}
		},

		// 复选框更改事件
		checkboxChange(value, name) {
			console.log('复选框状态变更:', name, value)
		},

		// 批量添加工人
		batchAddWorkers() {
			// 获取所有选中的工人
			const selectedWorkers = this.availableList.filter(item => item.checked)
			
			if (selectedWorkers.length === 0) {
				this.$showToast.none('请选择要添加的工人')
				return
			}
			
			this.selectedWorkerIds = selectedWorkers.map(item => item._id)
			this.confirmType = 'batch'
			this.confirmContent = `确定要将选中的${selectedWorkers.length}名工人添加到工地吗？`
			this.showConfirmModal = true
		},

		// 执行移除工人
		async doRemoveWorker(item) {
			try {
				this.$showLoading('移除中...')

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.removeWorkerFromSite({
					siteId: this.siteId,
					workerId: item._id,
				})

				console.log('移除工人返回:', res)

				if (res.code === 0) {
					this.$showToast.success('移除成功')

					// 刷新列表
					this.loadData()

					// 触发刷新工地详情页
					uni.$emit('refreshSiteDetail')
				} else {
					this.$showToast.none(res.message || '移除失败')
				}
			} catch (e) {
				console.error('移除工人异常:', e)
				this.$showToast.none('移除失败，请重试')
			} finally {
				this.$hideLoading()
			}
		},

		// 执行批量添加工人
		async doBatchAddWorker() {
			try {
				if (this.selectedWorkerIds.length === 0) {
					this.$showToast.none('请选择要添加的工人')
					return
				}

				this.$showLoading('批量添加中...')

				// 直接调用云对象
				const siteService = uniCloud.importObject('site-service')
				const res = await siteService.addWorkersToSite({
					siteId: this.siteId,
					workerId: this.selectedWorkerIds.join(','),
				})

				console.log('批量添加工人返回:', res)

				if (res.code === 0) {
					this.$showToast.success('添加成功')

					// 刷新列表
					this.loadData()

					// 触发刷新工地详情页
					uni.$emit('refreshSiteDetail')
				} else {
					this.$showToast.none(res.message || '添加失败')
				}
			} catch (e) {
				console.error('批量添加工人异常:', e)
				this.$showToast.none('添加失败，请重试')
			} finally {
				this.$hideLoading()
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.site-workers {
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
		height: calc(100vh - 88rpx - 116rpx); // 减去tab高度和搜索框高度
		padding-bottom: 160rpx; // 为底部按钮留出空间
	}

	.site-info {
		padding: 20rpx 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;

		.site-name {
			font-size: 32rpx;
			font-weight: 500;
			color: #323233;
		}

		.site-count {
			font-size: 24rpx;
			color: #969799;
		}
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

		.action-box {
			margin-left: 20rpx;
		}
	}

	.batch-add-box {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 20rpx 32rpx;
		background-color: #fff;
		box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
		z-index: 9;

		.batch-btn {
			display: flex;
			justify-content: center;
		}
	}

	.multi-add-popup {
		display: flex;
		flex-direction: column;
		height: 100%;

		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx 32rpx;
			border-bottom: 1rpx solid #ebedf0;
			font-size: 32rpx;
			font-weight: 500;
		}

		.popup-content {
			flex: 1;
			padding: 32rpx;
			overflow-y: auto;

			.checkbox-item {
				margin-bottom: 24rpx;

				.checkbox-text {
					margin-left: 12rpx;
					font-size: 28rpx;
				}
			}
		}

		.popup-footer {
			padding: 24rpx 32rpx;
			border-top: 1rpx solid #ebedf0;

			.selected-count {
				text-align: center;
				margin-bottom: 24rpx;
				font-size: 28rpx;
				color: #323233;
			}
		}
	}
}
</style>
