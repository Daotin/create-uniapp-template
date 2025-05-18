<template>
  <view class="preview-container">
    <view class="image-wrapper">
      <image 
        v-if="imageUrl" 
        :src="imageUrl" 
        mode="aspectFit" 
        class="preview-image"
      ></image>
      <view v-else class="loading-wrapper">
        <u-loading-icon mode="circle" size="60"></u-loading-icon>
        <text class="loading-text">加载中...</text>
      </view>
    </view>
    
    <view class="info-section">
      <view class="prompt-section">
        <view class="section-title">提示词</view>
        <view class="prompt-text">{{ prompt }}</view>
      </view>
      
      <view class="buttons">
        <u-button 
          type="primary" 
          size="medium" 
          @click="saveImage"
        >保存到相册</u-button>
        <u-button 
          type="default" 
          size="medium" 
          @click="goBack"
        >返回</u-button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      imageId: '',
      imageUrl: '',
      prompt: '',
      // 云对象实例
      aiGalleryObj: null
    }
  },
  onLoad(options) {
    // 导入云对象
    this.aiGalleryObj = uniCloud.importObject('ai-gallery', {
      customUI: false,
      loadingOptions: { 
        title: '加载中...', 
        mask: true 
      }
    })
    
    if (options.id) {
      this.imageId = options.id
      this.loadImageData(options.id)
    } else {
      uni.showToast({
        title: '图片数据无效',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  methods: {
    // 加载图片数据
    async loadImageData(imageId) {
      try {
        const result = await this.aiGalleryObj.getImageDetail({
          imageId: imageId
        })
        
        if (result.success && result.data) {
          const imageData = result.data
          this.imageId = imageData._id
          this.imageUrl = imageData.url
          this.prompt = imageData.prompt
        } else {
          throw new Error('获取图片数据失败')
        }
      } catch (error) {
        console.error('加载图片失败:', error)
        this.$showToast.error('加载图片失败')
      }
    },
    
    // 保存图片到相册
    saveImage() {
      if (!this.imageUrl) {
        this.$showToast.none('图片未加载完成')
        return
      }

      this.$showLoading('保存中...')
      
      uni.downloadFile({
        url: this.imageUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                this.$hideLoading()
                this.$showToast.success('已保存到相册')
              },
              fail: (err) => {
                uni.hideLoading()
                console.error('保存失败', err)
                this.$showToast.error('保存失败，请检查权限')
              }
            })
          } else {
            uni.hideLoading()
            this.$showToast.error('下载图片失败')
          }
        },
        fail: () => {
          uni.hideLoading()
          this.$showToast.error('下载图片失败')
        }
      })
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss">
.preview-container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  
  .image-wrapper {
    width: 100%;
    height: 750rpx;
    background-color: #fff;
    border-radius: 20rpx;
    margin-bottom: 30rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    
    .preview-image {
      width: 100%;
      height: 100%;
    }
    
    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .loading-text {
        margin-top: 20rpx;
        font-size: 28rpx;
        color: #606266;
      }
    }
  }
  
  .info-section {
    background-color: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    
    .prompt-section {
      margin-bottom: 40rpx;
      
      .section-title {
        font-size: 28rpx;
        font-weight: 500;
        color: #303133;
        margin-bottom: 16rpx;
      }
      
      .prompt-text {
        font-size: 26rpx;
        color: #606266;
        line-height: 1.5;
      }
    }
    
    .buttons {
      display: flex;
      justify-content: space-between;
      
      .u-button {
        width: 45%;
      }
    }
  }
}
</style> 