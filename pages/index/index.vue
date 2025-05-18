<template>
	<view class="ai-gallery">
		<view class="waterfall-columns-view">
			<view v-for="item in galleryItems" :key="item._id" class="waterfall-item" @click="goToPreview(item)">
				<image :src="item.url" lazy-load mode="widthFix" class="item-image"></image>
				<view class="item-footer">
					<image :src="item.avatarUrl" class="avatar" mode="widthFix"></image>
					<view class="user-info">
						<view class="username">{{ item.nickname }}</view>
						<view class="date">{{ item.create_time }}</view>
					</view>
				</view>
			</view>
		</view>

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
			galleryItems: [],
			loadStatus: 'loadmore',
			page: 1,
			limit: 10,
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
		this.galleryItems = []
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

				const result = await this.aiGalleryObj.getPublicImages({
					page: this.page,
					limit: this.limit,
				})

				if (result.success && result.data && result.data.length > 0) {
					const processedData = result.data.map(item => ({
						...item,
						avatarUrl: this.getAvatarUrl(item.creator),
						nickname: this.getNickname(item.creator),
						create_time: this.getFormatDate(item.create_time),
					}));

					// Append new items to the single galleryItems list
					this.galleryItems = [...this.galleryItems, ...processedData];

					if (result.data.length < this.limit) {
						this.loadStatus = 'nomore'
					} else {
						this.loadStatus = 'loadmore'
					}
				} else if (result.success && (!result.data || result.data.length === 0)) {
					if (this.page === 1) {
						this.galleryItems = []; // Clear if first page has no new items
					}
					this.loadStatus = 'nomore';
				} else {
					this.loadStatus = 'loadmore'
					this.$showToast.none(result.message || '获取图片列表失败')
				}
			} catch (error) {
				console.error('获取图片列表失败:', error)
				this.loadStatus = 'loadmore'
				this.$showToast.none(error.message || '获取图片列表失败，请稍后再试')
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
	
	// 瀑布流布局 - 使用CSS列
	.waterfall-columns-view {
		padding: 20rpx;      // 内容区域的整体内边距
		column-count: 2;     // 2列布局
		column-gap: 20rpx;   // 列间距
	}

	.waterfall-item {
    display: inline-block;  // 避免某些浏览器中的渲染问题
    width: 100%;  // 确保项目占据整个列宽
		margin-bottom: 20rpx;  // 每个项目底部的间距
		border-radius: 24rpx;  // 圆角边框
		overflow: hidden;      // 隐藏溢出内容
		background: white;     // 白色背景
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);  // 轻微阴影
		break-inside: avoid;   // 防止项目被分割到不同列
		-webkit-column-break-inside: avoid;  // 兼容性
        page-break-inside: avoid;  // 兼容性
	}
	
	.item-image {
		width: 100%;  // 宽度100%
		height: auto;  // 高度自适应，保持原始比例
		display: block;  // 移除图片下方可能的间隙
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
