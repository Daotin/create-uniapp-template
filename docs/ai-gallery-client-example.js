// AI画廊小程序客户端调用示例

/**
 * 生成图片
 * @param {string} prompt 提示词
 * @returns {Promise} 生成结果
 */
export const generateImage = async (prompt) => {
  if (!prompt) {
    uni.showToast({
      title: '提示词不能为空',
      icon: 'none'
    })
    return Promise.reject(new Error('提示词不能为空'))
  }
  
  try {
    const result = await uniCloud.callObject({
      name: 'ai-gallery',
      method: 'invoke',
      data: {
        type: 'generate',
        prompt
      }
    })
    
    return result
  } catch (error) {
    console.error('生成图片失败:', error)
    uni.showToast({
      title: error.errMsg || '生成图片失败',
      icon: 'none'
    })
    throw error
  }
}

/**
 * 获取首页图片列表
 * @param {number} page 页码
 * @param {number} limit 每页数量
 * @param {Object} filter 过滤条件
 * @returns {Promise} 图片列表
 */
export const getPublicImages = async (page = 1, limit = 10, filter = {}) => {
  try {
    const result = await uniCloud.callObject({
      name: 'ai-gallery',
      method: 'invoke',
      data: {
        type: 'getPublicImages',
        page,
        limit,
        filter
      }
    })
    
    return result.data
  } catch (error) {
    console.error('获取图片列表失败:', error)
    uni.showToast({
      title: error.errMsg || '获取图片列表失败',
      icon: 'none'
    })
    throw error
  }
}

/**
 * 获取用户图片列表
 * @param {number} page 页码
 * @param {number} limit 每页数量
 * @returns {Promise} 图片列表
 */
export const getUserImages = async (page = 1, limit = 10) => {
  try {
    const result = await uniCloud.callObject({
      name: 'ai-gallery',
      method: 'invoke',
      data: {
        type: 'getUserImages',
        page,
        limit
      }
    })
    
    return result.data
  } catch (error) {
    console.error('获取用户图片列表失败:', error)
    uni.showToast({
      title: error.errMsg || '获取用户图片列表失败',
      icon: 'none'
    })
    throw error
  }
}

/**
 * 删除图片
 * @param {string} imageId 图片ID
 * @returns {Promise} 删除结果
 */
export const deleteImage = async (imageId) => {
  if (!imageId) {
    uni.showToast({
      title: '图片ID不能为空',
      icon: 'none'
    })
    return Promise.reject(new Error('图片ID不能为空'))
  }
  
  try {
    const result = await uniCloud.callObject({
      name: 'ai-gallery',
      method: 'invoke',
      data: {
        type: 'deleteImage',
        imageId
      }
    })
    
    if (result.success) {
      uni.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } else {
      uni.showToast({
        title: result.errMsg || '删除失败',
        icon: 'none'
      })
    }
    
    return result
  } catch (error) {
    console.error('删除图片失败:', error)
    uni.showToast({
      title: error.errMsg || '删除图片失败',
      icon: 'none'
    })
    throw error
  }
}

// 示例：如何在组件中使用这些方法
/*
<template>
  <view class="container">
    <!-- 图片生成表单 -->
    <view class="form">
      <input type="text" v-model="prompt" placeholder="输入提示词" />
      <button @click="handleGenerate">生成图片</button>
    </view>
    
    <!-- 图片瀑布流展示 -->
    <view class="waterfall">
      <view 
        class="image-item"
        v-for="(item, index) in imageList" 
        :key="index"
      >
        <image :src="item.url" mode="widthFix" />
        <view class="info">
          <image class="avatar" :src="item.creator.avatar_file.url" mode="aspectFill" />
          <view class="user-info">
            <text class="nickname">{{item.creator.nickname || '未知用户'}}</text>
            <text class="date">{{formatDate(item.create_time)}}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 加载更多 -->
    <uni-load-more :status="loadMoreStatus" />
  </view>
</template>

<script>
import { getPublicImages, generateImage } from '@/api/ai-gallery-client-example.js'

export default {
  data() {
    return {
      prompt: '',
      imageList: [],
      page: 1,
      limit: 10,
      loadMoreStatus: 'more', // more, loading, noMore
      generating: false
    }
  },
  onLoad() {
    this.loadImages()
  },
  onReachBottom() {
    if (this.loadMoreStatus !== 'noMore') {
      this.loadMore()
    }
  },
  methods: {
    async loadImages() {
      this.loadMoreStatus = 'loading'
      
      try {
        const result = await getPublicImages(this.page, this.limit)
        this.imageList = result
        
        this.loadMoreStatus = result.length < this.limit ? 'noMore' : 'more'
      } catch (error) {
        this.loadMoreStatus = 'more'
      }
    },
    
    async loadMore() {
      if (this.loadMoreStatus === 'loading') return
      
      this.loadMoreStatus = 'loading'
      this.page++
      
      try {
        const result = await getPublicImages(this.page, this.limit)
        this.imageList = [...this.imageList, ...result]
        
        this.loadMoreStatus = result.length < this.limit ? 'noMore' : 'more'
      } catch (error) {
        this.page--
        this.loadMoreStatus = 'more'
      }
    },
    
    async handleGenerate() {
      if (!this.prompt.trim()) {
        uni.showToast({
          title: '请输入提示词',
          icon: 'none'
        })
        return
      }
      
      if (this.generating) return
      
      this.generating = true
      uni.showLoading({
        title: '生成图片中...'
      })
      
      try {
        const result = await generateImage(this.prompt)
        
        if (result.success) {
          uni.hideLoading()
          uni.showToast({
            title: '生成成功',
            icon: 'success'
          })
          
          // 刷新图片列表
          this.page = 1
          this.loadImages()
          this.prompt = ''
        }
      } catch (error) {
        // 错误处理已在API函数中完成
      } finally {
        this.generating = false
        uni.hideLoading()
      }
    },
    
    formatDate(timestamp) {
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  }
}
</script>
*/ 