// site-service云对象
const db = uniCloud.database()
const dbCmd = db.command

module.exports = {
	_before: async function () {
		// 获取客户端信息和token
		const clientInfo = this.getClientInfo()
		const token = this.getUniIdToken()

		if (!token) {
			throw new Error('用户未登录，请先登录')
		}

		// 校验token
		const uniIDCommon = require('uni-id-common')
		const uniID = uniIDCommon.createInstance({
			clientInfo,
		})

		// 校验token
		const checkTokenRes = await uniID.checkToken(token)
		if (checkTokenRes.errCode) {
			throw new Error('登录状态无效，请重新登录1')
		}

		// 将用户ID存入上下文
		this.context = {
			uid: checkTokenRes.uid,
			role: checkTokenRes.role,
			permission: checkTokenRes.permission,
		}

		// 记录开始时间，用于性能分析
		this.startTime = Date.now()
	},

	/**
	 * 获取工地列表
	 * @param {String} keyword - 搜索关键词
	 * @returns {Object} 包含工地列表
	 */
	async getSiteList(params) {
		const { keyword = '' } = params
		const user_id = this.context.uid
		const sitesCollection = db.collection('sites')

		// 构建查询条件，添加用户ID限制
		let whereCondition = {
			user_id, // 添加用户ID筛选条件
		}
		if (keyword) {
			whereCondition.name = new RegExp(keyword, 'i')
		}

		console.log('查询条件:', whereCondition)

		// 查询数据，不再使用分页
		const list = await sitesCollection
			.where(whereCondition)
			.orderBy('createTime', 'desc')
			.get()
			.then(res => res.data)

		return {
			code: 0,
			message: '获取成功',
			data: {
				list,
			},
		}
	},

	/**
	 * 添加/修改工地基本信息
	 * @param {String} _id - 工地ID，有则修改，无则新增
	 * @param {String} name - 工地名称
	 * @param {String} address - 工地地址
	 * @param {String} remark - 备注
	 * @returns {Object} 保存后的工地信息
	 */
	async saveSite(params) {
		const { _id, name, address, remark } = params
		const user_id = this.context.uid

		// 参数校验
		if (!name) {
			return {
				code: -1,
				message: '工地名称不能为空',
			}
		}

		const sitesCollection = db.collection('sites')
		const now = new Date()

		// 新增或修改
		if (_id) {
			// 修改前检查是否为当前用户创建的数据
			const existingSite = await sitesCollection.doc(_id).get()
			if (!existingSite.data.length || existingSite.data[0].user_id !== user_id) {
				return {
					code: -1,
					message: '无权操作此数据',
				}
			}

			// 修改
			const updateData = {
				name,
				updateTime: now,
			}

			if (address !== undefined) updateData.address = address
			if (remark !== undefined) updateData.remark = remark

			await sitesCollection.doc(_id).update(updateData)

			// 查询更新后的完整数据
			const updatedData = await sitesCollection
				.doc(_id)
				.get()
				.then(res => res.data[0])

			return {
				code: 0,
				message: '更新成功',
				data: updatedData,
			}
		} else {
			// 新增
			const insertData = {
				name,
				user_id, // 添加用户ID
				createTime: now,
				updateTime: now,
			}

			if (address) insertData.address = address
			if (remark) insertData.remark = remark

			const insertResult = await sitesCollection.add(insertData)

			// 查询新增后的完整数据
			const newData = await sitesCollection
				.doc(insertResult.id)
				.get()
				.then(res => res.data[0])

			return {
				code: 0,
				message: '添加成功',
				data: newData,
			}
		}
	},

	/**
	 * 删除工地
	 * @param {String} siteId - 工地ID
	 * @returns {Object} 操作结果
	 */
	async deleteSite(params) {
		const { siteId } = params
		const user_id = this.context.uid

		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		// 事务操作
		const transaction = await db.startTransaction()
		try {
			// 检查工地是否存在且属于当前用户
			const siteInfo = await transaction
				.collection('sites')
				.doc(siteId)
				.get()
				.then(res => res.data[0])

			if (!siteInfo) {
				await transaction.rollback()
				return {
					code: -1,
					message: '工地不存在',
				}
			}

			if (siteInfo.user_id !== user_id) {
				await transaction.rollback()
				return {
					code: -1,
					message: '无权操作此数据',
				}
			}

			// 1. 检查工地是否关联有工人
			const workerCount = await transaction
				.collection('site_worker')
				.where({ siteId, user_id })
				.count()
				.then(res => res.total)

			if (workerCount > 0) {
				await transaction.rollback()
				return {
					code: -1,
					message: `该工地关联了${workerCount}名工人，请先移除关联关系再删除`,
				}
			}

			// 2. 检查工地是否有工时记录
			const workHourCount = await transaction
				.collection('work_hours')
				.where({ siteId, user_id })
				.count()
				.then(res => res.total)

			if (workHourCount > 0) {
				await transaction.rollback()
				return {
					code: -1,
					message: `该工地有${workHourCount}条工时记录，无法删除`,
				}
			}

			// 3. 删除工地
			await transaction.collection('sites').doc(siteId).remove()

			// 提交事务
			await transaction.commit()

			return {
				code: 0,
				message: '删除成功',
			}
		} catch (error) {
			await transaction.rollback()
			console.error('[deleteSite error]', error)
			return {
				code: -1,
				message: '删除失败：' + error.message,
			}
		}
	},

	/**
	 * 获取工地基本信息
	 * @param {String} siteId - 工地ID
	 * @returns {Object} 工地详细信息
	 */
	async getSiteDetail(params) {
		const { siteId } = params
		const user_id = this.context.uid

		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		const siteInfo = await db
			.collection('sites')
			.where({
				_id: siteId,
				user_id,
			})
			.get()
			.then(res => res.data[0])

		if (!siteInfo) {
			return {
				code: -1,
				message: '工地不存在或无权查看',
			}
		}

		return {
			code: 0,
			message: '获取成功',
			data: siteInfo,
		}
	},

	/**
	 * 获取工地工人列表
	 * @param {String} siteId - 工地ID
	 * @param {String} keyword - 搜索关键词
	 * @returns {Object} 包含工人列表
	 */
	async getSiteWorkers(params) {
		const { siteId, keyword = '' } = params
		const user_id = this.context.uid

		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		// 使用聚合查询关联工人信息
		const $ = db.command.aggregate
		const aggregateQuery = db
			.collection('site_worker')
			.aggregate()
			.match({ siteId, user_id }) // 添加用户ID限制
			.lookup({
				from: 'workers',
				localField: 'workerId',
				foreignField: '_id',
				as: 'workerInfo',
			})
			.unwind('$workerInfo')

		// 添加搜索条件
		if (keyword) {
			aggregateQuery.match({
				'workerInfo.name': new RegExp(keyword, 'i'),
			})
		}

		// 查询数据，不再使用分页
		const result = await aggregateQuery
			.sort({
				'workerInfo.createTime': -1,
			})
			.project({
				_id: '$workerInfo._id',
				name: '$workerInfo.name',
				phone: '$workerInfo.phone',
				remark: '$workerInfo.remark',
				createTime: '$workerInfo.createTime',
				updateTime: '$workerInfo.updateTime',
				relationId: '$_id',
			})
			.end()

		console.log('工地工人查询结果:', result.data.length)

		return {
			code: 0,
			message: '获取成功',
			data: {
				list: result.data,
			},
		}
	},

	/**
	 * 获取可以添加到工地的工人列表
	 * @param {String} siteId - 工地ID
	 * @param {String} keyword - 搜索关键词
	 * @returns {Object} 包含可添加的工人列表
	 */
	async getAvailableWorkers(params) {
		const { siteId, keyword = '' } = params
		const user_id = this.context.uid

		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		// 查询用户创建的、且已关联此工地的工人ID
		const relatedWorkerIds = await db
			.collection('site_worker')
			.where({ siteId, user_id }) // 添加用户ID限制
			.field({ workerId: true })
			.get()
			.then(res => res.data.map(item => item.workerId))

		// 构建查询条件
		let whereCondition = {
			user_id, // 添加用户ID限制
		}

		if (relatedWorkerIds.length > 0) {
			whereCondition._id = dbCmd.nin(relatedWorkerIds)
		}

		if (keyword) {
			whereCondition.name = new RegExp(keyword, 'i')
		}

		console.log('可添加工人查询条件:', whereCondition)

		// 查询数据，不再使用分页
		const list = await db
			.collection('workers')
			.where(whereCondition)
			.orderBy('createTime', 'desc')
			.get()
			.then(res => res.data)

		console.log('可添加工人数量:', list.length)

		return {
			code: 0,
			message: '获取成功',
			data: {
				list,
			},
		}
	},

	/**
	 * 批量添加工人到工地
	 * @param {String} siteId - 工地ID
	 * @param {String} workerId - 工人ID，多个ID用逗号分隔
	 * @returns {Object} 操作结果
	 */
	async addWorkersToSite(params) {
		const { siteId, workerId } = params
		const user_id = this.context.uid

		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		if (!workerId) {
			return {
				code: -1,
				message: '工人ID不能为空',
			}
		}

		// 转换为数组
		const workerIds = workerId.split(',')
		if (workerIds.length === 0) {
			return {
				code: -1,
				message: '工人ID格式错误',
			}
		}

		// 校验工地是否存在且属于当前用户
		const siteExists = await db
			.collection('sites')
			.where({
				_id: siteId,
				user_id,
			})
			.get()
			.then(res => res.data.length > 0)

		if (!siteExists) {
			return {
				code: -1,
				message: '工地不存在或无权操作',
			}
		}

		// 校验工人是否存在且属于当前用户
		const workersExist = await db
			.collection('workers')
			.where({
				_id: dbCmd.in(workerIds),
				user_id,
			})
			.get()
			.then(res => res.data)

		if (workersExist.length !== workerIds.length) {
			return {
				code: -1,
				message: '部分工人不存在或无权操作',
			}
		}

		// 批量添加关联
		const now = new Date()
		const existingRelations = await db
			.collection('site_worker')
			.where({
				siteId,
				workerId: dbCmd.in(workerIds),
				user_id,
			})
			.get()
			.then(res => res.data)

		const existingWorkerIds = existingRelations.map(item => item.workerId)
		const newWorkerIds = workerIds.filter(id => !existingWorkerIds.includes(id))

		if (newWorkerIds.length === 0) {
			return {
				code: -1,
				message: '所选工人已全部添加到该工地',
			}
		}

		// 批量插入新关联
		const insertData = newWorkerIds.map(workerId => ({
			siteId,
			workerId,
			user_id, // 添加用户ID
			createTime: now,
			updateTime: now,
		}))

		await db.collection('site_worker').add(insertData)

		return {
			code: 0,
			message: '添加成功',
			data: {
				successCount: newWorkerIds.length,
			},
		}
	},

	/**
	 * 从工地移除工人
	 * @param {String} siteId - 工地ID
	 * @param {String} workerId - 工人ID，多个ID用逗号分隔
	 * @returns {Object} 操作结果
	 */
	async removeWorkerFromSite(params) {
		const { siteId, workerId } = params
		const user_id = this.context.uid

		if (!siteId) {
			return {
				code: -1,
				message: '工地ID不能为空',
			}
		}

		if (!workerId) {
			return {
				code: -1,
				message: '工人ID不能为空',
			}
		}

		// 转换为数组
		const workerIds = workerId.split(',')
		if (workerIds.length === 0) {
			return {
				code: -1,
				message: '工人ID格式错误',
			}
		}

		// 查询要删除的关联记录，确保只能删除自己的数据
		const relationRecords = await db
			.collection('site_worker')
			.where({
				siteId,
				workerId: dbCmd.in(workerIds),
				user_id, // 添加用户ID限制
			})
			.get()
			.then(res => res.data)

		if (relationRecords.length === 0) {
			return {
				code: -1,
				message: '未找到指定的关联关系或无权操作',
			}
		}

		// 检查这些工人是否有工时记录
		for (const worker of relationRecords) {
			const workHourCount = await db
				.collection('work_hours')
				.where({
					siteId,
					workerId: worker.workerId,
					user_id,
				})
				.count()
				.then(res => res.total)

			if (workHourCount > 0) {
				return {
					code: -1,
					message: `工人ID为 ${worker.workerId} 的工人在该工地有工时记录，无法移除`,
				}
			}
		}

		// 删除关联关系
		const relationIds = relationRecords.map(item => item._id)
		await db
			.collection('site_worker')
			.where({
				_id: dbCmd.in(relationIds),
				user_id, // 添加用户ID限制
			})
			.remove()

		return {
			code: 0,
			message: '移除成功',
			data: {
				successCount: relationIds.length,
			},
		}
	},
}
