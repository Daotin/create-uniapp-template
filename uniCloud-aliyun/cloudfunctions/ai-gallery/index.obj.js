const uniID = require('uni-id-common')

function throwError(errCode, errMsg) {
	throw new Error(
		JSON.stringify({
			errCode,
			errMsg,
		}),
	)
}

module.exports = {
	_before: async function () {
		// 鉴权
		const clientInfo = this.getClientInfo()
		this.context = {
			clientInfo,
			uniIdToken: this.getUniIdToken(),
			currentUser: null,
		}

		// 初始化uni-id
		this.uniID = uniID.createInstance({
			clientInfo,
		})

		// 检查用户登录状态
		const auth = await this.uniID.checkToken(this.context.uniIdToken)
		if (auth.code) {
			throwError(auth.code, auth.message || '身份验证失败，请重新登录')
		}
		this.context.currentUser = auth.uid
	},

	/**
	 * 生成图片
	 * @param {String} prompt 提示词
	 * @returns {Promise} 返回生成结果
	 */
	async generateImage(prompt) {
		if (!prompt) {
			throwError('PARAM_ERROR', '提示词不能为空')
		}

		// 调用AI服务生成图片
		// 使用require方式获取配置，而不是importObject
		const configCenter = require('uni-config-center')
		const aiConfig = configCenter({
			pluginId: 'ai-gallery',
		}).config()

		const apiKey = aiConfig.apikey

		if (!apiKey) {
			throw new Error('未配置API Key，请在uni-config-center中配置')
		}

		// 创建任务
		const createTaskUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
		const requestData = {
			model: 'wanx2.1-t2i-turbo',
			// model: 'wanx2.1-t2i-plus',
			input: {
				prompt: prompt,
			},
			parameters: {
				size: '1024*1024',
				n: 1,
			},
		}

		try {
			// 步骤1: 创建任务
			const createTaskResult = await uniCloud.httpclient.request(createTaskUrl, {
				method: 'POST',
				data: JSON.stringify(requestData),
				headers: {
					'X-DashScope-Async': 'enable',
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				dataType: 'json',
			})

			if (createTaskResult.status !== 200) {
				throw new Error(`创建任务失败: ${JSON.stringify(createTaskResult.data)}`)
			}

			const taskId = createTaskResult.data.output.task_id

			// 步骤2: 定时查询任务结果
			let imageUrl = null
			let maxRetries = 30 // 最多等待30次查询
			let retryInterval = 2000 // 每2秒查询一次

			while (maxRetries > 0 && !imageUrl) {
				await new Promise(resolve => setTimeout(resolve, retryInterval))

				const queryTaskUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`
				const queryResult = await uniCloud.httpclient.request(queryTaskUrl, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					dataType: 'json',
				})

				if (queryResult.status !== 200) {
					throw new Error(`查询任务失败: ${JSON.stringify(queryResult.data)}`)
				}

				const taskStatus = queryResult.data.output.task_status

				if (taskStatus === 'SUCCEEDED') {
					// 任务成功，获取图片URL
					imageUrl = queryResult.data.output.results[0].url
					break
				} else if (taskStatus === 'FAILED') {
					throw new Error(`生成图片失败: ${JSON.stringify(queryResult.data)}`)
				}

				maxRetries--
			}

			if (!imageUrl) {
				throw new Error('生成图片超时')
			}

			// 步骤3: 下载图片Buffer
			console.log('阿里云imageUrl', imageUrl)

			const imageResponse = await uniCloud.httpclient.request(imageUrl)

			if (imageResponse.status >= 400) {
				throw new Error('下载图片失败')
			}

			// 生成唯一文件名
			// 获取当前用户ID
			const userId = this.context.currentUser
			const cloudPath = `gallery/${userId}/${Date.now().toString()}.jpg`
			console.log('cloudPath', cloudPath)

			// 步骤4：上传图片到云存储
			const uploadResult = await uniCloud.uploadFile({
				cloudPath,
				fileContent: imageResponse.data,
				cloudPathAsRealPath: true,
			})
			console.log('uploadResult上传结果', uploadResult)

			// 步骤5：创建图片记录到数据库images
			const db = uniCloud.database()
			const imageRecord = {
				user_id: userId,
				prompt: prompt,
				file_id: uploadResult.fileID,
				url: uploadResult.fileID,
				create_time: new Date(),
			}

			const result = await db.collection('images').add(imageRecord)

			return {
				success: true,
				imageId: result.id,
				url: imageUrl,
			}
		} catch (error) {
			console.error('AI服务调用失败:', error)
			throw error
		}
	},

	/**
	 * 获取用户图片列表
	 * @param {Object} params 包含分页参数
	 * @returns {Promise} 返回图片列表
	 */
	async getUserImages(params) {
		const page = params?.page || 1
		const limit = params?.limit || 10

		const userId = this.context.currentUser
		const db = uniCloud.database()

		try {
			const result = await db
				.collection('images')
				.where({
					user_id: userId,
				})
				.orderBy('create_time', 'desc')
				.skip((page - 1) * limit)
				.limit(limit)
				.get()

			return {
				success: true,
				data: result.data,
			}
		} catch (error) {
			console.error('获取用户图片列表失败:', error)
			throwError('QUERY_FAILED', '获取图片列表失败')
		}
	},

	/**
	 * 获取公开图片列表
	 * @param {Object} params 包含分页参数
	 * @returns {Promise} 返回图片列表
	 */
	async getPublicImages(params) {
		const page = params?.page || 1
		const limit = params?.limit || 10
		const filter = params?.filter || {}

		const db = uniCloud.database()
		const $ = db.command.aggregate

		try {
			// 聚合查询，关联用户信息
			const result = await db
				.collection('images')
				.aggregate()
				.lookup({
					from: 'uni-id-users',
					localField: 'user_id',
					foreignField: '_id',
					as: 'creator',
				})
				.project({
					_id: 1,
					prompt: 1,
					url: 1,
					create_time: 1,
					creator: {
						$arrayElemAt: ['$creator', 0],
					},
				})
				.project({
					'_id': 1,
					'prompt': 1,
					'url': 1,
					'create_time': 1,
					'creator._id': 1,
					'creator.nickname': 1,
					'creator.avatar_file': 1,
				})
				.sort({
					create_time: -1,
				})
				.skip((page - 1) * limit)
				.limit(limit)
				.end()

			return {
				success: true,
				data: result.data,
			}
		} catch (error) {
			console.error('获取公开图片列表失败:', error)
			throwError('QUERY_FAILED', '获取图片列表失败')
		}
	},

	/**
	 * 删除图片
	 * @param {Object} params 包含imageId
	 * @returns {Promise} 返回删除结果
	 */
	async deleteImage(params) {
		const imageId = params?.imageId

		if (!imageId) {
			throwError('PARAM_ERROR', '图片ID不能为空')
		}

		const userId = this.context.currentUser
		const db = uniCloud.database()

		try {
			// 1. 查询图片记录，确认所有权
			const imageRecord = await db
				.collection('images')
				.where({
					_id: imageId,
					user_id: userId,
				})
				.get()

			if (imageRecord.data.length === 0) {
				return {
					success: false,
					errMsg: '图片不存在或无权删除',
				}
			}

			const fileId = imageRecord.data[0].file_id

			// 2. 删除云存储文件
			try {
				await uniCloud.deleteFile({
					fileList: [fileId],
				})
			} catch (error) {
				console.error('删除云存储文件失败:', error)
			}

			// 3. 删除数据库记录
			await db.collection('images').doc(imageId).remove()

			return {
				success: true,
			}
		} catch (error) {
			console.error('删除图片失败:', error)
			throwError('DELETE_FAILED', '删除图片失败')
		}
	},
}
