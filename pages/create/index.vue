<template>
	<view class="create-container">
		
		<!-- 创作表单 -->
		<view class="form-container">
			<!-- 提示词输入 -->
			<view class="form-item">
				<view class="label">输入提示词</view>
				<u-input 
					type="textarea"
					v-model="prompt" 
					placeholder="尝试描述你想要创建的图片，例如：'一只在雨中漫步的猫，动漫风格，高清，细节丰富'" 
					:height="150"
					:auto-height="true"
          clearable
          border
				></u-input>
			</view>
			
			<!-- 风格选择 -->
			<view class="form-item">
				<view class="label">选择风格</view>
				<view class="style-tags">
					<view 
						v-for="(style, index) in styleOptions" 
						:key="index"
						class="style-tag"
						:class="{ active: selectedStyle === style.id }"
						@click="selectStyle(style.id)"
					>{{ style.name }}</view>
				</view>
			</view>
			
			<!-- 常用提示词示例 -->
			<view class="form-item">
				<view class="tips-header">
					<view class="label">常用提示词</view>
				</view>
				<view class="tips-content">
					<view class="tip-item">• 高清，精致，逼真，4K，细节丰富</view>
					<view class="tip-item">• 彩色，阳光，柔和，明亮</view>
					<view class="tip-item">• 梦幻，魔法，奇幻，科幻</view>
					<view class="tip-item">• 电影风格，摄影作品，专业照片</view>
				</view>
			</view>
			
			<!-- 生成按钮 -->
			<view class="button-area">
				<u-button 
					type="primary" 
					shape="circle" 
					size="large" 
					:loading="generating"
					@click="generateImage"
				>
					<u-icon name="play-right-fill" size="24" style="margin-right: 8rpx;"></u-icon>
					开始创作
				</u-button>
			</view>
		</view>
		
		<!-- 帮助弹窗 -->
		<u-popup v-model="showHelpPopup" mode="center" width="80%" height="auto">
			<view class="help-popup">
				<view class="help-title">如何创建好的AI图片</view>
				<view class="help-content">
					<view class="help-item">1. 提供详细的场景描述，包括主体、动作、背景</view>
					<view class="help-item">2. 描述想要的风格，如写实、动漫、油画等</view>
					<view class="help-item">3. 指定技术参数，如高清、4K、细节丰富</view>
					<view class="help-item">4. 参考常用提示词组合使用</view>
				</view>
				<u-button type="primary" shape="circle" @click="showHelpPopup = false">知道了</u-button>
			</view>
		</u-popup>
	</view>
</template>

<script>
import storage from '@/utils/storage.js'

// 确保uniCloud已初始化
console.log('uniCloud可用状态:', !!uniCloud)

export default {
	data() {
		return {
			prompt: '一只小猫',
			styleOptions: [
				{ id: 'realistic', name: '写实', text: '写实风格，高度逼真' },
				{ id: 'anime', name: '动漫', text: '动漫风格，二次元' },
				{ id: 'oilpainting', name: '油画', text: '油画风格，浓郁质感' },
				{ id: 'watercolor', name: '水彩', text: '水彩画风格，清新淡雅' },
				{ id: 'sketch', name: '素描', text: '素描风格，黑白线条' },
				{ id: 'pixel', name: '像素', text: '像素艺术风格，8-bit复古' },
				{ id: 'photo', name: '照片', text: '摄影风格，真实照片效果' },
				{ id: '3d', name: '3D渲染', text: '3D渲染风格，立体感强' },
			],
			selectedStyle: 'realistic',
			generating: false,
			showHelpPopup: false,
			// 云对象实例
			aiGalleryObj: null
		}
	},
	onLoad() {
		// 导入云对象
		this.aiGalleryObj = uniCloud.importObject('ai-gallery', {
			// customUI: false, // 使用系统默认UI
			// loadingOptions: { 
			// 	title: '处理中...', 
			// 	mask: true 
			// },
			// errorOptions: {
			// 	type: 'toast', // 使用toast显示错误，不阻断用户操作
			// 	retry: false // 不显示重试按钮
			// }
		})
	},
	methods: {
		selectStyle(styleId) {
			this.selectedStyle = styleId
		},
		async generateImage() {
			if (!this.prompt.trim()) {
				this.$showToast.none('请输入提示词')
				return
			}
			
			// 获取选中的风格文本
			const selectedStyleObj = this.styleOptions.find(item => item.id === this.selectedStyle)
			const styleText = selectedStyleObj ? selectedStyleObj.text : ''
			
			// 组合完整提示词
			const fullPrompt = `${this.prompt.trim()}，${styleText}`
			
			// 开始生成
			this.generating = true
			
			// 打印提示词，便于调试
			console.log('正在生成图片，提示词:', fullPrompt)
			
			// 直接调用云对象方法
			try {
				const result = await this.aiGalleryObj.generateImage(fullPrompt)
				console.log('图片生成结果:', result)
				this.generating = false
				
				if (result?.success) {
					this.$showToast.success('图片生成成功')
					
					// 在本地保存生成的图片信息
					try {
						let historyImages = storage.getItem('ai_generated_images') || []
						historyImages.unshift({
							id: result.imageId,
							url: result.url,
							prompt: fullPrompt,
							createTime: new Date().toISOString()
						})
						storage.setItem('ai_generated_images', historyImages)
						
					} catch (e) {
						console.error('保存历史记录失败', e)
					}
					
					// 延迟返回首页并刷新
					setTimeout(() => {
						uni.navigateTo({
							url: `/pages/create/preview?id=${result.imageId}`
						})
					}, 1500)
				}
			} catch (err) {
				this.generating = false
				console.error('生成图片失败vue:', err)
				// 显示详细错误信息
				this.$showToast.error('图片生成失败')
			}
		},
		showHelp() {
			this.showHelpPopup = true
		}
	}
}
</script>

<style lang="scss">
.create-container {
	background-color: #f8f8f8;
	min-height: 100vh;
	
	.form-container {
		padding: 32rpx;
	}
	
	.form-item {
		margin-bottom: 40rpx;
		
		.label {
			font-size: 28rpx;
			font-weight: 500;
			color: #303133;
			margin-bottom: 16rpx;
		}

    .u-input {
			border-radius: 20rpx;
			background-color: #fff;
      // border: 1rpx solid #e5e5e5;
      padding: 20rpx;
		}
	}

	.style-tags {
		display: flex;
		flex-wrap: wrap;
	}
	
	.style-tag {
		display: inline-block;
		padding: 12rpx 28rpx;
		margin: 0 10rpx 20rpx 0;
		border-radius: 40rpx;
		background-color: #f1f1f1;
		font-size: 24rpx;
		color: #606266;
		transition: all 0.3s;
	}
	
	.style-tag.active {
		background-color: #e1f1ff;
		color: #2979ff;
	}
	
	.tips-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}
	
	.tips-content {
		background-color: #f5f5f5;
		border-radius: 12rpx;
		padding: 24rpx;
		
		.tip-item {
			font-size: 24rpx;
			color: #606266;
			margin-bottom: 8rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
		}
	}
	
	.button-area {
		margin-top: 60rpx;
	}
	
	.help-popup {
		padding: 40rpx;
		
		.help-title {
			font-size: 32rpx;
			font-weight: bold;
			text-align: center;
			margin-bottom: 30rpx;
		}
		
		.help-content {
			margin-bottom: 30rpx;
			
			.help-item {
				font-size: 28rpx;
				color: #606266;
				margin-bottom: 16rpx;
				line-height: 1.5;
			}
		}
	}
}
</style> 