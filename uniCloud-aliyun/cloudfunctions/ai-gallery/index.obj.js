const uniID = require('uni-id-common')

module.exports = {
  _before: async function () {
    // 鉴权
    const clientInfo = this.getClientInfo()
    this.context = {
      clientInfo,
      uniIdToken: this.getUniIdToken(),
      currentUser: null
    }
    
    // 初始化uni-id
    this.uniID = uniID.createInstance({
      clientInfo
    })
    
    // 检查用户登录状态
    const auth = await this.uniID.checkToken(this.context.uniIdToken)
    if (auth.code) {
      throw {
        errCode: auth.code,
        errMsg: auth.message || '身份验证失败，请重新登录'
      }
    }
    this.context.currentUser = auth.uid
  },
  
  /**
   * 统一请求入口，通过type参数来区分不同的操作
   * @param {Object} params 请求参数
   * @returns {Promise} 返回处理结果
   */
  async invoke(params = {}) {
    const { type } = params
    
    if (!type) {
      throw {
        errCode: 'PARAM_ERROR',
        errMsg: '缺少必要参数type'
      }
    }
    
    switch (type) {
      case 'generate':
        return await this.generateImage(params)
      case 'getUserImages':
        return await this.getUserImages(params)
      case 'getPublicImages':
        return await this.getPublicImages(params) 
      case 'deleteImage':
        return await this.deleteImage(params)
      default:
        throw {
          errCode: 'INVALID_TYPE',
          errMsg: `无效的操作类型: ${type}`
        }
    }
  },
  
  /**
   * 生成图片
   * @param {Object} params 包含prompt等参数
   * @returns {Promise} 返回生成结果
   */
  async generateImage({ prompt }) {
    if (!prompt) {
      throw {
        errCode: 'PARAM_ERROR',
        errMsg: '提示词不能为空'
      }
    }
    
    // 获取当前用户ID
    const userId = this.context.currentUser
    
    try {
      // 调用AI服务生成图片
      const imageData = await this.callAIService(prompt)
      
      // 生成唯一文件名
      const imageId = Date.now().toString()
      const fileName = `${imageId}.jpg`
      const filePath = `gallery/${userId}/${fileName}`
      
      // 上传图片到云存储
      const uploadResult = await uniCloud.uploadFile({
        cloudPath: filePath,
        fileContent: Buffer.from(imageData, 'base64')
      })
      
      // 获取图片URL
      const urlResult = await uniCloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })
      
      const imageUrl = urlResult.fileList[0].tempFileURL
      
      // 创建图片记录
      const db = uniCloud.database()
      const imageRecord = {
        user_id: userId,
        prompt: prompt,
        file_id: uploadResult.fileID,
        url: imageUrl,
        create_time: new Date()
      }
      
      const result = await db.collection('images').add(imageRecord)
      
      return {
        success: true,
        imageId: result.id,
        url: imageUrl
      }
    } catch (error) {
      console.error('生成图片失败:', error)
      throw {
        errCode: 'GENERATE_FAILED',
        errMsg: '生成图片失败，请稍后重试',
        detail: error.message || ''
      }
    }
  },
  
  /**
   * 调用第三方AI服务生成图片
   * @param {String} prompt 提示词
   * @returns {Promise<String>} 返回Base64格式的图片数据
   */
  async callAIService(prompt) {
    // TODO: 替换为实际的AI服务调用
    // 这里只是一个模拟实现，返回一个随机颜色的图片
    console.log('调用AI服务生成图片，提示词:', prompt)
    
    // 模拟AI服务调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 返回模拟图片数据(一个1x1像素的透明图片的base64编码)
    // 实际项目中，这里应该替换为真实的AI服务API调用
    return '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'
  },
  
  /**
   * 获取用户图片列表
   * @param {Object} params 包含分页参数
   * @returns {Promise} 返回图片列表
   */
  async getUserImages({ page = 1, limit = 10 }) {
    const userId = this.context.currentUser
    const db = uniCloud.database()
    
    try {
      const result = await db.collection('images')
        .where({
          user_id: userId
        })
        .orderBy('create_time', 'desc')
        .skip((page - 1) * limit)
        .limit(limit)
        .get()
      
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error('获取用户图片列表失败:', error)
      throw {
        errCode: 'QUERY_FAILED',
        errMsg: '获取图片列表失败',
        detail: error.message || ''
      }
    }
  },
  
  /**
   * 获取公开图片列表
   * @param {Object} params 包含分页参数
   * @returns {Promise} 返回图片列表
   */
  async getPublicImages({ page = 1, limit = 10, filter = {} }) {
    const db = uniCloud.database()
    const $ = db.command.aggregate
    
    try {
      // 聚合查询，关联用户信息
      const result = await db.collection('images')
        .aggregate()
        .lookup({
          from: 'uni-id-users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'creator'
        })
        .project({
          _id: 1,
          prompt: 1,
          url: 1,
          create_time: 1,
          creator: {
            $arrayElemAt: ['$creator', 0]
          }
        })
        .project({
          _id: 1,
          prompt: 1,
          url: 1,
          create_time: 1,
          'creator._id': 1,
          'creator.nickname': 1,
          'creator.avatar_file': 1
        })
        .sort({
          create_time: -1
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .end()
      
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error('获取公开图片列表失败:', error)
      throw {
        errCode: 'QUERY_FAILED',
        errMsg: '获取图片列表失败',
        detail: error.message || ''
      }
    }
  },
  
  /**
   * 删除图片
   * @param {Object} params 包含imageId
   * @returns {Promise} 返回删除结果
   */
  async deleteImage({ imageId }) {
    if (!imageId) {
      throw {
        errCode: 'PARAM_ERROR',
        errMsg: '图片ID不能为空'
      }
    }
    
    const userId = this.context.currentUser
    const db = uniCloud.database()
    
    try {
      // 1. 查询图片记录，确认所有权
      const imageRecord = await db.collection('images')
        .where({
          _id: imageId,
          user_id: userId
        })
        .get()
      
      if (imageRecord.data.length === 0) {
        return {
          success: false,
          errMsg: '图片不存在或无权删除'
        }
      }
      
      const fileId = imageRecord.data[0].file_id
      
      // 2. 删除云存储文件
      try {
        await uniCloud.deleteFile({
          fileList: [fileId]
        })
      } catch (error) {
        console.error('删除云存储文件失败:', error)
      }
      
      // 3. 删除数据库记录
      await db.collection('images')
        .doc(imageId)
        .remove()
      
      return {
        success: true
      }
    } catch (error) {
      console.error('删除图片失败:', error)
      throw {
        errCode: 'DELETE_FAILED',
        errMsg: '删除图片失败',
        detail: error.message || ''
      }
    }
  }
} 