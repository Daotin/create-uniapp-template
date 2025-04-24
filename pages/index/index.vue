<template>
	<view class="ai-gallery">
		<!-- 瀑布流内容 -->
		<u-waterfall v-model="flowList" ref="uWaterfall">
			<template v-slot:left="{ leftList }">
				<view v-for="(item, index) in leftList" :key="index" class="waterfall-item">
					<u-lazy-load threshold="-450" border-radius="10" :image="item.url" :index="index"></u-lazy-load>
					<view class="item-footer">
						<image :src="item.avatar" class="avatar" mode="aspectFill"></image>
						<view class="user-info">
							<view class="username">{{ item.username }}</view>
							<view class="date">{{ item.date }}</view>
						</view>
					</view>
				</view>
			</template>
			<template v-slot:right="{ rightList }">
				<view v-for="(item, index) in rightList" :key="index" class="waterfall-item">
					<u-lazy-load threshold="-450" border-radius="10" :image="item.url" :index="index"></u-lazy-load>
					<view class="item-footer">
						<image :src="item.avatar" class="avatar" mode="aspectFill"></image>
						<view class="user-info">
							<view class="username">{{ item.username }}</view>
							<view class="date">{{ item.date }}</view>
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
import { formatDate } from '@/utils/date.js'

export default {
	data() {
		return {
			current: 0,
			flowList: [],
			loadStatus: 'loadmore',
			page: 1,
			limit: 10,
		}
	},
	onLoad() {
		this.getImageList()
	},
	onReachBottom() {
		if (this.loadStatus !== 'nomore') {
			this.loadStatus = 'loading'
			this.page++
			this.getImageList()
		}
	},
	methods: {
		// 模拟获取图片列表
		async getImageList() {
			// 模拟异步请求
			setTimeout(() => {
				// 模拟数据
				const mockData = []
				for (let i = 0; i < 10; i++) {
					const randomHeight = Math.floor(Math.random() * 300) + 300
					mockData.push({
						id: this.flowList.length + i,
						url: `https://picsum.photos/400/${randomHeight}?random=${this.flowList.length + i}`,
						avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(
							Math.random() * 100,
						)}.jpg`,
						username: ['张小明', '王大力', '李小花', '陈小帅', '赵大山'][Math.floor(Math.random() * 5)],
						date: formatDate(new Date(new Date().getTime() - Math.floor(Math.random() * 10000000000)), 'yyyy-MM-dd'),
					})
				}

				// 添加到瀑布流
				this.flowList = [...this.flowList, ...mockData]

				// 更新加载状态
				if (this.page >= 3) {
					this.loadStatus = 'nomore'
				} else {
					this.loadStatus = 'loadmore'
				}
			}, 1000)
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
