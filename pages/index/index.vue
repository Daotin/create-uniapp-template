<template>
	<view class="ai-gallery">
		<!-- 瀑布流内容 -->
		<u-waterfall v-model="flowList" ref="uWaterfall">
			<template v-slot:left="{ leftList }">
				<view v-for="(item, index) in leftList" :key="index" class="waterfall-item" @click="goToPreview(item)">
					<u-lazy-load threshold="-450" border-radius="10" :image="item.url" :index="index"></u-lazy-load>
					<view class="item-footer">
						<image :src="item.avatarUrl" class="avatar" mode="aspectFill"></image>
						<view class="user-info">
							<view class="username">{{ item.nickname }}</view>
							<view class="date">{{ item.create_time }}</view>
						</view>
					</view>
				</view>
			</template>
			<template v-slot:right="{ rightList }">
				<view v-for="(item, index) in rightList" :key="index" class="waterfall-item" @click="goToPreview(item)">
					<u-lazy-load threshold="-450" border-radius="10" :image="item.url" :index="index"></u-lazy-load>
					<view class="item-footer">
						<image :src="item.avatarUrl" class="avatar" mode="aspectFill"></image>
						<view class="user-info">
							<view class="username">{{ item.nickname }}</view>
							<view class="date">{{ item.create_time }}</view>
						</view>
					</view>
				</view>
			</template>
		</u-waterfall>

		<!-- 创建按钮 -->
		<view class="create-button" @click="goToCreate">
			<u-icon name="plus" color="#ffffff" size="28"></u-icon>
		</view>

		<!-- 加载更多 -->
		<u-loadmore :status="loadStatus" />
	</view>
</template>

<script>
import dayjs from 'dayjs'

export default {
	data() {
		return {
			current: 0,
			flowList: [],
			loadStatus: 'loadmore',
			page: 1,
			limit: 10,
			// 云对象实例
			aiGalleryObj: null,
		}
	},
	onLoad() {
		// 导入云对象
		this.aiGalleryObj = uniCloud.importObject('ai-gallery', {
			customUI: false,
			loadingOptions: {
				title: '加载中...',
				mask: true,
			},
			errorOptions: {
				type: 'toast',
				retry: false,
			},
		})

		this.getImageList()
	},
	onPullDownRefresh() {
		this.page = 1
		this.flowList = []
		this.$refs.uWaterfall.clear()
		this.getImageList()
		setTimeout(() => {
			uni.stopPullDownRefresh()
		}, 1000)
	},
	onReachBottom() {
		if (this.loadStatus !== 'nomore') {
			this.loadStatus = 'loading'
			this.page++
			this.getImageList()
		}
	},
	methods: {
		// 获取头像URL
		getAvatarUrl(creator) {
			if (creator && creator.avatar_file && creator.avatar_file.url) {
				return creator.avatar_file.url
			}
			return '/static/avatar.jpg'
		},

		// 获取用户昵称
		getNickname(creator) {
			if (creator && creator.nickname) {
				return creator.nickname
			}
			return '用户'
		},

		// 获取格式化日期
		getFormatDate(date) {
			return dayjs(date).format('YYYY-MM-DD') || '--'
		},

		goToPreview(item) {
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/create/preview?id=${item._id}`,
				})
			}, 100)
		},
		// 获取图片列表
		async getImageList() {
			try {
				this.loadStatus = 'loading'

				// 直接调用云对象
				const result = await this.aiGalleryObj.getPublicImages({
					page: this.page,
					limit: this.limit,
				})

				if (result.success && result.data) {
					// 添加到瀑布流
					this.flowList = [...this.flowList, ...result.data]

					console.log('flowList==>', this.flowList)

					if (this.flowList.length) {
						this.flowList.forEach(item => {
							item.avatarUrl = this.getAvatarUrl(item.creator)
							item.nickname = this.getNickname(item.creator)
							item.create_time = this.getFormatDate(item.create_time)
						})
					}

					// 更新加载状态
					if (result.data.length < this.limit) {
						this.loadStatus = 'nomore'
					} else {
						this.loadStatus = 'loadmore'
					}
				} else {
					this.loadStatus = 'loadmore'
					this.$showToast.none('获取图片列表失败')
				}
			} catch (error) {
				console.error('获取图片列表失败:', error)
				// console.log(JSON.parse(error.message))
				this.loadStatus = 'loadmore'
				this.$showToast.none(error.message)
			}
		},

		// 跳转到创作页
		goToCreate() {
			uni.navigateTo({
				url: '/pages/create/index',
			})
		},
	},
}
</script>

<style lang="scss">
.ai-gallery {
	background-color: #f8f8f8;
	min-height: 100vh;
	padding-bottom: 100rpx;

	.u-waterfall {
		padding: 0 20rpx;

		.u-column {
			margin-right: 20rpx;

			&:last-of-type {
				margin-right: 0;
			}
		}
	}

	.waterfall-item {
		margin-bottom: 20rpx;
		border-radius: 24rpx;
		overflow: hidden;
		background: white;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

		image {
			display: block;
		}
	}

	.item-footer {
		display: flex;
		align-items: center;
		padding: 20rpx;
	}

	.avatar {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background-color: #f1f1f1;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		margin-left: 20rpx;
		flex: 1;

		.username {
			font-size: 28rpx;
			color: #333;
			margin-bottom: 4rpx;
		}

		.date {
			font-size: 24rpx;
			color: #909399;
		}
	}

	.create-button {
		position: fixed;
		bottom: 50rpx;
		right: 50rpx;
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		background-color: #409eff;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
</style>
